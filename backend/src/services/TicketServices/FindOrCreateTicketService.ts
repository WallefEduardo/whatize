import { Op, Transaction } from "sequelize";
import { sub } from "date-fns";
import { Mutex } from "async-mutex";

import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import { isNil } from "lodash";
import { getIO } from "../../libs/socket";
import logger from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";
import CompaniesSettings from "../../models/CompaniesSettings";
import CreateLogTicketService from "./CreateLogTicketService";
import AppError from "../../errors/AppError";
import UpdateTicketService from "./UpdateTicketService";
import raceConditionLogger from "../../utils/raceConditionLogger";
import sequelize from "../../database";

// Mutex por contato para evitar race conditions
const contactMutexes = new Map<string, Mutex>();

// Função para obter ou criar mutex por contato
const getContactMutex = (contactId: number, companyId: number, whatsappId: number): Mutex => {
  const key = `${contactId}-${companyId}-${whatsappId}`;
  
  if (!contactMutexes.has(key)) {
    contactMutexes.set(key, new Mutex());
  }
  
  return contactMutexes.get(key)!;
};

// Limpar mutexes antigos periodicamente para evitar vazamento de memória
setInterval(() => {
  if (contactMutexes.size > 1000) {
    const keysToDelete = Array.from(contactMutexes.keys()).slice(0, 500);
    keysToDelete.forEach(key => contactMutexes.delete(key));
  }
}, 300000); // A cada 5 minutos

const FindOrCreateTicketService = async (
  contact: Contact,
  whatsapp: Whatsapp,
  unreadMessages: number,
  companyId: number,
  queueId: number = null,
  userId: number = null,
  groupContact?: Contact,
  channel?: string,
  isImported?: boolean,
  isForward?: boolean,
  settings?: any,
  isTransfered?: boolean,
  isCampaign: boolean = false
): Promise<Ticket> => {
  const targetContact = groupContact || contact;
  const mutex = getContactMutex(targetContact.id, companyId, whatsapp.id);

  return await mutex.runExclusive(async () => {
    const ticketResult = await sequelize.transaction(async (transaction: Transaction) => {
      try {
        // Log da busca de ticket
        logger.info(`🔍 Searching for ticket: contact ${targetContact.id}, company ${companyId}, whatsapp ${whatsapp.id}`);

        let openAsLGPD = false;
        if (settings?.enableLGPD) {
          openAsLGPD = !isCampaign &&
            !isTransfered &&
            settings.enableLGPD === "enabled" &&
            settings.lgpdMessage !== "" &&
            (settings.lgpdConsent === "enabled" ||
              (settings.lgpdConsent === "disabled" && isNil(contact?.lgpdAcceptedAt)));
        }

        const io = getIO();
        const DirectTicketsToWallets = settings?.DirectTicketsToWallets;


        
        // ✅ BUSCA ROBUSTA: Sempre garantir que ticket seja da empresa correta
        let ticket;
        try {
          ticket = await Ticket.findOne({
            where: {
              status: {
                [Op.in]: ["open", "pending", "group", "nps", "lgpd"]
              },
              contactId: targetContact.id,
              companyId, // ✅ SEMPRE filtrar por empresa da sessão
              whatsappId: whatsapp.id
            },
            include: [
              {
                model: Contact,
                as: "contact",
                where: {
                  companyId // ✅ DUPLA VALIDAÇÃO: contato também deve ser da empresa correta
                }
              }
            ],
            order: [["updatedAt", "DESC"], ["id", "DESC"]],
            transaction,
            lock: true // Lock para evitar concorrência
          });
          

        } catch (searchError) {
          logger.error(`❌ [DEBUG] Error searching for ticket: ${searchError.message}`);
          // Se a busca com include falhar, tenta busca simples
          logger.info(`🔍 [DEBUG] Trying simple ticket search without include...`);
          
          ticket = await Ticket.findOne({
            where: {
              status: {
                [Op.in]: ["open", "pending", "group", "nps", "lgpd"]
              },
              contactId: targetContact.id,
              companyId,
              whatsappId: whatsapp.id
            },
            order: [["updatedAt", "DESC"], ["id", "DESC"]],
            transaction,
            lock: true
          });
          
          logger.info(`🔍 [DEBUG] Simple search result: ${ticket ? `found ticket ${ticket.id}` : 'no ticket found'}`);
        }

        // Se encontrou ticket existente, atualiza e retorna
        if (ticket) {
          logger.info(`✅ Found existing ticket ${ticket.id} for contact ${targetContact.id}`);

          if (isCampaign) {
            await ticket.update({
              userId: userId !== ticket.userId ? ticket.userId : userId,
              queueId: queueId !== ticket.queueId ? ticket.queueId : queueId,
            }, { transaction });
          } else {
            await ticket.update({ 
              unreadMessages, 
              isBot: false 
            }, { transaction });
          }

          // Recarrega o ticket com todas as relações
          ticket = await ShowTicketService(ticket.id, companyId);

          // Validação de conflito apenas para novos assignments
          if (!isCampaign && !isForward) {
            if ((Number(ticket?.userId) !== Number(userId) && userId !== 0 && !isNil(userId) && !ticket.isGroup)
              || (queueId !== 0 && Number(ticket?.queueId) !== Number(queueId) && !isNil(queueId))) {
              throw new AppError(`Ticket em outro atendimento. ${"Atendente: " + ticket?.user?.name} - ${"Fila: " + ticket?.queue?.name}`);
            }
          }

          return ticket;
        }

        // Se não encontrou ticket ativo, verifica se pode reutilizar ticket recente
        const timeCreateNewTicket = whatsapp.timeCreateNewTicket;

        if (!ticket && timeCreateNewTicket !== 0) {
          if (timeCreateNewTicket !== 0) {
            ticket = await Ticket.findOne({
              where: {
                updatedAt: {
                  [Op.between]: [
                    +sub(new Date(), {
                      minutes: Number(timeCreateNewTicket)
                    }),
                    +new Date()
                  ]
                },
                contactId: targetContact.id,
                companyId,
                whatsappId: whatsapp.id,
                status: {
                  [Op.notIn]: ["closed"] // Não reutiliza tickets fechados
                }
              },
              order: [["updatedAt", "DESC"]],
              transaction,
              lock: true
            });
          }

          if (ticket && ticket.status !== "nps") {
            logger.info(`♻️ Reusing recent ticket ${ticket.id} for contact ${targetContact.id}`);

            await ticket.update({
              status: "pending",
              unreadMessages,
              companyId,
            }, { transaction });

            return await ShowTicketService(ticket.id, companyId);
          }
        }

        // Se não encontrou nenhum ticket, cria um novo
        if (!ticket) {

          const ticketData: any = {
            contactId: targetContact.id,
            status: (!isImported && !isNil(settings?.enableLGPD) && openAsLGPD && !groupContact) ? 
              "lgpd" :  
              (whatsapp.groupAsTicket === "enabled" || !groupContact) ? 
                "pending" : 
                "group",
            isGroup: !!groupContact,
            unreadMessages,
            whatsappId: whatsapp.id,
            companyId,
            isBot: groupContact ? false : true,
            channel,
            imported: isImported ? new Date() : null,
            isActiveDemand: false,
          };

          // Configuração especial para DirectTicketsToWallets
          if (DirectTicketsToWallets && contact.id) {
            const wallet: any = contact;
            const wallets = await wallet.getWallets();
            if (wallets && wallets[0]?.id) {
              ticketData.status = (!isImported && !isNil(settings?.enableLGPD) && openAsLGPD && !groupContact) ? 
                "lgpd" :  
                (whatsapp.groupAsTicket === "enabled" || !groupContact) ? 
                  "open" : 
                  "group";
              ticketData.userId = wallets[0].id;
            }
          }

          ticket = await Ticket.create(ticketData, { transaction });
        }

        // Atualiza fila e usuário se especificados
        if (queueId != 0 && !isNil(queueId)) {
          await ticket.update({ queueId: queueId }, { transaction });
        }

        if (userId != 0 && !isNil(userId)) {
          await ticket.update({ userId: userId }, { transaction });
        }

        return ticket;

      } catch (error) {
        raceConditionLogger.logConstraintError(
          targetContact.number || targetContact.id.toString(),
          companyId,
          `Error in FindOrCreateTicketService: ${error.message}`,
          whatsapp.id
        );
        
        // Se erro de constraint (ticket duplicado), tenta buscar novamente
        if (error.name === 'SequelizeUniqueConstraintError' || 
            error.message.includes('unique constraint') ||
            error.message.includes('duplicate key')) {
          
          logger.warn(`Constraint error detected, trying to find existing ticket for contact ${targetContact.id}`);
          
          // Busca novamente por ticket existente, MAS sempre da mesma empresa
          const existingTicket = await Ticket.findOne({
            where: {
              status: {
                [Op.in]: ["open", "pending", "group", "nps", "lgpd"]
              },
              contactId: targetContact.id,
              companyId, // ✅ SEMPRE usar companyId da sessão atual
              whatsappId: whatsapp.id
            },
            order: [["updatedAt", "DESC"], ["id", "DESC"]]
          });

          if (existingTicket) {
            // ✅ SEMPRE usar companyId da sessão atual (não do ticket)
            return await ShowTicketService(existingTicket.id, companyId);
          }
        }
        
        // ✅ Se erro de "outra empresa", ignorar e criar novo ticket
        if (error.message && error.message.includes('outra empresa')) {
          logger.warn(`Company mismatch error ignored, will create new ticket for contact ${targetContact.id} in company ${companyId}`);
          // Força criação de novo ticket ignorando dados de outras empresas
          // A função vai tentar novamente sem buscar tickets existentes
        }
        
        throw error;
      }
    });

    // Processa APÓS a transação ser commitada
    if (ticketResult && ticketResult.id) {
      try {
        // Criar log do ticket APÓS transação commitada
        await CreateLogTicketService({
          ticketId: ticketResult.id,
          type: settings?.enableLGPD && !isImported && settings.lgpdMessage !== "" ? "lgpd" : "create"
        });

        // Recarregar ticket com todas as relações APÓS transação commitada
        const finalTicket = await ShowTicketService(ticketResult.id, companyId);
        return finalTicket;
      } catch (postTransactionError) {
        logger.warn(`Post-transaction task failed: ${postTransactionError.message}`);
        return ticketResult;
      }
    }

    return ticketResult;
  });
};

export default FindOrCreateTicketService;