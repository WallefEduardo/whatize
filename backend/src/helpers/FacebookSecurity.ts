import crypto from 'crypto';
import logger from '../utils/logger';

/**
 * Verifica a assinatura do webhook do Facebook/Instagram conforme documentação oficial da Meta
 * @param payload - Corpo da requisição como string
 * @param signature - Header 'X-Hub-Signature-256' da requisição
 * @param appSecret - App Secret do Facebook configurado no .env
 * @returns true se a assinatura for válida, false caso contrário
 */
export const verifyWebhookSignature = (
  payload: string, 
  signature: string, 
  appSecret: string
): boolean => {
  try {
    // Verificar se todos os parâmetros estão presentes
    if (!payload || !signature || !appSecret) {
      logger.warn('FacebookSecurity: Parâmetros obrigatórios ausentes para verificação de assinatura');
      return false;
    }

    // Verificar se a assinatura tem o formato correto 'sha256=...'
    if (!signature.startsWith('sha256=')) {
      logger.warn('FacebookSecurity: Formato de assinatura inválido, deve começar com "sha256="');
      return false;
    }

    // Remover o prefixo 'sha256=' da assinatura
    const receivedSignature = signature.slice(7);

    // Calcular assinatura esperada usando HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload, 'utf8')
      .digest('hex');

    // Comparação segura contra timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      logger.warn('FacebookSecurity: Verificação de assinatura webhook falhou', {
        receivedLength: receivedSignature.length,
        expectedLength: expectedSignature.length,
        payloadLength: payload.length
      });
    } else {
      logger.debug('FacebookSecurity: Assinatura webhook verificada com sucesso');
    }

    return isValid;

  } catch (error) {
    logger.error('FacebookSecurity: Erro ao verificar assinatura webhook', error);
    return false;
  }
};

/**
 * Valida se o app secret está configurado corretamente
 * @param appSecret - App Secret a ser validado
 * @returns true se válido, false caso contrário
 */
export const validateAppSecret = (appSecret: string): boolean => {
  if (!appSecret) {
    logger.error('FacebookSecurity: FACEBOOK_APP_SECRET não está configurado no .env');
    return false;
  }

  // App Secret do Facebook deve ter pelo menos 32 caracteres
  if (appSecret.length < 32) {
    logger.error('FacebookSecurity: FACEBOOK_APP_SECRET parece ser inválido (muito curto)');
    return false;
  }

  return true;
};

/**
 * Extrai o payload bruto da requisição para verificação de assinatura
 * @param req - Objeto Request do Express
 * @returns string do payload ou null se inválido
 */
export const extractRawPayload = (req: any): string | null => {
  try {
    // Se o payload já está em formato string
    if (typeof req.body === 'string') {
      return req.body;
    }

    // Se o payload é um objeto, convertê-lo para string JSON
    if (typeof req.body === 'object') {
      return JSON.stringify(req.body);
    }

    // Se há raw payload disponível (middleware raw configurado)
    if (req.rawBody) {
      return req.rawBody.toString('utf8');
    }

    logger.warn('FacebookSecurity: Não foi possível extrair payload bruto da requisição');
    return null;

  } catch (error) {
    logger.error('FacebookSecurity: Erro ao extrair payload bruto', error);
    return null;
  }
};

/**
 * Log de segurança para tentativas de webhook
 * @param req - Request object
 * @param isValid - Se a verificação passou
 * @param userAgent - User agent da requisição
 */
export const logWebhookAttempt = (
  req: any, 
  isValid: boolean, 
  userAgent?: string
): void => {
  const logData = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: userAgent || req.headers['user-agent'],
    contentType: req.headers['content-type'],
    signaturePresent: !!req.headers['x-hub-signature-256'],
    payloadSize: req.body ? JSON.stringify(req.body).length : 0,
    isValid,
    endpoint: req.path
  };

  if (isValid) {
    logger.info('FacebookSecurity: Webhook válido recebido', logData);
  } else {
    logger.warn('FacebookSecurity: Tentativa de webhook inválida', logData);
  }
};