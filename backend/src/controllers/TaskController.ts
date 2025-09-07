import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";

// Services
import CreateTaskService from "../services/TaskServices/CreateTaskService";
import ListTasksService from "../services/TaskServices/ListTasksService";
import ListCompletedTasksService from "../services/TaskServices/ListCompletedTasksService";
import ShowTaskService from "../services/TaskServices/ShowTaskService";
import UpdateTaskService from "../services/TaskServices/UpdateTaskService";
import DeleteTaskService from "../services/TaskServices/DeleteTaskService";
import CompleteTaskService from "../services/TaskServices/CompleteTaskService";
import RestoreTaskService from "../services/TaskServices/RestoreTaskService";

// Types
import { TaskStatus, TaskPriority } from "../models/Task";

// Schemas de validação
const createTaskSchema = Yup.object().shape({
  title: Yup.string()
    .required("Title is required")
    .min(1, "Title cannot be empty")
    .max(255, "Title is too long"),
  description: Yup.string()
    .nullable()
    .max(5000, "Description is too long"),
  status: Yup.string()
    .oneOf(Object.values(TaskStatus), "Invalid status")
    .default(TaskStatus.TODO),
  priority: Yup.string()
    .oneOf(Object.values(TaskPriority), "Invalid priority")
    .default(TaskPriority.MEDIUM),
  dueDate: Yup.date()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  assignedToId: Yup.number()
    .nullable()
    .integer("Invalid user ID")
    .min(1, "Invalid user ID")
    .transform((value, originalValue) => {
      return originalValue === "" || originalValue === 0 ? null : value;
    })
});

const updateTaskSchema = Yup.object().shape({
  title: Yup.string()
    .min(1, "Title cannot be empty")
    .max(255, "Title is too long"),
  description: Yup.string()
    .nullable()
    .max(5000, "Description is too long"),
  status: Yup.string()
    .oneOf(Object.values(TaskStatus), "Invalid status"),
  priority: Yup.string()
    .oneOf(Object.values(TaskPriority), "Invalid priority"),
  dueDate: Yup.date()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  assignedToId: Yup.number()
    .nullable()
    .integer("Invalid user ID")
    .min(1, "Invalid user ID")
    .transform((value, originalValue) => {
      return originalValue === "" || originalValue === 0 ? null : value;
    })
});

// Interfaces para query parameters
interface IndexQuery {
  searchParam?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  createdById?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: string;
  filter?: 'mytask' | 'working' | 'completed' | 'trash';
  pageNumber?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'ASC' | 'DESC';
  limit?: string;
}

// CREATE - Criar nova tarefa
export const store = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { companyId, id: userId } = req.user;
    
    // Validar dados de entrada
    const taskData = await createTaskSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    // Criar a tarefa
    const task = await CreateTaskService({
      ...taskData,
      status: taskData.status as TaskStatus,
      priority: taskData.priority as TaskPriority,
      createdById: Number(userId),
      companyId: Number(companyId)
    });

    // Emitir evento socket para atualizações em tempo real
    const io = getIO();
    io.to(`company-${companyId}`)
      .emit(`company-${companyId}-task-created`, {
        action: "create",
        task
      });

    return res.status(201).json(task);

  } catch (error: any) {
    if (error instanceof Yup.ValidationError) {
      throw new AppError(`Validation Error: ${error.message}`, 400);
    }
    
    throw error;
  }
};

// READ - Listar tarefas
export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  
  const {
    searchParam,
    status,
    priority,
    assignedToId,
    createdById,
    dueDateFrom,
    dueDateTo,
    overdue,
    filter,
    pageNumber = "1",
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    limit = "20"
  } = req.query as IndexQuery;

  // Interpretar filtros customizados
  let filteredStatus = status;
  let filteredAssignedToId = assignedToId ? Number(assignedToId) : undefined;
  let filteredCreatedById = createdById ? Number(createdById) : undefined;
  let filteredOverdue = overdue === "true";

  // Aplicar filtros baseados no parâmetro 'filter'
  if (filter) {
    switch (filter) {
      case 'mytask':
        // Minhas tarefas: atribuídas para mim
        filteredAssignedToId = Number(userId);
        break;
      case 'working':
        // Em andamento: status inprogress
        filteredStatus = TaskStatus.IN_PROGRESS;
        break;
      case 'completed':
        // Concluídas: status completed
        filteredStatus = TaskStatus.COMPLETED;
        break;
    }
  }

  const result = await ListTasksService({
    companyId: Number(companyId),
    userId: Number(userId),
    searchParam,
    status: filteredStatus,
    priority,
    assignedToId: filteredAssignedToId,
    createdById: filteredCreatedById,
    dueDateFrom,
    dueDateTo,
    overdue: filteredOverdue,
    pageNumber: Number(pageNumber),
    sortBy,
    sortOrder,
    limit: Number(limit)
  });

  return res.json(result);
};

// READ - Mostrar tarefa específica
export const show = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { taskId, uuid } = req.params;

  const task = await ShowTaskService({
    taskId: taskId ? Number(taskId) : undefined,
    uuid,
    companyId: Number(companyId),
    userId: Number(userId)
  });

  return res.json(task);
};

// UPDATE - Atualizar tarefa
export const update = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { companyId, id: userId } = req.user;
    const { taskId } = req.params;

    // Validar dados de entrada
    const taskData = await updateTaskSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    // Atualizar a tarefa
    const task = await UpdateTaskService({
      taskId: Number(taskId),
      ...taskData,
      status: taskData.status ? taskData.status as TaskStatus : undefined,
      priority: taskData.priority ? taskData.priority as TaskPriority : undefined,
      companyId: Number(companyId),
      userId: Number(userId)
    });

    // Emitir evento socket
    const io = getIO();
    io.to(`company-${companyId}`)
      .emit(`company-${companyId}-task-updated`, {
        action: "update",
        task
      });

    return res.json(task);

  } catch (error: any) {
    if (error instanceof Yup.ValidationError) {
      throw new AppError(`Validation Error: ${error.message}`, 400);
    }
    
    throw error;
  }
};

// DELETE - Excluir tarefa
export const destroy = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { taskId } = req.params;

  const result = await DeleteTaskService({
    taskId: Number(taskId),
    companyId: Number(companyId),
    userId: Number(userId)
  });

  // Emitir evento socket
  const io = getIO();
  io.to(`company-${companyId}`)
    .emit(`company-${companyId}-task-deleted`, {
      action: "delete",
      taskId: Number(taskId),
      deletedTask: result.deletedTask
    });

  return res.json(result);
};

// Endpoints adicionais para facilitar o frontend

// Obter estatísticas das tarefas
export const stats = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  
  console.log('📊 Endpoint /tasks/stats chamado para companyId:', companyId);
  
  const result = await ListTasksService({
    companyId: Number(companyId),
    userId: Number(userId),
    limit: 1 // Mínimo para calcular stats, mas não retornar muitas tarefas
  });

  console.log('📊 Stats retornadas:', result.stats);

  return res.json({
    stats: result.stats
  });
};

// Obter tarefas do usuário logado
export const myTasks = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { pageNumber = "1", limit = "20" } = req.query as IndexQuery;

  const result = await ListTasksService({
    companyId: Number(companyId),
    userId: Number(userId),
    assignedToId: Number(userId),
    pageNumber: Number(pageNumber),
    limit: Number(limit)
  });

  return res.json(result);
};

// Obter tarefas vencidas
export const overdueTasks = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { pageNumber = "1", limit = "20" } = req.query as IndexQuery;

  const result = await ListTasksService({
    companyId: Number(companyId),
    userId: Number(userId),
    overdue: true,
    pageNumber: Number(pageNumber),
    limit: Number(limit)
  });

  return res.json(result);
};

// COMPLETE - Concluir tarefa (move para CompletedTasks)
export const complete = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { taskId } = req.params;

  const result = await CompleteTaskService({
    taskId: Number(taskId),
    completedById: Number(userId),
    companyId: Number(companyId)
  });

  return res.json(result);
};

// RESTORE - Restaurar tarefa completada (Admin only)
export const restore = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { completedTaskId } = req.params;

  const result = await RestoreTaskService({
    completedTaskId: Number(completedTaskId),
    userId: Number(userId),
    companyId: Number(companyId)
  });

  return res.json(result);
};

// LIST COMPLETED - Listar tarefas concluídas
export const listCompleted = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  
  const {
    searchParam,
    priority,
    assignedToId,
    createdById,
    completedById,
    completedDateFrom,
    completedDateTo,
    pageNumber = "1",
    sortBy = 'completedAt',
    sortOrder = 'DESC',
    limit = "20"
  } = req.query as any;

  const result = await ListCompletedTasksService({
    companyId: Number(companyId),
    userId: Number(userId),
    searchParam,
    priority,
    assignedToId: assignedToId ? Number(assignedToId) : undefined,
    createdById: createdById ? Number(createdById) : undefined,
    completedById: completedById ? Number(completedById) : undefined,
    completedDateFrom,
    completedDateTo,
    pageNumber: Number(pageNumber),
    sortBy,
    sortOrder,
    limit: Number(limit)
  });

  return res.json(result);
};