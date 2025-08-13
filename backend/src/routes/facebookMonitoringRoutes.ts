import express from 'express';
import { FacebookMonitoringController } from '../controllers/FacebookMonitoringController';
import isAuth from '../middleware/isAuth';

/**
 * Rotas para o dashboard de monitoramento das APIs Facebook/Instagram
 * Requer autenticação e permissões adequadas
 */
const facebookMonitoringRoutes = express.Router();

/**
 * Middleware para verificar permissões de monitoramento
 * Apenas usuários com permissão de admin ou específica para monitoramento
 */
const checkMonitoringPermissions = (req: any, res: any, next: any) => {
  const user = req.user;
  
  // Super admin tem acesso total
  if (user?.super) {
    return next();
  }
  
  // Verificar permissões específicas de monitoramento
  // Assumindo que existe uma estrutura de permissões no usuário
  const hasMonitoringPermission = user?.permissions?.includes('monitoring') || 
                                  user?.permissions?.includes('admin') ||
                                  user?.profile === 'admin';
  
  if (!hasMonitoringPermission) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Monitoring access requires admin privileges'
    });
  }
  
  next();
};

// Aplicar middleware de autenticação para todas as rotas
facebookMonitoringRoutes.use(isAuth);
facebookMonitoringRoutes.use(checkMonitoringPermissions);

/**
 * GET /api/facebook-monitoring/dashboard
 * Dashboard principal com visão geral do sistema
 */
facebookMonitoringRoutes.get('/dashboard', FacebookMonitoringController.getDashboard);

/**
 * GET /api/facebook-monitoring/metrics
 * Métricas detalhadas com filtros
 * Query params:
 * - period: 1h, 6h, 24h, 7d (padrão: 1h)
 * - component: company, facebook, instagram
 * - format: json, csv (padrão: json)
 */
facebookMonitoringRoutes.get('/metrics', FacebookMonitoringController.getMetrics);

/**
 * GET /api/facebook-monitoring/health
 * Health check do sistema
 * Query params:
 * - component: nome específico do componente
 */
facebookMonitoringRoutes.get('/health', FacebookMonitoringController.getHealthCheck);

/**
 * GET /api/facebook-monitoring/clients
 * Informações de clientes conectados
 * Query params:
 * - type: facebook, instagram, all (padrão: all)
 */
facebookMonitoringRoutes.get('/clients', FacebookMonitoringController.getClients);

/**
 * GET /api/facebook-monitoring/configuration
 * Configurações atuais do sistema de monitoramento
 */
facebookMonitoringRoutes.get('/configuration', FacebookMonitoringController.getConfiguration);

/**
 * PUT /api/facebook-monitoring/configuration
 * Atualiza configurações do sistema
 * Body: { healthCheck: {...}, metrics: {...} }
 */
facebookMonitoringRoutes.put('/configuration', FacebookMonitoringController.updateConfiguration);

/**
 * POST /api/facebook-monitoring/admin/:action
 * Ações administrativas
 * Actions disponíveis:
 * - clear-cache: Limpa cache de clientes
 * - force-health-check: Força execução de health check
 * - export-metrics: Exporta métricas (query: format=csv|json)
 * - reset-metrics: Reset das métricas (requer restart)
 */
facebookMonitoringRoutes.post('/admin/:action', FacebookMonitoringController.performAdminAction);

/**
 * Middleware de tratamento de erros específico para monitoramento
 */
facebookMonitoringRoutes.use((error: any, req: any, res: any, next: any) => {
  console.error('Facebook Monitoring Route Error:', error);
  
  res.status(500).json({
    error: 'Internal monitoring error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

export default facebookMonitoringRoutes;