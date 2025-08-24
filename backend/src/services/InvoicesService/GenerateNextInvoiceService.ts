import { addMonths, format, isAfter, isBefore, subDays } from "date-fns";
import Invoice from "../../models/Invoices";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import CreateInvoiceService from "./CreateInvoiceService";
import AppError from "../../errors/AppError";

/**
 * Verifica se é necessário gerar uma nova fatura para uma empresa
 * Esta função deve ser chamada por uma job/tarefa agendada diariamente
 */
const GenerateNextInvoiceService = async (companyId: number): Promise<Invoice | null> => {
  try {
    // Buscar a empresa e seu plano
    const company = await Company.findByPk(companyId, {
      include: [{ model: Plan, as: "plan" }]
    });

    if (!company) {
      throw new AppError("Empresa não encontrada", 404);
    }

    if (!company.planId) {
      throw new AppError("Empresa não possui plano", 400);
    }

    // Buscar a última fatura da empresa
    const lastInvoice = await Invoice.findOne({
      where: { companyId },
      order: [["dueDate", "DESC"]]
    });

    if (!lastInvoice) {
      // Se não existir nenhuma fatura, não há fatura atual para basear a próxima
      return null;
    }

    // Verificar se existe uma próxima fatura já programada
    const today = new Date();
    const lastDueDate = new Date(lastInvoice.dueDate);
    
    // Data limite para criar a próxima fatura (ex: 7 dias antes do vencimento)
    const limitDate = subDays(lastDueDate, 7);
    
    // Se a data atual for depois da data limite e a última fatura ainda estiver em aberto
    if (isAfter(today, limitDate) && !["paid", "canceled"].includes(lastInvoice.status)) {
      // Verificar se já existe uma próxima fatura
      const existingNextInvoice = await Invoice.findOne({
        where: { 
          companyId,
          status: "pending"
        },
        order: [["dueDate", "ASC"]]
      });

      // Se já existir uma próxima fatura, não criar outra
      if (existingNextInvoice && isAfter(new Date(existingNextInvoice.dueDate), lastDueDate)) {
        return null;
      }

      // Calcular a data da próxima fatura com base na recorrência
      let nextDueDate;
      if (company.recurrence === "MONTHLY") {
        nextDueDate = addMonths(lastDueDate, 1);
      } else if (company.recurrence === "YEARLY") {
        nextDueDate = addMonths(lastDueDate, 12);
      } else {
        // Se a recorrência não for reconhecida, não gerar próxima fatura
        return null;
      }

      // Preparar o valor do plano
      let planAmount = company.plan.amount;
      // Converter valor com vírgula para ponto se for string
      if (typeof planAmount === 'string') {
        planAmount = (planAmount as string).replace(',', '.');
      }

      // Criar a próxima fatura
      const nextInvoice = await CreateInvoiceService({
        companyId: company.id,
        dueDate: format(nextDueDate, "yyyy-MM-dd"),
        detail: `Próxima ${company.recurrence === "MONTHLY" ? "mensalidade" : "anuidade"} do plano ${company.plan.name}`,
        status: "pending",
        value: parseFloat(planAmount),
        users: company.plan.users,
        connections: company.plan.connections,
        queues: company.plan.queues,
        useWhatsapp: company.plan.useWhatsapp,
        useFacebook: company.plan.useFacebook,
        useInstagram: company.plan.useInstagram,
        useCampaigns: company.plan.useCampaigns,
        useSchedules: company.plan.useSchedules,
        useInternalChat: company.plan.useInternalChat,
        useExternalApi: company.plan.useExternalApi,
        linkInvoice: ""
      });
      return nextInvoice;
    }

    return null;
  } catch (error) {
    console.error("Erro ao gerar próxima fatura:", error);
    return null;
  }
};

export default GenerateNextInvoiceService; 