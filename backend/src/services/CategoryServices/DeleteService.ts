import Category from "../../models/Category";
import AppError from "../../errors/AppError";

const DeleteService = async (id: string): Promise<void> => {
  const category = await Category.findByPk(id);

  if (!category) {
    throw new AppError("Categoria não encontrada", 404);
  }

  await category.destroy();
};

export default DeleteService; 