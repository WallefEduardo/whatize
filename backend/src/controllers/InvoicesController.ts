import * as Yup from "yup";
import { Request, Response } from "express";
import AppError from "../errors/AppError";
import Invoices from "../models/Invoices";

import FindAllInvoiceService from "../services/InvoicesService/FindAllInvoiceService";
import ListInvoicesServices from "../services/InvoicesService/ListInvoicesServices";
import ShowInvoceService from "../services/InvoicesService/ShowInvoiceService";
import UpdateInvoiceService from "../services/InvoicesService/UpdateInvoiceService";
import DeleteInvoiceService from "../services/InvoicesService/DeleteInvoiceService";
import CreateInvoiceService from "../services/InvoicesService/CreateInvoiceService";
import GenerateNextInvoiceService from "../services/InvoicesService/GenerateNextInvoiceService";
import Company from "../models/Company";
import Plan from "../models/Plan";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type StoreInvoiceData = {
  companyId: number;
  dueDate: string;
  detail: string;
  status: string;
  value: number;
  users: number;
  connections: number;
  queues: number;
  useWhatsapp: boolean;
  useFacebook: boolean;
  useInstagram: boolean;
  useCampaigns: boolean;
  useSchedules: boolean;
  useInternalChat: boolean;
  useExternalApi: boolean;
  linkInvoice: string;
};

type UpdateInvoiceData = {
  status: string;
  id?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { invoices, count, hasMore } = await ListInvoicesServices({
    searchParam,
    pageNumber
  });

  return res.json({ invoices, count, hasMore });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const invoice = await ShowInvoceService(id);

  return res.status(200).json(invoice);
};


export const store = async (req: Request, res: Response): Promise<Response> => {
  const newPlan: StoreInvoiceData = req.body;

  const plan = await CreateInvoiceService(newPlan);

  return res.status(200).json(plan);
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const invoice: Invoices[] = await FindAllInvoiceService(companyId);

  return res.status(200).json(invoice);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const InvoiceData: UpdateInvoiceData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(InvoiceData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { id, status } = InvoiceData;

  const plan = await UpdateInvoiceService({
    id,
    status,

  });

  // const io = getIO();
  // io.of(companyId.toString())
  // .emit("plan", {
  //   action: "update",
  //   plan
  // });

  return res.status(200).json(plan);
};
export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const invoice = await DeleteInvoiceService(id);

  return res.status(200).json(invoice);
};

// Método para gerar a próxima fatura para uma empresa
export const generateNextInvoice = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.params;

  const invoice = await GenerateNextInvoiceService(parseInt(companyId));

  if (!invoice) {
    return res.status(200).json({ message: "Não foi necessário gerar uma nova fatura." });
  }

  return res.status(200).json(invoice);
};

// Nova função para corrigir faturas com valor zero
export const fixZeroValueInvoices = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Buscar todas as faturas com valor zero
    const zeroValueInvoices = await Invoices.findAll({
      where: {
        value: 0
      }
    });



    const updatedInvoices = [];

    // Para cada fatura, buscar o plano da empresa e atualizar o valor
    for (const invoice of zeroValueInvoices) {
      const company = await Company.findByPk(invoice.companyId);
      
      if (company && company.planId) {
        const plan = await Plan.findByPk(company.planId);
        
        if (plan) {
          const planValue = parseFloat(plan.amount);
          
          // Atualizar o valor da fatura com o valor do plano (mínimo 0.01)
          const newValue = Math.max(0.01, planValue);
          
          await invoice.update({
            value: newValue
          });
          
  
          
          updatedInvoices.push({
            id: invoice.id,
            companyId: invoice.companyId,
            oldValue: 0,
            newValue
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `${updatedInvoices.length} faturas atualizadas com sucesso`,
      updatedInvoices
    });
  } catch (error) {
    console.error("Erro ao corrigir faturas:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao corrigir faturas com valor zero",
      error: error.message
    });
  }
}; 
