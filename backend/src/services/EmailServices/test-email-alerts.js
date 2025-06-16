const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const EmailSender = require('./emailSender');

// Caminho para o .env do backend
const envPath = path.join(__dirname, '../../backend/.env');

async function testEmailSystem() {
  console.log('🧪 TESTE DO SISTEMA DE EMAILS');
  console.log('==============================\n');

  const emailSender = new EmailSender();
  
  // Aguardar um pouco para a configuração ser carregada
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Dados de teste para o alerta
  const testAlertData = {
    timestamp: new Date().toISOString(),
    type: 'TEST_ALERT',
    message: 'Este é um teste do sistema de alertas por email',
    server: process.env.SERVER_NAME || 'servidor-teste'
  };

  console.log('📧 Testando envio de email de alerta...\n');
  console.log('Dados do teste:');
  console.log(`   Email destino: ${process.env.ALERT_EMAIL || 'NÃO CONFIGURADO'}`);
  console.log(`   Servidor: ${testAlertData.server}`);
  console.log(`   Tipo: ${testAlertData.type}`);
  console.log(`   Mensagem: ${testAlertData.message}\n`);

  try {
    const result = await emailSender.sendAlert(testAlertData);
    
    if (result) {
      console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
      console.log('   O email foi enviado com sucesso.');
      console.log('   Verifique sua caixa de entrada (e spam).');
    } else {
      console.log('⚠️ TESTE EXECUTADO EM MODO SIMULAÇÃO');
      console.log('   O email não foi enviado porque:');
      console.log('   - Configurações SMTP não estão completas no .env');
      console.log('   - Ou houve erro na conexão SMTP');
    }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
  }

  console.log('\n📋 CONFIGURAÇÕES NECESSÁRIAS NO .env:');
  console.log('=====================================');
  console.log('Para emails funcionarem, você precisa configurar:');
  console.log('');
  console.log('# Configurações SMTP (exemplo Gmail)');
  console.log('MAIL_HOST=smtp.gmail.com');
  console.log('MAIL_PORT=465');
  console.log('MAIL_USER=seu-email@gmail.com');
  console.log('MAIL_PASS=sua-senha-de-app-do-gmail');
  console.log('MAIL_FROM=seu-email@gmail.com');
  console.log('');
  console.log('# Email para receber alertas');
  console.log('ALERT_EMAIL=wallefeduardo@gmail.com');
  console.log('');
  console.log('💡 DICA: Para Gmail, você precisa:');
  console.log('   1. Ativar autenticação de 2 fatores');
  console.log('   2. Gerar uma "senha de app" específica');
  console.log('   3. Usar essa senha no MAIL_PASS');
  console.log('');
  console.log('🔗 Como gerar senha de app Gmail:');
  console.log('   https://support.google.com/accounts/answer/185833');
}

// Executar teste
testEmailSystem().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erro fatal no teste:', error);
  process.exit(1);
}); 