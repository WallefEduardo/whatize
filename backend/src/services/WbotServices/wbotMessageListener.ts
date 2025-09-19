import path, { join } from "path";
import { writeFile } from "fs/promises";
import fs, { readFile } from "fs";
import * as Sentry from "@sentry/node";
import { isNil, isNull } from "lodash";
import { REDIS_URI_MSG_CONN } from "../../config/redis";

import {
  downloadMediaMessage,
  extractMessageContent,
  getContentType,
  GroupMetadata,
  jidNormalizedUser,
  delay,
  MediaType,
  MessageUpsertType,
  proto,
  WAMessage,
  WAMessageStubType,
  WAMessageUpdate,
  WASocket,
  downloadContentFromMessage,
  AnyMessageContent,
  generateWAMessageContent,
  generateWAMessageFromContent
} from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import { Mutex } from "async-mutex";
import { getIO } from "../../libs/socket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import logger from "../../utils/logger";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { debounce } from "../../helpers/Debounce";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import formatBody from "../../helpers/Mustache";
import TicketTraking from "../../models/TicketTraking";
import UserRating from "../../models/UserRating";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import sendFaceMessage from "../FacebookServices/sendFacebookMessage";
import moment from "moment";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import raceConditionLogger from "../../utils/raceConditionLogger";
import contactCache from "../../libs/contactCache";
import CleanupOrphanDataService from "../MaintenanceService/CleanupOrphanDataService";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import Campaign from "../../models/Campaign";
import CampaignShipping from "../../models/CampaignShipping";
import { Op } from "sequelize";
import { campaignQueue, parseToMilliseconds, randomValue } from "../../queues";
import User from "../../models/User";
import { sayChatbot } from "./ChatBotListener";
import MarkDeleteWhatsAppMessage from "./MarkDeleteWhatsAppMessage";
import ListUserQueueServices from "../UserQueueServices/ListUserQueueServices";
import cacheLayer from "../../libs/cache";
import { addLogs } from "../../helpers/addLogs";
import SendWhatsAppMedia, { getMessageOptions } from "./SendWhatsAppMedia";

import ShowQueueIntegrationService from "../QueueIntegrationServices/ShowQueueIntegrationService";
import { createDialogflowSessionWithModel } from "../QueueIntegrationServices/CreateSessionDialogflow";
import { queryDialogFlow } from "../QueueIntegrationServices/QueryDialogflow";
import CompaniesSettings from "../../models/CompaniesSettings";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";

// Mutex para controle de concorrência  
const contactMutex = new Mutex();
import Whatsapp from "../../models/Whatsapp";
import { verifyContact, verifyContactTicketzCompat } from "./verifyContact";
import QueueIntegrations from "../../models/QueueIntegrations";
import ShowFileService from "../FileServices/ShowService";

import OpenAI from "openai";
import ffmpeg from "fluent-ffmpeg";
import {
  SpeechConfig,
  SpeechSynthesizer,
  AudioConfig
} from "microsoft-cognitiveservices-speech-sdk";
import typebotListener from "../TypebotServices/typebotListener";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import pino from "pino";
import BullQueues from "../../libs/queue";
import { Transform } from "stream";
import { msgDB } from "../../libs/wbot";
import { title } from "process";
import { FlowBuilderModel } from "../../models/FlowBuilder";
import { IConnections, INodes } from "../WebhookService/DispatchWebHookService";
import { FlowDefaultModel } from "../../models/FlowDefault";
import { ActionsWebhookService } from "../WebhookService/ActionsWebhookService";
import { WebhookModel } from "../../models/Webhook";
import { add, differenceInMilliseconds } from "date-fns";
import { FlowCampaignModel } from "../../models/FlowCampaign";
import {CheckSettings1, CheckCompanySetting} from "../../helpers/CheckSettings";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { json } from "body-parser";
import { is } from "bluebird";
import { sanitizeFileName } from "../../utils/sanitizeFileName";

const os = require("os");

const request = require("request");

// 🚨 PROTEÇÃO CRÍTICA: Função helper para envio seguro de presence (evita XML malformed em LID)
const safePresenceUpdate = async (wbot: any, type: string, jid: string) => {
  try {
    // 🚨 TEMPORARY FIX: sendPresenceUpdate está corrompendo XML stream - desabilitado completamente
    if (false && !jid.endsWith("@lid")) {
      await wbot.sendPresenceUpdate(type, jid);
      logger.debug(`📤 [PRESENCE] ${type} enviado para: ${jid}`);
    } else {
      logger.debug(`🛡️ [PRESENCE-PROTECTION] sendPresenceUpdate desabilitado para evitar XML corruption: ${jid}`);
    }
  } catch (error) {
    logger.error(`❌ [PRESENCE] Erro ao enviar ${type} para ${jid}: ${error.message}`);
  }
};


let i = 0;

setInterval(() => {
  i = 0
}, 5000);

type Session = WASocket & {
  id?: number;
};

interface ImessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
}

interface IMe {
  name: string;
  id: string;
}

interface SessionOpenAi extends OpenAI {
  id?: number;
}
const sessionsOpenAi: SessionOpenAi[] = [];

// writeFile já é uma Promise no Node.js moderno

function removeFile(directory) {
  fs.unlink(directory, (error) => {
    if (error) throw error;
  });
}

const getTimestampMessage = (msgTimestamp: any) => {
  return msgTimestamp * 1
}

const msgAdMetaPreview = (image, title, body, sourceUrl, messageUser) => {
  if (image) {
    var b64 = Buffer.from(image).toString("base64");

    let data = `data:image/png;base64, ${b64} | ${sourceUrl} | ${title} | ${body} | ${messageUser}`;
    return data;
  }
};

const multVecardGet = function (param: any) {
  let output = " "

  let name = param.split("\n")[2].replace(";;;", "\n").replace('N:', "").replace(";", "").replace(";", " ").replace(";;", " ").replace("\n", "")
  let inicio = param.split("\n")[4].indexOf('=')
  let fim = param.split("\n")[4].indexOf(':')
  let contact = param.split("\n")[4].substring(inicio + 1, fim).replace(";", "")
  let contactSemWhats = param.split("\n")[4].replace("item1.TEL:", "")

  if (contact != "item1.TEL") {
    output = output + name + ": 📞" + contact + "" + "\n"
  } else
    output = output + name + ": 📞" + contactSemWhats + "" + "\n"
  return output
}

const contactsArrayMessageGet = (msg: any,) => {
  let contactsArray = msg.message?.contactsArrayMessage?.contacts
  let vcardMulti = contactsArray.map(function (item, indice) {
    return item.vcard;
  });

  let bodymessage = ``
  vcardMulti.forEach(function (vcard, indice) {
    bodymessage += vcard + "\n\n" + ""
  })

  let contacts = bodymessage.split("BEGIN:")

  contacts.shift()
  let finalContacts = ""
  for (let contact of contacts) {
    finalContacts = finalContacts + multVecardGet(contact)
  }

  return finalContacts
}

const getTypeMessage = (msg: proto.IWebMessageInfo): string => {
  const msgType = getContentType(msg.message);
  if (msg.message?.extendedTextMessage && msg.message?.extendedTextMessage?.contextInfo && msg.message?.extendedTextMessage?.contextInfo?.externalAdReply) {
    return 'adMetaPreview'; // Adicionado para tratar mensagens de anúncios;
  }
  if (msg.message?.viewOnceMessageV2) {
    return "viewOnceMessageV2"
  }
  return msgType
};

const getSafeMessageId = (msg: proto.IWebMessageInfo): string => {
  if (msg.key.id) {
    return msg.key.id;
  }
  const timestamp = getTimestampMessage(msg.messageTimestamp);
  const remoteJid = msg.key.remoteJid || 'unknown';
  const fallbackId = `fallback_${timestamp}_${remoteJid}_${Date.now()}`;
  logger.warn(`getSafeMessageId: Generated fallback ID ${fallbackId} for message without key.id`);
  return fallbackId;
};

const getJidOf = (reference: string | Contact | Ticket): string => {
  console.log(`🔍 ETAPA 2 - getJidOf chamado com: { reference: '${reference}' }`);
  
  let address = reference;
  let isGroup = false;
  
  if (reference instanceof Contact) {
    isGroup = reference.isGroup;
    address = reference.number;
  } else if (reference instanceof Ticket) {
    isGroup = reference.isGroup;
    address = reference.contact.number;
  }

  if (typeof address !== "string") {
    throw new Error("Invalid reference type");
  }

  if (address.includes("@")) {
    console.log(`🔍 ETAPA 2 - getJidOf resultado (já tem @): ${address}`);
    return address;
  }

  const result = `${address}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
  console.log(`🔍 ETAPA 2 - getJidOf resultado (construído): ${result}`);
  return result;
};
const getAd = (msg: any): string => {
  if (msg.key.fromMe && msg.message?.listResponseMessage?.contextInfo?.externalAdReply) {
    let bodyMessage = `*${msg.message?.listResponseMessage?.contextInfo?.externalAdReply?.title}*`;

    bodyMessage += `\n\n${msg.message?.listResponseMessage?.contextInfo?.externalAdReply?.body}`;

    return bodyMessage;
  }
};

const getBodyButton = (msg: any): string => {
  try {
    if (msg?.messageType === "buttonsMessage" || msg?.message?.buttonsMessage?.contentText) {

      let bodyMessage = `[BUTTON]\n\n*${msg?.message?.buttonsMessage?.contentText}*\n\n`;
      // eslint-disable-next-line no-restricted-syntax
      for (const button of msg.message?.buttonsMessage?.buttons) {
        bodyMessage += `*${button.buttonId}* - ${button.buttonText.displayText}\n`;
      }

      return bodyMessage;
    }
    if (msg?.messageType === "listMessage" || msg?.message?.listMessage?.description) {
      let bodyMessage = `[LIST]\n\n*${msg?.message?.listMessage?.description}*\n\n`;
      // eslint-disable-next-line no-restricted-syntax
      for (const button of msg.message?.listMessage?.sections[0]?.rows) {
        bodyMessage += `${button.title}\n`;
      }

      return bodyMessage;
    }
  } catch (error) {
    logger.error(error);
  }
};

const msgLocation = (image, latitude, longitude) => {
  if (image) {
    var b64 = Buffer.from(image).toString("base64");

    let data = `data:image/png;base64, ${b64} | https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude} `;
    return data;
  }
};

export const getBodyMessage = (msg: proto.IWebMessageInfo): string | null => {
  try {
    let type = getTypeMessage(msg);

  

    const types = {
      conversation: msg.message?.conversation,
      imageMessage: msg.message?.imageMessage?.caption || "",
      videoMessage: msg.message?.videoMessage?.caption || "",
      extendedTextMessage: msg?.message?.extendedTextMessage?.text,
      buttonsResponseMessage: msg.message?.buttonsResponseMessage?.selectedDisplayText,
      listResponseMessage: msg.message?.listResponseMessage?.title || msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      templateButtonReplyMessage: msg.message?.templateButtonReplyMessage?.selectedId,
      messageContextInfo: msg.message?.buttonsResponseMessage?.selectedButtonId || msg.message?.listResponseMessage?.title,
      buttonsMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.title,
      stickerMessage: "sticker",
      contactMessage: msg.message?.contactMessage?.vcard,
      contactsArrayMessage: (msg.message?.contactsArrayMessage?.contacts) && contactsArrayMessageGet(msg),
      //locationMessage: `Latitude: ${msg.message.locationMessage?.degreesLatitude} - Longitude: ${msg.message.locationMessage?.degreesLongitude}`,
      locationMessage: msgLocation(msg.message?.locationMessage?.jpegThumbnail, msg.message?.locationMessage?.degreesLatitude, msg.message?.locationMessage?.degreesLongitude),
      liveLocationMessage: `Latitude: ${msg.message?.liveLocationMessage?.degreesLatitude} - Longitude: ${msg.message?.liveLocationMessage?.degreesLongitude}`,
      documentMessage: msg.message?.documentMessage?.caption || "",
      audioMessage: "Áudio",
      listMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.title,
      viewOnceMessage: getBodyButton(msg) || "",
      reactionMessage: msg.message?.reactionMessage?.text || "reaction",
      senderKeyDistributionMessage: msg?.message?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage,
      documentWithCaptionMessage: msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption || "",
      viewOnceMessageV2: msg.message?.viewOnceMessageV2?.message?.imageMessage?.caption || "",
      adMetaPreview: msgAdMetaPreview(
        msg.message?.extendedTextMessage?.contextInfo?.externalAdReply?.thumbnail,
        msg.message?.extendedTextMessage?.contextInfo?.externalAdReply?.title,
        msg.message?.extendedTextMessage?.contextInfo?.externalAdReply?.body,
        msg.message?.extendedTextMessage?.contextInfo?.externalAdReply?.sourceUrl,
        msg.message?.extendedTextMessage?.text
      ), // Adicionado para tratar mensagens de anúncios;
      editedMessage:
        msg?.message?.protocolMessage?.editedMessage?.conversation ||
        msg?.message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation,
      ephemeralMessage: msg.message?.ephemeralMessage?.message?.extendedTextMessage?.text,
      imageWhitCaptionMessage: msg?.message?.ephemeralMessage?.message?.imageMessage,
      highlyStructuredMessage: msg.message?.highlyStructuredMessage,
      protocolMessage: msg?.message?.protocolMessage?.editedMessage?.conversation,
      advertising: getAd(msg) || msg.message?.listResponseMessage?.contextInfo?.externalAdReply?.title,
    };

    const objKey = Object.keys(types).find(key => key === type);

    if (!objKey) {
      logger.warn(`#### Nao achou o type 152: ${type} ${JSON.stringify(msg.message)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, type });
      Sentry.captureException(
        new Error("Novo Tipo de Mensagem em getTypeMessage")
      );
    }

    // Para tipos de mídia conhecidos, retorna string vazia ao invés de "Mensagem não suportada"
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'documentWithCaptionMessage'];
    if (mediaTypes.includes(type) && !types[type]) {
      return "";
    }

    return types[type] || "Mensagem não suportada";
  } catch (error) {
    Sentry.setExtra("Error getTypeMessage", { msg, BodyMsg: msg.message });
    Sentry.captureException(error);
    console.error('Erro getTypeMessage:', error);
    return "Erro ao processar mensagem";
  }
};



export const getQuotedMessage = (msg: proto.IWebMessageInfo) => {
  const body = extractMessageContent(msg.message)[
    Object.keys(msg?.message).values().next().value
  ];

  if (!body?.contextInfo?.quotedMessage) return;
  const quoted = extractMessageContent(
    body?.contextInfo?.quotedMessage[
    Object.keys(body?.contextInfo?.quotedMessage).values().next().value
    ]
  );

  return quoted;
};

export const getQuotedMessageId = (msg: proto.IWebMessageInfo) => {
  const body = extractMessageContent(msg.message)[
    Object.keys(msg?.message).values().next().value
  ];
  let reaction = msg?.message?.reactionMessage
    ? msg?.message?.reactionMessage?.key?.id
    : "";

  return reaction ? reaction : body?.contextInfo?.stanzaId;
};

const getMeSocket = (wbot: Session): IMe => {
  return {
    id: jidNormalizedUser((wbot as WASocket).user.id),
    name: (wbot as WASocket).user.name
  }
};

const getSenderMessage = (
  msg: proto.IWebMessageInfo,
  wbot: Session
): string => {
  const me = getMeSocket(wbot);
  if (msg.key.fromMe) return me.id;

  const senderId =
    msg.participant || msg.key.participant || msg.key.remoteJid || undefined;

  return senderId && jidNormalizedUser(senderId);
};

const getContactMessage = async (msg: proto.IWebMessageInfo, wbot: Session) => {
  const isGroup = msg.key.remoteJid.includes("g.us");
  const rawNumber = msg.key.remoteJid.replace(/\D/g, "");
  return isGroup
    ? {
      id: getSenderMessage(msg, wbot),
      name: msg.pushName
    }
    : {
      id: msg.key.remoteJid,
      name: msg.key.fromMe ? rawNumber : msg.pushName
    };
};

function findCaption(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return null;
  }

  for (const key in obj) {
    if (key === 'caption' || key === 'text' || key === 'conversation') {
      return obj[key];
    }

    const result = findCaption(obj[key]);
    if (result) {
      return result;
    }
  }

  return null;
}

// const downloadMedia = async (msg: proto.IWebMessageInfo, companyId: number, whatsappId: number) => {
//   const mineType =
//     msg.message?.imageMessage ||
//     msg.message?.audioMessage ||
//     msg.message?.videoMessage ||
//     msg.message?.stickerMessage ||
//     msg.message?.documentMessage ||
//     msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
//     // msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
//     // msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage ||
//     // msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage ||
//     msg.message?.ephemeralMessage?.message?.audioMessage ||
//     msg.message?.ephemeralMessage?.message?.documentMessage ||
//     msg.message?.ephemeralMessage?.message?.videoMessage ||
//     msg.message?.ephemeralMessage?.message?.stickerMessage ||
//     msg.message?.ephemeralMessage?.message?.imageMessage ||
//     msg.message?.viewOnceMessage?.message?.imageMessage ||
//     msg.message?.viewOnceMessage?.message?.videoMessage ||
//     msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage ||
//     msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage ||
//     msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.audioMessage ||
//     msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.documentMessage ||
//     msg.message?.templateMessage?.hydratedTemplate?.imageMessage ||
//     msg.message?.templateMessage?.hydratedTemplate?.documentMessage ||
//     msg.message?.templateMessage?.hydratedTemplate?.videoMessage ||
//     msg.message?.templateMessage?.hydratedFourRowTemplate?.imageMessage ||
//     msg.message?.templateMessage?.hydratedFourRowTemplate?.documentMessage ||
//     msg.message?.templateMessage?.hydratedFourRowTemplate?.videoMessage ||
//     msg.message?.templateMessage?.fourRowTemplate?.imageMessage ||
//     msg.message?.templateMessage?.fourRowTemplate?.documentMessage ||
//     msg.message?.templateMessage?.fourRowTemplate?.videoMessage ||
//     msg.message?.interactiveMessage?.header?.imageMessage ||
//     msg.message?.interactiveMessage?.header?.documentMessage ||
//     msg.message?.interactiveMessage?.header?.videoMessage;

//   // eslint-disable-next-line no-nested-ternary
//   const messageType = msg.message?.documentMessage
//     ? "document"
//     : mineType.mimetype.split("/")[0].replace("application", "document")
//       ? (mineType.mimetype
//         .split("/")[0]
//         .replace("application", "document") as MediaType)
//       : (mineType.mimetype.split("/")[0] as MediaType);

//   let stream: Transform;
//   let contDownload = 0;

//   while (contDownload < 10 && !stream) {
//     try {
//       const { mediaKey, directPath, url } =
//         msg.message?.imageMessage ||
//         msg.message?.audioMessage ||
//         msg.message?.videoMessage ||
//         msg.message?.stickerMessage ||
//         msg.message?.documentMessage ||
//         msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
//         msg.message?.ephemeralMessage?.message?.audioMessage ||
//         msg.message?.ephemeralMessage?.message?.documentMessage ||
//         msg.message?.ephemeralMessage?.message?.videoMessage ||
//         msg.message?.ephemeralMessage?.message?.stickerMessage ||
//         msg.message?.ephemeralMessage?.message?.imageMessage ||
//         msg.message?.viewOnceMessage?.message?.imageMessage ||
//         msg.message?.viewOnceMessage?.message?.videoMessage ||
//         msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage ||
//         msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage ||
//         msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.audioMessage ||
//         msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.documentMessage ||
//         msg.message?.templateMessage?.hydratedTemplate?.imageMessage ||
//         msg.message?.templateMessage?.hydratedTemplate?.documentMessage ||
//         msg.message?.templateMessage?.hydratedTemplate?.videoMessage ||
//         msg.message?.templateMessage?.hydratedFourRowTemplate?.imageMessage ||
//         msg.message?.templateMessage?.hydratedFourRowTemplate?.documentMessage ||
//         msg.message?.templateMessage?.hydratedFourRowTemplate?.videoMessage ||
//         msg.message?.templateMessage?.fourRowTemplate?.imageMessage ||
//         msg.message?.templateMessage?.fourRowTemplate?.documentMessage ||
//         msg.message?.templateMessage?.fourRowTemplate?.videoMessage ||
//         msg.message?.interactiveMessage?.header?.imageMessage ||
//         msg.message?.interactiveMessage?.header?.documentMessage ||
//         msg.message?.interactiveMessage?.header?.videoMessage ||
//         { mediakey: undefined, directPath: undefined, url: undefined };
//       // eslint-disable-next-line no-await-in-loop
//       stream = await downloadContentFromMessage(
//         { mediaKey, directPath, url: directPath ? "" : url },
//         messageType
//       );

//     } catch (error) {
//       contDownload += 1;
//       // eslint-disable-next-line no-await-in-loop, no-loop-func
//       await new Promise(resolve => { setTimeout(resolve, 1000 * contDownload * 2) }
//       );

//       logger.warn(
//         `>>>> erro ${contDownload} de baixar o arquivo ${msg?.key.id} companie ${companyId} conexão ${whatsappId}`
//       );

//       if (contDownload === 10) {
//         logger.warn(
//           `>>>> erro ao baixar o arquivo ${JSON.stringify(msg)}`
//         );
//       }
//     }
//   }


//   let buffer = Buffer.from([]);
//   try {
//     // eslint-disable-next-line no-restricted-syntax
//     for await (const chunk of stream) {
//       buffer = Buffer.concat([buffer, chunk]);
//     }
//   } catch (error) {
//     return { data: "error", mimetype: "", filename: "" };
//   }

//   if (!buffer) {
//     Sentry.setExtra("ERR_WAPP_DOWNLOAD_MEDIA", { msg });
//     Sentry.captureException(new Error("ERR_WAPP_DOWNLOAD_MEDIA"));
//     throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
//   }
//   let filename = msg.message?.documentMessage?.fileName || "";

//   if (!filename) {
//     const ext = mineType.mimetype.split("/")[1].split(";")[0];
//     filename = `${new Date().getTime()}.${ext}`;
//   }
//   const media = {
//     data: buffer,
//     mimetype: mineType.mimetype,
//     filename
//   };
//   return media;
// };

const getUnpackedMessage = (msg: proto.IWebMessageInfo) => {
  return (
    msg.message?.documentWithCaptionMessage?.message ||
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
    msg.message?.ephemeralMessage?.message ||
    msg.message?.viewOnceMessage?.message ||
    msg.message?.viewOnceMessageV2?.message ||
    msg.message?.ephemeralMessage?.message ||
    msg.message?.templateMessage?.hydratedTemplate ||
    msg.message?.templateMessage?.hydratedFourRowTemplate ||
    msg.message?.templateMessage?.fourRowTemplate ||
    msg.message?.interactiveMessage?.header ||
    msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate ||
    msg.message
  )
}

const getMessageMedia = (message: proto.IMessage) => {
  return (
    message?.imageMessage ||
    message?.audioMessage ||
    message?.videoMessage ||
    message?.stickerMessage ||
    message?.documentMessage || null
  );
}

const downloadMedia = async (msg: proto.IWebMessageInfo, isImported: Date = null, wbot: Session, ticket: Ticket) => {

  const unpackedMessage = getUnpackedMessage(msg);
  const message = getMessageMedia(unpackedMessage);

  if (!message) {
    return null;
  }

  const fileLimit = parseInt(await CheckSettings1("downloadLimit", "15"), 10);
  if (wbot && message?.fileLength && +message.fileLength > fileLimit * 1024 * 1024) {
    const fileLimitMessage = {
      text: `\u200e*Mensagem Automática*:\nNosso sistema aceita apenas arquivos com no máximo ${fileLimit} MiB`
    };

    const sendMsg = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      fileLimitMessage
    );

    sendMsg.message.extendedTextMessage.text = "\u200e*Mensagem do sistema*:\nArquivo recebido além do limite de tamanho do sistema, se for necessário ele pode ser obtido no aplicativo do whatsapp.";

    // eslint-disable-next-line no-use-before-define
    await verifyMessage(sendMsg, ticket, ticket.contact);
    throw new Error("ERR_FILESIZE_OVER_LIMIT");
  }

  if (msg.message?.stickerMessage) {
    const urlAnt = "https://web.whatsapp.net";
    const directPath = msg.message?.stickerMessage?.directPath;
    const newUrl = "https://mmg.whatsapp.net";
    const final = newUrl + directPath;
    if (msg.message?.stickerMessage?.url?.includes(urlAnt)) {
      msg.message.stickerMessage.url = msg.message?.stickerMessage.url.replace(urlAnt, final);
    }
  }

  let buffer;
  let contDownload = 0;
  
  // 🛡️ IMPLEMENTAÇÃO TICKETZ: Retry logic para download de mídia
  while (contDownload < 10 && !buffer) {
    try {
      logger.info(`📥 [DOWNLOAD-MEDIA] Tentativa ${contDownload + 1} de download: { messageId: ${getSafeMessageId(msg)} }`);
      
      buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        {
          logger,
          reuploadRequest: wbot.updateMediaMessage,
        }
      );
      
      if (buffer) {
        logger.info(`✅ [DOWNLOAD-MEDIA] Download bem-sucedido na tentativa ${contDownload + 1}`);
        break;
      }
    } catch (err) {
      contDownload += 1;
      logger.warn(`⚠️ [DOWNLOAD-MEDIA] Erro na tentativa ${contDownload}: ${err.message}`);
      
      if (err.message?.includes('Cannot derive from empty media key')) {
        logger.error(`🚨 [DOWNLOAD-MEDIA] Erro crítico de media key vazia, pulando mensagem: { messageId: ${getSafeMessageId(msg)} }`);
        break; // Não tenta mais vezes para este tipo de erro
      }
      
      if (contDownload < 10) {
        const delay = 1000 * contDownload * 2;
        logger.info(`⏳ [DOWNLOAD-MEDIA] Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  if (!buffer && !isImported) {
    logger.error(`❌ [DOWNLOAD-MEDIA] Falha total no download após ${contDownload} tentativas: { messageId: ${getSafeMessageId(msg)} }`);
    return null; // Retorna null em vez de crashar
  }

  let filename = msg.message?.documentMessage?.fileName || "";

  const mineType =
    msg.message?.imageMessage ||
    msg.message?.audioMessage ||
    msg.message?.videoMessage ||
    msg.message?.stickerMessage ||
    msg.message?.ephemeralMessage?.message?.stickerMessage ||
    msg.message?.documentMessage ||
    msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
    msg.message?.ephemeralMessage?.message?.audioMessage ||
    msg.message?.ephemeralMessage?.message?.documentMessage ||
    msg.message?.ephemeralMessage?.message?.videoMessage ||
    msg.message?.ephemeralMessage?.message?.imageMessage ||
    msg.message?.viewOnceMessage?.message?.imageMessage ||
    msg.message?.viewOnceMessage?.message?.videoMessage ||
    msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage ||
    msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage ||
    msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.audioMessage ||
    msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.documentMessage ||
    msg.message?.templateMessage?.hydratedTemplate?.imageMessage ||
    msg.message?.templateMessage?.hydratedTemplate?.documentMessage ||
    msg.message?.templateMessage?.hydratedTemplate?.videoMessage ||
    msg.message?.templateMessage?.hydratedFourRowTemplate?.imageMessage ||
    msg.message?.templateMessage?.hydratedFourRowTemplate?.documentMessage ||
    msg.message?.templateMessage?.hydratedFourRowTemplate?.videoMessage ||
    msg.message?.templateMessage?.fourRowTemplate?.imageMessage ||
    msg.message?.templateMessage?.fourRowTemplate?.documentMessage ||
    msg.message?.templateMessage?.fourRowTemplate?.videoMessage ||
    msg.message?.interactiveMessage?.header?.imageMessage ||
    msg.message?.interactiveMessage?.header?.documentMessage ||
    msg.message?.interactiveMessage?.header?.videoMessage;

  if (!filename) {
      const ext = mineType.mimetype.split("/")[1].split(";")[0];
      filename = `${new Date().getTime()}.${ext}`;
    } else {
      filename = `${new Date().getTime()}_${sanitizeFileName(filename)}`;  // <--- sanitização aqui!
    }

  const media = {
    data: buffer,
    mimetype: mineType.mimetype,
    filename
  };

  return media;
}


const verifyQuotedMessage = async (
  msg: proto.IWebMessageInfo
): Promise<Message | null> => {
  if (!msg) return null;
  const quoted = getQuotedMessageId(msg);

  if (!quoted) return null;

  const quotedMsg = await Message.findOne({
    where: { wid: quoted }
  });

  if (!quotedMsg) return null;

  return quotedMsg;
};

export const verifyMediaMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  ticketTraking?: TicketTraking,
  isForwarded: boolean = false,
  isPrivate: boolean = false,
  wbot?: Session,
  userId?: number // ✅ Adicionado userId opcional
): Promise<Message> => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const companyId = ticket.companyId;

  try {
  
    const media = await downloadMedia(msg, ticket?.imported, wbot, ticket);
  

    if (!media && ticket.imported) {
      const body =
        "*System:* \nFalha no download da mídia verifique no dispositivo";
      const messageData = {
        //mensagem de texto
        wid: getSafeMessageId(msg),
        ticketId: ticket.id,
        contactId: msg.key.fromMe ? undefined : ticket.contactId,
        body,
        reactionMessage: msg.message?.reactionMessage,
        fromMe: msg.key.fromMe,
        mediaType: getTypeMessage(msg),
        read: msg.key.fromMe,
        quotedMsgId: quotedMsg?.id || msg.message?.reactionMessage?.key?.id,
        ack: msg.status,
        companyId: companyId,
        remoteJid: msg.key.remoteJid,
        participant: msg.key.participant,
        timestamp: getTimestampMessage(msg.messageTimestamp),
        createdAt: new Date(
          Math.floor(getTimestampMessage(msg.messageTimestamp) * 1000)
        ).toISOString(),
        dataJson: JSON.stringify(msg),
        ticketImported: ticket.imported,
        userId: msg.key.fromMe ? (userId || ticket.userId) : undefined, // ✅ Adicionado userId para mensagens enviadas
        isForwarded,
        isPrivate
      };

      // Só atualiza lastRemoteJid se NÃO for mensagem enviada por nós
      if (!msg.key.fromMe) {
        await ticket.update({
          lastMessage: body,
          lastRemoteJid: msg.key.remoteJid // Salva o JID/LID usado na última mensagem recebida
        });
      } else {
        await ticket.update({
          lastMessage: body
        });
      }
      logger.error(Error("ERR_WAPP_DOWNLOAD_MEDIA"));
      return CreateMessageService({ messageData, companyId: companyId });
    }

    if (!media) {
      logger.error(`❌ [VERIFY-MEDIA] Mídia não disponível, pulando processamento: { messageId: ${getSafeMessageId(msg)} }`);
      throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
    }
    
    if (!media.data) {
      logger.error(`❌ [VERIFY-MEDIA] Dados da mídia não disponíveis: { messageId: ${getSafeMessageId(msg)} }`);
      throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
    }

    // if (!media.filename || media.mimetype === "audio/mp4") {
    //   const ext = media.mimetype === "audio/mp4" ? "m4a" : media.mimetype.split("/")[1].split(";")[0];
    //   media.filename = `${new Date().getTime()}.${ext}`;
    // } else {
    //   // ext = tudo depois do ultimo .
    //   const ext = media.filename.split(".").pop();
    //   // name = tudo antes do ultimo .
    //   const name = media.filename.split(".").slice(0, -1).join(".").replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    //   media.filename = `${name.trim()}_${new Date().getTime()}.${ext}`;
    // }
    if (!media.filename) {
      const ext = media.mimetype.split("/")[1].split(";")[0];
      media.filename = `${new Date().getTime()}.${ext}`;
    } else {
      // ext = tudo depois do ultimo .
      const ext = media.filename.split(".").pop();
      // name = tudo antes do ultimo .
      const name = media.filename.split(".").slice(0, -1).join(".").replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      media.filename = `${name.trim()}_${new Date().getTime()}.${ext}`;
    }


    try {

      const folder = path.resolve(__dirname, "..", "..", "..", "public", `company${companyId}`);

      // const folder = `public/company${companyId}`; // Correção adicionada por Altemir 16-08-2023
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true }); // Correção adicionada por Altemir 16-08-2023
        fs.chmodSync(folder, 0o777)
      }

              await writeFile(join(folder, media.filename), Buffer.from(media.data.toString('base64'), 'base64')) // Correção adicionada por Altemir 16-08-2023

        .then(() => {

          
          if (media.mimetype.includes("audio")) {
      
            const inputFile = path.join(folder, media.filename);
            let outputFile: string;

            if (inputFile.endsWith(".mpeg")) {
              outputFile = inputFile.replace(".mpeg", ".mp3");
            } else if (inputFile.endsWith(".ogg")) {
              outputFile = inputFile.replace(".ogg", ".mp3");
            } else {
              // Trate outros formatos de arquivo conforme necessário
              //console.error("Formato de arquivo não suportado:", inputFile);
              return;
            }

            return new Promise<void>((resolve, reject) => {
              ffmpeg(inputFile)
                .toFormat("mp3")
                .save(outputFile)
                .on("end", () => {
                  resolve();
                })
                .on("error", (err: any) => {
                  reject(err);
                });
            });
          }
        })
    

    } catch (err) {
      Sentry.setExtra('Erro media', { companyId: companyId, ticket, contact, media, quotedMsg });
      Sentry.captureException(err);
      logger.error(err);
      
    }

    const body = getBodyMessage(msg);

    const messageData = {
      wid: getSafeMessageId(msg),
      ticketId: ticket.id,
      contactId: msg.key.fromMe ? undefined : contact.id,
      body: body || media.filename || "Arquivo de mídia",
      fromMe: msg.key.fromMe,
      read: msg.key.fromMe,
      mediaUrl: media.filename,
      mediaType: media.mimetype.split("/")[0],
      quotedMsgId: quotedMsg?.id,
      ack: Number(String(msg.status).replace('PENDING', '2').replace('NaN', '1')) || 2,
      remoteJid: msg.key.remoteJid,
      participant: msg.key.participant,
      dataJson: JSON.stringify(msg),
      ticketTrakingId: ticketTraking?.id,
      createdAt: new Date(
        Math.floor(getTimestampMessage(msg.messageTimestamp) * 1000)
      ).toISOString(),
      ticketImported: ticket.imported,
      isForwarded,
      isPrivate,
      userId: msg.key.fromMe ? (userId || ticket.userId) : undefined, // ✅ Adicionado userId para mensagens enviadas
    };

    // Só atualiza lastRemoteJid se NÃO for mensagem enviada por nós
    if (!msg.key.fromMe) {
      await ticket.update({
        lastMessage: body || media.filename,
        lastRemoteJid: msg.key.remoteJid // Salva o JID/LID usado na última mensagem recebida
      });
    } else {
      await ticket.update({
        lastMessage: body || media.filename
      });
    }

    const newMessage = await CreateMessageService({
      messageData,
      companyId: companyId
    });

    if (!msg.key.fromMe && ticket.status === "closed") {
      await ticket.update({ status: "pending" });
      await ticket.reload({
        attributes: [
          "id",
          "uuid",
          "queueId",
          "isGroup",
          "channel",
          "status",
          "contactId",
          "useIntegration",
          "lastMessage",
          "updatedAt",
          "unreadMessages",
          "companyId",
          "whatsappId",
          "imported",
          "lgpdAcceptedAt",
          "amountUsedBotQueues",
          "useIntegration",
          "integrationId",
          "userId",
          "amountUsedBotQueuesNPS",
          "lgpdSendMessageAt",
          "isBot",
        ],
        include: [
          { model: Queue, as: "queue" },
          { model: User, as: "user" },
          { model: Contact, as: "contact" },
          { model: Whatsapp, as: "whatsapp" }
        ]
      });

      io.of(String(companyId))
        // .to("closed")
        .emit(`company-${companyId}-ticket`, {
          action: "delete",
          ticket,
          ticketId: ticket.id
        });
      
      io.of(String(companyId))
        // .to(ticket.status)
        //   .to(ticket.id.toString())
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket,
          ticketId: ticket.id
        });
    }

    return newMessage;
  } catch (error) {
    console.error('Erro ao baixar media:', error);
    logger.warn("Erro ao baixar media: ", JSON.stringify(msg));
  }
};

export const verifyMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  ticketTraking?: TicketTraking,
  isPrivate?: boolean,
  isForwarded: boolean = false,
  userId?: number // ✅ Adicionado userId opcional
) => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const body = getBodyMessage(msg);
  const companyId = ticket.companyId;

  const messageData = {
    wid: getSafeMessageId(msg),
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body: body || "Mensagem sem conteúdo de texto",
    fromMe: msg.key.fromMe,
    mediaType: getTypeMessage(msg),
    read: msg.key.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: Number(String(msg.status).replace('PENDING', '2').replace('NaN', '1')) || 2,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
    ticketTrakingId: ticketTraking?.id,
    isPrivate,
    createdAt: new Date(
      Math.floor(getTimestampMessage(msg.messageTimestamp) * 1000)
    ).toISOString(),
    ticketImported: ticket.imported,
    isForwarded,
    userId: msg.key.fromMe ? (userId || ticket.userId) : undefined // ✅ Adicionado userId para mensagens enviadas
  };

  // Só atualiza lastRemoteJid se NÃO for mensagem enviada por nós
  if (!msg.key.fromMe) {
    await ticket.update({
      lastMessage: body,
      lastRemoteJid: msg.key.remoteJid // Salva o JID/LID usado na última mensagem recebida
    });
  } else {
    await ticket.update({
      lastMessage: body
    });
  }

  await CreateMessageService({ messageData, companyId: companyId });



  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" },
        { model: Whatsapp, as: "whatsapp" }
      ]
    });

    // io.to("closed").emit(`company-${companyId}-ticket`, {
    //   action: "delete",
    //   ticket,
    //   ticketId: ticket.id
    // });

    if (!ticket.imported) {
      io.of(String(companyId))
        // .to(ticket.status)
        // .to(ticket.id.toString())
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket,
          ticketId: ticket.id
        });

    }

  }
};

const isValidMsg = (msg: proto.IWebMessageInfo): boolean => {
  if (msg.key.remoteJid === "status@broadcast") return false;
  
  // 🚫 FILTRO PREVENTIVO: Bloquear newsletters e broadcasts antes de qualquer processamento
  if (msg.key.remoteJid?.endsWith("@newsletter")) {
    logger.debug(`🚫 [FILTER] Bloqueando newsletter: ${msg.key.remoteJid}`);
    return false;
  }
  
  if (msg.key.remoteJid?.endsWith("@broadcast")) {
    logger.debug(`🚫 [FILTER] Bloqueando broadcast: ${msg.key.remoteJid}`);
    return false;
  }
  
  if (!msg.key.id) {
    logger.warn("isValidMsg: msg.key.id is undefined, skipping message processing");
    return false;
  }
  try {
    const msgType = getTypeMessage(msg);
    if (!msgType) {
      return;
    }

    const ifType =
      msgType === "conversation" ||
      msgType === "extendedTextMessage" ||
      msgType === "audioMessage" ||
      msgType === "videoMessage" ||
      msgType === "imageMessage" ||
      msgType === "documentMessage" ||
      msgType === "stickerMessage" ||
      msgType === "buttonsResponseMessage" ||
      msgType === "buttonsMessage" ||
      msgType === "messageContextInfo" ||
      msgType === "locationMessage" ||
      msgType === "liveLocationMessage" ||
      msgType === "contactMessage" ||
      msgType === "voiceMessage" ||
      msgType === "mediaMessage" ||
      msgType === "contactsArrayMessage" ||
      msgType === "reactionMessage" ||
      msgType === "ephemeralMessage" ||
      msgType === "protocolMessage" ||
      msgType === "listResponseMessage" ||
      msgType === "listMessage" ||
      msgType === "viewOnceMessage" ||
      msgType === "documentWithCaptionMessage" ||
      msgType === "viewOnceMessageV2" ||
      msgType === "editedMessage" ||
      msgType === "advertisingMessage" ||
      msgType === "highlyStructuredMessage" ||
      msgType === "adMetaPreview"; // Adicionado para tratar mensagens de anúncios;


    if (!ifType) {
      logger.warn(`#### Nao achou o type em isValidMsg: ${msgType}
${JSON.stringify(msg?.message)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, msgType });
      Sentry.captureException(new Error("Novo Tipo de Mensagem em isValidMsg"));
    }

    return !!ifType;
  } catch (error) {
    Sentry.setExtra("Error isValidMsg", { msg });
    Sentry.captureException(error);



  }
};

const sendDialogflowAwswer = async (
  wbot: Session,
  ticket: Ticket,
  msg: WAMessage,
  contact: Contact,
  inputAudio: string | undefined,
  companyId: number,
  queueIntegration: QueueIntegrations
) => {

  const session = await createDialogflowSessionWithModel(
    queueIntegration
  );

  if (session === undefined) {
    return;
  }

  wbot.presenceSubscribe(contact.remoteJid);
  await delay(500)

  let dialogFlowReply = await queryDialogFlow(
    session,
    queueIntegration.projectName,
    contact.remoteJid,
    getBodyMessage(msg),
    queueIntegration.language,
    inputAudio
  );

  if (!dialogFlowReply) {
    await safePresenceUpdate(wbot, "composing", contact.remoteJid);

    const bodyDuvida = formatBody(`\u200e *${queueIntegration?.name}:* Não consegui entender sua dúvida.`)


    await delay(1000);

    await safePresenceUpdate(wbot, 'paused', contact.remoteJid);

    const sentMessage = await wbot.sendMessage(
      `${contact.number}@c.us`, {
      text: bodyDuvida
    }
    );

    await verifyMessage(sentMessage, ticket, contact);
    return;
  }

  if (dialogFlowReply.endConversation) {
    await ticket.update({
      contactId: ticket.contact.id,
      useIntegration: false
    });
  }

  const image = dialogFlowReply.parameters.image?.stringValue ?? undefined;

  const react = dialogFlowReply.parameters.react?.stringValue ?? undefined;

  const audio = dialogFlowReply.encodedAudio.toString("base64") ?? undefined;

  await safePresenceUpdate(wbot, "composing", contact.remoteJid);
  await delay(500);

  let lastMessage;

  for (let message of dialogFlowReply.responses) {
    lastMessage = message.text.text[0] ? message.text.text[0] : lastMessage;
  }
  for (let message of dialogFlowReply.responses) {
    if (message.text) {
      await sendDelayedMessages(
        wbot,
        ticket,
        contact,
        message.text.text[0],
        lastMessage,
        audio,
        queueIntegration
      );
    }
  }
};

async function sendDelayedMessages(
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  message: string,
  lastMessage: string,
  audio: string | undefined,
  queueIntegration: QueueIntegrations
) {
  const companyId = ticket.companyId;
 
  const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
  const farewellMessage = whatsapp.farewellMessage.replace(/[_*]/g, "");


  // if (react) {
  //   const test =
  //     /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g.test(
  //       react
  //     );
  //   if (test) {
  //     msg.react(react);
  //     await delay(1000);
  //   }
  // }
  const sentMessage = await wbot.sendMessage(
    `${contact.number}@c.us`, {
    text: `\u200e *${queueIntegration?.name}:* ` + message
  }
  );


  await verifyMessage(sentMessage, ticket, contact);
  if (message != lastMessage) {
    await delay(500);
    await safePresenceUpdate(wbot, "composing", contact.remoteJid);
  } else if (audio) {
    await safePresenceUpdate(wbot, "recording", contact.remoteJid);
    await delay(500);


    // if (audio && message === lastMessage) {
    //   const newMedia = new MessageMedia("audio/ogg", audio);

    //   const sentMessage = await wbot.sendMessage(
    //     `${contact.number}@c.us`,
    //     newMedia,
    //     {
    //       sendAudioAsVoice: true
    //     }
    //   );

    //   await verifyMessage(sentMessage, ticket, contact);
    // }

    // if (sendImage && message === lastMessage) {
    //   const newMedia = await MessageMedia.fromUrl(sendImage, {
    //     unsafeMime: true
    //   });
    //   const sentMessage = await wbot.sendMessage(
    //     `${contact.number}@c.us`,
    //     newMedia,
    //     {
    //       sendAudioAsVoice: true
    //     }
    //   );

    //   await verifyMessage(sentMessage, ticket, contact);
    //   await ticket.update({ lastMessage: "📷 Foto" });
    // }

    if (farewellMessage && message.includes(farewellMessage)) {
      await delay(1000);
      setTimeout(async () => {
        await ticket.update({
          contactId: ticket.contact.id,
          useIntegration: true
        });
        await UpdateTicketService({
          ticketId: ticket.id,
          ticketData: { status: "closed" },
          companyId: companyId
        });
      }, 3000);
    }
  }
}
const handleOutsideBusinessHours = async (
  wbot: Session,
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  settings?: any,
  ticketTraking?: TicketTraking,
  whatsapp?: any
) => {
  try {
    // Se não há configuração de scheduleType ou está desabilitado, não faz nada
    if (!settings?.scheduleType || settings.scheduleType === "disabled") {
      logger.info(`Agendamento desabilitado para ticket ${ticket.id}`);
      return;
    }

    let outOfHoursMessage = "";
    let messageSource = "";
    let isOutsideBusinessHours = false;

    // Determina a mensagem e verifica horário baseado no tipo de agendamento
    if (settings.scheduleType === "company") {
      // Gerenciamento por Empresa
      outOfHoursMessage = settings.outOfHoursMessage || "";
      messageSource = "Empresa";
      
      if (outOfHoursMessage) {
        try {
          const schedule = await VerifyCurrentSchedule(ticket.companyId);
          isOutsideBusinessHours = !schedule?.inActivity; // Se não está em atividade, está fora do horário
        } catch (scheduleError) {
          logger.error(`Erro ao verificar horário da empresa para ticket ${ticket.id}: ${scheduleError}`);
          return;
        }
      }
    } else if (settings.scheduleType === "connection") {
      // Gerenciamento por Conexão
      if (!whatsapp) {
        logger.warn(`WhatsApp não fornecido para verificação de horário de conexão do ticket ${ticket.id}`);
        return;
      }
      
      outOfHoursMessage = whatsapp.outOfHoursMessage || "";
      messageSource = `Conexão: ${whatsapp.name}`;
      
      if (outOfHoursMessage) {
        try {
          const schedule = await VerifyCurrentSchedule(ticket.companyId, null, whatsapp.id);
          isOutsideBusinessHours = !schedule?.inActivity; // Se não está em atividade, está fora do horário
        } catch (scheduleError) {
          logger.error(`Erro ao verificar horário da conexão para ticket ${ticket.id}: ${scheduleError}`);
          return;
        }
      }
    } else if (settings.scheduleType === "queue") {
      // Gerenciamento por Fila - só processa se ticket tem queueId
      if (!ticket.queueId) {
        logger.warn(`Ticket ${ticket.id} não possui queueId válido para verificar horário de fila`);
        return;
      }

      const queue = await Queue.findByPk(ticket.queueId);
      if (!queue) {
        logger.warn(`Queue ${ticket.queueId} não encontrada para o ticket ${ticket.id}`);
        return;
      }

      outOfHoursMessage = queue.outOfHoursMessage || "";
      messageSource = `Fila: ${queue.name}`;
      
             if (outOfHoursMessage) {
         try {
           const schedule = await VerifyCurrentSchedule(ticket.companyId, ticket.queueId);
           isOutsideBusinessHours = !schedule?.inActivity; // Se não está em atividade, está fora do horário
         } catch (scheduleError) {
           logger.error(`Erro ao verificar horário da fila para ticket ${ticket.id}: ${scheduleError}`);
           return;
         }
       }
    }

    // Se está fora do horário e há mensagem configurada, envia a mensagem
    if (isOutsideBusinessHours && outOfHoursMessage && outOfHoursMessage.trim() !== "") {
      logger.info(`Enviando mensagem de fora de expediente (${messageSource}) para ticket ${ticket.id}`);
      
      const body = formatBody(`\u200e${outOfHoursMessage}`, ticket);
      const sentMessage = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        {
          text: body
        }
      );
      await verifyMessage(sentMessage, ticket, contact, ticketTraking);
    } else if (!outOfHoursMessage || outOfHoursMessage.trim() === "") {
      logger.info(`Nenhuma mensagem de fora de expediente configurada para ${messageSource} no ticket ${ticket.id}`);
    } else {
      logger.info(`Dentro do horário de expediente para ${messageSource} no ticket ${ticket.id}`);
    }
  } catch (error) {
    logger.error(`Erro em handleOutsideBusinessHours: ${error}`);
    Sentry.captureException(error);
  }
};

const verifyQueue = async (
  wbot: Session,
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  settings?: any,
  ticketTraking?: TicketTraking,
) => {
  const companyId = ticket.companyId;

  const { queues, greetingMessage, maxUseBotQueues, timeUseBotQueues } = await ShowWhatsAppService(wbot.id!, companyId);
 
  
  let chatbot = false;

  if (queues.length === 1) {
    chatbot = queues[0]?.chatbots && queues[0]?.chatbots.length > 0;
  }

  const enableQueuePosition = settings.sendQueuePosition === "enabled";

  if (queues.length === 1 && !chatbot) {
    const sendGreetingMessageOneQueues = settings.sendGreetingMessageOneQueues === "enabled" || false;

    //inicia integração dialogflow/n8n
    if (
      !msg.key.fromMe &&
      !ticket.isGroup &&
      queues[0].integrationId
    ) {

      const integrations = await ShowQueueIntegrationService(queues[0].integrationId, companyId);

      await handleMessageIntegration(msg, wbot, companyId, integrations, ticket, contact, ticket)

      if (msg.key.fromMe) {
        await ticket.update({
          typebotSessionTime: moment().toDate(),
          useIntegration: true,
          integrationId: integrations.id
        })
      }
      else {
        await ticket.update({
          useIntegration: true,
          integrationId: integrations.id
        })
      }

      // return;
    }

    if (greetingMessage.length > 1 && sendGreetingMessageOneQueues) {
      const body = formatBody(`${greetingMessage}`, ticket);

      if (ticket.whatsapp.greetingMediaAttachment !== null) {
        const filePath = path.resolve("public", `company${companyId}`, ticket.whatsapp.greetingMediaAttachment);

        const fileExists = fs.existsSync(filePath);

        if (fileExists) {
          const messagePath = ticket.whatsapp.greetingMediaAttachment
          const optionsMsg = await getMessageOptions(messagePath, filePath, String(companyId), body);
          const debouncedSentgreetingMediaAttachment = debounce(
            async () => {

              const sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });

              await verifyMediaMessage(sentMessage, ticket, contact, ticketTraking, false, false, wbot);
            },
            1000,
            ticket.id
          );
          debouncedSentgreetingMediaAttachment();
        } else {
          await wbot.sendMessage(
            `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
            {
              text: body
            }
          );
        }
      } else {
        await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          {
            text: body
          }
        );
      }
    }

    if (!isNil(queues[0].fileListId)) {
      try {
        const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

        const files = await ShowFileService(queues[0].fileListId, ticket.companyId)

        const folder = path.resolve(publicFolder, `company${ticket.companyId}`, "fileList", String(files.id))

        for (const [index, file] of files.options.entries()) {
          const mediaSrc = {
            fieldname: 'medias',
            originalname: file.path,
            encoding: '7bit',
            mimetype: file.mediaType,
            filename: file.path,
            path: path.resolve(folder, file.path),
          } as Express.Multer.File

          await SendWhatsAppMedia({ media: mediaSrc, ticket, body: file.name, isPrivate: false, isForwarded: false });
        };

      } catch (error) {
        logger.info(error);
      }
    }

    if (queues[0].closeTicket) {
      await UpdateTicketService({
        ticketData: {
          status: "closed",
          queueId: queues[0].id,
          // sendFarewellMessage: false
        },
        ticketId: ticket.id,
        companyId
      });

      return;
    } else {
      await UpdateTicketService({
        ticketData: { queueId: queues[0].id, status: ticket.status === "lgpd" ? "pending" : ticket.status },
        ticketId: ticket.id,
        companyId
      });
    }

    const count = await Ticket.findAndCountAll({
      where: {
        userId: null,
        status: "pending",
        companyId,
        queueId: queues[0].id,
        isGroup: false
      }
    });

    if (enableQueuePosition) {
      // Lógica para enviar posição da fila de atendimento
      const qtd = count.count === 0 ? 1 : count.count
      const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;
      // const msgFila = `*Assistente Virtual:*\n{{ms}} *{{name}}*, sua posição na fila de atendimento é: *${qtd}*`;
      const bodyFila = formatBody(`${msgFila}`, ticket);
      const debouncedSentMessagePosicao = debounce(
        async () => {
          await wbot.sendMessage(
            `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
            }`,
            {
              text: bodyFila
            }
          );
        },
        3000,
        ticket.id
      );
      debouncedSentMessagePosicao();
    }

    return;
  }


  // REGRA PARA DESABILITAR O BOT PARA ALGUM CONTATO
  if (contact.disableBot) {
    return;
  }

  let selectedOption = "";

  if (ticket.status !== "lgpd") {
    selectedOption =
      msg?.message?.buttonsResponseMessage?.selectedButtonId ||
      msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
      getBodyMessage(msg);
  } else {
    if (!isNil(ticket.lgpdAcceptedAt))
      await ticket.update({
        status: "pending"
      });

    await ticket.reload();
  }

  if (String(selectedOption).toLocaleLowerCase() == "sair") {
    // Encerra atendimento

    const ticketData = {
      isBot: false,
      status: "closed",
      sendFarewellMessage: true,
      maxUseBotQueues: 0
    };


    await UpdateTicketService({ ticketData, ticketId: ticket.id, companyId })
    // await ticket.update({ queueOptionId: null, chatbot: false, queueId: null, userId: null, status: "closed"});
    //await verifyQueue(wbot, msg, ticket, ticket.contact);

    // const complationMessage = ticket.whatsapp?.complationMessage;

    // console.log(complationMessage)
    // const textMessage = {
    //   text: formatBody(`\u200e${complationMessage}`, ticket),
    // };

    // if (!isNil(complationMessage)) {
    //   const sendMsg = await wbot.sendMessage(
    //     `${ticket?.contact?.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
    //     textMessage
    //   );

    //   await verifyMessage(sendMsg, ticket, ticket.contact);
    // }

    return;
  }

  let choosenQueue = (chatbot && queues.length === 1) ? queues[+selectedOption] : queues[+selectedOption - 1];

  const typeBot = settings?.chatBotType || "text";

  // Serviço p/ escolher consultor aleatório para o ticket, ao selecionar fila.
  let randomUserId;

  if (choosenQueue) {
    try {
      const userQueue = await ListUserQueueServices(choosenQueue.id);

      if (userQueue.userId > -1) {
        randomUserId = userQueue.userId;
      }

    } catch (error) {
      console.error(error);
    }
  }

  // Ativar ou desativar opção de escolher consultor aleatório.
  /*   let settings = await CompaniesSettings.findOne({
      where: {
        companyId: companyId
      }
    }); */

  const botText = async () => {

    if (choosenQueue || (queues.length === 1 && chatbot)) {
      if (queues.length === 1) choosenQueue = queues[0]
      const queue = await Queue.findByPk(choosenQueue.id);

      if (ticket.isOutOfHour === false && ticketTraking.chatbotAt !== null) {
        await ticketTraking.update({
          chatbotAt: null
        });
        await ticket.update({
          amountUsedBotQueues: 0
        });
      }

      let currentSchedule;

      if (settings?.scheduleType === "queue") {
        currentSchedule = await VerifyCurrentSchedule(companyId, queue.id, 0);
      }

      if (
        settings?.scheduleType === "queue" &&
        !isNil(currentSchedule) && (ticket.amountUsedBotQueues < maxUseBotQueues || maxUseBotQueues === 0)
        && (!currentSchedule || currentSchedule.inActivity === false)
        && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")
      ) {
        
        if (timeUseBotQueues !== "0") {
          //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
          //const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
          let dataLimite = new Date();
          let Agora = new Date();


          if (ticketTraking.chatbotAt !== null) {
            dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

            if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
              return
            }
          }
          await ticketTraking.update({
            chatbotAt: null
          })
        }
        
        const outOfHoursMessage = queue.outOfHoursMessage;
        if (outOfHoursMessage !== "") {
          const body = formatBody(`${outOfHoursMessage}`, ticket);

          const debouncedSentMessage = debounce(
            async () => {
              const sentMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
                }`,
                {
                  text: body
                }
              );
              await verifyMessage(sentMessage, ticket, contact, ticketTraking);
            },
            1000,
            ticket.id
          );
          debouncedSentMessage();
          
          logger.info(`Mensagem de fora de expediente enviada para ticket ${ticket.id} - Fila: ${queue.name}`);

          //atualiza o contador de vezes que enviou o bot e que foi enviado fora de hora
          // await ticket.update({
          //   queueId: queue.id,
          //   isOutOfHour: true,
          //   amountUsedBotQueues: ticket.amountUsedBotQueues + 1
          // });

          // return;

        }
        //atualiza o contador de vezes que enviou o bot e que foi enviado fora de hora
        await ticket.update({
          queueId: queue.id,
          isOutOfHour: true,
          amountUsedBotQueues: ticket.amountUsedBotQueues + 1
        });
        return;
      }

      await UpdateTicketService({
        ticketData: {
          // amountUsedBotQueues: 0, 
          queueId: choosenQueue.id
        },
        // ticketData: { queueId: queues.length ===1 ? null : choosenQueue.id },
        ticketId: ticket.id,
        companyId
      });
      // }

      // Verifica se a fila tem chatbots configurados
      if (choosenQueue.chatbots && choosenQueue.chatbots.length > 0 && !ticket.isGroup) {
        let options = "";
        choosenQueue.chatbots.forEach((chatbot, index) => {
          options += `*[ ${index + 1} ]* - ${chatbot.name}\n`;
        });

        const body = formatBody(
          `\u200e ${choosenQueue.greetingMessage}\n\n${options}\n*[ # ]* Voltar para o menu principal\n*[ Sair ]* Encerrar atendimento`,
          ticket
        );

        const sentMessage = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,

          {
            text: body
          }
        );

        await verifyMessage(sentMessage, ticket, contact, ticketTraking);

        if (settings?.settingsUserRandom === "enabled") {
          await UpdateTicketService({
            ticketData: { userId: randomUserId },
            ticketId: ticket.id,
            companyId
          });
        }
      }

      if ((!choosenQueue.chatbots || !choosenQueue.chatbots.length) && choosenQueue.greetingMessage.length !== 0) {
        const body = formatBody(
          `\u200e${choosenQueue.greetingMessage}`,
          ticket
        );
        const sentMessage = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          {
            text: body
          }
        );

        await verifyMessage(sentMessage, ticket, contact, ticketTraking);

      }


      if (!isNil(choosenQueue.fileListId)) {
        try {

          const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

          const files = await ShowFileService(choosenQueue.fileListId, ticket.companyId)

          const folder = path.resolve(publicFolder, `company${ticket.companyId}`, "fileList", String(files.id))

          for (const [index, file] of files.options.entries()) {
            const mediaSrc = {
              fieldname: 'medias',
              originalname: file.path,
              encoding: '7bit',
              mimetype: file.mediaType,
              filename: file.path,
              path: path.resolve(folder, file.path),
            } as Express.Multer.File

            // const debouncedSentMessagePosicao = debounce(
            //   async () => {
            const sentMessage = await SendWhatsAppMedia({ media: mediaSrc, ticket, body: `\u200e ${file.name}`, isPrivate: false, isForwarded: false });

            await verifyMediaMessage(sentMessage, ticket, ticket.contact, ticketTraking, false, false, wbot);
            //   },
            //   2000,
            //   ticket.id
            // );
            // debouncedSentMessagePosicao();
          };


        } catch (error) {
          logger.info(error);
        }
      }

      await delay(4000)


      //se fila está parametrizada para encerrar ticket automaticamente
      if (choosenQueue.closeTicket) {
        try {

          await UpdateTicketService({
            ticketData: {
              status: "closed",
              queueId: choosenQueue.id,
              // sendFarewellMessage: false,
            },
            ticketId: ticket.id,
            companyId,
          });
        } catch (error) {
          logger.info(error);
        }

        return;
      }

      const count = await Ticket.findAndCountAll({
        where: {
          userId: null,
          status: "pending",
          companyId,
          queueId: choosenQueue.id,
          whatsappId: wbot.id,
          isGroup: false
        }
      });

      await CreateLogTicketService({
        ticketId: ticket.id,
        type: "queue",
        queueId: choosenQueue.id
      });

      if (enableQueuePosition && (!choosenQueue.chatbots || !choosenQueue.chatbots.length)) {
        // Lógica para enviar posição da fila de atendimento
        const qtd = count.count === 0 ? 1 : count.count
        const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;
        // const msgFila = `*Assistente Virtual:*\n{{ms}} *{{name}}*, sua posição na fila de atendimento é: *${qtd}*`;
        const bodyFila = formatBody(`${msgFila}`, ticket);
        const debouncedSentMessagePosicao = debounce(
          async () => {
            await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
              }`,
              {
                text: bodyFila
              }
            );
          },
          3000,
          ticket.id
        );
        debouncedSentMessagePosicao();
      }


    } else {

      if (ticket.isGroup) return;

      if (maxUseBotQueues && maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= maxUseBotQueues) {
        // await UpdateTicketService({
        //   ticketData: { queueId: queues[0].id },
        //   ticketId: ticket.id
        // });

        return;
      }

      if (timeUseBotQueues !== "0") {
        //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
        //const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
        let dataLimite = new Date();
        let Agora = new Date();

        if (ticketTraking.chatbotAt !== null) {
          dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

          if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
            return
          }
        }
        await ticketTraking.update({
          chatbotAt: null
        })
      }

      // if (wbot.waitForSocketOpen()) {
      //   console.log("AGUARDANDO")
      //   console.log(wbot.waitForSocketOpen())
      // }

      wbot.presenceSubscribe(contact.remoteJid);


      let options = "";

      await safePresenceUpdate(wbot, "composing", contact.remoteJid);

      queues.forEach((queue, index) => {
        options += `*[ ${index + 1} ]* - ${queue.name}\n`;
      });
      options += `\n*[ Sair ]* - Encerrar atendimento`;

      const body = formatBody(
        `\u200e${greetingMessage}\n\n${options}`,
        ticket
      );

      await CreateLogTicketService({
        ticketId: ticket.id,
        type: "chatBot"
      });

      await delay(1000);

      await safePresenceUpdate(wbot, 'paused', contact.remoteJid);

      if (ticket.whatsapp.greetingMediaAttachment !== null) {

        const filePath = path.resolve("public", `company${companyId}`, ticket.whatsapp.greetingMediaAttachment);

        const fileExists = fs.existsSync(filePath);
        // console.log(fileExists);
        if (fileExists) {
          const messagePath = ticket.whatsapp.greetingMediaAttachment
          const optionsMsg = await getMessageOptions(messagePath, filePath, String(companyId), body);

          const debouncedSentgreetingMediaAttachment = debounce(
            async () => {

              let sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });

              await verifyMediaMessage(sentMessage, ticket, contact, ticketTraking, false, false, wbot);

            },
            1000,
            ticket.id
          );
          debouncedSentgreetingMediaAttachment();
        } else {
          const debouncedSentMessage = debounce(
            async () => {
              const sentMessage = await wbot.sendMessage(
                `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                {
                  text: body
                }
              );

              await verifyMessage(sentMessage, ticket, contact, ticketTraking);
            },
            1000,
            ticket.id
          );
          debouncedSentMessage();

        }

        await UpdateTicketService({
          ticketData: {
            // amountUsedBotQueues: ticket.amountUsedBotQueues + 1 
          },
          ticketId: ticket.id,
          companyId
        });

        return
      } else {

        const debouncedSentMessage = debounce(
          async () => {
            const sentMessage = await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              {
                text: body
              }
            );

            await verifyMessage(sentMessage, ticket, contact, ticketTraking);
          },
          1000,
          ticket.id
        );

        await UpdateTicketService({
          ticketData: {

          },
          ticketId: ticket.id,
          companyId
        });

        debouncedSentMessage();
      }
    }
  };


  if (typeBot === "text") {
    return botText();
  }

  if (typeBot === "button" && queues.length > 3) {
    return botText();
  }

};

export const verifyRating = (ticketTraking: TicketTraking) => {
  if (
    ticketTraking &&
    ticketTraking.finishedAt === null &&
    ticketTraking.closedAt !== null &&
    ticketTraking.userId !== null &&
    ticketTraking.ratingAt === null
  ) {
    return true;
  }
  return false;
};

export const handleRating = async (
  rate: number,
  ticket: Ticket,
  ticketTraking: TicketTraking
) => {
  const io = getIO();
  const companyId = ticket.companyId;

  // console.log("GETTING WHATSAPP HANDLE RATING", ticket.whatsappId, ticket.id)
  const { complationMessage } = await ShowWhatsAppService(
    ticket.whatsappId,

    companyId
  );

  let finalRate = rate;

  if (rate < 0) {
    finalRate = 0;
  }
  if (rate > 10) {
    finalRate = 10;
  }

  await UserRating.create({
    ticketId: ticketTraking.ticketId,
    companyId: ticketTraking.companyId,
    userId: ticketTraking.userId,
    rate: finalRate,
  });

  if (!isNil(complationMessage) && complationMessage !== "" && !ticket.isGroup) {
    const body = formatBody(`\u200e${complationMessage}`, ticket);
    if (ticket.channel === "whatsapp") {
      const msg = await SendWhatsAppMessage({ body, ticket });

      await verifyMessage(msg, ticket, ticket.contact, ticketTraking);

    }

    if (["facebook", "instagram"].includes(ticket.channel)) {
      await sendFaceMessage({ body, ticket });
    }
  }

  await ticket.update({
    isBot: false,
    status: "closed",
    amountUsedBotQueuesNPS: 0
  });

  //loga fim de atendimento
  await CreateLogTicketService({
    userId: ticket.userId,
    queueId: ticket.queueId,
    ticketId: ticket.id,
    type: "closed"
  });

  io.of(String(companyId))
    // .to("open")
    .emit(`company-${companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id,
    });

  io.of(String(companyId))
    // .to(ticket.status)
    // .to(ticket.id.toString())
    .emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket,
      ticketId: ticket.id
    });

};

const sanitizeName = (name: string): string => {
  let sanitized = name.split(" ")[0];
  sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized.substring(0, 60);
};

const deleteFileSync = (path: string): void => {
  try {
    fs.unlinkSync(path);
  } catch (error) {
    console.error("Erro ao deletar o arquivo:", error);
  }
};

const convertTextToSpeechAndSaveToFile = (
  text: string,
  filename: string,
  subscriptionKey: string,
  serviceRegion: string,
  voice: string = "pt-BR-FabioNeural",
  audioToFormat: string = "mp3"
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const speechConfig = SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechSynthesisVoiceName = voice;
    const audioConfig = AudioConfig.fromAudioFileOutput(`${filename}.wav`);
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
    synthesizer.speakTextAsync(
      text,
      result => {
        if (result) {
          convertWavToAnotherFormat(
            `${filename}.wav`,
            `${filename}.${audioToFormat}`,
            audioToFormat
          )
            .then(output => {
              resolve();
            })
            .catch(error => {
              console.error(error);
              reject(error);
            });
        } else {
          reject(new Error("No result from synthesizer"));
        }
        synthesizer.close();
      },
      error => {
        console.error(`Error: ${error}`);
        synthesizer.close();
        reject(error);
      }
    );
  });
};

const convertWavToAnotherFormat = (
  inputPath: string,
  outputPath: string,
  toFormat: string
) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .toFormat(toFormat)
      .on("end", () => resolve(outputPath))
      .on("error", (err: { message: any }) =>
        reject(new Error(`Error converting file: ${err.message}`))
      )
      .save(outputPath);
  });
};

const keepOnlySpecifiedChars = (str: string) => {
  return str.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ!?.,;:\s]/g, "");
};

const handleOpenAi = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  mediaSent: Message | undefined,
  ticketTraking: TicketTraking
): Promise<void> => {

  // REGRA PARA DESABILITAR O BOT PARA ALGUM CONTATO
  if (contact.disableBot) {
    return;
  }
  const bodyMessage = getBodyMessage(msg);
  if (!bodyMessage) return;
  // console.log("GETTING WHATSAPP HANDLE OPENAI", ticket.whatsappId, ticket.id)
  const { prompt } = await ShowWhatsAppService(wbot.id, ticket.companyId);


  if (!prompt) return;

  // ✅ TICKETZ COMPAT: Permitir CIPHERTEXT para mensagens @lid, rejeitar outros messageStubTypes
  const isLidMessage = msg.key?.remoteJid?.includes("@lid");
  const isCiphertext = msg.messageStubType === WAMessageStubType.CIPHERTEXT;
  
  if (msg.messageStubType && !(isCiphertext && isLidMessage)) return;

  const publicFolder: string = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "public",
    `company${ticket.companyId}`
  );

  let openai: OpenAI | any;
  const openAiIndex = sessionsOpenAi.findIndex(s => s.id === ticket.id);

  if (openAiIndex === -1) {
    // const configuration = new Configuration({
    //   apiKey: prompt.apiKey
    // });
    openai = new OpenAI({ apiKey: prompt.apiKey });
    openai.id = ticket.id;
    sessionsOpenAi.push(openai);
  } else {
    openai = sessionsOpenAi[openAiIndex];
  }

  const messages = await Message.findAll({
    where: { ticketId: ticket.id },
    order: [["createdAt", "ASC"]],
    limit: prompt.maxMessages
  });

  const promptSystem = `Nas respostas utilize o nome ${sanitizeName(
    contact.name || "Amigo(a)"
  )} para identificar o cliente.\nSua resposta deve usar no máximo ${prompt.maxTokens
    } tokens e cuide para não truncar o final.\nSempre que possível, mencione o nome dele para ser mais personalizado o atendimento e mais educado. Quando a resposta requer uma transferência para o setor de atendimento, comece sua resposta com 'Ação: Transferir para o setor de atendimento'.\n
  ${prompt.prompt}\n`;

  let messagesOpenAi = [];

  if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "conversation" || message.mediaType === "extendedTextMessage") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: bodyMessage! });

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });

    let response = chat.choices[0].message?.content;

    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }

    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: `\u200e ${response!}`
      });
      await verifyMessage(sentMessage!, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true
          });
          await verifyMediaMessage(sendMessage!, ticket, contact, ticketTraking, false, false, wbot);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.error(`Erro para responder com audio: ${error}`);
        }
      });
    }
  } else if (msg.message?.audioMessage) {
    const mediaUrl = mediaSent!.mediaUrl!.split("/").pop();
    const file = fs.createReadStream(`${publicFolder}/${mediaUrl}`) as any;

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: file,
    });

    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "conversation" || message.mediaType === "extendedTextMessage") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: transcription.text });
    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });
    let response = chat.choices[0].message?.content;

    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }
    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: `\u200e ${response!}`
      });
      await verifyMessage(sentMessage!, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true
          });
          await verifyMediaMessage(sendMessage!, ticket, contact, ticketTraking, false, false, wbot);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.error(`Erro para responder com audio: ${error}`);
        }
      });
    }
  }
  messagesOpenAi = [];
};

const transferQueue = async (
  queueId: number,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  await UpdateTicketService({
    ticketData: { queueId: queueId },
    ticketId: ticket.id,
    companyId: ticket.companyId
  });
};

const flowbuilderIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number,
  queueIntegration: QueueIntegrations,
  ticket: Ticket,
  contact: Contact,
  isFirstMsg?: Ticket,
  isTranfered?: boolean
) => {

  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const body = getBodyMessage(msg);

  /*
  const messageData = {
    wid: getSafeMessageId(msg),
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body: body,
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: Number(String(msg.status).replace('PENDING', '2').replace('NaN', '1')) || 2,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
    createdAt: new Date(
      Math.floor(getTimestampMessage(msg.messageTimestamp) * 1000)
    ).toISOString(),
    ticketImported: ticket.imported,
    userId: msg.key.fromMe ? (ticket.userId) : undefined, // ✅ Adicionado userId para mensagens enviadas
  };


  await CreateMessageService({ messageData, companyId: ticket.companyId });

  */


  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });
    await UpdateTicketService({
      ticketData: { status: "pending", integrationId: ticket.integrationId },
      ticketId: ticket.id,
      companyId
    });

    io.of(String(companyId))
      .emit(`company-${companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id
      });

    io.to(ticket.status)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }

  if (msg.key.fromMe) {
    return;
  }

  const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);

  const listPhrase = await FlowCampaignModel.findAll({
    where: {
      whatsappId: whatsapp.id,
    }
  });

  
  if (
    !isFirstMsg &&
    listPhrase.filter(item => item.phrase === body).length === 0
  ) {

    const flow = await FlowBuilderModel.findOne({
      where: {
        id: whatsapp.flowIdWelcome
      }
    });
    if (flow) {

      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
      };

      // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");


      // // Enviar as variáveis como parte da mensagem para o Worker
      // console.log('DISPARO1')
      // const data = {
      //   idFlowDb: flowUse.flowIdWelcome,
      //   companyId: ticketUpdate.companyId,
      //   nodes: nodes,
      //   connects: connections,
      //   nextStage: flow.flow["nodes"][0].id,
      //   dataWebhook: null,
      //   details: "",
      //   hashWebhookId: "",
      //   pressKey: null,
      //   idTicket: ticketUpdate.id,
      //   numberPhrase: mountDataContact
      // };
      // worker.postMessage(data);
      // worker.on("message", message => {
      //   console.log(`Mensagem do worker: ${message}`);
      // });

      await ActionsWebhookService(
        whatsapp.id,
        whatsapp.flowIdWelcome,
        ticket.companyId,
        nodes,
        connections,
        flow.flow["nodes"][0].id,
        null,
        "",
        "",
        null,
        ticket.id,
        mountDataContact
      );

    }
  }



  const dateTicket = new Date(isFirstMsg?.updatedAt ? isFirstMsg.updatedAt : "");
  const dateNow = new Date();
  const diferencaEmMilissegundos = Math.abs(
    differenceInMilliseconds(dateTicket, dateNow)
  );
  const seisHorasEmMilissegundos = 1000;

  if (
    listPhrase.filter(item => item.phrase === body).length === 0 &&
    diferencaEmMilissegundos >= seisHorasEmMilissegundos &&
    isFirstMsg
  ) {
    const flow = await FlowBuilderModel.findOne({
      where: {
        id: whatsapp.flowIdNotPhrase
      }
    });


    if (flow) {

      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
      };

      await ActionsWebhookService(
        whatsapp.id,
        whatsapp.flowIdNotPhrase,
        ticket.companyId,
        nodes,
        connections,
        flow.flow["nodes"][0].id,
        null,
        "",
        "",
        null,
        ticket.id,
        mountDataContact
      );

    }
  }


  // Campaign fluxo
  if (listPhrase.filter(item => item.phrase === body).length !== 0) {
    const flowDispar = listPhrase.filter(item => item.phrase === body)[0];
    const flow = await FlowBuilderModel.findOne({
      where: {
        id: flowDispar.flowId
      }
    });
    const nodes: INodes[] = flow.flow["nodes"];
    const connections: IConnections[] = flow.flow["connections"];

    const mountDataContact = {
      number: contact.number,
      name: contact.name,
      email: contact.email
    };

    //const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");

    //console.log('DISPARO3')
    // Enviar as variáveis como parte da mensagem para o Worker
    // const data = {
    //   idFlowDb: flowDispar.flowId,
    //   companyId: ticketUpdate.companyId,
    //   nodes: nodes,
    //   connects: connections,
    //   nextStage: flow.flow["nodes"][0].id,
    //   dataWebhook: null,
    //   details: "",
    //   hashWebhookId: "",
    //   pressKey: null,
    //   idTicket: ticketUpdate.id,
    //   numberPhrase: mountDataContact
    // };
    // worker.postMessage(data);

    // worker.on("message", message => {
    //   console.log(`Mensagem do worker: ${message}`);
    // });

    await ActionsWebhookService(
      whatsapp.id,
      flowDispar.flowId,
      ticket.companyId,
      nodes,
      connections,
      flow.flow["nodes"][0].id,
      null,
      "",
      "",
      null,
      ticket.id,
      mountDataContact
    );
    return
  }

  if (ticket.flowWebhook) {
    const webhook = await WebhookModel.findOne({
      where: {
        company_id: ticket.companyId,
        hash_id: ticket.hashFlowId
      }
    });

    if (webhook && webhook.config["details"]) {
      const flow = await FlowBuilderModel.findOne({
        where: {
          id: webhook.config["details"].idFlow
        }
      });
      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");

      // console.log('DISPARO4')
      // // Enviar as variáveis como parte da mensagem para o Worker
      // const data = {
      //   idFlowDb: webhook.config["details"].idFlow,
      //   companyId: ticketUpdate.companyId,
      //   nodes: nodes,
      //   connects: connections,
      //   nextStage: ticketUpdate.lastFlowId,
      //   dataWebhook: ticketUpdate.dataWebhook,
      //   details: webhook.config["details"],
      //   hashWebhookId: ticketUpdate.hashFlowId,
      //   pressKey: body,
      //   idTicket: ticketUpdate.id,
      //   numberPhrase: ""
      // };
      // worker.postMessage(data);

      // worker.on("message", message => {
      //   console.log(`Mensagem do worker: ${message}`);
      // });

      await ActionsWebhookService(
        whatsapp.id,
        webhook.config["details"].idFlow,
        ticket.companyId,
        nodes,
        connections,
        ticket.lastFlowId,
        ticket.dataWebhook,
        webhook.config["details"],
        ticket.hashFlowId,
        body,
        ticket.id
      );
    } else {
      const flow = await FlowBuilderModel.findOne({
        where: {
          id: ticket.flowStopped
        }
      });

      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      if (!ticket.lastFlowId) {
        return
      }

      const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
      };

      // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");

      // console.log('DISPARO5')
      // // Enviar as variáveis como parte da mensagem para o Worker
      // const data = {
      //   idFlowDb: parseInt(ticketUpdate.flowStopped),
      //   companyId: ticketUpdate.companyId,
      //   nodes: nodes,
      //   connects: connections,
      //   nextStage: ticketUpdate.lastFlowId,
      //   dataWebhook: null,
      //   details: "",
      //   hashWebhookId: "",
      //   pressKey: body,
      //   idTicket: ticketUpdate.id,
      //   numberPhrase: mountDataContact
      // };
      // worker.postMessage(data);
      // worker.on("message", message => {
      //   console.log(`Mensagem do worker: ${message}`);
      // });

      await ActionsWebhookService(
        whatsapp.id,
        parseInt(ticket.flowStopped),
        ticket.companyId,
        nodes,
        connections,
        ticket.lastFlowId,
        null,
        "",
        "",
        body,
        ticket.id,
        mountDataContact
      );
    }
  }

}
export const handleMessageIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number,
  queueIntegration: QueueIntegrations,
  ticket: Ticket,
  contact: Contact,
  isFirstMsg?: Ticket,
  isTranfered?: boolean
): Promise<void> => {
  const msgType = getTypeMessage(msg);

  if (queueIntegration.type === "n8n" || queueIntegration.type === "webhook") {
    if (queueIntegration?.urlN8N) {
      const options = {
        method: "POST",
        url: queueIntegration?.urlN8N,
        headers: {
          "Content-Type": "application/json"
        },
        json: msg
      };
      
      setTimeout(async () => {
        await safePresenceUpdate(wbot, "composing", contact.remoteJid);
        
        try {
          request(options, function (error, response) {
            if (error) {
              throw new Error(error);
            }
            else {
              // Response processada com sucesso
            }
          });
        } catch (error) {
          throw new Error(error);
        }
      }, 10000);
    }

  } else if (queueIntegration.type === "dialogflow") {
    let inputAudio: string | undefined;

    if (msgType === "audioMessage") {
      let filename = `${msg.messageTimestamp}.ogg`;
      readFile(
        join(__dirname, "..", "..", "..", "public", `company${companyId}`, filename),
        "base64",
        (err, data) => {
          inputAudio = data;
          if (err) {
            logger.error(err);
          }
        }
      );
    } else {
      inputAudio = undefined;
    }

    const debouncedSentMessage = debounce(
      async () => {
        await sendDialogflowAwswer(
          wbot,
          ticket,
          msg,
          ticket.contact,
          inputAudio,
          companyId,
          queueIntegration
        );
      },
      500,
      ticket.id
    );
    debouncedSentMessage();
  } else if (queueIntegration.type === "typebot") {
    // await typebots(ticket, msg, wbot, queueIntegration);
    await typebotListener({ ticket, msg, wbot, typebot: queueIntegration });

  }
}



const flowBuilderQueue = async (
  ticket: Ticket,
  msg: proto.IWebMessageInfo,
  wbot: Session,
  whatsapp: Whatsapp,
  companyId: number,
  contact: Contact,
  isFirstMsg: Ticket,
) => {
  const body = getBodyMessage(msg);

  const flow = await FlowBuilderModel.findOne({
    where: {
      id: ticket.flowStopped
    }
  });

  const mountDataContact = {
    number: contact.number,
    name: contact.name,
    email: contact.email
  };



  const nodes: INodes[] = flow.flow["nodes"]
  const connections: IConnections[] = flow.flow["connections"]

  if (!ticket.lastFlowId) {
    return
  }

  if (ticket.status === "closed" || ticket.status === "interrupted" || ticket.status === "open") {
    return;
  }

  await ActionsWebhookService(
    whatsapp.id,
    parseInt(ticket.flowStopped),
    ticket.companyId,
    nodes,
    connections,
    ticket.lastFlowId,
    null,
    "",
    "",
    body,
    ticket.id,
    mountDataContact
  );

  //const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);
  //await handleMessageIntegration(msg, wbot, companyId, integrations, ticket, contact, isFirstMsg)



}

// Flag para controlar se a limpeza já foi executada nesta sessão
let cleanupExecuted = false;

const handleMessage = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number,
  isImported: boolean = false,
): Promise<void> => {

  // Executar limpeza automática apenas uma vez por sessão
  if (!cleanupExecuted && !isImported) {
    try {
      await CleanupOrphanDataService();
      cleanupExecuted = true;
    } catch (cleanupError) {
      logger.error(`Cleanup failed: ${cleanupError.message}`);
    }
  }

  if (!isValidMsg(msg)) {
    return;
  }
  


  try {
    // REMOVIDO: Sistema de múltiplas empresas que causava loop infinito

    let msgContact: IMe;
    let groupContact: Contact | undefined;
    let queueId: number = null;
    let tagsId: number = null;
    let userId: number = null;

    let bodyMessage = getBodyMessage(msg);
    const msgType = getTypeMessage(msg);

    const hasMedia =
      msg.message?.imageMessage ||
      msg.message?.audioMessage ||
      msg.message?.videoMessage ||
      msg.message?.stickerMessage ||
      msg.message?.documentMessage ||
      msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
      // msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
      // msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage ||
      // msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage ||
      msg.message?.ephemeralMessage?.message?.audioMessage ||
      msg.message?.ephemeralMessage?.message?.documentMessage ||
      msg.message?.ephemeralMessage?.message?.videoMessage ||
      msg.message?.ephemeralMessage?.message?.stickerMessage ||
      msg.message?.ephemeralMessage?.message?.imageMessage ||
      msg.message?.viewOnceMessage?.message?.imageMessage ||
      msg.message?.viewOnceMessage?.message?.videoMessage ||
      msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage ||
      msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage ||
      msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.audioMessage ||
      msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.documentMessage ||
      msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
      msg.message?.templateMessage?.hydratedTemplate?.imageMessage ||
      msg.message?.templateMessage?.hydratedTemplate?.documentMessage ||
      msg.message?.templateMessage?.hydratedTemplate?.videoMessage ||
      msg.message?.templateMessage?.hydratedFourRowTemplate?.imageMessage ||
      msg.message?.templateMessage?.hydratedFourRowTemplate?.documentMessage ||
      msg.message?.templateMessage?.hydratedFourRowTemplate?.videoMessage ||
      msg.message?.templateMessage?.fourRowTemplate?.imageMessage ||
      msg.message?.templateMessage?.fourRowTemplate?.documentMessage ||
      msg.message?.templateMessage?.fourRowTemplate?.videoMessage ||
      msg.message?.interactiveMessage?.header?.imageMessage ||
      msg.message?.interactiveMessage?.header?.documentMessage ||
      msg.message?.interactiveMessage?.header?.videoMessage ||
      msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate?.documentMessage ||
      msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate?.videoMessage ||
      msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate?.imageMessage ||
      msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate?.locationMessage

    if (msg.key.fromMe) {
      if (/\u200e/.test(bodyMessage)) return;

      if (
        !hasMedia &&
        msgType !== "conversation" &&
        msgType !== "extendedTextMessage" &&
        msgType !== "contactMessage" &&
        msgType !== "reactionMessage" &&
        msgType !== "ephemeralMessage" &&
        msgType !== "protocolMessage" &&
        msgType !== "viewOnceMessage" &&
        msgType !== "editedMessage" &&
        msgType !== "hydratedContentText"
              )
        return;
      msgContact = await getContactMessage(msg, wbot);
    } else {
      msgContact = await getContactMessage(msg, wbot);
    }

    const isGroup = msg.key.remoteJid?.endsWith("@g.us");

    // 🚫 FILTRO: Bloquear reações do WhatsApp para não criar mensagens normais com quotedMsgId
    if (msgType === "reactionMessage") {
      logger.info(`🚫 [REACTION-FILTER] Bloqueando reactionMessage para evitar reply falso: {
        messageId: '${msg.key.id}',
        remoteJid: '${msg.key.remoteJid}',
        reactionText: '${msg.message?.reactionMessage?.text}'
      }`);
      return;
    }

    // 🎯 LOG: Rastrear tipo de identificador recebido
    logger.info(`📨 [LID-JID-TRACKING] Message received: {
      remoteJid: '${msg.key.remoteJid}',
      isLid: ${msg.key.remoteJid?.includes("@lid")},
      isGroup: ${isGroup},
      fromMe: ${msg.key.fromMe},
      messageId: '${msg.key.id}'
    }`);

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);

    // 🚫 FILTRO MELHORADO: Bloquear grupos quando allowGroup = false, ANTES de qualquer processamento
    if (!whatsapp.allowGroup && isGroup) {
      logger.debug(`🚫 [FILTER] Grupo bloqueado (allowGroup=false): ${msg.key.remoteJid}`);
      return;
    }

    if (isGroup) {
      const grupoMeta = await wbot.groupMetadata(msg.key.remoteJid);
      const msgGroupContact = {
        id: grupoMeta.id,
        name: grupoMeta.subject
      };
      // ✅ TICKETZ COMPAT: Usar wrapper compatible
      groupContact = await verifyContactTicketzCompat(
        msgGroupContact,
        wbot,
        companyId
      );
    }

    const isLid = msgContact.id.includes("@lid");
    const isContactGroup = msgContact.id.includes("@g.us");
    
    // 🚫 FILTRO ADICIONAL: Se allowGroup = false e contato é de grupo, não processar
    if (!whatsapp.allowGroup && isContactGroup) {
      logger.debug(`🚫 [FILTER] Contato de grupo bloqueado (allowGroup=false): ${msgContact.id}`);
      return;
    }
    
    // ✅ TICKETZ COMPAT: Usar wrapper compatible
    const contact = await verifyContactTicketzCompat(
      msgContact,
      wbot,
      companyId
    );
    
    // 🐛 DEBUG: Log do contato verificado


    let unreadMessages = 0;

    if (msg.key.fromMe) {
      
      await cacheLayer.set(`contacts:${contact.id}:unreads`, "0");
    } else {
      
      const unreads = await cacheLayer.get(`contacts:${contact.id}:unreads`);
      unreadMessages = +unreads + 1;
      await cacheLayer.set(
        `contacts:${contact.id}:unreads`,
        `${unreadMessages}`
      );
    }

    const settings = await CompaniesSettings.findOne({
      where: { companyId }
    }
    )


    
    const enableLGPD = settings.enableLGPD === "enabled";

    const isFirstMsg = await Ticket.findOne({
      where: {
        contactId: groupContact ? groupContact.id : contact.id,
        companyId,
        whatsappId: whatsapp.id
      },
      order: [["id", "DESC"]]
    });

    const mutex = new Mutex();
    // Inclui a busca de ticket aqui, se realmente não achar um ticket, então vai para o findorcreate
    const ticket = await mutex.runExclusive(async () => {
      const result = await FindOrCreateTicketService(
        contact,
        whatsapp,
        unreadMessages,
        companyId,
        queueId,
        userId,
        groupContact,
        "whatsapp",
        isImported,
        false,
        settings,
      );
      return result;
    });

  
    let bodyRollbackTag = "";
    let bodyNextTag = "";
    let rollbackTag;
    let nextTag;
    let ticketTag = undefined;
    // console.log(ticket.id)
    if (ticket?.company?.plan?.useKanban) {
      ticketTag = await TicketTag.findOne({
        where: {
          ticketId: ticket.id
        }
      })

      if (ticketTag) {
        const tag = await Tag.findByPk(ticketTag.tagId)
        
        if (tag.nextLaneId) {
          nextTag = await Tag.findByPk(tag.nextLaneId);
          
          bodyNextTag = nextTag.greetingMessageLane;
        }
        if (tag.rollbackLaneId) {
          rollbackTag = await Tag.findByPk(tag.rollbackLaneId);
          
          bodyRollbackTag = rollbackTag.greetingMessageLane;
        }
      }
    }

    if (ticket.status === 'closed' || (
      unreadMessages === 0 &&
      whatsapp.complationMessage &&
      formatBody(whatsapp.complationMessage, ticket) === bodyMessage)
    ) {
      return;
    }

    if (rollbackTag && formatBody(bodyNextTag, ticket) !== bodyMessage && formatBody(bodyRollbackTag, ticket) !== bodyMessage) {
      await TicketTag.destroy({ where: { ticketId: ticket.id, tagId: ticketTag.tagId } });
      await TicketTag.create({ ticketId: ticket.id, tagId: rollbackTag.id });
    }



    if (isImported) {
      
      await ticket.update({
        queueId: whatsapp.queueIdImportMessages
      })
    }

    // console.log(msg.message?.editedMessage)
    // console.log(ticket)
    if (msgType === "editedMessage" || msgType === "protocolMessage") {
      const msgKeyIdEdited = msgType === "editedMessage" ? msg.message.editedMessage.message.protocolMessage.key.id : msg.message?.protocolMessage.key.id;
      let bodyEdited = findCaption(msg.message)

      

      // console.log("bodyEdited", bodyEdited)
      const io = getIO();
      try {
        const messageToUpdate = await Message.findOne({
          where: {
            wid: msgKeyIdEdited,
            companyId,
            ticketId: ticket.id
          }
        })

        if (!messageToUpdate) return

        await messageToUpdate.update({ isEdited: true, body: bodyEdited });

        // Só atualiza lastRemoteJid se NÃO for mensagem enviada por nós
        if (!msg.key.fromMe) {
          await ticket.update({ 
            lastMessage: bodyEdited,
            lastRemoteJid: msg.key.remoteJid // Salva o JID/LID usado na última mensagem recebida
          })
        } else {
          await ticket.update({ 
            lastMessage: bodyEdited
          })
        }

        

        io.of(String(companyId))
          // .to(String(ticket.id))
          .emit(`company-${companyId}-appMessage`, {
            action: "update",
            message: messageToUpdate
          });

        io.of(String(companyId))
          // .to(ticket.status)
          // .to("notification")
          // .to(String(ticket.id))
          .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket
          });
      } catch (err) {
        Sentry.captureException(err);
        logger.error(`Error handling message ack. Err: ${err}`);
      }
      return
    }

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      userId,
      whatsappId: whatsapp?.id
    });

    let useLGPD = false;

    try {
      if (!msg.key.fromMe) {
        //MENSAGEM DE FÉRIAS COLETIVAS
        
        

        if (!isNil(whatsapp.collectiveVacationMessage && !isGroup)) {
          const currentDate = moment();

          

          if (currentDate.isBetween(moment(whatsapp.collectiveVacationStart), moment(whatsapp.collectiveVacationEnd))) {

            

            if (hasMedia) {

              

              await verifyMediaMessage(msg, ticket, contact, ticketTraking, false, false, wbot);
            } else {
              
              await verifyMessage(msg, ticket, contact, ticketTraking);
            }

            
            wbot.sendMessage(contact.remoteJid, { text: whatsapp.collectiveVacationMessage })

            return
          }
        }

      }

    } catch (e) {
      Sentry.captureException(e);
      console.error('Erro ao processar mensagem de férias coletivas:', e);
    }

    const isMsgForwarded = msg.message?.extendedTextMessage?.contextInfo?.isForwarded ||
      msg.message?.imageMessage?.contextInfo?.isForwarded ||
      msg.message?.audioMessage?.contextInfo?.isForwarded ||
      msg.message?.videoMessage?.contextInfo?.isForwarded ||
      msg.message?.documentMessage?.contextInfo?.isForwarded

    let mediaSent: Message | undefined;

    if (!useLGPD) {
      // 🛡️ ANTI-DUPLICAÇÃO: Verificar se a mensagem já foi processada
      if (msg.key.fromMe) {
        const existingMessage = await Message.findOne({
          where: {
            wid: getSafeMessageId(msg),
            companyId: companyId
          }
        });
        
        if (existingMessage) {
          logger.info(`🛡️ [ANTI-DUP-HANDLER] Mensagem já existe, pulando processamento: { wid: ${getSafeMessageId(msg)}, ticketId: ${ticket.id} }`);
          return;
        }
      }
      
      if (hasMedia) {
        try {
          logger.info(`📥 [HANDLE-MESSAGE] Processando mensagem de mídia: { messageId: ${getSafeMessageId(msg)} }`);
          mediaSent = await verifyMediaMessage(msg, ticket, contact, ticketTraking, isMsgForwarded, false, wbot);
        } catch (error) {
          logger.error(`❌ [HANDLE-MESSAGE] Erro ao processar mídia (não crítico): { messageId: ${getSafeMessageId(msg)}, error: ${error.message} }`);
          // Em caso de erro na mídia, processar como mensagem de texto
          try {
            await verifyMessage(msg, ticket, contact, ticketTraking, false, isMsgForwarded);
          } catch (fallbackError) {
            logger.error(`❌ [HANDLE-MESSAGE] Erro no fallback de mensagem: { messageId: ${getSafeMessageId(msg)}, error: ${fallbackError.message} }`);
          }
        }
      } else {
        
        await verifyMessage(msg, ticket, contact, ticketTraking, false, isMsgForwarded);
      }
    }


    // Atualiza o ticket se a ultima mensagem foi enviada por mim, para que possa ser finalizado. 
    try {
      
      await ticket.update({
        fromMe: msg.key.fromMe,
      });
    } catch (e) {
      Sentry.captureException(e);
      console.error('Erro ao atualizar ticket fromMe:', e);
    }

    let currentSchedule;

    if (settings.scheduleType === "company") {
     
      currentSchedule = await VerifyCurrentSchedule(companyId, 0, 0);
    } else if (settings.scheduleType === "connection") {
      
      currentSchedule = await VerifyCurrentSchedule(companyId, 0, whatsapp.id);
    }

    if (!msg.key.fromMe && !ticket.userId) {
      const { prompt } = await ShowWhatsAppService(wbot.id, companyId);
      
      if (prompt && prompt.apiKey) {
        await handleOpenAi(
          msg,
          wbot,
          ticket,
          contact,
          mediaSent,
          ticketTraking
        );
        return;
      }
    }

    try {
      if (!msg.key.fromMe && settings.scheduleType && (!ticket.isGroup || whatsapp.groupAsTicket === "enabled") && !["open", "group"].includes(ticket.status)) {
        /**
         * Tratamento para envio de mensagem quando a empresa está fora do expediente
         */
        
        if (
          (settings.scheduleType === "company" || settings.scheduleType === "connection") &&
          !isNil(currentSchedule) &&
          (!currentSchedule || currentSchedule.inActivity === false)
        ) {

         
          if (whatsapp.maxUseBotQueues && whatsapp.maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= whatsapp.maxUseBotQueues) {
            // await UpdateTicketService({
            //   ticketData: { queueId: queues[0].id },
            //   ticketId: ticket.id
            // });

            return;
          }

          if (whatsapp.timeUseBotQueues !== "0") {
            
            if (ticket.isOutOfHour === false && ticketTraking.chatbotAt !== null) {
              
              await ticketTraking.update({
                chatbotAt: null
              });
              await ticket.update({
                amountUsedBotQueues: 0
              });
            }

            //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
            let dataLimite = new Date();
            let Agora = new Date();


            if (ticketTraking.chatbotAt !== null) {
              dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(whatsapp.timeUseBotQueues)));
              
              if (ticketTraking.chatbotAt !== null && Agora < dataLimite && whatsapp.timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
                return
              }
            }

            await ticketTraking.update({
              chatbotAt: null
            })
          }

          // CORREÇÃO: Enviar mensagem de fora de expediente baseada no tipo de agendamento
          let outOfHoursMessage = "";
          let messageSource = "";
          
          if (settings.scheduleType === "company") {
            outOfHoursMessage = settings.outOfHoursMessage || "";
            messageSource = "Empresa";
          } else if (settings.scheduleType === "connection") {
            outOfHoursMessage = whatsapp.outOfHoursMessage || "";
            messageSource = `Conexão: ${whatsapp.name}`;
          }
          
          if (outOfHoursMessage && outOfHoursMessage !== "" && outOfHoursMessage !== null) {
            try {
              const body = formatBody(`\u200e${outOfHoursMessage}`, ticket);
              
              const debouncedSentMessage = debounce(
                async () => {
                  const sentMessage = await wbot.sendMessage(
                    `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                    {
                      text: body
                    }
                  );
                  await verifyMessage(sentMessage, ticket, contact, ticketTraking);
                },
                1000,
                ticket.id
              );
              debouncedSentMessage();
              
              logger.info(`Mensagem de fora de expediente enviada para ticket ${ticket.id} - ${messageSource}`);
            } catch (sendError) {
              logger.error(`Erro ao enviar mensagem de fora de expediente para ticket ${ticket.id}: ${sendError}`);
            }
          }

          //atualiza o contador de vezes que enviou o bot e que foi enviado fora de hora
          await ticket.update({
            isOutOfHour: true,
            amountUsedBotQueues: ticket.amountUsedBotQueues + 1
          });

          return;
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.error('Erro ao processar horário de funcionamento:', e);
    }


    const flow = await FlowBuilderModel.findOne({
      where: {
        id: ticket.flowStopped
      }
    });

    let isMenu = false;
    if (flow) {
      isMenu = flow.flow["nodes"].find((node: any) => node.id === ticket.lastFlowId)?.type === "menu";
    }


  
    if (
      !ticket.fromMe &&
      isMenu &&
      (ticket.status !== "open" && ticket.status !== "closed") &&
      !isNaN(parseInt(ticket.lastMessage))
    ) {

      await flowBuilderQueue(ticket, msg, wbot, whatsapp, companyId, contact, isFirstMsg)
    }



    //flowbuilder na conexao
    if (
      !ticket.imported &&
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !ticket.queue &&
      !ticket.user &&
      !isMenu &&
      (!ticket.dataWebhook || ticket.dataWebhook["status"] === "stopped") &&
      // ticket.isBot &&
      !isNil(whatsapp.integrationId) &&
      !ticket.useIntegration
    ) {
      const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);

      if (integrations.type === "flowbuilder") {
        await flowbuilderIntegration(msg, wbot, companyId, integrations, ticket, contact, isFirstMsg)
      }

    }
   
    const isQueueAndIntegration = (ticket.useIntegration && !ticket.queue) || (ticket.useIntegration && ticket.queue) || (!ticket.useIntegration && !ticket.queue);
    
    //integraçao na conexao
    if (
      !ticket.imported &&
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !ticket.user &&
      isQueueAndIntegration &&
      // ticket.isBot &&
      !isNil(whatsapp.integrationId)
    ) {
    
      const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);
      await handleMessageIntegration(msg, wbot, companyId, integrations, ticket, contact, isFirstMsg)

      return
    }


    // Lógica de filas - só executa se scheduleType for "queue" ou não definido
    if (
      !ticket.imported &&
      !ticket.queue &&
      (!ticket.isGroup || whatsapp.groupAsTicket === "enabled") &&
      !msg.key.fromMe &&
      !ticket.userId && 
      whatsapp.queues.length >= 1 &&
      !ticket.useIntegration &&
      (!settings.scheduleType || settings.scheduleType === "queue")
    ) {
      
      try {
        await verifyQueue(wbot, msg, ticket, contact, settings, ticketTraking);

        if (ticketTraking.chatbotAt === null) {
          await ticketTraking.update({
            chatbotAt: moment().toDate(),
          })
        }
      } catch (queueError) {
        logger.error(`Erro ao verificar fila: ${queueError}`);
        Sentry.captureException(queueError);
        // Continua o processamento mesmo com erro na fila
      }
    }

    // Lógica de mensagens fora de expediente - executa para todos os tipos (empresa, conexão, fila)
    // mas só se não for mensagem do próprio bot
    if (!msg.key.fromMe) {
      try {
        await handleOutsideBusinessHours(wbot, msg, ticket, contact, settings, ticketTraking, whatsapp);
      } catch (scheduleError) {
        logger.error(`Erro ao processar horário de funcionamento: ${scheduleError}`);
        Sentry.captureException(scheduleError);
        // Continua o processamento mesmo com erro no horário
      }
    }

    if (ticket.queueId > 0) {
      
      await ticketTraking.update({
        queueId: ticket.queueId
      })
    }
    try {
      if (!msg.key.fromMe) {
        /**
         * Verifica se a mensagem pode ser processada
         */
       
        // Tratamento para avaliação do atendente (NPS)
        if (ticket.status === "nps" && ticketTraking !== null && verifyRating(ticketTraking)) {
          if (!isNaN(parseFloat(bodyMessage))) {
            handleRating(parseFloat(bodyMessage), ticket, ticketTraking);
         
            await ticketTraking.update({
              ratingAt: moment().toDate(),
              finishedAt: moment().toDate(),
              rated: true,
            });
            
            return;
          } else {
            if (ticket.amountUsedBotQueuesNPS < whatsapp.maxUseBotQueuesNPS) {
              const bodyErrorRating = "Opção inválida, tente novamente.\n";
              const sentMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                { text: bodyErrorRating }
              );
    
              verifyMessage(sentMessage, ticket, contact, ticketTraking);
    
              await delay(1000);
    
              const bodyRatingMessage = whatsapp.ratingMessage;
              const msg = await SendWhatsAppMessage({ body: bodyRatingMessage, ticket });
    
              await verifyMessage(msg, ticket, ticket.contact);
    
              await ticket.update({
                amountUseBotQueuesNPS: ticket.amountUsedBotQueuesNPS + 1,
              });
    
              return;
            }
          }
        }
    
        // Tratamento LGPD
        if (enableLGPD && ticket.status === "lgpd" && !isImported) {
          const choosenOption = parseInt(msg?.message?.conversation || "", 10);
    
          if (choosenOption === 1) {
            await contact.update({ lgpdAcceptedAt: moment().toDate() });
            await ticket.update({
              lgpdAcceptedAt: moment().toDate(),
              status: "pending",
              amountUsedBotQueues: 0,
            });
          } else if (choosenOption === 2) {
            if (whatsapp.complationMessage) {
              const sentMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                { text: whatsapp.complationMessage }
              );
              verifyMessage(sentMessage, ticket, contact, ticketTraking);
            }
            await ticket.update({ status: "closed", amountUsedBotQueues: 0 });
            await ticketTraking.destroy();
            return;
          } else {
            if (ticket.amountUsedBotQueues < whatsapp.maxUseBotQueues) {
              await ticket.update({
                amountUsedBotQueues: ticket.amountUsedBotQueues + 1,
                lgpdSendMessageAt: null,
              });
            }
          }
    
          if (!ticket.lgpdSendMessageAt && !ticket.lgpdAcceptedAt) {
            const lgpdMessage = formatBody(settings?.lgpdMessage || "", ticket);
            const sentMessage = await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              { text: lgpdMessage }
            );
    
            verifyMessage(sentMessage, ticket, contact, ticketTraking);
    
            await delay(1000);
    
            if (settings?.lgpdLink) {
              const bodyLink = formatBody(settings.lgpdLink, ticket);
              await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                { text: bodyLink }
              );
            }
    
            const bodyBot =
              "Estou ciente sobre o tratamento dos meus dados pessoais.\n\n[1] Sim\n[2] Não";
    
            const sentMessageBot = await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              { text: bodyBot }
            );
    
            await verifyMessage(sentMessageBot, ticket, contact, ticketTraking);
    
            await ticket.update({
              lgpdSendMessageAt: moment().toDate(),
              amountUsedBotQueues: ticket.amountUsedBotQueues + 1,
            });
    
            return;
          }
        }
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      Sentry.captureException(error);
    }
    

  } catch (err) {
    Sentry.captureException(err);
    console.error('Erro ao processar mensagem do WhatsApp:', err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }

}


const handleMsgAck = async (
  msg: WAMessage,
  chat: number | null | undefined
) => {
  await new Promise(r => setTimeout(r, 500));
  const io = getIO();

  try {
    if (!msg.key.id) {
      logger.warn("handleMsgAck: msg.key.id is undefined, skipping message ack update");
      return;
    }

    const messageToUpdate = await Message.findOne({
      where: {
        wid: msg.key.id,
      },
      include: [
        "contact",
        {
          model: Ticket,
          as: "ticket",
          include: [
            {
              model: Contact,
              attributes: ["id", "name", "number", "email", "profilePicUrl", "acceptAudioMessage", "active", "urlPicture", "companyId"],
              include: ["extraInfo", "tags"]
            },
            {
              model: Queue,
              attributes: ["id", "name", "color"]
            },
            {
              model: Whatsapp,
              attributes: ["id", "name", "groupAsTicket"]
            },
            {
              model: User,
              attributes: ["id", "name"]
            },
            {
              model: Tag,
              as: "tags",
              attributes: ["id", "name", "color"]
            }
          ]
        },
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"],
        },
      ],
    });
    if (!messageToUpdate || messageToUpdate.ack > chat) return;

    await messageToUpdate.update({ ack: chat });
    io.of(messageToUpdate.companyId.toString())
      // .to(messageToUpdate.ticketId.toString())
      .emit(`company-${messageToUpdate.companyId}-appMessage`,
        {
          action: "update",
          message: messageToUpdate
        }
      );
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack. Err: ${err}`);
  }
};

const verifyRecentCampaign = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  if (!isValidMsg(message)) {
    return;
  }
  if (!message.key.fromMe) {
    const number = message.key.remoteJid.replace(/\D/g, "");
    const campaigns = await Campaign.findAll({
      where: { companyId, status: "EM_ANDAMENTO", confirmation: true }
    });
    if (campaigns) {
      const ids = campaigns.map(c => c.id);
      const campaignShipping = await CampaignShipping.findOne({
        where: { campaignId: { [Op.in]: ids }, number, confirmation: null, deliveredAt: { [Op.ne]: null } }
      });

      if (campaignShipping) {
        await campaignShipping.update({
          confirmedAt: moment(),
          confirmation: true
        });
        await campaignQueue.add(
          "DispatchCampaign",
          {
            campaignShippingId: campaignShipping.id,
            campaignId: campaignShipping.campaignId
          },
          {
            delay: parseToMilliseconds(randomValue(0, 10))
          }
        );
      }
    }
  }
};

const verifyCampaignMessageAndCloseTicket = async (message: proto.IWebMessageInfo, companyId: number, wbot: Session) => {
  if (!isValidMsg(message)) {
    return;
  }



  const io = getIO();
  const body = await getBodyMessage(message);
  const isCampaign = /\u200c/.test(body);

  if (message.key.fromMe && isCampaign) {
    let msgContact: IMe;
    msgContact = await getContactMessage(message, wbot);
    // ✅ TICKETZ COMPAT: Usar wrapper compatible
    const contact = await verifyContactTicketzCompat(
      msgContact,
      wbot,
      companyId
    );


    const messageRecord = await Message.findOne({
      where: {
        [Op.or]: [
          { wid: message.key.id! },
          { contactId: contact.id }
        ],
        companyId
      }
    });

    if (!isNull(messageRecord) || !isNil(messageRecord) || messageRecord !== null) {
      const ticket = await Ticket.findByPk(messageRecord.ticketId);
      await ticket.update({ status: "closed", amountUsedBotQueues: 0 });

      io.of(String(companyId))
        // .to("open")
        .emit(`company-${companyId}-ticket`, {
          action: "delete",
          ticket,
          ticketId: ticket.id
        });

      io.of(String(companyId))
        // .to(ticket.status)
        // .to(ticket.id.toString())
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket,
          ticketId: ticket.id
        });
    }
  }
};

const filterMessages = (msg: WAMessage): boolean => {
  msgDB.save(msg);

  if (msg.message?.protocolMessage?.editedMessage) return true;
  if (msg.message?.protocolMessage) return false;

  // Permitir mensagens CIPHERTEXT apenas se vierem de origem LID
  const isLidMessage = msg.key?.remoteJid?.includes("@lid");
  const isCiphertext = msg.messageStubType === WAMessageStubType.CIPHERTEXT;
  
  if (isCiphertext && isLidMessage) {
    // Mensagens LID com CIPHERTEXT são permitidas (comportamento normal do WhatsApp)
    return true;
  }

  if (
    [
      WAMessageStubType.REVOKE,
      WAMessageStubType.E2E_DEVICE_CHANGED,
      WAMessageStubType.E2E_IDENTITY_CHANGED,
      WAMessageStubType.CIPHERTEXT
    ].includes(msg.messageStubType)
  )
    return false;

  return true;
};

// Cache para evitar processamento duplicado de mensagens muito próximas
const messageProcessingCache = new Map<string, number>();

// Limpar cache periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of messageProcessingCache.entries()) {
    if (now - timestamp > 30000) { // Remove entradas com mais de 30 segundos
      messageProcessingCache.delete(key);
    }
  }
}, 60000); // A cada minuto

const wbotMessageListener = (wbot: Session, companyId: number): void => {
  console.log(`🎧 [LISTENER-START] Iniciando listener para wbot ID: ${wbot.id}, company: ${companyId}`);
  
  wbot.ev.on("messages.upsert", async (messageUpsert: ImessageUpsert) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📨 [MESSAGES-UPSERT] ${timestamp} - MENSAGEM RECEBIDA:`);
    console.log(`  Company: ${companyId}`);
    console.log(`  Wbot ID: ${wbot.id}`);
    console.log(`  Messages Count: ${messageUpsert.messages?.length || 0}`);
    console.log(`  Type: ${messageUpsert.type}`);
    
    logger.info(`📨 [MESSAGES-UPSERT] INICIO: { companyId: ${companyId}, wbotId: ${wbot.id}, messagesCount: ${messageUpsert.messages?.length || 0} }`);
    
    try {
      const messages = messageUpsert.messages
        .filter(filterMessages)
        .map(msg => msg);

      if (!messages) {
        logger.info(`📨 [MESSAGES-UPSERT] SEM MENSAGENS: Filtro removeu todas as mensagens`);
        return;
      }

      // 🔥 PROCESSAMENTO SIMPLIFICADO BASEADO NO TICKETZ - EVITA LOOP INFINITO
      messages.forEach(async (message: proto.IWebMessageInfo) => {
        try {
          // ✅ TICKETZ COMPAT: Permitir mensagens CIPHERTEXT de @lid sem conteúdo
          const isLidMessage = message.key?.remoteJid?.includes("@lid");
          const isCiphertext = message.messageStubType === WAMessageStubType.CIPHERTEXT;
          
          if (!message?.message && !(isCiphertext && isLidMessage)) {
            logger.warn({ message }, "📨 [MESSAGES-UPSERT] Mensagem sem conteúdo suportado");
            return;
          }

          // 🔍 ULTRA-DEBUG: Log específico do processamento da mensagem
          logger.info(`🔍 [ULTRA-DEBUG] MESSAGES-UPSERT - Processando mensagem: { messageId: ${message.key.id}, contactId: ${message.key.remoteJid}, companyId: ${companyId} }`);

          const jid = message.key?.remoteJid || "";
          if (!jid.endsWith("@lid")) {
            await wbot.sendReceipts([message.key], undefined);
          }

          // Verificar campanha (sem parar o processamento - só registra)
          await verifyRecentCampaign(message, companyId);

          // 🔍 ULTRA-DEBUG: Log antes de chamar handleMessage
          logger.info(`🔍 [ULTRA-DEBUG] MESSAGES-UPSERT - Chamando handleMessage: { messageId: ${message.key.id} }`);
          
          await handleMessage(message, wbot, companyId);
          
          // 🔍 ULTRA-DEBUG: Log após handleMessage bem-sucedido
          logger.info(`🔍 [ULTRA-DEBUG] MESSAGES-UPSERT - handleMessage concluído com sucesso: { messageId: ${message.key.id} }`);

          // 🔍 ULTRA-DEBUG: Log de conclusão final da mensagem
          logger.info(`✅ [ULTRA-DEBUG] MESSAGES-UPSERT - MENSAGEM PROCESSADA COMPLETAMENTE: { messageId: ${message.key.id} }`);

        } catch (error) {
          logger.error(`❌ [MESSAGES-UPSERT] ERRO NA MENSAGEM: { messageId: ${message.key.id}, error: ${error.message} }`);
          Sentry.captureException(error);
        }
      });
    
    logger.info(`📨 [MESSAGES-UPSERT] CONCLUIDO: { companyId: ${companyId}, wbotId: ${wbot.id}, processedCount: ${messages.length} }`);
    } catch (error) {
      logger.error(`❌ [MESSAGES-UPSERT] ERRO CRITICO: { companyId: ${companyId}, wbotId: ${wbot.id}, error: ${error.message}, stack: ${error.stack} }`);
      throw error;
    }
  });

  // 🚀 Throttling para logs de messages.update (evitar spam)
  let messageUpdateCount = 0;
  let lastLogTime = Date.now();

  wbot.ev.on("messages.update", (messageUpdate: WAMessageUpdate[]) => {
    messageUpdateCount += messageUpdate.length;
    const now = Date.now();

    // Log apenas a cada 10 segundos ou se for um batch muito grande
    if (now - lastLogTime > 10000 || messageUpdate.length > 50) {
      logger.info(`🔄 [MESSAGES-UPDATE] BATCH: { companyId: ${companyId}, wbotId: ${wbot.id}, updatesCount: ${messageUpdate.length}, totalProcessed: ${messageUpdateCount} }`);
      lastLogTime = now;
    }

    try {
      if (messageUpdate.length === 0) {
        return;
      }
      
      messageUpdate.forEach(async (message: WAMessageUpdate) => {

      (wbot as WASocket)!.readMessages([message.key])

      const msgUp = { ...messageUpdate }

      if (msgUp['0']?.update.messageStubType === 1 && msgUp['0']?.key.remoteJid !== 'status@broadcast') {
        MarkDeleteWhatsAppMessage(msgUp['0']?.key.remoteJid, null, msgUp['0']?.key.id, companyId)
      }

      let ack;
      if (message.update.status === 3 && message?.key?.fromMe) {
        ack = 2;
      } else {
        ack = message.update.status;
      }

      if (REDIS_URI_MSG_CONN !== '') {
        BullQueues.add(`${process.env.DB_NAME}-handleMessageAck`, { msg: message, chat: ack }, {
          priority: 1,
          jobId: `${wbot.id}-handleMessageAck-${message.key.id}`
        })
      }
      else {
        handleMsgAck(message, ack);
      }
    });

    // Log de conclusão removido para reduzir spam
    } catch (error) {
      logger.error(`❌ [MESSAGES-UPDATE] ERRO CRITICO: { companyId: ${companyId}, wbotId: ${wbot.id}, error: ${error.message}, stack: ${error.stack} }`);
      throw error;
    }
  });

  // wbot.ev.on('message-receipt.update', (events: any) => {
  //   events.forEach(async (msg: any) => {
  //     const ack = msg?.receipt?.receiptTimestamp ? 3 : msg?.receipt?.readTimestamp ? 4 : 0;
  //     if (!ack) return;
  //     await handleMsgAck(msg, ack);
  //   });
  // })
  // wbot.ev.on("presence.update", (events: any) => {
  //   console.log(events)
  // })

  // Função debounce simples para eventos
  const createDebounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Debounce para eventos de contatos para evitar múltiplas chamadas
  const debouncedContactUpdate = createDebounce(async (contacts: any[]) => {
    const processedContacts = new Set<string>();
    
    for (const contact of contacts) {
      if (!contact?.id) continue;
      
      const contactKey = `${contact.id}-${companyId}`;
      if (processedContacts.has(contactKey)) continue;
      processedContacts.add(contactKey);

      if (typeof contact.imgUrl !== 'undefined') {
        const number = contact.id.replace(/\D/g, "");
        
        // Log do evento Baileys
        raceConditionLogger.logBaileysEvent(
          'contacts.update',
          number,
          companyId,
          wbot.id,
          { hasImgUrl: contact.imgUrl !== undefined }
        );

        // Verifica se já existe no cache antes de processar
        const existsInCache = contactCache.exists(number, companyId);
        if (existsInCache) {
          // Se existe no cache, apenas invalida para forçar atualização na próxima consulta
          contactCache.invalidate(number, companyId);
          continue;
        }

        try {
          const newUrl = contact.imgUrl === ""
            ? ""
            : await wbot!.profilePictureUrl(contact.id!).catch(() => null);
            
          const contactData = {
            name: contact.id.replace(/\D/g, ""),
            number: number,
            isGroup: contact.id.includes("@g.us") ? true : false,
            companyId: companyId,
            remoteJid: contact.id,
            profilePicUrl: newUrl,
            whatsappId: wbot.id,
            wbot: wbot
          };

          await CreateOrUpdateContactService(contactData);
        } catch (error) {
          raceConditionLogger.logConstraintError(
            number,
            companyId,
            `Error in contacts.update event: ${error.message}`,
            wbot.id
          );
        }
      }
    }
  }, 500); // 500ms de debounce

  wbot.ev.on("contacts.update", (contacts: any) => {
    if (!contacts || contacts.length === 0) return;
    debouncedContactUpdate(contacts);
  })
  // Debounce para eventos de grupos
  const debouncedGroupUpdate = createDebounce(async (groupUpdates: GroupMetadata[]) => {
    const processedGroups = new Set<string>();
    
    for (const group of groupUpdates) {
      if (!group?.id) continue;
      
      const groupKey = `${group.id}-${companyId}`;
      if (processedGroups.has(groupKey)) continue;
      processedGroups.add(groupKey);

      const number = group.id.replace(/\D/g, "");
      const nameGroup = group.subject || number;

      // Log do evento Baileys
      raceConditionLogger.logBaileysEvent(
        'groups.update',
        number,
        companyId,
        wbot.id,
        { groupName: nameGroup, groupId: group.id }
      );

      // Verifica se já existe no cache antes de processar
      const existsInCache = contactCache.exists(number, companyId);
      if (existsInCache) {
        // Se existe no cache, apenas invalida para forçar atualização na próxima consulta
        contactCache.invalidate(number, companyId);
        continue;
      }

      try {
        let profilePicUrl: string = "";
        // try {
        //   profilePicUrl = await wbot.profilePictureUrl(group.id, "image");
        // } catch (e) {
        //   Sentry.captureException(e);
        //   profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
        // }
        
        const contactData = {
          name: nameGroup,
          number: number,
          isGroup: true,
          companyId: companyId,
          remoteJid: group.id,
          profilePicUrl,
          whatsappId: wbot.id,
          wbot: wbot
        };

        await CreateOrUpdateContactService(contactData);
      } catch (error) {
        raceConditionLogger.logConstraintError(
          number,
          companyId,
          `Error in groups.update event: ${error.message}`,
          wbot.id
        );
      }
    }
  }, 500); // 500ms de debounce

  wbot.ev.on("groups.update", (groupUpdate: GroupMetadata[]) => {
    if (!groupUpdate || groupUpdate.length === 0) return;
    debouncedGroupUpdate(groupUpdate);
  })
};

export { wbotMessageListener, handleMessage, isValidMsg, getTypeMessage, handleMsgAck };