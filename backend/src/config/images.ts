/**
 * Configurações para download e manipulação de imagens de perfil
 */
export const IMAGE_CONFIG = {
  // Timeout para download de imagens (em ms)
  DOWNLOAD_TIMEOUT: 30000, // Aumentado para 30s
  
  // Tamanho máximo do arquivo (em bytes) - 10MB
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  // Extensões permitidas
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  
  // User Agent para requisições (mais compatível)
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  
  // URLs que devem ser ignoradas (não baixadas)
  PLACEHOLDER_PATTERNS: [
    '/nopicture.png',
    '/placeholder',
    '/default-avatar',
    '/no-image',
    'data:image/svg+xml' // SVG inline
  ],
  
  // Configurações de retry
  RETRY: {
    MAX_ATTEMPTS: 2,
    DELAY_MS: 1000
  }
};

/**
 * Verifica se uma URL é uma imagem placeholder
 */
export const isPlaceholderUrl = (url: string): boolean => {
  if (!url) return false;
  
  return IMAGE_CONFIG.PLACEHOLDER_PATTERNS.some(pattern => 
    url.toLowerCase().includes(pattern.toLowerCase())
  );
};

/**
 * Valida se uma URL é uma URL de imagem válida
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Gera um nome único para arquivo de imagem
 */
export const generateImageFilename = (extension: string = 'jpeg'): string => {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}.${extension}`;
}; 