import AppError from "../../errors/AppError";
import Task from "../../models/Task";
import User from "../../models/User";

interface DeleteTaskRequest {
  taskId: number;
  companyId: number;
  userId: number;
}

interface DeleteTaskResponse {
  success: boolean;
  message: string;
  deletedTask?: {
    id: number;
    uuid: string;
    title: string;
  };
}

const DeleteTaskService = async ({
  taskId,
  companyId,
  userId
}: DeleteTaskRequest): Promise<DeleteTaskResponse> => {
  // Validações básicas
  if (!taskId || taskId <= 0) {
    throw new AppError("ERR_INVALID_TASK_ID", 400);
  }

  // Verificar se o usuário existe e pertence à empresa
  const user = await User.findOne({
    where: { id: userId, companyId }
  });

  if (!user) {
    throw new AppError("ERR_USER_NOT_AUTHORIZED", 403);
  }

  // Buscar a tarefa
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

  // Verificar permissões de exclusão
  // Podem excluir:
  // 1. O criador da tarefa
  // 2. Admins
  // 3. Super users
  const canDelete = (
    task.createdById === userId ||
    user.profile === 'admin' ||
    user.super === true
  );

  if (!canDelete) {
    throw new AppError("ERR_TASK_DELETE_NOT_AUTHORIZED", 403);
  }

  try {
    // Armazenar informações da tarefa antes de excluir
    const deletedTaskInfo = {
      id: task.id,
      uuid: task.uuid,
      title: task.title
    };

    // Realizar a exclusão
    await task.destroy();

    return {
      success: true,
      message: "Task deleted successfully",
      deletedTask: deletedTaskInfo
    };

  } catch (error: any) {
    console.error("DeleteTaskService Error:", error);
    
    if (error instanceof AppError) {
      throw error;
    }

    // Tratar erros específicos do Sequelize
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new AppError("ERR_TASK_HAS_DEPENDENCIES", 400);
    }

    throw new AppError("ERR_DELETING_TASK", 500);
  }
};

export default DeleteTaskService;