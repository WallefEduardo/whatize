import { Request, Response } from 'express';
import { facebookMetrics } from '../services/FacebookServices/FacebookMetrics';
import { facebookHealthCheck } from '../services/FacebookServices/FacebookHealthCheck';
import { getAllClientsStats, clearClientCache } from '../services/FacebookServices/FacebookClientWrapper';
import { InstagramServiceWrapper } from '../services/InstagramServices/InstagramServiceWrapper';
import { facebookLogger } from '../utils/facebookLogger';
import Company from '../models/Company';

/**
 * Controller para dashboard de monitoramento das APIs Facebook/Instagram
 * Fornece endpoints para métricas, health checks e administração
 */
export class FacebookMonitoringController {

  /**
   * Dashboard principal com visão geral do sistema
   */
  static async getDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const companyId = req.user?.companyId || 0;
      
      // Coleta dados de todos os componentes
      const [
        systemHealth,
        currentMetrics,
        metricsHistory,
        facebookClients,
        instagramClients,
        systemStats
      ] = await Promise.all([
        facebookHealthCheck.performSystemHealthCheck(),
        facebookMetrics.getCurrentMetrics(),
        facebookMetrics.getMetricsForPeriod(24), // últimas 24 horas
        getAllClientsStats(),
        InstagramServiceWrapper.getAllInstagramStats(),
        facebookMetrics.getSystemStats()
      ]);

      // Filtrar dados por empresa se não for super admin
      const filteredFacebookClients = companyId > 0 
        ? facebookClients.filter(client => client.companyId === companyId)
        : facebookClients;

      const filteredInstagramClients = companyId > 0
        ? instagramClients.filter(client => client.companyId === companyId)
        : instagramClients;

      const dashboard = {
        overview: {
          systemStatus: systemHealth.overall,
          totalCalls: currentMetrics.totalCalls,
          errorRate: Math.round(currentMetrics.errorRate * 10000) / 100, // 2 casas decimais em %
          averageResponseTime: Math.round(currentMetrics.averageResponseTime),
          cacheHitRate: Math.round(currentMetrics.cacheHitRate * 10000) / 100,
          activeConnections: filteredFacebookClients.length + filteredInstagramClients.length
        },
        health: {
          overall: systemHealth.overall,
          components: systemHealth.components,
          summary: systemHealth.summary,
          lastCheck: systemHealth.timestamp
        },
        metrics: {
          current: currentMetrics,
          history: metricsHistory.slice(-48), // últimas 48 medições (4 horas em intervalos de 5min)
          trends: this.calculateTrends(metricsHistory)
        },
        clients: {
          facebook: {
            total: filteredFacebookClients.length,
            healthy: filteredFacebookClients.filter(c => c.stats.healthy).length,
            clients: filteredFacebookClients.map(client => ({
              companyId: client.companyId,
              apiVersion: 'v22.0', // API version padrão
              healthy: client.stats?.healthy || false,
              totalRequests: client.stats?.totalRequests || 0,
              successfulRequests: client.stats?.successfulRequests || 0,
              lastRequestTime: client.stats?.lastRequestTime || null,
              averageResponseTime: client.stats?.averageResponseTime || 0,
              cacheHitRate: client.stats?.cacheHitRate || 0
            }))
          },
          instagram: {
            total: filteredInstagramClients.length,
            clients: filteredInstagramClients.map(client => ({
              businessAccountId: client.businessAccountId,
              companyId: client.companyId,
              type: client.type,
              stats: client.stats
            }))
          }
        },
        system: {
          uptime: systemStats.uptime,
          version: systemHealth.version,
          snapshotsCount: systemStats.snapshotsCount,
          alertThresholds: systemStats.alertThresholds,
          cacheSize: facebookClients.length + instagramClients.length
        },
        timestamp: new Date().toISOString()
      };

      facebookLogger.debug({
        type: 'facebook_dashboard_access',
        companyId,
        userId: req.user?.id
      }, 'Dashboard accessed');

      return res.json(dashboard);

    } catch (error) {
      facebookLogger.error({
        type: 'facebook_dashboard_error',
        error: error.message,
        companyId: req.user?.companyId
      }, 'Dashboard error');

      return res.status(500).json({
        error: 'Failed to load dashboard',
        message: error.message
      });
    }
  }

  /**
   * Métricas detalhadas com filtros
   */
  static async getMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const companyId = req.user?.companyId || 0;
      const {
        period = '1h',
        component,
        format = 'json'
      } = req.query as {
        period?: string;
        component?: string;
        format?: 'json' | 'csv';
      };

      // Converter período para horas
      const periodHours = this.parsePeriod(period);
      
      // Obter métricas
      let metrics;
      if (component) {
        // Métricas específicas do componente
        if (component === 'company' && companyId > 0) {
          metrics = facebookMetrics.getCompanyMetrics(companyId);
        } else {
          return res.status(400).json({ error: 'Invalid component' });
        }
      } else {
        // Métricas gerais
        metrics = {
          current: facebookMetrics.getCurrentMetrics(),
          history: facebookMetrics.getMetricsForPeriod(periodHours),
          system: facebookMetrics.getSystemStats()
        };
      }

      // Formato de resposta
      if (format === 'csv') {
        const csvData = facebookMetrics.exportMetrics('csv');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="facebook-metrics-${Date.now()}.csv"`);
        return res.send(csvData);
      }

      return res.json(metrics);

    } catch (error) {
      facebookLogger.error({
        type: 'facebook_metrics_error',
        error: error.message,
        companyId: req.user?.companyId
      }, 'Metrics endpoint error');

      return res.status(500).json({
        error: 'Failed to get metrics',
        message: error.message
      });
    }
  }

  /**
   * Health check endpoint
   */
  static async getHealthCheck(req: Request, res: Response): Promise<Response> {
    try {
      const { component } = req.query as { component?: string };

      let healthData;
      if (component) {
        healthData = facebookHealthCheck.getLastResult(component);
        if (!healthData) {
          return res.status(404).json({ error: 'Component not found' });
        }
      } else {
        healthData = await facebookHealthCheck.performSystemHealthCheck();
      }

      // Status HTTP baseado na saúde
      const statusCode = 
        healthData.overall === 'healthy' || healthData.status === 'healthy' ? 200 :
        healthData.overall === 'degraded' || healthData.status === 'degraded' ? 206 :
        503;

      return res.status(statusCode).json(healthData);

    } catch (error) {
      facebookLogger.error({
        type: 'facebook_health_endpoint_error',
        error: error.message
      }, 'Health check endpoint error');

      return res.status(500).json({
        error: 'Health check failed',
        message: error.message
      });
    }
  }

  /**
   * Informações de clientes conectados
   */
  static async getClients(req: Request, res: Response): Promise<Response> {
    try {
      const companyId = req.user?.companyId || 0;
      const { type } = req.query as { type?: 'facebook' | 'instagram' | 'all' };

      let clientsData: any = {};

      if (!type || type === 'facebook' || type === 'all') {
        const facebookClients = getAllClientsStats();
        const filteredFacebook = companyId > 0 
          ? facebookClients.filter(client => client.companyId === companyId)
          : facebookClients;

        clientsData.facebook = filteredFacebook.map(client => ({
          id: `fb_${client.companyId}`,
          companyId: client.companyId,
          apiVersion: 'v22.0', // API version padrão
          baseURL: 'https://graph.facebook.com', // Base URL padrão
          timeout: 30000, // Timeout padrão
          maxRetries: 3, // Max retries padrão
          stats: {
            healthy: client.stats?.healthy || false,
            totalRequests: client.stats?.totalRequests || 0,
            successfulRequests: client.stats?.successfulRequests || 0,
            failedRequests: client.stats?.failedRequests || 0,
            averageResponseTime: client.stats?.averageResponseTime || 0,
            lastRequestTime: client.stats?.lastRequestTime || null,
            cacheHitRate: client.stats?.cacheHitRate || 0,
            retryCount: client.stats?.retryCount || 0
          }
        }));
      }

      if (!type || type === 'instagram' || type === 'all') {
        const instagramClients = InstagramServiceWrapper.getAllInstagramStats();
        const filteredInstagram = companyId > 0
          ? instagramClients.filter(client => client.companyId === companyId)
          : instagramClients;

        clientsData.instagram = filteredInstagram.map(client => ({
          id: `ig_${client.businessAccountId}`,
          businessAccountId: client.businessAccountId,
          companyId: client.companyId,
          type: client.type,
          stats: client.stats
        }));
      }

      return res.json({
        clients: clientsData,
        summary: {
          totalClients: Object.values(clientsData).flat().length,
          facebookClients: clientsData.facebook?.length || 0,
          instagramClients: clientsData.instagram?.length || 0
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      facebookLogger.error({
        type: 'facebook_clients_endpoint_error',
        error: error.message,
        companyId: req.user?.companyId
      }, 'Clients endpoint error');

      return res.status(500).json({
        error: 'Failed to get clients',
        message: error.message
      });
    }
  }

  /**
   * Configurações do sistema de monitoramento
   */
  static async getConfiguration(req: Request, res: Response): Promise<Response> {
    try {
      const healthConfig = facebookHealthCheck.getConfig();
      const systemStats = facebookMetrics.getSystemStats();

      const configuration = {
        healthCheck: healthConfig,
        metrics: {
          alertThresholds: systemStats.alertThresholds,
          snapshotsRetention: '24 hours',
          aggregationInterval: '5 minutes'
        },
        logging: {
          level: process.env.FACEBOOK_LOG_LEVEL || process.env.LOG_LEVEL || 'info',
          enabled: true
        },
        cache: {
          enabled: true,
          ttl: '30 minutes'
        },
        api: {
          version: process.env.META_API_VERSION || 'v22.0',
          timeout: process.env.FACEBOOK_API_TIMEOUT || '30000',
          maxRetries: process.env.FACEBOOK_API_MAX_RETRIES || '3'
        }
      };

      return res.json(configuration);

    } catch (error) {
      facebookLogger.error({
        type: 'facebook_config_endpoint_error',
        error: error.message
      }, 'Configuration endpoint error');

      return res.status(500).json({
        error: 'Failed to get configuration',
        message: error.message
      });
    }
  }

  /**
   * Atualiza configurações do sistema
   */
  static async updateConfiguration(req: Request, res: Response): Promise<Response> {
    try {
      const { healthCheck, metrics } = req.body;

      // Atualizar configurações de health check
      if (healthCheck) {
        facebookHealthCheck.updateConfig(healthCheck);
      }

      // Atualizar thresholds de métricas
      if (metrics?.alertThresholds) {
        Object.entries(metrics.alertThresholds).forEach(([metric, threshold]) => {
          facebookMetrics.setAlertThreshold(metric, threshold as number);
        });
      }

      facebookLogger.info({
        type: 'facebook_config_updated',
        updatedBy: req.user?.id,
        changes: req.body
      }, 'Configuration updated');

      return res.json({
        success: true,
        message: 'Configuration updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      facebookLogger.error({
        type: 'facebook_config_update_error',
        error: error.message,
        userId: req.user?.id
      }, 'Configuration update error');

      return res.status(500).json({
        error: 'Failed to update configuration',
        message: error.message
      });
    }
  }

  /**
   * Ações administrativas
   */
  static async performAdminAction(req: Request, res: Response): Promise<Response> {
    try {
      const { action } = req.params;
      const { companyId: targetCompanyId } = req.body;
      const adminCompanyId = req.user?.companyId || 0;

      // Verificar permissões (apenas super admin ou admin da empresa)
      if (adminCompanyId > 0 && targetCompanyId && targetCompanyId !== adminCompanyId) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      let result: any = {};

      switch (action) {
        case 'clear-cache':
          clearClientCache();
          InstagramServiceWrapper.clearCache();
          result = { message: 'Cache cleared successfully' };
          break;

        case 'force-health-check':
          result = await facebookHealthCheck.performSystemHealthCheck();
          break;

        case 'export-metrics':
          const format = req.query.format as 'json' | 'csv' || 'json';
          const exportData = facebookMetrics.exportMetrics(format);
          
          if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="metrics-export-${Date.now()}.csv"`);
            return res.send(exportData);
          }
          
          result = JSON.parse(exportData);
          break;

        case 'reset-metrics':
          // Não implementado por segurança - requer reinicialização do serviço
          return res.status(400).json({ error: 'Metrics reset requires service restart' });

        default:
          return res.status(400).json({ error: 'Unknown action' });
      }

      facebookLogger.info({
        type: 'facebook_admin_action',
        action,
        performedBy: req.user?.id,
        companyId: adminCompanyId,
        targetCompanyId
      }, `Admin action performed: ${action}`);

      return res.json({
        success: true,
        action,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      facebookLogger.error({
        type: 'facebook_admin_action_error',
        action: req.params.action,
        error: error.message,
        userId: req.user?.id
      }, 'Admin action error');

      return res.status(500).json({
        error: 'Admin action failed',
        message: error.message
      });
    }
  }

  /**
   * Calcula tendências das métricas
   */
  private static calculateTrends(history: any[]): any {
    if (history.length < 2) {
      return {
        errorRate: 0,
        responseTime: 0,
        cacheHitRate: 0,
        totalCalls: 0
      };
    }

    const recent = history.slice(-12); // última hora (12 snapshots de 5min)
    const previous = history.slice(-24, -12); // hora anterior

    const recentAvg = {
      errorRate: recent.reduce((sum, s) => sum + s.errorRate, 0) / recent.length,
      responseTime: recent.reduce((sum, s) => sum + s.averageResponseTime, 0) / recent.length,
      cacheHitRate: recent.reduce((sum, s) => sum + s.cacheHitRate, 0) / recent.length,
      totalCalls: recent.reduce((sum, s) => sum + s.totalCalls, 0)
    };

    const previousAvg = {
      errorRate: previous.reduce((sum, s) => sum + s.errorRate, 0) / Math.max(previous.length, 1),
      responseTime: previous.reduce((sum, s) => sum + s.averageResponseTime, 0) / Math.max(previous.length, 1),
      cacheHitRate: previous.reduce((sum, s) => sum + s.cacheHitRate, 0) / Math.max(previous.length, 1),
      totalCalls: previous.reduce((sum, s) => sum + s.totalCalls, 0)
    };

    return {
      errorRate: ((recentAvg.errorRate - previousAvg.errorRate) / Math.max(previousAvg.errorRate, 0.001)) * 100,
      responseTime: ((recentAvg.responseTime - previousAvg.responseTime) / Math.max(previousAvg.responseTime, 1)) * 100,
      cacheHitRate: ((recentAvg.cacheHitRate - previousAvg.cacheHitRate) / Math.max(previousAvg.cacheHitRate, 0.001)) * 100,
      totalCalls: recentAvg.totalCalls - previousAvg.totalCalls
    };
  }

  /**
   * Converte string de período para horas
   */
  private static parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([hmd])$/);
    if (!match) return 1;

    const [, num, unit] = match;
    const value = parseInt(num);

    switch (unit) {
      case 'm': return value / 60; // minutos para horas
      case 'h': return value;
      case 'd': return value * 24;
      default: return 1;
    }
  }
}