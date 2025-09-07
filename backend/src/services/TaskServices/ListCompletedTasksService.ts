import { Op, WhereOptions, Order } from "sequelize";
import CompletedTask from "../../models/CompletedTask";
import User from "../../models/User";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";

interface ListCompletedTasksRequest {
  companyId: number;
  userId?: number;
  searchParam?: string;
  priority?: string;
  assignedToId?: number;
  createdById?: number;
  completedById?: number;
  completedDateFrom?: string;
  completedDateTo?: string;
  pageNumber?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'completedAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
}

interface ListCompletedTasksResponse {
  tasks: CompletedTask[];
  count: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
}

const ListCompletedTasksService = async ({
  companyId,
  userId,
  searchParam = "",
  priority,
  assignedToId,
  createdById,
  completedById,
  completedDateFrom,
  completedDateTo,
  pageNumber = 1,
  sortBy = 'completedAt',
  sortOrder = 'DESC',
  limit = 20
}: ListCompletedTasksRequest): Promise<ListCompletedTasksResponse> => {
  // Validar empresa
  const company = await Company.findByPk(companyId);
  if (!company) {
    throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
  }

  // Se userId for fornecido, verificar se pertence à empresa
  if (userId) {
    const user = await User.findOne({
      where: { id: userId, companyId }
    });
    if (!user) {
      throw new AppError("ERR_USER_NOT_AUTHORIZED", 403);
    }
  }

  const offset = (pageNumber - 1) * limit;

  // Construir condições WHERE
  const whereCondition: WhereOptions = {
    companyId
  };

  // Filtro por texto (título ou descrição)
  if (searchParam) {
    (whereCondition as any)[Op.or] = [
      {
        title: {
          [Op.iLike]: `%${searchParam.trim()}%`
        }
      },
      {
        description: {
          [Op.iLike]: `%${searchParam.trim()}%`
        }
      }
    ];
  }

  // Filtros específicos
  if (priority) {
    whereCondition.priority = priority;
  }

  if (assignedToId) {
    whereCondition.assignedToId = assignedToId;
  }

  if (createdById) {
    whereCondition.createdById = createdById;
  }

  if (completedById) {
    whereCondition.completedById = completedById;
  }

  // Filtros de data de conclusão
  if (completedDateFrom || completedDateTo) {
    const dateCondition: any = {};
    
    if (completedDateFrom) {
      dateCondition[Op.gte] = new Date(completedDateFrom);
    }
    
    if (completedDateTo) {
      dateCondition[Op.lte] = new Date(completedDateTo);
    }
    
    whereCondition.completedAt = dateCondition;
  }

  // Definir ordenação
  const orderOptions: Order = [[sortBy, sortOrder]];

  try {
    // Buscar tarefas completadas
    const { rows: tasks, count } = await CompletedTask.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "assignedTo",
          attributes: ["id", "name", "email", "profileImage"]
        },
        {
          model: User,
          as: "createdBy",
          attributes: ["id", "name", "email", "profileImage"]
        },
        {
          model: User,
          as: "completedBy",
          attributes: ["id", "name", "email", "profileImage"]
        }
      ],
      limit,
      offset,
      order: orderOptions,
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);
    const currentPage = Number(pageNumber);
    const hasMore = currentPage < totalPages;

    console.log(`📋 ListCompletedTasksService: ${tasks.length} tarefas concluídas encontradas`);

    return {
      tasks,
      count,
      hasMore,
      currentPage,
      totalPages
    };

  } catch (error: any) {
    console.error("ListCompletedTasksService Error:", error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("ERR_LISTING_COMPLETED_TASKS", 500);
  }
};

export default ListCompletedTasksService;