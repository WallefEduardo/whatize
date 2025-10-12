import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as StickerController from "../controllers/StickerController";

const stickerRoutes = Router();

stickerRoutes.get("/stickers", isAuth, StickerController.index);

stickerRoutes.post("/stickers", isAuth, StickerController.store);

stickerRoutes.put("/stickers/:stickerId", isAuth, StickerController.update);

stickerRoutes.delete("/stickers/:stickerId", isAuth, StickerController.remove);

export default stickerRoutes;
