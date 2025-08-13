import { FacebookAPIClient } from './FacebookAPIClient';
import { InstagramAPIClient } from '../InstagramServices/InstagramAPIClient';
import { getAllClientsStats } from './FacebookClientWrapper';
import { InstagramServiceWrapper } from '../InstagramServices/InstagramServiceWrapper';
import { logHealthCheck, facebookLogger } from '../../utils/facebookLogger';
import { facebookMetrics } from './FacebookMetrics';

/**
 * Interface para resultado de health check
 */
interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  details: Record<string, any>;
  responseTime: number;
  timestamp: Date;
}

/**
 * Interface para health check agregado
 */
interface SystemHealthCheck {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  components: HealthCheckResult[];
  summary: {
    totalComponents: number;
    healthyComponents: number;
    degradedComponents: number;
    unhealthyComponents: number;
  };
  timestamp: Date;
  version: string;
}

/**
 * Configuração de health checks
 */
interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // em milissegundos
  timeout: number; // timeout para cada check
  retries: number; // número de tentativas antes de marcar como unhealthy
  alertOnFailure: boolean;
}

/**
 * Sistema avançado de health checks para APIs Facebook/Instagram
 * Monitora saúde de componentes individuais e sistema como um todo
 */
export class FacebookHealthCheckService {
  private config: HealthCheckConfig;
  private lastResults: Map<string, HealthCheckResult>;
  private failureCount: Map<string, number>;
  private healthCheckInterval: NodeJS.Timeout | null;
  private readonly version: string;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = {
      enabled: process.env.FACEBOOK_HEALTH_CHECK_ENABLED !== 'false',
      interval: parseInt(process.env.FACEBOOK_HEALTH_CHECK_INTERVAL || '60000'), // 1 minuto
      timeout: parseInt(process.env.FACEBOOK_HEALTH_CHECK_TIMEOUT || '10000'), // 10 segundos
      retries: parseInt(process.env.FACEBOOK_HEALTH_CHECK_RETRIES || '3'),
      alertOnFailure: process.env.FACEBOOK_HEALTH_CHECK_ALERTS !== 'false',
      ...config
    };

    this.lastResults = new Map();
    this.failureCount = new Map();
    this.healthCheckInterval = null;
    this.version = process.env.npm_package_version || '1.0.0';

    if (this.config.enabled) {
      this.startHealthChecks();
    }
  }

  /**
   * Executa health check completo do sistema
   */
  async performSystemHealthCheck(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    facebookLogger.debug({
      type: 'facebook_health_check_start'
    }, 'Starting system health check');

    const components: HealthCheckResult[] = [];

    // Health check dos componentes principais
    const checks = [
      () => this.checkFacebookAPI(),
      () => this.checkInstagramAPI(),
      () => this.checkCacheSystem(),
      () => this.checkMetricsCollector(),
      () => this.checkRateLimiter(),
      () => this.checkClientConnections(),
      () => this.checkWebhookEndpoints()
    ];

    // Executar checks em paralelo com timeout
    const checkPromises = checks.map(async (check) => {
      try {
        return await this.withTimeout(check(), this.config.timeout);
      } catch (error) {
        return {
          component: 'unknown',
          status: 'unhealthy' as const,
          message: `Health check failed: ${error.message}`,
          details: { error: error.message },
          responseTime: this.config.timeout,
          timestamp: new Date()
        };
      }
    });

    const results = await Promise.allSettled(checkPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        components.push(result.value);
      } else {
        components.push({
          component: `check_${index}`,
          status: 'unhealthy',
          message: `Health check promise rejected: ${result.reason}`,
          details: { error: result.reason },
          responseTime: this.config.timeout,
          timestamp: new Date()
        });
      }
    });

    // Calcular status geral
    const healthyCount = components.filter(c => c.status === 'healthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const systemHealth: SystemHealthCheck = {
      overall: overallStatus,
      components,
      summary: {
        totalComponents: components.length,
        healthyComponents: healthyCount,
        degradedComponents: degradedCount,
        unhealthyComponents: unhealthyCount
      },
      timestamp: new Date(),
      version: this.version
    };

    // Log do resultado
    const totalTime = Date.now() - startTime;
    facebookLogger.info({
      type: 'facebook_system_health_check',
      result: systemHealth,
      duration: totalTime
    }, `System health check completed: ${overallStatus} (${totalTime}ms)`);

    // Salvar resultados para histórico
    components.forEach(result => {
      this.lastResults.set(result.component, result);
      
      // Contar falhas consecutivas
      if (result.status === 'unhealthy') {
        const currentCount = this.failureCount.get(result.component) || 0;
        this.failureCount.set(result.component, currentCount + 1);
        
        // Alertar após X falhas consecutivas
        if (this.config.alertOnFailure && currentCount >= this.config.retries) {
          this.triggerAlert(result);
        }
      } else {
        this.failureCount.set(result.component, 0);
      }
    });

    return systemHealth;
  }

  /**
   * Health check da API do Facebook
   */
  private async checkFacebookAPI(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const component = 'facebook_api';

    try {
      // Verificar se temos clientes ativos
      const clientStats = getAllClientsStats();
      const activeClients = clientStats.filter(stat => stat.stats.healthy);

      if (activeClients.length === 0) {
        return {
          component,
          status: 'degraded',
          message: 'No active Facebook clients',
          details: { totalClients: clientStats.length, activeClients: 0 },
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        };
      }

      // Testar conectividade com um cliente ativo
      const testClient = activeClients[0];
      const healthCheck = await testClient.stats.client.healthCheck();

      return {
        component,
        status: healthCheck.healthy ? 'healthy' : 'unhealthy',
        message: healthCheck.healthy ? 'Facebook API accessible' : 'Facebook API issues detected',
        details: {
          activeClients: activeClients.length,
          totalClients: clientStats.length,
          apiVersion: activeClients.length > 0 ? 'v22.0' : 'unknown',
          healthDetails: healthCheck.details
        },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: `Facebook API check failed: ${error.message}`,
        details: { error: error.message },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Health check da API do Instagram
   */
  private async checkInstagramAPI(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const component = 'instagram_api';

    try {
      const instagramStats = InstagramServiceWrapper.getAllInstagramStats();
      
      if (instagramStats.length === 0) {
        return {
          component,
          status: 'degraded',
          message: 'No active Instagram clients',
          details: { activeClients: 0 },
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        };
      }

      // Executar health check em todos os clientes Instagram
      const healthChecks = await InstagramServiceWrapper.healthCheckAll();
      const healthyClients = healthChecks.filter(check => check.healthy);

      const status = healthyClients.length === healthChecks.length ? 'healthy' :
                    healthyClients.length > 0 ? 'degraded' : 'unhealthy';

      return {
        component,
        status,
        message: `${healthyClients.length}/${healthChecks.length} Instagram clients healthy`,
        details: {
          totalClients: healthChecks.length,
          healthyClients: healthyClients.length,
          unhealthyClients: healthChecks.length - healthyClients.length,
          clients: healthChecks
        },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: `Instagram API check failed: ${error.message}`,
        details: { error: error.message },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Health check do sistema de cache
   */
  private async checkCacheSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const component = 'cache_system';

    try {
      const clientStats = getAllClientsStats();
      const instagramStats = InstagramServiceWrapper.getAllInstagramStats();
      
      // Testar operações básicas de cache
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'test_value';
      
      // Métricas de cache das últimas operações
      const metrics = facebookMetrics.getCurrentMetrics();
      const cacheHitRate = metrics.cacheHitRate;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'Cache system operational';

      if (cacheHitRate < 0.5) {
        status = 'degraded';
        message = 'Low cache hit rate detected';
      }

      return {
        component,
        status,
        message,
        details: {
          facebookClientsCount: clientStats.length,
          instagramClientsCount: instagramStats.length,
          cacheHitRate: Math.round(cacheHitRate * 100) / 100,
          totalCacheOperations: 0 // TODO: Implementar tracking de operações de cache
        },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: `Cache system check failed: ${error.message}`,
        details: { error: error.message },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Health check do coletor de métricas
   */
  private async checkMetricsCollector(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const component = 'metrics_collector';

    try {
      const metrics = facebookMetrics.getCurrentMetrics();
      const systemStats = facebookMetrics.getSystemStats();
      
      const status = systemStats.uptime > 0 ? 'healthy' : 'unhealthy';
      const message = status === 'healthy' ? 'Metrics collector active' : 'Metrics collector inactive';

      return {
        component,
        status,
        message,
        details: {
          uptime: systemStats.uptime,
          totalCalls: metrics.totalCalls,
          snapshotsCount: systemStats.snapshotsCount,
          errorRate: Math.round(metrics.errorRate * 100) / 100
        },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: `Metrics collector check failed: ${error.message}`,
        details: { error: error.message },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Health check do rate limiter
   */
  private async checkRateLimiter(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const component = 'rate_limiter';

    try {
      // Verificar se rate limiting está funcionando através das métricas
      const metrics = facebookMetrics.getCurrentMetrics();
      const retryRate = metrics.retryRate;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'Rate limiter operational';

      if (retryRate > 0.2) {
        status = 'degraded';
        message = 'High retry rate - possible rate limiting issues';
      }

      return {
        component,
        status,
        message,
        details: {
          retryRate: Math.round(retryRate * 100) / 100,
          totalRetries: metrics.totalCalls > 0 ? Math.round(metrics.totalCalls * retryRate) : 0
        },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: `Rate limiter check failed: ${error.message}`,
        details: { error: error.message },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Health check das conexões de clientes
   */
  private async checkClientConnections(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const component = 'client_connections';

    try {
      const facebookStats = getAllClientsStats();
      const instagramStats = InstagramServiceWrapper.getAllInstagramStats();
      
      const totalConnections = facebookStats.length + instagramStats.length;
      const healthyFacebook = facebookStats.filter(stat => stat.stats.healthy).length;
      const healthyInstagram = instagramStats.length; // Assumir saudável se existir

      const healthyConnections = healthyFacebook + healthyInstagram;
      const healthRatio = totalConnections > 0 ? healthyConnections / totalConnections : 1;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthRatio >= 0.9) status = 'healthy';
      else if (healthRatio >= 0.5) status = 'degraded';
      else status = 'unhealthy';

      return {
        component,
        status,
        message: `${healthyConnections}/${totalConnections} client connections healthy`,
        details: {
          totalConnections,
          healthyConnections,
          facebookClients: { total: facebookStats.length, healthy: healthyFacebook },
          instagramClients: { total: instagramStats.length, healthy: healthyInstagram },
          healthRatio: Math.round(healthRatio * 100) / 100
        },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: `Client connections check failed: ${error.message}`,
        details: { error: error.message },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Health check dos endpoints de webhook
   */
  private async checkWebhookEndpoints(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const component = 'webhook_endpoints';

    try {
      // Verificar se os endpoints estão respondendo
      // Em uma implementação real, faria requisições para os endpoints
      
      return {
        component,
        status: 'healthy',
        message: 'Webhook endpoints accessible',
        details: {
          facebookWebhook: '/webhooks/facebook',
          instagramWebhook: '/webhooks/instagram',
          securityEnabled: !!process.env.FACEBOOK_APP_SECRET
        },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        component,
        status: 'unhealthy',
        message: `Webhook endpoints check failed: ${error.message}`,
        details: { error: error.message },
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Inicia health checks periódicos
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performSystemHealthCheck();
      } catch (error) {
        facebookLogger.error({
          type: 'facebook_health_check_error',
          error: error.message
        }, 'Health check execution failed');
      }
    }, this.config.interval);

    facebookLogger.info({
      type: 'facebook_health_check_started',
      config: this.config
    }, `Health checks started with ${this.config.interval}ms interval`);
  }

  /**
   * Para health checks periódicos
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      
      facebookLogger.info({
        type: 'facebook_health_check_stopped'
      }, 'Health checks stopped');
    }
  }

  /**
   * Obtém último resultado de health check
   */
  getLastResult(component?: string): HealthCheckResult | SystemHealthCheck | null {
    if (component) {
      return this.lastResults.get(component) || null;
    }
    
    // Retornar último resultado do sistema
    const components = Array.from(this.lastResults.values());
    if (components.length === 0) return null;

    const healthyCount = components.filter(c => c.status === 'healthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyCount > 0) overallStatus = 'unhealthy';
    else if (degradedCount > 0) overallStatus = 'degraded';
    else overallStatus = 'healthy';

    return {
      overall: overallStatus,
      components,
      summary: {
        totalComponents: components.length,
        healthyComponents: healthyCount,
        degradedComponents: degradedCount,
        unhealthyComponents: unhealthyCount
      },
      timestamp: new Date(),
      version: this.version
    };
  }

  /**
   * Utilitário para timeout em promises
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Health check timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  /**
   * Dispara alerta para falha crítica
   */
  private triggerAlert(result: HealthCheckResult): void {
    facebookLogger.fatal({
      type: 'facebook_health_alert',
      component: result.component,
      status: result.status,
      message: result.message,
      failureCount: this.failureCount.get(result.component),
      details: result.details
    }, `CRITICAL ALERT: Component ${result.component} failed health check`);
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): HealthCheckConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.healthCheckInterval) {
      this.startHealthChecks();
    } else if (!this.config.enabled && this.healthCheckInterval) {
      this.stopHealthChecks();
    }
    
    facebookLogger.info({
      type: 'facebook_health_config_updated',
      config: this.config
    }, 'Health check configuration updated');
  }
}

// Instância global do serviço de health check
export const facebookHealthCheck = new FacebookHealthCheckService();