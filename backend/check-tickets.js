require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkDuplicateTickets() {
  console.log('🔍 Verificando tickets duplicados no sistema...');
  
  const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    dialect: 'postgres',
    logging: false
  });

  try {
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida.');

    // Verificar tickets duplicados
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

    if (results.length === 0) {
      console.log('✅ Nenhum ticket duplicado encontrado!');
    } else {
      console.log(`⚠️  Encontrados ${results.length} casos de tickets duplicados:`);
      console.table(results);
      
      // Total de tickets duplicados
      const totalDuplicates = results.reduce((sum, row) => sum + (row.ticket_count - 1), 0);
      console.log(`📊 Total de tickets duplicados que serão removidos: ${totalDuplicates}`);
    }

    // Verificar total de tickets ativos
    const [totalActive] = await sequelize.query(`
      SELECT COUNT(*) as total_active
      FROM "Tickets" 
      WHERE status IN ('open', 'pending', 'group', 'nps', 'lgpd')
    `);

    console.log(`📊 Total de tickets ativos no sistema: ${totalActive[0].total_active}`);

    await sequelize.close();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkDuplicateTickets(); 