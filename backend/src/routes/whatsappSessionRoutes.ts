import { Router } from "express";
import isAuth from "../middleware/isAuth";

import WhatsAppSessionController from "../controllers/WhatsAppSessionController";

const whatsappSessionRoutes = Router();

whatsappSessionRoutes.post(
  "/whatsappsession/:whatsappId",
  isAuth,
  WhatsAppSessionController.store
);

whatsappSessionRoutes.put(
  "/whatsappsession/:whatsappId",
  isAuth,
  WhatsAppSessionController.update
);

whatsappSessionRoutes.delete(
  "/whatsappsession/:whatsappId",
  isAuth,
  WhatsAppSessionController.remove
);

// Nova rota para monitoramento
whatsappSessionRoutes.get(
  "/whatsappsession/stats",
  isAuth,
  WhatsAppSessionController.stats
);

// Nova rota para relatório de performance
whatsappSessionRoutes.get(
  "/whatsappsession/performance",
  isAuth,
  WhatsAppSessionController.performance
);

// Nova rota para reset de métricas
whatsappSessionRoutes.post(
  "/whatsappsession/reset-metrics",
  isAuth,
  WhatsAppSessionController.resetMetrics
);

export default whatsappSessionRoutes;
