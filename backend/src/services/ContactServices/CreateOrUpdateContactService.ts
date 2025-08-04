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
 * Tenta download direto com fetch nativo do Node.js para URLs específicas do WhatsApp
 */
const downloadWithFetch = async (url: string): Promise<Buffer> => {
  const https = require('https');
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Connection': 'keep-alive'
      },
      timeout: 30000
    };

    const req = protocol.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
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
      let responseData: Buffer;
      
      try {
        // Primeiro tenta com axios
        const response = await axios.get(profilePicUrl, {
          responseType: 'arraybuffer',
          timeout: IMAGE_CONFIG.DOWNLOAD_TIMEOUT,
          validateStatus: (status) => status < 400,
          headers: {
            'User-Agent': IMAGE_CONFIG.USER_AGENT,
            'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Referer': 'https://web.whatsapp.com/',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site'
          },
          maxContentLength: IMAGE_CONFIG.MAX_FILE_SIZE,
          maxRedirects: 5,
          httpAgent: false,
          httpsAgent: false
        });
        
        responseData = Buffer.from(response.data);
        
      } catch (axiosError) {
        // Se axios falhar, tenta com fetch nativo
        responseData = await downloadWithFetch(profilePicUrl);
      }

      const filename = generateImageFilename();
      const filePath = join(folder, filename);
      
      fs.writeFileSync(filePath, responseData);
      
      // Log de sucesso apenas no arquivo
      imageDownloadLogger.logSuccess({
        url: profilePicUrl,
        contactId: contact?.id || 'N/A',
        companyId,
        filename,
        attempt,
        fileSize: responseData.length
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
        return null;
      } else {
        // Retry com delay progressivo
        const delay = IMAGE_CONFIG.RETRY.DELAY_MS * attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
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
        console.log("🔍 ETAPA 4 DEBUG - Iniciando CreateOrUpdateContactService:", {
          name,
          number,
          profilePicUrl: profilePicUrl?.substring(0, 50) + "...",
          isGroup,
          companyId,
          channel,
          whatsappId,
          remoteJid
        });

        let createContact = false;
        const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
        const io = getIO();
        let contact: Contact | null;

        // Primeiro tenta buscar no cache
        console.log("🔍 ULTRA DEBUG 1 - Buscando no cache:", { number, companyId });
        contact = await contactCache.findOrFetch(number, companyId);
        console.log("🔍 ULTRA DEBUG 2 - Resultado do cache:", {
          contactExists: !!contact,
          contactId: contact?.id,
          contactType: typeof contact
        });

        let updateImage = (!contact || contact?.profilePicUrl !== profilePicUrl && profilePicUrl !== "") && wbot || false;

        console.log("🔍 ULTRA DEBUG 3 - Avaliando fluxos:", {
          contactExists: !!contact,
          channel,
          wbotExists: !!wbot,
          isWhatsappChannel: channel === 'whatsapp',
          willEnterContactUpdateFlow: !!contact,
          willEnterWhatsappCreateFlow: !contact && wbot && ['whatsapp'].includes(channel)
        });

        if (contact) {
          console.log("🔍 ULTRA DEBUG 4 - ENTRANDO no fluxo de ATUALIZAÇÃO de contato existente");
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
            // Se já temos uma URL válida do WhatsApp, não sobrescrever
            if (!profilePicUrl || profilePicUrl.includes('nopicture.png')) {
              profilePicUrl = await wbot.profilePictureUrl(remoteJid, "image");
            }
          } catch (e) {
            Sentry.captureException(e);
            // Só define placeholder se não tínhamos uma URL válida antes
            if (!profilePicUrl || profilePicUrl.includes('nopicture.png')) {
              profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
            }
          }
          contact.profilePicUrl = profilePicUrl;
          updateImage = true;
        }
      }

      if (contact.name === number) {
        contact.name = name;
      }

      if (typeof contact.save === 'function') {
        await contact.save(); // Ensure save() is called to trigger updatedAt
        await contact.reload();
      } else {
        // Se contact não é uma instância Sequelize, busca novamente
        contact = await Contact.findByPk(contact.id);
        if (contact) {
          await contact.update({ name, profilePicUrl });
        }
      }

    } else if (wbot && ['whatsapp'].includes(channel)) {
      console.log("🔍 ULTRA DEBUG 5 - ENTRANDO no fluxo de CRIAÇÃO WhatsApp");
      const settings = await CompaniesSettings.findOne({ where: { companyId } });
      const { acceptAudioMessageContact } = settings;
      let newRemoteJid = remoteJid;

      if (!remoteJid || remoteJid === "") {
        // 🚀 CORREÇÃO CRÍTICA: Para LID, usar o rawNumber direto (já tem @lid)
        if (rawNumber.includes('@lid')) {
          newRemoteJid = rawNumber; // LID já vem com @lid, não adicionar @s.whatsapp.net
        } else {
          newRemoteJid = isGroup ? `${rawNumber}@g.us` : `${rawNumber}@s.whatsapp.net`;
        }
        console.log("🔍 ULTRA DEBUG 5.1 - remoteJid vazio, construindo newRemoteJid:", {
          rawNumber,
          isGroup,
          isLid: rawNumber.includes('@lid'),
          newRemoteJid
        });
      }

      console.log("🔍 ULTRA DEBUG 6 - Configurações para criação:", {
        settings: !!settings,
        acceptAudioMessageContact,
        newRemoteJid,
        originalRemoteJid: remoteJid
      });

      console.log("🔍 ULTRA DEBUG 6.1 - Tentando buscar profilePicUrl:", {
        currentProfilePicUrl: profilePicUrl,
        remoteJid,
        newRemoteJid,
        shouldFetchProfilePic: !profilePicUrl || profilePicUrl.includes('nopicture.png'),
        remoteJidIsEmpty: !remoteJid,
        newRemoteJidIsEmpty: !newRemoteJid
      });

      try {
        // Se já temos uma URL válida do WhatsApp, não sobrescrever
        if (!profilePicUrl || profilePicUrl.includes('nopicture.png')) {
          // 🚀 CORREÇÃO: Usar newRemoteJid se remoteJid estiver vazio
          const jidToUse = remoteJid || newRemoteJid;
          
          if (jidToUse) {
            console.log("🔍 ULTRA DEBUG 6.2 - Buscando foto do perfil com JID:", jidToUse);
            profilePicUrl = await wbot.profilePictureUrl(jidToUse, "image");
            console.log("🔍 ULTRA DEBUG 6.3 - Foto do perfil obtida com sucesso");
          } else {
            console.log("🔍 ULTRA DEBUG 6.4 - Nenhum JID válido, usando placeholder");
            profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
          }
        }
      } catch (e) {
        console.log("🔍 ULTRA DEBUG 6.5 - Erro ao buscar foto, usando placeholder:", e.message);
        Sentry.captureException(e);
        // Só define placeholder se não tínhamos uma URL válida antes
        if (!profilePicUrl || profilePicUrl.includes('nopicture.png')) {
          profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
        }
      }

      console.log("🔍 ULTRA DEBUG 7 - CHAMANDO Contact.create com dados:", {
        name,
        number,
        email,
        isGroup,
        companyId,
        channel,
        acceptAudioMessage: acceptAudioMessageContact === 'enabled' ? true : false,
        remoteJid: newRemoteJid,
        profilePicUrl: profilePicUrl?.substring(0, 50) + "...",
        whatsappId
      });

      try {
        console.log("🔍 ULTRA DEBUG 7.1 - Iniciando Contact.create...");
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
        console.log("🔍 ULTRA DEBUG 7.2 - Contact.create executado com sucesso");
      } catch (createError) {
        console.error("🚨 ULTRA DEBUG 7.3 - ERRO no Contact.create:", {
          errorMessage: createError.message,
          errorName: createError.name,
          errorStack: createError.stack,
          sqlMessage: createError.sql,
          sqlErrorCode: createError.errno,
          contactData: { name, number, email, isGroup, companyId, channel, whatsappId }
        });
        throw createError;
      }

      console.log("🔍 ULTRA DEBUG 8 - Contact.create CONCLUÍDO:", {
        contactExists: !!contact,
        contactId: contact?.id,
        contactNumber: contact?.number,
        contactName: contact?.name
      });

      createContact = true;
    } else if (['facebook', 'instagram'].includes(channel)) {
      console.log("🔍 ULTRA DEBUG 9 - ENTRANDO no fluxo de CRIAÇÃO Facebook/Instagram");
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
      console.log("🔍 ULTRA DEBUG 10 - Contact.create Facebook/Instagram CONCLUÍDO:", {
        contactExists: !!contact,
        contactId: contact?.id
      });
    } else {
      console.error("🚨 ULTRA DEBUG 11 - CRÍTICO: NENHUM FLUXO FOI EXECUTADO!", {
        channel,
        wbotExists: !!wbot,
        contactExists: !!contact,
        isWhatsappChannel: channel === 'whatsapp',
        isFacebookChannel: channel === 'facebook',
        isInstagramChannel: channel === 'instagram',
        allVariables: { name, number, email, isGroup, companyId, channel, whatsappId }
      });
      throw new Error(`No valid flow executed for channel: ${channel}, wbot: ${!!wbot}`);
    }



    if (updateImage) {
      // Só tentar download se for uma URL válida do WhatsApp
      if (profilePicUrl && 
          !profilePicUrl.includes('nopicture.png') &&
          (profilePicUrl.includes('whatsapp.net') || profilePicUrl.includes('pps.whatsapp.net'))) {
        
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
        }
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

        // LOGS DETALHADOS antes do cache
        console.log("🔍 ETAPA 4 DEBUG - Antes de contactCache.set:", {
          contactExists: !!contact,
          contactType: typeof contact,
          contactId: contact?.id,
          contactNumber: contact?.number,
          contactName: contact?.name,
          isNull: contact === null,
          isUndefined: contact === undefined,
          hasNumberProperty: contact && 'number' in contact
        });

        // Verificação crítica antes de set no cache
        if (!contact) {
          console.error("🚨 ETAPA 4 DEBUG - CRÍTICO: contact é NULL antes de cache.set!");
          throw new Error("Contact is null before cache.set - this should never happen");
        }

        if (!contact.number) {
          console.error("🚨 ETAPA 4 DEBUG - CRÍTICO: contact.number é NULL/UNDEFINED!", {
            contact,
            contactKeys: Object.keys(contact || {}),
            numberValue: contact.number
          });
          throw new Error("Contact.number is null/undefined - cannot cache");
        }

        // Atualiza o cache com o contato final
        console.log("🔍 ETAPA 4 DEBUG - Chamando contactCache.set...");
        contactCache.set(contact);
        console.log("🔍 ETAPA 4 DEBUG - contactCache.set concluído com sucesso");

        // Log do sucesso
        raceConditionLogger.logContactCreation(
          number,
          companyId,
          createContact ? 'CREATE' : 'UPDATE',
          'MESSAGE',
          whatsappId,
          { finalName: contact.name, contactId: contact.id }
        );

        console.log("🔍 ETAPA 4 DEBUG - RETORNANDO contato:", {
          contactId: contact.id,
          contactNumber: contact.number,
          contactName: contact.name
        });

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
