#!/usr/bin/env node

const axios = require('axios');

// Configurações
const BASE_URL = 'https://backend.whatize.pro';
const WHATSAPP_ID = 20; // ID da conexão "Conexão"
const COMPANY_ID = 1;

// Token de autenticação (você precisa pegar um token válido)
const AUTH_TOKEN = 'SEU_TOKEN_AQUI'; // Substitua por um token válido

// Headers padrão
const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testQRCodeFlow() {
  console.log('🧪 [TESTE-QR] Iniciando teste automatizado do fluxo QR Code...');
  
  try {
    // 1. Solicitar novo QR Code (simula clique no botão)
    console.log(`\n🔄 [TESTE-QR] Solicitando novo QR Code para WhatsApp ${WHATSAPP_ID}...`);
    
    const response = await axios.put(
      `${BASE_URL}/whatsappsession/${WHATSAPP_ID}`,
      {},
      { headers }
    );
    
    console.log(`✅ [TESTE-QR] Resposta recebida:`, {
      status: response.status,
      message: response.data.message,
      state: response.data.state
    });
    
    // 2. Aguardar e monitorar logs
    console.log(`\n⏳ [TESTE-QR] Aguardando processamento... (monitor os logs do PM2)`);
    console.log(`\n📋 [TESTE-QR] Logs esperados:`);
    console.log(`   🗑️ [AUTH-CLEANUP] Encontradas X chaves para deletar`);
    console.log(`   ✅ [AUTH-CLEANUP] TODOS os dados foram LIMPOS`);
    console.log(`   🔐 [AUTH-STATE] HasAuthData: false`);
    console.log(`   📱 [QR-CODE] QR Code GERADO`);
    
  } catch (error) {
    console.error(`❌ [TESTE-QR] Erro:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

async function disconnectWhatsApp() {
  console.log('🔌 [TESTE-QR] Desconectando WhatsApp...');
  
  try {
    const response = await axios.delete(
      `${BASE_URL}/whatsappsession/${WHATSAPP_ID}`,
      { headers }
    );
    
    console.log(`✅ [TESTE-QR] WhatsApp desconectado:`, {
      status: response.status,
      message: response.data.message
    });
    
    // Aguardar desconexão completa
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error(`❌ [TESTE-QR] Erro ao desconectar:`, error.response?.data);
  }
}

async function getWhatsAppStatus() {
  console.log('📊 [TESTE-QR] Verificando status atual...');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/whatsapp`,
      { headers }
    );
    
    const conexao = response.data.whatsapps?.find(w => w.id === WHATSAPP_ID);
    if (conexao) {
      console.log(`📋 [TESTE-QR] Status da Conexão:`, {
        id: conexao.id,
        name: conexao.name,
        status: conexao.status,
        session: conexao.session ? 'HAS_SESSION' : 'EMPTY',
        qrcode: conexao.qrcode ? 'HAS_QR' : 'NO_QR'
      });
    }
    
  } catch (error) {
    console.error(`❌ [TESTE-QR] Erro ao verificar status:`, error.response?.data);
  }
}

async function fullTest() {
  console.log('🚀 [TESTE-QR] === TESTE COMPLETO DO FLUXO QR CODE ===\n');
  
  // 1. Status inicial
  await getWhatsAppStatus();
  
  // 2. Desconectar (se conectado)
  await disconnectWhatsApp();
  
  // 3. Aguardar
  console.log('\n⏳ [TESTE-QR] Aguardando 5 segundos...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 4. Novo QR Code
  await testQRCodeFlow();
  
  // 5. Status final
  console.log('\n⏳ [TESTE-QR] Aguardando 3 segundos para status final...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  await getWhatsAppStatus();
  
  console.log('\n✅ [TESTE-QR] Teste concluído! Verifique os logs do PM2.');
}

// Executar baseado no argumento
const command = process.argv[2];

switch (command) {
  case 'qr':
    testQRCodeFlow();
    break;
  case 'disconnect':
    disconnectWhatsApp();
    break;
  case 'status':
    getWhatsAppStatus();
    break;
  case 'full':
  default:
    fullTest();
    break;
}