import logger from "./logger";

interface UrlValidationResult {
  isValid: boolean;
  url: string | null;
  reason?: string;
  shouldCache: boolean;
  contentType?: string;
  contentSize?: number;
}

class UrlValidator {
  private static readonly WHATSAPP_DOMAINS = [
    'pps.whatsapp.net',
    'mmg-fna.whatsapp.net', 
    'mmg.whatsapp.net'
  ];

  private static readonly VALID_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif'
  ];

  private static readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MIN_IMAGE_SIZE = 100; // 100 bytes

  /**
   * Valida URL de forma rápida (só estrutura)
   */
  static validateQuick(url: string): UrlValidationResult {
    try {
      if (!url || typeof url !== 'string') {
        return {
          isValid: false,
          url: null,
          reason: 'URL vazia ou inválida',
          shouldCache: false
        };
      }

      // Checa se é placeholder
      if (this.isPlaceholderUrl(url)) {
        return {
          isValid: true,
          url: url,
          reason: 'Placeholder válido',
          shouldCache: false // Não cacheia placeholders
        };
      }

      const parsed = new URL(url);

      // Valida protocolo
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return {
          isValid: false,
          url: null,
          reason: 'Protocolo inválido',
          shouldCache: false
        };
      }

      // Valida domínios WhatsApp
      if (!this.isWhatsAppDomain(parsed.hostname)) {
        return {
          isValid: false,
          url: null,
          reason: 'Domínio não é do WhatsApp',
          shouldCache: false
        };
      }

      // Valida extensão se presente
      const hasValidExtension = this.VALID_EXTENSIONS.some(ext => 
        parsed.pathname.toLowerCase().includes(ext)
      );

      return {
        isValid: true,
        url: url,
        reason: 'URL estruturalmente válida',
        shouldCache: hasValidExtension // Só cacheia se tem extensão conhecida
      };
    } catch (error) {
      logger.debug(`[URL-VALIDATOR] Erro ao validar URL ${url}: ${error.message}`);
      return {
        isValid: false,
        url: null,
        reason: `Erro de parsing: ${error.message}`,
        shouldCache: false
      };
    }
  }

  /**
   * Valida URL com HEAD request (mais completa, mas mais lenta)
   */
  static async validateDeep(url: string): Promise<UrlValidationResult> {
    const quickResult = this.validateQuick(url);
    
    if (!quickResult.isValid || !quickResult.shouldCache) {
      return quickResult;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'WhatsApp/2.21.15'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          isValid: false,
          url: null,
          reason: `HTTP ${response.status}: ${response.statusText}`,
          shouldCache: false
        };
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      const contentSize = contentLength ? parseInt(contentLength, 10) : 0;

      // Valida content-type
      if (!this.isValidImageContentType(contentType)) {
        return {
          isValid: false,
          url: null,
          reason: `Content-Type inválido: ${contentType}`,
          shouldCache: false
        };
      }

      // Valida tamanho
      if (contentSize > 0) {
        if (contentSize < this.MIN_IMAGE_SIZE || contentSize > this.MAX_IMAGE_SIZE) {
          return {
            isValid: false,
            url: null,
            reason: `Tamanho inválido: ${contentSize} bytes`,
            shouldCache: false
          };
        }
      }

      return {
        isValid: true,
        url: url,
        reason: 'URL válida após verificação completa',
        shouldCache: true,
        contentType,
        contentSize
      };
    } catch (error) {
      logger.debug(`[URL-VALIDATOR] Erro na validação deep de ${url}: ${error.message}`);
      
      // Se erro de rede, assume válido (deixa o download tentar)
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return {
          ...quickResult,
          reason: 'Timeout na validação - assumindo válido'
        };
      }

      return {
        isValid: false,
        url: null,
        reason: `Erro na verificação: ${error.message}`,
        shouldCache: false
      };
    }
  }

  /**
   * Verifica se é URL de placeholder
   */
  private static isPlaceholderUrl(url: string): boolean {
    const placeholders = [
      'nopicture.png',
      'default-avatar',
      'placeholder',
      'no-image',
      '/public/nopicture'
    ];

    return placeholders.some(placeholder => 
      url.toLowerCase().includes(placeholder.toLowerCase())
    );
  }

  /**
   * Verifica se domínio é do WhatsApp
   */
  private static isWhatsAppDomain(hostname: string): boolean {
    return this.WHATSAPP_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  }

  /**
   * Verifica se content-type é de imagem válida
   */
  private static isValidImageContentType(contentType: string): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];

    return validTypes.some(type => 
      contentType.toLowerCase().includes(type)
    );
  }

  /**
   * Sanitiza URL removendo parâmetros desnecessários
   */
  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Remove parâmetros de tracking comuns
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
      paramsToRemove.forEach(param => {
        parsed.searchParams.delete(param);
      });

      return parsed.toString();
    } catch (error) {
      logger.debug(`[URL-VALIDATOR] Erro ao sanitizar URL ${url}: ${error.message}`);
      return url; // Retorna original se erro
    }
  }

  /**
   * Gera chave de cache baseada na URL
   */
  static generateCacheKey(url: string, companyId: number): string {
    const sanitized = this.sanitizeUrl(url);
    const hash = Buffer.from(sanitized).toString('base64').slice(0, 16);
    return `profilepic:${companyId}:${hash}`;
  }
}

export default UrlValidator;