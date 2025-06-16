import { Request, Response } from "express";
import UserKanbanColumnOrder from "../models/UserKanbanColumnOrder";
import AppError from "../errors/AppError";

interface ColumnOrderData {
  columnId: string;
  columnType: 'default' | 'tag';
  position: number;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;

  try {
    const columnOrders = await UserKanbanColumnOrder.findAll({
      where: {
        userId: parseInt(userId),
        companyId
      },
      order: [['position', 'ASC']]
    });

    return res.json(columnOrders);
  } catch (error) {
    throw new AppError("Erro ao buscar ordem das colunas", 500);
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;
  const { columnOrders }: { columnOrders: ColumnOrderData[] } = req.body;

  try {
    // Remove ordem existente do usuário
    await UserKanbanColumnOrder.destroy({
      where: {
        userId: parseInt(userId),
        companyId
      }
    });

    // Cria nova ordem
    const newColumnOrders = columnOrders.map(order => ({
      userId: parseInt(userId),
      companyId,
      columnId: order.columnId,
      columnType: order.columnType,
      position: order.position
    }));

    const createdOrders = await UserKanbanColumnOrder.bulkCreate(newColumnOrders);

    return res.status(201).json(createdOrders);
  } catch (error) {
    throw new AppError("Erro ao salvar ordem das colunas", 500);
  }
};

export const destroy = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;

  try {
    await UserKanbanColumnOrder.destroy({
      where: {
        userId: parseInt(userId),
        companyId
      }
    });

    return res.status(200).json({ message: "Ordem das colunas resetada com sucesso" });
  } catch (error) {
    throw new AppError("Erro ao resetar ordem das colunas", 500);
  }
}; 