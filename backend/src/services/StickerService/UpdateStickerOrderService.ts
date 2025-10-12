import AppError from "../../errors/AppError";
import Sticker from "../../models/Sticker";

interface Request {
  stickerId: number;
  newOrder: number;
  userId: number;
  companyId: number;
}

const UpdateStickerOrderService = async ({
  stickerId,
  newOrder,
  userId,
  companyId
}: Request): Promise<Sticker> => {
  const sticker = await Sticker.findOne({
    where: {
      id: stickerId,
      userId,
      companyId
    }
  });

  if (!sticker) {
    throw new AppError("ERR_STICKER_NOT_FOUND", 404);
  }

  await sticker.update({ order: newOrder });

  return sticker;
};

export default UpdateStickerOrderService;
