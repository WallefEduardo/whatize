import { WASocket } from "baileys";
import { getWbot } from "../libs/wbot";
import GetDefaultWhatsApp from "./GetDefaultWhatsApp";
import Ticket from "../models/Ticket";
import logger from "../utils/logger";

type Session = WASocket & {
  id?: number;
};

// Cache de sessões para reduzir logs
const wbotCache = new Map<number, { wbot: Session; timestamp: number }>();
const CACHE_TTL = 3000; // 3 segundos

const GetTicketWbot = async (ticket: Ticket): Promise<Session> => {
  // Log apenas em debug mode ou primeira vez
  const isDebugMode = process.env.DEBUG_WBOT === 'true';
  
  if (!ticket.whatsappId) {
    if (isDebugMode) {
      logger.info(`⚠️ [TICKET-WBOT] Ticket sem whatsappId, buscando WhatsApp padrão...`);
    }
    const defaultWhatsapp = await GetDefaultWhatsApp(ticket.companyId, ticket.whatsappId);
    await ticket.$set("whatsapp", defaultWhatsapp);
    await ticket.reload();
  }
  
  // Verificar cache
  const cached = wbotCache.get(ticket.whatsappId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.wbot;
  }
  
  try {
    const wbot = getWbot(ticket.whatsappId);
    
    // Atualizar cache
    wbotCache.set(ticket.whatsappId, {
      wbot,
      timestamp: Date.now()
    });
    
    return wbot;
  } catch (error) {
    logger.error(`❌ [TICKET-WBOT] Erro ao obter wbot para ticket ${ticket.id}: ${error.message}`);
    throw error;
  }
};

export default GetTicketWbot;
