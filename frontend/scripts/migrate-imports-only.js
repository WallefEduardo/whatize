#!/usr/bin/env node

/**
 * Script de Migração Segura - Apenas Imports
 * Migra APENAS @material-ui → @mui imports
 * Preserva makeStyles e Formik para próximas fases
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Arquivos prioritários da Fase 7B
const PHASE7B_FILES = [
  'src/components/UserModal/index.js',
  'src/components/ContactModal/index.js', 
  'src/components/QueueModal/index.js',
  'src/components/Ticket/index.js',
  'src/components/MessageInput/index.js',
  'src/components/TicketHeader/index.js',
  'src/pages/Users/index.js',
  'src/pages/Settings/index.js',
  'src/pages/Contacts/index.js'
];

class ImportMigrator {
  constructor() {
    this.migratedCount = 0;
    this.errors = [];
  }

  log(message) {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] ${message}`);
    
    // Log para arquivo
    const logMessage = `${timestamp}: ${message}\n`;
    fs.appendFileSync('logs/migration/phases.log', logMessage);
  }

  createBackup(filePath) {
    const backupPath = `${filePath}.backup-imports`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }

  migrateImportsOnly(content) {
    // Migra APENAS os imports, mantém makeStyles
    const replacements = [
      // Core imports - specific imports
      [/from ["']@material-ui\/core\/([^"']+)["']/g, 'from "@mui/material/$1"'],
      [/from ["']@material-ui\/icons\/([^"']+)["']/g, 'from "@mui/icons-material/$1"'],
      
      // Core imports - bulk imports  
      [/from ["']@material-ui\/core["']/g, 'from "@mui/material"'],
      [/from ["']@material-ui\/icons["']/g, 'from "@mui/icons-material"'],
      
      // styles import - keep makeStyles working
      [/from ["']@material-ui\/core\/styles["']/g, 'from "@mui/material/styles"'],
      
      // react-toastify → new toast provider
      [/import\s*{\s*toast\s*}\s*from\s*["']react-toastify["']/g, 'import { toast } from "../../components/ui/ToastProvider"'],
    ];

    let migratedContent = content;
    replacements.forEach(([pattern, replacement]) => {
      migratedContent = migratedContent.replace(pattern, replacement);
    });

    return migratedContent;
  }

  async migrateFile(filePath) {
    this.log(`Migrando imports: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      this.log(`⚠️  Arquivo não encontrado: ${filePath}`);
      return false;
    }

    try {
      // Backup
      const backupPath = this.createBackup(filePath);
      
      // Migrar apenas imports
      let content = fs.readFileSync(filePath, 'utf8');
      content = this.migrateImportsOnly(content);
      
      // Salvar
      fs.writeFileSync(filePath, content);
      
      this.log(`✅ ${filePath} - Imports migrados`);
      this.migratedCount++;
      return true;
      
    } catch (error) {
      this.log(`❌ Erro: ${filePath} - ${error.message}`);
      this.errors.push({ file: filePath, error: error.message });
      return false;
    }
  }

  async testBuild() {
    this.log('🔧 Testando build...');
    try {
      execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
      this.log('✅ Build OK!');
      return true;
    } catch (error) {
      this.log('❌ Build falhou');
      return false;
    }
  }

  async migrate() {
    this.log('🚀 MIGRAÇÃO SEGURA - APENAS IMPORTS');
    
    // Migrar todos os arquivos
    for (const filePath of PHASE7B_FILES) {
      await this.migrateFile(filePath);
    }
    
    // Testar build
    const buildOk = await this.testBuild();
    
    // Relatório
    this.log(`📊 RESULTADO: ${this.migratedCount}/${PHASE7B_FILES.length} migrados`);
    this.log(`🔧 Build: ${buildOk ? '✅ OK' : '❌ FALHOU'}`);
    
    if (this.errors.length > 0) {
      this.log('❌ Erros:');
      this.errors.forEach(({ file, error }) => {
        this.log(`   ${file}: ${error}`);
      });
    }
    
    return buildOk && this.errors.length === 0;
  }
}

// Executar
const migrator = new ImportMigrator();
migrator.migrate().then(success => {
  process.exit(success ? 0 : 1);
});