import AppError from "../../errors/AppError";
import Task, { TaskStatus, TaskPriority } from "../../models/Task";
import User from "../../models/User";
import { Op } from "sequelize";

interface UpdateTaskRequest {
  taskId: number;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
  assignedToId?: number | null;
  companyId: number;
  userId: number; // Usuario que está fazendo a atualização
}

const UpdateTaskService = async ({
  taskId,
  title,
  description,
  status,
  priority,
  dueDate,
  assignedToId,
  companyId,
  userId
}: UpdateTaskRequest): Promise<Task> => {
  // Validações básicas
  if (!taskId || taskId <= 0) {
    throw new AppError("ERR_INVALID_TASK_ID", 400);
  }

  // Buscar a tarefa existente
  const task = await Task.findOne({
    where: {
      id: taskId,
      companyId
    },
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

  if (!task) {
    throw new AppError("ERR_TASK_NOT_FOUND", 404);
  }

  // Verificar permissões: usuário deve ser o criador, responsável ou admin
  const user = await User.findOne({
    where: { id: userId, companyId }
  });

  if (!user) {
    throw new AppError("ERR_USER_NOT_AUTHORIZED", 403);
  }

  const canEdit = (
    task.createdById === userId ||
    task.assignedToId === userId ||
    user.profile === 'admin' ||
    user.super === true
  );

  if (!canEdit) {
    throw new AppError("ERR_TASK_EDIT_NOT_AUTHORIZED", 403);
  }

  // Preparar dados para atualização
  const updateData: any = {};

  // Validar e preparar título
  if (title !== undefined) {
    if (!title || title.trim().length === 0) {
      throw new AppError("ERR_TASK_TITLE_REQUIRED", 400);
    }
    if (title.length > 255) {
      throw new AppError("ERR_TASK_TITLE_TOO_LONG", 400);
    }
    updateData.title = title.trim();
  }

  // Preparar descrição
  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }

  // Validar e preparar status
  if (status !== undefined) {
    if (!Object.values(TaskStatus).includes(status)) {
      throw new AppError("ERR_INVALID_TASK_STATUS", 400);
    }
    updateData.status = status;
  }

  // Validar e preparar prioridade
  if (priority !== undefined) {
    if (!Object.values(TaskPriority).includes(priority)) {
      throw new AppError("ERR_INVALID_TASK_PRIORITY", 400);
    }
    updateData.priority = priority;
  }

  // Validar e preparar data de vencimento
  if (dueDate !== undefined) {
    if (dueDate === null || dueDate === "") {
      updateData.dueDate = null;
    } else {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        throw new AppError("ERR_INVALID_DUE_DATE", 400);
      }
      updateData.dueDate = parsedDate;
    }
  }

  // Validar e preparar responsável
  if (assignedToId !== undefined) {
    if (assignedToId === null || assignedToId === 0) {
      updateData.assignedToId = null;
    } else {
      const assignedUser = await User.findOne({
        where: {
          id: assignedToId,
          companyId
        }
      });

      if (!assignedUser) {
        throw new AppError("ERR_ASSIGNED_USER_NOT_FOUND", 404);
      }

      updateData.assignedToId = assignedToId;
    }
  }

  try {
    // Realizar a atualização
    await task.update(updateData);

    // Buscar a tarefa atualizada com associações
    const updatedTask = await Task.findByPk(task.id, {
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
      ]
    });

    if (!updatedTask) {
      throw new AppError("ERR_TASK_UPDATE_FAILED", 500);
    }

    return updatedTask;

  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    // Log do erro para debugging
    console.error("UpdateTaskService Error:", error);
    
    // Tratar erros específicos do Sequelize
    if (error.name === "SequelizeValidationError") {
      const firstError = error.errors[0];
      throw new AppError(`ERR_VALIDATION: ${firstError.message}`, 400);
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new AppError("ERR_FOREIGN_KEY_CONSTRAINT", 400);
    }

    throw new AppError("ERR_UPDATING_TASK", 500);
  }
};

export default UpdateTaskService;