const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Script para limpar tickets duplicados
const cleanDuplicateTickets = async () => {
  console.log('🧹 Iniciando limpeza de tickets duplicados...');
  
  try {
    // 1. Identificar e contar tickets duplicados
    console.log('📊 Identificando tickets duplicados...');
    
    const countQuery = `
      SELECT 
        "contactId", 
        "companyId", 
        "whatsappId", 
        status,
        COUNT(*) as ticket_count,
        STRING_AGG(id::text, ',' ORDER BY "updatedAt" DESC) as ticket_ids
      FROM "Tickets" 
      WHERE status IN ('open', 'pending', 'group', 'nps', 'lgpd')
      GROUP BY "contactId", "companyId", "whatsappId", status
      HAVING COUNT(*) > 1
      ORDER BY ticket_count DESC;
    `;

    // Execute via psql client
    const countCommand = `PGPASSWORD="${process.env.DB_PASS}" psql -h ${process.env.DB_HOST} -p ${process.env.DB_PORT || 5432} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -c "${countQuery}"`;
    
    const { stdout: countResult } = await execAsync(countCommand);
    console.log('📋 Tickets duplicados encontrados:');
    console.log(countResult);

    // 2. Limpar tickets duplicados (manter o mais recente)
    console.log('🗑️  Removendo tickets duplicados...');
    
    const cleanQuery = `
      DELETE FROM "Tickets" t1
      USING "Tickets" t2 
      WHERE t1.id < t2.id 
        AND t1."contactId" = t2."contactId" 
        AND t1."companyId" = t2."companyId" 
        AND t1."whatsappId" = t2."whatsappId"
        AND t1.status = t2.status
        AND t1.status IN ('open', 'pending', 'group', 'nps', 'lgpd');
    `;

    const cleanCommand = `PGPASSWORD="${process.env.DB_PASS}" psql -h ${process.env.DB_HOST} -p ${process.env.DB_PORT || 5432} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -c "${cleanQuery}"`;
    
    const { stdout: cleanResult } = await execAsync(cleanCommand);
    console.log('✅ Limpeza concluída:', cleanResult);

    // 3. Verificar resultado
    console.log('🔍 Verificando resultado final...');
    
    const verifyCommand = `PGPASSWORD="${process.env.DB_PASS}" psql -h ${process.env.DB_HOST} -p ${process.env.DB_PORT || 5432} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -c "${countQuery}"`;
    
    const { stdout: verifyResult } = await execAsync(verifyCommand);
    console.log('📊 Tickets duplicados restantes:');
    console.log(verifyResult);

    console.log('✅ Script de limpeza concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
    console.error('💡 Certifique-se de que:');
    console.error('   - As variáveis de ambiente do banco estão configuradas');
    console.error('   - O cliente PostgreSQL (psql) está instalado');
    console.error('   - Você tem permissões para executar DELETE');
  }
};

// Função para verificar apenas (sem deletar)
const checkDuplicateTickets = async () => {
  console.log('🔍 Verificando tickets duplicados (somente leitura)...');
  
  try {
    const checkQuery = `
      SELECT 
        "contactId", 
        "companyId", 
        "whatsappId", 
        status,
        COUNT(*) as ticket_count,
                 STRING_AGG(
           'ID:' || id || ' (' || TO_CHAR("updatedAt", 'YYYY-MM-DD HH24:MI:SS') || ')',
           ' | ' 
           ORDER BY "updatedAt" DESC
         ) as ticket_details
      FROM "Tickets" 
      WHERE status IN ('open', 'pending', 'group', 'nps', 'lgpd')
      GROUP BY "contactId", "companyId", "whatsappId", status
      HAVING COUNT(*) > 1
      ORDER BY ticket_count DESC
      LIMIT 20;
    `;

    const checkCommand = `PGPASSWORD="${process.env.DB_PASS}" psql -h ${process.env.DB_HOST} -p ${process.env.DB_PORT || 5432} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -c "${checkQuery}"`;
    
    const { stdout: result } = await execAsync(checkCommand);
    console.log('📊 Top 20 casos de tickets duplicados:');
    console.log(result);

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
};

// Função alternativa usando node-postgres para evitar dependência do psql
const checkDuplicateTicketsWithNodePg = async () => {
  console.log('🔍 Verificando tickets duplicados via Node.js...');
  
  try {
    // Usar sequelize diretamente se disponível
    const { Sequelize } = require('sequelize');
    
    const sequelize = new Sequelize({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      dialect: 'postgres',
      logging: false
    });

    const [results] = await sequelize.query(`
      SELECT 
        "contactId", 
        "companyId", 
        "whatsappId", 
        status,
        COUNT(*) as ticket_count,
        STRING_AGG(id::text, ',' ORDER BY "updatedAt" DESC) as ticket_ids
      FROM "Tickets" 
      WHERE status IN ('open', 'pending', 'group', 'nps', 'lgpd')
      GROUP BY "contactId", "companyId", "whatsappId", status
      HAVING COUNT(*) > 1
      ORDER BY ticket_count DESC
      LIMIT 20;
    `);

    console.log('📊 Tickets duplicados encontrados:');
    console.table(results);

    await sequelize.close();

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    console.log('💡 Tentando método alternativo com psql...');
    await checkDuplicateTickets();
  }
};

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--check-only')) {
  checkDuplicateTicketsWithNodePg();
} else if (args.includes('--clean')) {
  cleanDuplicateTickets();
} else {
  console.log('🚀 Script de limpeza de tickets duplicados (PostgreSQL)');
  console.log('');
  console.log('Uso:');
  console.log('  node clean-duplicate-tickets.js --check-only   # Apenas verificar (sem deletar)');
  console.log('  node clean-duplicate-tickets.js --clean        # Limpar tickets duplicados');
  console.log('');
  console.log('⚠️  ATENÇÃO: O comando --clean irá DELETAR tickets duplicados permanentemente!');
  console.log('   Execute primeiro com --check-only para revisar antes de limpar.');
} 