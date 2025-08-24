import User from "../../models/User";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";

interface Request {
  userId: string;
  kanbanSelectedFunnel?: number | null;
  kanbanSelectedTags?: number[] | null;
  kanbanSelectedUsers?: number[] | null;
  kanbanCollapsedColumns?: string[] | null;
  kanbanColumnOrder?: string[] | null;
  companyId: number;
}

const UpdateKanbanFiltersService = async ({
  userId,
  kanbanSelectedFunnel,
  kanbanSelectedTags,
  kanbanSelectedUsers,
  kanbanCollapsedColumns,
  kanbanColumnOrder,
  companyId
}: Request): Promise<User> => {
  const user = await User.findOne({
    where: {
      id: userId,
      companyId
    },
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage"]
      },
      {
        model: Company,
        as: "company",
        attributes: ["id", "name"]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      }
    ]
  });

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const updateData: any = {};
  
  if (kanbanSelectedFunnel !== undefined) {
    updateData.kanbanSelectedFunnel = kanbanSelectedFunnel;
  }
  
  if (kanbanSelectedTags !== undefined) {
    updateData.kanbanSelectedTags = kanbanSelectedTags;
  }
  
  if (kanbanSelectedUsers !== undefined) {
    updateData.kanbanSelectedUsers = kanbanSelectedUsers;
  }
  
  if (kanbanCollapsedColumns !== undefined) {
    updateData.kanbanCollapsedColumns = kanbanCollapsedColumns;
  }
  
  if (kanbanColumnOrder !== undefined) {
    updateData.kanbanColumnOrder = kanbanColumnOrder;
  }

  await user.update(updateData);

  // Retornar o usuário atualizado com todas as relações
  const updatedUser = await User.findOne({
    where: {
      id: userId,
      companyId
    },
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage"]
      },
      {
        model: Company,
        as: "company",
        attributes: ["id", "name"]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      }
    ]
  });

  return updatedUser!;
};

export default UpdateKanbanFiltersService; 