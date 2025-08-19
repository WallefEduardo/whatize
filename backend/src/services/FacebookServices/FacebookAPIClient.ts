import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  FacebookAPIError, 
  handleFacebookAPIError, 
  shouldRetry, 
  calculateBackoffDelay, 
  logFacebookError 
} from './FacebookErrorHandler';
import { 
  logFacebookAPICall, 
  logRetryAttempt, 
  facebookLogger 
} from '../../utils/facebookLogger';
import { facebookMetrics } from './FacebookMetrics';
import { facebookTelemetry } from './FacebookTelemetry';
import { facebookAlertSystem } from './FacebookAlertSystem';
import logger from '../../utils/logger';

/**
 * Configurações do cliente Facebook API
 */
interface FacebookAPIClientConfig {
  accessToken: string;
  companyId?: number;
  apiVersion?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  enableRetry?: boolean;
  retryDelay?: number;
}

/**
 * Estatísticas de uso da API
 */
interface APIStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retriedRequests: number;
  averageResponseTime: number;
  lastRequestTime: Date | null;
}

/**
 * Cliente robusto para Facebook Graph API com retry automático e tratamento de erros
 */
export class FacebookAPIClient {
  private axiosInstance: AxiosInstance;
  private config: Required<FacebookAPIClientConfig>;
  private stats: APIStats;

  constructor(config: FacebookAPIClientConfig) {
    // Configurações padrão
    this.config = {
      accessToken: config.accessToken,
      companyId: config.companyId || 0,
      apiVersion: config.apiVersion || process.env.META_API_VERSION || 'v22.0',
      baseURL: config.baseURL || process.env.META_API_BASE_URL || 'https://graph.facebook.com',
      timeout: config.timeout || parseInt(process.env.FACEBOOK_API_TIMEOUT || '30000'),
      maxRetries: config.maxRetries || parseInt(process.env.FACEBOOK_API_MAX_RETRIES || '3'),
      enableRetry: config.enableRetry !== undefined ? config.enableRetry : 
                   process.env.FACEBOOK_API_AUTO_RETRY !== 'false',
      retryDelay: config.retryDelay || 1000
    };

    // Inicializar estatísticas
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null
    };

    // Criar instância do Axios
    this.axiosInstance = this.createAxiosInstance();

    logger.info('Facebook API Client inicializado', {
      apiVersion: this.config.apiVersion,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      enableRetry: this.config.enableRetry,
      companyId: this.config.companyId
    });
  }

  /**
   * Cria e configura a instância do Axios
   */
  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: `${this.config.baseURL}/${this.config.apiVersion}/`,
      timeout: this.config.timeout,
      params: {
        access_token: this.config.accessToken
      },
      headers: {
        'User-Agent': `Whatize-Backend/2.2.2 (Facebook-Graph-API/${this.config.apiVersion})`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para logging de requisições
    instance.interceptors.request.use(
      (config) => {
        logger.debug('Facebook API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params ? Object.keys(config.params) : [],
          companyId: this.config.companyId,
          timestamp: new Date().toISOString()
        });
        return config;
      },
      (error) => {
        logger.error('Facebook API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de respostas
    instance.interceptors.response.use(
      (response) => {
        logger.debug('Facebook API Response', {
          status: response.status,
          url: response.config.url,
          dataSize: response.data ? JSON.stringify(response.data).length : 0,
          companyId: this.config.companyId,
          timestamp: new Date().toISOString()
        });
        return response;
      },
      (error) => {
        // Não logar aqui pois será tratado pelo método principal
        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Método principal para fazer requisições com retry automático
   */
  public async makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const startTime = Date.now();
    let lastError: FacebookAPIError;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.stats.totalRequests++;
        
        // Configurar requisição
        const requestConfig: AxiosRequestConfig = {
          method,
          url: endpoint,
          data,
          ...config
        };

        // Fazer requisição
        const response = await this.axiosInstance.request<T>(requestConfig);
        
        // Calcular tempo de resposta
        const responseTime = Date.now() - startTime;
        
        // Atualizar estatísticas de sucesso
        this.updateSuccessStats(startTime);
        
        // Log estruturado da API call
        logFacebookAPICall({
          endpoint,
          method,
          status: response.status,
          companyId: this.config.companyId,
          duration: responseTime,
          requestSize: data ? JSON.stringify(data).length : 0,
          responseSize: response.data ? JSON.stringify(response.data).length : 0,
          retryAttempt: attempt,
          fromCache: false
        });

        // Registrar métricas
        facebookMetrics.recordAPICall(endpoint, responseTime, this.config.companyId, false);

        // Registrar telemetria
        facebookTelemetry.trackAPICall(
          endpoint, 
          method, 
          response.status, 
          responseTime, 
          this.config.companyId
        );
        
        // Log de sucesso após retry
        if (attempt > 0) {
          logger.info('Facebook API: Sucesso após retry', {
            endpoint,
            method,
            attempt,
            companyId: this.config.companyId,
            totalTime: responseTime
          });
        }

        return response;

      } catch (error) {
        // Converter para FacebookAPIError
        const facebookError = handleFacebookAPIError(error);
        lastError = facebookError;
        
        // Calcular tempo de resposta até o erro
        const responseTime = Date.now() - startTime;

        // Log do erro
        logFacebookError(facebookError, {
          endpoint,
          method,
          companyId: this.config.companyId,
          attempt: attempt + 1
        });

        // Registrar métricas de erro
        facebookMetrics.recordAPIError(endpoint, facebookError.code, responseTime, this.config.companyId);

        // Registrar telemetria de erro
        facebookTelemetry.trackAPIError(
          endpoint, 
          facebookError.code, 
          facebookError.type, 
          this.config.companyId, 
          undefined, 
          attempt
        );

        // Verificar se deve tentar novamente
        if (!this.config.enableRetry || !shouldRetry(facebookError, attempt, this.config.maxRetries)) {
          this.updateFailureStats();
          
          // Criar alerta para erros críticos
          if (facebookError.code >= 500 || facebookError.code === 1) {
            await facebookAlertSystem.createAlert(
              'api_failure',
              'high',
              `Facebook API Error ${facebookError.code}`,
              `API call failed: ${facebookError.message} (${endpoint})`,
              this.config.companyId,
              'facebook_api_client',
              {
                endpoint,
                method,
                errorCode: facebookError.code,
                errorType: facebookError.type,
                attempts: attempt + 1
              }
            );
          }
          
          throw facebookError;
        }

        // Calcular delay para próxima tentativa
        let delay = calculateBackoffDelay(attempt, this.config.retryDelay);
        
        // Se o erro especifica um retry-after, usar esse valor
        if (facebookError.retryAfter) {
          delay = facebookError.retryAfter * 1000; // converter para ms
        }

        this.stats.retriedRequests++;

        // Registrar tentativa de retry nas métricas
        facebookMetrics.recordRetry(endpoint, this.config.companyId);

        // Log estruturado do retry
        logRetryAttempt(
          endpoint,
          attempt + 1,
          this.config.maxRetries,
          delay,
          facebookError.message,
          this.config.companyId
        );

        logger.warn('Facebook API: Preparando retry', {
          endpoint,
          method,
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries,
          delayMs: delay,
          errorCode: facebookError.code,
          errorType: facebookError.type,
          companyId: this.config.companyId
        });

        // Aguardar antes da próxima tentativa
        await this.sleep(delay);
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    this.updateFailureStats();
    throw lastError!;
  }

  /**
   * Métodos de conveniência para diferentes tipos de requisição
   */
  public async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>(endpoint, 'GET', undefined, config);
  }

  public async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>(endpoint, 'POST', data, config);
  }

  public async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>(endpoint, 'PUT', data, config);
  }

  public async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>(endpoint, 'DELETE', undefined, config);
  }

  /**
   * Utilitário para sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Atualiza estatísticas de sucesso
   */
  private updateSuccessStats(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.stats.successfulRequests++;
    this.stats.lastRequestTime = new Date();
    
    // Calcular média móvel do tempo de resposta
    const totalCompleted = this.stats.successfulRequests + this.stats.failedRequests;
    this.stats.averageResponseTime = (
      (this.stats.averageResponseTime * (totalCompleted - 1) + responseTime) / totalCompleted
    );
  }

  /**
   * Atualiza estatísticas de falha
   */
  private updateFailureStats(): void {
    this.stats.failedRequests++;
    this.stats.lastRequestTime = new Date();
  }

  /**
   * Retorna estatísticas do cliente
   */
  public getStats(): APIStats {
    return { ...this.stats };
  }

  /**
   * Reset das estatísticas
   */
  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null
    };
  }

  /**
   * Verifica se o cliente está funcionando corretamente
   */
  public async healthCheck(): Promise<{ healthy: boolean, details: any }> {
    try {
      const response = await this.get('me', { timeout: 5000 });
      
      return {
        healthy: true,
        details: {
          apiVersion: this.config.apiVersion,
          responseTime: response.status === 200,
          stats: this.getStats()
        }
      };
    } catch (error) {
      const facebookError = handleFacebookAPIError(error);
      
      return {
        healthy: false,
        details: {
          error: facebookError.getUserFriendlyMessage(),
          code: facebookError.code,
          type: facebookError.type,
          stats: this.getStats()
        }
      };
    }
  }

  /**
   * Atualiza o access token do cliente
   */
  public updateAccessToken(newToken: string): void {
    this.config.accessToken = newToken;
    this.axiosInstance.defaults.params.access_token = newToken;
    
    logger.info('Facebook API Client: Access token atualizado', {
      companyId: this.config.companyId
    });
  }

  /**
   * Retorna configuração atual (sem access token por segurança)
   */
  public getConfig(): Omit<Required<FacebookAPIClientConfig>, 'accessToken'> {
    const { accessToken, ...safeConfig } = this.config;
    return safeConfig;
  }
}