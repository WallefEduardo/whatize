#!/usr/bin/env node

// Script direto que simula a chamada do controller
const path = require('path');

// Simular environment
process.env.NODE_ENV = 'development';

async function testDirectQR() {
  console.log('🧪 [TESTE-DIRETO] Testando chamada direta do controller...\n');
  
  try {
    // Importar o SessionManager diretamente
    const { sessionManager } = require('./dist/libs/WhatsAppSessionManager');
    
    const whatsappId = 20;
    const companyId = 1;
    
    console.log(`🔄 [TESTE-DIRETO] Iniciando teste para WhatsApp ${whatsappId}...`);
    
    // 1. Verificar estado atual
    const currentState = sessionManager.getState(whatsappId);
    console.log(`📊 [TESTE-DIRETO] Estado atual: ${currentState}`);
    
    // 2. Desconectar se conectado
    if (currentState === 'CONNECTED') {
      console.log(`🔌 [TESTE-DIRETO] Desconectando WhatsApp ${whatsappId}...`);
      await sessionManager.disconnect(whatsappId, companyId);
      
      // Aguardar desconexão
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log(`✅ [TESTE-DIRETO] Desconexão concluída. Novo estado: ${sessionManager.getState(whatsappId)}`);
    }
    
    // 3. Tentar conectar (novo QR)
    console.log(`\n🚀 [TESTE-DIRETO] Solicitando novo QR Code...`);
    
    // Limpar sessão no banco primeiro
    const Whatsapp = require('./dist/models/Whatsapp');
    const whatsapp = await Whatsapp.findByPk(whatsappId);
    if (whatsapp) {
      await whatsapp.update({ session: "" });
      console.log(`🧹 [TESTE-DIRETO] Sessão do banco limpa`);
    }
    
    // Tentar conectar
    sessionManager.connect(whatsappId, companyId).catch(error => {
      console.log(`⚠️ [TESTE-DIRETO] Erro assíncrono: ${error.message}`);
    });
    
    console.log(`\n📋 [TESTE-DIRETO] Comando enviado! Monitor os logs para:`);
    console.log(`   🗑️ [AUTH-CLEANUP] - Limpeza do cache`);
    console.log(`   🔐 [AUTH-STATE] - Estado da autenticação`);
    console.log(`   📱 [QR-CODE] - Geração do QR Code`);
    
    // Aguardar um pouco para ver os primeiros logs
    console.log(`\n⏳ [TESTE-DIRETO] Aguardando 10 segundos para resultados iniciais...\n`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log(`📊 [TESTE-DIRETO] Estado final: ${sessionManager.getState(whatsappId)}`);
    
  } catch (error) {
    console.error(`❌ [TESTE-DIRETO] Erro:`, error.message);
  }
}

testDirectQR().then(() => {
  console.log('\n✅ [TESTE-DIRETO] Script concluído!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ [TESTE-DIRETO] Erro fatal:', error);
  process.exit(1);
});