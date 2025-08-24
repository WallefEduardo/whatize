import { join } from "path";
import fs from "fs";
import Contact from "../../models/Contact";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import AppError from "../../errors/AppError";

const DeleteContactService = async (id: string): Promise<void> => {
  const contact = await Contact.findOne({
    where: { id }
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  // Remove WhatsappLidMap órfãos para evitar referências mortas
  await WhatsappLidMap.destroy({
    where: { 
      contactId: contact.id,
      companyId: contact.companyId
    }
  });

  // Remove arquivos de mídia do contato (igual ao Ticketz)
  const publicFolder = join(__dirname, "..", "..", "..", "public");
  const contactMediaPath = join(publicFolder, `company${contact.companyId}`, "contacts", contact.id.toString());

  // Recursively remove contact media folder
  try {
    fs.rmSync(contactMediaPath, { recursive: true, force: true });
  } catch (error) {
    // Ignora erro se pasta não existe
  }

  await contact.destroy();
};

export default DeleteContactService;
