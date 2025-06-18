const axios = require('axios');
const fs = require('fs');
const path = require('path');
const EmailSender = require('./monitoring/services/emailSender');

// Configuração do monitoramento
const CONFIG = {
  BASE_URL: process.env.BACKEND_URL || 'http://localhost:4035',
  MONITOR_INTERVAL: 60000, // 1 minuto
  ALERT_THRESHOLD: 5, // Alerta se mais de 5 erros por hora
  LOG_FILE: path.join(__dirname, 'logs', 'monitor.log'),
  WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || null // Para alertas no Slack
};

class RaceConditionMonitor {
  constructor() {
    this.isRunning = false;
    this.lastStats = null;
    this.alertsSent = new Set();
    this.emailSender = new EmailSender();
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(CONFIG.LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(`${level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : 'ℹ️'} ${message}`);
    
    try {
      fs.appendFileSync(CONFIG.LOG_FILE, logEntry);
    } catch (error) {
      console.error('Erro ao escrever log:', error.message);
    }
  }

  async fetchStats() {
    try {
      const response = await axios.get(`${CONFIG.BASE_URL}/race-conditions/stats`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      this.log(`Erro ao buscar estatísticas: ${error.message}`, 'ERROR');
      return null;
    }
  }

  async sendAlert(message, level = 'warning') {
    const alertKey = `${level}-${Date.now()}`;
    
    // Evita spam de alertas
    if (this.alertsSent.has(alertKey)) return;
    this.alertsSent.add(alertKey);
    
    // Remove alertas antigos (mais de 1 hora)
    setTimeout(() => this.alertsSent.delete(alertKey), 3600000);

    this.log(`ALERTA: ${message}`, 'WARN');

    // Dados do alerta para email
    const alertData = {
      type: level === 'critical' ? 'CRITICAL_ERROR' : 'WARNING',
      message,
      server: process.env.SERVER_NAME || 'TalkZap Server',
      timestamp: new Date().toISOString()
    };

    // Enviar email se configurado
    if (process.env.ALERT_EMAIL) {
      try {
        await this.emailSender.sendAlert(alertData);
        this.log(`Email enviado para: ${process.env.ALERT_EMAIL}`, 'INFO');
      } catch (error) {
        this.log(`Erro ao enviar email: ${error.message}`, 'ERROR');
      }
    }

    // Envia para Slack se configurado
    if (CONFIG.WEBHOOK_URL) {
      try {
        await axios.post(CONFIG.WEBHOOK_URL, {
          text: `🚨 *Race Condition Monitor Alert*\n${message}`,
          channel: '#alerts',
          username: 'RaceConditionBot'
        });
      } catch (error) {
        this.log(`Erro ao enviar alerta para Slack: ${error.message}`, 'ERROR');
      }
    }
  }

  analyzeStats(currentStats, previousStats) {
    if (!currentStats) return;

    const analysis = {
      newErrors: 0,
      cacheEfficiency: 0,
      memoryUsage: 0,
      alerts: []
    };

    // Analisa novos erros
    if (previousStats) {
      analysis.newErrors = currentStats.raceConditions.todayErrors - previousStats.raceConditions.todayErrors;
      
      if (analysis.newErrors > 0) {
        analysis.alerts.push(`${analysis.newErrors} novos erros de race condition detectados`);
      }
    }

    // Analisa eficiência do cache
    const cacheStats = currentStats.contactCache;
    if (cacheStats.hits + cacheStats.misses > 0) {
      analysis.cacheEfficiency = (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100;
      
      if (analysis.cacheEfficiency < 70) {
        analysis.alerts.push(`Eficiência do cache baixa: ${analysis.cacheEfficiency.toFixed(1)}%`);
      }
    }

    // Analisa uso de memória
    const memoryMB = parseFloat(currentStats.system.memoryUsage.heapUsed);
    analysis.memoryUsage = memoryMB;
    
    if (memoryMB > 500) { // Alerta se usar mais de 500MB
      analysis.alerts.push(`Alto uso de memória: ${memoryMB.toFixed(1)}MB`);
    }

    // Verifica se há muitos erros por hora
    if (currentStats.raceConditions.todayErrors > CONFIG.ALERT_THRESHOLD) {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 3600000);
      
      // Aqui você poderia implementar lógica mais sofisticada para contar erros por hora
      if (analysis.newErrors >= CONFIG.ALERT_THRESHOLD) {
        analysis.alerts.push(`Muitos erros detectados: ${analysis.newErrors} na última verificação`);
      }
    }

    return analysis;
  }

  async performHealthCheck() {
    this.log('Executando verificação de saúde do sistema...');
    
    const stats = await this.fetchStats();
    if (!stats) {
      await this.sendAlert('Sistema não está respondendo às verificações de saúde', 'critical');
      return false;
    }

    const analysis = this.analyzeStats(stats, this.lastStats);
    
    // Log das estatísticas atuais
    this.log(`Estatísticas: Erros hoje: ${stats.raceConditions.todayErrors}, Cache: ${analysis.cacheEfficiency.toFixed(1)}%, Memória: ${analysis.memoryUsage.toFixed(1)}MB`);

    // Envia alertas se necessário
    for (const alert of analysis.alerts) {
      await this.sendAlert(alert);
    }

    // Atualiza estatísticas anteriores
    this.lastStats = stats;
    
    return true;
  }

  async start() {
    if (this.isRunning) {
      this.log('Monitor já está em execução', 'WARN');
      return;
    }

    this.isRunning = true;
    this.log('Iniciando monitoramento de race conditions...');
    this.log(`Intervalo de verificação: ${CONFIG.MONITOR_INTERVAL / 1000}s`);
    this.log(`Limite de alerta: ${CONFIG.ALERT_THRESHOLD} erros`);

    // Primeira verificação
    await this.performHealthCheck();

    // Configura verificações periódicas
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.performHealthCheck();
      }
    }, CONFIG.MONITOR_INTERVAL);

    this.log('Monitor iniciado com sucesso');
  }

  stop() {
    if (!this.isRunning) {
      this.log('Monitor não está em execução', 'WARN');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.log('Monitor parado');
  }

  async generateReport() {
    this.log('Gerando relatório de monitoramento...');
    
    const stats = await this.fetchStats();
    if (!stats) {
      this.log('Não foi possível gerar relatório - sistema não responde', 'ERROR');
      return;
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: stats.raceConditions.totalErrors,
        todayErrors: stats.raceConditions.todayErrors,
        cacheHitRate: stats.contactCache.hitRate,
        systemUptime: `${Math.floor(stats.system.uptime / 3600)}h ${Math.floor((stats.system.uptime % 3600) / 60)}m`,
        memoryUsage: stats.system.memoryUsage.heapUsed
      },
      recommendations: []
    };

    // Adiciona recomendações baseadas nas estatísticas
    if (stats.raceConditions.todayErrors > 0) {
      report.recommendations.push('Investigar logs de race conditions para identificar padrões');
    }

    if (parseFloat(stats.contactCache.hitRate) < 80) {
      report.recommendations.push('Considerar aumentar TTL do cache ou pré-carregar mais contatos');
    }

    if (parseFloat(stats.system.memoryUsage.heapUsed) > 300) {
      report.recommendations.push('Monitorar uso de memória - considerar otimizações');
    }

    const reportFile = path.join(__dirname, 'logs', `report-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log(`Relatório salvo em: ${reportFile}`);
    console.log('\n📊 RELATÓRIO DE MONITORAMENTO:');
    console.log('================================');
    console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`🚨 Erros hoje: ${report.summary.todayErrors}`);
    console.log(`📈 Taxa de acerto do cache: ${report.summary.cacheHitRate}`);
    console.log(`⏱️  Uptime: ${report.summary.systemUptime}`);
    console.log(`💾 Memória: ${report.summary.memoryUsage}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }

    return report;
  }
}

// Função principal
async function main() {
  const monitor = new RaceConditionMonitor();

  // Trata sinais de interrupção
  process.on('SIGINT', () => {
    console.log('\n🛑 Recebido sinal de interrupção...');
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido sinal de término...');
    monitor.stop();
    process.exit(0);
  });

  // Verifica argumentos da linha de comando
  const args = process.argv.slice(2);
  
  if (args.includes('--report')) {
    await monitor.generateReport();
    return;
  }

  if (args.includes('--once')) {
    await monitor.performHealthCheck();
    return;
  }

  // Inicia monitoramento contínuo
  await monitor.start();

  // Mantém o processo vivo
  console.log('🔄 Monitor em execução... Pressione Ctrl+C para parar');
}

// Executa se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro fatal no monitor:', error);
    process.exit(1);
  });
}

module.exports = RaceConditionMonitor; 