import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import CreateStickerService from "../services/StickerService/CreateStickerService";
import DeleteStickerService from "../services/StickerService/DeleteStickerService";
import ListStickersService from "../services/StickerService/ListStickersService";
import UpdateStickerOrderService from "../services/StickerService/UpdateStickerOrderService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { id: userId, companyId } = req.user;

  const stickers = await ListStickersService({
    userId: Number(userId),
    companyId: Number(companyId)
  });

  return res.status(200).json(stickers);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    mediaUrl,
    mediaType,
    fileName,
    fileSize,
    order,
    isFavorite
  } = req.body;
  const { id: userId, companyId } = req.user;

  const sticker = await CreateStickerService({
    name,
    mediaUrl,
    mediaType,
    fileName,
    fileSize,
    userId: Number(userId),
    companyId: Number(companyId),
    order,
    isFavorite
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-sticker`, {
      action: "create",
      sticker
    });

  return res.status(200).json(sticker);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { stickerId } = req.params;
  const { newOrder } = req.body;
  const { id: userId, companyId } = req.user;

  const sticker = await UpdateStickerOrderService({
    stickerId: +stickerId,
    newOrder,
    userId: Number(userId),
    companyId: Number(companyId)
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-sticker`, {
      action: "update",
      sticker
    });

  return res.status(200).json(sticker);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { stickerId } = req.params;
  const { id: userId, companyId } = req.user;

  await DeleteStickerService({
    id: stickerId,
    userId: Number(userId),
    companyId: Number(companyId)
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-sticker`, {
      action: "delete",
      stickerId: +stickerId
    });

  return res.status(200).send();
};
