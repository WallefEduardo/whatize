import NodeCache from "node-cache";
import cacheLayer from "./cache";
import logger from "../utils/logger";

// Cache em memória para acesso ultra-rápido (30 minutos TTL)
const memoryCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutos
  checkperiod: 600, // Verificar expiração a cada 10 minutos
  useClones: false // Performance otimizada
});

interface CacheStats {
  memoryHits: number;
  redisHits: number;
  misses: number;
  total: number;
}

class OptimizedCache {
  private stats: CacheStats = {
    memoryHits: 0,
    redisHits: 0,
    misses: 0,
    total: 0
  };

  /**
   * Busca em cache com estratégia em camadas
   * 1. Verifica memória (ultra-rápido)
   * 2. Verifica Redis (rápido)
   * 3. Retorna null se não encontrar
   */
  async get(key: string): Promise<string | null> {
    this.stats.total++;

    try {
      // Camada 1: Cache em memória
      const memoryResult = memoryCache.get<string>(key);
      if (memoryResult) {
        this.stats.memoryHits++;
        logger.debug(`💾 [OPTIMIZED-CACHE] Memory hit para ${key}`);
        return memoryResult;
      }

      // Camada 2: Cache Redis
      const redisResult = await cacheLayer.get(key);
      if (redisResult) {
        this.stats.redisHits++;
        // Adiciona ao cache em memória para próximas consultas
        memoryCache.set(key, redisResult);
        logger.debug(`🔴 [OPTIMIZED-CACHE] Redis hit para ${key}`);
        return redisResult;
      }

      this.stats.misses++;
      logger.debug(`❌ [OPTIMIZED-CACHE] Cache miss para ${key}`);
      return null;
    } catch (error) {
      logger.error(`[OPTIMIZED-CACHE] Erro ao buscar cache: ${error.message}`);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Salva em ambas as camadas de cache
   */
  async set(key: string, value: string, ttlSeconds: number = 432000): Promise<void> {
    try {
      // Salva em ambas as camadas
      await Promise.allSettled([
        // Redis com TTL customizado
        cacheLayer.set(key, value, "EX", ttlSeconds),
        // Memória com TTL menor (máximo 30min)
        Promise.resolve(memoryCache.set(key, value, Math.min(ttlSeconds, 1800)))
      ]);

      logger.debug(`💾 [OPTIMIZED-CACHE] Cached ${key} em ambas camadas`);
    } catch (error) {
      logger.error(`[OPTIMIZED-CACHE] Erro ao salvar cache: ${error.message}`);
    }
  }

  /**
   * Remove de ambas as camadas
   */
  async delete(key: string): Promise<void> {
    try {
      await Promise.allSettled([
        cacheLayer.del(key),
        Promise.resolve(memoryCache.del(key))
      ]);
      logger.debug(`🗑️ [OPTIMIZED-CACHE] Removido ${key} de ambas camadas`);
    } catch (error) {
      logger.error(`[OPTIMIZED-CACHE] Erro ao remover cache: ${error.message}`);
    }
  }

  /**
   * Limpa cache por padrão
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      // Limpa Redis por padrão
      await cacheLayer.delFromPattern(pattern);
      
      // Limpa memória por chave similar
      const memoryKeys = memoryCache.keys().filter(key => key.includes(pattern));
      memoryCache.del(memoryKeys);
      
      logger.info(`🧹 [OPTIMIZED-CACHE] Limpou padrão ${pattern}`);
    } catch (error) {
      logger.error(`[OPTIMIZED-CACHE] Erro ao limpar padrão: ${error.message}`);
    }
  }

  /**
   * Estatísticas de performance
   */
  getStats(): CacheStats & { hitRate: number; memoryHitRate: number } {
    const hitRate = this.stats.total > 0 ? 
      ((this.stats.memoryHits + this.stats.redisHits) / this.stats.total) * 100 : 0;
    
    const memoryHitRate = this.stats.total > 0 ? 
      (this.stats.memoryHits / this.stats.total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryHitRate: Math.round(memoryHitRate * 100) / 100
    };
  }

  /**
   * Reset das estatísticas
   */
  resetStats(): void {
    this.stats = { memoryHits: 0, redisHits: 0, misses: 0, total: 0 };
  }

  /**
   * Informações de saúde do cache
   */
  getHealthInfo(): object {
    return {
      memoryCache: {
        keys: memoryCache.keys().length,
        stats: memoryCache.getStats()
      },
      redis: {
        connected: true // TODO: Verificar conexão Redis
      },
      performance: this.getStats()
    };
  }
}

// Singleton para uso global
const optimizedCache = new OptimizedCache();

// Log de estatísticas a cada 10 minutos
setInterval(() => {
  const stats = optimizedCache.getStats();
  if (stats.total > 0) {
    logger.info(`📊 [OPTIMIZED-CACHE] Stats: ${JSON.stringify(stats)}`);
  }
}, 600000);

export default optimizedCache;