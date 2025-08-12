import { WAMessage, AnyMessageContent, delay } from "baileys";
import * as Sentry from "@sentry/node";
import fs, { unlink, unlinkSync } from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import mime from "mime-types";
import Contact from "../../models/Contact";
import { getWbot } from "../../libs/wbot";
import CreateMessageService from "../MessageServices/CreateMessageService";
import formatBody from "../../helpers/Mustache";
import logger from "../../utils/logger";
interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  companyId?: number;
  body?: string;
  isPrivate?: boolean;
  isForwarded?: boolean;
}
const os = require("os");

// let ffmpegPath;
// if (os.platform() === "win32") {
//   // Windows
//   ffmpegPath = "C:\\ffmpeg\\ffmpeg.exe"; // Substitua pelo caminho correto no Windows
// } else if (os.platform() === "darwin") {
//   // macOS
//   ffmpegPath = "/opt/homebrew/bin/ffmpeg"; // Substitua pelo caminho correto no macOS
// } else {
//   // Outros sistemas operacionais (Linux, etc.)
//   ffmpegPath = "/usr/bin/ffmpeg"; // Substitua pelo caminho correto em sistemas Unix-like
// }

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudio = async (audio: string, companyId: string): Promise<string> => {
  const outputAudio = `${publicFolder}/company${companyId}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i ${audio}  -vn -ar 44100 -ac 2 -b:a 192k ${outputAudio} -y`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        // fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
  // return new Promise((resolve, reject) => {
  //   exec(
  //     `${ffmpegPath} -i ${audio} -vn -ab 128k -ar 44100 -f ipod ${outputAudio} -y`,
  //     (error, _stdout, _stderr) => {
  //       if (error) reject(error);
  //       // fs.unlinkSync(audio);
  //       resolve(outputAudio);
  //     }
  //   );
  // });
};

const processAudioFile = async (audio: string, companyId: string): Promise<string> => {
  const outputAudio = `${publicFolder}/company${companyId}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i ${audio} -vn -ar 44100 -ac 2 -b:a 192k ${outputAudio}`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        // fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};

export const getMessageOptions = async (
  fileName: string,
  pathMedia: string,
  companyId?: string,
  body: string = " "
): Promise<any> => {
  const mimeType = mime.lookup(pathMedia);
  const typeMessage = mimeType.split("/")[0];

  try {
    if (!mimeType) {
      throw new Error("Invalid mimetype");
    }
    let options: AnyMessageContent;

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: body ? body : null,
        fileName: fileName
        // gifPlayback: true
      };
    } else if (typeMessage === "audio") {
      const typeAudio = true; //fileName.includes("audio-record-site");
      const convert = await processAudio(pathMedia, companyId);
      if (typeAudio) {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: "audio/mp4",
          ptt: true
        };
      } else {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: typeAudio ? "audio/mp4" : mimeType,
          ptt: true
        };
      }
    } else if (typeMessage === "document") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body ? body : null,
        fileName: fileName,
        mimetype: mimeType
      };
    } else if (typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body ? body : null,
        fileName: fileName,
        mimetype: mimeType
      };
    } else {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: body ? body : null,
      };
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    console.error('Erro ao processar opções de mensagem:', e);
    return null;
  }
};

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body = "",
  isPrivate = false,
  isForwarded = false
}: Request): Promise<WAMessage> => {
  try {
    logger.info(`📤 [SEND-MEDIA] Iniciando envio de mídia:`, {
      ticketId: ticket.id,
      contactId: ticket.contactId,
      mediaType: media.mimetype,
      filename: media.originalname,
      isGroup: ticket.isGroup,
      isPrivate
    });

    const wbot = await getWbot(ticket.whatsappId);
    const companyId = ticket.companyId.toString()
    
    const pathMedia = media.path;
    const typeMessage = media.mimetype.split("/")[0];
    let options: AnyMessageContent;
    let bodyTicket = "";
    const bodyMedia = ticket ? formatBody(body, ticket) : body;

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        fileName: media.originalname.replace('/', '-'),
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };
      
      bodyTicket = "🎥 Arquivo de vídeo"
    } else if (typeMessage === "audio") {
      
      const typeAudio = true; //media.originalname.includes("audio-record-site");
      if (typeAudio) {
        const convert = await processAudio(media.path, companyId);
        options = {
          audio: fs.readFileSync(convert),
          mimetype: "audio/mpeg",
          ptt: true,
          caption: bodyMedia,
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
        };
        unlinkSync(convert);
      } else {
        const convert = await processAudio(media.path, companyId);
        options = {
          audio: fs.readFileSync(convert),
          mimetype: "audio/mpeg",
          ptt: true,
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
        };
        unlinkSync(convert);
      }
      bodyTicket = "🎵 Arquivo de áudio"
    } else if (typeMessage === "document" || typeMessage === "text") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        fileName: media.originalname.replace('/', '-'),
        mimetype: media.mimetype,
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };
      bodyTicket = "📂 Documento"
    } else if (typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        fileName: media.originalname.replace('/', '-'),
        mimetype: media.mimetype,
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };
      bodyTicket = "📎 Outros anexos"
    } else {
      if (media.mimetype.includes("gif")) {
        options = {
          image: fs.readFileSync(pathMedia),
          caption: bodyMedia,
          mimetype: "image/gif",
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
          gifPlayback: true

        };
      } else {
        options = {
          image: fs.readFileSync(pathMedia),
          caption: bodyMedia,
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
        };
      }
      bodyTicket = "📎 Outros anexos"
    }

    if (isPrivate === true) {
      const messageData = {
        wid: `PVT${companyId}${ticket.id}${body.substring(0, 6)}`,
        ticketId: ticket.id,
        contactId: undefined,
        body: bodyMedia,
        fromMe: true,
        mediaUrl: media.filename,
        mediaType: media.mimetype.split("/")[0],
        read: true,
        quotedMsgId: null,
        ack: 2,
        remoteJid: null,
        participant: null,
        dataJson: null,
        ticketTrakingId: null,
        isPrivate
      };

      await CreateMessageService({ messageData, companyId: ticket.companyId });

      return
    }

    const contactNumber = await Contact.findByPk(ticket.contactId)

    let number: string;

    // ✅ CORREÇÃO PARA LID: Usar lógica similar ao Ticketz para resolução de JID
    if (contactNumber.remoteJid && contactNumber.remoteJid !== "" && contactNumber.remoteJid.includes("@")) {
      // Se já tem remoteJid válido, usar ele (pode ser LID ou JID normal)
      number = contactNumber.remoteJid;
      logger.info(`📤 [SEND-MEDIA] Usando remoteJid existente: ${number}`);
    } else if (contactNumber.number.includes("@")) {
      // Se o número já tem @ (pode ser LID), usar como está
      number = contactNumber.number;
      logger.info(`📤 [SEND-MEDIA] Usando número com @ existente: ${number}`);
    } else {
      // Caso padrão: construir JID normal
      number = `${contactNumber.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`;
      logger.info(`📤 [SEND-MEDIA] Construindo JID padrão: ${number}`);
    }


    // 🚨 PROTEÇÃO CRÍTICA: Não enviar presence para números LID (causa XML malformed)
    if (!number.includes("@lid") && !number.includes("@newsletter")) {
      await wbot.sendPresenceUpdate('recording', number);
      logger.debug(`✅ [PRESENCE] Enviando presence para: ${number}`);
    } else {
      logger.debug(`🛡️ [PRESENCE-PROTECTION] Bloqueando envio de presence para LID/Newsletter: ${number}`);
    }
    await delay(500)

    logger.info(`📤 [SEND-MEDIA] Enviando mensagem para:`, {
      targetJid: number,
      isLidFormat: number.includes("@lid"),
      isNewsletterFormat: number.includes("@newsletter"),
      mediaType: typeMessage,
      optionsKeys: Object.keys(options)
    });

    const sentMessage = await wbot.sendMessage(
      number,
      {
        ...options
      }
    );

    logger.info(`✅ [SEND-MEDIA] Mídia enviada com sucesso:`, {
      messageId: sentMessage.key?.id,
      messageKey: sentMessage.key,
      fromMe: sentMessage.key?.fromMe,
      remoteJid: sentMessage.key?.remoteJid
    });

    await ticket.update({ lastMessage: body !== media.filename ? body : bodyMedia, imported: null });

    return sentMessage;
  } catch (err) {
    logger.error(`❌ [SEND-MEDIA] Erro ao enviar mídia:`, {
      ticketId: ticket.id,
      contactId: ticket.contactId,
      filename: media.originalname,
      error: err.message,
      errorStack: err.stack
    });
    console.error(`Erro ao enviar mídia - Ticket: ${ticket.id}, Arquivo: ${media.originalname}:`, err);
    Sentry.captureException(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;
