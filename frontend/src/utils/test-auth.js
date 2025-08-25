/**
 * Script de teste para validar comportamento do AuthManager após F5
 * 
 * Para usar:
 * 1. Abra o DevTools no navegador
 * 2. Execute: await window.testAuthBehavior()
 */

window.testAuthBehavior = async function() {
  console.log('🧪 [TEST] Iniciando teste do AuthManager...');
  
  // Verificar se AuthManager está disponível
  if (!window.authManager) {
    console.error('❌ [TEST] AuthManager não está disponível globalmente');
    return;
  }
  
  const authManager = window.authManager;
  
  // 1. Verificar estado inicial
  console.log('📊 [TEST] Estado inicial:', authManager.getMetrics());
  
  // 2. Verificar health check
  console.log('💚 [TEST] Health check:', authManager.healthCheck());
  
  // 3. Simular múltiplas requests durante inicialização
  console.log('🚀 [TEST] Simulando requests durante inicialização...');
  
  // Reset para simular F5
  authManager.__debugReset();
  
  // Fazer várias requests simultâneas (como acontece no F5)
  const requests = [
    fetch('/api/tags').catch(e => console.log('Request 1 failed:', e.message)),
    fetch('/api/users/me').catch(e => console.log('Request 2 failed:', e.message)),
    fetch('/api/tickets').catch(e => console.log('Request 3 failed:', e.message))
  ];
  
  console.log('⏳ [TEST] Aguardando requests...');
  
  try {
    await Promise.allSettled(requests);
    console.log('✅ [TEST] Todas as requests completadas');
  } catch (error) {
    console.error('❌ [TEST] Erro nas requests:', error);
  }
  
  // 4. Verificar estado final
  console.log('📊 [TEST] Estado final:', authManager.getMetrics());
  console.log('💚 [TEST] Health check final:', authManager.healthCheck());
  
  console.log('🎉 [TEST] Teste concluído!');
};

// Verificar se tokens existem no localStorage
window.checkTokens = function() {
  console.log('🔑 [CHECK] Tokens no localStorage:', {
    accessToken: localStorage.getItem('token') ? 'PRESENTE' : 'AUSENTE',
    refreshToken: localStorage.getItem('refresh_token') ? 'PRESENTE' : 'AUSENTE',
    accessTokenLength: localStorage.getItem('token')?.length || 0,
    refreshTokenLength: localStorage.getItem('refresh_token')?.length || 0
  });
};

// Simular F5 (reload da página)
window.simulateF5 = function() {
  console.log('🔄 [SIMULATE] Simulando F5 - recarregando página...');
  window.location.reload();
};

console.log('🧪 [TEST-UTILS] Funções de teste carregadas!');
console.log('📝 [TEST-UTILS] Comandos disponíveis:');
console.log('  - await window.testAuthBehavior() // Teste completo');
console.log('  - window.checkTokens() // Verificar tokens');
console.log('  - window.simulateF5() // Simular reload');