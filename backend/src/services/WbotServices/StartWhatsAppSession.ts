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
  // 🏷️ ID único para rastrear esta instância
  const sessionId = `${whatsapp.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  logger.info(`🚀 [START-SESSION-${sessionId}] INICIANDO para ${whatsapp.name}`);

  // ⚡ OTIMIZAÇÃO: Usar SessionManager como fonte única de verdade
  const initialState = sessionManager.getState(whatsapp.id);
  
  // ⚠️ REMOVIDO: Não ignorar quando CONNECTING - pode ser primeira tentativa real
  // if (initialState === WhatsAppState.CONNECTING) {
  //   logger.warn(`⚠️ [START-SESSION] Sessão ${whatsapp.name} já está CONNECTING no SessionManager. Ignorando duplicata.`);
  //   return;
  // }
  
  logger.info(`🔄 [START-SESSION-${sessionId}] Estado atual: ${initialState} - prosseguindo com inicialização`);
  
  if (initialState === WhatsAppState.CONNECTED) {
    logger.info(`ℹ️ [START-SESSION] Sessão ${whatsapp.name} já está CONNECTED. Nada a fazer.`);
    return;
  }
  
  // 🧠 TIMEOUT INTELIGENTE: Baseado no estado atual
  const currentState = sessionManager.getState(whatsapp.id);
  const isFailedBefore = currentState === WhatsAppState.FAILED;
  const smartTimeout = isFailedBefore ? 4000 : STARTING_TIMEOUT; // 4s se estava FAILED, 6s normal
  
  logger.info(`⏰ [START-SESSION-${sessionId}] Timeout inteligente: ${smartTimeout}ms (failed before: ${isFailedBefore})`);
  
  const timeoutHandle = setTimeout(async () => {
    logger.error(`❌ [START-SESSION-${sessionId}] Timeout de inicialização para ${whatsapp.name} (${smartTimeout}ms, wasFailed: ${isFailedBefore}). Limpando automaticamente.`);
    
    // ⚡ OTIMIZAÇÃO: Usar smart cleanup do SessionManager
    try {
      await sessionManager.smartCleanup(whatsapp.id, 'start_session_timeout');
      logger.info(`✅ [START-SESSION] Cleanup por timeout concluído para ${whatsapp.name}`);
    } catch (error) {
      logger.error(`❌ [START-SESSION] Erro ao fazer cleanup após timeout: ${error.message}`);
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
      console.log(`🚀 [BAILEYS] Chamando initWASocket para ${whatsapp.name} - sessão atual: "${whatsapp.session}"`);
      const wbot = await initWASocket(whatsapp);
      console.log(`✅ [BAILEYS] initWASocket retornou para ${whatsapp.name}`);
     
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
    // ⚡ OTIMIZAÇÃO: Limpar timeout e sinalizar conclusão para SessionManager
    clearTimeout(timeoutHandle);
    
    logger.info(`✅ [START-SESSION-${sessionId}] Processo concluído para ${whatsapp.name} - SessionManager state: ${sessionManager.getState(whatsapp.id)}`);
  }
};
