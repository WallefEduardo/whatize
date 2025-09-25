/**
 * Utilitários para manipulação de URLs de mídia
 */
import { getBackendUrl } from '../../../config';

/**
 * Sanitiza URLs de mídia que vêm malformadas do backend
 * Remove portas duplicadas que tornam a URL inválida
 */
export const sanitizeMediaUrl = (url) => {
  if (!url) return url;

  try {
    const backendUrl = getBackendUrl();
    if (!backendUrl) return url;

    // Extrair a porta da URL do backend (ex: http://localhost:4000 -> 4000)
    const backendUrlObj = new URL(backendUrl);
    const backendPort = backendUrlObj.port;

    if (backendPort) {
      // Remover portas duplicadas como :4000:443
      const duplicatePattern = `:${backendPort}:443`;
      if (url.includes(duplicatePattern)) {
        return url.replace(':443', '');
      }
    }

    // Fallback para padrão comum :443
    if (url.includes(':443/public/')) {
      return url.replace(':443', '');
    }

    return url;
  } catch (error) {
    // Se houver erro na URL, retornar original
    console.warn('Erro ao sanitizar URL de mídia:', error);
    return url;
  }
};