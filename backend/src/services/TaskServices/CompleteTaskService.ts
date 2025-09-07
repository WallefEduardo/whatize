import Task from "../../models/Task";
import CompletedTask from "../../models/CompletedTask";
import User from "../../models/User";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";

interface CompleteTaskRequest {
  taskId: number;
  completedById: number;
  companyId: number;
}

interface CompleteTaskResponse {
  completedTask: CompletedTask;
  message: string;
}

const CompleteTaskService = async ({
  taskId,
  completedById,
  companyId
}: CompleteTaskRequest): Promise<CompleteTaskResponse> => {
  console.log('🎯 CompleteTaskService chamado:', { taskId, completedById, companyId });

  // Validar empresa
  const company = await Company.findByPk(companyId);
  if (!company) {
    throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
  }

  // Validar usuário que está completando
  const completedByUser = await User.findOne({
    where: { id: completedById, companyId }
  });
  if (!completedByUser) {
    throw new AppError("ERR_USER_NOT_AUTHORIZED", 403);
  }

  // Buscar tarefa para completar
  const task = await Task.findOne({
    where: { id: taskId, companyId },
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

  if (task.status === "completed") {
    throw new AppError("ERR_TASK_ALREADY_COMPLETED", 400);
  }

  try {
    // Criar registro na tabela CompletedTasks
    const completedTask = await CompletedTask.create({
      uuid: task.uuid,
      title: task.title,
      description: task.description,
      status: "completed",
      priority: task.priority,
      dueDate: task.dueDate,
      assignedToId: task.assignedToId,
      createdById: task.createdById,
      companyId: task.companyId,
      completedAt: new Date(),
      completedById,
      originalStatus: task.status,
      createdAt: task.createdAt,
      updatedAt: new Date()
    });

    // Buscar completedTask com relacionamentos
    const completedTaskWithRelations = await CompletedTask.findByPk(completedTask.id, {
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

    // Remover tarefa da tabela Tasks
    await task.destroy();

    console.log('✅ Tarefa movida para CompletedTasks:', completedTask.id);

    // Emitir evento socket
    const io = getIO();
    io.to(`company-${companyId}`)
      .emit(`company-${companyId}-task-completed`, {
        action: "complete",
        taskId: task.id,
        completedTask: completedTaskWithRelations
      });

    return {
      completedTask: completedTaskWithRelations!,
      message: "Tarefa concluída com sucesso"
    };

  } catch (error: any) {
    console.error("CompleteTaskService Error:", error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("ERR_COMPLETING_TASK", 500);
  }
};

export default CompleteTaskService;