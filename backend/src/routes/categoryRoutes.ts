import express from "express";
import isAuth from "../middleware/isAuth";
import * as CategoryController from "../controllers/CategoryController";

const categoryRoutes = express.Router();

// Log para debug
console.log("🔧 CategoryRoutes: Carregando rotas de categoria...");

categoryRoutes.get("/categories", isAuth, CategoryController.index);
categoryRoutes.post("/categories", isAuth, CategoryController.store);
categoryRoutes.put("/categories/:id", isAuth, CategoryController.update);
categoryRoutes.delete("/categories/:id", isAuth, CategoryController.remove);

console.log("✅ CategoryRoutes: Rotas registradas:");
console.log("   GET    /categories");
console.log("   POST   /categories");
console.log("   PUT    /categories/:id");
console.log("   DELETE /categories/:id");

export default categoryRoutes; 