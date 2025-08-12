import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import cacheLayer from "../../libs/cache";
import logger from "../../utils/logger";

const GetProfilePicUrl = async (
  number: string,
  companyId: number,
  contact?: Contact,
  wbot?: any
): Promise<string> => {
  try {
    // Se já é um JID completo, usa como está
    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
    
    // Tenta buscar do cache primeiro
    const cacheKey = `profilepic:${companyId}:${jid}`;
    const cached = await cacheLayer.get(cacheKey);
    if (cached) {
      logger.info(`📷 [PROFILE-PIC] Foto encontrada no cache para ${jid}`);
      return cached;
    }

    // Se não foi passado wbot, busca o padrão (mas com cuidado)
    if (!wbot) {
      const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
      if (!defaultWhatsapp) {
        logger.warn(`📷 [PROFILE-PIC] Sem WhatsApp padrão para company ${companyId}`);
        return `${process.env.FRONTEND_URL}/nopicture.png`;
      }
      wbot = getWbot(defaultWhatsapp.id);
    }

    // Verifica se o wbot está conectado
    if (!wbot || !wbot.user) {
      logger.warn(`📷 [PROFILE-PIC] WhatsApp não conectado para buscar foto de ${jid}`);
      return `${process.env.FRONTEND_URL}/nopicture.png`;
    }

    let profilePicUrl: string;
    try {
      // Usa timeout para evitar travamento
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );
      
      const picPromise = wbot.profilePictureUrl(jid, "preview");
      
      profilePicUrl = await Promise.race([picPromise, timeoutPromise]) as string;
      
      if (profilePicUrl) {
        // Salva no cache por 5 dias
        await cacheLayer.set(cacheKey, profilePicUrl, "EX", 60 * 60 * 24 * 5);
        logger.info(`📷 [PROFILE-PIC] Foto obtida e cacheada para ${jid}`);
      }
    } catch (error) {
      logger.debug(`📷 [PROFILE-PIC] Erro ao buscar foto de ${jid}: ${error.message}`);
      profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
    }

    return profilePicUrl || `${process.env.FRONTEND_URL}/nopicture.png`;
  } catch (error) {
    logger.error(`📷 [PROFILE-PIC] Erro geral: ${error.message}`);
    return `${process.env.FRONTEND_URL}/nopicture.png`;
  }
};

export default GetProfilePicUrl;
