const axios = require('axios');
const fs = require('fs');
const path = require('path');
const EmailSender = require('./emailSender');

// Caminhos relativos à nova estrutura
// Estamos em backend/monitoring/services, então backend/logs é ../../logs
const backendLogsPath = path.join(__dirname, '../../logs/race_conditions.log');

// Configuração para produção
const CONFIG = {
  // Ajuste a URL conforme seu ambiente de produção
  API_URL: process.env.BACKEND_URL || 'http://localhost:4000',
  CHECK_INTERVAL: 30000, // 30 segundos
  LOG_FILE: backendLogsPath,
  ALERT_THRESHOLD: {
    ERRORS_PER_HOUR: 5,
    MEMORY_USAGE_MB: 500,
    CACHE_MISS_RATE: 80 // %
  },
  // Para produção, configure notificações (email, Slack, etc.)
  NOTIFICATIONS: {
    EMAIL: process.env.ALERT_EMAIL || null,
    WEBHOOK: process.env.ALERT_WEBHOOK || null
  }
};

class RaceConditionMonitor {
  constructor() {
    this.lastCheck = new Date();
    this.errorHistory = [];
    this.isRunning = false;
    this.emailSender = new EmailSender();
  }

  async start() {
    console.log('🚀 MONITOR DE RACE CONDITIONS - PRODUÇÃO');
    console.log('==========================================');
    console.log(`📡 API: ${CONFIG.API_URL}/race-conditions/stats`);
    console.log(`⏱️  Intervalo: ${CONFIG.CHECK_INTERVAL/1000}s`);
    console.log(`📁 Log: ${CONFIG.LOG_FILE}`);
    console.log('==========================================\n');

    this.isRunning = true;
    this.monitor();
  }

  async monitor() {
    while (this.isRunning) {
      try {
        await this.checkSystem();
        await this.sleep(CONFIG.CHECK_INTERVAL);
      } catch (error) {
        console.error('❌ Erro no monitoramento:', error.message);
        await this.sleep(5000); // Retry em 5s se houver erro
      }
    }
  }

  async checkSystem() {
    try {
      const response = await axios.get(`${CONFIG.API_URL}/race-conditions/stats`, {
        timeout: 10000,
        headers: {
          // Em produção, adicione o token de autenticação se necessário
          // 'Authorization': `Bearer ${process.env.AUTH_TOKEN}`
        }
      });

      const stats = response.data;
      const timestamp = new Date().toLocaleString('pt-BR');

      // Análise dos dados
      this.analyzeStats(stats, timestamp);
      
      // Verificar logs de arquivo
      this.checkLogFile();

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error(`🔴 [${new Date().toLocaleString('pt-BR')}] Backend não está respondendo!`);
        this.sendAlert('BACKEND_DOWN', 'Backend não está respondendo');
      } else {
        console.error(`⚠️ [${new Date().toLocaleString('pt-BR')}] Erro na verificação:`, error.message);
      }
    }
  }

  analyzeStats(stats, timestamp) {
    const { raceConditions, contactCache, system } = stats;

    // Verificar erros de race condition
    if (raceConditions.todayErrors > 0) {
      console.log(`🚨 [${timestamp}] ERROS DETECTADOS: ${raceConditions.todayErrors} hoje, ${raceConditions.totalErrors} total`);
      
      if (raceConditions.todayErrors >= CONFIG.ALERT_THRESHOLD.ERRORS_PER_HOUR) {
        this.sendAlert('HIGH_ERROR_RATE', `${raceConditions.todayErrors} erros detectados hoje`);
      }
    } else {
      console.log(`✅ [${timestamp}] Sistema estável - 0 erros`);
    }

    // Verificar performance do cache
    const cacheHitRate = parseFloat(contactCache.hitRate.replace('%', ''));
    if (cacheHitRate < (100 - CONFIG.ALERT_THRESHOLD.CACHE_MISS_RATE)) {
      console.log(`⚠️ [${timestamp}] Taxa de cache baixa: ${contactCache.hitRate}`);
      this.sendAlert('LOW_CACHE_PERFORMANCE', `Taxa de cache: ${contactCache.hitRate}`);
    }

    // Verificar uso de memória
    const memoryUsage = parseFloat(system.memoryUsage.heapUsed.replace(' MB', ''));
    if (memoryUsage > CONFIG.ALERT_THRESHOLD.MEMORY_USAGE_MB) {
      console.log(`⚠️ [${timestamp}] Alto uso de memória: ${system.memoryUsage.heapUsed}`);
      this.sendAlert('HIGH_MEMORY_USAGE', `Memória: ${system.memoryUsage.heapUsed}`);
    }

    // Log resumido a cada verificação
    console.log(`📊 [${timestamp}] Cache: ${contactCache.hitRate} | Memória: ${system.memoryUsage.heapUsed} | Uptime: ${Math.floor(system.uptime/60)}min`);
  }

  checkLogFile() {
    try {
      if (fs.existsSync(CONFIG.LOG_FILE)) {
        const stats = fs.statSync(CONFIG.LOG_FILE);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        if (fileSizeMB > 100) { // Log maior que 100MB
          console.log(`⚠️ Arquivo de log grande: ${fileSizeMB}MB - considere limpeza`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar arquivo de log:', error.message);
    }
  }

  async sendAlert(type, message) {
    const alertData = {
      timestamp: new Date().toISOString(),
      type,
      message,
      server: process.env.SERVER_NAME || 'localhost'
    };

    console.log(`🚨 ALERTA: ${type} - ${message}`);

    // Enviar email usando o sistema real
    if (CONFIG.NOTIFICATIONS.EMAIL) {
      await this.emailSender.sendAlert(alertData);
    }

    // Enviar webhook se configurado
    if (CONFIG.NOTIFICATIONS.WEBHOOK) {
      try {
        await axios.post(CONFIG.NOTIFICATIONS.WEBHOOK, alertData);
        console.log('📡 Webhook enviado com sucesso');
      } catch (error) {
        console.error('Erro ao enviar webhook:', error.message);
      }
    }

    // Salvar alerta em arquivo local
    const alertLog = path.join(__dirname, 'alerts.log');
    fs.appendFileSync(alertLog, JSON.stringify(alertData) + '\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('\n🛑 Parando monitor...');
    this.isRunning = false;
  }
}

// Inicialização
const monitor = new RaceConditionMonitor();

// Handlers para parar graciosamente
process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  monitor.stop();
  process.exit(0);
});

// Verificar se o backend está rodando antes de iniciar
async function checkBackend() {
  try {
    await axios.get(`${CONFIG.API_URL}/race-conditions/stats`, { timeout: 5000 });
    console.log('✅ Backend está respondendo!');
    monitor.start();
  } catch (error) {
    console.error('❌ Backend não está respondendo. Verifique se está rodando na porta correta.');
    console.error(`   URL testada: ${CONFIG.API_URL}/race-conditions/stats`);
    process.exit(1);
  }
}

checkBackend(); 