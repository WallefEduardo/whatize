import AppError from "../../errors/AppError";
import Task, { TaskStatus, TaskPriority } from "../../models/Task";
import User from "../../models/User";
import Company from "../../models/Company";
import { Op } from "sequelize";

interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date;
  assignedToId?: number;
  createdById: number;
  companyId: number;
}

const CreateTaskService = async ({
  title,
  description,
  status = TaskStatus.TODO,
  priority = TaskPriority.MEDIUM,
  dueDate,
  assignedToId,
  createdById,
  companyId
}: CreateTaskRequest): Promise<Task> => {
  // Validações básicas
  if (!title || title.trim().length === 0) {
    throw new AppError("ERR_TASK_TITLE_REQUIRED", 400);
  }

  if (title.length > 255) {
    throw new AppError("ERR_TASK_TITLE_TOO_LONG", 400);
  }

  // Verificar se a empresa existe
  const company = await Company.findByPk(companyId);
  if (!company) {
    throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
  }

  // Verificar se o usuário criador existe e pertence à empresa
  const createdBy = await User.findOne({
    where: {
      id: createdById,
      companyId
    }
  });

  if (!createdBy) {
    throw new AppError("ERR_USER_NOT_FOUND_OR_NOT_AUTHORIZED", 404);
  }

  // Se há um responsável definido, verificar se existe e pertence à empresa
  if (assignedToId) {
    const assignedTo = await User.findOne({
      where: {
        id: assignedToId,
        companyId
      }
    });

    if (!assignedTo) {
      throw new AppError("ERR_ASSIGNED_USER_NOT_FOUND", 404);
    }
  }

  // Validar data de vencimento
  if (dueDate) {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      throw new AppError("ERR_INVALID_DUE_DATE", 400);
    }
  }

  // Validar status
  if (status && !Object.values(TaskStatus).includes(status)) {
    throw new AppError("ERR_INVALID_TASK_STATUS", 400);
  }

  // Validar prioridade
  if (priority && !Object.values(TaskPriority).includes(priority)) {
    throw new AppError("ERR_INVALID_TASK_PRIORITY", 400);
  }

  try {
    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || null,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedToId: assignedToId || null,
      createdById,
      companyId
    });

    // Retornar a tarefa com as associações
    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: "assignedTo",
          attributes: ["id", "name", "email"]
        },
        {
          model: User,
          as: "createdBy",
          attributes: ["id", "name", "email"]
        }
      ]
    });

    if (!createdTask) {
      throw new AppError("ERR_TASK_CREATION_FAILED", 500);
    }

    return createdTask;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    // Log do erro para debugging
    console.error("CreateTaskService Error:", error);
    
    // Tratar erros específicos do Sequelize
    if (error.name === "SequelizeValidationError") {
      const firstError = error.errors[0];
      throw new AppError(`ERR_VALIDATION: ${firstError.message}`, 400);
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new AppError("ERR_FOREIGN_KEY_CONSTRAINT", 400);
    }

    throw new AppError("ERR_CREATING_TASK", 500);
  }
};

export default CreateTaskService;