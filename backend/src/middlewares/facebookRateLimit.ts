import { Request, Response } from 'express';
import logger from '../utils/logger';

// Cache simples em memória para rate limiting (usando Map)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Limpeza periódica do cache (evitar memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.resetTime) {
      rateLimitCache.delete(key);
    }
  }
}, 60000); // Limpar a cada minuto

/**
 * Rate limiter específico para webhooks do Facebook/Instagram
 * Implementação simples usando cache em memória
 */
export const facebookWebhookLimiter = (req: Request, res: Response, next: Function): void => {
  try {
    // Extrair IP real considerando proxies
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIP = req.headers['x-real-ip'] as string;
    const ip = forwarded?.split(',')[0] || realIP || req.ip || req.connection?.remoteAddress || 'unknown';
    
    // Permitir localhost e IPs de desenvolvimento
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('localhost') || ip === 'unknown') {
      return next();
    }

    const key = `facebook_webhook_${ip}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    const maxRequests = parseInt(process.env.FACEBOOK_RATE_LIMIT_PER_MINUTE || '100');

    // Verificar cache existente
    const existing = rateLimitCache.get(key);
    
    if (!existing || now > existing.resetTime) {
      // Primeira requisição ou janela expirou
      rateLimitCache.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      logger.debug('Facebook Rate Limit: Primeira requisição na janela', {
        ip,
        timestamp: new Date().toISOString()
      });
      
      return next();
    }

    // Verificar se excedeu o limite
    if (existing.count >= maxRequests) {
      const remainingTime = Math.ceil((existing.resetTime - now) / 1000);
      
      logger.warn('Facebook Webhook Rate Limit: Limite excedido', {
        ip,
        count: existing.count,
        maxRequests,
        remainingTime,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
        endpoint: req.path,
        method: req.method
      });

      // Headers informativos sobre o rate limit
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(existing.resetTime / 1000).toString(),
        'Retry-After': remainingTime.toString()
      });

      res.status(429).json({
        error: 'Too many webhook requests',
        message: 'Rate limit exceeded for Facebook webhooks',
        retryAfter: `${remainingTime} seconds`
      });
      return;
    }

    // Incrementar contador
    existing.count++;
    rateLimitCache.set(key, existing);

    // Headers informativos
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - existing.count).toString(),
      'X-RateLimit-Reset': Math.ceil(existing.resetTime / 1000).toString()
    });

    next();

  } catch (error) {
    logger.error('Facebook Rate Limit: Erro no middleware', error);
    // Em caso de erro, permitir a requisição
    next();
  }
};

/**
 * Rate limiter mais restritivo para endpoints sensíveis
 */
export const strictFacebookLimiter = (req: Request, res: Response, next: Function): void => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    
    // Permitir localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip.toString().includes('localhost')) {
      return next();
    }

    const key = `facebook_strict_${ip}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    const maxRequests = parseInt(process.env.FACEBOOK_STRICT_RATE_LIMIT_PER_MINUTE || '20');

    const existing = rateLimitCache.get(key);
    
    if (!existing || now > existing.resetTime) {
      rateLimitCache.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (existing.count >= maxRequests) {
      logger.error('Facebook Strict Rate Limit: Limite crítico excedido', {
        ip,
        path: req.path,
        count: existing.count,
        timestamp: new Date().toISOString()
      });

      res.status(429).json({
        error: 'Strict rate limit exceeded',
        message: 'Too many requests to sensitive Facebook endpoint'
      });
      return;
    }

    existing.count++;
    rateLimitCache.set(key, existing);
    next();

  } catch (error) {
    logger.error('Facebook Strict Rate Limit: Erro no middleware', error);
    next();
  }
};

/**
 * Middleware para logging de requests de webhook
 * Ajuda no debugging e monitoramento
 */
export const webhookLogger = (req: Request, res: Response, next: Function): void => {
  const startTime = Date.now();
  
  // Log da requisição incoming
  logger.debug('Facebook Webhook: Request recebido', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    hasSignature: !!req.headers['x-hub-signature-256'],
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    timestamp: new Date().toISOString()
  });
  
  // Interceptar a resposta para log com proteção contra dupla resposta
  const originalSend = res.send;
  let responseSent = false;
  
  res.send = function(body: any) {
    // ✅ Proteger contra dupla resposta
    if (responseSent) {
      logger.warn('Facebook Webhook: Tentativa de dupla resposta detectada', {
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
      return this;
    }
    
    responseSent = true;
    const duration = Date.now() - startTime;
    
    logger.debug('Facebook Webhook: Response enviado', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: body ? JSON.stringify(body).length : 0,
      timestamp: new Date().toISOString()
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Middleware para validar cabeçalhos obrigatórios do Facebook
 */
export const validateFacebookHeaders = (req: Request, res: Response, next: Function): void => {
  // Para requisições POST (webhooks), verificar cabeçalhos obrigatórios
  if (req.method === 'POST') {
    const contentType = req.headers['content-type'];
    const signature = req.headers['x-hub-signature-256'];
    
    // Content-Type deve ser application/json
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('Facebook Webhook: Content-Type inválido', {
        contentType,
        ip: req.ip,
        path: req.path
      });
      
      res.status(400).json({
        error: 'Invalid Content-Type',
        message: 'Content-Type must be application/json'
      });
      return;
    }
    
    // X-Hub-Signature-256 deve estar presente (será validado depois)
    if (!signature) {
      logger.warn('Facebook Webhook: Assinatura ausente', {
        ip: req.ip,
        path: req.path,
        hasBody: !!req.body
      });
      
      res.status(400).json({
        error: 'Missing signature',
        message: 'X-Hub-Signature-256 header is required'
      });
      return;
    }
  }
  
  next();
};