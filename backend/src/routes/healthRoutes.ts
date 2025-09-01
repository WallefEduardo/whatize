import express from "express";
import { profilePicHealth, resetStats, performanceMetrics } from "../controllers/HealthController";

const healthRoutes = express.Router();

// Health check específico para sistema de fotos
healthRoutes.get("/profile-pic", profilePicHealth);

// Métricas detalhadas de performance
healthRoutes.get("/profile-pic/metrics", performanceMetrics);

// Reset de estatísticas (apenas para debugging/desenvolvimento)
healthRoutes.post("/profile-pic/reset", resetStats);

export default healthRoutes;