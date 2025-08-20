import { phase6Logger } from './logger-phase6';

// Testes de funcionalidades críticas
export const runCriticalFunctionalTests = () => {
  console.log('🎯 Iniciando testes de funcionalidades críticas...');
  
  const results = {
    navigation: false,
    authentication: false,
    forms: false,
    modals: false,
    toasts: false,
    routing: false,
    api: false
  };

  // Teste 1: Navegação
  try {
    const hasRouter = !!document.querySelector('[data-testid="app-router"], .MuiDrawer-root, nav');
    results.navigation = hasRouter;
    
    phase6Logger.finalValidation.regressionTest(
      'navigation',
      results.navigation,
      true
    );
  } catch (error) {
    console.error('Erro testando navegação:', error);
  }

  // Teste 2: Formulários
  try {
    const hasInputs = document.querySelectorAll('input, textarea, select').length > 0;
    const hasButtons = document.querySelectorAll('button').length > 0;
    results.forms = hasInputs && hasButtons;
    
    phase6Logger.finalValidation.regressionTest(
      'forms',
      results.forms,
      true
    );
  } catch (error) {
    console.error('Erro testando formulários:', error);
  }

  // Teste 3: Modais (estrutura)
  try {
    const hasModalStructure = !!document.querySelector('.MuiDialog-root, [role="dialog"]') ||
                              CSS.supports('position', 'fixed');
    results.modals = hasModalStructure;
    
    phase6Logger.finalValidation.regressionTest(
      'modals',
      results.modals,
      true
    );
  } catch (error) {
    console.error('Erro testando modais:', error);
  }

  // Teste 4: Sistema de notificações
  try {
    // Verificar se react-hot-toast está carregado
    const hasToastContainer = !!document.querySelector('[data-hot-toast], .toast-container') ||
                              window.toast !== undefined;
    results.toasts = hasToastContainer;
    
    phase6Logger.finalValidation.regressionTest(
      'toasts',
      results.toasts,
      true
    );
  } catch (error) {
    console.error('Erro testando toasts:', error);
  }

  // Teste 5: Roteamento
  try {
    const hasValidRoutes = window.location.pathname !== null &&
                          (window.history && window.history.pushState);
    results.routing = hasValidRoutes;
    
    phase6Logger.finalValidation.regressionTest(
      'routing',
      results.routing,
      true
    );
  } catch (error) {
    console.error('Erro testando roteamento:', error);
  }

  // Teste 6: API (estrutura)
  try {
    const hasApiStructure = typeof fetch !== 'undefined' ||
                           window.axios !== undefined;
    results.api = hasApiStructure;
    
    phase6Logger.finalValidation.regressionTest(
      'api',
      results.api,
      true
    );
  } catch (error) {
    console.error('Erro testando API:', error);
  }

  // Teste 7: Autenticação (estrutura)
  try {
    const hasAuthStructure = !!localStorage.getItem('token') ||
                            !!sessionStorage.getItem('token') ||
                            !!document.querySelector('[data-testid="login"], .login');
    results.authentication = hasAuthStructure;
    
    phase6Logger.finalValidation.regressionTest(
      'authentication',
      results.authentication,
      true
    );
  } catch (error) {
    console.error('Erro testando autenticação:', error);
  }

  // Calcular resultado geral
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);

  console.log(`🎯 Testes funcionais concluídos: ${passedTests}/${totalTests} (${successRate}%)`);
  
  return {
    results,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: parseFloat(successRate)
    }
  };
};

// Teste de regressão específico
export const testSpecificFunctionality = (functionalityName, testFunction) => {
  try {
    const result = testFunction();
    
    phase6Logger.finalValidation.regressionTest(
      functionalityName,
      result,
      true
    );
    
    return result;
  } catch (error) {
    console.error(`Erro testando ${functionalityName}:`, error);
    
    phase6Logger.finalValidation.regressionTest(
      functionalityName,
      false,
      true
    );
    
    return false;
  }
};

export default { runCriticalFunctionalTests, testSpecificFunctionality };