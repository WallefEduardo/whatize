#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');

// Configurações
const BASE_URL = 'http://localhost:4000';
const WHATSAPP_ID = 20;
const LOGIN_EMAIL = 'admin@admin.com';
const LOGIN_PASSWORD = '123456';

let authToken = null;

async function getAuthToken() {
  console.log('🔑 [AUTH] Obtendo token de autenticação...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD
    });
    
    authToken = response.data.token;
    console.log(`✅ [AUTH] Token obtido: ${authToken.substring(0, 20)}...`);
    return authToken;
    
  } catch (error) {
    console.error(`❌ [AUTH] Erro ao obter token:`, error.response?.data || error.message);
    return null;
  }
}

async function testNewQRCode() {
  if (!authToken) {
    console.error('❌ [TESTE] Token não disponível');
    return;
  }
  
  console.log(`\n🧪 [TESTE] Iniciando teste do botão "Novo QR Code"...`);
  console.log(`🎯 [TESTE] WhatsApp ID: ${WHATSAPP_ID}`);
  
  try {
    // Fazer requisição PUT para simular botão "Novo QR Code"
    console.log(`🔄 [TESTE] Enviando PUT /whatsappsession/${WHATSAPP_ID}...`);
    
    const response = await axios.put(
      `${BASE_URL}/whatsappsession/${WHATSAPP_ID}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ [TESTE] Resposta recebida:`, {
      status: response.status,
      message: response.data.message,
      state: response.data.state,
      whatsappId: response.data.whatsappId
    });
    
    console.log(`\n📋 [TESTE] AGUARDANDO LOGS NO PM2...`);
    console.log(`🔍 [TESTE] Logs esperados:`);
    console.log(`   🧹 [UPDATE-CONTROLLER] Forçando limpeza completa do cache de autenticação...`);
    console.log(`   🗑️ [AUTH-CLEANUP] Encontradas X chaves para deletar`);
    console.log(`   ✅ [AUTH-CLEANUP] TODOS os dados de autenticação Baileys foram LIMPOS`);
    console.log(`   🔐 [AUTH-STATE] HasAuthData: false`);
    console.log(`   📱 [QR-CODE] QR Code GERADO para Conexão! Tamanho: X chars`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ [TESTE] Erro na requisição:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

async function monitorLogs(duration = 15000) {
  console.log(`\n📊 [MONITOR] Monitorando logs por ${duration/1000} segundos...`);
  console.log(`📝 [MONITOR] Execute em outra aba: pm2 logs whaticket-backend --lines 20 --raw`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`⏰ [MONITOR] Monitoramento concluído`);
      resolve();
    }, duration);
  });
}

async function checkWhatsAppStatus() {
  if (!authToken) return;
  
  console.log(`\n📊 [STATUS] Verificando status atual...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/whatsapp`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const conexao = response.data.whatsapps?.find(w => w.id === WHATSAPP_ID);
    if (conexao) {
      console.log(`📋 [STATUS] Conexão encontrada:`, {
        id: conexao.id,
        name: conexao.name,
        status: conexao.status,
        session: conexao.session ? 'HAS_SESSION' : 'EMPTY_SESSION',
        qrcode: conexao.qrcode ? 'HAS_QR_CODE' : 'NO_QR_CODE'
      });
    } else {
      console.log(`❌ [STATUS] WhatsApp ID ${WHATSAPP_ID} não encontrado`);
    }
    
  } catch (error) {
    console.error(`❌ [STATUS] Erro ao verificar status:`, error.response?.data || error.message);
  }
}

async function fullTest() {
  console.log('🚀 [MAIN] === TESTE AUTOMATIZADO DO BOTÃO "NOVO QR CODE" ===\n');
  
  // 1. Obter token
  const token = await getAuthToken();
  if (!token) {
    console.error('❌ [MAIN] Não foi possível obter token. Finalizando teste.');
    return;
  }
  
  // 2. Status inicial
  await checkWhatsAppStatus();
  
  // 3. Testar novo QR Code
  console.log(`\n⚡ [MAIN] Executando teste principal...`);
  const success = await testNewQRCode();
  
  if (success) {
    // 4. Monitorar logs
    await monitorLogs(15000);
    
    // 5. Status final
    await checkWhatsAppStatus();
    
    console.log(`\n✅ [MAIN] Teste concluído!`);
    console.log(`📋 [MAIN] Verifique os logs acima para confirmar se:`);
    console.log(`   1. Cache foi limpo (🗑️ [AUTH-CLEANUP])`);
    console.log(`   2. Auth data está false (🔐 [AUTH-STATE] HasAuthData: false)`);
    console.log(`   3. QR Code foi gerado (📱 [QR-CODE])`);
  } else {
    console.log(`❌ [MAIN] Teste falhou na requisição inicial`);
  }
  
  process.exit(0);
}

// Executar teste completo
fullTest().catch(error => {
  console.error('💥 [FATAL] Erro no teste:', error);
  process.exit(1);
});