import { Op, WhereOptions, Order } from "sequelize";
import Task, { TaskStatus, TaskPriority } from "../../models/Task";
import User from "../../models/User";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";

interface ListTasksRequest {
  companyId: number;
  userId?: number;
  searchParam?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: number;
  createdById?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
  pageNumber?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
}

interface ListTasksResponse {
  tasks: Task[];
  count: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  stats?: {
    todo: number;
    inprogress: number;
    completed: number;
    overdue: number;
  };
}

const ListTasksService = async ({
  companyId,
  userId,
  searchParam = "",
  status,
  priority,
  assignedToId,
  createdById,
  dueDateFrom,
  dueDateTo,
  overdue,
  pageNumber = 1,
  sortBy = 'createdAt',
  sortOrder = 'DESC',
  limit = 20
}: ListTasksRequest): Promise<ListTasksResponse> => {
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
  if (status) {
    whereCondition.status = status;
  }

  if (priority) {
    whereCondition.priority = priority;
  }

  if (assignedToId) {
    whereCondition.assignedToId = assignedToId;
  }

  if (createdById) {
    whereCondition.createdById = createdById;
  }

  // Filtros de data
  if (dueDateFrom || dueDateTo) {
    const dateCondition: any = {};
    
    if (dueDateFrom) {
      dateCondition[Op.gte] = new Date(dueDateFrom);
    }
    
    if (dueDateTo) {
      dateCondition[Op.lte] = new Date(dueDateTo);
    }
    
    whereCondition.dueDate = dateCondition;
  }

  // Filtro de tarefas vencidas
  if (overdue === true) {
    whereCondition.dueDate = {
      [Op.and]: [
        { [Op.not]: null },
        { [Op.lt]: new Date() }
      ]
    };
    whereCondition.status = {
      [Op.ne]: TaskStatus.COMPLETED
    };
  }

  // Definir ordenação
  const orderOptions: Order = [];
  
  // Ordenar por data de vencimento se não for filtro específico
  if (!overdue && sortBy !== 'dueDate') {
    orderOptions.push(['dueDate', 'ASC']);
  }

  orderOptions.push([sortBy, sortOrder]);

  try {
    // Buscar tarefas
    const { rows: tasks, count } = await Task.findAndCountAll({
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
        }
      ],
      limit,
      offset,
      order: orderOptions,
      distinct: true
    });

    // Calcular estatísticas se solicitado (sem filtros específicos)
    let stats;
    if (!status && !assignedToId && !createdById) {
      const [todoCount, inProgressCount, completedCount] = await Promise.all([
        Task.count({
          where: { ...whereCondition, status: TaskStatus.TODO }
        }),
        Task.count({
          where: { ...whereCondition, status: TaskStatus.IN_PROGRESS }
        }),
        Task.count({
          where: { ...whereCondition, status: TaskStatus.COMPLETED }
        })
      ]);

      const overdueCount = await Task.count({
        where: {
          ...whereCondition,
          dueDate: {
            [Op.and]: [
              { [Op.not]: null },
              { [Op.lt]: new Date() }
            ]
          },
          status: {
            [Op.ne]: TaskStatus.COMPLETED
          }
        }
      });

      stats = {
        todo: todoCount,
        inprogress: inProgressCount,
        completed: completedCount,
        overdue: overdueCount
      };
    }

    const totalPages = Math.ceil(count / limit);
    const currentPage = Number(pageNumber);
    const hasMore = currentPage < totalPages;

    return {
      tasks,
      count,
      hasMore,
      currentPage,
      totalPages,
      stats
    };

  } catch (error: any) {
    console.error("ListTasksService Error:", error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("ERR_LISTING_TASKS", 500);
  }
};

export default ListTasksService;