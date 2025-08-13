import { facebookLogger, logMetrics } from '../../utils/facebookLogger';

/**
 * Interface para métricas de API
 */
interface APIMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
  retryAttempts: number;
  errorsByCode: Map<number, number>;
  callsByEndpoint: Map<string, number>;
  callsByCompany: Map<number, number>;
  lastResetTime: Date;
}

/**
 * Interface para snapshot de métricas
 */
interface MetricsSnapshot {
  timestamp: Date;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  cacheHitRate: number;
  retryRate: number;
  errorRate: number;
  topErrors: Array<{ code: number; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  topCompanies: Array<{ companyId: number; count: number }>;
}

/**
 * Interface para alertas baseados em métricas
 */
interface MetricsAlert {
  type: 'error_rate' | 'response_time' | 'rate_limit' | 'cache_performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  currentValue: number;
  message: string;
  companyId?: number;
  timestamp: Date;
}

/**
 * Coletor e agregador de métricas para APIs do Facebook/Instagram
 * Implementa coleta em tempo real com agregação eficiente
 */
export class FacebookMetricsCollector {
  private metrics: APIMetrics;
  private alertThresholds: Map<string, number>;
  private snapshots: MetricsSnapshot[];
  private maxSnapshots: number;
  private aggregationInterval: NodeJS.Timeout | null;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.alertThresholds = new Map([
      ['error_rate', 0.05], // 5% de erro
      ['response_time', 5000], // 5 segundos
      ['cache_hit_rate', 0.8], // 80% de cache hit
      ['retry_rate', 0.1] // 10% de retry
    ]);
    this.snapshots = [];
    this.maxSnapshots = 288; // 24 horas com snapshots de 5 minutos
    this.aggregationInterval = null;

    this.startAggregation();
  }

  /**
   * Inicializa estrutura de métricas
   */
  private initializeMetrics(): APIMetrics {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      retryAttempts: 0,
      errorsByCode: new Map(),
      callsByEndpoint: new Map(),
      callsByCompany: new Map(),
      lastResetTime: new Date()
    };
  }

  /**
   * Registra chamada de API bem-sucedida
   */
  recordAPICall(
    endpoint: string,
    responseTime: number,
    companyId: number,
    fromCache: boolean = false
  ): void {
    this.metrics.totalCalls++;
    this.metrics.successfulCalls++;
    this.metrics.totalResponseTime += responseTime;

    // Cache metrics
    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Endpoint tracking
    const currentEndpointCount = this.metrics.callsByEndpoint.get(endpoint) || 0;
    this.metrics.callsByEndpoint.set(endpoint, currentEndpointCount + 1);

    // Company tracking
    const currentCompanyCount = this.metrics.callsByCompany.get(companyId) || 0;
    this.metrics.callsByCompany.set(companyId, currentCompanyCount + 1);

    this.checkAlerts(companyId);
  }

  /**
   * Registra chamada de API com erro
   */
  recordAPIError(
    endpoint: string,
    errorCode: number,
    responseTime: number,
    companyId: number
  ): void {
    this.metrics.totalCalls++;
    this.metrics.failedCalls++;
    this.metrics.totalResponseTime += responseTime;

    // Error code tracking
    const currentErrorCount = this.metrics.errorsByCode.get(errorCode) || 0;
    this.metrics.errorsByCode.set(errorCode, currentErrorCount + 1);

    // Endpoint tracking
    const currentEndpointCount = this.metrics.callsByEndpoint.get(endpoint) || 0;
    this.metrics.callsByEndpoint.set(endpoint, currentEndpointCount + 1);

    // Company tracking
    const currentCompanyCount = this.metrics.callsByCompany.get(companyId) || 0;
    this.metrics.callsByCompany.set(companyId, currentCompanyCount + 1);

    this.checkAlerts(companyId);
  }

  /**
   * Registra tentativa de retry
   */
  recordRetry(endpoint: string, companyId: number): void {
    this.metrics.retryAttempts++;
    this.checkAlerts(companyId);
  }

  /**
   * Registra evento de cache
   */
  recordCacheEvent(event: 'hit' | 'miss'): void {
    if (event === 'hit') {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Calcula métricas atuais
   */
  getCurrentMetrics(): MetricsSnapshot {
    const totalCalls = this.metrics.totalCalls;
    const averageResponseTime = totalCalls > 0 ? this.metrics.totalResponseTime / totalCalls : 0;
    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0 
      ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) 
      : 0;
    const retryRate = totalCalls > 0 ? this.metrics.retryAttempts / totalCalls : 0;
    const errorRate = totalCalls > 0 ? this.metrics.failedCalls / totalCalls : 0;

    // Top errors
    const topErrors = Array.from(this.metrics.errorsByCode.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));

    // Top endpoints
    const topEndpoints = Array.from(this.metrics.callsByEndpoint.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Top companies
    const topCompanies = Array.from(this.metrics.callsByCompany.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([companyId, count]) => ({ companyId, count }));

    return {
      timestamp: new Date(),
      totalCalls,
      successfulCalls: this.metrics.successfulCalls,
      failedCalls: this.metrics.failedCalls,
      averageResponseTime,
      cacheHitRate,
      retryRate,
      errorRate,
      topErrors,
      topEndpoints,
      topCompanies
    };
  }

  /**
   * Obtém snapshot de métricas por período
   */
  getMetricsForPeriod(hours: number = 1): MetricsSnapshot[] {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.snapshots.filter(snapshot => snapshot.timestamp >= cutoffTime);
  }

  /**
   * Obtém métricas por empresa
   */
  getCompanyMetrics(companyId: number): {
    totalCalls: number;
    successRate: number;
    averageResponseTime: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  } {
    const totalCalls = this.metrics.callsByCompany.get(companyId) || 0;
    
    // Para simplificar, retornamos métricas globais proporcionais
    // Em uma implementação mais avançada, manteria métricas separadas por empresa
    const globalMetrics = this.getCurrentMetrics();
    const companyProportion = totalCalls / Math.max(globalMetrics.totalCalls, 1);

    return {
      totalCalls,
      successRate: globalMetrics.successfulCalls / Math.max(globalMetrics.totalCalls, 1),
      averageResponseTime: globalMetrics.averageResponseTime,
      topEndpoints: globalMetrics.topEndpoints.slice(0, 5)
    };
  }

  /**
   * Verifica alertas baseados nas métricas atuais
   */
  private checkAlerts(companyId: number): void {
    const metrics = this.getCurrentMetrics();
    const alerts: MetricsAlert[] = [];

    // Alerta de taxa de erro
    if (metrics.errorRate > this.alertThresholds.get('error_rate')!) {
      alerts.push({
        type: 'error_rate',
        severity: metrics.errorRate > 0.1 ? 'critical' : 'high',
        threshold: this.alertThresholds.get('error_rate')!,
        currentValue: metrics.errorRate,
        message: `Taxa de erro elevada: ${(metrics.errorRate * 100).toFixed(1)}%`,
        companyId,
        timestamp: new Date()
      });
    }

    // Alerta de tempo de resposta
    if (metrics.averageResponseTime > this.alertThresholds.get('response_time')!) {
      alerts.push({
        type: 'response_time',
        severity: metrics.averageResponseTime > 10000 ? 'critical' : 'medium',
        threshold: this.alertThresholds.get('response_time')!,
        currentValue: metrics.averageResponseTime,
        message: `Tempo de resposta elevado: ${metrics.averageResponseTime.toFixed(0)}ms`,
        companyId,
        timestamp: new Date()
      });
    }

    // Alerta de performance do cache
    if (metrics.cacheHitRate < this.alertThresholds.get('cache_hit_rate')!) {
      alerts.push({
        type: 'cache_performance',
        severity: metrics.cacheHitRate < 0.5 ? 'high' : 'medium',
        threshold: this.alertThresholds.get('cache_hit_rate')!,
        currentValue: metrics.cacheHitRate,
        message: `Taxa de cache hit baixa: ${(metrics.cacheHitRate * 100).toFixed(1)}%`,
        companyId,
        timestamp: new Date()
      });
    }

    // Alerta de taxa de retry
    if (metrics.retryRate > this.alertThresholds.get('retry_rate')!) {
      alerts.push({
        type: 'rate_limit',
        severity: metrics.retryRate > 0.2 ? 'high' : 'medium',
        threshold: this.alertThresholds.get('retry_rate')!,
        currentValue: metrics.retryRate,
        message: `Taxa de retry elevada: ${(metrics.retryRate * 100).toFixed(1)}%`,
        companyId,
        timestamp: new Date()
      });
    }

    // Log dos alertas
    alerts.forEach(alert => {
      facebookLogger.warn({
        type: 'facebook_metrics_alert',
        alert
      }, `ALERT: ${alert.message}`);
    });
  }

  /**
   * Inicia agregação periódica de métricas
   */
  private startAggregation(): void {
    // Agregação a cada 5 minutos
    this.aggregationInterval = setInterval(() => {
      const snapshot = this.getCurrentMetrics();
      
      // Adicionar snapshot
      this.snapshots.push(snapshot);
      
      // Limitar número de snapshots
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots = this.snapshots.slice(-this.maxSnapshots);
      }

      // Log das métricas
      logMetrics('5min', {
        totalCalls: snapshot.totalCalls,
        successfulCalls: snapshot.successfulCalls,
        failedCalls: snapshot.failedCalls,
        averageResponseTime: snapshot.averageResponseTime,
        cacheHitRate: snapshot.cacheHitRate,
        retryRate: snapshot.retryRate,
        errorRate: snapshot.errorRate
      });

      // Reset métricas para próximo período
      this.resetMetrics();
      
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Para agregação periódica
   */
  stopAggregation(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }
  }

  /**
   * Reset das métricas para novo período
   */
  private resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Configura threshold de alerta
   */
  setAlertThreshold(metric: string, threshold: number): void {
    this.alertThresholds.set(metric, threshold);
    facebookLogger.info({
      type: 'facebook_metrics_config',
      metric,
      threshold
    }, `Alert threshold updated: ${metric} = ${threshold}`);
  }

  /**
   * Obtém estatísticas de sistema
   */
  getSystemStats(): {
    uptime: number;
    snapshotsCount: number;
    oldestSnapshot: Date | null;
    newestSnapshot: Date | null;
    alertThresholds: Record<string, number>;
  } {
    return {
      uptime: Date.now() - this.metrics.lastResetTime.getTime(),
      snapshotsCount: this.snapshots.length,
      oldestSnapshot: this.snapshots.length > 0 ? this.snapshots[0].timestamp : null,
      newestSnapshot: this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1].timestamp : null,
      alertThresholds: Object.fromEntries(this.alertThresholds)
    };
  }

  /**
   * Exporta métricas para análise externa
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      current: this.getCurrentMetrics(),
      snapshots: this.snapshots,
      system: this.getSystemStats()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Implementação simples de CSV para snapshots
      const headers = ['timestamp', 'totalCalls', 'successfulCalls', 'failedCalls', 'averageResponseTime', 'cacheHitRate', 'retryRate', 'errorRate'];
      const rows = this.snapshots.map(snapshot => [
        snapshot.timestamp.toISOString(),
        snapshot.totalCalls,
        snapshot.successfulCalls,
        snapshot.failedCalls,
        snapshot.averageResponseTime.toFixed(2),
        (snapshot.cacheHitRate * 100).toFixed(2),
        (snapshot.retryRate * 100).toFixed(2),
        (snapshot.errorRate * 100).toFixed(2)
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
  }
}

// Instância global do coletor de métricas
export const facebookMetrics = new FacebookMetricsCollector();