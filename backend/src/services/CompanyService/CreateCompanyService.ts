import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import User from "../../models/User";
import Plan from "../../models/Plan";
import sequelize from "../../database";
import CompaniesSettings from "../../models/CompaniesSettings";
import Invoices from "../../models/Invoices";
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
  startWork?: string;
  endWork?: string;
  defaultTheme?: string;
  defaultMenu?: string;
  allowGroup?: boolean;
  allHistoric?: boolean;
  userClosePendingTicket?: boolean;
  showDashboard?: boolean;
  defaultTicketsManagerWidth?: string;
  allowRealTime?: boolean;
  allowConnections?: boolean;
}

const CreateCompanyService = async (
  companyData: CompanyData
): Promise<User> => {
  try {
    const {
      name,
      email,
      phone,
      planId,
      status,
      dueDate,
      recurrence,
      document,
      paymentMethod,
      password,
      companyUserName,
      startWork,
      endWork,
      defaultTheme,
      defaultMenu,
      allowGroup,
      allHistoric,
      userClosePendingTicket,
      showDashboard,
      defaultTicketsManagerWidth,
      allowRealTime,
      allowConnections
    } = companyData;

    const companySchema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      phone: Yup.string().required(),
      planId: Yup.number().required(),
      status: Yup.boolean().required(),
      dueDate: Yup.string().required(),
      document: Yup.string().required(),
      password: Yup.string().required(),
      companyUserName: Yup.string().required()
    });

    try {
      await companySchema.validate(companyData);
    } catch (err) {
      throw new AppError(err.message);
    }

    const transaction = await sequelize.transaction();

    try {
      const company = await Company.create({
        name,
        email,
        phone,
        planId,
        status,
        dueDate,
        recurrence,
        document,
        paymentMethod
      }, { transaction });

      const user = await User.create({
        name: companyUserName,
        email,
        password: password, // Remove a criptografia manual - o modelo User já faz isso automaticamente
        profile: "admin",
        companyId: company.id,
        startWork,
        endWork
      }, { transaction });

      await CompaniesSettings.create({
        companyId: company.id,
        hoursCloseTicketsAuto: 24,
        chatBotType: "text",
        acceptCallWhatsapp: "disabled",
        userRandom: "disabled",
        sendGreetingMessageOneQueues: "disabled",
        sendSignMessage: "disabled",
        sendFarewellWaitingTicket: "disabled",
        userRating: "disabled",
        sendGreetingAccepted: "disabled",
        CheckMsgIsGroup: "disabled",
        sendQueuePosition: "disabled",
        scheduleType: "disabled",
        acceptAudioMessageContact: "disabled",
        sendMsgTransfTicket: "disabled",
        enableLGPD: "disabled",
        requiredTag: "disabled",
        lgpdDeleteMessage: "Você pode solicitar a exclusão dos seus dados a qualquer momento.",
        lgpdHideNumber: "enabled",
        lgpdConsent: "A LGPD (Lei Geral de Proteção de Dados) garante a você o controle sobre suas informações pessoais. Ao prosseguir, você concorda com a coleta e uso dos seus dados para melhorar nossos serviços. Você pode gerenciar suas preferências a qualquer momento.",
        lgpdLink: "https://site.com/politicas-de-privacidade/",
        lgpdMessage: "🔒 *Política de Privacidade*\n\nA sua privacidade é importante para nós. Coletamos e usamos seus dados de acordo com a LGPD.\n\n📋 *Dados coletados:*\n• Nome e informações de contato\n• Histórico de conversas para melhor atendimento\n• Preferências de comunicação\n\n🎯 *Finalidade:*\n• Prestar suporte e atendimento\n• Melhorar nossos serviços\n• Comunicações importantes\n\n🔐 *Seus direitos:*\n• Acessar seus dados\n• Corrigir informações\n• Solicitar exclusão\n• Revogar consentimento\n\n📞 *Dúvidas sobre privacidade:*\nEntre em contato conosco pelo e-mail: privacidade@empresa.com\n\n✅ Digite *ACEITO* para concordar ou *POLÍTICA* para ler nossa política completa.",
        deleteTicketMessageGroups: "disabled",
        timeDeleteTicketMessageGroups: 24,
        defaultTheme,
        defaultMenu,
        allowGroup,
        allHistoric,
        userClosePendingTicket,
        showDashboard,
        defaultTicketsManagerWidth,
        allowRealTime,
        allowConnections
      }, { transaction });

      if (planId) {
        const plan = await Plan.findByPk(planId);
        if (plan) {
          const invoiceData = {
            companyId: company.id,
            dueDate,
            detail: plan.name,
            status: "open",
            value: plan.amount
          };
          await Invoices.create(invoiceData, { transaction });
        }
      }

      await transaction.commit();
      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

export default CreateCompanyService;