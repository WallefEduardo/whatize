import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import logger from "../../utils/logger";
import PresenceService from "./PresenceService";
import * as Sentry from "@sentry/node";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  logger.info(`🚀 Starting WhatsApp Session - ID: ${whatsapp.id}, Name: ${whatsapp.name}, Company: ${companyId}, Status: ${whatsapp.status}`);
  
  // 🎯 CORREÇÃO: Verificar se sessão realmente existe, não apenas o status
  if (whatsapp.status === "CONNECTED") {
    logger.info(`⚠️ WhatsApp ${whatsapp.id} tem status CONNECTED, mas verificando se sessão existe na memória...`);
    
    // Importar getWbot para verificar se sessão existe
    const { getWbot } = await import("../../libs/wbot");
    try {
      const session = getWbot(whatsapp.id);
      if (session && (session as any).readyState === 1) {
        logger.info(`✅ WhatsApp ${whatsapp.id} tem sessão ativa, emitindo socket`);
        
        const io = getIO();
        io.of(`/${companyId}`)
          .emit(`company-${companyId}-whatsappSession`, {
            action: "update",
            session: whatsapp
          });
        
        return; // Sessão realmente existe
      }
    } catch (error) {
      logger.warn(`⚠️ WhatsApp ${whatsapp.id} tem status CONNECTED mas sessão não existe: ${error.message}`);
    }
    
    logger.info(`🔄 WhatsApp ${whatsapp.id} - Status CONNECTED é falso, forçando reconexão`);
  }
  
  await whatsapp.update({ status: "OPENING" });

  const io = getIO();
  io.of(`/${companyId}`)
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
      logger.info(`Presence service initialized for company ${companyId}`);
    }
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }
};
