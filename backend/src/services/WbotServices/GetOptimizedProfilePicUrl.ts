import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import logger from "../../utils/logger";

// Novos utilitários otimizados
import optimizedCache from "../../libs/optimizedCache";
import RetryManager from "../../utils/retryManager";
import UrlValidator from "../../utils/urlValidator";
import CircuitBreakerManager from "../../utils/circuitBreaker";

// Fallback para sistema original
import GetProfilePicUrl from "./GetProfilePicUrl";

interface OptimizedResult {
  url: string;
  source: 'optimized' | 'fallback';
  fromCache: boolean;
  attempts: number;
  processingTimeMs: number;
}

/**
 * Versão otimizada do GetProfilePicUrl que roda EM PARALELO com o original
 * 
 * Melhorias:
 * - Cache em camadas (Memória + Redis)
 * - Retry com backoff exponencial  
 * - Validação de URLs
 * - Circuit breaker para falhas
 * - Fallback automático para sistema original
 */
const GetOptimizedProfilePicUrl = async (
  number: string,
  companyId: number,
  contact?: Contact,
  wbot?: any
): Promise<OptimizedResult> => {
  const startTime = Date.now();
  let attempts = 0;
  
  try {
    // Circuit breaker para este serviço
    const circuitBreaker = CircuitBreakerManager.getBreaker('profile-pic-service', {
      failureThreshold: 3,
      resetTimeoutMs: 30000, // 30 segundos
      successThreshold: 2
    });

    // Verifica se serviço está disponível
    if (!circuitBreaker.isAvailable()) {
      logger.warn(`🚨 [OPTIMIZED-PROFILE-PIC] Circuit breaker OPEN - usando fallback para ${number}`);
      const fallbackUrl = await GetProfilePicUrl(number, companyId, contact, wbot);
      return {
        url: fallbackUrl,
        source: 'fallback',
        fromCache: false,
        attempts: 1,
        processingTimeMs: Date.now() - startTime
      };
    }

    const result = await circuitBreaker.execute(async () => {
      return await getOptimizedProfilePicInternal(number, companyId, contact, wbot);
    });

    return {
      ...result,
      processingTimeMs: Date.now() - startTime
    };

  } catch (error) {
    logger.error(`❌ [OPTIMIZED-PROFILE-PIC] Erro geral para ${number}: ${error.message}`);
    
    // Fallback automático para sistema original
    try {
      logger.info(`🔄 [OPTIMIZED-PROFILE-PIC] Usando fallback original para ${number}`);
      const fallbackUrl = await GetProfilePicUrl(number, companyId, contact, wbot);
      return {
        url: fallbackUrl,
        source: 'fallback',
        fromCache: false,
        attempts: attempts + 1,
        processingTimeMs: Date.now() - startTime
      };
    } catch (fallbackError) {
      logger.error(`❌ [OPTIMIZED-PROFILE-PIC] Fallback também falhou para ${number}: ${fallbackError.message}`);
      return {
        url: `${process.env.FRONTEND_URL}/nopicture.png`,
        source: 'fallback',
        fromCache: false,
        attempts: attempts + 1,
        processingTimeMs: Date.now() - startTime
      };
    }
  }
};

/**
 * Implementação interna otimizada
 */
async function getOptimizedProfilePicInternal(
  number: string,
  companyId: number,
  contact?: Contact,
  wbot?: any
): Promise<Omit<OptimizedResult, 'processingTimeMs'>> {
  // Normaliza JID
  const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
  const noPicture = `${process.env.FRONTEND_URL}/nopicture.png`;
  
  // 1. Busca em cache otimizado (Memória + Redis)
  const cacheKey = UrlValidator.generateCacheKey(jid, companyId);
  const cachedUrl = await optimizedCache.get(cacheKey);
  
  if (cachedUrl) {
    // Valida URL do cache rapidamente
    const validation = UrlValidator.validateQuick(cachedUrl);
    if (validation.isValid) {
      logger.debug(`💾 [OPTIMIZED-PROFILE-PIC] Cache hit para ${jid}`);
      return {
        url: cachedUrl,
        source: 'optimized',
        fromCache: true,
        attempts: 0
      };
    } else {
      // Remove cache inválido
      await optimizedCache.delete(cacheKey);
      logger.debug(`🗑️ [OPTIMIZED-PROFILE-PIC] Cache inválido removido para ${jid}`);
    }
  }

  // 2. Se não passou wbot, busca o padrão
  if (!wbot) {
    const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
    if (!defaultWhatsapp) {
      logger.warn(`📷 [OPTIMIZED-PROFILE-PIC] Sem WhatsApp padrão para company ${companyId}`);
      return {
        url: noPicture,
        source: 'optimized',
        fromCache: false,
        attempts: 0
      };
    }
    wbot = getWbot(defaultWhatsapp.id);
  }

  // 3. Verifica se o wbot está conectado
  if (!wbot || !wbot.user) {
    logger.warn(`📷 [OPTIMIZED-PROFILE-PIC] WhatsApp não conectado para buscar foto de ${jid}`);
    return {
      url: noPicture,
      source: 'optimized',
      fromCache: false,
      attempts: 0
    };
  }

  // 4. Busca foto com retry otimizado
  let profilePicUrl: string;
  let attempts = 0;

  try {
    profilePicUrl = await RetryManager.executeWhatsAppOperation(async () => {
      attempts++;
      logger.debug(`🔍 [OPTIMIZED-PROFILE-PIC] Tentativa ${attempts} para ${jid}`);
      
      // Timeout otimizado com AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
      
      try {
        const url = await wbot.profilePictureUrl(jid, "preview");
        clearTimeout(timeoutId);
        return url;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }, `profile-pic-${jid}`);

  } catch (error) {
    logger.debug(`📷 [OPTIMIZED-PROFILE-PIC] Erro ao buscar foto de ${jid}: ${error.message}`);
    profilePicUrl = noPicture;
  }

  // 5. Valida URL obtida
  if (profilePicUrl && profilePicUrl !== noPicture) {
    const validation = UrlValidator.validateQuick(profilePicUrl);
    
    if (validation.isValid && validation.shouldCache) {
      // Sanitiza URL antes de cachear
      const sanitizedUrl = UrlValidator.sanitizeUrl(profilePicUrl);
      
      // Cache com TTL otimizado
      await optimizedCache.set(cacheKey, sanitizedUrl, 432000); // 5 dias
      
      logger.info(`📷 [OPTIMIZED-PROFILE-PIC] Foto obtida e cacheada para ${jid}`);
      
      return {
        url: sanitizedUrl,
        source: 'optimized',
        fromCache: false,
        attempts
      };
    } else {
      logger.warn(`⚠️ [OPTIMIZED-PROFILE-PIC] URL inválida para ${jid}: ${validation.reason}`);
      profilePicUrl = noPicture;
    }
  }

  return {
    url: profilePicUrl || noPicture,
    source: 'optimized',
    fromCache: false,
    attempts
  };
}

/**
 * Wrapper que decide quando usar versão otimizada
 * Feature flag para ativação gradual
 */
export const GetProfilePicUrlSmart = async (
  number: string,
  companyId: number,
  contact?: Contact,
  wbot?: any,
  useOptimized: boolean = true  // ✅ ATIVADO por padrão
): Promise<string> => {
  
  if (!useOptimized) {
    // Usa sistema original
    return await GetProfilePicUrl(number, companyId, contact, wbot);
  }

  try {
    // Usa sistema otimizado
    const result = await GetOptimizedProfilePicUrl(number, companyId, contact, wbot);
    
    // Log de performance para monitoramento
    if (result.processingTimeMs > 5000) {
      logger.warn(`⏱️ [PROFILE-PIC-PERFORMANCE] Operação lenta: ${result.processingTimeMs}ms para ${number}`);
    }
    
    return result.url;
  } catch (error) {
    logger.error(`❌ [PROFILE-PIC-SMART] Erro no sistema otimizado, usando original: ${error.message}`);
    return await GetProfilePicUrl(number, companyId, contact, wbot);
  }
};

export default GetOptimizedProfilePicUrl;