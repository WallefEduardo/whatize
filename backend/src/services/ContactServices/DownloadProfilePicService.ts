import fs from "fs";
import path from "path";
import axios from "axios";
import Contact from "../../models/Contact";
import logger from "../../utils/logger";

interface Request {
  contact: Contact;
  profilePicUrl: string;
}

const DownloadProfilePicService = async ({
  contact,
  profilePicUrl
}: Request): Promise<string | null> => {
  try {
    // Se não tem URL ou é nopicture, não baixar
    if (!profilePicUrl || profilePicUrl.includes("nopicture")) {
      return null;
    }

    // Criar diretório se não existir
    const publicFolder = path.join(__dirname, "..", "..", "..", "public");
    const companyDir = path.join(publicFolder, `company${contact.companyId}`);
    const contactsDir = path.join(companyDir, "contacts");
    
    if (!fs.existsSync(contactsDir)) {
      fs.mkdirSync(contactsDir, { recursive: true });
    }

    // Gerar nome do arquivo baseado no ID do contato
    const fileName = `${contact.id}_${Date.now()}.jpg`;
    const filePath = path.join(contactsDir, fileName);

    // Baixar a imagem
    const response = await axios({
      method: "GET",
      url: profilePicUrl,
      responseType: "stream",
      timeout: 10000,
      headers: {
        "User-Agent": "WhatsApp/2.23.0"
      }
    });

    // Salvar a imagem
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", async () => {
        logger.info(`📷 [DOWNLOAD-PIC] Imagem salva: ${fileName}`);
        
        // Deletar imagem antiga se existir
        if (contact.urlPicture && contact.urlPicture !== "nopicture.png") {
          const oldPath = path.join(contactsDir, contact.urlPicture);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            logger.info(`📷 [DOWNLOAD-PIC] Imagem antiga deletada: ${contact.urlPicture}`);
          }
        }
        
        resolve(fileName);
      });
      
      writer.on("error", (error) => {
        logger.error(`📷 [DOWNLOAD-PIC] Erro ao salvar imagem: ${error.message}`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        reject(error);
      });
    });
  } catch (error) {
    logger.error(`📷 [DOWNLOAD-PIC] Erro ao baixar imagem: ${error.message}`);
    return null;
  }
};

export default DownloadProfilePicService;