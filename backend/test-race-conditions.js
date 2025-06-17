const axios = require('axios');

// Configuração do teste
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4035'; // Ajuste conforme necessário
const COMPANY_ID = 1; // Ajuste conforme necessário
const TEST_CONTACTS = [
  { number: '5511999999001', name: 'Teste Race 1' },
  { number: '5511999999002', name: 'Teste Race 2' },
  { number: '5511999999003', name: 'Teste Race 3' },
  { number: '5511999999004', name: 'Teste Race 4' },
  { number: '5511999999005', name: 'Teste Race 5' }
];

// Função para simular criação simultânea de contatos
async function simulateRaceCondition() {
  console.log('🚀 Iniciando teste de race conditions...');
  
  const promises = [];
  
  // Simula múltiplas chamadas simultâneas para o mesmo contato
  for (let i = 0; i < 10; i++) {
    const contact = TEST_CONTACTS[i % TEST_CONTACTS.length];
    
    const promise = axios.post(`${BASE_URL}/contacts`, {
      name: `${contact.name} - Tentativa ${i + 1}`,
      number: contact.number,
      companyId: COMPANY_ID,
      isGroup: false
    }).catch(error => {
      console.error(`❌ Erro na tentativa ${i + 1}:`, error.response?.data || error.message);
      return { error: true, attempt: i + 1 };
    });
    
    promises.push(promise);
  }
  
  console.log('⏳ Executando 10 chamadas simultâneas...');
  const results = await Promise.all(promises);
  
  const successful = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;
  
  console.log(`✅ Sucessos: ${successful}`);
  console.log(`❌ Falhas: ${failed}`);
  
  return { successful, failed };
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

// Função para limpar dados de teste
async function cleanup() {
  console.log('\n🧹 Limpando dados de teste...');
  
  for (const contact of TEST_CONTACTS) {
    try {
      // Aqui você pode adicionar lógica para limpar os contatos de teste
      // Por exemplo, deletar via API se existir endpoint
      console.log(`   - Limpando contato ${contact.number}...`);
    } catch (error) {
      console.error(`   ❌ Erro ao limpar ${contact.number}:`, error.message);
    }
  }
}

// Função principal de teste
async function runTests() {
  console.log('🔧 TESTE DE RACE CONDITIONS - BAILEYS v6.7.16');
  console.log('================================================\n');
  
  try {
    // Verifica estatísticas iniciais
    const initialStats = await checkStats();
    
    // Executa teste de race condition
    console.log('\n🎯 Executando teste de race conditions...');
    const testResults = await simulateRaceCondition();
    
    // Aguarda um pouco para os logs serem processados
    console.log('\n⏳ Aguardando processamento dos logs...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verifica estatísticas finais
    const finalStats = await checkStats();
    
    // Análise dos resultados
    console.log('\n📋 ANÁLISE DOS RESULTADOS:');
    console.log('==========================');
    
    if (testResults.failed === 0) {
      console.log('✅ SUCESSO: Nenhuma falha detectada!');
      console.log('   - O sistema de mutex está funcionando corretamente');
      console.log('   - Race conditions foram prevenidas');
    } else {
      console.log(`⚠️  ATENÇÃO: ${testResults.failed} falhas detectadas`);
      console.log('   - Pode indicar problemas restantes no sistema');
    }
    
    if (finalStats && initialStats) {
      const newErrors = finalStats.raceConditions.todayErrors - (initialStats.raceConditions.todayErrors || 0);
      if (newErrors === 0) {
        console.log('✅ Nenhum novo erro de constraint única registrado');
      } else {
        console.log(`❌ ${newErrors} novos erros de constraint única registrados`);
      }
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

// Executa os testes se o script for chamado diretamente
if (require.main === module) {
  runTests().then(() => {
    console.log('\n👋 Finalizando teste...');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  simulateRaceCondition,
  checkStats,
  runTests
}; 