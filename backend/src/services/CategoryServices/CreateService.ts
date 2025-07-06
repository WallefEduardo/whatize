import Category from "../../models/Category";
import AppError from "../../errors/AppError";

interface Request {
  name: string;
  icon?: string;
}

const CreateService = async ({ name, icon }: Request): Promise<Category> => {
  if (!name || !name.trim()) {
    throw new AppError("Nome da categoria é obrigatório", 400);
  }

  // Verificar se categoria já existe
  const existingCategory = await Category.findOne({
    where: { name: name.trim() }
  });

  if (existingCategory) {
    throw new AppError("Categoria já existe", 400);
  }

  const category = await Category.create({
    name: name.trim(),
    icon: icon || null
  });

  return category;
};

export default CreateService; 