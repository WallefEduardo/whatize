import { WASocket } from "baileys";
import { getWbot } from "../libs/wbot";
import GetDefaultWhatsApp from "./GetDefaultWhatsApp";
import Ticket from "../models/Ticket";
import logger from "../utils/logger";

type Session = WASocket & {
  id?: number;
};

const GetTicketWbot = async (ticket: Ticket): Promise<Session> => {
  logger.debug(`🎫 [TICKET-WBOT] Obtendo wbot para ticket: { ticketId: ${ticket.id}, whatsappId: ${ticket.whatsappId}, companyId: ${ticket.companyId} }`);
  
  if (!ticket.whatsappId) {
    logger.debug(`⚠️ [TICKET-WBOT] Ticket sem whatsappId, buscando WhatsApp padrão...`);
    const defaultWhatsapp = await GetDefaultWhatsApp(ticket.companyId, ticket.whatsappId);
    logger.debug(`📱 [TICKET-WBOT] WhatsApp padrão encontrado: { whatsappId: ${defaultWhatsapp.id} }`);

    await ticket.$set("whatsapp", defaultWhatsapp);
    await ticket.reload();
    logger.debug(`✅ [TICKET-WBOT] Ticket atualizado com WhatsApp padrão: { ticketId: ${ticket.id}, whatsappId: ${ticket.whatsappId} }`);
  }

  logger.debug(`🔄 [TICKET-WBOT] Chamando getWbot com whatsappId: ${ticket.whatsappId}`);
  
  try {
    const wbot = getWbot(ticket.whatsappId);
    logger.debug(`✅ [TICKET-WBOT] wbot obtido com sucesso`);
    return wbot;
  } catch (error) {
    logger.error(`❌ [TICKET-WBOT] Erro ao obter wbot: ${error.message}`);
    throw error;
  }
};

export default GetTicketWbot;
