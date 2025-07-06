import Category from "../../models/Category";

const ListService = async (): Promise<Category[]> => {
  const categories = await Category.findAll({
    order: [["name", "ASC"]]
  });

  return categories;
};

export default ListService; 