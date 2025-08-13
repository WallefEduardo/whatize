import { FacebookAPIClient } from '../FacebookServices/FacebookAPIClient';
import { 
  FacebookAPIError, 
  handleFacebookAPIError, 
  logFacebookError 
} from '../FacebookServices/FacebookErrorHandler';
import logger from '../../utils/logger';

/**
 * Configurações específicas do Instagram Business API
 */
interface InstagramAPIConfig {
  accessToken: string;
  instagramBusinessAccountId: string;
  companyId?: number;
  pageId?: string; // Para compatibilidade com Instagram via Facebook Page
  apiVersion?: string;
  timeout?: number;
}

/**
 * Tipos de mensagem suportadas pela Instagram API
 */
interface InstagramMessageRequest {
  recipient: {
    id: string; // Instagram Scoped ID (IGSID)
  };
  message: {
    text?: string;
    attachment?: {
      type: 'image' | 'video' | 'audio' | 'file';
      payload: {
        url: string;
        is_reusable?: boolean;
      };
    };
    quick_replies?: Array<{
      content_type: 'text';
      title: string;
      payload: string;
    }>;
  };
  messaging_type?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  tag?: string;
}

/**
 * Resposta da Instagram API para envio de mensagens
 */
interface InstagramMessageResponse {
  recipient_id: string;
  message_id: string;
}

/**
 * Dados do perfil Instagram Business
 */
interface InstagramBusinessProfile {
  id: string;
  username: string;
  name: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  website?: string;
  biography?: string;
}

/**
 * Cliente moderno para Instagram Business API
 * Implementa a nova API oficial do Instagram (julho 2024+)
 */
export class InstagramAPIClient {
  private facebookClient: FacebookAPIClient;
  private config: Required<Omit<InstagramAPIConfig, 'pageId'>> & { pageId?: string };

  constructor(config: InstagramAPIConfig) {
    this.config = {
      accessToken: config.accessToken,
      instagramBusinessAccountId: config.instagramBusinessAccountId,
      companyId: config.companyId || 0,
      pageId: config.pageId,
      apiVersion: config.apiVersion || process.env.META_API_VERSION || 'v22.0',
      timeout: config.timeout || parseInt(process.env.FACEBOOK_API_TIMEOUT || '30000')
    };

    // Usar o FacebookClient otimizado para fazer as requisições
    this.facebookClient = new FacebookAPIClient({
      accessToken: this.config.accessToken,
      companyId: this.config.companyId,
      apiVersion: this.config.apiVersion,
      timeout: this.config.timeout
    });

    logger.info('Instagram API Client inicializado', {
      businessAccountId: this.config.instagramBusinessAccountId,
      companyId: this.config.companyId,
      apiVersion: this.config.apiVersion,
      hasPageId: !!this.config.pageId
    });
  }

  /**
   * Envia mensagem via Instagram Business API
   */
  async sendMessage(recipientId: string, message: InstagramMessageRequest['message']): Promise<InstagramMessageResponse> {
    try {
      const requestData: InstagramMessageRequest = {
        recipient: { id: recipientId },
        message,
        messaging_type: 'RESPONSE' // Padrão para respostas
      };

      const response = await this.facebookClient.post(
        `${this.config.instagramBusinessAccountId}/messages`,
        requestData
      );

      logger.info('Instagram: Mensagem enviada com sucesso', {
        recipientId,
        messageId: response.data.message_id,
        businessAccountId: this.config.instagramBusinessAccountId,
        companyId: this.config.companyId,
        messageType: message.text ? 'text' : 'attachment'
      });

      return response.data;

    } catch (error) {
      const fbError = handleFacebookAPIError(error);
      
      logFacebookError(fbError, {
        endpoint: `${this.config.instagramBusinessAccountId}/messages`,
        method: 'POST',
        companyId: this.config.companyId
      });

      logger.error('Instagram: Erro ao enviar mensagem', {
        recipientId,
        businessAccountId: this.config.instagramBusinessAccountId,
        companyId: this.config.companyId,
        error: fbError.toLogData()
      });

      throw fbError;
    }
  }

  /**
   * Envia mensagem de texto simples
   */
  async sendTextMessage(recipientId: string, text: string): Promise<InstagramMessageResponse> {
    return this.sendMessage(recipientId, { text });
  }

  /**
   * Envia imagem via URL
   */
  async sendImageMessage(recipientId: string, imageUrl: string, caption?: string): Promise<InstagramMessageResponse> {
    const message: InstagramMessageRequest['message'] = {
      attachment: {
        type: 'image',
        payload: {
          url: imageUrl,
          is_reusable: true
        }
      }
    };

    // Instagram não suporta caption em attachments, enviar como texto separado se necessário
    if (caption) {
      // Primeiro enviar a imagem
      const imageResponse = await this.sendMessage(recipientId, message);
      
      // Depois enviar o caption como texto
      await this.sendTextMessage(recipientId, caption);
      
      return imageResponse;
    }

    return this.sendMessage(recipientId, message);
  }

  /**
   * Envia arquivo de mídia (vídeo, áudio, etc.)
   */
  async sendMediaMessage(
    recipientId: string, 
    mediaUrl: string, 
    type: 'video' | 'audio' | 'file'
  ): Promise<InstagramMessageResponse> {
    return this.sendMessage(recipientId, {
      attachment: {
        type,
        payload: {
          url: mediaUrl,
          is_reusable: true
        }
      }
    });
  }

  /**
   * Obtém informações do perfil Instagram Business
   */
  async getBusinessProfile(): Promise<InstagramBusinessProfile> {
    try {
      const response = await this.facebookClient.get(
        `${this.config.instagramBusinessAccountId}`,
        {
          params: {
            fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,website,biography'
          }
        }
      );

      logger.debug('Instagram: Perfil obtido com sucesso', {
        businessAccountId: this.config.instagramBusinessAccountId,
        username: response.data.username,
        companyId: this.config.companyId
      });

      return response.data;

    } catch (error) {
      const fbError = handleFacebookAPIError(error);
      
      logFacebookError(fbError, {
        endpoint: this.config.instagramBusinessAccountId,
        method: 'GET',
        companyId: this.config.companyId
      });

      throw fbError;
    }
  }

  /**
   * Obtém informações de um usuário Instagram (limitado pela API)
   */
  async getUserInfo(userId: string): Promise<{ id: string; username?: string }> {
    try {
      const response = await this.facebookClient.get(
        userId,
        {
          params: {
            fields: 'id,username'
          }
        }
      );

      return response.data;

    } catch (error) {
      const fbError = handleFacebookAPIError(error);
      
      // Para erros de usuário não encontrado, retornar dados básicos
      if (fbError.code === 100) {
        logger.warn('Instagram: Usuário não encontrado, retornando ID básico', {
          userId,
          companyId: this.config.companyId
        });
        
        return { id: userId };
      }

      logFacebookError(fbError, {
        endpoint: userId,
        method: 'GET',
        companyId: this.config.companyId
      });

      throw fbError;
    }
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(userId: string): Promise<void> {
    try {
      await this.facebookClient.post(
        `${this.config.instagramBusinessAccountId}/messages`,
        {
          recipient: { id: userId },
          sender_action: 'mark_seen'
        }
      );

      logger.debug('Instagram: Mensagem marcada como lida', {
        userId,
        businessAccountId: this.config.instagramBusinessAccountId,
        companyId: this.config.companyId
      });

    } catch (error) {
      const fbError = handleFacebookAPIError(error);
      
      // Não é crítico se falhar, apenas log
      logger.warn('Instagram: Erro ao marcar como lida (não crítico)', {
        userId,
        error: fbError.getUserFriendlyMessage(),
        companyId: this.config.companyId
      });
    }
  }

  /**
   * Mostra indicador de digitação
   */
  async showTypingIndicator(userId: string, action: 'typing_on' | 'typing_off' = 'typing_on'): Promise<void> {
    try {
      await this.facebookClient.post(
        `${this.config.instagramBusinessAccountId}/messages`,
        {
          recipient: { id: userId },
          sender_action: action
        }
      );

      logger.debug('Instagram: Indicador de digitação enviado', {
        userId,
        action,
        businessAccountId: this.config.instagramBusinessAccountId,
        companyId: this.config.companyId
      });

    } catch (error) {
      const fbError = handleFacebookAPIError(error);
      
      // Não é crítico se falhar, apenas log
      logger.warn('Instagram: Erro ao enviar indicador de digitação (não crítico)', {
        userId,
        action,
        error: fbError.getUserFriendlyMessage(),
        companyId: this.config.companyId
      });
    }
  }

  /**
   * Verifica se uma conta Instagram Business está configurada corretamente
   */
  async validateConfiguration(): Promise<{
    valid: boolean;
    businessProfile?: InstagramBusinessProfile;
    error?: string;
  }> {
    try {
      const profile = await this.getBusinessProfile();
      
      return {
        valid: true,
        businessProfile: profile
      };

    } catch (error) {
      const fbError = handleFacebookAPIError(error);
      
      return {
        valid: false,
        error: fbError.getUserFriendlyMessage()
      };
    }
  }

  /**
   * Obtém estatísticas do cliente
   */
  getStats() {
    return this.facebookClient.getStats();
  }

  /**
   * Health check específico do Instagram
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const profile = await this.getBusinessProfile();
      const fbHealthCheck = await this.facebookClient.healthCheck();
      
      return {
        healthy: true,
        details: {
          instagramProfile: {
            id: profile.id,
            username: profile.username,
            name: profile.name
          },
          facebookClient: fbHealthCheck.details,
          apiVersion: this.config.apiVersion,
          businessAccountId: this.config.instagramBusinessAccountId
        }
      };

    } catch (error) {
      const fbError = handleFacebookAPIError(error);
      
      return {
        healthy: false,
        details: {
          error: fbError.getUserFriendlyMessage(),
          code: fbError.code,
          type: fbError.type,
          businessAccountId: this.config.instagramBusinessAccountId
        }
      };
    }
  }

  /**
   * Atualiza access token
   */
  updateAccessToken(newToken: string): void {
    this.config.accessToken = newToken;
    this.facebookClient.updateAccessToken(newToken);
    
    logger.info('Instagram API Client: Access token atualizado', {
      businessAccountId: this.config.instagramBusinessAccountId,
      companyId: this.config.companyId
    });
  }

  /**
   * Obtém configuração atual (sem access token por segurança)
   */
  getConfig(): Omit<Required<InstagramAPIConfig>, 'accessToken'> {
    const { accessToken, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      pageId: this.config.pageId || ''
    };
  }
}