import { Request, Response, NextFunction } from "express";
import Ticket from "../models/Ticket";
import Company from "../models/Company";

const LIMIT_TICKETS_PLAN_1 = 1;

const limitTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "ID da empresa não fornecido." });
    }

    const company = await Company.findByPk(companyId);

    if (!company) {
      return res.status(404).json({ message: "Empresa não encontrada." });
    }

    const planId = company.planId;

    if (planId === 1) { // Plano 1
      const ticketCount = await Ticket.count({ where: { companyId } });

      if (ticketCount >= LIMIT_TICKETS_PLAN_1) {
        //mostra no console quantos tickets esse usuario tem 
        return res.status(403).json({
          //mostre quantos tickets o usuario tem no console dentro do return 
          ticketCount: ticketCount,
          message: `Olá ${req.user.id} você atingiu o limite de ${ticketCount.toString}, para o seu plano.`
        });
      }
    }

    next();
  } catch (error) {
    console.error("Erro no middleware de limitação de tickets:", error);
    return res.status(500).json({ message: "Erro ao verificar o limite de tickets." });
  }
};

export default limitTickets;