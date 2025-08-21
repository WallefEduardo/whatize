import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import logger from "../../utils/logger";
import PresenceService from "./PresenceService";
import * as Sentry from "@sentry/node";

// Controle de sessões em inicialização
const startingSessions = new Map<number, boolean>();

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  // Verificar se já está iniciando
  if (startingSessions.get(whatsapp.id)) {
    logger.warn(`⚠️ [START-SESSION] Sessão ${whatsapp.name} já está sendo iniciada. Ignorando duplicata.`);
    return;
  }
  
  startingSessions.set(whatsapp.id, true);
  
  try {
    await whatsapp.update({ status: "OPENING" });

    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-whatsappSession`, {
        action: "update",
        session: whatsapp
      });

    try {
      const wbot = await initWASocket(whatsapp);
     
      if (wbot.id) {
        wbotMessageListener(wbot, companyId);
        wbotMonitor(wbot, whatsapp, companyId);
        
        // Configurar listener de presence
        PresenceService.setupPresenceListener(wbot, companyId);
        logger.info(`✅ [START-SESSION] Sessão ${whatsapp.name} iniciada com sucesso`);
      }
    } catch (err) {
      logger.error(`❌ [START-SESSION] Erro ao iniciar sessão ${whatsapp.name}: ${err.message}`);
      Sentry.captureException(err);
      throw err;
    }
  } finally {
    // Sempre limpar o flag de inicialização
    startingSessions.delete(whatsapp.id);
  }
};
