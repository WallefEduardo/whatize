import { WAMessage, delay } from "baileys";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import Whatsapp from "../../models/Whatsapp";
import { isNil } from "lodash";
import { Session } from "../../libs/wbot";

import formatBody from "../../helpers/Mustache";
import logger from "../../utils/logger";
import { getJidOf } from "./getJidOf";
import { verifyMediaMessage, verifyMessage } from "./wbotMessageListener";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  msdelay?: number;
  vCard?: Contact;
  isForwarded?: boolean;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  msdelay,
  vCard,
  isForwarded = false
}: Request): Promise<WAMessage> => {
  logger.info(`📤 [SEND-MSG] Iniciando envio de mensagem: { ticketId: ${ticket.id}, contactId: ${ticket.contactId}, body: "${body?.substring(0, 50)}..." }`);
  
  // 🛡️ VALIDAÇÃO CRÍTICA DO TICKETZ: Verificar se conexão está ativa
  const connection = await Whatsapp.findByPk(ticket.whatsappId);
  
  if (!connection) {
    logger.error(`❌ [SEND-MSG] WhatsApp não encontrado: { whatsappId: ${ticket.whatsappId} }`);
    throw new AppError("ERR_WAPP_NOT_FOUND");
  }
  
  logger.info(`📡 [SEND-MSG] Status da conexão: { whatsappId: ${connection.id}, status: '${connection.status}' }`);
  
  if (connection.status !== "CONNECTED") {
    logger.error(`❌ [SEND-MSG] WhatsApp não conectado: { whatsappId: ${connection.id}, status: '${connection.status}' }`);
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  
  let options = {};
  
  logger.info(`🔄 [SEND-MSG] Obtendo wbot para o ticket...`);
  const wbot = await GetTicketWbot(ticket) as Session;
  
  // ✅ TICKETZ COMPAT: Usar getJidOf para resolver JID corretamente
  const targetJid = getJidOf(ticket);
  logger.info(`📤 [WHATIZE-TICKETZ] SendWhatsAppMessage - Target JID resolved: {
    targetJid: '${targetJid}',
    isLidFormat: ${targetJid.includes("@lid")},
    ticketContactNumber: '${ticket.contact.number}',
    lastRemoteJid: '${ticket.lastRemoteJid || "not set"}',
    usingLastRemoteJid: ${!!ticket.lastRemoteJid}
  }`);

  if (quotedMsg) {
    const chatMessages = await Message.findOne({
      where: {
        id: quotedMsg.id
      }
    });

    if (chatMessages) {
      const msgFound = JSON.parse(chatMessages.dataJson);


      if (msgFound.message.extendedTextMessage !== undefined) {
        options = {
          quoted: {
            key: msgFound.key,
            message: {
              extendedTextMessage: msgFound.message.extendedTextMessage,
            }
          },
        };
      } else {
        options = {
          quoted: {
            key: msgFound.key,
            message: {
              conversation: msgFound.message.conversation,
            }
          },
        };
      }
    }
  }

  if (!isNil(vCard)) {
    const numberContact = vCard.number;
    const firstName = vCard.name.split(' ')[0];
    const lastName = String(vCard.name).replace(vCard.name.split(' ')[0], '')

    const vcard = `BEGIN:VCARD\n`
      + `VERSION:3.0\n`
      + `N:${lastName};${firstName};;;\n`
      + `FN:${vCard.name}\n`
      + `TEL;type=CELL;waid=${numberContact}:+${numberContact}\n`
      + `END:VCARD`;

    try {
      await delay(msdelay)
      const sentMessage = await wbot.sendMessage(
        targetJid,
        {
          contacts: {
            displayName: `${vCard.name}`,
            contacts: [{ vcard }]
          }
        }
      );
      await ticket.update({ lastMessage: formatBody(vcard, ticket), imported: null });
      return sentMessage;
    } catch (err) {
      Sentry.captureException(err);
      console.error('Erro ao enviar vCard via WhatsApp:', err);
      throw new AppError("ERR_SENDING_WAPP_MSG");
    }
  };
  try {
    logger.info(`📤 [WHATIZE-TICKETZ] SendWhatsAppMessage - Starting message send: {
      ticketId: ${ticket.id},
      contactNumber: '${ticket.contact.number}',
      contactId: ${ticket.contact.id},
      isGroup: ${ticket.isGroup},
      hasQuotedMsg: ${!!quotedMsg}
    }`);

    const formattedBody = formatBody(body, ticket);
    
    logger.info(`📤 [WHATIZE-TICKETZ] SendWhatsAppMessage - Formatted body: { 
      originalBody: "${body?.substring(0, 50)}",
      formattedBody: "${formattedBody?.substring(0, 50)}",
      bodyLength: ${formattedBody?.length}
    }`);

    logger.info(`📤 [WHATIZE-TICKETZ] SendWhatsAppMessage - About to call wbot.sendMessage: {
      jid: '${targetJid}',
      messageOptions: {
        text: "${formattedBody?.substring(0, 50)}",
        quotedOptions: "${Object.keys(options).length > 0 ? 'has_quote' : 'none'}"
      }
    }`);

    const sentMessage = await wbot.sendMessage(
      targetJid,
      {
        text: formattedBody
      },
      {
        ...options
      }
    );

    logger.info(`✅ [WHATIZE-TICKETZ] SendWhatsAppMessage - Message sent successfully: {
      messageId: '${sentMessage.key?.id}',
      messageKey: ${JSON.stringify(sentMessage.key)},
      fromMe: ${sentMessage.key?.fromMe},
      remoteJid: '${sentMessage.key?.remoteJid}',
      sentToJid: '${targetJid}',
      wasLidUsed: ${targetJid.includes("@lid")},
      ticketLastRemoteJid: '${ticket.lastRemoteJid || "not set"}'
    }`);

    if (typeof wbot.cacheMessage === "function") {
      wbot.cacheMessage(sentMessage);
    }

    if (sentMessage?.message?.extendedTextMessage?.thumbnailDirectPath) {
      logger.info("📤 [WHATIZE-TICKETZ] SendWhatsAppMessage - Processing as media message");
      await verifyMediaMessage(sentMessage, ticket, ticket.contact);
    } else {
      logger.info("📤 [WHATIZE-TICKETZ] SendWhatsAppMessage - Processing as text message");
      await verifyMessage(sentMessage, ticket, ticket.contact);
    }
    
    logger.info("✅ [WHATIZE-TICKETZ] SendWhatsAppMessage - Message processing completed successfully");
    return sentMessage;
  } catch (err) {
    logger.error(`❌ [WHATIZE-TICKETZ] SendWhatsAppMessage - ERROR occurred: {
      error: '${err.message}',
      errorStack: '${err.stack}',
      ticketId: ${ticket.id},
      contactNumber: '${ticket.contact.number}',
      targetJid: '${targetJid}'
    }`);
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;
