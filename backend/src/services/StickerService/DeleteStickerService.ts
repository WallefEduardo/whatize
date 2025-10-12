import AppError from "../../errors/AppError";
import Sticker from "../../models/Sticker";

interface Request {
  id: string | number;
  userId: number;
  companyId: number;
}

const DeleteStickerService = async ({ id, userId, companyId }: Request): Promise<void> => {
  const sticker = await Sticker.findOne({
    where: {
      id,
      userId,
      companyId
    }
  });

  if (!sticker) {
    throw new AppError("ERR_STICKER_NOT_FOUND", 404);
  }

  await sticker.destroy();
};

export default DeleteStickerService;
