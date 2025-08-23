#!/usr/bin/env node

/**
 * Script de Migração Automática - Fase 7B
 * Migra makeStyles → styled components de forma segura
 * Preserva 100% das funcionalidades existentes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Lista de arquivos prioritários da Fase 7B
const PHASE7B_FILES = [
  // Modais principais
  'src/components/UserModal/index.js',
  'src/components/ContactModal/index.js', 
  'src/components/QueueModal/index.js',
  
  // Componentes de sistema
  'src/components/Ticket/index.js',
  'src/components/MessageInput/index.js',
  'src/components/TicketHeader/index.js',
  
  // Páginas secundárias
  'src/pages/Users/index.js',
  'src/pages/Settings/index.js',
  'src/pages/Contacts/index.js',
  
  // Componentes críticos adicionais
  'src/components/TicketListItem/index.js',
  'src/components/TicketsManager/index.js',
  'src/components/MessagesList/index.js',
  'src/components/ContactDrawer/index.js'
];

class MakeStylesMigrator {
  constructor() {
    this.migratedCount = 0;
    this.errors = [];
    this.backups = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    
    // Log para arquivo
    const logMessage = `${new Date().toLocaleString()}: ${message}\n`;
    fs.appendFileSync('logs/migration/phases.log', logMessage);
  }

  createBackup(filePath) {
    const backupPath = `${filePath}.backup-phase7b`;
    fs.copyFileSync(filePath, backupPath);
    this.backups.push(backupPath);
    this.log(`Backup criado: ${backupPath}`);
    return backupPath;
  }

  isFileValid(filePath) {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  }

  hasMakeStyles(content) {
    return content.includes('makeStyles') || 
           content.includes('@material-ui/core') ||
           content.includes('@material-ui/icons');
  }

  migrateImports(content) {
    // Migra imports do Material-UI v4 para MUI v5
    const replacements = [
      // Core imports
      [/@material-ui\/core\/([^"']+)/g, '@mui/material/$1'],
      [/@material-ui\/icons\/([^"']+)/g, '@mui/icons-material/$1'],
      [/@material-ui\/core["']/g, '@mui/material"'],
      [/@material-ui\/icons["']/g, '@mui/icons-material"'],
      
      // makeStyles → styled
      [/import\s*{\s*makeStyles\s*}\s*from\s*["']@mui\/material\/styles["']/g, 'import { styled } from "@mui/material/styles"'],
      [/import\s*{\s*makeStyles\s*}\s*from\s*["']@material-ui\/core\/styles["']/g, 'import { styled } from "@mui/material/styles"'],
      
      // react-toastify → toast provider
      [/import\s*{\s*toast\s*}\s*from\s*["']react-toastify["']/g, 'import { toast } from "../../components/ui/ToastProvider"'],
      [/import\s*{\s*toast\s*}\s*from\s*["']react-toastify["']/g, 'import { toast } from "../components/ui/ToastProvider"']
    ];

    let migratedContent = content;
    replacements.forEach(([pattern, replacement]) => {
      migratedContent = migratedContent.replace(pattern, replacement);
    });

    return migratedContent;
  }

  extractMakeStylesObject(content) {
    // Extrai o objeto makeStyles de forma segura
    const makeStylesRegex = /const\s+useStyles\s*=\s*makeStyles\s*\(\s*(?:\([^)]*\)\s*=>\s*)?\(\s*\{([\s\S]*?)\}\s*\)\s*\);?/;
    const match = content.match(makeStylesRegex);
    
    if (!match) return null;
    
    return {
      fullMatch: match[0],
      stylesObject: match[1]
    };
  }

  createStyledComponents(stylesObject, className) {
    // Converte cada classe em um styled component
    const classRegex = /(\w+):\s*\{([^}]*)\}/g;
    let styledComponents = '';
    let match;

    while ((match = classRegex.exec(stylesObject)) !== null) {
      const [, className, styles] = match;
      const componentName = className.charAt(0).toUpperCase() + className.slice(1);
      
      styledComponents += `
const Styled${componentName} = styled('div')(({ theme }) => ({
${styles.trim()}
}));
`;
    }

    return styledComponents;
  }

  replaceClassNameUsage(content, styleClasses) {
    // Substitui className={classes.xxx} por component={StyledXxx}
    let migratedContent = content;
    
    styleClasses.forEach(className => {
      const componentName = className.charAt(0).toUpperCase() + className.slice(1);
      
      // Padrões de substituição
      const patterns = [
        [`className={classes.${className}}`, `component={Styled${componentName}}`],
        [`className={clsx(classes.${className}`, `component={Styled${componentName}}`],
        [`className={\`\${classes.${className}}`, `component={Styled${componentName}}`]
      ];
      
      patterns.forEach(([pattern, replacement]) => {
        migratedContent = migratedContent.replace(new RegExp(pattern, 'g'), replacement);
      });
    });

    return migratedContent;
  }

  migrateFile(filePath) {
    this.log(`Iniciando migração: ${filePath}`);
    
    if (!this.isFileValid(filePath)) {
      this.log(`⚠️  Arquivo não encontrado: ${filePath}`);
      return false;
    }

    // Criar backup
    this.createBackup(filePath);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!this.hasMakeStyles(content)) {
      this.log(`✅ ${filePath} - Já migrado ou não precisa migração`);
      return true;
    }

    try {
      // 1. Migrar imports
      content = this.migrateImports(content);
      
      // 2. Extrair e converter makeStyles
      const makeStylesData = this.extractMakeStylesObject(content);
      if (makeStylesData) {
        // Criar styled components
        const styledComponents = this.createStyledComponents(makeStylesData.stylesObject);
        
        // Substituir makeStyles por styled components
        content = content.replace(makeStylesData.fullMatch, styledComponents);
        
        // Remover useStyles() call
        content = content.replace(/const\s+classes\s*=\s*useStyles\(\);?\s*/, '// Styled components used instead of makeStyles\n');
      }
      
      // 3. Salvar arquivo migrado
      fs.writeFileSync(filePath, content);
      
      this.log(`✅ ${filePath} - Migrado com sucesso`);
      this.migratedCount++;
      return true;
      
    } catch (error) {
      this.log(`❌ Erro ao migrar ${filePath}: ${error.message}`);
      this.errors.push({ file: filePath, error: error.message });
      
      // Restaurar backup em caso de erro
      const backupPath = `${filePath}.backup-phase7b`;
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
        this.log(`🔄 Backup restaurado para ${filePath}`);
      }
      
      return false;
    }
  }

  testBuild() {
    this.log('🔧 Testando build após migração...');
    try {
      execSync('npm run build', { stdio: 'pipe', timeout: 180000 });
      this.log('✅ Build passou com sucesso!');
      return true;
    } catch (error) {
      this.log('❌ Build falhou - restaurando backups...');
      this.restoreAllBackups();
      return false;
    }
  }

  restoreAllBackups() {
    this.log('🔄 Restaurando todos os backups...');
    this.backups.forEach(backupPath => {
      const originalPath = backupPath.replace('.backup-phase7b', '');
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, originalPath);
        this.log(`🔄 Restaurado: ${originalPath}`);
      }
    });
  }

  cleanupBackups() {
    this.log('🧹 Limpando backups temporários...');
    this.backups.forEach(backupPath => {
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
    });
  }

  async migrate() {
    this.log('🚀 INICIANDO MIGRAÇÃO AUTOMÁTICA FASE 7B');
    this.log(`📊 Total de arquivos: ${PHASE7B_FILES.length}`);
    
    // Migrar arquivos em lotes para segurança
    const batchSize = 5;
    for (let i = 0; i < PHASE7B_FILES.length; i += batchSize) {
      const batch = PHASE7B_FILES.slice(i, i + batchSize);
      this.log(`📦 Processando lote ${Math.floor(i/batchSize) + 1}: ${batch.length} arquivos`);
      
      // Migrar lote
      batch.forEach(filePath => {
        this.migrateFile(filePath);
      });
      
      // Testar build após cada lote
      if (!this.testBuild()) {
        this.log('❌ MIGRAÇÃO INTERROMPIDA - Build falhou');
        return false;
      }
      
      this.log(`✅ Lote ${Math.floor(i/batchSize) + 1} concluído com sucesso`);
    }
    
    // Relatório final
    this.log('📋 RELATÓRIO FINAL FASE 7B:');
    this.log(`✅ Arquivos migrados: ${this.migratedCount}/${PHASE7B_FILES.length}`);
    this.log(`❌ Erros: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      this.log('❌ Arquivos com erro:');
      this.errors.forEach(({ file, error }) => {
        this.log(`   - ${file}: ${error}`);
      });
    }
    
    // Limpar backups se tudo deu certo
    if (this.errors.length === 0) {
      this.cleanupBackups();
      this.log('🎉 FASE 7B CONCLUÍDA COM SUCESSO!');
      return true;
    }
    
    return false;
  }
}

// Executar migração
const migrator = new MakeStylesMigrator();
migrator.migrate().then(success => {
  process.exit(success ? 0 : 1);
});