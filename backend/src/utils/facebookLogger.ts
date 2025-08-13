import pino from 'pino';
import { FacebookAPIError } from '../services/FacebookServices/FacebookErrorHandler';

/**
 * Logger específico para APIs do Facebook/Instagram
 * Implementa logs estruturados para monitoramento e debugging
 */
export const facebookLogger = pino({
  name: 'facebook-api',
  level: process.env.FACEBOOK_LOG_LEVEL || process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label };
    },
    log(object: any) {
      // Garantir que dados sensíveis não sejam logados
      const sanitized = { ...object };
      
      // Remover tokens de acesso dos logs
      if (sanitized.accessToken) {
        sanitized.accessToken = '***masked***';
      }
      if (sanitized.token) {
        sanitized.token = '***masked***';
      }
      if (sanitized.facebookUserToken) {
        sanitized.facebookUserToken = '***masked***';
      }
      if (sanitized.instagramAccessToken) {
        sanitized.instagramAccessToken = '***masked***';
      }
      
      return sanitized;
    }
  },
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined
});

/**
 * Interface para dados de chamada da API
 */
interface APICallData {
  endpoint: string;
  method: string;
  status?: number;
  companyId: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
  userAgent?: string;
  retryAttempt?: number;
  fromCache?: boolean;
}

/**
 * Interface para métricas de performance
 */
interface PerformanceMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  cacheHitRate: number;
  retryRate: number;
  errorRate: number;
}

/**
 * Interface para contexto de erro
 */
interface ErrorContext {
  endpoint?: string;
  method?: string;
  companyId?: number;
  userId?: string;
  requestId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Log de chamada para API do Facebook/Instagram
 */
export const logFacebookAPICall = (data: APICallData): void => {
  const logData = {
    type: 'facebook_api_call',
    timestamp: new Date().toISOString(),
    ...data
  };

  if (data.status && data.status >= 400) {
    facebookLogger.error(logData, `API call failed: ${data.method} ${data.endpoint}`);
  } else {
    facebookLogger.info(logData, `API call: ${data.method} ${data.endpoint}`);
  }
};

/**
 * Log de erro específico do Facebook
 */
export const logFacebookError = (
  error: FacebookAPIError | Error, 
  context: ErrorContext = {}
): void => {
  const errorData = {
    type: 'facebook_api_error',
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      code: error instanceof FacebookAPIError ? error.code : 'unknown',
      type: error instanceof FacebookAPIError ? error.type : 'Error',
      fbtrace_id: error instanceof FacebookAPIError ? error.fbtrace_id : undefined,
      isTemporary: error instanceof FacebookAPIError ? error.isTemporary : false,
      retryAfter: error instanceof FacebookAPIError ? error.retryAfter : undefined,
      stack: error.stack
    },
    context: {
      ...context,
      companyId: context.companyId || 0
    }
  };

  facebookLogger.error(errorData, `Facebook API Error: ${error.message}`);
};

/**
 * Log de início de retry
 */
export const logRetryAttempt = (
  endpoint: string,
  attempt: number,
  maxRetries: number,
  delay: number,
  reason: string,
  companyId: number
): void => {
  facebookLogger.warn({
    type: 'facebook_api_retry',
    timestamp: new Date().toISOString(),
    endpoint,
    attempt,
    maxRetries,
    delay,
    reason,
    companyId
  }, `Retry attempt ${attempt}/${maxRetries} for ${endpoint} in ${delay}ms - ${reason}`);
};

/**
 * Log de cache hit/miss
 */
export const logCacheEvent = (
  cacheKey: string,
  event: 'hit' | 'miss' | 'set' | 'delete' | 'clear',
  companyId: number,
  additionalData: Record<string, any> = {}
): void => {
  facebookLogger.debug({
    type: 'facebook_cache_event',
    timestamp: new Date().toISOString(),
    cacheKey: cacheKey.substring(0, 50) + (cacheKey.length > 50 ? '...' : ''), // Truncar chaves longas
    event,
    companyId,
    ...additionalData
  }, `Cache ${event}: ${cacheKey}`);
};

/**
 * Log de rate limiting
 */
export const logRateLimit = (
  endpoint: string,
  currentCalls: number,
  limit: number,
  resetTime: Date,
  companyId: number
): void => {
  facebookLogger.warn({
    type: 'facebook_rate_limit',
    timestamp: new Date().toISOString(),
    endpoint,
    currentCalls,
    limit,
    resetTime: resetTime.toISOString(),
    companyId,
    utilizationPercent: Math.round((currentCalls / limit) * 100)
  }, `Rate limit approached: ${currentCalls}/${limit} calls for ${endpoint}`);
};

/**
 * Log de webhook recebido
 */
export const logWebhookReceived = (
  source: 'facebook' | 'instagram',
  companyId: number,
  eventType: string,
  verified: boolean,
  processingTime?: number
): void => {
  facebookLogger.info({
    type: 'facebook_webhook_received',
    timestamp: new Date().toISOString(),
    source,
    companyId,
    eventType,
    verified,
    processingTime
  }, `Webhook received from ${source}: ${eventType} (verified: ${verified})`);
};

/**
 * Log de health check
 */
export const logHealthCheck = (
  component: 'facebook_api' | 'instagram_api' | 'cache' | 'rate_limiter',
  status: 'healthy' | 'unhealthy' | 'degraded',
  details: Record<string, any> = {},
  companyId?: number
): void => {
  const logLevel = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
  
  facebookLogger[logLevel]({
    type: 'facebook_health_check',
    timestamp: new Date().toISOString(),
    component,
    status,
    details,
    companyId: companyId || 0
  }, `Health check - ${component}: ${status}`);
};

/**
 * Log de métricas agregadas (chamado periodicamente)
 */
export const logMetrics = (
  timeWindow: string,
  metrics: PerformanceMetrics,
  companyId?: number
): void => {
  facebookLogger.info({
    type: 'facebook_metrics',
    timestamp: new Date().toISOString(),
    timeWindow,
    metrics: {
      ...metrics,
      errorRate: Math.round(metrics.errorRate * 100) / 100, // 2 casas decimais
      cacheHitRate: Math.round(metrics.cacheHitRate * 100) / 100,
      retryRate: Math.round(metrics.retryRate * 100) / 100,
      averageResponseTime: Math.round(metrics.averageResponseTime * 100) / 100
    },
    companyId: companyId || 0
  }, `Metrics for ${timeWindow}: ${metrics.totalCalls} calls, ${(metrics.errorRate * 100).toFixed(1)}% error rate`);
};

/**
 * Log de configuração de cliente
 */
export const logClientConfiguration = (
  clientType: 'facebook' | 'instagram',
  config: {
    companyId: number;
    apiVersion: string;
    hasToken: boolean;
    cacheEnabled: boolean;
    retryEnabled: boolean;
    maxRetries: number;
    timeout: number;
  }
): void => {
  facebookLogger.info({
    type: 'facebook_client_config',
    timestamp: new Date().toISOString(),
    clientType,
    config: {
      ...config,
      // Nunca logar o token real
      hasToken: config.hasToken
    }
  }, `${clientType} client configured for company ${config.companyId}`);
};

/**
 * Log de session cleanup
 */
export const logSessionCleanup = (
  action: 'cleanup_started' | 'cleanup_completed' | 'session_removed',
  details: {
    totalSessions?: number;
    removedSessions?: number;
    companyId?: number;
    reason?: string;
    duration?: number;
  }
): void => {
  facebookLogger.info({
    type: 'facebook_session_cleanup',
    timestamp: new Date().toISOString(),
    action,
    details
  }, `Session cleanup: ${action}`);
};

/**
 * Log de quota/usage tracking
 */
export const logQuotaUsage = (
  companyId: number,
  quotaType: 'api_calls' | 'messages_sent' | 'webhooks_received',
  currentUsage: number,
  limit: number,
  resetDate: Date
): void => {
  const utilizationPercent = Math.round((currentUsage / limit) * 100);
  const logLevel = utilizationPercent >= 90 ? 'warn' : utilizationPercent >= 70 ? 'info' : 'debug';
  
  facebookLogger[logLevel]({
    type: 'facebook_quota_usage',
    timestamp: new Date().toISOString(),
    companyId,
    quotaType,
    currentUsage,
    limit,
    utilizationPercent,
    resetDate: resetDate.toISOString(),
    daysUntilReset: Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }, `Quota usage - ${quotaType}: ${currentUsage}/${limit} (${utilizationPercent}%)`);
};

/**
 * Log crítico que deve ser sempre registrado
 */
export const logCritical = (
  message: string,
  data: Record<string, any> = {},
  companyId?: number
): void => {
  facebookLogger.fatal({
    type: 'facebook_critical',
    timestamp: new Date().toISOString(),
    message,
    data,
    companyId: companyId || 0
  }, `CRITICAL: ${message}`);
};

/**
 * Helper para criar child logger com contexto
 */
export const createChildLogger = (context: Record<string, any>) => {
  return facebookLogger.child(context);
};

/**
 * Flush logs (útil para testes ou shutdown)
 */
export const flushLogs = async (): Promise<void> => {
  return new Promise((resolve) => {
    // Pino não tem flush callback em algumas versões
    if (typeof (facebookLogger as any).flush === 'function') {
      (facebookLogger as any).flush();
    }
    resolve();
  });
};