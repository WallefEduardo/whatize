import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as TagFunnelController from "../controllers/TagFunnelController";

const tagFunnelRoutes = Router();

// Rota para buscar tags com informações de funil para um ticket específico
tagFunnelRoutes.get("/tags-funnel/:ticketId", isAuth, TagFunnelController.getTagsWithFunnel);

export default tagFunnelRoutes; 