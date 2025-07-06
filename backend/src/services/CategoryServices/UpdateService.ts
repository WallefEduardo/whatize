import Category from "../../models/Category";
import AppError from "../../errors/AppError";

interface Request {
  id: string;
  name?: string;
  icon?: string;
}

const UpdateService = async ({ id, name, icon }: Request): Promise<Category> => {
  const category = await Category.findByPk(id);

  if (!category) {
    throw new AppError("Categoria não encontrada", 404);
  }

  const updateData: any = {};
  
  if (name !== undefined) {
    updateData.name = name;
  }
  
  if (icon !== undefined) {
    updateData.icon = icon;
  }

  await category.update(updateData);
  await category.reload();

  return category;
};

export default UpdateService; 