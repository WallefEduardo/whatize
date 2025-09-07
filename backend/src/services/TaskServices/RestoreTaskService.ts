import Task from "../../models/Task";
import CompletedTask from "../../models/CompletedTask";
import User from "../../models/User";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";

interface RestoreTaskRequest {
  completedTaskId: number;
  userId: number;
  companyId: number;
}

interface RestoreTaskResponse {
  restoredTask: Task;
  message: string;
}

const RestoreTaskService = async ({
  completedTaskId,
  userId,
  companyId
}: RestoreTaskRequest): Promise<RestoreTaskResponse> => {
  console.log('🔄 RestoreTaskService chamado:', { completedTaskId, userId, companyId });

  // Validar empresa
  const company = await Company.findByPk(companyId);
  if (!company) {
    throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
  }

  // Validar usuário e se é admin
  const user = await User.findOne({
    where: { id: userId, companyId }
  });
  if (!user) {
    throw new AppError("ERR_USER_NOT_AUTHORIZED", 403);
  }

  if (user.profile !== "admin" && !user.super) {
    throw new AppError("ERR_ONLY_ADMIN_CAN_RESTORE_TASKS", 403);
  }

  // Buscar tarefa completada
  const completedTask = await CompletedTask.findOne({
    where: { id: completedTaskId, companyId },
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
      },
      {
        model: User,
        as: "completedBy",
        attributes: ["id", "name", "email"]
      }
    ]
  });

  if (!completedTask) {
    throw new AppError("ERR_COMPLETED_TASK_NOT_FOUND", 404);
  }

  try {
    // Restaurar tarefa na tabela Tasks
    const restoredTask = await Task.create({
      uuid: completedTask.uuid,
      title: completedTask.title,
      description: completedTask.description,
      status: completedTask.originalStatus, // Voltar ao status anterior
      priority: completedTask.priority,
      dueDate: completedTask.dueDate,
      assignedToId: completedTask.assignedToId,
      createdById: completedTask.createdById,
      companyId: completedTask.companyId,
      createdAt: completedTask.createdAt,
      updatedAt: new Date()
    });

    // Buscar task restaurada com relacionamentos
    const restoredTaskWithRelations = await Task.findByPk(restoredTask.id, {
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

    // Remover da tabela CompletedTasks
    await completedTask.destroy();

    console.log('✅ Tarefa restaurada para Tasks:', restoredTask.id);

    // Emitir evento socket
    const io = getIO();
    io.to(`company-${companyId}`)
      .emit(`company-${companyId}-task-restored`, {
        action: "restore",
        completedTaskId: completedTask.id,
        restoredTask: restoredTaskWithRelations
      });

    return {
      restoredTask: restoredTaskWithRelations!,
      message: "Tarefa restaurada com sucesso"
    };

  } catch (error: any) {
    console.error("RestoreTaskService Error:", error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("ERR_RESTORING_TASK", 500);
  }
};

export default RestoreTaskService;