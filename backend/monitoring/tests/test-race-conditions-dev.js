const axios = require('axios');

// Configuração do teste para desenvolvimento
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const COMPANY_ID = 1;

// Função para verificar se o backend está rodando
async function checkBackend() {
  try {
    await axios.get(`${BASE_URL}/race-conditions/stats`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Função para verificar estatísticas
async function checkStats() {
  try {
    console.log('\n📊 Verificando estatísticas do sistema...');
    
    const response = await axios.get(`${BASE_URL}/race-conditions/stats`);
    const stats = response.data;
    
    console.log('📈 Estatísticas de Race Conditions:');
    console.log(`   - Total de erros: ${stats.raceConditions.totalErrors}`);
    console.log(`   - Erros hoje: ${stats.raceConditions.todayErrors}`);
    console.log(`   - Último erro: ${stats.raceConditions.lastError || 'Nenhum'}`);
    
    console.log('\n💾 Estatísticas do Cache:');
    console.log(`   - Chaves em cache: ${stats.contactCache.keys}`);
    console.log(`   - Taxa de acerto: ${stats.contactCache.hitRate}`);
    console.log(`   - Hits: ${stats.contactCache.hits}`);
    console.log(`   - Misses: ${stats.contactCache.misses}`);
    
    console.log('\n🖥️ Sistema:');
    console.log(`   - Uptime: ${Math.floor(stats.system.uptime / 60)} minutos`);
    console.log(`   - Memória heap: ${stats.system.memoryUsage.heapUsed}`);
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao verificar estatísticas:', error.message);
    return null;
  }
}

// Função principal
async function main() {
  console.log('🔧 TESTE DE RACE CONDITIONS - DESENVOLVIMENTO');
  console.log('==============================================\n');
  
  // Verifica se o backend está rodando
  const isRunning = await checkBackend();
  if (!isRunning) {
    console.error('❌ Backend não está rodando!');
    console.log('💡 Para iniciar o backend:');
    console.log('   cd backend && npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Backend está rodando!');
  
  // Verifica estatísticas
  await checkStats();
  
  console.log('\n🎉 Teste concluído!');
  console.log('\n💡 Para monitoramento contínuo:');
  console.log('   - Logs: tail -f backend/logs/race_conditions.log');
     console.log(`   - Stats: curl ${BASE_URL}/race-conditions/stats`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro:', error.message);
    process.exit(1);
  });
}
