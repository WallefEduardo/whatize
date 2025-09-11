import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";

import * as MessageController from "../controllers/MessageController";

const messageRoutes = Router();

const upload = multer(uploadConfig);

messageRoutes.get("/messages/:ticketId", isAuth, MessageController.index);
// Middleware de debug para rastrear requisições
messageRoutes.use("/messages/:ticketId", (req, res, next) => {
  if (req.method === 'POST') {
    console.log('🔥 [ROUTE-DEBUG] POST /messages/:ticketId INTERCEPTADO:', {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      contentType: req.headers['content-type']
    });
  }
  next();
});

messageRoutes.post("/messages/:ticketId", isAuth, upload.array("medias"), MessageController.store);
// messageRoutes.post("/forwardmessage",isAuth,MessageController.forwardmessage);
messageRoutes.delete("/messages/:messageId", isAuth, MessageController.remove);
messageRoutes.post("/messages/edit/:messageId", isAuth, MessageController.edit);

messageRoutes.get("/messages-allMe", isAuth, MessageController.allMe);
// Nova rota para transcrição
messageRoutes.get("/messages/transcribeAudio/:fileName", isAuth, MessageController.transcribeAudioMessage);
// Rota para adicionar uma reação a uma mensagem
messageRoutes.post('/messages/:messageId/reactions', isAuth, MessageController.addReaction);
messageRoutes.post('/message/forward', isAuth, MessageController.forwardMessage)

export default messageRoutes;
