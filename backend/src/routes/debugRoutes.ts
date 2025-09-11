import { Router } from "express";
import isAuth from "../middleware/isAuth";
import { checkAllConnections } from "../libs/wbot";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import Whatsapp from "../models/Whatsapp";

const debugRoutes = Router();

// Rota para verificar status das conexões WhatsApp (sem auth para debug)
debugRoutes.get("/debug/connections", (req, res) => {
  try {
    console.log('🔍 [DEBUG] Verificação de conexões solicitada via API');
    checkAllConnections();
    
    res.json({ 
      message: "Status das conexões logado no console",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao verificar conexões:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para forçar logs de debug (sem auth para debug)
debugRoutes.post("/debug/trigger-logs", (req, res) => {
  try {
    console.log('\n🐛 [DEBUG-TRIGGER] Logs de debug forçados');
    console.log('🐛 Timestamp:', new Date().toISOString());
    console.log('🐛 Request IP:', req.ip);
    console.log('🐛 Debug triggered via API');
    
    res.json({ 
      message: "Logs de debug disparados",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao disparar logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para forçar reconexão do WhatsApp
debugRoutes.post("/debug/restart-whatsapp/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 [DEBUG] Forçando reconexão do WhatsApp ID: ${id}`);
    
    const whatsapp = await Whatsapp.findByPk(id);
    if (!whatsapp) {
      return res.status(404).json({ error: "WhatsApp não encontrado" });
    }
    
    // Limpar sessão atual se existir
    const { removeWbot, sessions } = await import("../libs/wbot");
    const sessionIndex = sessions.findIndex(s => s.id === parseInt(id));
    if (sessionIndex !== -1) {
      console.log(`🗑️ [DEBUG] Removendo sessão existente do ID: ${id}`);
      await removeWbot(parseInt(id), false);
    }
    
    // Atualizar status para forçar nova conexão
    await whatsapp.update({ status: "DISCONNECTED" });
    
    console.log(`🔄 [DEBUG] Iniciando nova sessão para: ${whatsapp.name} (Company: ${whatsapp.companyId})`);
    await StartWhatsAppSession(whatsapp, whatsapp.companyId);
    
    res.json({ 
      message: `Reconexão forçada para WhatsApp ${whatsapp.name}`,
      whatsappId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao reconectar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para limpeza completa e novo QR code
debugRoutes.post("/debug/clean-restart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🧹 [DEBUG] Limpeza completa do WhatsApp ID: ${id}`);
    
    const whatsapp = await Whatsapp.findByPk(id);
    if (!whatsapp) {
      return res.status(404).json({ error: "WhatsApp não encontrado" });
    }
    
    // 1. Remover todas as sessões
    const { removeWbot, sessions } = await import("../libs/wbot");
    const allSessions = sessions.filter(s => s.id === parseInt(id));
    for (const session of allSessions) {
      console.log(`🗑️ [DEBUG] Removendo sessão: ${session.id}`);
      await removeWbot(session.id, true); // Com logout
    }
    
    // 2. Limpar banco e cache
    await whatsapp.update({ 
      status: "DISCONNECTED", 
      session: "", 
      qrcode: "",
      retries: 0,
      number: ""
    });
    
    // 3. Limpar arquivos de auth (Baileys)
    const { default: DeleteBaileysService } = await import("../services/BaileysServices/DeleteBaileysService");
    await DeleteBaileysService(parseInt(id));
    
    // 4. Limpar cache Redis
    const cacheLayer = await import("../libs/cache");
    await cacheLayer.default.delFromPattern(`sessions:${id}:*`);
    
    console.log(`✅ [DEBUG] Limpeza completa concluída. Iniciando nova sessão...`);
    
    // 5. Aguardar 2 segundos e iniciar nova sessão
    setTimeout(async () => {
      const { StartWhatsAppSession } = await import("../services/WbotServices/StartWhatsAppSession");
      await StartWhatsAppSession(whatsapp, whatsapp.companyId);
    }, 2000);
    
    res.json({ 
      message: `Limpeza completa realizada para WhatsApp ${whatsapp.name}. Nova sessão será iniciada.`,
      whatsappId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro na limpeza:', error);
    res.status(500).json({ error: error.message });
  }
});

export default debugRoutes;