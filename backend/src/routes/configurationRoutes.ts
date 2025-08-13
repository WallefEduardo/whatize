import express from 'express';
import { ConfigurationController } from '../controllers/ConfigurationController';
import isAuth from '../middleware/isAuth';

/**
 * Rotas para gerenciamento e verificação de configurações
 */
const configurationRoutes = express.Router();

/**
 * Middleware para verificar permissões de configuração
 */
const checkConfigurationPermissions = (req: any, res: any, next: any) => {
  const user = req.user;
  
  // Super admin tem acesso total
  if (user?.super) {
    return next();
  }
  
  // Verificar permissões específicas de configuração
  const hasConfigPermission = user?.permissions?.includes('configuration') || 
                              user?.permissions?.includes('admin') ||
                              user?.profile === 'admin';
  
  if (!hasConfigPermission) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Configuration access requires admin privileges'
    });
  }
  
  next();
};

// Aplicar middleware de autenticação para todas as rotas
configurationRoutes.use(isAuth);

/**
 * GET /api/configuration/health
 * Health check completo da configuração
 * Retorna status da saúde de todas as configurações
 */
configurationRoutes.get('/health', ConfigurationController.getHealthCheck);

/**
 * GET /api/configuration/validate
 * Validação completa das configurações
 * Verifica se todas as variáveis de ambiente estão corretas
 */
configurationRoutes.get('/validate', checkConfigurationPermissions, ConfigurationController.validateConfiguration);

/**
 * GET /api/configuration/report
 * Relatório completo de configuração
 * Inclui validações, recomendações e status detalhado
 */
configurationRoutes.get('/report', checkConfigurationPermissions, ConfigurationController.getConfigurationReport);

/**
 * GET /api/configuration/connectivity
 * Testa conectividade com APIs externas
 * Verifica se Facebook/Instagram APIs estão acessíveis
 */
configurationRoutes.get('/connectivity', checkConfigurationPermissions, ConfigurationController.testConnectivity);

/**
 * GET /api/configuration/info
 * Informações sobre a configuração atual (sem dados sensíveis)
 * Mostra configurações aplicadas sem expor secrets
 */
configurationRoutes.get('/info', checkConfigurationPermissions, ConfigurationController.getConfigurationInfo);

/**
 * GET /api/configuration/diagnostic
 * Diagnóstico rápido do sistema
 * Executa verificações essenciais em paralelo
 */
configurationRoutes.get('/diagnostic', checkConfigurationPermissions, ConfigurationController.quickDiagnostic);

/**
 * Middleware de tratamento de erros específico para configuração
 */
configurationRoutes.use((error: any, req: any, res: any, next: any) => {
  console.error('Configuration Route Error:', error);
  
  res.status(500).json({
    error: 'Configuration system error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

export default configurationRoutes;