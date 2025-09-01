import Contact from "../../models/Contact";
import GetProfilePicUrl from "../WbotServices/GetProfilePicUrl";
import { GetProfilePicUrlSmart } from "../WbotServices/GetOptimizedProfilePicUrl";
import { getWbot } from "../../libs/wbot";
import logger from "../../utils/logger";

interface Request {
  contactId: number;
  companyId: number;
  useOptimized?: boolean; // Feature flag
}

const UpdateProfilePicService = async ({
  contactId,
  companyId,
  useOptimized = true  // ✅ ATIVADO por padrão
}: Request): Promise<string> => {
  try {
    const contact = await Contact.findOne({
      where: {
        id: contactId,
        companyId
      }
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    // Não atualiza foto de grupos aqui
    if (contact.isGroup) {
      return contact.profilePicUrl || `${process.env.FRONTEND_URL}/nopicture.png`;
    }

    // Tenta obter um wbot conectado usando o whatsappId do contato
    let wbot;
    try {
      if (contact.whatsappId) {
        wbot = getWbot(contact.whatsappId);
      }
    } catch (error) {
      logger.debug(`📷 [UPDATE-PIC] Erro ao buscar wbot para contato ${contactId}: ${error.message}`);
    }

    // Busca a foto com sistema inteligente (otimizado ou original)
    const profilePicUrl = await GetProfilePicUrlSmart(
      contact.number,
      companyId,
      contact,
      wbot,
      useOptimized
    );

    // Log da escolha do sistema
    if (useOptimized) {
      logger.debug(`🚀 [UPDATE-PIC] Usando sistema otimizado para contato ${contactId}`);
    } else {
      logger.debug(`📷 [UPDATE-PIC] Usando sistema original para contato ${contactId}`);
    }

    // Só atualiza se mudou
    if (profilePicUrl && profilePicUrl !== contact.profilePicUrl && !profilePicUrl.includes("nopicture")) {
      await contact.update({ profilePicUrl });
      logger.info(`📷 [UPDATE-PIC] Foto atualizada para contato ${contactId}`);
    }

    return profilePicUrl;
  } catch (error) {
    logger.error(`📷 [UPDATE-PIC] Erro ao atualizar foto do contato ${contactId}: ${error.message}`);
    return `${process.env.FRONTEND_URL}/nopicture.png`;
  }
};

export default UpdateProfilePicService;