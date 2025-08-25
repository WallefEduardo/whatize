/**
 * Sistema de logs estruturado para debug e monitoramento
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_COLORS = {
  ERROR: '#FF6B6B',
  WARN: '#FFD93D',
  INFO: '#6BCF7F',
  DEBUG: '#4DABF7'
};

class Logger {
  constructor() {
    this.isDev = import.meta.env.DEV;
    this.currentLevel = this.isDev ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
    this.logs = [];
    this.maxLogs = 1000; // Manter últimos 1000 logs
    
    // Expor para debug global em desenvolvimento
    if (this.isDev) {
      window.logger = this;
    }
  }

  /**
   * Log estruturado com contexto
   */
  _log(level, context, message, data = null) {
    if (LOG_LEVELS[level] > this.currentLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context,
      message,
      data,
      stack: level === 'ERROR' ? new Error().stack : null
    };

    // Adicionar ao array de logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove o mais antigo
    }

    // Console output com estilo
    if (this.isDev) {
      const color = LOG_COLORS[level];
      const prefix = `%c[${level}] [${context}]`;
      const style = `color: ${color}; font-weight: bold;`;
      
      if (data) {
        console.log(prefix, style, message, data);
      } else {
        console.log(prefix, style, message);
      }
    } else if (level === 'ERROR') {
      // Em produção, apenas erros
      console.error(`[${context}] ${message}`, data);
    }

    // Enviar erros críticos para monitoramento (futuro)
    if (level === 'ERROR' && !this.isDev) {
      this._sendToMonitoring(logEntry);
    }
  }

  /**
   * Logs específicos por contexto
   */
  auth = {
    error: (message, data) => this._log('ERROR', 'AUTH', message, data),
    warn: (message, data) => this._log('WARN', 'AUTH', message, data),
    info: (message, data) => this._log('INFO', 'AUTH', message, data),
    debug: (message, data) => this._log('DEBUG', 'AUTH', message, data)
  };

  api = {
    error: (message, data) => this._log('ERROR', 'API', message, data),
    warn: (message, data) => this._log('WARN', 'API', message, data),
    info: (message, data) => this._log('INFO', 'API', message, data),
    debug: (message, data) => this._log('DEBUG', 'API', message, data)
  };

  token = {
    error: (message, data) => this._log('ERROR', 'TOKEN', message, data),
    warn: (message, data) => this._log('WARN', 'TOKEN', message, data),
    info: (message, data) => this._log('INFO', 'TOKEN', message, data),
    debug: (message, data) => this._log('DEBUG', 'TOKEN', message, data)
  };

  refresh = {
    error: (message, data) => this._log('ERROR', 'REFRESH', message, data),
    warn: (message, data) => this._log('WARN', 'REFRESH', message, data),
    info: (message, data) => this._log('INFO', 'REFRESH', message, data),
    debug: (message, data) => this._log('DEBUG', 'REFRESH', message, data)
  };

  ui = {
    error: (message, data) => this._log('ERROR', 'UI', message, data),
    warn: (message, data) => this._log('WARN', 'UI', message, data),
    info: (message, data) => this._log('INFO', 'UI', message, data),
    debug: (message, data) => this._log('DEBUG', 'UI', message, data)
  };

  /**
   * Métodos utilitários
   */
  
  // Obter logs filtrados
  getLogs(level = null, context = null, limit = 100) {
    let filtered = [...this.logs];
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    if (context) {
      filtered = filtered.filter(log => log.context === context);
    }
    
    return filtered.slice(-limit).reverse(); // Mais recentes primeiro
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
    console.clear();
  }

  // Exportar logs (para debug)
  exportLogs() {
    const logsJson = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Estatísticas dos logs
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      byContext: {},
      recentErrors: this.logs.filter(log => 
        log.level === 'ERROR' && 
        Date.now() - new Date(log.timestamp).getTime() < 60000 // Último minuto
      ).length
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
    });

    return stats;
  }

  // Definir nível de log
  setLevel(level) {
    if (level in LOG_LEVELS) {
      this.currentLevel = LOG_LEVELS[level];
      this.auth.info(`Nível de log alterado para: ${level}`);
    }
  }

  // Enviar para sistema de monitoramento (placeholder)
  _sendToMonitoring(logEntry) {
    // TODO: Implementar envio para sistema de monitoramento
    // Exemplos: Sentry, LogRocket, ou endpoint próprio
    console.warn('Log crítico detectado:', logEntry);
  }

  // Debug helper - mostrar dashboard de logs no console
  showDashboard() {
    if (!this.isDev) return;
    
    console.group('📊 Logger Dashboard');
    
    const stats = this.getStats();
    console.table(stats);
    
    console.group('🔥 Erros Recentes');
    this.getLogs('ERROR', null, 10).forEach(log => {
      console.error(`${log.timestamp}: ${log.message}`, log.data);
    });
    console.groupEnd();
    
    console.group('📈 Últimos 20 logs');
    console.table(this.getLogs(null, null, 20).map(log => ({
      time: log.timestamp.split('T')[1].split('.')[0],
      level: log.level,
      context: log.context,
      message: log.message.substring(0, 50) + (log.message.length > 50 ? '...' : '')
    })));
    console.groupEnd();
    
    console.groupEnd();
  }
}

// Instância singleton
const logger = new Logger();

// Helpers para uso rápido
export const authLog = logger.auth;
export const apiLog = logger.api;
export const tokenLog = logger.token;
export const refreshLog = logger.refresh;
export const uiLog = logger.ui;

export default logger;