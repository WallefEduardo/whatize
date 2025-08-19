import { facebookLogger } from '../utils/facebookLogger';

/**
 * Interface para configuração do Facebook/Instagram
 */
interface FacebookConfiguration {
  // Configurações básicas
  appId: string;
  appSecret: string;
  accessToken?: string;
  verifyToken: string;
  
  // API Configuration
  apiVersion: string;
  baseURL: string;
  timeout: number;
  
  // Instagram Configuration
  instagramEnabled: boolean;
  instagramBusinessAccountId?: string;
  instagramAccessToken?: string;
  
  // Rate Limiting
  rateLimitPerMinute: number;
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  
  // Security
  skipWebhookSignature: boolean;
  
  // Retry Configuration
  autoRetry: boolean;
  maxRetries: number;
  retryBaseDelay: number;
  
  // Cache Configuration
  cacheEnabled: boolean;
  cacheTTL: number;
  
  // Monitoring Configuration
  logsEnabled: boolean;
  logLevel: string;
  telemetryEnabled: boolean;
  healthCheckEnabled: boolean;
  alertsEnabled: boolean;
  
  // Development
  debugMode: boolean;
  webhookDevURL?: string;
  allowedIPs?: string[];
}

/**
 * Configurações padrão do Facebook/Instagram
 */
const defaultConfig: Partial<FacebookConfiguration> = {
  apiVersion: 'v22.0',
  baseURL: 'https://graph.facebook.com',
  timeout: 30000,
  instagramEnabled: true,
  rateLimitPerMinute: 100,
  rateLimitPerHour: 200,
  rateLimitPerDay: 4800,
  skipWebhookSignature: false,
  autoRetry: true,
  maxRetries: 3,
  retryBaseDelay: 1000,
  cacheEnabled: true,
  cacheTTL: 1800,
  logsEnabled: true,
  logLevel: 'info',
  telemetryEnabled: true,
  healthCheckEnabled: true,
  alertsEnabled: true,
  debugMode: false
};

/**
 * Valida configurações obrigatórias do Facebook
 */
export const validateFacebookConfig = (): void => {
  const requiredVars = [
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'VERIFY_TOKEN'
  ];
  
  const missingVars: string[] = [];
  
  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required Facebook environment variables: ${missingVars.join(', ')}`;
    facebookLogger.fatal({
      type: 'facebook_config_validation_error',
      missingVariables: missingVars,
      requiredVariables: requiredVars
    }, errorMessage);
    
    throw new Error(errorMessage);
  }
  
  facebookLogger.info({
    type: 'facebook_config_validation_success',
    validatedVariables: requiredVars
  }, 'Facebook configuration validation passed');
};

/**
 * Valida configurações do Instagram
 */
export const validateInstagramConfig = (): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  if (process.env.INSTAGRAM_API_ENABLED === 'true') {
    if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      warnings.push('INSTAGRAM_BUSINESS_ACCOUNT_ID is missing - Instagram features will be limited');
    }
    
    if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
      warnings.push('INSTAGRAM_ACCESS_TOKEN is missing - Instagram API calls will fail');
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
};

/**
 * Valida configurações de monitoramento
 */
export const validateMonitoringConfig = (): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  // Verificar configurações de alertas por email
  if (process.env.FACEBOOK_ALERT_EMAIL_ENABLED === 'true') {
    const emailRequired = [
      'FACEBOOK_ALERT_SMTP_HOST',
      'FACEBOOK_ALERT_SMTP_USER',
      'FACEBOOK_ALERT_SMTP_PASS',
      'FACEBOOK_ALERT_EMAIL_TO'
    ];
    
    for (const envVar of emailRequired) {
      if (!process.env[envVar]) {
        warnings.push(`${envVar} is required when email alerts are enabled`);
      }
    }
  }
  
  // Verificar configurações de webhook de alerta
  if (process.env.FACEBOOK_ALERT_WEBHOOK_URL && !process.env.FACEBOOK_ALERT_WEBHOOK_TOKEN) {
    warnings.push('FACEBOOK_ALERT_WEBHOOK_TOKEN is recommended when webhook URL is configured');
  }
  
  // Verificar configurações de telemetria
  const telemetryRetention = parseInt(process.env.FACEBOOK_TELEMETRY_RETENTION_DAYS || '30');
  if (telemetryRetention < 1 || telemetryRetention > 365) {
    warnings.push('FACEBOOK_TELEMETRY_RETENTION_DAYS should be between 1 and 365 days');
  }
  
  const samplingRate = parseFloat(process.env.FACEBOOK_TELEMETRY_SAMPLING_RATE || '1.0');
  if (samplingRate < 0 || samplingRate > 1) {
    warnings.push('FACEBOOK_TELEMETRY_SAMPLING_RATE should be between 0.0 and 1.0');
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
};

/**
 * Obtém configuração completa do Facebook/Instagram
 */
export const getFacebookConfig = (): FacebookConfiguration => {
  // Primeiro, validar configurações obrigatórias
  validateFacebookConfig();
  
  const config: FacebookConfiguration = {
    // Configurações básicas
    appId: process.env.FACEBOOK_APP_ID!,
    appSecret: process.env.FACEBOOK_APP_SECRET!,
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
    verifyToken: process.env.VERIFY_TOKEN!,
    
    // API Configuration
    apiVersion: process.env.META_API_VERSION || defaultConfig.apiVersion!,
    baseURL: process.env.META_API_BASE_URL || defaultConfig.baseURL!,
    timeout: parseInt(process.env.FACEBOOK_API_TIMEOUT || defaultConfig.timeout!.toString()),
    
    // Instagram Configuration
    instagramEnabled: process.env.INSTAGRAM_API_ENABLED === 'true',
    instagramBusinessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
    instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    
    // Rate Limiting
    rateLimitPerMinute: parseInt(process.env.FACEBOOK_RATE_LIMIT_PER_MINUTE || defaultConfig.rateLimitPerMinute!.toString()),
    rateLimitPerHour: parseInt(process.env.INSTAGRAM_RATE_LIMIT_PER_HOUR || defaultConfig.rateLimitPerHour!.toString()),
    rateLimitPerDay: parseInt(process.env.INSTAGRAM_RATE_LIMIT_PER_DAY || defaultConfig.rateLimitPerDay!.toString()),
    
    // Security
    skipWebhookSignature: process.env.SKIP_WEBHOOK_SIGNATURE === 'true',
    
    // Retry Configuration
    autoRetry: process.env.FACEBOOK_API_AUTO_RETRY !== 'false',
    maxRetries: parseInt(process.env.FACEBOOK_API_MAX_RETRIES || defaultConfig.maxRetries!.toString()),
    retryBaseDelay: parseInt(process.env.FACEBOOK_API_RETRY_BASE_DELAY || defaultConfig.retryBaseDelay!.toString()),
    
    // Cache Configuration
    cacheEnabled: process.env.FACEBOOK_CLIENT_CACHE_ENABLED !== 'false',
    cacheTTL: parseInt(process.env.FACEBOOK_CLIENT_CACHE_TTL || defaultConfig.cacheTTL!.toString()),
    
    // Monitoring Configuration
    logsEnabled: process.env.FACEBOOK_API_STATS_LOGS !== 'false',
    logLevel: process.env.FACEBOOK_LOG_LEVEL || defaultConfig.logLevel!,
    telemetryEnabled: process.env.FACEBOOK_TELEMETRY_ENABLED !== 'false',
    healthCheckEnabled: process.env.FACEBOOK_HEALTH_CHECK_ENABLED !== 'false',
    alertsEnabled: process.env.FACEBOOK_ALERTS_ENABLED !== 'false',
    
    // Development
    debugMode: process.env.FACEBOOK_DEBUG_MODE === 'true',
    webhookDevURL: process.env.WEBHOOK_DEV_URL,
    allowedIPs: process.env.FACEBOOK_ALLOWED_IPS?.split(',').map(ip => ip.trim())
  };
  
  return config;
};

/**
 * Validação completa de todas as configurações
 */
export const validateAllConfigurations = (): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: FacebookConfiguration;
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let config: FacebookConfiguration;
  
  try {
    // Validar configurações básicas
    validateFacebookConfig();
    
    // Obter configuração
    config = getFacebookConfig();
    
    // Validar Instagram
    const instagramValidation = validateInstagramConfig();
    warnings.push(...instagramValidation.warnings);
    
    // Validar monitoramento
    const monitoringValidation = validateMonitoringConfig();
    warnings.push(...monitoringValidation.warnings);
    
    // Validações adicionais
    
    // Verificar se API version é suportada
    const supportedVersions = ['v18.0', 'v19.0', 'v20.0', 'v21.0', 'v22.0'];
    if (!supportedVersions.includes(config.apiVersion)) {
      warnings.push(`API version ${config.apiVersion} may not be fully supported. Recommended: v22.0`);
    }
    
    // Verificar timeout razoável
    if (config.timeout < 5000) {
      warnings.push('FACEBOOK_API_TIMEOUT is less than 5 seconds, which may cause timeouts');
    }
    
    if (config.timeout > 60000) {
      warnings.push('FACEBOOK_API_TIMEOUT is greater than 60 seconds, which may cause slow responses');
    }
    
    // Verificar configurações de retry
    if (config.maxRetries > 5) {
      warnings.push('FACEBOOK_API_MAX_RETRIES is greater than 5, which may cause long delays');
    }
    
    // Verificar rate limiting
    if (config.rateLimitPerMinute > 200) {
      warnings.push('FACEBOOK_RATE_LIMIT_PER_MINUTE is high, may trigger Facebook rate limiting');
    }
    
    // Log da validação
    facebookLogger.info({
      type: 'facebook_config_validation_complete',
      errors: errors.length,
      warnings: warnings.length,
      config: {
        appId: config.appId,
        apiVersion: config.apiVersion,
        instagramEnabled: config.instagramEnabled,
        monitoringEnabled: config.telemetryEnabled,
        debugMode: config.debugMode
      }
    }, `Configuration validation completed: ${errors.length} errors, ${warnings.length} warnings`);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config: config!
    };
    
  } catch (error) {
    errors.push(error.message);
    
    return {
      valid: false,
      errors,
      warnings,
      config: config!
    };
  }
};

/**
 * Obtém configuração de desenvolvimento com valores padrão seguros
 */
export const getDevelopmentConfig = (): Partial<FacebookConfiguration> => {
  return {
    ...defaultConfig,
    debugMode: true,
    skipWebhookSignature: true, // Para facilitar desenvolvimento
    logLevel: 'debug',
    rateLimitPerMinute: 50, // Menor para desenvolvimento
    timeout: 15000 // Maior para debugging
  };
};

/**
 * Obtém configuração de produção com valores otimizados
 */
export const getProductionConfig = (): Partial<FacebookConfiguration> => {
  return {
    ...defaultConfig,
    debugMode: false,
    skipWebhookSignature: false, // Sempre verificar em produção
    logLevel: 'info',
    rateLimitPerMinute: 100,
    timeout: 30000
  };
};

/**
 * Gera relatório de configuração para debugging
 */
export const generateConfigReport = (): {
  environment: string;
  timestamp: string;
  configuration: any;
  validation: any;
  recommendations: string[];
} => {
  const validation = validateAllConfigurations();
  const recommendations: string[] = [];
  
  // Gerar recomendações baseadas na configuração
  if (process.env.NODE_ENV === 'production') {
    if (validation.config.debugMode) {
      recommendations.push('Disable debug mode in production for better performance');
    }
    
    if (validation.config.skipWebhookSignature) {
      recommendations.push('Enable webhook signature verification in production for security');
    }
    
    if (!validation.config.alertsEnabled) {
      recommendations.push('Enable alerts in production for proactive monitoring');
    }
  }
  
  if (validation.config.instagramEnabled && !validation.config.instagramAccessToken) {
    recommendations.push('Configure Instagram access token to enable Instagram features');
  }
  
  if (!validation.config.telemetryEnabled) {
    recommendations.push('Enable telemetry for better insights and monitoring');
  }
  
  return {
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    configuration: {
      facebook: {
        appId: validation.config.appId,
        hasAppSecret: !!validation.config.appSecret,
        hasAccessToken: !!validation.config.accessToken,
        apiVersion: validation.config.apiVersion,
        timeout: validation.config.timeout
      },
      instagram: {
        enabled: validation.config.instagramEnabled,
        hasBusinessAccountId: !!validation.config.instagramBusinessAccountId,
        hasAccessToken: !!validation.config.instagramAccessToken
      },
      monitoring: {
        logsEnabled: validation.config.logsEnabled,
        telemetryEnabled: validation.config.telemetryEnabled,
        healthCheckEnabled: validation.config.healthCheckEnabled,
        alertsEnabled: validation.config.alertsEnabled
      },
      security: {
        webhookSignatureVerification: !validation.config.skipWebhookSignature,
        debugMode: validation.config.debugMode
      },
      performance: {
        cacheEnabled: validation.config.cacheEnabled,
        autoRetry: validation.config.autoRetry,
        maxRetries: validation.config.maxRetries,
        rateLimitPerMinute: validation.config.rateLimitPerMinute
      }
    },
    validation: {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    },
    recommendations
  };
};