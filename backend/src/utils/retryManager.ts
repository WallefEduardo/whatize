import logger from "./logger";

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number;
  retryCondition?: (error: any) => boolean;
}

interface RetryStats {
  totalAttempts: number;
  successOnRetry: number;
  finalFailures: number;
  averageAttempts: number;
}

class RetryManager {
  private static stats: RetryStats = {
    totalAttempts: 0,
    successOnRetry: 0,
    finalFailures: 0,
    averageAttempts: 0
  };

  /**
   * Executa função com retry automático e backoff exponencial
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context: string = "unknown"
  ): Promise<T> {
    const finalConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      jitterMs: 200,
      retryCondition: (error) => !this.isNonRetryableError(error),
      ...config
    };

    let lastError: any;
    let attemptCount = 0;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      attemptCount++;
      this.stats.totalAttempts++;

      try {
        const result = await fn();
        
        if (attempt > 1) {
          this.stats.successOnRetry++;
          logger.info(`✅ [RETRY-MANAGER] ${context} sucesso na tentativa ${attempt}/${finalConfig.maxAttempts}`);
        }
        
        this.updateAverageAttempts();
        return result;
      } catch (error) {
        lastError = error;
        
        // Verifica se deve continuar tentando
        if (attempt === finalConfig.maxAttempts || !finalConfig.retryCondition!(error)) {
          this.stats.finalFailures++;
          logger.error(`❌ [RETRY-MANAGER] ${context} falhou após ${attempt} tentativas: ${error.message}`);
          this.updateAverageAttempts();
          throw error;
        }

        // Calcula delay com backoff exponencial + jitter
        const baseDelay = Math.min(
          finalConfig.baseDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelayMs
        );
        
        const jitter = Math.random() * finalConfig.jitterMs;
        const totalDelay = baseDelay + jitter;

        logger.warn(`🔄 [RETRY-MANAGER] ${context} tentativa ${attempt} falhou, tentando novamente em ${Math.round(totalDelay)}ms: ${error.message}`);
        
        await this.sleep(totalDelay);
      }
    }

    throw lastError;
  }

  /**
   * Versão especializada para operações de rede/WhatsApp
   */
  static async executeWhatsAppOperation<T>(
    fn: () => Promise<T>,
    context: string = "whatsapp-operation"
  ): Promise<T> {
    return this.executeWithRetry(
      fn,
      {
        maxAttempts: 4,
        baseDelayMs: 2000,
        maxDelayMs: 15000,
        backoffMultiplier: 1.8,
        jitterMs: 500,
        retryCondition: (error) => this.isWhatsAppRetryableError(error)
      },
      context
    );
  }

  /**
   * Versão para operações rápidas
   */
  static async executeFastOperation<T>(
    fn: () => Promise<T>,
    context: string = "fast-operation"
  ): Promise<T> {
    return this.executeWithRetry(
      fn,
      {
        maxAttempts: 2,
        baseDelayMs: 200,
        maxDelayMs: 1000,
        backoffMultiplier: 3,
        jitterMs: 100
      },
      context
    );
  }

  /**
   * Verifica se erro é não-recuperável
   */
  private static isNonRetryableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || "";
    const code = error?.code;

    // Erros que não devem ser retried
    return (
      message.includes("unauthorized") ||
      message.includes("forbidden") ||
      message.includes("not found") ||
      message.includes("bad request") ||
      code === "ENOTFOUND" ||
      code === "ECONNREFUSED"
    );
  }

  /**
   * Verifica se erro do WhatsApp deve ser retried
   */
  private static isWhatsAppRetryableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || "";
    
    // Erros temporários que podem ser resolvidos com retry
    const retryableErrors = [
      "timeout",
      "network",
      "connection",
      "temporary",
      "rate limit",
      "server error",
      "internal error",
      "service unavailable",
      "too many requests"
    ];

    return retryableErrors.some(errorType => message.includes(errorType));
  }

  /**
   * Sleep com Promise
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Atualiza média de tentativas
   */
  private static updateAverageAttempts(): void {
    if (this.stats.totalAttempts > 0) {
      this.stats.averageAttempts = Number(
        ((this.stats.successOnRetry + this.stats.finalFailures) / this.stats.totalAttempts).toFixed(2)
      );
    }
  }

  /**
   * Estatísticas do retry system
   */
  static getStats(): RetryStats {
    return { ...this.stats };
  }

  /**
   * Reset das estatísticas
   */
  static resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successOnRetry: 0,
      finalFailures: 0,
      averageAttempts: 0
    };
  }

  /**
   * Health check do sistema de retry
   */
  static getHealthInfo(): object {
    const successRate = this.stats.totalAttempts > 0 
      ? ((this.stats.totalAttempts - this.stats.finalFailures) / this.stats.totalAttempts) * 100 
      : 100;

    return {
      stats: this.stats,
      successRate: Math.round(successRate * 100) / 100,
      isHealthy: successRate > 90
    };
  }
}

// Log de estatísticas periodicamente
setInterval(() => {
  const stats = RetryManager.getStats();
  if (stats.totalAttempts > 0) {
    logger.info(`📊 [RETRY-MANAGER] Stats: ${JSON.stringify(stats)}`);
  }
}, 600000); // A cada 10 minutos

export default RetryManager;