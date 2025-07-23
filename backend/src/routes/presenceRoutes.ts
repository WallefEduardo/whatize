import express from "express";
import * as PresenceController from "../controllers/PresenceController";
import isAuth from "../middleware/isAuth";

const presenceRoutes = express.Router();

// Subscrever ao presence de um contato
presenceRoutes.post("/subscribe", isAuth, PresenceController.subscribePresence);

// Obter presence atual de um contato
presenceRoutes.get("/:contactNumber", isAuth, PresenceController.getPresence);

// Enviar presence update (quando usuário está digitando)
presenceRoutes.post("/update", isAuth, PresenceController.sendPresenceUpdate);

// Desinscrever do presence de um contato
presenceRoutes.post("/unsubscribe", isAuth, PresenceController.unsubscribePresence);

export default presenceRoutes; 