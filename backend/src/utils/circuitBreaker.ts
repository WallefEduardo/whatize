import logger from "./logger";

enum CircuitState {
  CLOSED = 'CLOSED',     // Funcionando normalmente
  OPEN = 'OPEN',         // Muitas falhas - rejeitando requests
  HALF_OPEN = 'HALF_OPEN' // Testando se voltou ao normal
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringPeriodMs: number;
  successThreshold: number; // Para sair do HALF_OPEN
}

interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  timesOpened: number;
}

class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private stats: CircuitBreakerStats;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: 5,        // 5 falhas consecutivas
      resetTimeoutMs: 60000,      // 1 minuto para tentar novamente
      monitoringPeriodMs: 300000, // 5 minutos de monitoramento
      successThreshold: 3,        // 3 sucessos para fechar circuito
      ...config
    };

    this.stats = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      timesOpened: 0
    };
  }

  /**
   * Executa função com circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.totalRequests++;

    // Se circuito está OPEN, rejeita imediatamente
    if (this.stats.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.stats.state = CircuitState.HALF_OPEN;
        logger.info(`🔄 [CIRCUIT-BREAKER] ${this.name} mudou para HALF_OPEN - testando recuperação`);
      } else {
        const error = new Error(`Circuit breaker OPEN para ${this.name}`);
        error.name = 'CircuitBreakerOpenError';
        throw error;
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Registra sucesso
   */
  private onSuccess(): void {
    this.stats.successCount++;
    this.stats.lastSuccessTime = Date.now();

    if (this.stats.state === CircuitState.HALF_OPEN) {
      if (this.stats.successCount >= this.config.successThreshold) {
        this.close();
      }
    } else if (this.stats.state === CircuitState.CLOSED) {
      // Reset contador de falhas em caso de sucesso
      this.stats.failureCount = Math.max(0, this.stats.failureCount - 1);
    }
  }

  /**
   * Registra falha
   */
  private onFailure(): void {
    this.stats.failureCount++;
    this.stats.lastFailureTime = Date.now();

    if (this.stats.state === CircuitState.HALF_OPEN) {
      // Se falha durante teste, volta para OPEN
      this.open();
    } else if (this.stats.state === CircuitState.CLOSED) {
      // Se muitas falhas, abre circuito
      if (this.stats.failureCount >= this.config.failureThreshold) {
        this.open();
      }
    }
  }

  /**
   * Abre o circuito
   */
  private open(): void {
    this.stats.state = CircuitState.OPEN;
    this.stats.timesOpened++;
    this.stats.successCount = 0; // Reset contador de sucessos
    
    logger.warn(`🚨 [CIRCUIT-BREAKER] ${this.name} ABERTO após ${this.stats.failureCount} falhas`);
  }

  /**
   * Fecha o circuito
   */
  private close(): void {
    this.stats.state = CircuitState.CLOSED;
    this.stats.failureCount = 0;
    this.stats.successCount = 0;
    
    logger.info(`✅ [CIRCUIT-BREAKER] ${this.name} FECHADO - serviço recuperado`);
  }

  /**
   * Verifica se deve tentar reset
   */
  private shouldAttemptReset(): boolean {
    const timeSinceLastFailure = Date.now() - this.stats.lastFailureTime;
    return timeSinceLastFailure >= this.config.resetTimeoutMs;
  }

  /**
   * Força abertura do circuito
   */
  forceOpen(): void {
    this.open();
    logger.warn(`🔧 [CIRCUIT-BREAKER] ${this.name} forçado para OPEN`);
  }

  /**
   * Força fechamento do circuito
   */
  forceClose(): void {
    this.close();
    logger.info(`🔧 [CIRCUIT-BREAKER] ${this.name} forçado para CLOSED`);
  }

  /**
   * Verifica se circuito está funcionando
   */
  isAvailable(): boolean {
    return this.stats.state !== CircuitState.OPEN || this.shouldAttemptReset();
  }

  /**
   * Estatísticas do circuit breaker
   */
  getStats(): CircuitBreakerStats & { successRate: number; uptime: number } {
    const successRate = this.stats.totalRequests > 0 
      ? ((this.stats.totalRequests - this.stats.failureCount) / this.stats.totalRequests) * 100 
      : 100;

    const uptime = this.stats.state === CircuitState.CLOSED ? 100 :
      this.stats.state === CircuitState.HALF_OPEN ? 50 : 0;

    return {
      ...this.stats,
      successRate: Math.round(successRate * 100) / 100,
      uptime
    };
  }

  /**
   * Reset estatísticas
   */
  reset(): void {
    this.stats = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      timesOpened: 0
    };
    
    logger.info(`🔄 [CIRCUIT-BREAKER] ${this.name} resetado`);
  }

  /**
   * Health check
   */
  getHealthInfo(): object {
    const stats = this.getStats();
    
    return {
      name: this.name,
      ...stats,
      isHealthy: stats.state === CircuitState.CLOSED && stats.successRate > 90,
      config: this.config
    };
  }
}

/**
 * Manager para múltiplos circuit breakers
 */
class CircuitBreakerManager {
  private static breakers = new Map<string, CircuitBreaker>();

  static getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  static getAllStats(): object {
    const stats: any = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  static getHealthInfo(): object {
    const health: any = {};
    this.breakers.forEach((breaker, name) => {
      health[name] = breaker.getHealthInfo();
    });
    return health;
  }

  static resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Log de estatísticas periodicamente
setInterval(() => {
  const stats = CircuitBreakerManager.getAllStats();
  if (Object.keys(stats).length > 0) {
    logger.info(`📊 [CIRCUIT-BREAKER] Stats: ${JSON.stringify(stats)}`);
  }
}, 600000); // A cada 10 minutos

export { CircuitBreaker, CircuitBreakerManager, CircuitState };
export default CircuitBreakerManager;