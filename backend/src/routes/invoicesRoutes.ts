import express from "express";
import isAuth from "../middleware/isAuth";
import * as QueueOptionController from "../controllers/QueueOptionController";
import * as InvoicesController from "../controllers/InvoicesController"

const invoiceRoutes = express.Router();

invoiceRoutes.get("/invoices", isAuth, InvoicesController.index);
invoiceRoutes.get("/invoices/list", InvoicesController.list);
invoiceRoutes.get("/invoices/all", isAuth, InvoicesController.list);
invoiceRoutes.get("/invoices/:Invoiceid", isAuth, InvoicesController.show);
invoiceRoutes.put("/invoices/:id", isAuth, InvoicesController.update);
invoiceRoutes.post("/invoices/generate/:companyId", isAuth, InvoicesController.generateNextInvoice);

// Nova rota para corrigir faturas com valor zero
invoiceRoutes.post("/invoices/fix-zero-values", isAuth, InvoicesController.fixZeroValueInvoices);

export default invoiceRoutes;
