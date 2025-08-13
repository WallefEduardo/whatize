import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { 
  validateAllConfigurations, 
  generateConfigReport,
  getFacebookConfig 
} from '../config/facebookConfig';
import { configurationHealthCheck } from '../config';
import { facebookLogger } from '../utils/facebookLogger';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script de teste completo para Phase 5 - Configuração de Ambiente
 * 
 * Testa:
 * 1. Validação de configuração
 * 2. Sistema de health check
 * 3. Endpoints da API de configuração
 * 4. Geração de relatórios
 * 5. Setup wizard (modo de teste)
 * 6. Conectividade com APIs externas
 */

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED';
  duration: number;
  details?: any;
  error?: string;
}

class FacebookPhase5Tester {
  private results: TestResult[] = [];
  private serverURL: string;
  private testStartTime: number = 0;

  constructor() {
    this.serverURL = process.env.BACKEND_URL || 'http://localhost:4035';
  }

  /**
   * Executa todos os testes da Phase 5
   */
  async runAllTests(): Promise<void> {
    console.log('\n🧪 Iniciando Testes Facebook/Instagram Phase 5 - Configuração de Ambiente');
    console.log('================================================================================\n');

    this.testStartTime = Date.now();

    try {
      // Testes de validação básica
      await this.testConfigurationValidation();
      await this.testHealthCheckSystem();
      await this.testConfigurationReport();
      
      // Testes de endpoints da API
      await this.testHealthCheckEndpoint();
      await this.testValidationEndpoint();
      await this.testConnectivityEndpoint();
      await this.testConfigurationInfoEndpoint();
      await this.testQuickDiagnosticEndpoint();
      
      // Testes de conectividade externa
      await this.testFacebookAPIConnectivity();
      await this.testInstagramAPIConnectivity();
      
      // Testes do sistema de setup
      await this.testEnvironmentFileGeneration();
      await this.testConfigurationPersistence();
      
      // Testes de segurança e performance
      await this.testSecurityValidation();
      await this.testPerformanceConfiguration();
      
      // Sumário final
      this.printTestSummary();
      
    } catch (error) {
      console.error('💥 Erro crítico durante os testes:', error.message);
      process.exit(1);
    }
  }

  /**
   * Teste 1: Validação de configuração
   */
  private async testConfigurationValidation(): Promise<void> {
    const testName = 'Configuration Validation';
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testando validação de configuração...');
      
      const validation = validateAllConfigurations();
      
      if (validation.valid) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          errors: validation.errors.length,
          warnings: validation.warnings.length,
          config: {
            appId: validation.config.appId,
            apiVersion: validation.config.apiVersion,
            instagramEnabled: validation.config.instagramEnabled
          }
        });
        console.log('✅ Validação de configuração passou');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, {
          errors: validation.errors,
          warnings: validation.warnings
        });
        console.log('❌ Validação de configuração falhou');
        validation.errors.forEach(error => console.log(`   • ${error}`));
      }
      
    } catch (error) {
      this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
      console.log(`❌ Erro na validação: ${error.message}`);
    }
  }

  /**
   * Teste 2: Sistema de health check
   */
  private async testHealthCheckSystem(): Promise<void> {
    const testName = 'Health Check System';
    const startTime = Date.now();
    
    try {
      console.log('🏥 Testando sistema de health check...');
      
      const healthCheck = configurationHealthCheck();
      
      if (healthCheck.status === 'healthy') {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          status: healthCheck.status,
          environment: healthCheck.environment,
          configuration: healthCheck.configuration
        });
        console.log('✅ Health check sistema passou');
      } else {
        this.addResult(testName, 'WARNING', Date.now() - startTime, {
          status: healthCheck.status,
          error: healthCheck.error,
          recommendations: healthCheck.recommendations
        });
        console.log('⚠️  Health check retornou status não saudável');
      }
      
    } catch (error) {
      this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
      console.log(`❌ Erro no health check: ${error.message}`);
    }
  }

  /**
   * Teste 3: Geração de relatório de configuração
   */
  private async testConfigurationReport(): Promise<void> {
    const testName = 'Configuration Report Generation';
    const startTime = Date.now();
    
    try {
      console.log('📊 Testando geração de relatório...');
      
      const report = generateConfigReport();
      
      const hasValidStructure = report.timestamp && 
                                report.environment && 
                                report.validation && 
                                Array.isArray(report.recommendations);
      
      if (hasValidStructure) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          environment: report.environment,
          validationErrors: report.validation.errors.length,
          validationWarnings: report.validation.warnings.length,
          recommendationsCount: report.recommendations.length
        });
        console.log('✅ Geração de relatório passou');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, {
          report: report
        });
        console.log('❌ Estrutura do relatório inválida');
      }
      
    } catch (error) {
      this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
      console.log(`❌ Erro na geração de relatório: ${error.message}`);
    }
  }

  /**
   * Teste 4: Endpoint de health check da API
   */
  private async testHealthCheckEndpoint(): Promise<void> {
    const testName = 'Health Check API Endpoint';
    const startTime = Date.now();
    
    try {
      console.log('🌐 Testando endpoint /api/configuration/health...');
      
      const response = await axios.get(`${this.serverURL}/api/configuration/health`, {
        timeout: 10000,
        validateStatus: () => true // Aceita qualquer status
      });
      
      const isHealthy = response.status === 200 && response.data.status === 'healthy';
      const isUnhealthy = response.status === 503 && response.data.status === 'unhealthy';
      
      if (isHealthy || isUnhealthy) {
        this.addResult(testName, isHealthy ? 'PASSED' : 'WARNING', Date.now() - startTime, {
          status: response.status,
          responseStatus: response.data.status,
          timestamp: response.data.timestamp
        });
        console.log(`${isHealthy ? '✅' : '⚠️'} Endpoint health check: ${response.data.status}`);
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, {
          status: response.status,
          data: response.data
        });
        console.log('❌ Endpoint health check retornou formato inválido');
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.addResult(testName, 'SKIPPED', Date.now() - startTime, null, 'Servidor não está rodando');
        console.log('⏭️  Servidor não está rodando - teste ignorado');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
        console.log(`❌ Erro no endpoint health check: ${error.message}`);
      }
    }
  }

  /**
   * Teste 5: Endpoint de validação da API
   */
  private async testValidationEndpoint(): Promise<void> {
    const testName = 'Validation API Endpoint';
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testando endpoint /api/configuration/validate...');
      
      // Nota: Este endpoint requer autenticação, então esperamos 401 ou 403
      const response = await axios.get(`${this.serverURL}/api/configuration/validate`, {
        timeout: 10000,
        validateStatus: () => true
      });
      
      if (response.status === 401 || response.status === 403) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          status: response.status,
          message: 'Endpoint protegido corretamente'
        });
        console.log('✅ Endpoint validation protegido corretamente');
      } else {
        this.addResult(testName, 'WARNING', Date.now() - startTime, {
          status: response.status,
          data: response.data
        });
        console.log('⚠️  Endpoint validation sem proteção de autenticação');
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.addResult(testName, 'SKIPPED', Date.now() - startTime, null, 'Servidor não está rodando');
        console.log('⏭️  Servidor não está rodando - teste ignorado');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
        console.log(`❌ Erro no endpoint validation: ${error.message}`);
      }
    }
  }

  /**
   * Teste 6: Endpoint de conectividade
   */
  private async testConnectivityEndpoint(): Promise<void> {
    const testName = 'Connectivity API Endpoint';
    const startTime = Date.now();
    
    try {
      console.log('🔗 Testando endpoint /api/configuration/connectivity...');
      
      const response = await axios.get(`${this.serverURL}/api/configuration/connectivity`, {
        timeout: 15000,
        validateStatus: () => true
      });
      
      // Endpoint protegido, esperamos 401/403
      if (response.status === 401 || response.status === 403) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          status: response.status,
          message: 'Endpoint protegido corretamente'
        });
        console.log('✅ Endpoint connectivity protegido corretamente');
      } else {
        this.addResult(testName, 'WARNING', Date.now() - startTime, {
          status: response.status,
          data: response.data
        });
        console.log('⚠️  Endpoint connectivity sem proteção de autenticação');
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.addResult(testName, 'SKIPPED', Date.now() - startTime, null, 'Servidor não está rodando');
        console.log('⏭️  Servidor não está rodando - teste ignorado');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
        console.log(`❌ Erro no endpoint connectivity: ${error.message}`);
      }
    }
  }

  /**
   * Teste 7: Endpoint de informações de configuração
   */
  private async testConfigurationInfoEndpoint(): Promise<void> {
    const testName = 'Configuration Info API Endpoint';
    const startTime = Date.now();
    
    try {
      console.log('ℹ️  Testando endpoint /api/configuration/info...');
      
      const response = await axios.get(`${this.serverURL}/api/configuration/info`, {
        timeout: 10000,
        validateStatus: () => true
      });
      
      // Endpoint protegido, esperamos 401/403
      if (response.status === 401 || response.status === 403) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          status: response.status,
          message: 'Endpoint protegido corretamente'
        });
        console.log('✅ Endpoint info protegido corretamente');
      } else {
        this.addResult(testName, 'WARNING', Date.now() - startTime, {
          status: response.status,
          data: response.data
        });
        console.log('⚠️  Endpoint info sem proteção de autenticação');
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.addResult(testName, 'SKIPPED', Date.now() - startTime, null, 'Servidor não está rodando');
        console.log('⏭️  Servidor não está rodando - teste ignorado');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
        console.log(`❌ Erro no endpoint info: ${error.message}`);
      }
    }
  }

  /**
   * Teste 8: Endpoint de diagnóstico rápido
   */
  private async testQuickDiagnosticEndpoint(): Promise<void> {
    const testName = 'Quick Diagnostic API Endpoint';
    const startTime = Date.now();
    
    try {
      console.log('⚡ Testando endpoint /api/configuration/diagnostic...');
      
      const response = await axios.get(`${this.serverURL}/api/configuration/diagnostic`, {
        timeout: 15000,
        validateStatus: () => true
      });
      
      // Endpoint protegido, esperamos 401/403
      if (response.status === 401 || response.status === 403) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          status: response.status,
          message: 'Endpoint protegido corretamente'
        });
        console.log('✅ Endpoint diagnostic protegido corretamente');
      } else {
        this.addResult(testName, 'WARNING', Date.now() - startTime, {
          status: response.status,
          data: response.data
        });
        console.log('⚠️  Endpoint diagnostic sem proteção de autenticação');
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.addResult(testName, 'SKIPPED', Date.now() - startTime, null, 'Servidor não está rodando');
        console.log('⏭️  Servidor não está rodando - teste ignorado');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
        console.log(`❌ Erro no endpoint diagnostic: ${error.message}`);
      }
    }
  }

  /**
   * Teste 9: Conectividade com Facebook API
   */
  private async testFacebookAPIConnectivity(): Promise<void> {
    const testName = 'Facebook API Connectivity';
    const startTime = Date.now();
    
    try {
      console.log('📱 Testando conectividade com Facebook API...');
      
      const config = getFacebookConfig();
      
      if (!config.accessToken) {
        this.addResult(testName, 'SKIPPED', Date.now() - startTime, null, 'Access token não configurado');
        console.log('⏭️  Access token não configurado - teste ignorado');
        return;
      }
      
      const response = await axios.get(`${config.baseURL}/${config.apiVersion}/me`, {
        params: {
          access_token: config.accessToken
        },
        timeout: 10000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          status: response.status,
          appId: response.data.id,
          name: response.data.name
        });
        console.log('✅ Conectividade Facebook API passou');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, {
          status: response.status,
          error: response.data
        });
        console.log(`❌ Facebook API retornou status ${response.status}`);
      }
      
    } catch (error) {
      this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
      console.log(`❌ Erro na conectividade Facebook: ${error.message}`);
    }
  }

  /**
   * Teste 10: Conectividade com Instagram API
   */
  private async testInstagramAPIConnectivity(): Promise<void> {
    const testName = 'Instagram API Connectivity';
    const startTime = Date.now();
    
    try {
      console.log('📸 Testando conectividade com Instagram API...');
      
      const config = getFacebookConfig();
      
      if (!config.instagramEnabled || !config.instagramAccessToken || !config.instagramBusinessAccountId) {
        this.addResult(testName, 'SKIPPED', Date.now() - startTime, null, 'Instagram não configurado');
        console.log('⏭️  Instagram não configurado - teste ignorado');
        return;
      }
      
      const response = await axios.get(`${config.baseURL}/${config.apiVersion}/${config.instagramBusinessAccountId}`, {
        params: {
          access_token: config.instagramAccessToken,
          fields: 'id,name,username'
        },
        timeout: 10000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          status: response.status,
          accountId: response.data.id,
          username: response.data.username
        });
        console.log('✅ Conectividade Instagram API passou');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, {
          status: response.status,
          error: response.data
        });
        console.log(`❌ Instagram API retornou status ${response.status}`);
      }
      
    } catch (error) {
      this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
      console.log(`❌ Erro na conectividade Instagram: ${error.message}`);
    }
  }

  /**
   * Teste 11: Geração de arquivo de ambiente
   */
  private async testEnvironmentFileGeneration(): Promise<void> {
    const testName = 'Environment File Generation';
    const startTime = Date.now();
    
    try {
      console.log('📝 Testando geração de arquivo .env...');
      
      const testEnvPath = path.join(process.cwd(), '.env.test');
      const envExamplePath = path.join(process.cwd(), '.env.example');
      
      // Verificar se .env.example existe
      if (!fs.existsSync(envExamplePath)) {
        this.addResult(testName, 'FAILED', Date.now() - startTime, null, '.env.example não encontrado');
        console.log('❌ .env.example não encontrado');
        return;
      }
      
      // Ler .env.example e verificar se contém configurações Facebook
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
      const hasFacebookConfig = envExampleContent.includes('FACEBOOK_APP_ID') &&
                                envExampleContent.includes('FACEBOOK_APP_SECRET') &&
                                envExampleContent.includes('VERIFY_TOKEN');
      
      if (hasFacebookConfig) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          envExampleExists: true,
          hasFacebookConfig: true,
          linesCount: envExampleContent.split('\n').length
        });
        console.log('✅ .env.example contém configurações Facebook');
      } else {
        this.addResult(testName, 'WARNING', Date.now() - startTime, {
          envExampleExists: true,
          hasFacebookConfig: false
        });
        console.log('⚠️  .env.example não contém todas as configurações Facebook');
      }
      
    } catch (error) {
      this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
      console.log(`❌ Erro na verificação do arquivo de ambiente: ${error.message}`);
    }
  }

  /**
   * Teste 12: Persistência de configuração
   */
  private async testConfigurationPersistence(): Promise<void> {
    const testName = 'Configuration Persistence';
    const startTime = Date.now();
    
    try {
      console.log('💾 Testando persistência de configuração...');
      
      // Verificar se as configurações são carregadas corretamente
      const originalEnv = process.env.FACEBOOK_APP_ID;
      
      // Simular mudança de configuração
      process.env.FACEBOOK_APP_ID = '1443021550275833';
      
      const config = getFacebookConfig();
      
      if (config.appId === '1443021550275833') {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          configLoaded: true,
          appId: config.appId,
          apiVersion: config.apiVersion
        });
        console.log('✅ Configuração carregada corretamente');
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, {
          expected: '1443021550275833',
          actual: config.appId
        });
        console.log('❌ Configuração não carregada corretamente');
      }
      
      // Restaurar configuração original
      if (originalEnv) {
        process.env.FACEBOOK_APP_ID = originalEnv;
      }
      
    } catch (error) {
      this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
      console.log(`❌ Erro na persistência de configuração: ${error.message}`);
    }
  }

  /**
   * Teste 13: Validação de segurança
   */
  private async testSecurityValidation(): Promise<void> {
    const testName = 'Security Configuration Validation';
    const startTime = Date.now();
    
    try {
      console.log('🔒 Testando validações de segurança...');
      
      const config = getFacebookConfig();
      
      let securityIssues = 0;
      const securityChecks = {
        hasAppSecret: !!config.appSecret,
        webhookSignatureEnabled: !config.skipWebhookSignature,
        rateLimitConfigured: config.rateLimitPerMinute > 0,
        timeoutConfigured: config.timeout > 0,
        logsEnabled: config.logsEnabled
      };
      
      Object.entries(securityChecks).forEach(([check, passed]) => {
        if (!passed) securityIssues++;
      });
      
      if (securityIssues === 0) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, securityChecks);
        console.log('✅ Todas as validações de segurança passaram');
      } else if (securityIssues <= 2) {
        this.addResult(testName, 'WARNING', Date.now() - startTime, {
          ...securityChecks,
          securityIssues
        });
        console.log(`⚠️  ${securityIssues} problemas de segurança encontrados`);
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, {
          ...securityChecks,
          securityIssues
        });
        console.log(`❌ ${securityIssues} problemas críticos de segurança`);
      }
      
    } catch (error) {
      this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
      console.log(`❌ Erro na validação de segurança: ${error.message}`);
    }
  }

  /**
   * Teste 14: Configuração de performance
   */
  private async testPerformanceConfiguration(): Promise<void> {
    const testName = 'Performance Configuration';
    const startTime = Date.now();
    
    try {
      console.log('⚡ Testando configurações de performance...');
      
      const config = getFacebookConfig();
      
      const performanceChecks = {
        cacheEnabled: config.cacheEnabled,
        retryEnabled: config.autoRetry,
        reasonableTimeout: config.timeout >= 10000 && config.timeout <= 60000,
        reasonableRetries: config.maxRetries >= 1 && config.maxRetries <= 5,
        telemetryEnabled: config.telemetryEnabled
      };
      
      const passedChecks = Object.values(performanceChecks).filter(Boolean).length;
      const totalChecks = Object.keys(performanceChecks).length;
      const successRate = (passedChecks / totalChecks) * 100;
      
      if (successRate >= 80) {
        this.addResult(testName, 'PASSED', Date.now() - startTime, {
          ...performanceChecks,
          successRate: `${successRate}%`
        });
        console.log(`✅ Configurações de performance: ${successRate}% otimizadas`);
      } else if (successRate >= 60) {
        this.addResult(testName, 'WARNING', Date.now() - startTime, {
          ...performanceChecks,
          successRate: `${successRate}%`
        });
        console.log(`⚠️  Configurações de performance: ${successRate}% otimizadas`);
      } else {
        this.addResult(testName, 'FAILED', Date.now() - startTime, {
          ...performanceChecks,
          successRate: `${successRate}%`
        });
        console.log(`❌ Configurações de performance insuficientes: ${successRate}%`);
      }
      
    } catch (error) {
      this.addResult(testName, 'FAILED', Date.now() - startTime, null, error.message);
      console.log(`❌ Erro na validação de performance: ${error.message}`);
    }
  }

  /**
   * Adiciona resultado de teste
   */
  private addResult(name: string, status: TestResult['status'], duration: number, details?: any, error?: string): void {
    this.results.push({
      name,
      status,
      duration,
      details,
      error
    });
  }

  /**
   * Imprime sumário dos testes
   */
  private printTestSummary(): void {
    const totalTime = Date.now() - this.testStartTime;
    
    console.log('\n📊 Relatório de Testes Phase 5 - Configuração de Ambiente');
    console.log('================================================================================');
    
    // Estatísticas gerais
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const skipped = this.results.filter(r => r.status === 'SKIPPED').length;
    const total = this.results.length;
    
    console.log(`\n📈 Estatísticas:`);
    console.log(`   Total de testes: ${total}`);
    console.log(`   ✅ Passou: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`   ❌ Falhou: ${failed} (${((failed/total)*100).toFixed(1)}%)`);
    console.log(`   ⚠️  Avisos: ${warnings} (${((warnings/total)*100).toFixed(1)}%)`);
    console.log(`   ⏭️  Ignorados: ${skipped} (${((skipped/total)*100).toFixed(1)}%)`);
    console.log(`   ⏱️  Tempo total: ${totalTime}ms`);
    
    // Detalhes por teste
    console.log(`\n📋 Detalhes dos Testes:`);
    this.results.forEach((result, index) => {
      const icon = {
        'PASSED': '✅',
        'FAILED': '❌',
        'WARNING': '⚠️',
        'SKIPPED': '⏭️'
      }[result.status];
      
      console.log(`   ${index + 1}. ${icon} ${result.name} (${result.duration}ms)`);
      
      if (result.error) {
        console.log(`      Erro: ${result.error}`);
      }
      
      if (result.details && result.status === 'FAILED') {
        console.log(`      Detalhes: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`);
      }
    });
    
    // Recomendações
    console.log(`\n💡 Recomendações:`);
    
    if (failed > 0) {
      console.log('   • Verificar configurações que falharam');
      console.log('   • Revisar arquivos .env e credenciais');
      console.log('   • Consultar logs de aplicação para detalhes');
    }
    
    if (warnings > 0) {
      console.log('   • Verificar configurações com avisos');
      console.log('   • Considerar otimizações de segurança/performance');
    }
    
    if (skipped > 0) {
      console.log('   • Iniciar servidor para testar endpoints HTTP');
      console.log('   • Configurar credenciais completas para testes de conectividade');
    }
    
    // Status final
    console.log(`\n🎯 Status Final:`);
    
    if (failed === 0 && warnings <= 2) {
      console.log('   ✅ Configuração Phase 5 está pronta para produção!');
    } else if (failed <= 2 && warnings <= 4) {
      console.log('   ⚠️  Configuração Phase 5 funcional com alguns ajustes necessários');
    } else {
      console.log('   ❌ Configuração Phase 5 requer correções antes do uso em produção');
    }
    
    console.log('\n================================================================================');
    
    // Log estruturado final
    facebookLogger.info({
      type: 'facebook_phase5_test_completed',
      totalTests: total,
      passed,
      failed,
      warnings,
      skipped,
      totalTime,
      successRate: ((passed + warnings) / total) * 100
    }, 'Facebook Phase 5 configuration tests completed');
  }
}

// Executar os testes se o script for chamado diretamente
if (require.main === module) {
  const tester = new FacebookPhase5Tester();
  tester.runAllTests().catch(error => {
    console.error('💥 Testes falharam:', error);
    process.exit(1);
  });
}

export { FacebookPhase5Tester };