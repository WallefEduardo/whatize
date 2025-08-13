import { facebookLogger } from '../../utils/facebookLogger';
import { facebookMetrics } from './FacebookMetrics';
import { facebookAlertSystem } from './FacebookAlertSystem';

/**
 * Interface para dados de telemetria
 */
interface TelemetryEvent {
  eventType: string;
  timestamp: Date;
  companyId: number;
  userId?: number;
  data: Record<string, any>;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Interface para estatísticas agregadas
 */
interface AggregatedStats {
  timeframe: 'hour' | 'day' | 'week' | 'month';
  period: string; // ISO date string
  companies: Map<number, CompanyStats>;
  global: GlobalStats;
}

/**
 * Estatísticas por empresa
 */
interface CompanyStats {
  companyId: number;
  totalAPICalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalUsers: number;
  activeUsers: number;
  messagesSent: number;
  messagesReceived: number;
  errorsByType: Map<string, number>;
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  cacheHitRate: number;
  quotaUsage: number;
  webhookEvents: number;
  connectedClients: {
    facebook: number;
    instagram: number;
  };
}

/**
 * Estatísticas globais
 */
interface GlobalStats {
  totalCompanies: number;
  totalAPICalls: number;
  globalErrorRate: number;
  averageResponseTime: number;
  systemUptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  alertsTriggered: number;
  alertsResolved: number;
}

/**
 * Interface para configuração de telemetria
 */
interface TelemetryConfig {
  enabled: boolean;
  samplingRate: number; // 0.0 a 1.0
  retentionDays: number;
  aggregationInterval: number; // em milissegundos
  exportEnabled: boolean;
  exportInterval: number; // em milissegundos
  anonymizeData: boolean;
}

/**
 * Sistema de telemetria para APIs Facebook/Instagram
 * Coleta, agrega e exporta dados de uso e performance
 */
export class FacebookTelemetryService {
  private config: TelemetryConfig;
  private events: TelemetryEvent[];
  private aggregatedStats: Map<string, AggregatedStats>;
  private maxEvents: number;
  private aggregationTimer: NodeJS.Timeout | null;
  private exportTimer: NodeJS.Timeout | null;
  private responseTimeBuffer: number[];
  private sessionTracking: Map<string, { startTime: Date; lastActivity: Date; events: number }>;

  constructor() {
    this.config = this.loadConfiguration();
    this.events = [];
    this.aggregatedStats = new Map();
    this.maxEvents = 10000; // Limite de eventos em memória
    this.aggregationTimer = null;
    this.exportTimer = null;
    this.responseTimeBuffer = [];
    this.sessionTracking = new Map();

    if (this.config.enabled) {
      this.startAggregation();
      if (this.config.exportEnabled) {
        this.startExport();
      }
    }
  }

  /**
   * Carrega configuração de telemetria
   */
  private loadConfiguration(): TelemetryConfig {
    return {
      enabled: process.env.FACEBOOK_TELEMETRY_ENABLED !== 'false',
      samplingRate: parseFloat(process.env.FACEBOOK_TELEMETRY_SAMPLING_RATE || '1.0'),
      retentionDays: parseInt(process.env.FACEBOOK_TELEMETRY_RETENTION_DAYS || '30'),
      aggregationInterval: parseInt(process.env.FACEBOOK_TELEMETRY_AGGREGATION_INTERVAL || '300000'), // 5 minutos
      exportEnabled: process.env.FACEBOOK_TELEMETRY_EXPORT_ENABLED === 'true',
      exportInterval: parseInt(process.env.FACEBOOK_TELEMETRY_EXPORT_INTERVAL || '3600000'), // 1 hora
      anonymizeData: process.env.FACEBOOK_TELEMETRY_ANONYMIZE === 'true'
    };
  }

  /**
   * Registra evento de telemetria
   */
  trackEvent(
    eventType: string,
    companyId: number,
    data: Record<string, any>,
    userId?: number,
    sessionId?: string,
    userAgent?: string,
    ip?: string
  ): void {
    if (!this.config.enabled) {
      return;
    }

    // Sampling rate
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    // Anonimizar dados se necessário
    if (this.config.anonymizeData) {
      data = this.anonymizeEventData(data);
      ip = ip ? this.hashIP(ip) : undefined;
    }

    const event: TelemetryEvent = {
      eventType,
      timestamp: new Date(),
      companyId,
      userId,
      data,
      sessionId,
      userAgent,
      ip
    };

    this.events.push(event);

    // Tracking de sessão
    if (sessionId) {
      this.updateSessionTracking(sessionId, event);
    }

    // Limitar número de eventos em memória
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents * 0.8); // Remove 20% dos mais antigos
    }

    facebookLogger.debug({
      type: 'facebook_telemetry_event',
      eventType,
      companyId,
      sessionId
    }, `Telemetry event: ${eventType}`);
  }

  /**
   * Registra chamada de API
   */
  trackAPICall(
    endpoint: string,
    method: string,
    status: number,
    responseTime: number,
    companyId: number,
    userId?: number,
    fromCache: boolean = false
  ): void {
    this.trackEvent('api_call', companyId, {
      endpoint,
      method,
      status,
      responseTime,
      fromCache,
      success: status >= 200 && status < 400
    }, userId);

    // Adicionar ao buffer de response time para percentis
    this.responseTimeBuffer.push(responseTime);
    if (this.responseTimeBuffer.length > 1000) {
      this.responseTimeBuffer = this.responseTimeBuffer.slice(-500);
    }
  }

  /**
   * Registra erro de API
   */
  trackAPIError(
    endpoint: string,
    errorCode: number,
    errorType: string,
    companyId: number,
    userId?: number,
    retryAttempt?: number
  ): void {
    this.trackEvent('api_error', companyId, {
      endpoint,
      errorCode,
      errorType,
      retryAttempt: retryAttempt || 0,
      severity: this.getErrorSeverity(errorCode)
    }, userId);
  }

  /**
   * Registra evento de webhook
   */
  trackWebhookEvent(
    source: 'facebook' | 'instagram',
    eventType: string,
    companyId: number,
    processingTime: number,
    verified: boolean,
    payloadSize?: number
  ): void {
    this.trackEvent('webhook_received', companyId, {
      source,
      eventType,
      processingTime,
      verified,
      payloadSize: payloadSize || 0
    });
  }

  /**
   * Registra atividade do usuário
   */
  trackUserActivity(
    action: string,
    companyId: number,
    userId: number,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): void {
    this.trackEvent('user_activity', companyId, {
      action,
      ...metadata
    }, userId, sessionId);
  }

  /**
   * Registra envio de mensagem
   */
  trackMessageSent(
    platform: 'facebook' | 'instagram',
    messageType: 'text' | 'image' | 'video' | 'audio' | 'file',
    companyId: number,
    success: boolean,
    responseTime: number,
    messageSize?: number
  ): void {
    this.trackEvent('message_sent', companyId, {
      platform,
      messageType,
      success,
      responseTime,
      messageSize: messageSize || 0
    });
  }

  /**
   * Registra recebimento de mensagem
   */
  trackMessageReceived(
    platform: 'facebook' | 'instagram',
    messageType: string,
    companyId: number,
    processingTime: number,
    automated: boolean = false
  ): void {
    this.trackEvent('message_received', companyId, {
      platform,
      messageType,
      processingTime,
      automated
    });
  }

  /**
   * Obtém estatísticas agregadas
   */
  getAggregatedStats(
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
    companyId?: number
  ): AggregatedStats | null {
    const key = this.getStatsKey(timeframe, new Date());
    const stats = this.aggregatedStats.get(key);

    if (!stats) {
      return null;
    }

    // Filtrar por empresa se especificado
    if (companyId && stats.companies.has(companyId)) {
      return {
        ...stats,
        companies: new Map([[companyId, stats.companies.get(companyId)!]])
      };
    }

    return stats;
  }

  /**
   * Obtém estatísticas em tempo real
   */
  getRealTimeStats(companyId?: number): {
    activeUsers: number;
    activeSessions: number;
    recentAPICalls: number;
    recentErrors: number;
    averageResponseTime: number;
    responseTimePercentiles: { p50: number; p95: number; p99: number };
  } {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Filtrar eventos recentes
    const recentEvents = this.events.filter(event => {
      return event.timestamp >= fiveMinutesAgo && 
             (!companyId || event.companyId === companyId);
    });

    // Usuários ativos (últimos 5 minutos)
    const activeUsers = new Set(
      recentEvents
        .filter(e => e.userId)
        .map(e => e.userId)
    ).size;

    // Sessões ativas
    const activeSessions = new Set(
      recentEvents
        .filter(e => e.sessionId)
        .map(e => e.sessionId)
    ).size;

    // Chamadas de API recentes
    const apiCalls = recentEvents.filter(e => e.eventType === 'api_call');
    const apiErrors = recentEvents.filter(e => e.eventType === 'api_error');

    // Tempo de resposta médio
    const responseTimes = apiCalls
      .map(e => e.data.responseTime)
      .filter(rt => typeof rt === 'number');

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
      : 0;

    // Percentis de tempo de resposta
    const sortedResponseTimes = this.responseTimeBuffer.slice().sort((a, b) => a - b);
    const responseTimePercentiles = {
      p50: this.getPercentile(sortedResponseTimes, 50),
      p95: this.getPercentile(sortedResponseTimes, 95),
      p99: this.getPercentile(sortedResponseTimes, 99)
    };

    return {
      activeUsers,
      activeSessions,
      recentAPICalls: apiCalls.length,
      recentErrors: apiErrors.length,
      averageResponseTime,
      responseTimePercentiles
    };
  }

  /**
   * Obtém trends de uso
   */
  getUsageTrends(
    days: number = 7,
    companyId?: number
  ): Array<{
    date: string;
    apiCalls: number;
    errors: number;
    users: number;
    messages: number;
  }> {
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = this.events.filter(event => {
        const eventDate = event.timestamp.toISOString().split('T')[0];
        return eventDate === dateStr && (!companyId || event.companyId === companyId);
      });

      trends.push({
        date: dateStr,
        apiCalls: dayEvents.filter(e => e.eventType === 'api_call').length,
        errors: dayEvents.filter(e => e.eventType === 'api_error').length,
        users: new Set(dayEvents.filter(e => e.userId).map(e => e.userId)).size,
        messages: dayEvents.filter(e => 
          e.eventType === 'message_sent' || e.eventType === 'message_received'
        ).length
      });
    }

    return trends;
  }

  /**
   * Inicia agregação periódica
   */
  private startAggregation(): void {
    this.aggregationTimer = setInterval(() => {
      this.performAggregation();
    }, this.config.aggregationInterval);

    facebookLogger.info({
      type: 'facebook_telemetry_aggregation_started',
      interval: this.config.aggregationInterval
    }, 'Telemetry aggregation started');
  }

  /**
   * Inicia exportação periódica
   */
  private startExport(): void {
    this.exportTimer = setInterval(() => {
      this.exportData();
    }, this.config.exportInterval);

    facebookLogger.info({
      type: 'facebook_telemetry_export_started',
      interval: this.config.exportInterval
    }, 'Telemetry export started');
  }

  /**
   * Executa agregação de dados
   */
  private performAggregation(): void {
    try {
      const now = new Date();
      const timeframes: Array<'hour' | 'day'> = ['hour', 'day'];

      timeframes.forEach(timeframe => {
        const key = this.getStatsKey(timeframe, now);
        if (!this.aggregatedStats.has(key)) {
          const aggregated = this.aggregateEvents(timeframe, now);
          this.aggregatedStats.set(key, aggregated);
        }
      });

      // Limpar dados antigos
      this.cleanupOldData();

      facebookLogger.debug({
        type: 'facebook_telemetry_aggregation_completed',
        statsCount: this.aggregatedStats.size
      }, 'Telemetry aggregation completed');

    } catch (error) {
      facebookLogger.error({
        type: 'facebook_telemetry_aggregation_error',
        error: error.message
      }, 'Telemetry aggregation failed');
    }
  }

  /**
   * Agrega eventos por período
   */
  private aggregateEvents(timeframe: 'hour' | 'day', date: Date): AggregatedStats {
    const startTime = this.getTimeframeBoundary(timeframe, date, 'start');
    const endTime = this.getTimeframeBoundary(timeframe, date, 'end');

    const periodEvents = this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp < endTime
    );

    const companies = new Map<number, CompanyStats>();
    const companyIds = [...new Set(periodEvents.map(e => e.companyId))];

    // Agregar por empresa
    companyIds.forEach(companyId => {
      const companyEvents = periodEvents.filter(e => e.companyId === companyId);
      companies.set(companyId, this.aggregateCompanyEvents(companyId, companyEvents));
    });

    // Estatísticas globais
    const global = this.aggregateGlobalEvents(periodEvents);

    return {
      timeframe,
      period: startTime.toISOString(),
      companies,
      global
    };
  }

  /**
   * Agrega eventos de uma empresa
   */
  private aggregateCompanyEvents(companyId: number, events: TelemetryEvent[]): CompanyStats {
    const apiCalls = events.filter(e => e.eventType === 'api_call');
    const apiErrors = events.filter(e => e.eventType === 'api_error');
    const messages = events.filter(e => 
      e.eventType === 'message_sent' || e.eventType === 'message_received'
    );

    const responseTimes = apiCalls
      .map(e => e.data.responseTime)
      .filter(rt => typeof rt === 'number')
      .sort((a, b) => a - b);

    const errorsByType = new Map<string, number>();
    apiErrors.forEach(error => {
      const type = error.data.errorType || 'unknown';
      errorsByType.set(type, (errorsByType.get(type) || 0) + 1);
    });

    return {
      companyId,
      totalAPICalls: apiCalls.length,
      successfulCalls: apiCalls.filter(e => e.data.success).length,
      failedCalls: apiErrors.length,
      totalUsers: new Set(events.filter(e => e.userId).map(e => e.userId)).size,
      activeUsers: new Set(events.filter(e => e.userId && e.eventType === 'user_activity').map(e => e.userId)).size,
      messagesSent: events.filter(e => e.eventType === 'message_sent').length,
      messagesReceived: events.filter(e => e.eventType === 'message_received').length,
      errorsByType,
      responseTimeP50: this.getPercentile(responseTimes, 50),
      responseTimeP95: this.getPercentile(responseTimes, 95),
      responseTimeP99: this.getPercentile(responseTimes, 99),
      cacheHitRate: this.calculateCacheHitRate(apiCalls),
      quotaUsage: 0, // TODO: Implementar tracking de quota
      webhookEvents: events.filter(e => e.eventType === 'webhook_received').length,
      connectedClients: {
        facebook: 0, // TODO: Implementar tracking de clientes conectados
        instagram: 0
      }
    };
  }

  /**
   * Agrega eventos globais
   */
  private aggregateGlobalEvents(events: TelemetryEvent[]): GlobalStats {
    const uniqueCompanies = new Set(events.map(e => e.companyId)).size;
    const apiCalls = events.filter(e => e.eventType === 'api_call');
    const errors = events.filter(e => e.eventType === 'api_error');

    return {
      totalCompanies: uniqueCompanies,
      totalAPICalls: apiCalls.length,
      globalErrorRate: apiCalls.length > 0 ? errors.length / apiCalls.length : 0,
      averageResponseTime: this.calculateAverageResponseTime(apiCalls),
      systemUptime: process.uptime() * 1000,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage().user / 1000000, // Converter para segundos
      activeConnections: 0, // TODO: Implementar tracking de conexões
      alertsTriggered: 0, // TODO: Integrar com sistema de alertas
      alertsResolved: 0
    };
  }

  /**
   * Utilitários
   */
  private getStatsKey(timeframe: string, date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hour = date.getHours();

    switch (timeframe) {
      case 'hour':
        return `${timeframe}_${year}_${month}_${day}_${hour}`;
      case 'day':
        return `${timeframe}_${year}_${month}_${day}`;
      default:
        return `${timeframe}_${year}_${month}`;
    }
  }

  private getTimeframeBoundary(
    timeframe: 'hour' | 'day',
    date: Date,
    boundary: 'start' | 'end'
  ): Date {
    const result = new Date(date);

    if (timeframe === 'hour') {
      result.setMinutes(0, 0, 0);
      if (boundary === 'end') {
        result.setHours(result.getHours() + 1);
      }
    } else {
      result.setHours(0, 0, 0, 0);
      if (boundary === 'end') {
        result.setDate(result.getDate() + 1);
      }
    }

    return result;
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.floor((percentile / 100) * sortedArray.length);
    return sortedArray[Math.min(index, sortedArray.length - 1)];
  }

  private calculateCacheHitRate(apiCalls: TelemetryEvent[]): number {
    const cacheableRequests = apiCalls.filter(call => typeof call.data.fromCache === 'boolean');
    if (cacheableRequests.length === 0) return 0;

    const cacheHits = cacheableRequests.filter(call => call.data.fromCache).length;
    return cacheHits / cacheableRequests.length;
  }

  private calculateAverageResponseTime(apiCalls: TelemetryEvent[]): number {
    const responseTimes = apiCalls
      .map(call => call.data.responseTime)
      .filter(rt => typeof rt === 'number');

    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
      : 0;
  }

  private getErrorSeverity(errorCode: number): 'low' | 'medium' | 'high' | 'critical' {
    if (errorCode >= 500) return 'critical';
    if (errorCode >= 400 && errorCode < 500) return 'medium';
    if (errorCode === 429) return 'high'; // Rate limiting
    return 'low';
  }

  private anonymizeEventData(data: Record<string, any>): Record<string, any> {
    const anonymized = { ...data };
    
    // Remover/hash dados sensíveis
    if (anonymized.userId) {
      anonymized.userId = this.hashValue(anonymized.userId.toString());
    }
    
    if (anonymized.endpoint) {
      anonymized.endpoint = this.sanitizeEndpoint(anonymized.endpoint);
    }

    return anonymized;
  }

  private hashIP(ip: string): string {
    // Implementação simplificada - em produção, usar hash criptográfico
    return `hashed_${ip.split('.').map(part => parseInt(part) % 100).join('.')}`;
  }

  private hashValue(value: string): string {
    // Implementação simplificada
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hashed_${Math.abs(hash)}`;
  }

  private sanitizeEndpoint(endpoint: string): string {
    // Remove IDs específicos dos endpoints
    return endpoint.replace(/\/\d+/g, '/{id}');
  }

  private updateSessionTracking(sessionId: string, event: TelemetryEvent): void {
    const session = this.sessionTracking.get(sessionId);
    
    if (session) {
      session.lastActivity = event.timestamp;
      session.events++;
    } else {
      this.sessionTracking.set(sessionId, {
        startTime: event.timestamp,
        lastActivity: event.timestamp,
        events: 1
      });
    }
  }

  private cleanupOldData(): void {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Remover eventos antigos
    this.events = this.events.filter(event => event.timestamp >= cutoffDate);
    
    // Remover estatísticas antigas
    for (const [key, stats] of this.aggregatedStats.entries()) {
      if (new Date(stats.period) < cutoffDate) {
        this.aggregatedStats.delete(key);
      }
    }
    
    // Remover sessões inativas (mais de 1 hora sem atividade)
    const sessionCutoff = new Date(Date.now() - 60 * 60 * 1000);
    for (const [sessionId, session] of this.sessionTracking.entries()) {
      if (session.lastActivity < sessionCutoff) {
        this.sessionTracking.delete(sessionId);
      }
    }
  }

  private exportData(): void {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        config: this.config,
        stats: Object.fromEntries(this.aggregatedStats),
        realTimeStats: this.getRealTimeStats(),
        systemInfo: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        }
      };

      facebookLogger.info({
        type: 'facebook_telemetry_export',
        dataSize: JSON.stringify(exportData).length,
        statsCount: this.aggregatedStats.size,
        eventsCount: this.events.length
      }, 'Telemetry data exported');

      // TODO: Implementar exportação para sistema externo
      // - Arquivo JSON local
      // - Webhook para sistema de analytics
      // - Base de dados externa
      
    } catch (error) {
      facebookLogger.error({
        type: 'facebook_telemetry_export_error',
        error: error.message
      }, 'Telemetry export failed');
    }
  }

  /**
   * Para serviço de telemetria
   */
  shutdown(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = null;
    }

    if (this.exportTimer) {
      clearInterval(this.exportTimer);
      this.exportTimer = null;
    }

    facebookLogger.info({
      type: 'facebook_telemetry_shutdown',
      eventsCollected: this.events.length,
      statsGenerated: this.aggregatedStats.size
    }, 'Telemetry service shutdown');
  }

  /**
   * Obtém configuração atual
   */
  getConfiguration(): TelemetryConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfiguration(newConfig: Partial<TelemetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    facebookLogger.info({
      type: 'facebook_telemetry_config_updated',
      config: this.config
    }, 'Telemetry configuration updated');
  }
}

// Instância global do serviço de telemetria
export const facebookTelemetry = new FacebookTelemetryService();