import dotenv from 'dotenv';
import { 
  validateAllConfigurations, 
  getFacebookConfig, 
  generateConfigReport 
} from './facebookConfig';
import { facebookLogger } from '../utils/facebookLogger';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Interface para configuração centralizada da aplicação
 */
interface AppConfiguration {
  // Configurações do ambiente
  environment: 'development' | 'production' | 'test';
  port: number;
  
  // URLs da aplicação
  backendURL: string;
  frontendURL: string;
  
  // Configurações do banco de dados
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    dialect: string;
  };
  
  // Configurações JWT
  jwt: {
    secret: string;
    refreshSecret: string;
  };
  
  // Configurações Redis
  redis: {
    uri: string;
  };
  
  // Configurações Facebook/Instagram
  facebook: ReturnType<typeof getFacebookConfig>;
  
  // Configurações de email
  mail: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    from?: string;
  };
  
  // Configurações de sistema
  system: {
    userLimit: number;
    connectionsLimit: number;
    closedSendByMe: boolean;
  };
}

/**
 * Validação das configurações de ambiente básicas
 */
const validateBasicEnvironment = (): void => {
  const requiredEnvVars = [
    'PORT',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASS',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missingVars: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    console.error('❌ Configuration Error:', errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Obtém a configuração centralizada da aplicação
 */
export const getAppConfig = (): AppConfiguration => {
  // Validar ambiente básico
  validateBasicEnvironment();
  
  // Validar configurações Facebook
  const facebookValidation = validateAllConfigurations();
  
  if (!facebookValidation.valid) {
    console.error('❌ Facebook Configuration Errors:', facebookValidation.errors);
    throw new Error(`Facebook configuration validation failed: ${facebookValidation.errors.join(', ')}`);
  }
  
  // Log warnings se existirem
  if (facebookValidation.warnings.length > 0) {
    console.warn('⚠️  Facebook Configuration Warnings:', facebookValidation.warnings);
  }
  
  const config: AppConfiguration = {
    // Ambiente
    environment: (process.env.NODE_ENV as any) || 'development',
    port: parseInt(process.env.PORT || '4035'),
    
    // URLs
    backendURL: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '4035'}`,
    frontendURL: process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT}`,
    
    // Banco de dados
    database: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '5432'),
      name: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASS!,
      dialect: process.env.DB_DIALECT || 'postgres'
    },
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET!,
      refreshSecret: process.env.JWT_REFRESH_SECRET!
    },
    
    // Redis
    redis: {
      uri: process.env.REDIS_URI || 'redis://localhost:6379'
    },
    
    // Facebook/Instagram
    facebook: facebookValidation.config,
    
    // Email
    mail: {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT) : undefined,
      user: process.env.MAIL_USER,
      password: process.env.MAIL_PASS,
      from: process.env.MAIL_FROM
    },
    
    // Sistema
    system: {
      userLimit: parseInt(process.env.USER_LIMIT || '999'),
      connectionsLimit: parseInt(process.env.CONNECTIONS_LIMIT || '999'),
      closedSendByMe: process.env.CLOSED_SEND_BY_ME === 'true'
    }
  };
  
  return config;
};

/**
 * Inicializa e valida toda a configuração da aplicação
 */
export const initializeConfiguration = (): {
  config: AppConfiguration;
  report: ReturnType<typeof generateConfigReport>;
} => {
  try {
    console.log('🔧 Initializing application configuration...');
    
    // Obter configuração
    const config = getAppConfig();
    
    // Gerar relatório de configuração
    const report = generateConfigReport();
    
    // Log do sucesso
    console.log('✅ Configuration initialized successfully');
    console.log(`📊 Environment: ${config.environment}`);
    console.log(`🌐 Backend URL: ${config.backendURL}`);
    console.log(`📱 Facebook App ID: ${config.facebook.appId}`);
    console.log(`📸 Instagram Enabled: ${config.facebook.instagramEnabled ? '✅' : '❌'}`);
    console.log(`📊 Monitoring Enabled: ${config.facebook.telemetryEnabled ? '✅' : '❌'}`);
    
    // Log warnings se existirem
    if (report.validation.warnings.length > 0) {
      console.log('⚠️  Configuration warnings:');
      report.validation.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }
    
    // Log recomendações
    if (report.recommendations.length > 0) {
      console.log('💡 Configuration recommendations:');
      report.recommendations.forEach(recommendation => {
        console.log(`   - ${recommendation}`);
      });
    }
    
    // Log estruturado para monitoramento
    facebookLogger.info({
      type: 'app_configuration_initialized',
      environment: config.environment,
      facebook: {
        appId: config.facebook.appId,
        apiVersion: config.facebook.apiVersion,
        instagramEnabled: config.facebook.instagramEnabled,
        monitoringEnabled: config.facebook.telemetryEnabled
      },
      validation: {
        errors: report.validation.errors.length,
        warnings: report.validation.warnings.length
      }
    }, 'Application configuration initialized successfully');
    
    return { config, report };
    
  } catch (error) {
    console.error('💥 Configuration initialization failed:', error.message);
    
    // Log estruturado do erro
    facebookLogger.fatal({
      type: 'app_configuration_failed',
      error: error.message,
      stack: error.stack
    }, 'Application configuration initialization failed');
    
    throw error;
  }
};

/**
 * Middleware para verificar se a configuração está inicializada
 */
export const configurationMiddleware = (req: any, res: any, next: any) => {
  try {
    // Verificar se as configurações básicas estão presentes
    const config = getAppConfig();
    
    // Adicionar configuração ao request para uso nos controllers
    req.appConfig = config;
    
    next();
  } catch (error) {
    console.error('Configuration middleware error:', error.message);
    
    res.status(500).json({
      error: 'Configuration Error',
      message: 'Application is not properly configured',
      details: error.message
    });
  }
};

/**
 * Endpoint de health check da configuração
 */
export const configurationHealthCheck = () => {
  try {
    const { config, report } = initializeConfiguration();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.environment,
      configuration: {
        database: {
          connected: true, // TODO: Implementar verificação real de conexão
          host: config.database.host,
          name: config.database.name
        },
        facebook: {
          configured: !!config.facebook.appId,
          apiVersion: config.facebook.apiVersion,
          instagramEnabled: config.facebook.instagramEnabled
        },
        monitoring: {
          enabled: config.facebook.telemetryEnabled,
          healthChecks: config.facebook.healthCheckEnabled,
          alerts: config.facebook.alertsEnabled
        }
      },
      validation: report.validation,
      recommendations: report.recommendations
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      recommendations: [
        'Check environment variables',
        'Verify Facebook app configuration',
        'Review application logs'
      ]
    };
  }
};

/**
 * Valida configuração sem inicializar (para testes)
 */
export const validateConfigurationOnly = (): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Validar ambiente básico
    validateBasicEnvironment();
  } catch (error) {
    errors.push(error.message);
  }
  
  try {
    // Validar Facebook
    const facebookValidation = validateAllConfigurations();
    errors.push(...facebookValidation.errors);
    warnings.push(...facebookValidation.warnings);
  } catch (error) {
    errors.push(`Facebook validation failed: ${error.message}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// Exportar configurações para uso em outros módulos
export * from './facebookConfig';
export default getAppConfig;