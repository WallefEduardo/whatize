import AppError from "../../errors/AppError";
import Task from "../../models/Task";
import User from "../../models/User";

interface ShowTaskRequest {
  taskId?: number;
  uuid?: string;
  companyId: number;
  userId: number;
}

const ShowTaskService = async ({
  taskId,
  uuid,
  companyId,
  userId
}: ShowTaskRequest): Promise<Task> => {
  // Validar parâmetros
  if (!taskId && !uuid) {
    throw new AppError("ERR_TASK_ID_OR_UUID_REQUIRED", 400);
  }

  // Verificar se o usuário existe e pertence à empresa
  const user = await User.findOne({
    where: { id: userId, companyId }
  });

  if (!user) {
    throw new AppError("ERR_USER_NOT_AUTHORIZED", 403);
  }

  // Construir condição de busca
  const whereCondition: any = { companyId };
  
  if (taskId) {
    whereCondition.id = taskId;
  } else {
    whereCondition.uuid = uuid;
  }

  try {
    // Buscar a tarefa com todas as associações
    const task = await Task.findOne({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "assignedTo",
          attributes: [
            "id", 
            "name", 
            "email", 
            "profileImage",
            "departamento",
            "cargo"
          ]
        },
        {
          model: User,
          as: "createdBy",
          attributes: [
            "id", 
            "name", 
            "email", 
            "profileImage",
            "departamento", 
            "cargo"
          ]
        }
      ]
    });

    if (!task) {
      throw new AppError("ERR_TASK_NOT_FOUND", 404);
    }

    // Verificar permissões de visualização
    // Usuários podem ver:
    // 1. Tarefas que criaram
    // 2. Tarefas atribuídas a eles
    // 3. Se for admin/super, pode ver todas
    const canView = (
      task.createdById === userId ||
      task.assignedToId === userId ||
      user.profile === 'admin' ||
      user.super === true
    );

    if (!canView) {
      throw new AppError("ERR_TASK_VIEW_NOT_AUTHORIZED", 403);
    }

    return task;

  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("ShowTaskService Error:", error);
    throw new AppError("ERR_SHOWING_TASK", 500);
  }
};

export default ShowTaskService;