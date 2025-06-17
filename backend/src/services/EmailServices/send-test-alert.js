const EmailSender = require('./emailSender');

async function sendTestAlert() {
  console.log('🧪 ENVIANDO ALERTA DE TESTE');
  console.log('============================\n');

  const emailSender = new EmailSender();
  
  // Aguardar um pouco para a configuração ser carregada
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Dados de teste para o alerta REAL
  const testAlertData = {
    timestamp: new Date().toISOString(),
    type: 'TEST_ALERT',
    message: '🚨 TESTE DE ALERTA - Este é um teste do sistema de alertas por email do Whatize Monitor',
    details: {
      servidor: process.env.SERVER_NAME || 'servidor-teste',
      horario: new Date().toLocaleString('pt-BR'),
      sistema: 'Whatize Monitor v2.0',
      motivo: 'Teste manual solicitado pelo usuário'
    },
    server: process.env.SERVER_NAME || 'servidor-teste'
  };

  console.log('📧 Enviando alerta de teste...\n');
  console.log('Dados do alerta:');
  console.log(`   📧 Email destino: ${process.env.ALERT_EMAIL || 'NÃO CONFIGURADO'}`);
  console.log(`   🖥️  Servidor: ${testAlertData.server}`);
  console.log(`   ⏰ Horário: ${testAlertData.details.horario}`);
  console.log(`   🔧 Tipo: ${testAlertData.type}`);
  console.log(`   📝 Mensagem: ${testAlertData.message}\n`);

  let result = false;
  
  try {
    result = await emailSender.sendAlert(testAlertData);
    
    if (result) {
      console.log('✅ ALERTA DE TESTE ENVIADO COM SUCESSO!');
      console.log('   📧 O email foi enviado com sucesso.');
      console.log('   📬 Verifique sua caixa de entrada (e spam).');
      console.log('   🎉 Sistema de alertas está funcionando corretamente!');
      
      // Log adicional para debug
      console.log('\n📊 INFORMAÇÕES TÉCNICAS:');
      console.log(`   SMTP Host: ${process.env.MAIL_HOST || 'NÃO CONFIGURADO'}`);
      console.log(`   SMTP Port: ${process.env.MAIL_PORT || 'NÃO CONFIGURADO'}`);
      console.log(`   SMTP User: ${process.env.MAIL_USER || 'NÃO CONFIGURADO'}`);
      console.log(`   Email From: ${process.env.MAIL_FROM || 'NÃO CONFIGURADO'}`);
      console.log(`   Alert Email: ${process.env.ALERT_EMAIL || 'NÃO CONFIGURADO'}`);
      
    } else {
      console.log('⚠️ ALERTA EXECUTADO EM MODO SIMULAÇÃO');
      console.log('   📧 O email não foi enviado porque:');
      console.log('   - Configurações SMTP não estão completas no .env');
      console.log('   - Ou houve erro na conexão SMTP');
      console.log('   - Verifique as configurações e tente novamente');
    }
    
  } catch (error) {
    console.error('❌ ERRO AO ENVIAR ALERTA DE TESTE:', error.message);
    
    // Diagnóstico detalhado do erro
    console.log('\n🔍 DIAGNÓSTICO DO ERRO:');
    
    if (error.message.includes('Invalid login')) {
      console.log('   🚨 ERRO DE AUTENTICAÇÃO:');
      console.log('   - Verifique se o email e senha estão corretos');
      console.log('   - Para Gmail, use senha de app, não senha normal');
      console.log('   - Verifique se a autenticação de 2 fatores está ativa');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('   🌐 ERRO DE CONEXÃO:');
      console.log('   - Verifique sua conexão com a internet');
      console.log('   - Verifique se o MAIL_HOST está correto');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   🔌 ERRO DE PORTA:');
      console.log('   - Verifique se a MAIL_PORT está correta');
      console.log('   - Gmail usa porta 465 ou 587');
    } else {
      console.log(`   ❓ ERRO DESCONHECIDO: ${error.message}`);
    }
    
    console.log('\n💡 SUGESTÕES:');
    console.log('   1. Verifique as configurações SMTP no .env');
    console.log('   2. Para Gmail, gere uma nova senha de app');
    console.log('   3. Teste com outro provedor de email');
    console.log('   4. Execute: node test-email-alerts.js para mais detalhes');
  }

  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('================');
  
  if (result) {
    console.log('✅ Sistema funcionando! Você pode:');
    console.log('   - Ativar o monitor automático');
    console.log('   - Configurar alertas para produção');
    console.log('   - Monitorar logs em tempo real');
  } else {
    console.log('⚠️  Sistema precisa de ajustes:');
    console.log('   - Reconfigure os emails no painel');
    console.log('   - Verifique as credenciais do Gmail');
    console.log('   - Teste novamente após correções');
  }
  
  return result;
}

// Executar teste se chamado diretamente
if (require.main === module) {
  sendTestAlert().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Erro fatal no teste de alerta:', error);
    process.exit(1);
  });
}

module.exports = sendTestAlert; 