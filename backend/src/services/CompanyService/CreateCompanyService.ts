import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import User from "../../models/User";
import Plan from "../../models/Plan";
import sequelize from "../../database";
import CompaniesSettings from "../../models/CompaniesSettings";
import Invoice from "../../models/Invoices";
import { addMonths, format } from "date-fns";

interface CompanyData {
  name: string;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  dueDate?: string;
  recurrence?: string;
  document?: string;
  paymentMethod?: string;
  password?: string;
  companyUserName?: string;
}

const CreateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const {
    name,
    phone,
    password,
    email,
    status,
    planId,
    dueDate,
    recurrence,
    document,
    paymentMethod,
    companyUserName
  } = companyData;

  const companySchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_COMPANY_INVALID_NAME")
      .required("ERR_COMPANY_INVALID_NAME")
  });

  try {
    await companySchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const t = await sequelize.transaction();

  try {
    const company = await Company.create({
      name,
      phone,
      email,
      status,
      planId,
      dueDate,
      recurrence,
      document,
      paymentMethod
    },
      { transaction: t }
    );

    const user = await User.create({
      name: companyUserName ? companyUserName : name,
      email: company.email,
      password: password ? password : "mudar123",
      profile: "admin",
      companyId: company.id
    },
      { transaction: t }
    );

    const settings = await CompaniesSettings.create({
          companyId: company.id,
          hoursCloseTicketsAuto: "9999999999",
          chatBotType: "text",
          acceptCallWhatsapp: "enabled",
          userRandom: "enabled",
          sendGreetingMessageOneQueues: "enabled",
          sendSignMessage: "enabled",
          sendFarewellWaitingTicket: "disabled",
          userRating: "disabled",
          sendGreetingAccepted: "enabled",
          CheckMsgIsGroup: "enabled",
          sendQueuePosition: "disabled",
          scheduleType: "disabled",
          acceptAudioMessageContact: "enabled",
          sendMsgTransfTicket:"disabled",
          enableLGPD: "disabled",
          requiredTag: "disabled",
          lgpdDeleteMessage: "disabled",
          lgpdHideNumber: "disabled",
          lgpdConsent: "disabled",
          lgpdLink:"",
          lgpdMessage:"",
          outOfHoursMessage: "",
          createdAt: new Date(),
          updatedAt: new Date(),
          closeTicketOnTransfer: false,
          DirectTicketsToWallets: false
    },{ transaction: t })
    
    // Buscar dados do plano para a fatura
    if (planId) {
      const plan = await Plan.findByPk(planId);
      
      if (plan && dueDate) {
        // Criar fatura baseada no plano
        const planValue = parseFloat(String(plan.amount).replace(',', '.'));
        await Invoice.create({
          companyId: company.id,
          dueDate: dueDate,
          detail: `Mensalidade do plano ${plan.name}`,
          status: "open", // Status inicial da fatura
          value: planValue,
          users: plan.users,
          connections: plan.connections,
          queues: plan.queues,
          useWhatsapp: plan.useWhatsapp,
          useFacebook: plan.useFacebook,
          useInstagram: plan.useInstagram,
          useCampaigns: plan.useCampaigns,
          useSchedules: plan.useSchedules,
          useInternalChat: plan.useInternalChat,
          useExternalApi: plan.useExternalApi,
          linkInvoice: ""
        }, { transaction: t });
        
        // Criar a próxima fatura programada com base na recorrência
        if (recurrence === "MONTHLY") {
          // Calcular próximo vencimento (1 mês após dueDate)
          const currentDueDate = new Date(dueDate);
          const nextDueDate = addMonths(currentDueDate, 1);
          
          await Invoice.create({
            companyId: company.id,
            dueDate: format(nextDueDate, "yyyy-MM-dd"),
            detail: `Próxima mensalidade do plano ${plan.name}`,
            status: "pending", // Status da próxima fatura
            value: parseFloat(plan.amount),
            users: plan.users,
            connections: plan.connections,
            queues: plan.queues,
            useWhatsapp: plan.useWhatsapp,
            useFacebook: plan.useFacebook,
            useInstagram: plan.useInstagram,
            useCampaigns: plan.useCampaigns,
            useSchedules: plan.useSchedules,
            useInternalChat: plan.useInternalChat,
            useExternalApi: plan.useExternalApi,
            linkInvoice: ""
          }, { transaction: t });
        } else if (recurrence === "YEARLY") {
          // Calcular próximo vencimento (12 meses após dueDate)
          const currentDueDate = new Date(dueDate);
          const nextDueDate = addMonths(currentDueDate, 12);
          
          await Invoice.create({
            companyId: company.id,
            dueDate: format(nextDueDate, "yyyy-MM-dd"),
            detail: `Próxima anuidade do plano ${plan.name}`,
            status: "pending", // Status da próxima fatura
            value: parseFloat(plan.amount),
            users: plan.users,
            connections: plan.connections,
            queues: plan.queues,
            useWhatsapp: plan.useWhatsapp,
            useFacebook: plan.useFacebook,
            useInstagram: plan.useInstagram,
            useCampaigns: plan.useCampaigns,
            useSchedules: plan.useSchedules,
            useInternalChat: plan.useInternalChat,
            useExternalApi: plan.useExternalApi,
            linkInvoice: ""
          }, { transaction: t });
        }
      }
    }
    
    await t.commit();

    return company;
  } catch (error) {
    await t.rollback();
    throw new AppError("Não foi possível criar a empresa!", error);
  }
};

export default CreateCompanyService;