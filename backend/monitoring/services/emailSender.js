const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

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
      this.transporter = nodemailer.createTransport({
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

  parseEmailList(emailString) {
    if (!emailString) return [];
    
    // Suporta vírgula, ponto e vírgula ou espaço como separadores
    return emailString
      .split(/[,;|\s]+/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
  }

  async sendAlert(alertData) {
    const { type, message, server, timestamp } = alertData;
    const alertEmailConfig = process.env.ALERT_EMAIL;

    if (!alertEmailConfig) {
      console.log('⚠️ ALERT_EMAIL não configurado no .env');
      return false;
    }

    // Suportar múltiplos emails
    const emailList = this.parseEmailList(alertEmailConfig);
    
    if (emailList.length === 0) {
      console.log('⚠️ Nenhum email válido encontrado em ALERT_EMAIL');
      return false;
    }

    console.log(`📧 Enviando alerta para ${emailList.length} email(s): ${emailList.join(', ')}`);

    if (!this.isConfigured) {
      console.log(`📧 [SIMULADO] Emails para: ${emailList.join(', ')}`);
      console.log(`   Assunto: 🚨 ALERTA: ${type} - ${server}`);
      console.log(`   Mensagem: ${message}`);
      return false;
    }

    const emailSubject = `🚨 ALERTA: ${type} - ${server}`;
    const emailBody = this.generateEmailBody(alertData);

    let successCount = 0;
    let errorCount = 0;

    // Enviar para cada email individualmente
    for (const email of emailList) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromEmail,
          to: email,
          subject: emailSubject,
          html: emailBody,
          text: this.generateTextBody(alertData)
        });

        console.log(`✅ Email enviado com sucesso para: ${email}`);
        console.log(`   Message ID: ${info.messageId}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Erro ao enviar email para ${email}:`, error.message);
        
        // Fallback para simulação se houver erro
        console.log(`📧 [FALLBACK] Email simulado para: ${email}`);
        console.log(`   Assunto: ${emailSubject}`);
        console.log(`   Erro SMTP: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`📊 Resultado: ${successCount} enviados, ${errorCount} erros de ${emailList.length} emails`);
    
    return successCount > 0; // Retorna true se pelo menos um email foi enviado
  }

  async sendTestEmail() {
    const alertEmailConfig = process.env.ALERT_EMAIL;
    
    if (!alertEmailConfig) {
      console.log('⚠️ ALERT_EMAIL não configurado no .env');
      return false;
    }

    const emailList = this.parseEmailList(alertEmailConfig);
    
    if (emailList.length === 0) {
      console.log('⚠️ Nenhum email válido encontrado em ALERT_EMAIL');
      return false;
    }

    console.log(`🧪 Testando envio para ${emailList.length} email(s): ${emailList.join(', ')}`);

    const testAlertData = {
      type: 'TEST_ALERT',
      message: 'Este é um teste do sistema de múltiplos emails',
      server: process.env.SERVER_NAME || 'TalkZap Test Server',
      timestamp: new Date().toISOString(),
      data: { test: true }
    };

    return await this.sendAlert(testAlertData);
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
                    <li>Verificar status: <code>curl ${process.env.BACKEND_URL || 'http://localhost:4000'}/race-conditions/stats</code></li>
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
- Verificar status: curl ${process.env.BACKEND_URL || 'http://localhost:4000'}/race-conditions/stats
- Ver logs: tail -f backend/logs/race_conditions.log
- Investigar erros: grep "CONSTRAINT_ERROR" backend/logs/race_conditions.log | tail -10

Este é um alerta automático do sistema de monitoramento Whatize
Gerado em: ${formattedTime}
    `;
  }
}

module.exports = EmailSender; 