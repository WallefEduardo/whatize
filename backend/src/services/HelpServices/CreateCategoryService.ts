interface CategoryData {
  name: string;
  icon?: string;
}

interface Request {
  categoryData: CategoryData;
}

const CreateCategoryService = async ({ categoryData }: Request): Promise<{ success: boolean; message: string }> => {
  const { name, icon } = categoryData;

  if (!name || !name.trim()) {
    throw new Error("Nome da categoria é obrigatório");
  }

  try {
    // Por enquanto, vamos apenas retornar sucesso
    // Em uma implementação completa, você salvaria a categoria em uma tabela separada
    // ou manteria uma lista de categorias válidas
    
    return {
      success: true,
      message: "Categoria criada com sucesso"
    };
  } catch (error) {
    throw new Error("Erro ao criar categoria");
  }
};

export default CreateCategoryService; 