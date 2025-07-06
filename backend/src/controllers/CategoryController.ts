import { Request, Response } from "express";
import CreateService from "../services/CategoryServices/CreateService";
import ListService from "../services/CategoryServices/ListService";
import UpdateService from "../services/CategoryServices/UpdateService";
import DeleteService from "../services/CategoryServices/DeleteService";
import AppError from "../errors/AppError";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { name, icon } = req.body;

  try {
    console.log('🔧 CategoryController.store - Dados recebidos:', { name, icon });
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const category = await CreateService({ name: name.trim(), icon });
    
    console.log('✅ Categoria criada:', category);
    return res.status(200).json(category);
  } catch (error) {
    console.error('❌ Erro no CategoryController.store:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  try {
    const categories = await ListService();
    console.log('📂 Categorias listadas:', categories.length);
    return res.json(categories);
  } catch (error) {
    console.error('❌ Erro ao listar categorias:', error);
    return res.status(500).json({ error: "Erro ao listar categorias" });
  }
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { name, icon } = req.body;

  try {
    console.log('🔧 CategoryController.update - Dados recebidos:', { id, name, icon });
    
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    
    if (icon !== undefined) {
      updateData.icon = icon;
    }

    const category = await UpdateService({ id, ...updateData });
    
    console.log('✅ Categoria atualizada:', category);
    return res.status(200).json(category);
  } catch (error) {
    console.error('❌ Erro ao atualizar categoria:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    await DeleteService(id);
    return res.status(200).json({ message: "Categoria deletada com sucesso" });
  } catch (error) {
    console.error('❌ Erro ao deletar categoria:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Erro ao deletar categoria" });
  }
}; 