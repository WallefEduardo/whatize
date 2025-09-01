import { Request, Response } from "express";
import optimizedCache from "../libs/optimizedCache";
import RetryManager from "../utils/retryManager";
import CircuitBreakerManager from "../utils/circuitBreaker";
import cacheLayer from "../libs/cache";

/**
 * Health check para sistema de fotos otimizado
 */
export const profilePicHealth = async (req: Request, res: Response): Promise<Response> => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      service: "profile-pic-optimization",
      version: "1.0.0",
      status: "healthy",
      details: {
        optimizedCache: optimizedCache.getHealthInfo(),
        retryManager: RetryManager.getHealthInfo(),
        circuitBreakers: CircuitBreakerManager.getHealthInfo(),
        redis: {
          connected: true // TODO: Verificar conexão real
        }
      },
      performance: {
        cacheStats: optimizedCache.getStats(),
        retryStats: RetryManager.getStats()
      }
    };

    // Determina status geral
    const circuitBreakersHealthy = Object.values(health.details.circuitBreakers as any).every(
      (cb: any) => cb.isHealthy
    );
    
    const retryHealthy = (health.details.retryManager as any).isHealthy;
    const cacheHitRate = health.performance.cacheStats.hitRate;

    if (!circuitBreakersHealthy || !retryHealthy || cacheHitRate < 50) {
      health.status = "degraded";
    }

    const statusCode = health.status === "healthy" ? 200 : 503;
    
    return res.status(statusCode).json(health);
  } catch (error) {
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      service: "profile-pic-optimization",
      status: "error",
      error: error.message
    });
  }
};

/**
 * Reset de estatísticas (para debugging)
 */
export const resetStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    optimizedCache.resetStats();
    RetryManager.resetStats();
    CircuitBreakerManager.resetAll();

    return res.json({
      message: "Estatísticas resetadas com sucesso",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Informações detalhadas de performance
 */
export const performanceMetrics = async (req: Request, res: Response): Promise<Response> => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      cache: {
        optimized: optimizedCache.getStats(),
        health: optimizedCache.getHealthInfo()
      },
      retry: {
        stats: RetryManager.getStats(),
        health: RetryManager.getHealthInfo()
      },
      circuitBreakers: CircuitBreakerManager.getAllStats(),
      recommendations: []
    };

    // Adiciona recomendações baseadas nas métricas
    const recommendations: string[] = [];
    
    if (metrics.cache.optimized.hitRate < 70) {
      recommendations.push("Cache hit rate baixo - considere aumentar TTL ou pre-warming");
    }
    
    if (metrics.retry.stats.finalFailures / metrics.retry.stats.totalAttempts > 0.1) {
      recommendations.push("Taxa de falhas alta - verifique conectividade WhatsApp");
    }

    const circuitBreakersOpen = Object.values(metrics.circuitBreakers as any).filter(
      (cb: any) => cb.state === 'OPEN'
    ).length;
    
    if (circuitBreakersOpen > 0) {
      recommendations.push(`${circuitBreakersOpen} circuit breaker(s) aberto(s) - serviços indisponíveis`);
    }

    (metrics as any).recommendations = recommendations;

    return res.json(metrics);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};