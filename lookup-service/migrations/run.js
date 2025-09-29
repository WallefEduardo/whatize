const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

async function runMigrations() {
  try {
    console.log('🔄 Executando migrations...');
    
    const migrationFile = path.join(__dirname, '001_create_company_instances.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration executada com sucesso!');
    
    // Verificar dados
    const result = await pool.query('SELECT * FROM company_instances');
    console.log('📊 Dados na tabela:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Erro na migration:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();