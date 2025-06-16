import express from "express";
import * as RaceConditionController from "../controllers/RaceConditionController";
import isAuth from "../middleware/isAuth";

const raceConditionRoutes = express.Router();



// Rota para obter estatísticas do sistema 
// Em desenvolvimento: sem auth | Em produção: com auth
const statsMiddleware = process.env.NODE_ENV === 'development' ? [] : [isAuth];
raceConditionRoutes.get("/stats", ...statsMiddleware, RaceConditionController.getStats);

// Rota para limpar cache
raceConditionRoutes.delete("/cache/:companyId?", isAuth, RaceConditionController.clearCache);

// Rota para limpar logs antigos
raceConditionRoutes.delete("/logs", isAuth, RaceConditionController.cleanLogs);

// Rota para pré-carregar cache
raceConditionRoutes.post("/cache/preload/:companyId", isAuth, RaceConditionController.preloadCache);

export default raceConditionRoutes; 