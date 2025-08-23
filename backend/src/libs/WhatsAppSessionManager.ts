import logger from "../utils/logger";
import Whatsapp from "../models/Whatsapp";
import { emitWhatsAppEvent } from "./WhatsAppEventBus";
import { performanceMonitor } from "./PerformanceMonitor";

// Estados bem definidos para prevenir inconsistências
export enum WhatsAppState {
  IDLE = 'IDLE',                    // Pronto para conectar
  CONNECTING = 'CONNECTING',        // Tentando conectar
  CONNECTED = 'CONNECTED',          // Conectado com sucesso
  DISCONNECTING = 'DISCONNECTING', // Desconectando
  FAILED = 'FAILED',               // Falha - pode tentar novamente
  BLOCKED = 'BLOCKED'              // Bloqueado - não tentar
}

// Circuit Breaker para retry inteligente
class ConnectionCircuitBreaker {
  private failures = new Map<number, number>();
  private lastFailure = new Map<number, number>();
  private readonly maxFailures = 5;
  private readonly baseBackoffMs = 1000;
  private readonly maxBackoffMs = 60000;

  async canAttempt(whatsappId: number): Promise<boolean> {
    const failures = this.failures.get(whatsappId) || 0;
    const lastFail = this.lastFailure.get(whatsappId) || 0;
    
    // Se excedeu max failures, bloquear por mais tempo
    if (failures >= this.maxFailures) {
      const blockTime = this.maxBackoffMs;
      const canRetry = Date.now() - lastFail > blockTime;
      
      if (canRetry) {
        logger.info(`🔓 [CIRCUIT-BREAKER] WhatsApp ${whatsappId} desbloqueado após ${blockTime}ms`);
        this.failures.delete(whatsappId);
        this.lastFailure.delete(whatsappId);
      }
      
      return canRetry;
    }
    
    // Backoff exponencial: 1s, 2s, 4s, 8s, 16s
    const backoffMs = Math.min(this.baseBackoffMs * Math.pow(2, failures), this.maxBackoffMs);
    const canRetry = Date.now() - lastFail > backoffMs;
    
    if (!canRetry) {
      logger.warn(`⏳ [CIRCUIT-BREAKER] WhatsApp ${whatsappId} em backoff: ${failures} falhas, aguardar ${backoffMs}ms`);
    }
    
    return canRetry;
  }
  
  recordSuccess(whatsappId: number) {
    const hadFailures = this.failures.has(whatsappId);
    this.failures.delete(whatsappId);
    this.lastFailure.delete(whatsappId);
    
    if (hadFailures) {
      logger.info(`✅ [CIRCUIT-BREAKER] WhatsApp ${whatsappId} recuperado - failures resetadas`);
    }
  }
  
  recordFailure(whatsappId: number, error: string) {
    const current = this.failures.get(whatsappId) || 0;
    const newCount = current + 1;
    
    this.failures.set(whatsappId, newCount);
    this.lastFailure.set(whatsappId, Date.now());
    
    logger.warn(`❌ [CIRCUIT-BREAKER] WhatsApp ${whatsappId} falha ${newCount}/${this.maxFailures}: ${error}`);
    
    if (newCount >= this.maxFailures) {
      logger.error(`🚫 [CIRCUIT-BREAKER] WhatsApp ${whatsappId} BLOQUEADO após ${newCount} falhas`);
    }
  }
  
  getFailureCount(whatsappId: number): number {
    return this.failures.get(whatsappId) || 0;
  }
  
  isBlocked(whatsappId: number): boolean {
    return (this.failures.get(whatsappId) || 0) >= this.maxFailures;
  }
}

// Resource Pool para controle de concorrência
class WhatsAppResourcePool {
  private activeConnections = new Set<number>();
  private connectionsByCompany = new Map<number, Set<number>>();
  private readonly maxConcurrentPerCompany = 5;
  private readonly maxGlobalConcurrent = 50;
  
  async acquireSlot(whatsappId: number, companyId: number): Promise<boolean> {
    // Verificar limite global
    if (this.activeConnections.size >= this.maxGlobalConcurrent) {
      logger.warn(`🚫 [RESOURCE-POOL] Limite global atingido: ${this.activeConnections.size}/${this.maxGlobalConcurrent}`);
      return false;
    }
    
    // Verificar limite por empresa
    const companyConnections = this.connectionsByCompany.get(companyId) || new Set();
    if (companyConnections.size >= this.maxConcurrentPerCompany) {
      logger.warn(`🚫 [RESOURCE-POOL] Limite da empresa ${companyId} atingido: ${companyConnections.size}/${this.maxConcurrentPerCompany}`);
      return false;
    }
    
    // Adquirir slot
    this.activeConnections.add(whatsappId);
    companyConnections.add(whatsappId);
    this.connectionsByCompany.set(companyId, companyConnections);
    
    logger.info(`🎯 [RESOURCE-POOL] Slot adquirido: WhatsApp ${whatsappId}, Empresa ${companyId} (${companyConnections.size}/${this.maxConcurrentPerCompany})`);
    return true;
  }
  
  releaseSlot(whatsappId: number, companyId: number) {
    this.activeConnections.delete(whatsappId);
    
    const companyConnections = this.connectionsByCompany.get(companyId);
    if (companyConnections) {
      companyConnections.delete(whatsappId);
      if (companyConnections.size === 0) {
        this.connectionsByCompany.delete(companyId);
      }
    }
    
    logger.info(`🔓 [RESOURCE-POOL] Slot liberado: WhatsApp ${whatsappId}, Empresa ${companyId}`);
  }
  
  isActive(whatsappId: number): boolean {
    return this.activeConnections.has(whatsappId);
  }
  
  getStats() {
    return {
      totalActive: this.activeConnections.size,
      maxGlobal: this.maxGlobalConcurrent,
      companies: Array.from(this.connectionsByCompany.entries()).map(([companyId, connections]) => ({
        companyId,
        active: connections.size,
        max: this.maxConcurrentPerCompany
      }))
    };
  }
}

// Session Manager principal - State Machine robusto
export class WhatsAppSessionManager {
  private states = new Map<number, WhatsAppState>();
  private locks = new Map<number, Promise<any>>();
  private circuitBreaker = new ConnectionCircuitBreaker();
  private resourcePool = new WhatsAppResourcePool();
  private readonly connectionTimeout = 15000; // 15s timeout

  private setState(whatsappId: number, state: WhatsAppState, companyId?: number) {
    const oldState = this.states.get(whatsappId) || WhatsAppState.IDLE;
    this.states.set(whatsappId, state);
    
    // State change log removed
    
    // Emitir evento para EventBus
    if (companyId && oldState !== state) {
      emitWhatsAppEvent('session:state_changed', {
        whatsappId,
        companyId,
        oldState,
        newState: state
      });
    }
  }
  
  getState(whatsappId: number): WhatsAppState {
    return this.states.get(whatsappId) || WhatsAppState.IDLE;
  }
  
  async canConnect(whatsappId: number, companyId: number): Promise<{ canConnect: boolean; reason?: string }> {
    const currentState = this.getState(whatsappId);
    
    // Verificar se já está conectando ou conectado
    if (currentState === WhatsAppState.CONNECTING) {
      return { canConnect: false, reason: 'ALREADY_CONNECTING' };
    }
    
    if (currentState === WhatsAppState.CONNECTED) {
      return { canConnect: false, reason: 'ALREADY_CONNECTED' };
    }
    
    // Verificar circuit breaker
    const canAttempt = await this.circuitBreaker.canAttempt(whatsappId);
    if (!canAttempt) {
      return { canConnect: false, reason: 'CIRCUIT_BREAKER_OPEN' };
    }
    
    // Verificar resource pool
    const hasSlot = await this.resourcePool.acquireSlot(whatsappId, companyId);
    if (!hasSlot) {
      return { canConnect: false, reason: 'RESOURCE_LIMIT_EXCEEDED' };
    }
    
    return { canConnect: true };
  }
  
  async connect(whatsappId: number, companyId: number): Promise<void> {
    // Emitir evento de solicitação
    emitWhatsAppEvent('connection:requested', {
      whatsappId,
      companyId,
      requester: 'session_manager'
    });

    const { canConnect, reason } = await this.canConnect(whatsappId, companyId);
    
    if (!canConnect) {
      if (reason === 'RESOURCE_LIMIT_EXCEEDED') {
        emitWhatsAppEvent('resource_pool:limit_exceeded', {
          whatsappId,
          companyId,
          type: 'company' // ou 'global' dependendo do caso
        });
      }
      throw new Error(`Cannot connect WhatsApp ${whatsappId}: ${reason}`);
    }
    
    // Se já existe uma promise de conexão, retornar ela
    const existingLock = this.locks.get(whatsappId);
    if (existingLock) {
      logger.info(`🔄 [SESSION-MANAGER] WhatsApp ${whatsappId} reutilizando promise de conexão existente`);
      return existingLock;
    }
    
    // Criar nova promise de conexão
    const connectPromise = this.doConnect(whatsappId, companyId);
    this.locks.set(whatsappId, connectPromise);
    
    try {
      await connectPromise;
    } finally {
      this.locks.delete(whatsappId);
    }
  }
  
  private async doConnect(whatsappId: number, companyId: number): Promise<void> {
    const startTime = Date.now();
    
    // 📊 MONITORAMENTO: Iniciar medição de performance
    performanceMonitor.startConnection(whatsappId);
    
    try {
      // Log removed
      this.setState(whatsappId, WhatsAppState.CONNECTING, companyId);
      
      // Emitir evento de início
      emitWhatsAppEvent('connection:started', { whatsappId, companyId });
      
      // Timeout para conexão
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('CONNECTION_TIMEOUT')), this.connectionTimeout);
      });
      
      // Importar e executar StartWhatsAppSession
      const { StartWhatsAppSession } = await import("../services/WbotServices/StartWhatsAppSession");
      const whatsapp = await Whatsapp.findByPk(whatsappId);
      
      if (!whatsapp) {
        throw new Error('WHATSAPP_NOT_FOUND');
      }
      
      // Race entre conexão e timeout
      await Promise.race([
        StartWhatsAppSession(whatsapp, companyId),
        timeoutPromise
      ]);
      
      // Sucesso
      this.setState(whatsappId, WhatsAppState.CONNECTED, companyId);
      this.circuitBreaker.recordSuccess(whatsappId);
      
      const duration = Date.now() - startTime;
      // Log removed
      
      // 📊 MONITORAMENTO: Registrar sucesso
      performanceMonitor.endConnection(whatsappId, true);
      
      // Emitir evento de sucesso
      emitWhatsAppEvent('connection:success', {
        whatsappId,
        companyId,
        phoneNumber: whatsapp.number || undefined,
        duration
      });
      
    } catch (error) {
      // Falha
      this.setState(whatsappId, WhatsAppState.FAILED, companyId);
      this.circuitBreaker.recordFailure(whatsappId, error.message);
      this.resourcePool.releaseSlot(whatsappId, companyId);
      
      const duration = Date.now() - startTime;
      logger.error(`❌ [SESSION-MANAGER] WhatsApp ${whatsappId} falhou em ${duration}ms: ${error.message}`);
      
      // 📊 MONITORAMENTO: Registrar falha
      performanceMonitor.endConnection(whatsappId, false);
      
      // Emitir evento de falha
      emitWhatsAppEvent('connection:failed', {
        whatsappId,
        companyId,
        error: error.message,
        duration
      });
      
      throw error;
    }
  }
  
  async disconnect(whatsappId: number, companyId: number): Promise<void> {
    const currentState = this.getState(whatsappId);
    
    if (currentState === WhatsAppState.IDLE || currentState === WhatsAppState.DISCONNECTING) {
      logger.info(`ℹ️ [SESSION-MANAGER] WhatsApp ${whatsappId} já está desconectado ou desconectando`);
      return;
    }
    
    // Emitir evento de solicitação de desconexão
    emitWhatsAppEvent('disconnection:requested', {
      whatsappId,
      companyId,
      requester: 'session_manager'
    });
    
    try {
      this.setState(whatsappId, WhatsAppState.DISCONNECTING, companyId);
      
      // Emitir evento de início
      emitWhatsAppEvent('disconnection:started', { whatsappId, companyId });
      
      // Importar e executar lógica de disconnect
      const { getWbot, cleanupWhatsAppSession } = await import("./wbot");
      
      try {
        const wbot = getWbot(whatsappId);
        wbot.logout();
        wbot.ws.close();
        
        // 🔧 FIX: SEMPRE limpar dados de autenticação após logout
        logger.info(`⚡ [SESSION-MANAGER] Logout iniciado para WhatsApp ${whatsappId} - forçando limpeza completa`);
        
        // Aguardar um pouco para garantir que o logout foi processado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // SEMPRE limpar cache de autenticação para permitir novo QR Code
        await cleanupWhatsAppSession(whatsappId, 'disconnect');
        
      } catch (error) {
        logger.warn(`⚠️ [SESSION-MANAGER] Erro ao logout WhatsApp ${whatsappId}: ${error.message}`);
        
        // Se logout falhou, fazer cleanup mais agressivo
        await cleanupWhatsAppSession(whatsappId, 'disconnect');
        await this.smartCleanup(whatsappId, 'logout_failed');
      }
      
      this.setState(whatsappId, WhatsAppState.IDLE, companyId);
      this.resourcePool.releaseSlot(whatsappId, companyId);
      
      // Emitir evento de sucesso
      emitWhatsAppEvent('disconnection:success', {
        whatsappId,
        companyId,
        reason: 'manual_disconnect'
      });
      
      logger.info(`✅ [SESSION-MANAGER] WhatsApp ${whatsappId} desconectado`);
      
    } catch (error) {
      this.setState(whatsappId, WhatsAppState.FAILED, companyId);
      
      // Cleanup específico em caso de erro
      await this.smartCleanup(whatsappId, 'disconnect_error');
      
      logger.error(`❌ [SESSION-MANAGER] Erro ao desconectar WhatsApp ${whatsappId}: ${error.message}`);
      throw error;
    }
  }
  
  // Método para atualizar estado quando conexão é detectada externamente
  markAsConnected(whatsappId: number) {
    this.setState(whatsappId, WhatsAppState.CONNECTED);
    this.circuitBreaker.recordSuccess(whatsappId);
  }
  
  // Método para atualizar estado quando desconexão é detectada externamente
  async markAsDisconnected(whatsappId: number, companyId: number, reason: string) {
    this.setState(whatsappId, WhatsAppState.IDLE, companyId);
    this.resourcePool.releaseSlot(whatsappId, companyId);
    
    // Se foi erro, registrar no circuit breaker E fazer cleanup
    if (reason !== 'INTENTIONAL_LOGOUT') {
      // ⚡ OTIMIZAÇÃO ESPECIAL: Connection Failure deve permitir retry imediato
      if (reason === 'ERROR_401' || reason.includes('Connection Failure')) {
        logger.warn(`🚀 [SESSION-MANAGER] Connection Failure detectado: WhatsApp ${whatsappId} - permitindo retry imediato`);
        
        // NÃO registrar no circuit breaker para Connection Failure
        // Isso permite retry imediato sem delay
        await this.smartCleanup(whatsappId, `connection_failure_${reason}`);
        
        // Emitir evento para frontend mostrar QR imediatamente
        emitWhatsAppEvent('connection:failed', {
          whatsappId,
          companyId,
          error: reason,
          duration: 0 // Failure imediato
        });
        
      } else {
        // Para outros erros, usar circuit breaker normal
        this.circuitBreaker.recordFailure(whatsappId, reason);
        await this.smartCleanup(whatsappId, `external_disconnect_${reason}`);
      }
      
      logger.warn(`⚠️ [SESSION-MANAGER] Desconexão por erro detectada: WhatsApp ${whatsappId} - ${reason}`);
    } else {
      logger.info(`✅ [SESSION-MANAGER] Logout intencional detectado: WhatsApp ${whatsappId}`);
    }
  }
  
  // Stats para monitoramento
  getStats() {
    const stateCount = new Map<WhatsAppState, number>();
    
    this.states.forEach(state => {
      stateCount.set(state, (stateCount.get(state) || 0) + 1);
    });
    
    return {
      states: Object.fromEntries(stateCount),
      activeLocks: this.locks.size,
      resourcePool: this.resourcePool.getStats(),
      circuitBreaker: {
        totalSessions: this.states.size,
        failedSessions: Array.from(this.states.entries())
          .filter(([id, state]) => state === WhatsAppState.FAILED || this.circuitBreaker.isBlocked(id))
          .length
      }
    };
  }
  
  // Cleanup inteligente - só quando necessário
  async smartCleanup(whatsappId?: number, reason?: string) {
    const now = Date.now();
    const maxAge = 300000; // 5 minutos
    
    logger.info(`🧹 [SMART-CLEANUP] Iniciando cleanup inteligente: ${reason || 'manual'} para WhatsApp ${whatsappId || 'all'}`);
    
    if (whatsappId) {
      // Cleanup específico para uma sessão
      return this.cleanupSpecificSession(whatsappId, reason || 'manual');
    }
    
    // Cleanup geral - só locks órfãos
    let cleanedLocks = 0;
    this.locks.forEach((promise, sessionId) => {
      const age = now - (promise as any).startTime || 0;
      if (age > maxAge) {
        logger.warn(`🧹 [SMART-CLEANUP] Removendo lock órfão: WhatsApp ${sessionId} (${Math.round(age/1000)}s)`);
        this.locks.delete(sessionId);
        this.setState(sessionId, WhatsAppState.FAILED);
        cleanedLocks++;
      }
    });
    
    if (cleanedLocks > 0) {
      logger.info(`🧹 [SMART-CLEANUP] Cleanup concluído: ${cleanedLocks} locks órfãos removidos`);
    } else {
      logger.info(`⚡ [SMART-CLEANUP] Sistema limpo - nenhuma ação necessária`);
    }
  }
  
  private async cleanupSpecificSession(whatsappId: number, reason: string) {
    const currentState = this.getState(whatsappId);
    const hasLock = this.locks.has(whatsappId);
    
    // Verificar se cleanup é necessário
    const wasNecessary = currentState !== WhatsAppState.IDLE || hasLock;
    
    // 📊 MONITORAMENTO: Registrar operação de cleanup
    performanceMonitor.recordCleanup(whatsappId, reason, wasNecessary);
    
    if (!wasNecessary) {
      logger.info(`⚡ [SMART-CLEANUP] WhatsApp ${whatsappId} já está limpo - pulando cleanup`);
      return;
    }
    
    logger.info(`🧹 [SMART-CLEANUP] Limpando WhatsApp ${whatsappId} - motivo: ${reason}`);
    
    // Remover lock se existir
    if (hasLock) {
      this.locks.delete(whatsappId);
      logger.info(`🧹 [SMART-CLEANUP] Lock removido para WhatsApp ${whatsappId}`);
    }
    
    // Atualizar estado se necessário
    if (currentState !== WhatsAppState.IDLE) {
      this.setState(whatsappId, WhatsAppState.IDLE);
      logger.info(`🧹 [SMART-CLEANUP] Estado resetado para IDLE: WhatsApp ${whatsappId}`);
    }
    
    logger.info(`✅ [SMART-CLEANUP] Cleanup específico concluído para WhatsApp ${whatsappId}`);
  }
  
  // Método para cleanup em app restart (só órfãos)
  async cleanupOnStartup() {
    logger.info(`🚀 [STARTUP-CLEANUP] Iniciando limpeza de sessões órfãs...`);
    
    const totalStates = this.states.size;
    const totalLocks = this.locks.size;
    
    // Reset todos os estados para IDLE no startup
    this.states.clear();
    this.locks.clear();
    
    logger.info(`✅ [STARTUP-CLEANUP] Limpeza concluída: ${totalStates} estados e ${totalLocks} locks removidos`);
  }
}

// Singleton instance
export const sessionManager = new WhatsAppSessionManager();

// ❌ REMOVIDO: Cleanup automático que causava demora nas conexões
// setInterval(() => sessionManager.cleanup(), 60000);
// 
// ✅ NOVO: Cleanup só acontece em eventos específicos:
// - Disconnect manual
// - Connection failure 
// - Session timeout
// - App restart

// ✅ STARTUP: Cleanup de sessões órfãos no início da aplicação
process.nextTick(async () => {
  await sessionManager.cleanupOnStartup();
});

// ✅ GRACEFUL SHUTDOWN: Cleanup ao fechar aplicação
process.on('SIGINT', async () => {
  logger.info('🛑 [SHUTDOWN] Iniciando cleanup de shutdown...');
  await sessionManager.smartCleanup(undefined, 'app_shutdown');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 [SHUTDOWN] Iniciando cleanup de shutdown...');
  await sessionManager.smartCleanup(undefined, 'app_shutdown');
  process.exit(0);
});