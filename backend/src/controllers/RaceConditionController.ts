import { Request, Response } from "express";
import raceConditionLogger from "../utils/raceConditionLogger";
import contactCache from "../libs/contactCache";

export const getStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    // LOGS PARA DEBUG - Rastreando requisições
    console.log("🔍 [DEBUG] RaceConditionController.getStats chamado");
    console.log("🔍 [DEBUG] Headers da requisição:", {
      authorization: req.headers.authorization ? "Token presente" : "Token ausente",
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      host: req.headers.host
    });
    console.log("🔍 [DEBUG] IP da requisição:", req.ip || req.connection.remoteAddress);
    console.log("🔍 [DEBUG] URL completa:", req.originalUrl);
    console.log("🔍 [DEBUG] Método HTTP:", req.method);
    
    const logStats = raceConditionLogger.getLogStats();
    const cacheStats = contactCache.getStats();
    
    const stats = {
      timestamp: new Date().toISOString(),
      raceConditions: {
        totalErrors: logStats.totalErrors,
        todayErrors: logStats.todayErrors,
        lastError: logStats.lastError
      },
      contactCache: {
        keys: cacheStats.keys,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate,
        memoryUsage: cacheStats.memoryUsage
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: {
          rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
        }
      }
    };

    console.log("✅ [DEBUG] Stats geradas com sucesso, retornando resposta");
    return res.json(stats);
  } catch (error) {
    console.error("❌ [DEBUG] Error getting race condition stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const clearCache = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.params;
    
    if (companyId && companyId !== 'all') {
      contactCache.invalidateByCompany(parseInt(companyId));
      return res.json({ message: `Cache cleared for company ${companyId}` });
    } else {
      contactCache.clear();
      return res.json({ message: "All cache cleared" });
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const cleanLogs = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { days } = req.query;
    const daysToKeep = days ? parseInt(days as string) : 7;
    
    raceConditionLogger.cleanOldLogs(daysToKeep);
    
    return res.json({ 
      message: `Logs cleaned, keeping last ${daysToKeep} days` 
    });
  } catch (error) {
    console.error("Error cleaning logs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const preloadCache = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.params;
    const { limit } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }
    
    const limitNumber = limit ? parseInt(limit as string) : 100;
    
    await contactCache.preloadFrequentContacts(parseInt(companyId), limitNumber);
    
    return res.json({ 
      message: `Cache preloaded for company ${companyId} with ${limitNumber} contacts` 
    });
  } catch (error) {
    console.error("Error preloading cache:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}; 