import { Router } from "express";
import * as WebHooksController from "../controllers/WebHookController";
import { 
  facebookWebhookLimiter, 
  webhookLogger, 
  validateFacebookHeaders 
} from "../middlewares/facebookRateLimit";

const webHooksRoutes = Router();

// Aplicar middleware de logging para todas as rotas de webhook
webHooksRoutes.use(webhookLogger);

// Rota GET para verificação do webhook (sem rate limiting agressivo)
webHooksRoutes.get("/", WebHooksController.index);

// Rota POST para receber webhooks com segurança completa
webHooksRoutes.post("/", 
  facebookWebhookLimiter,        // Rate limiting
  validateFacebookHeaders,       // Validação de headers
  WebHooksController.webHook     // Controller principal
);

export default webHooksRoutes;
