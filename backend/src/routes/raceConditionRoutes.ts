import express from "express";
import * as RaceConditionController from "../controllers/RaceConditionController";
import isAuth from "../middleware/isAuth";
import { debug } from "../utils/debugLogger";

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
raceConditionRoutes.get("/stats", (req, res, next) => {
  debug("📊 Rota /race-conditions/stats acessada");
  debug("📊 Headers:", req.headers);
  next();
}, RaceConditionController.getStats);

// Rota para limpar cache
raceConditionRoutes.delete("/cache/:companyId?", isAuth, RaceConditionController.clearCache);

// Rota para limpar logs antigos
raceConditionRoutes.delete("/logs", isAuth, RaceConditionController.cleanLogs);

// Rota para pré-carregar cache
raceConditionRoutes.post("/cache/preload/:companyId", isAuth, RaceConditionController.preloadCache);

export default raceConditionRoutes; 