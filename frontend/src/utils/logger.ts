// Sistema de Logs Robusto para Migração Frontend
// Criado seguindo roadmap de modernização - Fase 1

export interface LogLevel {
  TRACE: 0;
  DEBUG: 1;
  INFO: 2;
  WARN: 3;
  ERROR: 4;
  FATAL: 5;
}

export interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  phase?: string;
  component?: string;
  metadata?: any;
}

class FrontendLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  // LOGS DE DESENVOLVIMENTO (Detalhados)
  development = {
    migration: (message: string, metadata?: any) => {
      if (this.isDevelopment) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `[MIGRATION] ${message}`,
          phase: 'migration',
          metadata
        };
        console.log(entry.message, metadata || '');
        this.writeToFile('development/migration.log', entry);
      }
    },

    build: (message: string, metadata?: any) => {
      if (this.isDevelopment) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'DEBUG',
          message: `[BUILD] ${message}`,
          metadata
        };
        console.log(entry.message, metadata || '');
        this.writeToFile('development/build.log', entry);
      }
    },

    performance: (metric: string, value: number, metadata?: any) => {
      if (this.isDevelopment) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `[PERF] ${metric}: ${value}ms`,
          metadata: { metric, value, ...metadata }
        };
        console.log(entry.message);
        this.writeToFile('development/performance.log', entry);
      }
    },

    component: (component: string, action: string, metadata?: any) => {
      if (this.isDevelopment) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'DEBUG',
          message: `[COMPONENT] ${component} - ${action}`,
          component,
          metadata
        };
        console.log(entry.message, metadata || '');
        this.writeToFile('development/components.log', entry);
      }
    },

    error: (message: string, error?: Error, metadata?: any) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: `[ERROR] ${message}`,
        metadata: { error: error?.stack, ...metadata }
      };
      console.error(entry.message, error || '');
      this.writeToFile('development/errors.log', entry);
    }
  };

  // LOGS DE PRODUÇÃO (Apenas Essenciais)
  production = {
    system: (message: string, metadata?: any) => {
      if (this.isProduction) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `[SYSTEM] ${message}`,
          metadata
        };
        console.log(entry.message);
        this.writeToFile('production/system.log', entry);
      }
    },

    error: (message: string, error?: Error, metadata?: any) => {
      if (this.isProduction) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: `[ERROR] ${message}`,
          metadata: { error: error?.stack, ...metadata }
        };
        console.error(entry.message, error || '');
        this.writeToFile('production/errors.log', entry);
      }
    },

    performance: (metric: string, value: number) => {
      if (this.isProduction && value > 1000) { // Apenas métricas críticas
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'WARN',
          message: `[PERF-CRITICAL] ${metric}: ${value}ms`,
          metadata: { metric, value }
        };
        console.warn(entry.message);
        this.writeToFile('production/performance.log', entry);
      }
    }
  };

  // LOGS ESPECÍFICOS DA MIGRAÇÃO
  migration = {
    phaseStart: (phase: string) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `[MIGRATION-START] Iniciando ${phase}`,
        phase
      };
      console.log(`🚀 ${entry.message}`);
      this.writeToFile('migration/phases.log', entry);
    },

    phaseComplete: (phase: string, duration: number) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `[MIGRATION-COMPLETE] ${phase} concluída em ${duration}ms`,
        phase,
        metadata: { duration }
      };
      console.log(`✅ ${entry.message}`);
      this.writeToFile('migration/phases.log', entry);
    },

    componentMigrated: (component: string, fromVersion: string, toVersion: string) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `[COMPONENT-MIGRATED] ${component}: ${fromVersion} → ${toVersion}`,
        component,
        metadata: { fromVersion, toVersion }
      };
      console.log(`🔄 ${entry.message}`);
      this.writeToFile('migration/components.log', entry);
    },

    dependencyUpdated: (dependency: string, fromVersion: string, toVersion: string) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `[DEPENDENCY-UPDATED] ${dependency}: ${fromVersion} → ${toVersion}`,
        metadata: { dependency, fromVersion, toVersion }
      };
      console.log(`📦 ${entry.message}`);
      this.writeToFile('migration/dependencies.log', entry);
    },

    warningPreservation: (message: string, component?: string) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message: `[PRESERVATION-WARNING] ${message}`,
        component,
        metadata: { preservationWarning: true }
      };
      console.warn(`⚠️ ${entry.message}`);
      this.writeToFile('migration/preservation.log', entry);
    }
  };

  private writeToFile(filepath: string, entry: LogEntry) {
    // Em ambiente de desenvolvimento, simular escrita em arquivo
    if (this.isDevelopment) {
      // TODO: Implementar escrita real em arquivo quando necessário
      // Para agora, apenas log no console com identificação do arquivo
      console.debug(`[LOG-FILE: ${filepath}]`, JSON.stringify(entry, null, 2));
    }
  }
}

// Exportar instância única
export const logger = new FrontendLogger();

// Utilidade para medir performance
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T> | T
): Promise<T> => {
  const start = Date.now();
  logger.development.performance(`${operation} - START`, 0);
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.development.performance(`${operation} - SUCCESS`, duration);
    logger.production.performance(operation, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.development.error(`${operation} - FAILED after ${duration}ms`, error as Error);
    logger.production.error(`${operation} failed`, error as Error);
    throw error;
  }
};

// Hook para logging de componentes React
export const useComponentLogger = (componentName: string) => {
  return {
    logMount: () => logger.development.component(componentName, 'MOUNTED'),
    logUnmount: () => logger.development.component(componentName, 'UNMOUNTED'),
    logRender: () => logger.development.component(componentName, 'RENDERED'),
    logError: (error: Error) => logger.development.error(`Component ${componentName} error`, error),
    logAction: (action: string, metadata?: any) => 
      logger.development.component(componentName, action, metadata)
  };
};