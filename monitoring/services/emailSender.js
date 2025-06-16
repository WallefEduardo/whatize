const nodemailer = require('nodemailer');
require('dotenv').config({ path: './backend/.env' });

class EmailSender {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.setupTransporter();
  }

  setupTransporter() {
    // Verificar se as configurações SMTP estão disponíveis
    const mailConfig = {
      host: process.env.MAIL_HOST,
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
      from: process.env.MAIL_FROM,
      port: process.env.MAIL_PORT || 465
    };

    // Verificar se todas as configurações necessárias estão presentes
    if (!mailConfig.host || !mailConfig.user || !mailConfig.pass || !mailConfig.from) {
      console.log('⚠️ Configurações SMTP não encontradas no .env - emails serão apenas simulados');
      console.log('💡 Para ativar emails reais, configure no .env:');
      console.log('   MAIL_HOST=smtp.gmail.com');
      console.log('   MAIL_USER=seu-email@gmail.com');
      console.log('   MAIL_PASS=sua-senha-de-app');
      console.log('   MAIL_FROM=seu-email@gmail.com');
      console.log('   MAIL_PORT=465');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: mailConfig.host,
        port: parseInt(mailConfig.port),
        secure: parseInt(mailConfig.port) === 465, // true para 465, false para outros
        auth: {
          user: mailConfig.user,
          pass: mailConfig.pass
        },
        tls: {
          rejectUnauthorized: false // Para desenvolvimento
        }
      });

      this.fromEmail = mailConfig.from;
      this.isConfigured = true;
      console.log('✅ Configuração SMTP carregada com sucesso');
      
      // Testar conexão
      this.testConnection();
      
    } catch (error) {
      console.error('❌ Erro ao configurar SMTP:', error.message);
      this.isConfigured = false;
    }
  }

  async testConnection() {
    if (!this.isConfigured) return false;

    try {
      await this.transporter.verify();
      console.log('✅ Conexão SMTP testada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão SMTP:', error.message);
      console.log('💡 Verifique suas configurações de email no .env');
      this.isConfigured = false;
      return false;
    }
  }

  async sendAlert(alertData) {
    const { type, message, server, timestamp } = alertData;
    const alertEmail = process.env.ALERT_EMAIL;

    if (!alertEmail) {
      console.log('⚠️ ALERT_EMAIL não configurado no .env');
      return false;
    }

    if (!this.isConfigured) {
      console.log(`📧 [SIMULADO] Email para: ${alertEmail}`);
      console.log(`   Assunto: 🚨 ALERTA: ${type} - ${server}`);
      console.log(`   Mensagem: ${message}`);
      return false;
    }

    const emailSubject = `🚨 ALERTA: ${type} - ${server}`;
    const emailBody = this.generateEmailBody(alertData);

    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: alertEmail,
        subject: emailSubject,
        html: emailBody,
        text: this.generateTextBody(alertData)
      });

      console.log(`✅ Email enviado com sucesso para: ${alertEmail}`);
      console.log(`   Message ID: ${info.messageId}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${alertEmail}:`, error.message);
      
      // Fallback para simulação se houver erro
      console.log(`📧 [FALLBACK] Email simulado para: ${alertEmail}`);
      console.log(`   Assunto: ${emailSubject}`);
      console.log(`   Erro SMTP: ${error.message}`);
      return false;
    }
  }

  generateEmailBody(alertData) {
    const { type, message, server, timestamp } = alertData;
    
    const typeEmojis = {
      'HIGH_ERROR_RATE': '🚨',
      'LOW_CACHE_PERFORMANCE': '⚠️',
      'HIGH_MEMORY_USAGE': '💾',
      'BACKEND_DOWN': '🔴'
    };

    const emoji = typeEmojis[type] || '⚠️';
    const formattedTime = new Date(timestamp).toLocaleString('pt-BR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Alerta do Sistema</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #d32f2f; text-align: center;">
                ${emoji} ALERTA DO SISTEMA WHATIZE
            </h2>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #d32f2f;">Detalhes do Alerta:</h3>
                <p><strong>Tipo:</strong> ${type}</p>
                <p><strong>Servidor:</strong> ${server}</p>
                <p><strong>Mensagem:</strong> ${message}</p>
                <p><strong>Data/Hora:</strong> ${formattedTime}</p>
            </div>

            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1976d2;">Ações Recomendadas:</h3>
                <ul>
                    <li>Verificar status: <code>curl http://localhost:4000/race-conditions/stats</code></li>
                    <li>Ver logs: <code>tail -f backend/logs/race_conditions.log</code></li>
                    <li>Investigar erros: <code>grep "CONSTRAINT_ERROR" backend/logs/race_conditions.log | tail -10</code></li>
                </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                    Este é um alerta automático do sistema de monitoramento Whatize<br>
                    Gerado em: ${formattedTime}
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  generateTextBody(alertData) {
    const { type, message, server, timestamp } = alertData;
    const formattedTime = new Date(timestamp).toLocaleString('pt-BR');

    return `
🚨 ALERTA DO SISTEMA WHATIZE

Tipo: ${type}
Servidor: ${server}
Mensagem: ${message}
Data/Hora: ${formattedTime}

Ações Recomendadas:
- Verificar status: curl http://localhost:4000/race-conditions/stats
- Ver logs: tail -f backend/logs/race_conditions.log
- Investigar erros: grep "CONSTRAINT_ERROR" backend/logs/race_conditions.log | tail -10

Este é um alerta automático do sistema de monitoramento Whatize
Gerado em: ${formattedTime}
    `;
  }
}

module.exports = EmailSender; 