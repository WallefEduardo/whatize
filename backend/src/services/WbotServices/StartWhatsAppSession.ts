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
  
  // 🎯 NOVA FUNCIONALIDADE: Check if WhatsApp is already CONNECTED
  if (whatsapp.status === "CONNECTED") {
    logger.info(`✅ WhatsApp ${whatsapp.id} is already CONNECTED, emitting socket directly`);
    
    const io = getIO();
    io.of(`/${companyId}`)
      .emit(`company-${companyId}-whatsappSession`, {
        action: "update",
        session: whatsapp
      });
    
    return; // Don't try to connect again
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
