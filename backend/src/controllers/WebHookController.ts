import { Request, Response } from "express";
import Whatsapp from "../models/Whatsapp";
import { handleMessage } from "../services/FacebookServices/facebookMessageListener";
import { 
  verifyWebhookSignature, 
  validateAppSecret, 
  extractRawPayload,
  logWebhookAttempt 
} from "../helpers/FacebookSecurity";
import logger from "../utils/logger";
// import { handleMessage } from "../services/FacebookServices/facebookMessageListener";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "whaticket";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Log da tentativa de verificação para debugging
  logger.info('Facebook Webhook: Tentativa de verificação', {
    mode,
    tokenPresent: !!token,
    challengePresent: !!challenge,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      logger.info('Facebook Webhook: Verificação bem-sucedida', {
        challenge: challenge?.toString().substring(0, 10) + '...' // Log parcial por segurança
      });
      return res.status(200).send(challenge);
    } else {
      logger.warn('Facebook Webhook: Token de verificação inválido', {
        providedToken: token?.toString().substring(0, 5) + '...',
        ip: req.ip
      });
    }
  }

  return res.status(403).json({
    message: "Forbidden"
  });
};

export const webHook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { body } = req;
    const signature = req.headers['x-hub-signature-256'] as string;
    const userAgent = req.headers['user-agent'] as string;
    
    // Verificar se o app secret está configurado
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!validateAppSecret(appSecret)) {
      logger.error('Facebook Webhook: FACEBOOK_APP_SECRET não configurado adequadamente');
      logWebhookAttempt(req, false, userAgent);
      return res.status(500).json({
        error: "Server configuration error",
        message: "Facebook App Secret not properly configured"
      });
    }

    // Extrair payload bruto para verificação de assinatura
    let rawPayload: string | null = null;
    
    // Tentar diferentes métodos para obter o payload bruto
    if (req.body && typeof req.body === 'string') {
      rawPayload = req.body;
    } else if (req.body && typeof req.body === 'object') {
      rawPayload = JSON.stringify(req.body);
    } else if ((req as any).rawBody) {
      rawPayload = (req as any).rawBody.toString('utf8');
    }

    // Verificar assinatura do webhook (somente em produção ou se habilitada)
    const skipSignatureCheck = process.env.NODE_ENV === 'development' && 
                              process.env.SKIP_WEBHOOK_SIGNATURE === 'true';
    
    if (!skipSignatureCheck) {
      if (!signature) {
        logger.warn('Facebook Webhook: Assinatura ausente', {
          ip: req.ip,
          userAgent,
          hasBody: !!body
        });
        logWebhookAttempt(req, false, userAgent);
        return res.status(401).json({
          error: "Unauthorized",
          message: "Missing X-Hub-Signature-256 header"
        });
      }

      if (!rawPayload) {
        logger.error('Facebook Webhook: Não foi possível extrair payload para verificação');
        logWebhookAttempt(req, false, userAgent);
        return res.status(400).json({
          error: "Bad Request",
          message: "Unable to extract raw payload for signature verification"
        });
      }

      // Verificar assinatura
      const isValidSignature = verifyWebhookSignature(rawPayload, signature, appSecret);
      if (!isValidSignature) {
        logger.warn('Facebook Webhook: Assinatura inválida', {
          ip: req.ip,
          userAgent,
          payloadLength: rawPayload.length,
          signatureLength: signature.length
        });
        logWebhookAttempt(req, false, userAgent);
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid webhook signature"
        });
      }
    } else {
      logger.debug('Facebook Webhook: Verificação de assinatura ignorada (desenvolvimento)');
    }

    // Log da tentativa bem-sucedida
    logWebhookAttempt(req, true, userAgent);

    // Verificar se é um webhook válido do Facebook/Instagram
    if (body.object === "page" || body.object === "instagram") {
      let channel: string;

      if (body.object === "page") {
        channel = "facebook";
      } else {
        channel = "instagram";
      }

      logger.debug('Facebook Webhook: Processando eventos', {
        channel,
        entriesCount: body.entry?.length || 0,
        timestamp: new Date().toISOString()
      });

      // Processar cada entrada do webhook
      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          try {
            const getTokenPage = await Whatsapp.findOne({
              where: {
                facebookPageUserId: entry.id,
                channel
              }
            });

            if (getTokenPage) {
              if (entry.messaging && Array.isArray(entry.messaging)) {
                for (const data of entry.messaging) {
                  try {
                    await handleMessage(getTokenPage, data, channel, getTokenPage.companyId);
                  } catch (messageError) {
                    logger.error('Facebook Webhook: Erro ao processar mensagem individual', {
                      error: messageError,
                      entryId: entry.id,
                      channel,
                      companyId: getTokenPage.companyId
                    });
                  }
                }
              }
            } else {
              logger.warn('Facebook Webhook: Página não encontrada no banco de dados', {
                pageId: entry.id,
                channel
              });
            }
          } catch (entryError) {
            logger.error('Facebook Webhook: Erro ao processar entrada', {
              error: entryError,
              entryId: entry.id,
              channel
            });
          }
        }
      }

      return res.status(200).json({
        message: "EVENT_RECEIVED"
      });
    }

    // Tipo de objeto não reconhecido
    logger.warn('Facebook Webhook: Objeto não reconhecido', {
      object: body.object,
      ip: req.ip
    });

    return res.status(404).json({
      error: "Not Found",
      message: "Unrecognized webhook object type"
    });

  } catch (error) {
    logger.error('Facebook Webhook: Erro crítico no processamento', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while processing the webhook"
    });
  }
};