import express from "express";
import isAuth from "../middleware/isAuth";

import * as SubscriptionController from "../controllers/SubscriptionController";

const subscriptionRoutes = express.Router();

subscriptionRoutes.post("/subscription",isAuth,SubscriptionController.createSubscription);

subscriptionRoutes.post("/subscription/create/webhook",SubscriptionController.createWebhook);
subscriptionRoutes.delete("/subscription/create/webhook",isAuth,SubscriptionController.deleteWebhook);
subscriptionRoutes.post("/subscription/webhook/:type?", SubscriptionController.webhook);
subscriptionRoutes.post("/subscription/return/:type?",SubscriptionController.webhook);
subscriptionRoutes.post("/subscription/return/02261dcb-ad4d-425f-9968-fe5b406f3030/pix",SubscriptionController.webhook);

// Nova rota para configurar o webhook automaticamente
subscriptionRoutes.post("/subscription/configure-webhook", isAuth, SubscriptionController.configureWebhook);

export default subscriptionRoutes;
