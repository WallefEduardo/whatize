import { Request, Response } from "express";
import { getWbot, cleanupWhatsAppSession } from "../libs/wbot";
import { getIO } from "../libs/socket";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import cacheLayer from "../libs/cache";
import Whatsapp from "../models/Whatsapp";
import { sessionManager, WhatsAppState } from "../libs/WhatsAppSessionManager";
import { performanceMonitor } from "../libs/PerformanceMonitor";
import logger from "../utils/logger";

const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  try {
    await sessionManager.connect(+whatsappId, companyId);
    return res.status(200).json({ 
      message: "Session started successfully.",
      state: sessionManager.getState(+whatsappId)
    });
    
  } catch (error) {
    
    // Retornar erro específico baseado no tipo
    let statusCode = 500;
    let message = "Failed to start session.";
    
    switch (error.message.includes('ALREADY_CONNECTING') ? 'ALREADY_CONNECTING' : 
           error.message.includes('ALREADY_CONNECTED') ? 'ALREADY_CONNECTED' :
           error.message.includes('CIRCUIT_BREAKER_OPEN') ? 'CIRCUIT_BREAKER_OPEN' :
           error.message.includes('RESOURCE_LIMIT_EXCEEDED') ? 'RESOURCE_LIMIT_EXCEEDED' : 'OTHER') {
      case 'ALREADY_CONNECTING':
        statusCode = 409;
        message = "Session is already connecting. Please wait.";
        break;
      case 'ALREADY_CONNECTED':
        statusCode = 409;
        message = "Session is already connected.";
        break;
      case 'CIRCUIT_BREAKER_OPEN':
        statusCode = 429;
        message = "Too many connection failures. Please wait before retrying.";
        break;
      case 'RESOURCE_LIMIT_EXCEEDED':
        statusCode = 503;
        message = "Connection limit exceeded. Please try again later.";
        break;
    }
    
    return res.status(statusCode).json({ 
      error: message,
      details: error.message,
      state: sessionManager.getState(+whatsappId)
    });
  }
};

const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  try {
    
    const whatsapp = await Whatsapp.findOne({ where: { id: whatsappId, companyId } });

    if (!whatsapp) {
      return res.status(404).json({ error: "WhatsApp connection not found." });
    }

    // Limpar sessão para gerar novo QR
    await whatsapp.update({ session: "" });
    
    // Limpar autenticação para gerar novo QR Code
    await cleanupWhatsAppSession(+whatsappId, 'disconnect');
    
    if (whatsapp.channel === "whatsapp") {
      sessionManager.connect(+whatsappId, companyId).catch(error => {
        logger.error(`Erro ao conectar via SessionManager: ${error.message}`);
      });
    }
    return res.status(200).json({ 
      message: "Starting session.", 
      whatsappId: whatsapp.id,
      state: sessionManager.getState(+whatsappId)
    });
    
  } catch (error) {
    logger.error(`❌ [UPDATE-CONTROLLER] Erro no update da sessão ${whatsappId}: ${error.message}`);
    return res.status(500).json({ 
      error: "Failed to start session.", 
      details: error.message 
    });
  }
};

const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  try {
    await sessionManager.disconnect(+whatsappId, companyId, { preserveSession: true });
    return res.status(200).json({ 
      message: "Session disconnected successfully.",
      state: sessionManager.getState(+whatsappId)
    });
    
  } catch (error) {
    
    return res.status(500).json({ 
      error: "Failed to disconnect session.",
      details: error.message,
      state: sessionManager.getState(+whatsappId)
    });
  }
};

// Nova rota para monitoramento e debugging
const stats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const sessionStats = sessionManager.getStats();
    const performanceStats = performanceMonitor.getMetrics();
    
    return res.status(200).json({
      success: true,
      data: {
        sessions: sessionStats,
        performance: performanceStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to get session stats",
      details: error.message
    });
  }
};

// Nova rota para relatório de performance detalhado
const performance = async (req: Request, res: Response): Promise<Response> => {
  try {
    const report = performanceMonitor.generateReport();
    const metrics = performanceMonitor.getMetrics();
    
    return res.status(200).json({
      success: true,
      report,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate performance report",
      details: error.message
    });
  }
};

// Nova rota para reset das métricas (útil para testes)
const resetMetrics = async (req: Request, res: Response): Promise<Response> => {
  try {
    performanceMonitor.reset();
    
    return res.status(200).json({
      success: true,
      message: "Performance metrics reset successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to reset metrics",
      details: error.message
    });
  }
};

export default { store, remove, update, stats, performance, resetMetrics };
