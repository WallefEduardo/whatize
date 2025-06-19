import { getIO } from "../../libs/socket";
import CompaniesSettings from "../../models/CompaniesSettings";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import fs from "fs";
import path, { join } from "path";
import logger from "../../utils/logger";
import { isNil } from "lodash";
import Whatsapp from "../../models/Whatsapp";
import * as Sentry from "@sentry/node";
import { Mutex } from "async-mutex";
import raceConditionLogger from "../../utils/raceConditionLogger";
import contactCache from "../../libs/contactCache";

const axios = require('axios');

// Mutex map para controlar criação de contatos por número+companyId
const contactMutexes = new Map<string, Mutex>();

const getMutex = (number: string, companyId: number): Mutex => {
  const key = `${number}-${companyId}`;
  if (!contactMutexes.has(key)) {
    contactMutexes.set(key, new Mutex());
  }
  return contactMutexes.get(key)!;
};

// Função para retry com backoff exponencial
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100,
  contactNumber?: string,
  companyId?: number
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Se é erro de constraint única e não é a última tentativa
      if (error.name === 'SequelizeUniqueConstraintError' && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        
        if (contactNumber && companyId) {
          raceConditionLogger.logRetryAttempt(
            contactNumber,
            companyId,
            attempt + 1,
            error.message
          );
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  channel?: string;
  extraInfo?: ExtraInfo[];
  remoteJid?: string;
  whatsappId?: number;
  wbot?: any;
}

import { isPlaceholderUrl, isValidImageUrl, generateImageFilename, IMAGE_CONFIG } from "../../config/images";
import imageDownloadLogger from "../../utils/imageDownloadLogger";

/**
 * Cria o diretório de imagens se não existir
 */
const ensureImageDirectory = (companyId: number): string => {
  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
  const folder = path.resolve(publicFolder, `company${companyId}`, "contacts");

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    fs.chmodSync(folder, 0o777);
  }

  return folder;
};

/**
 * Baixa a imagem de perfil do contato
 * Retorna o nome do arquivo salvo ou null em caso de erro
 */
const downloadProfileImage = async ({
  profilePicUrl,
  companyId,
  contact
}): Promise<string | null> => {
  if (!profilePicUrl || !isValidImageUrl(profilePicUrl)) {
    return null;
  }

  // Se é uma URL de placeholder, não tentar baixar
  if (isPlaceholderUrl(profilePicUrl)) {
    imageDownloadLogger.logPlaceholderSkipped(profilePicUrl, contact?.id || 'N/A', companyId);
    return null;
  }

  const folder = ensureImageDirectory(companyId);

  // Implementar retry com backoff
  for (let attempt = 1; attempt <= IMAGE_CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.get(profilePicUrl, {
        responseType: 'arraybuffer',
        timeout: IMAGE_CONFIG.DOWNLOAD_TIMEOUT,
        validateStatus: (status) => status < 400,
        headers: {
          'User-Agent': IMAGE_CONFIG.USER_AGENT
        },
        maxContentLength: IMAGE_CONFIG.MAX_FILE_SIZE
      });

      const filename = generateImageFilename();
      const filePath = join(folder, filename);
      
      fs.writeFileSync(filePath, response.data);
      
      // Log de sucesso apenas no arquivo
      imageDownloadLogger.logSuccess({
        url: profilePicUrl,
        contactId: contact?.id || 'N/A',
        companyId,
        filename,
        attempt,
        fileSize: response.data.length
      });
      
      return filename;

    } catch (error) {
      const isLastAttempt = attempt === IMAGE_CONFIG.RETRY.MAX_ATTEMPTS;
      
      const errorDetails = {
        attempt,
        maxAttempts: IMAGE_CONFIG.RETRY.MAX_ATTEMPTS,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: profilePicUrl,
        contactId: contact?.id || 'N/A',
        companyId
      };

      // Log do erro
      imageDownloadLogger.logError({
        url: profilePicUrl,
        contactId: contact?.id || 'N/A',
        companyId,
        error: {
          status: error.response?.status,
          message: error.message,
          code: error.code
        },
        attempt,
        maxAttempts: IMAGE_CONFIG.RETRY.MAX_ATTEMPTS
      });

      if (isLastAttempt) {
        console.error(`❌ Falha final ao baixar imagem (${attempt}/${IMAGE_CONFIG.RETRY.MAX_ATTEMPTS}):`, errorDetails);
        
        // Alertas específicos para diferentes tipos de erro
        if (error.response?.status === 502) {
          console.warn(`🚨 Erro 502 (Bad Gateway) - Possível problema de infraestrutura no servidor de imagens`);
        } else if (error.response?.status === 403) {
          console.warn(`🚨 Erro 403 (Forbidden) - Acesso negado à imagem`);
        } else if (error.response?.status === 404) {
          console.warn(`🚨 Erro 404 (Not Found) - Imagem não encontrada`);
        } else if (error.code === 'ECONNABORTED') {
          console.warn(`🚨 Timeout - Servidor demorou mais de ${IMAGE_CONFIG.DOWNLOAD_TIMEOUT}ms para responder`);
        }
        
        return null;
      } else {
        // Retry silencioso - log apenas no arquivo
        await new Promise(resolve => setTimeout(resolve, IMAGE_CONFIG.RETRY.DELAY_MS * attempt));
      }
    }
  }

  return null;
};

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  channel = "whatsapp",
  companyId,
  extraInfo = [],
  remoteJid = "",
  whatsappId,
  wbot
}: Request): Promise<Contact> => {
  const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");
  const mutex = getMutex(number, companyId);
  const startTime = Date.now();

  // Log da tentativa de criação/atualização
  raceConditionLogger.logContactCreation(
    number,
    companyId,
    'CREATE', // Será atualizado depois
    'MESSAGE', // Será atualizado se necessário
    whatsappId,
    { name, isGroup, channel, remoteJid }
  );

  return await mutex.runExclusive(async () => {
    const mutexWaitTime = Date.now() - startTime;
    
    if (mutexWaitTime > 100) { // Log apenas se esperou mais de 100ms
      raceConditionLogger.logMutexWait(number, companyId, mutexWaitTime, whatsappId);
    }

    try {
      return await retryWithBackoff(async () => {
        let createContact = false;
        const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
        const io = getIO();
        let contact: Contact | null;

        // Primeiro tenta buscar no cache
        contact = await contactCache.findOrFetch(number, companyId);

        let updateImage = (!contact || contact?.profilePicUrl !== profilePicUrl && profilePicUrl !== "") && wbot || false;

        if (contact) {
      contact.remoteJid = remoteJid;
      contact.profilePicUrl = profilePicUrl || null;
      contact.isGroup = isGroup;
      if (isNil(contact.whatsappId)) {
        const whatsapp = await Whatsapp.findOne({
          where: { id: whatsappId, companyId }
        });



        if (whatsapp) {
          contact.whatsappId = whatsappId;
        }
      }
      const folder = path.resolve(publicFolder, `company${companyId}`, "contacts");

      let fileName, oldPath = "";
      if (contact.urlPicture) {
        

        oldPath = path.resolve(contact.urlPicture.replace(/\\/g, '/'));
        fileName = path.join(folder, oldPath.split('\\').pop());
      }
      if (!fs.existsSync(fileName) || contact.profilePicUrl === "") {
        if (wbot && ['whatsapp'].includes(channel)) {
          try {
    
            profilePicUrl = await wbot.profilePictureUrl(remoteJid, "image");
          } catch (e) {
            Sentry.captureException(e);
            profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
          }
          contact.profilePicUrl = profilePicUrl;
          updateImage = true;
        }
      }

      if (contact.name === number) {
        contact.name = name;
      }

      await contact.save(); // Ensure save() is called to trigger updatedAt
      await contact.reload();

    } else if (wbot && ['whatsapp'].includes(channel)) {
      const settings = await CompaniesSettings.findOne({ where: { companyId } });
      const { acceptAudioMessageContact } = settings;
      let newRemoteJid = remoteJid;

      if (!remoteJid && remoteJid !== "") {
        newRemoteJid = isGroup ? `${rawNumber}@g.us` : `${rawNumber}@s.whatsapp.net`;
      }

      try {
        profilePicUrl = await wbot.profilePictureUrl(remoteJid, "image");
      } catch (e) {
        Sentry.captureException(e);
        profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
      }

      contact = await Contact.create({
        name,
        number,
        email,
        isGroup,
        companyId,
        channel,
        acceptAudioMessage: acceptAudioMessageContact === 'enabled' ? true : false,
        remoteJid: newRemoteJid,
        profilePicUrl,
        urlPicture: "",
        whatsappId
      });

      createContact = true;
    } else if (['facebook', 'instagram'].includes(channel)) {
      contact = await Contact.create({
        name,
        number,
        email,
        isGroup,
        companyId,
        channel,
        profilePicUrl,
        urlPicture: "",
        whatsappId
      });
    }



    if (updateImage) {
      let filename = await downloadProfileImage({
        profilePicUrl,
        companyId,
        contact
      });

      // Só atualizar se conseguiu baixar a imagem
      if (filename) {
        await contact.update({
          urlPicture: filename,
          pictureUpdated: true
        });
        await contact.reload();
      } else {
        // Se falhou ao baixar, manter o estado atual mas marcar como tentado
        console.warn(`⚠️ Falha ao baixar imagem para contato ${contact.id}`);
      }
    } else {
      if (['facebook', 'instagram'].includes(channel)) {
        let filename = await downloadProfileImage({
          profilePicUrl,
          companyId,
          contact
        });

        // Só atualizar se conseguiu baixar a imagem
        if (filename) {
          await contact.update({
            urlPicture: filename,
            pictureUpdated: true
          });
          await contact.reload();
        } else {
          console.warn(`⚠️ Falha ao baixar imagem para contato ${contact.id} (${channel})`);
        }
      }
    }

    if (createContact) {
      io.of(String(companyId))
        .emit(`company-${companyId}-contact`, {
          action: "create",
          contact
        });
    } else {
      
      io.of(String(companyId))
        .emit(`company-${companyId}-contact`, {
          action: "update",
          contact
        });
        
    }

        // Atualiza o cache com o contato final
        contactCache.set(contact);

        // Log do sucesso
        raceConditionLogger.logContactCreation(
          number,
          companyId,
          createContact ? 'CREATE' : 'UPDATE',
          'MESSAGE',
          whatsappId,
          { finalName: contact.name, contactId: contact.id }
        );

        return contact;
      }, 3, 100, number, companyId); // retryWithBackoff
    } catch (err) {
      // Log do erro
      raceConditionLogger.logConstraintError(
        number,
        companyId,
        err.message,
        whatsappId,
        { name, isGroup, channel, remoteJid }
      );
      
      logger.error("Error to find or create a contact:", err);
      throw err;
    }
  }); // mutex.runExclusive
};

export default CreateOrUpdateContactService;
