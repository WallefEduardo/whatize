import { InstagramAPIClient } from './InstagramAPIClient';
import { createCompatibleApiBase } from '../FacebookServices/FacebookClientWrapper';
import Whatsapp from '../../models/Whatsapp';
import logger from '../../utils/logger';

/**
 * Cache de clientes Instagram por configuração
 */
const instagramClientCache = new Map<string, InstagramAPIClient>();

/**
 * Detecta qual tipo de integração Instagram usar
 */
interface InstagramIntegrationType {
  type: 'modern' | 'legacy' | 'none';
  client?: InstagramAPIClient;
  legacyClient?: any;
  details: string;
}

/**
 * Wrapper que automaticamente escolhe entre Instagram API moderna ou legacy
 * Mantém compatibilidade total com código existente
 */
export class InstagramServiceWrapper {
  
  /**
   * Detecta automaticamente qual integração Instagram usar
   */
  static detectIntegrationType(whatsapp: Whatsapp): InstagramIntegrationType {
    // Verificar se tem configuração da nova Instagram Business API
    if (whatsapp.instagramBusinessAccountId && whatsapp.instagramAccessToken) {
      return {
        type: 'modern',
        details: 'Instagram Business API (Nova - Julho 2024+)'
      };
    }

    // Verificar se tem configuração legacy via Facebook Page
    if (whatsapp.facebookPageUserId && whatsapp.facebookUserToken && whatsapp.channel === 'instagram') {
      return {
        type: 'legacy',
        details: 'Instagram via Facebook Page API (Legacy)'
      };
    }

    return {
      type: 'none',
      details: 'Nenhuma configuração Instagram encontrada'
    };
  }

  /**
   * Obtém cliente Instagram apropriado baseado na configuração
   */
  static getInstagramClient(whatsapp: Whatsapp): InstagramAPIClient | null {
    const integration = this.detectIntegrationType(whatsapp);

    if (integration.type !== 'modern') {
      return null;
    }

    // Criar chave única do cache
    const cacheKey = `${whatsapp.instagramBusinessAccountId}_${whatsapp.companyId}`;
    
    // Verificar se já existe no cache
    let client = instagramClientCache.get(cacheKey);
    
    if (!client) {
      // Criar novo cliente Instagram moderno
      client = new InstagramAPIClient({
        accessToken: whatsapp.instagramAccessToken,
        instagramBusinessAccountId: whatsapp.instagramBusinessAccountId,
        companyId: whatsapp.companyId,
        pageId: whatsapp.facebookPageUserId // Para compatibilidade se necessário
      });
      
      // Armazenar no cache
      instagramClientCache.set(cacheKey, client);
      
      logger.info('Instagram Service: Novo cliente moderno criado', {
        businessAccountId: whatsapp.instagramBusinessAccountId,
        companyId: whatsapp.companyId,
        username: whatsapp.instagramUsername,
        cacheSize: instagramClientCache.size
      });
    }
    
    return client;
  }

  /**
   * Envia mensagem de texto via Instagram (detecta automaticamente a API)
   */
  static async sendTextMessage(whatsapp: Whatsapp, recipientId: string, text: string): Promise<any> {
    const integration = this.detectIntegrationType(whatsapp);

    logger.debug('Instagram Service: Enviando mensagem de texto', {
      integrationType: integration.type,
      recipientId,
      textLength: text.length,
      companyId: whatsapp.companyId,
      details: integration.details
    });

    switch (integration.type) {
      case 'modern':
        // Usar nova Instagram Business API
        const modernClient = this.getInstagramClient(whatsapp);
        if (!modernClient) {
          throw new Error('Erro ao criar cliente Instagram moderno');
        }
        
        return await modernClient.sendTextMessage(recipientId, text);

      case 'legacy':
        // Usar API legacy via Facebook
        const legacyClient = createCompatibleApiBase(
          whatsapp.facebookUserToken, 
          whatsapp.companyId
        );
        
        logger.info('Instagram Service: Usando API legacy via Facebook', {
          pageId: whatsapp.facebookPageUserId,
          companyId: whatsapp.companyId
        });
        
        return await legacyClient.post('me/messages', {
          recipient: { id: recipientId },
          message: { text }
        });

      default:
        throw new Error('Nenhuma configuração Instagram válida encontrada');
    }
  }

  /**
   * Envia imagem via Instagram
   */
  static async sendImageMessage(
    whatsapp: Whatsapp, 
    recipientId: string, 
    imageUrl: string, 
    caption?: string
  ): Promise<any> {
    const integration = this.detectIntegrationType(whatsapp);

    logger.debug('Instagram Service: Enviando imagem', {
      integrationType: integration.type,
      recipientId,
      hasCaption: !!caption,
      companyId: whatsapp.companyId
    });

    switch (integration.type) {
      case 'modern':
        const modernClient = this.getInstagramClient(whatsapp);
        if (!modernClient) {
          throw new Error('Erro ao criar cliente Instagram moderno');
        }
        
        return await modernClient.sendImageMessage(recipientId, imageUrl, caption);

      case 'legacy':
        const legacyClient = createCompatibleApiBase(
          whatsapp.facebookUserToken, 
          whatsapp.companyId
        );
        
        // Na API legacy, enviar attachment e caption separadamente se necessário
        const response = await legacyClient.post('me/messages', {
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'image',
              payload: { url: imageUrl }
            }
          }
        });

        // Enviar caption como mensagem separada se fornecido
        if (caption) {
          await legacyClient.post('me/messages', {
            recipient: { id: recipientId },
            message: { text: caption }
          });
        }

        return response;

      default:
        throw new Error('Nenhuma configuração Instagram válida encontrada');
    }
  }

  /**
   * Marca mensagem como lida
   */
  static async markAsRead(whatsapp: Whatsapp, userId: string): Promise<void> {
    const integration = this.detectIntegrationType(whatsapp);

    switch (integration.type) {
      case 'modern':
        const modernClient = this.getInstagramClient(whatsapp);
        if (modernClient) {
          await modernClient.markAsRead(userId);
        }
        break;

      case 'legacy':
        const legacyClient = createCompatibleApiBase(
          whatsapp.facebookUserToken, 
          whatsapp.companyId
        );
        
        await legacyClient.post('me/messages', {
          recipient: { id: userId },
          sender_action: 'mark_seen'
        });
        break;

      default:
        logger.warn('Instagram Service: Não foi possível marcar como lida - configuração ausente', {
          companyId: whatsapp.companyId
        });
    }
  }

  /**
   * Mostra indicador de digitação
   */
  static async showTypingIndicator(whatsapp: Whatsapp, userId: string): Promise<void> {
    const integration = this.detectIntegrationType(whatsapp);

    switch (integration.type) {
      case 'modern':
        const modernClient = this.getInstagramClient(whatsapp);
        if (modernClient) {
          await modernClient.showTypingIndicator(userId, 'typing_on');
        }
        break;

      case 'legacy':
        const legacyClient = createCompatibleApiBase(
          whatsapp.facebookUserToken, 
          whatsapp.companyId
        );
        
        await legacyClient.post('me/messages', {
          recipient: { id: userId },
          sender_action: 'typing_on'
        });
        break;

      default:
        // Ignorar silenciosamente se não houver configuração
        break;
    }
  }

  /**
   * Valida configuração Instagram
   */
  static async validateConfiguration(whatsapp: Whatsapp): Promise<{
    valid: boolean;
    type: string;
    details: any;
    error?: string;
  }> {
    const integration = this.detectIntegrationType(whatsapp);

    switch (integration.type) {
      case 'modern':
        const modernClient = this.getInstagramClient(whatsapp);
        if (!modernClient) {
          return {
            valid: false,
            type: 'modern',
            details: {},
            error: 'Erro ao criar cliente Instagram moderno'
          };
        }
        
        const validation = await modernClient.validateConfiguration();
        return {
          valid: validation.valid,
          type: 'modern',
          details: validation.businessProfile || {},
          error: validation.error
        };

      case 'legacy':
        // Para legacy, apenas verificar se tem as configurações básicas
        const hasRequiredFields = !!(whatsapp.facebookPageUserId && whatsapp.facebookUserToken);
        
        return {
          valid: hasRequiredFields,
          type: 'legacy',
          details: {
            pageId: whatsapp.facebookPageUserId,
            hasToken: !!whatsapp.facebookUserToken
          },
          error: hasRequiredFields ? undefined : 'Configuração Facebook incompleta'
        };

      default:
        return {
          valid: false,
          type: 'none',
          details: {},
          error: 'Nenhuma configuração Instagram encontrada'
        };
    }
  }

  /**
   * Obtém estatísticas de uso dos clientes Instagram
   */
  static getAllInstagramStats(): Array<{
    businessAccountId: string;
    companyId: number;
    username?: string;
    type: 'modern';
    stats: any;
  }> {
    const stats = [];
    
    for (const [cacheKey, client] of instagramClientCache.entries()) {
      const [businessAccountId, companyIdStr] = cacheKey.split('_');
      const config = client.getConfig();
      
      stats.push({
        businessAccountId,
        companyId: parseInt(companyIdStr) || 0,
        type: 'modern' as const,
        stats: client.getStats()
      });
    }
    
    return stats;
  }

  /**
   * Limpa cache de clientes Instagram
   */
  static clearCache(): void {
    const cacheSize = instagramClientCache.size;
    instagramClientCache.clear();
    
    logger.info('Instagram Service: Cache limpo', {
      clientsRemoved: cacheSize
    });
  }

  /**
   * Health check de todos os clientes Instagram
   */
  static async healthCheckAll(): Promise<Array<{
    businessAccountId: string;
    companyId: number;
    type: string;
    healthy: boolean;
    details: any;
  }>> {
    const results = [];
    
    for (const [cacheKey, client] of instagramClientCache.entries()) {
      const [businessAccountId, companyIdStr] = cacheKey.split('_');
      
      try {
        const healthCheck = await client.healthCheck();
        
        results.push({
          businessAccountId,
          companyId: parseInt(companyIdStr) || 0,
          type: 'modern',
          healthy: healthCheck.healthy,
          details: healthCheck.details
        });
      } catch (error) {
        results.push({
          businessAccountId,
          companyId: parseInt(companyIdStr) || 0,
          type: 'modern',
          healthy: false,
          details: { error: error.message }
        });
      }
    }
    
    return results;
  }
}

// Limpeza periódica do cache (evitar memory leak)
setInterval(() => {
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  
  for (const [cacheKey, client] of instagramClientCache.entries()) {
    const stats = client.getStats();
    if (stats.lastRequestTime && stats.lastRequestTime.getTime() < thirtyMinutesAgo) {
      instagramClientCache.delete(cacheKey);
      logger.debug('Instagram Service: Cliente removido por inatividade', {
        cacheKey: cacheKey.substring(0, 20) + '...'
      });
    }
  }
}, 30 * 60 * 1000); // 30 minutos