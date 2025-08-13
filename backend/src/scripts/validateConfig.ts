#!/usr/bin/env node

import dotenv from 'dotenv';
import { 
  validateAllConfigurations, 
  generateConfigReport,
  getFacebookConfig 
} from '../config/facebookConfig';
import { configurationHealthCheck } from '../config';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script de validação rápida da configuração Facebook/Instagram
 * 
 * Execute com: npx ts-node src/scripts/validateConfig.ts
 * Ou adicione ao package.json: npm run config:validate
 */

interface ValidationSummary {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  configuration: any;
}

async function validateConfiguration(): Promise<ValidationSummary> {
  console.log('🔍 Validando Configuração Facebook/Instagram...');
  console.log('=================================================\n');

  try {
    // 1. Validação básica de configuração
    console.log('📋 Executando validação básica...');
    const validation = validateAllConfigurations();
    
    console.log(`   ✅ Configuração válida: ${validation.valid ? 'SIM' : 'NÃO'}`);
    console.log(`   ❌ Erros encontrados: ${validation.errors.length}`);
    console.log(`   ⚠️  Avisos encontrados: ${validation.warnings.length}`);
    
    if (validation.errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      validation.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Avisos encontrados:');
      validation.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    // 2. Health check do sistema
    console.log('\n🏥 Executando health check do sistema...');
    const healthCheck = configurationHealthCheck();
    
    console.log(`   🎯 Status geral: ${healthCheck.status}`);
    console.log(`   🌍 Ambiente: ${healthCheck.environment || 'indefinido'}`);
    
    // 3. Relatório detalhado
    console.log('\n📊 Gerando relatório detalhado...');
    const report = generateConfigReport();
    
    console.log(`   📅 Timestamp: ${report.timestamp}`);
    console.log(`   🔧 Ambiente: ${report.environment}`);
    console.log(`   💡 Recomendações: ${report.recommendations.length}`);
    
    // 4. Configuração atual
    console.log('\n⚙️  Configuração atual:');
    const config = getFacebookConfig();
    
    console.log(`   📱 Facebook App ID: ${config.appId || 'NÃO CONFIGURADO'}`);
    console.log(`   🔑 App Secret configurado: ${config.appSecret ? 'SIM' : 'NÃO'}`);
    console.log(`   🎫 Access Token configurado: ${config.accessToken ? 'SIM' : 'NÃO'}`);
    console.log(`   🔐 Verify Token: ${config.verifyToken || 'NÃO CONFIGURADO'}`);
    console.log(`   📊 API Version: ${config.apiVersion}`);
    console.log(`   🌐 Base URL: ${config.baseURL}`);
    
    console.log('\n📸 Instagram:');
    console.log(`   🔘 Habilitado: ${config.instagramEnabled ? 'SIM' : 'NÃO'}`);
    console.log(`   🆔 Business Account ID: ${config.instagramBusinessAccountId || 'NÃO CONFIGURADO'}`);
    console.log(`   🎫 Access Token: ${config.instagramAccessToken ? 'SIM' : 'NÃO'}`);
    
    console.log('\n📊 Monitoramento:');
    console.log(`   📈 Telemetria: ${config.telemetryEnabled ? 'HABILITADA' : 'DESABILITADA'}`);
    console.log(`   🏥 Health Check: ${config.healthCheckEnabled ? 'HABILITADO' : 'DESABILITADO'}`);
    console.log(`   🚨 Alertas: ${config.alertsEnabled ? 'HABILITADOS' : 'DESABILITADOS'}`);
    console.log(`   📝 Log Level: ${config.logLevel}`);
    
    console.log('\n🔒 Segurança:');
    console.log(`   🔏 Webhook Signature: ${config.skipWebhookSignature ? 'DESABILITADA (DEV)' : 'HABILITADA'}`);
    console.log(`   🚀 Debug Mode: ${config.debugMode ? 'HABILITADO' : 'DESABILITADO'}`);
    console.log(`   ⏱️  Rate Limit: ${config.rateLimitPerMinute}/min`);
    console.log(`   ⏰ Timeout: ${config.timeout}ms`);
    
    console.log('\n⚡ Performance:');
    console.log(`   💾 Cache: ${config.cacheEnabled ? 'HABILITADO' : 'DESABILITADO'}`);
    console.log(`   🔄 Auto Retry: ${config.autoRetry ? 'HABILITADO' : 'DESABILITADO'}`);
    console.log(`   🔢 Max Retries: ${config.maxRetries}`);
    console.log(`   ⏳ Retry Delay: ${config.retryBaseDelay}ms`);

    // 5. Recomendações
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recomendações:');
      report.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    // 6. Status final
    console.log('\n🎯 Status Final:');
    
    const summary: ValidationSummary = {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      recommendations: report.recommendations,
      configuration: {
        facebook: {
          appId: config.appId,
          hasAppSecret: !!config.appSecret,
          hasAccessToken: !!config.accessToken,
          verifyToken: config.verifyToken,
          apiVersion: config.apiVersion
        },
        instagram: {
          enabled: config.instagramEnabled,
          hasBusinessAccountId: !!config.instagramBusinessAccountId,
          hasAccessToken: !!config.instagramAccessToken
        },
        monitoring: {
          telemetry: config.telemetryEnabled,
          healthCheck: config.healthCheckEnabled,
          alerts: config.alertsEnabled,
          logLevel: config.logLevel
        },
        security: {
          webhookSignature: !config.skipWebhookSignature,
          debugMode: config.debugMode,
          rateLimit: config.rateLimitPerMinute,
          timeout: config.timeout
        },
        performance: {
          cache: config.cacheEnabled,
          autoRetry: config.autoRetry,
          maxRetries: config.maxRetries
        }
      }
    };

    if (validation.valid && validation.errors.length === 0) {
      console.log('   ✅ CONFIGURAÇÃO VÁLIDA - Pronta para uso!');
      
      if (validation.warnings.length === 0) {
        console.log('   🏆 CONFIGURAÇÃO PERFEITA - Sem avisos!');
      } else {
        console.log(`   ⚠️  Configuração válida com ${validation.warnings.length} avisos menores`);
      }
      
    } else {
      console.log('   ❌ CONFIGURAÇÃO INVÁLIDA - Correções necessárias');
      console.log('\n🔧 Próximos passos:');
      console.log('   1. Revisar erros listados acima');
      console.log('   2. Verificar arquivo .env');
      console.log('   3. Executar script de setup: npx ts-node src/scripts/setupFacebookIntegration.ts');
      console.log('   4. Consultar documentação: FACEBOOK_INSTAGRAM_SETUP.md');
    }

    console.log('\n=================================================');
    
    return summary;

  } catch (error) {
    console.error('💥 Erro durante validação:', error.message);
    
    return {
      valid: false,
      errors: [error.message],
      warnings: [],
      recommendations: [
        'Verificar se todas as variáveis de ambiente estão configuradas',
        'Revisar arquivo .env',
        'Executar script de setup automático',
        'Consultar documentação completa'
      ],
      configuration: null
    };
  }
}

// Executar validação se o script for chamado diretamente
if (require.main === module) {
  validateConfiguration()
    .then(summary => {
      // Código de saída baseado no resultado
      if (summary.valid && summary.errors.length === 0) {
        process.exit(0); // Sucesso
      } else if (summary.warnings.length > 0 && summary.errors.length === 0) {
        process.exit(1); // Avisos apenas
      } else {
        process.exit(2); // Erros críticos
      }
    })
    .catch(error => {
      console.error('Script de validação falhou:', error);
      process.exit(3); // Erro do script
    });
}

export { validateConfiguration };
export type { ValidationSummary };