import fs from 'fs';
import path from 'path';

interface ImageDownloadError {
  timestamp: string;
  url: string;
  contactId: string | number;
  companyId: number;
  error: {
    status?: number;
    message: string;
    code?: string;
  };
  attempt: number;
  maxAttempts: number;
}

interface ImageDownloadSuccess {
  timestamp: string;
  url: string;
  contactId: string | number;
  companyId: number;
  filename: string;
  attempt: number;
  fileSize?: number;
}

class ImageDownloadLogger {
  private logDir: string;
  private errorLogFile: string;
  private successLogFile: string;

  constructor() {
    this.logDir = path.resolve(__dirname, '..', '..', 'logs');
    this.errorLogFile = path.join(this.logDir, 'image_download_errors.log');
    this.successLogFile = path.join(this.logDir, 'image_download_success.log');
    
    // Garantir que o diretório existe
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatTimestamp(): string {
    return new Date().toLocaleString('pt-BR');
  }

  private writeToFile(filename: string, data: any): void {
    try {
      const logEntry = JSON.stringify(data, null, 2) + '\n---\n';
      fs.appendFileSync(filename, logEntry);
    } catch (error) {
      console.error('Erro ao escrever log de imagem:', error);
    }
  }

  logError(errorData: Omit<ImageDownloadError, 'timestamp'>): void {
    const entry: ImageDownloadError = {
      timestamp: this.formatTimestamp(),
      ...errorData
    };

    this.writeToFile(this.errorLogFile, entry);

    // Se é erro 502, também loggar no console para alertas
    if (errorData.error.status === 502) {
      console.error(`🚨 [IMAGE_DOWNLOAD_502] ${errorData.url} - Tentativa ${errorData.attempt}/${errorData.maxAttempts}`);
    }
  }

  logSuccess(successData: Omit<ImageDownloadSuccess, 'timestamp'>): void {
    const entry: ImageDownloadSuccess = {
      timestamp: this.formatTimestamp(),
      ...successData
    };

    this.writeToFile(this.successLogFile, entry);
  }

  logPlaceholderSkipped(url: string, contactId: string | number, companyId: number): void {
    const entry = {
      timestamp: this.formatTimestamp(),
      type: 'PLACEHOLDER_SKIPPED',
      url,
      contactId,
      companyId
    };

    this.writeToFile(this.successLogFile, entry);
  }

  // Método para obter estatísticas dos últimos erros
  getErrorStats(hours: number = 24): {
    total: number;
    by502: number;
    by403: number;
    by404: number;
    byTimeout: number;
    mostCommonUrls: string[];
  } {
    try {
      const hoursAgo = new Date(Date.now() - (hours * 60 * 60 * 1000));
      const logContent = fs.readFileSync(this.errorLogFile, 'utf8');
      const entries = logContent.split('---\n').filter(entry => entry.trim());
      
      const stats = {
        total: 0,
        by502: 0,
        by403: 0,
        by404: 0,
        byTimeout: 0,
        mostCommonUrls: [] as string[]
      };

      const urlCounts: { [key: string]: number } = {};

      for (const entry of entries) {
        try {
          const data = JSON.parse(entry.trim());
          const entryDate = new Date(data.timestamp.split(' ').reverse().join(' '));
          
          if (entryDate >= hoursAgo) {
            stats.total++;
            
            if (data.error.status === 502) stats.by502++;
            if (data.error.status === 403) stats.by403++;
            if (data.error.status === 404) stats.by404++;
            if (data.error.code === 'ECONNABORTED') stats.byTimeout++;
            
            // Contar URLs mais comuns
            const url = data.url;
            urlCounts[url] = (urlCounts[url] || 0) + 1;
          }
        } catch (parseError) {
          // Ignorar entradas malformadas
        }
      }

      // Obter as 5 URLs com mais erros
      stats.mostCommonUrls = Object.entries(urlCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([url]) => url);

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de imagem:', error);
      return {
        total: 0,
        by502: 0,
        by403: 0,
        by404: 0,
        byTimeout: 0,
        mostCommonUrls: []
      };
    }
  }
}

export default new ImageDownloadLogger(); 