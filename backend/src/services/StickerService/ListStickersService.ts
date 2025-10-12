import Sticker from "../../models/Sticker";
import User from "../../models/User";

interface Request {
  userId: number;
  companyId: number;
}

const ListStickersService = async ({ userId, companyId }: Request): Promise<Sticker[]> => {
  const stickers = await Sticker.findAll({
    where: {
      userId,
      companyId,
      isFavorite: true
    },
    order: [["order", "ASC"], ["createdAt", "ASC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name"]
      }
    ]
  });

  return stickers;
};

export default ListStickersService;
