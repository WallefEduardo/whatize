#!/usr/bin/env node

// 🔍 MONITOR DE SESSÃO: Monitora continuamente o estado da sessão para capturar quando ela morre
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { getWbot } = require('./dist/libs/wbot');

let sessionState = {
  isAlive: false,
  lastCheck: null,
  consecutiveFailures: 0
};

function checkSession() {
  const now = new Date().toISOString();
  
  try {
    const wbot = getWbot(1);
    
    // Sessão está viva
    if (!sessionState.isAlive) {
      // Transição: morta -> viva
      console.log(`🟢 [MONITOR] ${now} - SESSÃO REVIVEU! { readyState: ${wbot.readyState}, id: ${wbot.id} }`);
      sessionState.isAlive = true;
      sessionState.consecutiveFailures = 0;
    } else {
      // Continua viva - log silencioso a cada 10 checks
      if (sessionState.consecutiveFailures % 10 === 0) {
        console.log(`✅ [MONITOR] ${now} - Sessão continua ativa { readyState: ${wbot.readyState} }`);
      }
    }
    
  } catch (error) {
    sessionState.consecutiveFailures++;
    
    if (sessionState.isAlive) {
      // Transição: viva -> morta
      console.log(`🔴 [MONITOR] ${now} - SESSÃO MORREU! { error: ${error.message}, ultimoCheck: ${sessionState.lastCheck} }`);
      sessionState.isAlive = false;
    } else {
      // Continua morta
      if (sessionState.consecutiveFailures === 1) {
        console.log(`❌ [MONITOR] ${now} - Sessão ainda morta { error: ${error.message} }`);
      }
    }
  }
  
  sessionState.lastCheck = now;
}

console.log('🔍 [MONITOR] Iniciando monitoramento contínuo da sessão...');
console.log('🔍 [MONITOR] Pressione Ctrl+C para parar');

// Verificar a cada 2 segundos
const interval = setInterval(checkSession, 2000);

// Capturar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🔍 [MONITOR] Parando monitoramento...');
  clearInterval(interval);
  process.exit(0);
});

// Primeira verificação imediata
checkSession();