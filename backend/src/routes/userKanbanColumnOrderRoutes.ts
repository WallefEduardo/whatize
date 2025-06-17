import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as UserKanbanColumnOrderController from "../controllers/UserKanbanColumnOrderController";

const userKanbanColumnOrderRoutes = Router();

userKanbanColumnOrderRoutes.get(
  "/users/:userId/kanban-column-order",
  isAuth,
  UserKanbanColumnOrderController.index
);

userKanbanColumnOrderRoutes.post(
  "/users/:userId/kanban-column-order",
  isAuth,
  UserKanbanColumnOrderController.store
);

userKanbanColumnOrderRoutes.delete(
  "/users/:userId/kanban-column-order",
  isAuth,
  UserKanbanColumnOrderController.destroy
);

export default userKanbanColumnOrderRoutes; 