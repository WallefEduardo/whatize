#!/usr/bin/env node

/**
 * Migração em Lote - 10 arquivos por vez
 * Mais rápido e eficiente
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Próximos 10 arquivos para migrar
const BATCH_FILES = [
  'src/pages/Contacts/index.js',
  'src/components/QueueModal/index.js',
  'src/components/ContactModal/index.js',
  'src/components/Ticket/index.js',
  'src/components/TicketListItem/index.js',
  'src/components/TicketsManager/index.js',
  'src/components/MessagesList/index.js',
  'src/components/ContactDrawer/index.js',
  'src/components/NotificationsPopOver/index.js',
  'src/components/NewTicketModal/index.js'
];

function log(message) {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] ${message}`);
  
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync('logs/migration/phases.log', logMessage);
}

function migrateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`⚠️  ${filePath} - não encontrado`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip se já migrado
    if (content.includes('@mui/material') && !content.includes('@material-ui/')) {
      log(`✅ ${filePath} - já migrado`);
      return true;
    }
    
    // Backup
    fs.copyFileSync(filePath, `${filePath}.backup-batch`);
    
    // Migrações simples e seguras
    const replacements = [
      // toast
      [/import\s*{\s*toast\s*}\s*from\s*["']react-toastify["']/g, 'import { toast } from "../../components/ui/ToastProvider"'],
      [/import\s*{\s*toast\s*}\s*from\s*["']react-toastify["']/g, 'import { toast } from "../components/ui/ToastProvider"'],
      
      // Core imports
      [/from ["']@material-ui\/core\/styles["']/g, 'from "@mui/material/styles"'],
      [/from ["']@material-ui\/core["']/g, 'from "@mui/material"'],
      [/from ["']@material-ui\/icons["']/g, 'from "@mui/icons-material"'],
      [/from ["']@material-ui\/icons\/([^"']+)["']/g, 'from "@mui/icons-material/$1"'],
      [/from ["']@material-ui\/core\/([^"']+)["']/g, 'from "@mui/material/$1"'],
      
      // makeStyles → styled (keep makeStyles for now)
      [/import\s*{\s*makeStyles\s*}/g, 'import { makeStyles }'],
    ];
    
    replacements.forEach(([pattern, replacement]) => {
      content = content.replace(pattern, replacement);
    });
    
    // Salvar
    fs.writeFileSync(filePath, content);
    log(`✅ ${filePath} - migrado`);
    return true;
    
  } catch (error) {
    log(`❌ ${filePath} - erro: ${error.message}`);
    return false;
  }
}

function testBuild() {
  log('🔧 Testando build...');
  try {
    execSync('npm run build', { stdio: 'pipe', timeout: 180000 });
    log('✅ Build passou!');
    return true;
  } catch (error) {
    log('❌ Build falhou - restaurando backups...');
    
    // Restaurar backups
    BATCH_FILES.forEach(file => {
      const backup = `${file}.backup-batch`;
      if (fs.existsSync(backup)) {
        fs.copyFileSync(backup, file);
      }
    });
    
    return false;
  }
}

function cleanBackups() {
  BATCH_FILES.forEach(file => {
    const backup = `${file}.backup-batch`;
    if (fs.existsSync(backup)) {
      fs.unlinkSync(backup);
    }
  });
}

// Executar
log('🚀 MIGRANDO LOTE DE 10 ARQUIVOS');

let migrated = 0;
BATCH_FILES.forEach(file => {
  if (migrateFile(file)) migrated++;
});

log(`📊 ${migrated}/${BATCH_FILES.length} arquivos migrados`);

if (testBuild()) {
  cleanBackups();
  log('🎉 LOTE MIGRADO COM SUCESSO!');
  process.exit(0);
} else {
  log('❌ LOTE FALHOU - backups restaurados');
  process.exit(1);
}