// Script de validação do sistema durante migração
// Garante que funcionalidades críticas permanecem intactas

const fs = require('fs');
const path = require('path');

class SystemValidator {
  constructor() {
    this.criticalFiles = [
      'src/App.js',
      'src/pages/Tickets/index.js',
      'src/components/MessageInput',
      'src/services/socket.js',
      'src/services/api.js',
      'src/context',
      'src/hooks'
    ];
    
    this.results = {
      criticalFiles: { status: 'pending', errors: [] },
      dependencies: { status: 'pending', errors: [] },
      buildConfig: { status: 'pending', errors: [] },
      preservation: { status: 'pending', errors: [] }
    };
  }

  validateCriticalFiles() {
    console.log('🔍 Validando arquivos críticos...');
    
    for (const file of this.criticalFiles) {
      const fullPath = path.join(__dirname, '..', file);
      
      try {
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          if (stats.isFile() || stats.isDirectory()) {
            console.log(`✅ ${file} - OK`);
          }
        } else {
          this.results.criticalFiles.errors.push(`❌ ${file} - NÃO ENCONTRADO`);
        }
      } catch (error) {
        this.results.criticalFiles.errors.push(`❌ ${file} - ERRO: ${error.message}`);
      }
    }
    
    this.results.criticalFiles.status = this.results.criticalFiles.errors.length === 0 ? 'success' : 'error';
  }

  validateDependencies() {
    console.log('📦 Validando dependências críticas...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const criticalDeps = [
        '@material-ui/core',
        'react',
        'react-dom',
        'react-scripts',
        'socket.io-client'
      ];
      
      for (const dep of criticalDeps) {
        if (packageJson.dependencies[dep]) {
          console.log(`✅ ${dep}@${packageJson.dependencies[dep]} - OK`);
        } else {
          this.results.dependencies.errors.push(`❌ ${dep} - NÃO ENCONTRADO`);
        }
      }
      
      this.results.dependencies.status = this.results.dependencies.errors.length === 0 ? 'success' : 'error';
    } catch (error) {
      this.results.dependencies.errors.push(`❌ Erro ao ler package.json: ${error.message}`);
      this.results.dependencies.status = 'error';
    }
  }

  validateBuildConfiguration() {
    console.log('⚙️ Validando configuração de build...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Verifica se os scripts essenciais existem
      const requiredScripts = ['start', 'build', 'dev'];
      
      for (const script of requiredScripts) {
        if (packageJson.scripts[script]) {
          console.log(`✅ Script '${script}' - OK`);
        } else {
          this.results.buildConfig.errors.push(`❌ Script '${script}' - NÃO ENCONTRADO`);
        }
      }
      
      // Verifica flag de compatibilidade
      if (packageJson.scripts.start && packageJson.scripts.start.includes('--openssl-legacy-provider')) {
        console.log('✅ Flag de compatibilidade OpenSSL - OK');
      } else {
        this.results.buildConfig.errors.push('⚠️ Flag --openssl-legacy-provider não encontrada');
      }
      
      this.results.buildConfig.status = this.results.buildConfig.errors.length === 0 ? 'success' : 'warning';
    } catch (error) {
      this.results.buildConfig.errors.push(`❌ Erro na validação de build: ${error.message}`);
      this.results.buildConfig.status = 'error';
    }
  }

  validatePreservationConfig() {
    console.log('🛡️ Validando configurações de preservação...');
    
    try {
      // Verifica se o arquivo de configuração de migração existe
      if (fs.existsSync('migration-config.json')) {
        const config = JSON.parse(fs.readFileSync('migration-config.json', 'utf8'));
        
        if (config.migration && config.migration.preserveMode === true) {
          console.log('✅ Modo de preservação ativado - OK');
        } else {
          this.results.preservation.errors.push('❌ Modo de preservação NÃO ativado');
        }
        
        if (config.migration && config.migration.breakingChangesAllowed === false) {
          console.log('✅ Breaking changes bloqueados - OK');
        } else {
          this.results.preservation.errors.push('⚠️ Breaking changes não bloqueados');
        }
        
      } else {
        this.results.preservation.errors.push('❌ Arquivo migration-config.json não encontrado');
      }
      
      this.results.preservation.status = this.results.preservation.errors.length === 0 ? 'success' : 'error';
    } catch (error) {
      this.results.preservation.errors.push(`❌ Erro na validação de preservação: ${error.message}`);
      this.results.preservation.status = 'error';
    }
  }

  generateReport() {
    console.log('\n📋 RELATÓRIO DE VALIDAÇÃO DO SISTEMA\n');
    console.log('='.repeat(50));
    
    Object.entries(this.results).forEach(([category, result]) => {
      const statusIcon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`\n${statusIcon} ${category.toUpperCase()}: ${result.status.toUpperCase()}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`  ${error}`));
      }
    });
    
    const overallStatus = Object.values(this.results).every(r => r.status === 'success') ? 'SUCCESS' : 'NEEDS_ATTENTION';
    console.log(`\n${'='.repeat(50)}`);
    console.log(`STATUS GERAL: ${overallStatus}`);
    
    if (overallStatus === 'SUCCESS') {
      console.log('🎉 Sistema validado com sucesso! Migração pode prosseguir.');
    } else {
      console.log('⚠️ Atenção necessária antes de prosseguir com a migração.');
    }
    
    return overallStatus === 'SUCCESS';
  }

  run() {
    console.log('🚀 Iniciando validação do sistema...\n');
    
    this.validateCriticalFiles();
    this.validateDependencies();
    this.validateBuildConfiguration();
    this.validatePreservationConfig();
    
    return this.generateReport();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const validator = new SystemValidator();
  const success = validator.run();
  process.exit(success ? 0 : 1);
}

module.exports = SystemValidator;