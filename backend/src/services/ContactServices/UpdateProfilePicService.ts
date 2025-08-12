import Contact from "../../models/Contact";
import GetProfilePicUrl from "../WbotServices/GetProfilePicUrl";
import { getWbot } from "../../libs/wbot";
import logger from "../../utils/logger";

interface Request {
  contactId: number;
  companyId: number;
}

const UpdateProfilePicService = async ({
  contactId,
  companyId
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

    // Busca a foto (com cache)
    const profilePicUrl = await GetProfilePicUrl(
      contact.number,
      companyId,
      contact,
      wbot
    );

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