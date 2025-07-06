import { Sequelize, Op } from "sequelize";
import Help from "../../models/Help";
import Category from "../../models/Category";

interface CategoryData {
  category: string;
  categoryIcon: string;
  count: number;
}

interface Response {
  categories: CategoryData[];
}

const GetCategoriesService = async (): Promise<Response> => {
  try {
    console.log('🔍 GetCategoriesService: Iniciando busca de categorias...');
    
    // Buscar todas as categorias
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    console.log('📂 Categorias encontradas:', categories.length);

    // Para cada categoria, contar os helps
    const categoriesWithCount = await Promise.all(
      categories.map(async (category: any) => {
        try {
          // Contar helps para esta categoria
          const helpCount = await Help.count({
            where: {
              category: category.name
            }
          });

          return {
            category: category.name,
            categoryIcon: category.icon || 'Help', // Ícone padrão se não tiver
            count: helpCount
          };
        } catch (error) {
          console.error(`❌ Erro ao contar helps para categoria ${category.name}:`, error);
          // Se der erro, retorna com count 0
          return {
            category: category.name,
            categoryIcon: category.icon || 'Help',
            count: 0
          };
        }
      })
    );

    console.log('✅ Categorias formatadas:', categoriesWithCount);

    return {
      categories: categoriesWithCount
    };
  } catch (error) {
    console.error('❌ Erro no GetCategoriesService:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Fallback: retornar apenas categorias sem contagem
    try {
      const categories = await Category.findAll({
        order: [['name', 'ASC']]
      });

      const categoriesData = categories.map((category: any) => ({
        category: category.name,
        categoryIcon: category.icon || 'Help',
        count: 0
      }));

      console.log('🔄 Fallback - Categorias sem contagem:', categoriesData);
      return { categories: categoriesData };
    } catch (fallbackError) {
      console.error('❌ Erro no fallback:', fallbackError);
      throw error;
    }
  }
};

export default GetCategoriesService; 