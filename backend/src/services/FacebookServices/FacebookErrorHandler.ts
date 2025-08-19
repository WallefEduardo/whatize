import logger from "../../utils/logger";

/**
 * Classe customizada para erros da Facebook API
 * Baseada na estrutura oficial de erros da Meta Graph API
 */
export class FacebookAPIError extends Error {
  public readonly code: number;
  public readonly type: string;
  public readonly fbtrace_id?: string;
  public readonly userTitle?: string;
  public readonly userMessage?: string;
  public readonly isTemporary: boolean;
  public readonly retryAfter?: number;

  constructor(
    code: number,
    type: string,
    message: string,
    fbtrace_id?: string,
    userTitle?: string,
    userMessage?: string
  ) {
    super(message);
    this.name = 'FacebookAPIError';
    this.code = code;
    this.type = type;
    this.fbtrace_id = fbtrace_id;
    this.userTitle = userTitle;
    this.userMessage = userMessage;
    
    // Determinar se é um erro temporário baseado no código
    this.isTemporary = this.isTemporaryError(code, type);
    
    // Extrair tempo de retry se presente na mensagem
    this.retryAfter = this.extractRetryAfter(message);
  }

  /**
   * Determina se o erro é temporário e pode ser retentado
   */
  private isTemporaryError(code: number, type: string): boolean {
    // Códigos de erro temporário da Facebook API
    const temporaryCodes = [
      1, 2, 4, 17, 341, 368, 
      613, 80001, 80002, 80003, 80004, 80005, 80006, 80008
    ];
    
    // Tipos de erro temporário
    const temporaryTypes = [
      'OAuthTemporaryError',
      'ConcurrentRequestLimitReached',
      'ThrottledError',
      'TemporaryUnavailable'
    ];
    
    return temporaryCodes.includes(code) || temporaryTypes.includes(type);
  }

  /**
   * Extrai tempo de retry da mensagem de erro
   */
  private extractRetryAfter(message: string): number | undefined {
    // Procurar padrões como "try again in X seconds"
    const retryMatch = message.match(/try again in (\d+) seconds?/i) ||
                      message.match(/retry after (\d+) seconds?/i) ||
                      message.match(/wait (\d+) seconds?/i);
    
    return retryMatch ? parseInt(retryMatch[1]) : undefined;
  }

  /**
   * Retorna uma mensagem amigável para o usuário
   */
  public getUserFriendlyMessage(): string {
    if (this.userMessage) {
      return this.userMessage;
    }

    // Mensagens padrão baseadas no tipo de erro
    switch (this.type) {
      case 'OAuthException':
        return 'Erro de autenticação. Verifique se o token está válido.';
      case 'GraphMethodException':
        return 'Erro na operação solicitada. Tente novamente.';
      case 'ConcurrentRequestLimitReached':
        return 'Muitas requisições simultâneas. Aguarde um momento e tente novamente.';
      case 'ThrottledError':
        return 'Limite de taxa atingido. Aguarde um momento e tente novamente.';
      default:
        return this.isTemporary 
          ? 'Erro temporário. Tente novamente em alguns instantes.'
          : 'Erro na integração com Facebook. Contate o suporte.';
    }
  }

  /**
   * Retorna dados estruturados do erro para logging
   */
  public toLogData(): object {
    return {
      name: this.name,
      code: this.code,
      type: this.type,
      message: this.message,
      fbtrace_id: this.fbtrace_id,
      userTitle: this.userTitle,
      userMessage: this.userMessage,
      isTemporary: this.isTemporary,
      retryAfter: this.retryAfter,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Processa e converte erros da Facebook API em FacebookAPIError
 */
export const handleFacebookAPIError = (error: any): FacebookAPIError => {
  // Se já é um FacebookAPIError, retornar como está
  if (error instanceof FacebookAPIError) {
    return error;
  }

  // Processar resposta de erro da API
  if (error.response?.data?.error) {
    const errorData = error.response.data.error;
    
    return new FacebookAPIError(
      errorData.code || 0,
      errorData.type || 'UnknownError',
      errorData.message || 'Unknown Facebook API error',
      errorData.fbtrace_id,
      errorData.error_user_title,
      errorData.error_user_msg
    );
  }

  // Processar erros de rede/timeout
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new FacebookAPIError(
      0,
      'NetworkError',
      'Erro de conexão com os servidores do Facebook',
      undefined,
      'Problema de Conexão',
      'Não foi possível conectar com o Facebook. Verifique sua conexão.'
    );
  }

  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return new FacebookAPIError(
      0,
      'TimeoutError',
      'Timeout na requisição para Facebook API',
      undefined,
      'Timeout',
      'A requisição demorou muito para responder. Tente novamente.'
    );
  }

  // Erro genérico
  return new FacebookAPIError(
    0,
    'UnknownError',
    error.message || 'Erro desconhecido na Facebook API',
    undefined,
    'Erro Desconhecido',
    'Ocorreu um erro inesperado. Tente novamente ou contate o suporte.'
  );
};

/**
 * Determina se uma requisição deve ser retentada baseada no erro
 */
export const shouldRetry = (error: FacebookAPIError, attempt: number, maxRetries: number): boolean => {
  // Não tentar novamente se já excedeu o máximo
  if (attempt >= maxRetries) {
    return false;
  }

  // Não tentar novamente para erros permanentes
  if (!error.isTemporary) {
    return false;
  }

  // Não tentar novamente para erros de autenticação
  if (error.type === 'OAuthException' && error.code !== 2) {
    return false;
  }

  return true;
};

/**
 * Calcula o tempo de espera para retry com exponential backoff
 */
export const calculateBackoffDelay = (attempt: number, baseDelay: number = 1000): number => {
  // Se o erro especifica um retry-after, usar esse valor
  // Senão, usar exponential backoff: baseDelay * 2^attempt + jitter
  
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Adicionar jitter (variação aleatória de ±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  
  // Limitar delay máximo a 30 segundos
  const finalDelay = Math.min(exponentialDelay + jitter, 30000);
  
  return Math.max(finalDelay, 1000); // Mínimo 1 segundo
};

/**
 * Logger específico para erros da Facebook API
 */
export const logFacebookError = (
  error: FacebookAPIError, 
  context: { endpoint?: string, method?: string, companyId?: number, attempt?: number }
): void => {
  const logLevel = error.isTemporary ? 'warn' : 'error';
  
  logger[logLevel]('Facebook API Error', {
    ...error.toLogData(),
    context,
    shouldRetry: error.isTemporary,
    userFriendlyMessage: error.getUserFriendlyMessage()
  });
};

/**
 * Tipos de erro comuns da Facebook API para referência
 */
export const FacebookErrorCodes = {
  // Autenticação
  INVALID_ACCESS_TOKEN: 190,
  ACCESS_TOKEN_EXPIRED: 190,
  PERMISSION_DENIED: 10,
  
  // Rate Limiting
  RATE_LIMITED: 4,
  TOO_MANY_CALLS: 17,
  CONCURRENT_REQUEST_LIMIT: 341,
  
  // Recursos não encontrados
  UNSUPPORTED_REQUEST: 100,
  INVALID_PARAMETER: 100,
  
  // Erros temporários
  TEMPORARY_ERROR: 1,
  SERVICE_TEMPORARILY_UNAVAILABLE: 2,
  
  // Páginas e Permissões
  PAGE_REQUEST_LIMIT_REACHED: 613,
  INVALID_PAGE_ACCESS_TOKEN: 190,
  
  // Instagram específicos
  INSTAGRAM_ACCOUNT_NOT_FOUND: 100,
  INSTAGRAM_BUSINESS_DISCOVERY_LIMIT: 4
} as const;