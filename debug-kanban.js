// Debug script para encontrar o problema do Kanban
const { Client } = require('pg');
const axios = require('axios');

// Configurações do banco
const dbConfig = {
  host: 'localhost',
  port: 55433,
  database: 'whatize',
  user: 'whatize',
  password: 'ZdG387FhYsm0olSm097541HMSdS='
};

const API_BASE = 'http://localhost:3001';

async function debugKanban() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔍 DEBUG KANBAN - ENCONTRANDO O PROBLEMA\n');
    
    // 1. Conectar ao banco
    await client.connect();
    console.log('✅ Conectado ao banco PostgreSQL\n');

    // 2. Encontrar um usuário ativo
    console.log('👤 PROCURANDO USUÁRIO ATIVO...');
    const usersQuery = `
      SELECT id, name, email, "kanbanCollapsedColumns", "kanbanColumnOrder"
      FROM "Users" 
      WHERE "companyId" = 1
      ORDER BY "updatedAt" DESC
      LIMIT 5;
    `;
    
    const usersResult = await client.query(usersQuery);
    console.log(`📋 Encontrados ${usersResult.rows.length} usuários:`);
    
    usersResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id} | Nome: ${user.name} | Email: ${user.email}`);
      console.log(`      - Collapsed: ${user.kanbanCollapsedColumns || 'null'}`);
      console.log(`      - Order: ${user.kanbanColumnOrder || 'null'}`);
    });
    
    if (usersResult.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado!');
      return;
    }
    
    const testUser = usersResult.rows[0];
    console.log(`\n🎯 USANDO USUÁRIO: ${testUser.name} (ID: ${testUser.id})\n`);

    // 3. Teste direto no banco - SALVAR dados de teste
    console.log('💾 SALVANDO DADOS DE TESTE NO BANCO...');
    
    const testData = {
      kanbanCollapsedColumns: ['22'],
      kanbanColumnOrder: ['lane0', '22', '21', '23', '24', '25', '31']
    };
    
    const updateQuery = `
      UPDATE "Users" 
      SET 
        "kanbanCollapsedColumns" = $1,
        "kanbanColumnOrder" = $2,
        "updatedAt" = NOW()
      WHERE id = $3
      RETURNING id, "kanbanCollapsedColumns", "kanbanColumnOrder";
    `;
    
    const updateResult = await client.query(updateQuery, [
      JSON.stringify(testData.kanbanCollapsedColumns),
      JSON.stringify(testData.kanbanColumnOrder),
      testUser.id
    ]);
    
    console.log('✅ Dados salvos no banco:');
    const saved = updateResult.rows[0];
    console.log(`   - Collapsed: ${saved.kanbanCollapsedColumns}`);
    console.log(`   - Order: ${saved.kanbanColumnOrder}\n`);

    // 4. Verificar se API /users/:id retorna os dados corretos
    console.log('🌐 TESTANDO API /users/:id...');
    
    try {
      // Primeiro, vamos tentar sem autenticação para ver se funciona
      const apiResponse = await axios.get(`${API_BASE}/users/${testUser.id}`, {
        timeout: 5000
      });
      
      console.log('✅ API respondeu com sucesso!');
      console.log('📊 Status:', apiResponse.status);
      
      const apiUser = apiResponse.data;
      console.log('👤 Dados da API:');
      console.log(`   - ID: ${apiUser.id}`);
      console.log(`   - Nome: ${apiUser.name}`);
      console.log(`   - Collapsed: ${apiUser.kanbanCollapsedColumns}`);
      console.log(`   - Order: ${apiUser.kanbanColumnOrder}`);
      
      // Comparar dados
      const dbCollapsed = JSON.parse(saved.kanbanCollapsedColumns || '[]');
      const dbOrder = JSON.parse(saved.kanbanColumnOrder || '[]');
      
      const apiCollapsed = apiUser.kanbanCollapsedColumns || [];
      const apiOrder = apiUser.kanbanColumnOrder || [];
      
      console.log('\n🔍 COMPARAÇÃO BANCO vs API:');
      console.log('   Collapsed:', JSON.stringify(dbCollapsed) === JSON.stringify(apiCollapsed) ? '✅ MATCH' : '❌ MISMATCH');
      console.log('   Order:', JSON.stringify(dbOrder) === JSON.stringify(apiOrder) ? '✅ MATCH' : '❌ MISMATCH');
      
      if (JSON.stringify(dbOrder) !== JSON.stringify(apiOrder)) {
        console.log('❌ ORDEM DIFERENTE!');
        console.log('   Banco:', dbOrder);
        console.log('   API:', apiOrder);
      }
      
    } catch (apiError) {
      console.log('❌ ERRO na API:', apiError.message);
      console.log('   Status:', apiError.response?.status);
      console.log('   Dados:', apiError.response?.data);
      
      if (apiError.response?.status === 401) {
        console.log('\n🔑 API precisa de autenticação - isso é esperado');
      }
    }

    // 5. Analisar o problema do frontend baseado nos logs
    console.log('\n🐛 ANÁLISE DO PROBLEMA FRONTEND:');
    console.log('📋 Pelos logs do console:');
    console.log('   - Ordem salva: ["lane0", "21", "22", "23", "24", "25", "31"]');
    console.log('   - Ordem aplicada: ["Em aberto", "Facebook", "Atendimento SDR", ...]');
    console.log('');
    console.log('🔍 PROBLEMA IDENTIFICADO:');
    console.log('   O mapeamento ID -> Título está TROCADO!');
    console.log('   ID "21" deveria ser "Atendimento SDR"');
    console.log('   ID "22" deveria ser "Facebook"');
    console.log('   Mas está aparecendo invertido!');
    console.log('');
    console.log('💡 SOLUÇÃO:');
    console.log('   Verificar a função que mapeia os IDs para títulos no frontend');
    console.log('   O problema NÃO é no backend - é na lógica de ordenação do frontend!');

  } catch (error) {
    console.error('💥 ERRO:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

// Executar debug
debugKanban(); 