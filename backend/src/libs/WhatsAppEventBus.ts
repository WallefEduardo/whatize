import { EventEmitter } from "events";
import logger from "../utils/logger";
import { getIO } from "./socket";
import Whatsapp from "../models/Whatsapp";

// Tipos de eventos do sistema
export interface WhatsAppEvents {
  'connection:requested': { whatsappId: number; companyId: number; requester: string };
  'connection:started': { whatsappId: number; companyId: number };
  'connection:success': { whatsappId: number; companyId: number; phoneNumber?: string; duration: number };
  'connection:failed': { whatsappId: number; companyId: number; error: string; duration: number };
  'disconnection:requested': { whatsappId: number; companyId: number; requester: string };
  'disconnection:started': { whatsappId: number; companyId: number };
  'disconnection:success': { whatsappId: number; companyId: number; reason: string };
  'session:state_changed': { whatsappId: number; companyId: number; oldState: string; newState: string };
  'circuit_breaker:opened': { whatsappId: number; failureCount: number };
  'circuit_breaker:closed': { whatsappId: number };
  'resource_pool:limit_exceeded': { whatsappId: number; companyId: number; type: 'company' | 'global' };
}

// Event Bus centralizado
class WhatsAppEventBus extends EventEmitter {
  private metrics = {
    events: new Map<keyof WhatsAppEvents, number>(),
    errors: new Map<keyof WhatsAppEvents, number>()
  };

  constructor() {
    super();
    this.setMaxListeners(100); // Permitir muitos listeners
    this.setupDefaultListeners();
  }

  // Emit tipado
  emit<K extends keyof WhatsAppEvents>(event: K, data: WhatsAppEvents[K]): boolean {
    
    // Contar métrica
    const currentCount = this.metrics.events.get(event) || 0;
    this.metrics.events.set(event, currentCount + 1);

    return super.emit(event, data);
  }

  // On tipado
  on<K extends keyof WhatsAppEvents>(event: K, listener: (data: WhatsAppEvents[K]) => void): this {
    return super.on(event, listener);
  }

  // Once tipado
  once<K extends keyof WhatsAppEvents>(event: K, listener: (data: WhatsAppEvents[K]) => void): this {
    return super.once(event, listener);
  }

  private setupDefaultListeners() {
    // Listener para atualizar frontend via Socket.IO
    this.on('session:state_changed', async (data) => {
      try {
        const io = getIO();
        const whatsapp = await Whatsapp.findByPk(data.whatsappId);
        
        if (whatsapp) {
          // 🎯 FIX: Usar newState do SessionManager em vez do banco desatualizado
          const sessionWithCorrectState = {
            ...whatsapp.toJSON(),
            status: this.mapSessionManagerStateToWhatsAppStatus(data.newState)
          };
          
          // Log removido para reduzir ruído
          
          io.of(String(data.companyId))
            .emit(`company-${data.companyId}-whatsappSession`, {
              action: "update",
              session: sessionWithCorrectState
            });
        }
      } catch (error) {
        logger.error(`Erro ao atualizar frontend: ${error.message}`);
      }
    });

    // Listener para sucesso de conexão
    this.on('connection:success', async (data) => {
      try {
        const whatsapp = await Whatsapp.findByPk(data.whatsappId);
        if (whatsapp) {
          await whatsapp.update({
            status: "CONNECTED",
            qrcode: "",
            retries: 0,
            number: data.phoneNumber || whatsapp.number
          });

          // Log removido
        }
      } catch (error) {
        logger.error(`Erro ao atualizar DB após conexão: ${error.message}`);
      }
    });

    // Listener para falha de conexão
    this.on('connection:failed', async (data) => {
      try {
        const whatsapp = await Whatsapp.findByPk(data.whatsappId);
        if (whatsapp) {
          await whatsapp.update({
            status: "PENDING",
            session: "",
            qrcode: "",
            retries: (whatsapp.retries || 0) + 1
          });

          logger.error(`WhatsApp ${data.whatsappId} falhou em ${data.duration}ms: ${data.error}`);
        }
      } catch (error) {
        logger.error(`Erro ao atualizar DB após falha: ${error.message}`);
      }
    });

    // Listener para desconexão
    this.on('disconnection:success', async (data) => {
      try {
        const whatsapp = await Whatsapp.findByPk(data.whatsappId);
        if (whatsapp) {
          await whatsapp.update({
            status: "PENDING",
            session: "",
            qrcode: "",
            retries: 0
          });

          // Log removido
        }
      } catch (error) {
        logger.error(`Erro ao atualizar DB após desconexão: ${error.message}`);
      }
    });

    // Listener para circuit breaker
    this.on('circuit_breaker:opened', (data) => {
    });

    this.on('circuit_breaker:closed', (data) => {
    });

    // Listener para limite de recursos
    this.on('resource_pool:limit_exceeded', (data) => {
    });

    // Error handling para todos os listeners
    super.on('error', (error: Error) => {
      logger.error(`Erro no EventBus: ${error.message}`);
      
      // Contar erro
      const currentCount = this.metrics.errors.get('connection:failed') || 0;
      this.metrics.errors.set('connection:failed', currentCount + 1);
    });
  }

  // Métricas do EventBus
  getMetrics() {
    return {
      totalEvents: Array.from(this.metrics.events.values()).reduce((a, b) => a + b, 0),
      eventsByType: Object.fromEntries(this.metrics.events),
      totalErrors: Array.from(this.metrics.errors.values()).reduce((a, b) => a + b, 0),
      errorsByType: Object.fromEntries(this.metrics.errors),
      activeListeners: this.eventNames().length
    };
  }

  // Reset métricas (útil para testes)
  resetMetrics() {
    this.metrics.events.clear();
    this.metrics.errors.clear();
  }
  
  // 🗺️ Mapear estados do SessionManager para status do WhatsApp
  private mapSessionManagerStateToWhatsAppStatus(state: string): string {
    const { WhatsAppState } = require('./WhatsAppSessionManager');
    
    switch (state) {
      case WhatsAppState.IDLE:
        return "PENDING";
      case WhatsAppState.CONNECTING:
        return "OPENING";
      case WhatsAppState.CONNECTED:
        return "qrcode";  // 🎯 QR Code deve aparecer quando CONNECTED
      case WhatsAppState.DISCONNECTING:
        return "DISCONNECTED";
      case WhatsAppState.FAILED:
        return "PENDING";
      case WhatsAppState.BLOCKED:
        return "PENDING";
      default:
        return "PENDING";
    }
  }
}

// Singleton instance
export const eventBus = new WhatsAppEventBus();

// Método helper para emitir eventos de forma mais fácil
export const emitWhatsAppEvent = <K extends keyof WhatsAppEvents>(
  event: K, 
  data: WhatsAppEvents[K]
) => {
  return eventBus.emit(event, data);
};

// Método helper para escutar eventos
export const onWhatsAppEvent = <K extends keyof WhatsAppEvents>(
  event: K, 
  listener: (data: WhatsAppEvents[K]) => void
) => {
  return eventBus.on(event, listener);
};

export default eventBus;