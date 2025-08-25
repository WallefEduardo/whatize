import api from './api';
import { authLog, tokenLog, refreshLog } from '../utils/logger';

/**
 * AuthManager - Sistema centralizado de autenticação
 * 
 * Responsabilidades:
 * - Gerenciar tokens JWT (access + refresh)
 * - Configurar interceptors axios
 * - Renovar tokens automaticamente
 * - Fazer logout em caso de falha
 */
class AuthManager {
  constructor() {
    // Verificar se já existe uma instância (proteção contra StrictMode)
    if (window.__authManagerInstance) {
      return window.__authManagerInstance;
    }

    this.isConfigured = false;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.maxRetryAttempts = 1;
    this.requestInterceptorId = null;
    this.responseInterceptorId = null;
    
    // Circuit Breaker para evitar loop infinito
    this.refreshAttempts = 0;
    this.maxRefreshAttempts = 3;
    this.lastRefreshTime = 0;
    this.minRefreshInterval = 5000; // 5 segundos mínimo entre refreshs
    this.circuitBreakerOpen = false;
    this.circuitBreakerResetTime = 30000; // 30 segundos para resetar circuit breaker
    
    // NOVO: Request Queue System
    this.requestQueue = [];
    this.isInitializing = false;
    this.isInitialized = false;
    
    // Marcar como instância global
    window.__authManagerInstance = this;
    
    // Inicializar imediatamente de forma síncrona
    this.initializeSync();
  }

  /**
   * Inicialização síncrona - configura interceptors imediatamente
   */
  initializeSync() {
    console.log('⚡ [AUTH-SYNC] Inicialização síncrona...');
    
    // Configurar interceptors imediatamente
    this.configure();
    
    // Marcar como inicializado para requests básicas
    this.isInitialized = true;
    
    // Fazer validação assíncrona em paralelo
    this.initializeAsync().catch(error => {
      console.error('❌ [AUTH-SYNC] Falha na inicialização assíncrona:', error);
    });
    
    console.log('✅ [AUTH-SYNC] Inicialização síncrona completa');
  }

  /**
   * Inicialização assíncrona com validação de token
   */
  async initializeAsync() {
    if (this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    console.log('🚀 [AUTH-INIT] Iniciando validação de tokens...');

    try {
      // Interceptors já foram configurados no initializeSync
      
      // 1. Verificar se há tokens
      const accessToken = this.getAccessToken();
      const refreshToken = this.getRefreshToken();
      
      console.log('🔍 [AUTH-INIT] Estado inicial dos tokens:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });

      // 3. Se há token, verificar se está válido/expirando
      if (accessToken) {
        const isExpiring = this.isTokenExpiring(accessToken);
        
        if (isExpiring) {
          console.log('⏰ [AUTH-INIT] Token expirando, fazendo refresh inicial...');
          
          if (refreshToken) {
            try {
              await this.preventiveRefresh();
              console.log('✅ [AUTH-INIT] Refresh inicial bem-sucedido');
            } catch (error) {
              console.error('❌ [AUTH-INIT] Refresh inicial falhou:', error);
              this.handleLogout('Falha na renovação inicial do token');
              return;
            }
          } else {
            console.log('❌ [AUTH-INIT] Token expirando mas sem refresh token');
            this.handleLogout('Token expirado e sem refresh token');
            return;
          }
        } else {
          console.log('✅ [AUTH-INIT] Token ainda válido');
        }
      } else {
        console.log('ℹ️ [AUTH-INIT] Sem token - usuário precisa fazer login');
      }

      // 4. Validação completa
      console.log('🎉 [AUTH-INIT] Validação de tokens completa!');
      
      // 5. Processar fila de requests se houver
      this.processRequestQueue();
      
    } catch (error) {
      console.error('💥 [AUTH-INIT] Erro na inicialização:', error);
      this.handleLogout('Erro na inicialização do sistema de autenticação');
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Configura os interceptors axios
   */
  configure() {
    // Verificação robusta contra múltiplas configurações
    if (this.isConfigured || window.__interceptorsConfigured) {
      authLog.debug('Já configurado, pulando configuração');
      return;
    }

    // Marcar globalmente como configurado
    window.__interceptorsConfigured = true;

    // Limpar interceptors existentes se houver IDs salvos
    if (this.requestInterceptorId !== null) {
      api.interceptors.request.eject(this.requestInterceptorId);
    }
    if (this.responseInterceptorId !== null) {
      api.interceptors.response.eject(this.responseInterceptorId);
    }

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
    
    this.isConfigured = true;
    authLog.info('Interceptors configurados com sucesso');
  }

  /**
   * Request Interceptor - Adiciona token de acesso
   */
  setupRequestInterceptor() {
    this.requestInterceptorId = api.interceptors.request.use(
      async (config) => {
        // Se ainda está inicializando, adicionar à fila
        if (this.isInitializing || !this.isInitialized) {
          console.log('⏳ [REQUEST-QUEUE] Sistema inicializando, adicionando à fila:', config.url);
          // Aguardar inicialização em vez de enfileirar
          await this.waitForInitialization();
        }

        // Garantir que headers existe
        if (!config.headers) {
          config.headers = {};
        }

        // SEMPRE pegar o token mais atual do localStorage
        const token = this.getAccessToken();
        
        if (token) {
          console.log('🔑 [REQUEST] Adicionando token para:', config.url);
          
          // Verificar se token está próximo do vencimento
          const isTokenExpiring = this.isTokenExpiring(token);
          
          if (isTokenExpiring && !config.url?.includes('/auth/')) {
            console.log('⏰ [REQUEST] Token expirando, tentando refresh preventivo');
            try {
              await this.preventiveRefresh();
              // Pegar token atualizado
              const newToken = this.getAccessToken();
              if (newToken) {
                config.headers.Authorization = `Bearer ${newToken}`;
                console.log('✅ [REQUEST] Token atualizado preventivamente');
              }
            } catch (error) {
              console.log('❌ [REQUEST] Refresh preventivo falhou, usando token atual');
              config.headers.Authorization = `Bearer ${token}`;
            }
          } else {
            config.headers.Authorization = `Bearer ${token}`;
          }
          
          console.log('✅ [REQUEST] Token adicionado com sucesso');
          tokenLog.debug('Token adicionado à request', { url: config.url });
        } else if (config.url && !config.url.includes('/auth/')) {
          console.log('⚠️ [REQUEST] SEM TOKEN para:', config.url);
          authLog.warn('Request sem token', { url: config.url });
        }
        return config;
      },
      (error) => {
        authLog.error('Erro no request interceptor', error);
        return Promise.reject(error);
      }
    );
    authLog.debug('Request interceptor configurado', { id: this.requestInterceptorId });
  }

  /**
   * Response Interceptor - Gerencia renovação de tokens
   */
  setupResponseInterceptor() {
    this.responseInterceptorId = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Não tentar renovar se já tentou ou se é request de refresh
        if (originalRequest._retry || originalRequest.url?.includes('/auth/refresh_token')) {
          authLog.debug('Pulando renovação - request já tentado ou é refresh_token');
          return Promise.reject(error);
        }

        // Tentar renovar token em 401 ou 403
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log(`⚠️ [AUTH] Erro ${error.response.status} detectado!`);
          console.log('📍 [AUTH] URL que falhou:', originalRequest.url);
          console.log('💾 [AUTH] Erro recebido:', error.response?.data);
          console.log('🔍 [AUTH] Tokens disponíveis:', {
            accessToken: localStorage.getItem('token') ? 'PRESENTE' : 'AUSENTE',
            refreshToken: localStorage.getItem('refresh_token') ? 'PRESENTE' : 'AUSENTE'
          });
          
          return this.handleTokenRefresh(originalRequest, error);
        }

        return Promise.reject(error);
      }
    );
    authLog.debug('Response interceptor configurado', { id: this.responseInterceptorId });
  }

  /**
   * Gerencia a renovação de token
   */
  async handleTokenRefresh(originalRequest, error) {
    console.log('🔄 [REFRESH] Tentando renovar token para:', originalRequest.url);
    
    // CIRCUIT BREAKER: Verificar se está muito frequente
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;
    
    // Se circuit breaker está aberto, verificar se pode resetar
    if (this.circuitBreakerOpen) {
      if (timeSinceLastRefresh < this.circuitBreakerResetTime) {
        console.log('⚠️ [REFRESH] Circuit breaker ATIVO - bloqueando refresh');
        this.handleLogout('Muitas tentativas de refresh - circuit breaker ativado');
        return Promise.reject(new Error('Circuit breaker open'));
      } else {
        console.log('🔄 [REFRESH] Circuit breaker RESETADO');
        this.circuitBreakerOpen = false;
        this.refreshAttempts = 0;
      }
    }
    
    // Rate limiting: bloquear se muito frequente
    if (timeSinceLastRefresh < this.minRefreshInterval) {
      console.log('⏰ [REFRESH] Rate limit ativo - aguardando intervalo mínimo');
      return Promise.reject(new Error('Rate limit exceeded'));
    }
    
    // Incrementar contador de tentativas
    this.refreshAttempts++;
    if (this.refreshAttempts > this.maxRefreshAttempts) {
      console.log('💥 [REFRESH] Máximo de tentativas excedido - ativando circuit breaker');
      this.circuitBreakerOpen = true;
      this.handleLogout('Muitas tentativas de refresh falidas');
      return Promise.reject(new Error('Max refresh attempts exceeded'));
    }
    
    // Se já está renovando, adicionar à fila
    if (this.isRefreshing) {
      console.log('⏳ [REFRESH] Já em andamento, adicionando à fila:', originalRequest.url);
      return this.addToFailedQueue(originalRequest);
    }

    originalRequest._retry = true;
    this.isRefreshing = true;
    this.lastRefreshTime = now;
    console.log('🚀 [REFRESH] Iniciando processo de refresh token', {
      attempt: this.refreshAttempts,
      timeSinceLastRefresh
    });

    try {
      // Verificar tokens disponíveis
      console.log('🔍 [REFRESH] Estado dos tokens:', {
        cookies: document.cookie ? 'TEM COOKIES' : 'SEM COOKIES',
        accessToken: localStorage.getItem('token') ? 'PRESENTE' : 'AUSENTE',
        refreshToken: localStorage.getItem('refresh_token') ? 'PRESENTE' : 'AUSENTE'
      });
      
      // Pegar refresh token do localStorage
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        console.error('❌ [REFRESH] NENHUM REFRESH TOKEN DISPONÍVEL!');
        throw new Error('No refresh token available');
      }
      
      console.log('📦 [REFRESH] Usando refresh token do localStorage');
      
      // SEMPRE enviar o refresh token no body já que cookies não funcionam
      const { data } = await api.post('/auth/refresh_token', { 
        refreshToken 
      });
      
      console.log('✅ [REFRESH] Resposta recebida:', {
        token: data.token ? 'RECEBIDO' : 'NÃO RECEBIDO',
        refreshToken: data.refreshToken ? 'RECEBIDO' : 'NÃO RECEBIDO',
        user: data.user ? 'RECEBIDO' : 'NÃO RECEBIDO'
      });
      
      if (data && data.token) {
        console.log('✅ [REFRESH] Novo access token recebido');
        
        // Salvar novo access token
        this.setAccessToken(data.token);
        
        // Salvar refresh token se vier na resposta
        if (data.refreshToken) {
          this.setRefreshToken(data.refreshToken);
          console.log('✅ [REFRESH] Novo refresh token também salvo');
        }
        
        // RESETAR Circuit Breaker após sucesso
        this.refreshAttempts = 0;
        this.circuitBreakerOpen = false;
        console.log('🎯 [REFRESH] Circuit breaker resetado após sucesso');
        
        // Processar fila de requests em espera
        this.processQueue(null, data.token);
        
        // Retry request original
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        console.log('🔄 [REFRESH] Fazendo retry da requisição original:', originalRequest.url);
        
        return api(originalRequest);
      } else {
        console.error('❌ [REFRESH] Resposta inválida do refresh_token:', data);
        throw new Error('Token de resposta inválido');
      }
    } catch (refreshError) {
      refreshLog.error('Falha ao renovar token', { 
        error: refreshError.response?.data || refreshError.message,
        status: refreshError.response?.status 
      });
      
      // Processar fila com erro
      this.processQueue(refreshError, null);
      
      // Fazer logout apenas se não for um erro temporário
      if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
        this.handleLogout('Token expirado e não foi possível renovar');
      }
      
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
      refreshLog.info('Processo de refresh token finalizado');
    }
  }

  /**
   * Adiciona request à fila de espera durante renovação
   */
  addToFailedQueue(originalRequest) {
    return new Promise((resolve, reject) => {
      this.failedQueue.push({
        resolve: (token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        },
        reject: (err) => {
          reject(err);
        }
      });
    });
  }

  /**
   * Processa fila de requests em espera
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Obtém token de acesso do localStorage (FORMATO ORIGINAL - JSON.parse)
   */
  getAccessToken() {
    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === 'null') {
        return null;
      }
      
      // RESTAURAR LÓGICA ORIGINAL: Sempre fazer JSON.parse como versão antiga
      const parsedToken = JSON.parse(token);
      console.log('🔑 [AUTH-MANAGER] Token obtido (JSON parsed):', parsedToken.substring(0, 50) + '...');
      return parsedToken;
    } catch (error) {
      console.warn('[AUTH-MANAGER] Erro ao fazer parse do token, removendo:', error);
      localStorage.removeItem('token');
      return null;
    }
  }

  /**
   * Salva token de acesso no localStorage (FORMATO ORIGINAL - JSON.stringify)
   */
  setAccessToken(token) {
    try {
      // RESTAURAR FORMATO ORIGINAL: Salvar como JSON igual versão antiga
      localStorage.setItem('token', JSON.stringify(token));
      tokenLog.info('Access token salvo com sucesso (formato JSON)');
      console.log('🔑 [AUTH-MANAGER] Token salvo (JSON):', token.substring(0, 50) + '...');
    } catch (error) {
      tokenLog.error('Erro ao salvar token no localStorage', error);
    }
  }

  /**
   * Remove token de acesso
   */
  removeAccessToken() {
    localStorage.removeItem('token');
    tokenLog.info('Access token removido do localStorage');
  }

  /**
   * Obtém refresh token do localStorage
   */
  getRefreshToken() {
    try {
      const token = localStorage.getItem('refresh_token');
      if (!token || token === 'undefined' || token === 'null') {
        return null;
      }
      return token;
    } catch (error) {
      console.warn('[AUTH-MANAGER] Erro ao obter refresh token:', error);
      return null;
    }
  }

  /**
   * Salva refresh token no localStorage
   */
  setRefreshToken(token) {
    try {
      if (token) {
        localStorage.setItem('refresh_token', token);
        refreshLog.info('Refresh token salvo no localStorage');
      }
    } catch (error) {
      refreshLog.error('Erro ao salvar refresh token', error);
    }
  }

  /**
   * Remove refresh token
   */
  removeRefreshToken() {
    localStorage.removeItem('refresh_token');
    refreshLog.info('Refresh token removido do localStorage');
  }

  /**
   * Verifica se usuário está autenticado
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Aguarda a inicialização completar
   */
  async waitForInitialization() {
    if (this.isInitialized) return;
    
    console.log('⏳ [WAIT] Aguardando inicialização...');
    
    return new Promise((resolve, reject) => {
      const maxWait = 10000; // 10 segundos máximo
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        if (this.isInitialized) {
          console.log('✅ [WAIT] Inicialização completa, continuando...');
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > maxWait) {
          console.error('❌ [WAIT] Timeout aguardando inicialização');
          clearInterval(checkInterval);
          reject(new Error('Timeout waiting for initialization'));
        }
      }, 50);
    });
  }

  /**
   * Adiciona request à fila durante inicialização
   */
  addToRequestQueue(config) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        config,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      console.log('📝 [REQUEST-QUEUE] Request adicionada à fila. Total:', this.requestQueue.length);
    });
  }

  /**
   * Processa fila de requests após inicialização
   */
  async processRequestQueue() {
    if (this.requestQueue.length === 0) {
      console.log('📝 [REQUEST-QUEUE] Fila vazia, nada a processar');
      return;
    }

    console.log('🔄 [REQUEST-QUEUE] Processando fila de', this.requestQueue.length, 'requests...');

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const { config, resolve, reject } of queue) {
      try {
        console.log('🚀 [REQUEST-QUEUE] Executando request:', config.url);
        
        // Adicionar token se necessário
        const token = this.getAccessToken();
        if (token && !config.url?.includes('/auth/')) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        const response = await api(config);
        resolve(response);
        
        console.log('✅ [REQUEST-QUEUE] Request executada com sucesso:', config.url);
      } catch (error) {
        console.error('❌ [REQUEST-QUEUE] Request falhou:', config.url, error.message);
        reject(error);
      }
    }

    console.log('🎉 [REQUEST-QUEUE] Fila processada com sucesso');
  }

  /**
   * Verifica se token está próximo do vencimento
   */
  isTokenExpiring(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp;
      
      // Se expira em menos de 5 minutos, considerar como "expirando"
      const timeUntilExpiry = exp - now;
      const isExpiring = timeUntilExpiry < 300; // 5 minutos
      
      console.log('🔍 [TOKEN] Verificação de expiração:', {
        timeUntilExpiry,
        isExpiring,
        expiryDate: new Date(exp * 1000).toLocaleString()
      });
      
      return isExpiring;
    } catch (error) {
      console.warn('[AUTH-MANAGER] Erro ao verificar expiração do token:', error);
      return true; // Se não conseguir verificar, assumir que está expirando
    }
  }

  /**
   * Faz refresh preventivo do token
   */
  async preventiveRefresh() {
    if (this.isRefreshing) {
      console.log('⏳ [PREVENTIVE] Refresh já em andamento, aguardando...');
      // Aguardar refresh atual terminar
      return new Promise((resolve, reject) => {
        const checkRefresh = () => {
          if (!this.isRefreshing) {
            resolve();
          } else {
            setTimeout(checkRefresh, 100);
          }
        };
        setTimeout(() => reject(new Error('Timeout waiting for refresh')), 10000);
        checkRefresh();
      });
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    console.log('🔄 [PREVENTIVE] Iniciando refresh preventivo');

    try {
      const { data } = await api.post('/auth/refresh_token', { refreshToken });
      
      if (data && data.token) {
        this.setAccessToken(data.token);
        if (data.refreshToken) {
          this.setRefreshToken(data.refreshToken);
        }
        
        // Reset circuit breaker
        this.refreshAttempts = 0;
        this.circuitBreakerOpen = false;
        
        console.log('✅ [PREVENTIVE] Refresh preventivo bem-sucedido');
        return data.token;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('❌ [PREVENTIVE] Refresh preventivo falhou:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Faz logout limpo
   */
  handleLogout(reason = 'Logout solicitado') {
    authLog.info('Fazendo logout', { reason });
    console.log('🚪 [LOGOUT] Executando logout:', reason);
    
    // Limpar estado do AuthManager
    this.isInitialized = false;
    this.isInitializing = false;
    this.isRefreshing = false;
    this.circuitBreakerOpen = false;
    this.refreshAttempts = 0;
    this.requestQueue = [];
    this.failedQueue = [];
    
    // Limpar todos os tokens
    this.removeAccessToken();
    this.removeRefreshToken();
    localStorage.removeItem('cshow');
    localStorage.removeItem('assinaturaVencida');
    
    // Limpar header default do axios
    delete api.defaults.headers.common['Authorization'];
    
    // Mostrar toast
    if (window.toast && typeof window.toast.error === 'function') {
      window.toast.error('Sua sessão expirou. Você será redirecionado para o login.', {
        duration: 3000
      });
    }
    
    // Redirecionar para login
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  }

  /**
   * Reinicia o AuthManager após erro crítico
   */
  reset() {
    console.log('🔄 [RESET] Reiniciando AuthManager...');
    
    this.isConfigured = false;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.isInitializing = false;
    this.isInitialized = false;
    this.requestQueue = [];
    
    // Resetar circuit breaker
    this.refreshAttempts = 0;
    this.circuitBreakerOpen = false;
    this.lastRefreshTime = 0;
    
    authLog.debug('Configuração do AuthManager resetada');
    
    // Reinicializar se há tokens
    if (this.getAccessToken() || this.getRefreshToken()) {
      console.log('🔄 [RESET] Reinicializando com tokens existentes...');
      this.initializeAsync();
    }
  }

  /**
   * Força renovação de token (para uso manual se necessário)
   */
  async forceRefresh() {
    console.log('[AUTH-MANAGER] Forçando renovação de token...');
    
    try {
      const { data } = await api.post('/auth/refresh_token');
      
      if (data && data.token) {
        this.setAccessToken(data.token);
        refreshLog.info('Token renovado manualmente com sucesso');
        return data;
      } else {
        throw new Error('Resposta de refresh inválida');
      }
    } catch (error) {
      refreshLog.error('Erro ao forçar renovação manual', error);
      this.handleLogout('Falha na renovação manual do token');
      throw error;
    }
  }

  /**
   * Obtém métricas do sistema de autenticação
   */
  getMetrics() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      isRefreshing: this.isRefreshing,
      requestQueueSize: this.requestQueue.length,
      failedQueueSize: this.failedQueue.length,
      refreshAttempts: this.refreshAttempts,
      circuitBreakerOpen: this.circuitBreakerOpen,
      lastRefreshTime: this.lastRefreshTime,
      hasAccessToken: !!this.getAccessToken(),
      hasRefreshToken: !!this.getRefreshToken(),
      timeSinceLastRefresh: Date.now() - this.lastRefreshTime
    };
  }

  /**
   * Monitora saúde do sistema de autenticação
   */
  healthCheck() {
    const metrics = this.getMetrics();
    const issues = [];

    if (!metrics.isInitialized && !metrics.isInitializing) {
      issues.push('Sistema não inicializado');
    }

    if (metrics.circuitBreakerOpen) {
      issues.push('Circuit breaker ativo - muitas falhas de refresh');
    }

    if (metrics.requestQueueSize > 10) {
      issues.push(`Fila de requests muito grande: ${metrics.requestQueueSize}`);
    }

    if (metrics.refreshAttempts >= this.maxRefreshAttempts) {
      issues.push('Máximo de tentativas de refresh atingido');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues,
      metrics
    };
  }

  /**
   * Debug: limpar estado para teste
   */
  __debugReset() {
    if (import.meta.env.DEV) {
      console.log('🧪 [DEBUG] Resetando estado do AuthManager...');
      this.reset();
    }
  }
}

// Criar instância singleton
const authManager = new AuthManager();

// Expor instância para debug global (apenas desenvolvimento)
if (import.meta.env.DEV) {
  window.authManager = authManager;
}

export default authManager;