/**
 * Sistema de Logging Condicional para Debug
 * 
 * Este módulo permite logs de debug apenas em desenvolvimento,
 * mantendo a produção limpa e performática.
 */

class DebugLogger {
  private isDevelopment: boolean;
  private isDebugEnabled: boolean;

  constructor() {
    // Verifica se está em desenvolvimento
    this.isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
    
    // Permite forçar debug via variável de ambiente
    this.isDebugEnabled = this.isDevelopment || process.env.DEBUG_LOGS === 'true';
  }

  /**
   * Log de debug - só aparece em desenvolvimento
   */
  debug(...args: any[]) {
    if (this.isDebugEnabled) {
      console.log(...args);
    }
  }

  /**
   * Log de info - só aparece em desenvolvimento  
   */
  info(...args: any[]) {
    if (this.isDebugEnabled) {
      console.info(...args);
    }
  }

  /**
   * Log de erro - sempre aparece (produção precisa saber de erros)
   */
  error(...args: any[]) {
    console.error(...args);
  }

  /**
   * Log de warning - sempre aparece (produção precisa saber de warnings)
   */
  warn(...args: any[]) {
    console.warn(...args);
  }

  /**
   * Log específico para middleware de autenticação
   */
  auth(...args: any[]) {
    if (this.isDebugEnabled) {
      console.log('🔐 [DEBUG]', ...args);
    }
  }

  /**
   * Log específico para requisições HTTP
   */
  request(...args: any[]) {
    if (this.isDebugEnabled) {
      console.log('🌐 [DEBUG]', ...args);
    }
  }

  /**
   * Log específico para eventos do Baileys
   */
  baileys(...args: any[]) {
    if (this.isDebugEnabled) {
      console.debug('📡 BAILEYS EVENT:', ...args);
    }
  }

  /**
   * Log específico para operações de contato
   */
  contact(...args: any[]) {
    if (this.isDebugEnabled) {
      console.log('📝 CONTACT:', ...args);
    }
  }

  /**
   * Log específico para cache
   */
  cache(...args: any[]) {
    if (this.isDebugEnabled) {
      console.info('📊 Cache:', ...args);
    }
  }

  /**
   * Verifica se debug está habilitado
   */
  isDebugMode(): boolean {
    return this.isDebugEnabled;
  }

  /**
   * Força ativar/desativar debug em runtime
   */
  setDebugMode(enabled: boolean) {
    this.isDebugEnabled = enabled;
  }
}

// Instância singleton
const debugLogger = new DebugLogger();

export default debugLogger;

// Exportações nomeadas para conveniência
export const debug = debugLogger.debug.bind(debugLogger);
export const info = debugLogger.info.bind(debugLogger);
export const error = debugLogger.error.bind(debugLogger);
export const warn = debugLogger.warn.bind(debugLogger);
export const auth = debugLogger.auth.bind(debugLogger);
export const request = debugLogger.request.bind(debugLogger);
export const baileys = debugLogger.baileys.bind(debugLogger);
export const contact = debugLogger.contact.bind(debugLogger);
export const cache = debugLogger.cache.bind(debugLogger); 