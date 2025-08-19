import { Request, Response } from 'express';
import { 
  validateAllConfigurations, 
  generateConfigReport,
  getFacebookConfig
} from '../config/facebookConfig';
import { configurationHealthCheck } from '../config';
import { facebookLogger } from '../utils/facebookLogger';

/**
 * Controller para gerenciar configurações do sistema
 */
export class ConfigurationController {

  /**
   * Health check completo da configuração
   */
  static async getHealthCheck(req: Request, res: Response): Promise<Response> {
    try {
      const healthCheck = configurationHealthCheck();
      
      // Determinar status HTTP baseado na saúde
      const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
      
      facebookLogger.info({
        type: 'configuration_health_check',
        status: healthCheck.status,
        userId: req.user?.id,
        companyId: req.user?.companyId
      }, `Configuration health check: ${healthCheck.status}`);
      
      return res.status(statusCode).json(healthCheck);
      
    } catch (error) {
      facebookLogger.error({
        type: 'configuration_health_check_error',
        error: error.message,
        userId: req.user?.id
      }, 'Configuration health check failed');
      
      return res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        recommendations: [
          'Check environment variables',
          'Review application logs',
          'Verify Facebook app configuration'
        ]
      });
    }
  }

  /**
   * Validação completa das configurações
   */
  static async validateConfiguration(req: Request, res: Response): Promise<Response> {
    try {
      const validation = validateAllConfigurations();
      
      const result = {
        valid: validation.valid,
        timestamp: new Date().toISOString(),
        summary: {
          errors: validation.errors.length,
          warnings: validation.warnings.length,
          totalChecks: validation.errors.length + validation.warnings.length
        },
        details: {
          errors: validation.errors,
          warnings: validation.warnings
        },
        configuration: {
          facebook: {
            appId: validation.config.appId,
            apiVersion: validation.config.apiVersion,
            hasAppSecret: !!validation.config.appSecret,
            hasAccessToken: !!validation.config.accessToken,
            instagramEnabled: validation.config.instagramEnabled,
            monitoringEnabled: validation.config.telemetryEnabled
          }
        }
      };
      
      const statusCode = validation.valid ? 200 : 400;
      
      facebookLogger.info({
        type: 'configuration_validation',
        valid: validation.valid,
        errors: validation.errors.length,
        warnings: validation.warnings.length,
        userId: req.user?.id
      }, `Configuration validation: ${validation.valid ? 'passed' : 'failed'}`);
      
      return res.status(statusCode).json(result);
      
    } catch (error) {
      facebookLogger.error({
        type: 'configuration_validation_error',
        error: error.message,
        userId: req.user?.id
      }, 'Configuration validation failed');
      
      return res.status(500).json({
        valid: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        summary: {
          errors: 1,
          warnings: 0,
          totalChecks: 1
        },
        details: {
          errors: [error.message],
          warnings: []
        }
      });
    }
  }

  /**
   * Relatório completo de configuração
   */
  static async getConfigurationReport(req: Request, res: Response): Promise<Response> {
    try {
      const report = generateConfigReport();
      
      facebookLogger.info({
        type: 'configuration_report_generated',
        environment: report.environment,
        userId: req.user?.id,
        errors: report.validation.errors.length,
        warnings: report.validation.warnings.length
      }, 'Configuration report generated');
      
      return res.json(report);
      
    } catch (error) {
      facebookLogger.error({
        type: 'configuration_report_error',
        error: error.message,
        userId: req.user?.id
      }, 'Configuration report generation failed');
      
      return res.status(500).json({
        error: 'Failed to generate configuration report',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Testa conectividade com APIs externas
   */
  static async testConnectivity(req: Request, res: Response): Promise<Response> {
    try {
      const config = getFacebookConfig();
      const tests = [];
      
      // Teste de conectividade com Facebook Graph API
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const facebookTest = await fetch(`${config.baseURL}/${config.apiVersion}/me?access_token=${config.accessToken}`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        tests.push({
          service: 'Facebook Graph API',
          status: facebookTest.ok ? 'success' : 'error',
          responseTime: Date.now(),
          details: facebookTest.ok ? 'Connected successfully' : `HTTP ${facebookTest.status}`,
          endpoint: `${config.baseURL}/${config.apiVersion}`
        });
      } catch (error) {
        tests.push({
          service: 'Facebook Graph API',
          status: 'error',
          responseTime: null,
          details: error.message,
          endpoint: `${config.baseURL}/${config.apiVersion}`
        });
      }
      
      // Teste de Instagram API (se habilitado)
      if (config.instagramEnabled && config.instagramAccessToken) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), config.timeout);
          
          const instagramTest = await fetch(`${config.baseURL}/${config.apiVersion}/${config.instagramBusinessAccountId}?access_token=${config.instagramAccessToken}`, {
            method: 'GET',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          tests.push({
            service: 'Instagram Business API',
            status: instagramTest.ok ? 'success' : 'error',
            responseTime: Date.now(),
            details: instagramTest.ok ? 'Connected successfully' : `HTTP ${instagramTest.status}`,
            endpoint: `${config.baseURL}/${config.apiVersion}/${config.instagramBusinessAccountId}`
          });
        } catch (error) {
          tests.push({
            service: 'Instagram Business API',
            status: 'error',
            responseTime: null,
            details: error.message,
            endpoint: `${config.baseURL}/${config.apiVersion}/${config.instagramBusinessAccountId}`
          });
        }
      }
      
      // Teste de webhook endpoint (se configurado)
      if (config.webhookDevURL || process.env.BACKEND_URL) {
        const webhookURL = config.webhookDevURL || `${process.env.BACKEND_URL}/webhooks/facebook`;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const webhookTest = await fetch(webhookURL, {
            method: 'GET',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          tests.push({
            service: 'Webhook Endpoint',
            status: webhookTest.status === 200 || webhookTest.status === 405 ? 'success' : 'warning',
            responseTime: Date.now(),
            details: webhookTest.status === 405 ? 'Endpoint accessible (GET not allowed)' : `HTTP ${webhookTest.status}`,
            endpoint: webhookURL
          });
        } catch (error) {
          tests.push({
            service: 'Webhook Endpoint',
            status: 'warning',
            responseTime: null,
            details: `Cannot reach webhook: ${error.message}`,
            endpoint: webhookURL
          });
        }
      }
      
      const successfulTests = tests.filter(test => test.status === 'success').length;
      const totalTests = tests.length;
      
      const result = {
        timestamp: new Date().toISOString(),
        summary: {
          total: totalTests,
          successful: successfulTests,
          failed: totalTests - successfulTests,
          successRate: totalTests > 0 ? (successfulTests / totalTests) * 100 : 0
        },
        tests,
        recommendations: []
      };
      
      // Adicionar recomendações baseadas nos resultados
      if (result.summary.successRate < 100) {
        result.recommendations.push('Some connectivity tests failed - check network and credentials');
      }
      
      if (!tests.find(test => test.service === 'Instagram Business API')) {
        result.recommendations.push('Instagram API not tested - configure Instagram credentials to enable testing');
      }
      
      const statusCode = result.summary.successRate >= 50 ? 200 : 503;
      
      facebookLogger.info({
        type: 'connectivity_test_completed',
        successRate: result.summary.successRate,
        totalTests: totalTests,
        successfulTests: successfulTests,
        userId: req.user?.id
      }, `Connectivity test completed: ${result.summary.successRate}% success rate`);
      
      return res.status(statusCode).json(result);
      
    } catch (error) {
      facebookLogger.error({
        type: 'connectivity_test_error',
        error: error.message,
        userId: req.user?.id
      }, 'Connectivity test failed');
      
      return res.status(500).json({
        error: 'Connectivity test failed',
        message: error.message,
        timestamp: new Date().toISOString(),
        recommendations: [
          'Check network connectivity',
          'Verify API credentials',
          'Review firewall settings'
        ]
      });
    }
  }

  /**
   * Informações sobre a configuração atual (sem dados sensíveis)
   */
  static async getConfigurationInfo(req: Request, res: Response): Promise<Response> {
    try {
      const config = getFacebookConfig();
      
      const info = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        facebook: {
          appId: config.appId,
          apiVersion: config.apiVersion,
          baseURL: config.baseURL,
          timeout: config.timeout,
          hasAppSecret: !!config.appSecret,
          hasAccessToken: !!config.accessToken,
          verifyToken: config.verifyToken ? `${config.verifyToken.substring(0, 10)}...` : 'not set'
        },
        instagram: {
          enabled: config.instagramEnabled,
          hasBusinessAccountId: !!config.instagramBusinessAccountId,
          hasAccessToken: !!config.instagramAccessToken,
          businessAccountId: config.instagramBusinessAccountId ? `${config.instagramBusinessAccountId.substring(0, 10)}...` : 'not set'
        },
        security: {
          webhookSignatureVerification: !config.skipWebhookSignature,
          debugMode: config.debugMode,
          rateLimitPerMinute: config.rateLimitPerMinute
        },
        monitoring: {
          logsEnabled: config.logsEnabled,
          logLevel: config.logLevel,
          telemetryEnabled: config.telemetryEnabled,
          healthCheckEnabled: config.healthCheckEnabled,
          alertsEnabled: config.alertsEnabled
        },
        performance: {
          cacheEnabled: config.cacheEnabled,
          cacheTTL: config.cacheTTL,
          autoRetry: config.autoRetry,
          maxRetries: config.maxRetries,
          retryBaseDelay: config.retryBaseDelay
        }
      };
      
      facebookLogger.debug({
        type: 'configuration_info_requested',
        userId: req.user?.id,
        companyId: req.user?.companyId
      }, 'Configuration info requested');
      
      return res.json(info);
      
    } catch (error) {
      facebookLogger.error({
        type: 'configuration_info_error',
        error: error.message,
        userId: req.user?.id
      }, 'Configuration info request failed');
      
      return res.status(500).json({
        error: 'Failed to get configuration info',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Diagnóstico rápido do sistema
   */
  static async quickDiagnostic(req: Request, res: Response): Promise<Response> {
    try {
      const startTime = Date.now();
      
      // Executar diagnósticos em paralelo
      const [
        validation,
        healthCheck,
        configReport
      ] = await Promise.allSettled([
        Promise.resolve(validateAllConfigurations()),
        Promise.resolve(configurationHealthCheck()),
        Promise.resolve(generateConfigReport())
      ]);
      
      const diagnosticTime = Date.now() - startTime;
      
      const diagnostic = {
        timestamp: new Date().toISOString(),
        diagnosticTime: `${diagnosticTime}ms`,
        overall: 'unknown' as 'healthy' | 'warning' | 'critical' | 'unknown',
        checks: {
          configuration: {
            status: validation.status === 'fulfilled' && validation.value.valid ? 'healthy' : 'critical',
            details: validation.status === 'fulfilled' ? {
              errors: validation.value.errors.length,
              warnings: validation.value.warnings.length
            } : { error: (validation as any).reason?.message }
          },
          systemHealth: {
            status: healthCheck.status === 'fulfilled' && healthCheck.value.status === 'healthy' ? 'healthy' : 'warning',
            details: healthCheck.status === 'fulfilled' ? {
              status: healthCheck.value.status
            } : { error: (healthCheck as any).reason?.message }
          },
          recommendations: {
            status: configReport.status === 'fulfilled' ? 'healthy' : 'warning',
            count: configReport.status === 'fulfilled' ? configReport.value.recommendations.length : 0
          }
        },
        summary: {
          criticalIssues: 0,
          warnings: 0,
          recommendations: 0
        }
      };
      
      // Determinar status geral
      let criticalIssues = 0;
      let warnings = 0;
      
      Object.values(diagnostic.checks).forEach(check => {
        if (check.status === 'critical') criticalIssues++;
        else if (check.status === 'warning') warnings++;
      });
      
      diagnostic.summary.criticalIssues = criticalIssues;
      diagnostic.summary.warnings = warnings;
      diagnostic.summary.recommendations = configReport.status === 'fulfilled' ? configReport.value.recommendations.length : 0;
      
      if (criticalIssues > 0) {
        diagnostic.overall = 'critical';
      } else if (warnings > 0) {
        diagnostic.overall = 'warning';
      } else {
        diagnostic.overall = 'healthy';
      }
      
      const statusCode = diagnostic.overall === 'healthy' ? 200 : diagnostic.overall === 'critical' ? 503 : 206;
      
      facebookLogger.info({
        type: 'quick_diagnostic_completed',
        overall: diagnostic.overall,
        criticalIssues,
        warnings,
        diagnosticTime,
        userId: req.user?.id
      }, `Quick diagnostic completed: ${diagnostic.overall}`);
      
      return res.status(statusCode).json(diagnostic);
      
    } catch (error) {
      facebookLogger.error({
        type: 'quick_diagnostic_error',
        error: error.message,
        userId: req.user?.id
      }, 'Quick diagnostic failed');
      
      return res.status(500).json({
        timestamp: new Date().toISOString(),
        overall: 'critical',
        error: error.message,
        checks: {},
        summary: {
          criticalIssues: 1,
          warnings: 0,
          recommendations: 0
        }
      });
    }
  }
}