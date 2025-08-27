import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import logger from "../../utils/logger";
import PresenceService from "./PresenceService";
import * as Sentry from "@sentry/node";
import { sessionManager, WhatsAppState } from "../../libs/WhatsAppSessionManager";

// ❌ REMOVIDO: Sistema de locks duplicado
// const startingSessions = new Map<number, { timestamp: number; timeout: NodeJS.Timeout; }>();

// ⚡ OTIMIZADO: Timeout interno reduzido - SessionManager já controla timeout geral
const STARTING_TIMEOUT = 6000; // 6 segundos timeout interno

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  const sessionId = `${whatsapp.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  // ⚡ OTIMIZAÇÃO: Usar SessionManager como fonte única de verdade
  const initialState = sessionManager.getState(whatsapp.id);
  
  // ⚠️ REMOVIDO: Não ignorar quando CONNECTING - pode ser primeira tentativa real
  // if (initialState === WhatsAppState.CONNECTING) {
  //   logger.warn(`⚠️ [START-SESSION] Sessão ${whatsapp.name} já está CONNECTING no SessionManager. Ignorando duplicata.`);
  //   return;
  // }
  
  
  if (initialState === WhatsAppState.CONNECTED) {
    return;
  }
  
  // 🧠 TIMEOUT INTELIGENTE: Baseado no estado atual
  const currentState = sessionManager.getState(whatsapp.id);
  const isFailedBefore = currentState === WhatsAppState.FAILED;
  const smartTimeout = isFailedBefore ? 4000 : STARTING_TIMEOUT; // 4s se estava FAILED, 6s normal
  
  
  const timeoutHandle = setTimeout(async () => {
    logger.error(`Timeout de inicialização para ${whatsapp.name}: ${smartTimeout}ms`);
    
    // ⚡ OTIMIZAÇÃO: Usar smart cleanup do SessionManager
    try {
      await sessionManager.smartCleanup(whatsapp.id, 'start_session_timeout');
    } catch (error) {
      logger.error(`Erro ao fazer cleanup após timeout: ${error.message}`);
    }
  }, smartTimeout);
  
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
      }
    } catch (err) {
      logger.error(`Erro ao iniciar sessão ${whatsapp.name}: ${err.message}`);
      Sentry.captureException(err);
      throw err;
    }
  } finally {
    // ⚡ OTIMIZAÇÃO: Limpar timeout e sinalizar conclusão para SessionManager
    clearTimeout(timeoutHandle);
    
  }
};
