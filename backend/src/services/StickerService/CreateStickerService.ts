import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Sticker from "../../models/Sticker";

interface StickerData {
  name?: string;
  mediaUrl: string;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  userId: number;
  companyId: number;
  order?: number;
  isFavorite?: boolean;
}

const CreateStickerService = async (stickerData: StickerData): Promise<Sticker> => {
  const { mediaUrl, userId, companyId } = stickerData;

  const stickerSchema = Yup.object().shape({
    mediaUrl: Yup.string().required("ERR_STICKER_INVALID_MEDIA_URL"),
    userId: Yup.number().required("ERR_STICKER_INVALID_USER_ID"),
    companyId: Yup.number().required("ERR_STICKER_INVALID_COMPANY_ID")
  });

  try {
    await stickerSchema.validate({ mediaUrl, userId, companyId });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  // Buscar o maior order atual do usuário para adicionar no final
  const maxOrder = await Sticker.max("order", {
    where: {
      userId,
      companyId
    }
  }) as number | null;

  const sticker = await Sticker.create({
    ...stickerData,
    order: stickerData.order !== undefined ? stickerData.order : ((maxOrder || 0) + 1),
    mediaType: stickerData.mediaType || "sticker",
    isFavorite: stickerData.isFavorite !== undefined ? stickerData.isFavorite : true
  });

  return sticker;
};

export default CreateStickerService;
