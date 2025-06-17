import NodeCache from "node-cache";
import Contact from "../models/Contact";
import raceConditionLogger from "../utils/raceConditionLogger";

interface CachedContact {
  id: number;
  name: string;
  number: string;
  companyId: number;
  isGroup: boolean;
  remoteJid: string;
  whatsappId?: number;
  lastUpdated: number;
}

class ContactCache {
  private cache: NodeCache;
  private readonly TTL = 300; // 5 minutos
  private readonly MAX_KEYS = 5000; // Máximo de contatos em cache

  constructor() {
    this.cache = new NodeCache({
      stdTTL: this.TTL,
      maxKeys: this.MAX_KEYS,
      checkperiod: 60, // Verifica expiração a cada 60 segundos
      useClones: false
    });

    // Log estatísticas do cache periodicamente
    setInterval(() => {
      this.logCacheStats();
    }, 300000); // A cada 5 minutos
  }

  private getCacheKey(number: string, companyId: number): string {
    return `contact:${number}:${companyId}`;
  }

  private logCacheStats(): void {
    const stats = this.cache.getStats();
    if (stats.hits > 0 || stats.misses > 0) {
      const hitRate = ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2);
      console.info(`📊 Contact Cache Stats: ${stats.keys} keys, ${hitRate}% hit rate, ${stats.hits} hits, ${stats.misses} misses`);
    }
  }

  public async get(number: string, companyId: number): Promise<CachedContact | null> {
    const key = this.getCacheKey(number, companyId);
    const cached = this.cache.get<CachedContact>(key);
    
    if (cached) {
      // Verificar se o cache não está muito antigo (dupla verificação)
      const age = Date.now() - cached.lastUpdated;
      if (age < this.TTL * 1000) {
        return cached;
      } else {
        // Remove cache expirado
        this.cache.del(key);
      }
    }
    
    return null;
  }

  public set(contact: Contact): void {
    const key = this.getCacheKey(contact.number, contact.companyId);
    const cachedContact: CachedContact = {
      id: contact.id,
      name: contact.name,
      number: contact.number,
      companyId: contact.companyId,
      isGroup: contact.isGroup,
      remoteJid: contact.remoteJid,
      whatsappId: contact.whatsappId,
      lastUpdated: Date.now()
    };
    
    this.cache.set(key, cachedContact);
  }

  public invalidate(number: string, companyId: number): void {
    const key = this.getCacheKey(number, companyId);
    this.cache.del(key);
  }

  public invalidateByCompany(companyId: number): void {
    const keys = this.cache.keys();
    const companyKeys = keys.filter(key => key.includes(`:${companyId}`));
    
    companyKeys.forEach(key => {
      this.cache.del(key);
    });
    
    if (companyKeys.length > 0) {
      console.info(`🗑️ Invalidated ${companyKeys.length} contacts for company ${companyId}`);
    }
  }

  public async findOrFetch(number: string, companyId: number): Promise<Contact | null> {
    // Primeiro tenta o cache
    const cached = await this.get(number, companyId);
    if (cached) {
      // Converte cached para Contact-like object
      const contact = {
        id: cached.id,
        name: cached.name,
        number: cached.number,
        companyId: cached.companyId,
        isGroup: cached.isGroup,
        remoteJid: cached.remoteJid,
        whatsappId: cached.whatsappId
      } as Contact;
      
      return contact;
    }

    // Se não está em cache, busca no banco
    try {
      const contact = await Contact.findOne({
        where: { number, companyId }
      });

      if (contact) {
        // Adiciona ao cache
        this.set(contact);
      }

      return contact;
    } catch (error) {
      raceConditionLogger.logConstraintError(
        number,
        companyId,
        `Error fetching contact from database: ${error.message}`
      );
      return null;
    }
  }

  public exists(number: string, companyId: number): boolean {
    const key = this.getCacheKey(number, companyId);
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.flushAll();
    console.info("🧹 Contact cache cleared");
  }

  public getStats(): {
    keys: number;
    hits: number;
    misses: number;
    hitRate: string;
    memoryUsage: string;
  } {
    const stats = this.cache.getStats();
    const hitRate = stats.hits + stats.misses > 0 
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate,
      memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
    };
  }

  // Método para pré-carregar contatos mais utilizados
  public async preloadFrequentContacts(companyId: number, limit: number = 100): Promise<void> {
    try {
      const frequentContacts = await Contact.findAll({
        where: { companyId },
        limit,
        order: [['updatedAt', 'DESC']] // Contatos mais recentemente atualizados
      });

      frequentContacts.forEach(contact => {
        this.set(contact);
      });

      console.info(`📥 Preloaded ${frequentContacts.length} frequent contacts for company ${companyId}`);
    } catch (error) {
      console.error(`Error preloading contacts for company ${companyId}:`, error);
    }
  }

  // Método para limpar cache de contatos antigos
  public cleanupOldEntries(): void {
    const keys = this.cache.keys();
    let cleanedCount = 0;

    keys.forEach(key => {
      const cached = this.cache.get<CachedContact>(key);
      if (cached) {
        const age = Date.now() - cached.lastUpdated;
        // Remove entradas com mais de 10 minutos
        if (age > 600000) {
          this.cache.del(key);
          cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      console.info(`🧹 Cleaned ${cleanedCount} old contact cache entries`);
    }
  }
}

// Singleton instance
const contactCache = new ContactCache();

// Limpeza automática a cada 10 minutos
setInterval(() => {
  contactCache.cleanupOldEntries();
}, 600000);

export default contactCache; 