import { FacebookAPIClient } from './FacebookAPIClient';
import { handleFacebookAPIError, logFacebookError } from './FacebookErrorHandler';
import logger from '../../utils/logger';

/**
 * Cache de clientes por token para evitar recriação desnecessária
 */
const clientCache = new Map<string, FacebookAPIClient>();

/**
 * Limpeza periódica do cache (evitar memory leak)
 */
setInterval(() => {
  // Limpar cache a cada 30 minutos para tokens que não foram usados recentemente
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  
  for (const [token, client] of clientCache.entries()) {
    const stats = client.getStats();
    if (stats.lastRequestTime && stats.lastRequestTime.getTime() < thirtyMinutesAgo) {
      clientCache.delete(token);
      logger.debug('Facebook Client Cache: Cliente removido por inatividade', {
        tokenPrefix: token.substring(0, 10) + '...'
      });
    }
  }
}, 30 * 60 * 1000); // 30 minutos

/**
 * Obtém ou cria um cliente Facebook API para um token específico
 */
export const getFacebookClient = (token: string, companyId?: number): FacebookAPIClient => {
  // Criar chave única do cache incluindo companyId
  const cacheKey = `${token}_${companyId || 0}`;
  
  // Verificar se já existe no cache
  let client = clientCache.get(cacheKey);
  
  if (!client) {
    // Criar novo cliente
    client = new FacebookAPIClient({
      accessToken: token,
      companyId: companyId
    });
    
    // Armazenar no cache
    clientCache.set(cacheKey, client);
    
    logger.debug('Facebook Client Cache: Novo cliente criado', {
      companyId,
      tokenPrefix: token.substring(0, 10) + '...',
      cacheSize: clientCache.size
    });
  }
  
  return client;
};

/**
 * Função wrapper que mantém compatibilidade com apiBase() existente
 * Substitui a implementação antiga mas mantém a mesma interface
 */
export const createCompatibleApiBase = (token: string, companyId?: number) => {
  const client = getFacebookClient(token, companyId);
  
  return {
    // Métodos do Axios que são usados no código existente
    async get(url: string, config?: any) {
      try {
        const response = await client.get(url, config);
        return response;
      } catch (error) {
        const fbError = handleFacebookAPIError(error);
        logFacebookError(fbError, {
          endpoint: url,
          method: 'GET',
          companyId
        });
        throw fbError;
      }
    },

    async post(url: string, data?: any, config?: any) {
      try {
        const response = await client.post(url, data, config);
        return response;
      } catch (error) {
        const fbError = handleFacebookAPIError(error);
        logFacebookError(fbError, {
          endpoint: url,
          method: 'POST',
          companyId
        });
        throw fbError;
      }
    },

    async put(url: string, data?: any, config?: any) {
      try {
        const response = await client.put(url, data, config);
        return response;
      } catch (error) {
        const fbError = handleFacebookAPIError(error);
        logFacebookError(fbError, {
          endpoint: url,
          method: 'PUT',
          companyId
        });
        throw fbError;
      }
    },

    async delete(url: string, config?: any) {
      try {
        const response = await client.delete(url, config);
        return response;
      } catch (error) {
        const fbError = handleFacebookAPIError(error);
        logFacebookError(fbError, {
          endpoint: url,
          method: 'DELETE',
          companyId
        });
        throw fbError;
      }
    },

    // Propriedades do Axios para compatibilidade
    defaults: {
      params: {
        access_token: token
      }
    }
  };
};

/**
 * Função para obter estatísticas de todos os clientes ativos
 */
export const getAllClientsStats = (): Array<{token: string, companyId: number, stats: any}> => {
  const stats = [];
  
  for (const [cacheKey, client] of clientCache.entries()) {
    const [tokenPrefix, companyIdStr] = cacheKey.split('_');
    stats.push({
      token: tokenPrefix + '...',
      companyId: parseInt(companyIdStr) || 0,
      stats: client.getStats()
    });
  }
  
  return stats;
};

/**
 * Função para limpar cache manualmente
 */
export const clearClientCache = (): void => {
  const cacheSize = clientCache.size;
  clientCache.clear();
  
  logger.info('Facebook Client Cache: Cache limpo manualmente', {
    clientsRemoved: cacheSize
  });
};

/**
 * Função para fazer health check de todos os clientes
 */
export const healthCheckAllClients = async (): Promise<Array<{
  token: string,
  companyId: number,
  healthy: boolean,
  details: any
}>> => {
  const results = [];
  
  for (const [cacheKey, client] of clientCache.entries()) {
    const [tokenPrefix, companyIdStr] = cacheKey.split('_');
    
    try {
      const healthCheck = await client.healthCheck();
      
      results.push({
        token: tokenPrefix + '...',
        companyId: parseInt(companyIdStr) || 0,
        healthy: healthCheck.healthy,
        details: healthCheck.details
      });
    } catch (error) {
      results.push({
        token: tokenPrefix + '...',
        companyId: parseInt(companyIdStr) || 0,
        healthy: false,
        details: { error: error.message }
      });
    }
  }
  
  return results;
};

/**
 * Função para atualizar token de um cliente específico
 */
export const updateClientToken = (oldToken: string, newToken: string, companyId?: number): boolean => {
  const oldCacheKey = `${oldToken}_${companyId || 0}`;
  const newCacheKey = `${newToken}_${companyId || 0}`;
  
  const client = clientCache.get(oldCacheKey);
  if (client) {
    // Atualizar token no cliente
    client.updateAccessToken(newToken);
    
    // Mover no cache
    clientCache.set(newCacheKey, client);
    clientCache.delete(oldCacheKey);
    
    logger.info('Facebook Client: Token atualizado', {
      companyId,
      oldTokenPrefix: oldToken.substring(0, 10) + '...',
      newTokenPrefix: newToken.substring(0, 10) + '...'
    });
    
    return true;
  }
  
  return false;
};