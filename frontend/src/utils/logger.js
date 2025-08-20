// Sistema de Logs Robusto para Migração Frontend
// Criado seguindo roadmap de modernização - Fase 1

// LogLevel constants
const LOG_LEVELS = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5
};

// LogEntry factory function
const createLogEntry = (level, message, phase = null, component = null, metadata = null) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  phase,
  component,
  metadata
});

class FrontendLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // LOGS DE DESENVOLVIMENTO (Detalhados)
  development = {
    migration: (message, metadata) => {
      if (this.isDevelopment) {
        const entry = createLogEntry('INFO', `[MIGRATION] ${message}`, 'migration', null, metadata);
        console.log(entry.message, metadata || '');
      }
    },

    build: (message, metadata) => {
      if (this.isDevelopment) {
        const entry = createLogEntry('DEBUG', `[BUILD] ${message}`, null, null, metadata);
        console.log(entry.message, metadata || '');
      }
    },

    performance: (metric, value, metadata) => {
      if (this.isDevelopment) {
        const entry = createLogEntry('INFO', `[PERFORMANCE] ${metric}: ${value}ms`, null, null, metadata);
        console.log(entry.message, metadata || '');
      }
    },

    component: (component, action, metadata) => {
      if (this.isDevelopment) {
        const entry = createLogEntry('DEBUG', `[COMPONENT] ${component} - ${action}`, null, component, metadata);
        console.log(entry.message, metadata || '');
      }
    },

    error: (message, error, metadata) => {
      if (this.isDevelopment) {
        const entry = createLogEntry('ERROR', `[ERROR] ${message}`, null, null, { error: error?.message, stack: error?.stack, ...metadata });
        console.error(entry.message, error, metadata || '');
      }
    }
  };

  // LOGS DE PRODUÇÃO (Essenciais)
  production = {
    system: (message, metadata) => {
      if (this.isProduction) {
        const entry = createLogEntry('INFO', `[SYSTEM] ${message}`, null, null, metadata);
        console.log(entry.message);
      }
    },

    error: (message, error, metadata) => {
      const entry = createLogEntry('ERROR', `[CRITICAL] ${message}`, null, null, { error: error?.message, ...metadata });
      console.error(entry.message, error);
    },

    performance: (metric, value) => {
      if (this.isProduction) {
        const entry = createLogEntry('INFO', `[PERF] ${metric}: ${value}ms`);
        console.log(entry.message);
      }
    }
  };

  // LOGS ESPECÍFICOS DE MIGRAÇÃO
  migration = {
    phaseStart: (phase) => {
      const entry = createLogEntry('INFO', `🚀 INICIANDO ${phase.toUpperCase()}`, phase);
      console.log(`🚀 ${entry.message}`);
    },

    phaseComplete: (phase, duration) => {
      const entry = createLogEntry('INFO', `✅ ${phase.toUpperCase()} CONCLUÍDA`, phase, null, { duration: `${duration}ms` });
      console.log(`✅ ${entry.message} (${duration}ms)`);
    },

    componentMigrated: (component, fromVersion, toVersion) => {
      const entry = createLogEntry('INFO', `📦 ${component}: ${fromVersion} → ${toVersion}`, 'migration', component);
      console.log(`📦 ${entry.message}`);
    },

    dependencyUpdated: (dependency, fromVersion, toVersion) => {
      const entry = createLogEntry('INFO', `🔧 ${dependency}: ${fromVersion} → ${toVersion}`, 'migration');
      console.log(`🔧 ${entry.message}`);
    },

    warningPreservation: (message, component) => {
      const entry = createLogEntry('WARN', `⚠️  PRESERVAÇÃO: ${message}`, 'migration', component);
      console.warn(`⚠️  ${entry.message}`);
    }
  };
}

// Instância global
const logger = new FrontendLogger();

// Export principal
export default logger;
// Export nomeado para backward compatibility
export { logger };

// Função auxiliar para logging contextualizado
export const logOperation = (
  operation,
  component,
  startTime
) => {
  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);
  
  logger.development.component(component, `${operation} completed`, { duration: `${duration}ms` });
  
  if (duration > 1000) {
    logger.production.performance(operation, duration);
  }
};

// Hook para componentes React
export const useComponentLogger = (componentName) => {
  return {
    logMount: () => logger.development.component(componentName, 'mounted'),
    logUnmount: () => logger.development.component(componentName, 'unmounted'),
    logAction: (action, metadata) => logger.development.component(componentName, action, metadata),
    logError: (error, metadata) => logger.development.error(`Component ${componentName}`, error, metadata)
  };
};

// Exports específicos para migração
export { LOG_LEVELS, createLogEntry };