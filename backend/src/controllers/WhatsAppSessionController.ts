import { Request, Response } from "express";
import { getWbot } from "../libs/wbot";
import { getIO } from "../libs/socket";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import cacheLayer from "../libs/cache";
import Whatsapp from "../models/Whatsapp";

const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  console.log("🎯 WhatsAppSessionController.store called - whatsappId:", whatsappId, "companyId:", companyId);
  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
  console.log("📱 WhatsApp found:", whatsapp?.name, "Status:", whatsapp?.status);
  
  await StartWhatsAppSession(whatsapp, companyId);

  return res.status(200).json({ message: "Starting session." });
};

const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  // const { whatsapp } = await UpdateWhatsAppService({
  //   whatsappId,
  //   companyId,
  //   whatsappData: { session: "", requestQR: true }
  // });
  const whatsapp = await Whatsapp.findOne({ where: { id: whatsappId, companyId } });

  await whatsapp.update({ session: "" });
  
  if (whatsapp.channel === "whatsapp") {
    await StartWhatsAppSession(whatsapp, companyId);
  }

  return res.status(200).json({ message: "Starting session." });
};

const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  console.log(`🧹 [DISCONNECT] Iniciando limpeza completa para WhatsApp: ${whatsapp.name} (ID: ${whatsappId})`);

  if (whatsapp.channel === "whatsapp") {
    // 1. Remover dados da tabela Baileys (contacts, chats)
    await DeleteBaileysService(whatsappId);
    console.log(`✅ [DISCONNECT] Baileys data cleaned`);

    // 2. Fechar socket se existir
    try {
      const wbot = getWbot(whatsapp.id);
      wbot.logout();
      wbot.ws.close();
      console.log(`✅ [DISCONNECT] Socket disconnected`);
    } catch (error) {
      console.log(`⚠️ [DISCONNECT] No active socket found or error closing:`, error.message);
    }

    // 3. 🎯 NOVA FUNCIONALIDADE: Limpar TODAS as credenciais do cache Redis
    try {
      console.log(`🧹 [DISCONNECT] Limpando credenciais do cache Redis...`);
      
      // Limpar TODAS as keys de sessão para este whatsappId
      const sessionPattern = `sessions:${whatsappId}:*`;
      await cacheLayer.delFromPattern(sessionPattern);
      console.log(`✅ [DISCONNECT] Todas as credenciais removidas do cache (sessions:${whatsappId}:*)`);
      
    } catch (error) {
      console.error(`❌ [DISCONNECT] Erro ao limpar cache:`, error);
    }

    // 4. 🎯 NOVA FUNCIONALIDADE: Limpar campo 'session' da tabela WhatsApp
    try {
      console.log(`🧹 [DISCONNECT] Limpando campo session do banco...`);
      await whatsapp.update({
        session: "",
        qrcode: "",
        status: "DISCONNECTED",
        retries: 0
      });
      console.log(`✅ [DISCONNECT] Campo session limpo do banco`);
      
    } catch (error) {
      console.error(`❌ [DISCONNECT] Erro ao limpar session do banco:`, error);
    }
  }

  console.log(`🎉 [DISCONNECT] Limpeza completa finalizada para WhatsApp ID: ${whatsappId}`);
  return res.status(200).json({ message: "Session disconnected and fully cleaned." });
};

export default { store, remove, update };
