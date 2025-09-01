import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as TaskController from "../controllers/TaskController";

const taskRoutes = Router();

// Middleware de autenticação aplicado a todas as rotas
taskRoutes.use(isAuth);

// CRUD básico
taskRoutes.get("/tasks", TaskController.index);              // GET /tasks - Listar tarefas
taskRoutes.post("/tasks", TaskController.store);             // POST /tasks - Criar tarefa
taskRoutes.get("/tasks/stats", TaskController.stats);        // GET /tasks/stats - Estatísticas
taskRoutes.get("/tasks/my-tasks", TaskController.myTasks);   // GET /tasks/my-tasks - Minhas tarefas
taskRoutes.get("/tasks/overdue", TaskController.overdueTasks); // GET /tasks/overdue - Tarefas vencidas
taskRoutes.get("/tasks/:taskId", TaskController.show);       // GET /tasks/:taskId - Mostrar tarefa por ID
taskRoutes.get("/tasks/uuid/:uuid", TaskController.show);    // GET /tasks/uuid/:uuid - Mostrar tarefa por UUID
taskRoutes.put("/tasks/:taskId", TaskController.update);     // PUT /tasks/:taskId - Atualizar tarefa
taskRoutes.delete("/tasks/:taskId", TaskController.destroy); // DELETE /tasks/:taskId - Excluir tarefa

export default taskRoutes;