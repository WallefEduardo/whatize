const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const EmailSender = require('./emailSender');

// Função para detectar a URL do backend baseada no ambiente
function getBackendUrl() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const port = process.env.PORT || '4000';
    
    if (nodeEnv === 'production') {
        // Em produção, usar o domínio configurado
        const domainUrl = process.env.DOMAIN_URL;
        if (domainUrl && domainUrl !== 'https://seudominio.com.br') {
            return domainUrl;
        }
        // Fallback para localhost se domínio não configurado
        return `http://localhost:${port}`;
    } else {
        // Em desenvolvimento, usar localhost
        return `http://localhost:${port}`;
    }
}

const BACKEND_URL = getBackendUrl();
const API_URL = `${BACKEND_URL}/race-conditions/stats`;
const LOG_FILE = path.join(__dirname, '../../logs/race_conditions.log');
const CHECK_INTERVAL = 300000; // 5 minutos (mais apropriado para produção)

// Configurações de alertas
const ALERT_THRESHOLDS = {
    MAX_ERRORS_PER_HOUR: 5,
    LOW_CACHE_PERFORMANCE: 10, // %
    HIGH_MEMORY_USAGE: 500 // MB
};

class RaceConditionMonitor {
    constructor() {
        this.isRunning = false;
        this.stats = {
            totalChecks: 0,
            errors: 0,
            lastCheck: null,
            alerts: []
        };
        
        // Garantir que o diretório de logs existe
        const logDir = path.dirname(LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        this.emailSender = new EmailSender();
    }

    async checkBackend() {
        try {
            const response = await axios.get(API_URL, { 
                timeout: 15000,
                headers: {
                    'User-Agent': 'TalkZap-Monitor/2.0'
                }
            });
            return { success: true, data: response.data };
        } catch (error) {
            // Se for erro de timeout/rede, aguardar antes de reportar
            if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
                console.log(`⚠️ [${this.formatDateTime()}] Erro de rede: ${error.message} - Tentando novamente em 30s`);
                await new Promise(resolve => setTimeout(resolve, 30000));
                
                // Segunda tentativa
                try {
                    const retryResponse = await axios.get(API_URL, { timeout: 15000 });
                    return { success: true, data: retryResponse.data };
                } catch (retryError) {
                    return { 
                        success: false, 
                        error: retryError.message,
                        code: retryError.code || 'UNKNOWN'
                    };
                }
            }
            
            return { 
                success: false, 
                error: error.message,
                code: error.code || 'UNKNOWN'
            };
        }
    }

    formatDateTime() {
        return new Date().toLocaleString('pt-BR');
    }

    logMessage(message, type = 'INFO') {
        const timestamp = this.formatDateTime();
        const logEntry = `[${timestamp}] ${type}: ${message}`;
        
        console.log(logEntry);
        
        try {
            fs.appendFileSync(LOG_FILE, logEntry + '\n');
        } catch (error) {
            console.error('Erro ao escrever no log:', error.message);
        }
    }

    async sendAlert(type, message, data = {}) {
        const alert = {
            type,
            message,
            timestamp: new Date().toISOString(),
            server: process.env.SERVER_NAME || 'Whatize Server',
            data
        };

        this.stats.alerts.push(alert);
        this.logMessage(`ALERTA: ${type} - ${message}`, 'ALERT');

        // Enviar email se configurado
        if (process.env.ALERT_EMAIL) {
            try {
                await this.emailSender.sendAlert(alert);
                console.log(`📧 Alerta por email enviado: ${type}`);
            } catch (error) {
                this.logMessage(`Erro ao enviar email: ${error.message}`, 'ERROR');
            }
        }

        // Webhook se configurado
        const webhookUrl = process.env.ALERT_WEBHOOK;
        if (webhookUrl) {
            try {
                await axios.post(webhookUrl, alert, { timeout: 5000 });
            } catch (error) {
                this.logMessage(`Erro ao enviar webhook: ${error.message}`, 'ERROR');
            }
        }
    }

    analyzeStats(data) {
        const alerts = [];
        
        // Verificar erros de race condition com proteção
        const todayErrors = data.raceConditions?.todayErrors || 0;
        if (todayErrors > 0) {
            alerts.push({
                type: 'RACE_CONDITION_ERRORS',
                message: `${todayErrors} erros de race condition hoje`,
                severity: todayErrors > 5 ? 'HIGH' : 'MEDIUM'
            });
        }

        // Verificar performance do cache com proteção
        const hitRateStr = data.contactCache?.hitRate || "0%";
        const cacheHitRate = parseFloat(hitRateStr.replace('%', ''));
        const cacheMisses = data.contactCache?.misses || 0;
        if (cacheHitRate < ALERT_THRESHOLDS.LOW_CACHE_PERFORMANCE && cacheMisses > 10) {
            alerts.push({
                type: 'LOW_CACHE_PERFORMANCE',
                message: `Taxa de cache baixa: ${hitRateStr}`,
                severity: 'MEDIUM'
            });
        }

        // Verificar uso de memória com proteção
        const memoryStr = data.contactCache?.memoryUsage || "0 MB";
        const memoryUsage = parseFloat(memoryStr.replace(' MB', ''));
        if (memoryUsage > ALERT_THRESHOLDS.HIGH_MEMORY_USAGE) {
            alerts.push({
                type: 'HIGH_MEMORY_USAGE',
                message: `Alto uso de memória: ${memoryStr}`,
                severity: 'HIGH'
            });
        }

        // Verificar erros de download de imagem com proteção
        if (data.imageDownload) {
            const errors502 = data.imageDownload.errors502 || 0;
            const totalErrors = data.imageDownload.totalErrors || 0;
            
            if (errors502 > 5) {
                alerts.push({
                    type: 'IMAGE_DOWNLOAD_502_ERRORS',
                    message: `${errors502} erros 502 no download de imagens (24h)`,
                    severity: 'HIGH'
                });
            }
            
            if (totalErrors > 20) {
                alerts.push({
                    type: 'HIGH_IMAGE_DOWNLOAD_ERRORS',
                    message: `${totalErrors} erros de download de imagem (24h)`,
                    severity: 'MEDIUM'
                });
            }
        }

        return alerts;
    }

    async performCheck() {
        this.stats.totalChecks++;
        this.stats.lastCheck = new Date();

        const result = await this.checkBackend();

        if (!result.success) {
            this.stats.errors++;
            this.logMessage(`Erro na verificação: ${result.error}`, 'ERROR');
            
            await this.sendAlert(
                'BACKEND_OFFLINE',
                `Backend não está respondendo: ${result.error}`,
                { url: API_URL, error: result.error, code: result.code }
            );
            return;
        }

        const data = result.data;
        
        // Verificar se a estrutura de dados está completa
        if (!data || !data.data) {
            console.error(`❌ [${this.formatDateTime()}] Estrutura de dados inválida:`, data);
            return;
        }

        const stats = data.data;
        
        // Análise básica com proteção
        const todayErrors = stats.raceConditions?.todayErrors || 0;
        if (todayErrors === 0) {
            console.log(`✅ [${this.formatDateTime()}] Sistema estável - 0 erros`);
        } else {
            console.log(`⚠️ [${this.formatDateTime()}] ${todayErrors} erros hoje`);
        }

        // Verificar cache performance com proteção
        const cacheHitRate = parseFloat((stats.contactCache?.hitRate || "0%").replace('%', ''));
        const cacheMisses = stats.contactCache?.misses || 0;
        if (cacheHitRate < ALERT_THRESHOLDS.LOW_CACHE_PERFORMANCE && cacheMisses > 0) {
            console.log(`⚠️ [${this.formatDateTime()}] Taxa de cache baixa: ${stats.contactCache?.hitRate || "0%"}`);
        }

        // Análise detalhada e alertas com proteção
        const alerts = this.analyzeStats(stats);
        for (const alert of alerts) {
            await this.sendAlert(alert.type, alert.message, stats);
        }

        // Log de status resumido com proteção
        const uptime = Math.floor((stats.system?.uptime || 0) / 60);
        const memoryMB = stats.contactCache?.memoryUsage || "0 MB";
        const imageErrors = stats.imageDownload?.totalErrors || 0;
        console.log(`📊 [${this.formatDateTime()}] Cache: ${stats.contactCache?.hitRate || "0%"} | Memória: ${memoryMB} | Imagens: ${imageErrors} erros | Uptime: ${uptime}min`);
    }

    async start() {
        if (this.isRunning) {
            console.log('Monitor já está rodando!');
            return;
        }

        this.isRunning = true;
        
        console.log('🚀 MONITOR DE RACE CONDITIONS - PRODUÇÃO');
        console.log('==========================================');
        console.log(`📡 API: ${API_URL}`);
        console.log(`⏱️  Intervalo: ${CHECK_INTERVAL / 1000}s`);
        console.log(`📁 Log: ${LOG_FILE}`);
        console.log('==========================================');

        // Verificar se backend está respondendo
        const initialCheck = await this.checkBackend();
        if (initialCheck.success) {
            console.log('✅ Backend está respondendo!');
        } else {
            console.log('❌ Backend não está respondendo!');
            console.log(`   Erro: ${initialCheck.error}`);
            console.log(`   URL testada: ${API_URL}`);
            
            // Continuar mesmo assim para tentar reconectar
        }

        // Loop principal
        const interval = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(interval);
                return;
            }

            try {
                await this.performCheck();
            } catch (error) {
                this.logMessage(`Erro no monitor: ${error.message}`, 'ERROR');
            }
        }, CHECK_INTERVAL);

        // Primeira verificação imediata
        setTimeout(() => this.performCheck(), 1000);

        // Handlers para parada graceful
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        console.log('\n🛑 Parando monitor...');
        
        // Log de estatísticas finais
        this.logMessage(`Monitor parado. Estatísticas: ${this.stats.totalChecks} verificações, ${this.stats.errors} erros`, 'INFO');
        
        process.exit(0);
    }

    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            backendUrl: BACKEND_URL,
            apiUrl: API_URL
        };
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const monitor = new RaceConditionMonitor();
    monitor.start().catch(error => {
        console.error('Erro ao iniciar monitor:', error);
        process.exit(1);
    });
}

module.exports = RaceConditionMonitor; 