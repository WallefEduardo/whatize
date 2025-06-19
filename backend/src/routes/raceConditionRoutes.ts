import express from "express";
import * as RaceConditionController from "../controllers/RaceConditionController";
import isAuth from "../middleware/isAuth";
import { debug } from "../utils/debugLogger";
import raceConditionLogger from "../utils/raceConditionLogger";
import contactCache from "../libs/contactCache";
import imageDownloadLogger from "../utils/imageDownloadLogger";

const raceConditionRoutes = express.Router();

// Logs condicionais - só aparecem em desenvolvimento
debug("📋 Registrando rotas de race-conditions");

// ROTA DE TESTE SIMPLES
raceConditionRoutes.get("/test", (req, res) => {
  debug("🧪 Rota de teste acessada sem problemas");
  res.json({ message: "Rota de teste funcionando", timestamp: new Date().toISOString() });
});

// Rota para obter estatísticas do sistema 
// SEM AUTENTICAÇÃO para permitir monitoramento automático
raceConditionRoutes.get("/stats", async (req, res) => {
  try {
    console.log("📊 Endpoint /race-conditions/stats chamado");
    
    const raceStats = raceConditionLogger.getLogStats();
    console.log("📊 Race stats:", raceStats);
    
    const cacheStats = contactCache.getStats();
    console.log("📊 Cache stats:", cacheStats);
    
    const imageStats = imageDownloadLogger.getErrorStats(24);
    console.log("📊 Image stats:", imageStats);

    const response = {
      success: true,
      data: {
        raceConditions: {
          todayErrors: raceStats.todayErrors || 0,
          totalErrors: raceStats.totalErrors || 0,
          lastError: raceStats.lastError || null
        },
        contactCache: {
          hits: cacheStats.hits || 0,
          misses: cacheStats.misses || 0,
          hitRate: cacheStats.hitRate || "0%",
          memoryUsage: cacheStats.memoryUsage || "0 MB",
          keys: cacheStats.keys || 0
        },
        imageDownload: {
          totalErrors: imageStats.total || 0,
          errors502: imageStats.by502 || 0,
          errors403: imageStats.by403 || 0,
          errors404: imageStats.by404 || 0,
          timeouts: imageStats.byTimeout || 0,
          problemUrls: imageStats.mostCommonUrls ? imageStats.mostCommonUrls.slice(0, 3) : []
        },
        system: {
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      }
    };

    console.log("📊 Response enviada:", JSON.stringify(response, null, 2));
    return res.json(response);
    
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Rota para limpar cache
raceConditionRoutes.delete("/cache/:companyId?", isAuth, RaceConditionController.clearCache);

// Rota para limpar logs antigos
raceConditionRoutes.delete("/logs", isAuth, RaceConditionController.cleanLogs);

// Rota para pré-carregar cache
raceConditionRoutes.post("/cache/preload/:companyId", isAuth, RaceConditionController.preloadCache);

export default raceConditionRoutes; 