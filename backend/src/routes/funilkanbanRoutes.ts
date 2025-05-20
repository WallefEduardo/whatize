import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as FunilKanbanController from "../controllers/FunilKanbanController";

const funilKanbanRoutes = Router();

// Proteger todas as rotas com autenticação
funilKanbanRoutes.use(isAuth);

// Rotas para CRUD de Funis
funilKanbanRoutes.get("/funilkanban", FunilKanbanController.index);
funilKanbanRoutes.get("/funilkanban/:id", FunilKanbanController.show);
funilKanbanRoutes.post("/funilkanban", FunilKanbanController.store);
funilKanbanRoutes.put("/funilkanban/:id", FunilKanbanController.update);
funilKanbanRoutes.delete("/funilkanban/:id", FunilKanbanController.remove);

export default funilKanbanRoutes;
