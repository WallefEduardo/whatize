import { Router } from "express";
import * as TextCorrectionController from "../controllers/TextCorrectionController";
import isAuth from "../middleware/isAuth";

const textCorrectionRoutes = Router();

// POST /api/messages/correct-text
textCorrectionRoutes.post(
  "/messages/correct-text",
  isAuth,
  TextCorrectionController.correctText
);

export default textCorrectionRoutes;
