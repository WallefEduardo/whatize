import { WAMessage, delay } from "@whiskeysockets/baileys";
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
  userId?: number; // ✅ Adicionado userId opcional
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  msdelay,
  vCard,
  isForwarded = false,
  userId
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
  
  if (!wbot) {
    logger.error(`❌ [SEND-MSG] Wbot não encontrado para o ticket: { ticketId: ${ticket.id}, whatsappId: ${ticket.whatsappId} }`);
    throw new AppError("ERR_WBOT_NOT_FOUND");
  }
  
  logger.info(`✅ [SEND-MSG] Wbot obtido com sucesso`);
  
  // ✅ TICKETZ COMPAT: Usar getJidOf para resolver JID corretamente
  const targetJid = getJidOf(ticket);
  logger.info(`📤 [SEND-MSG] Target JID resolved: {
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
    logger.info(`📤 [SEND-MSG] Starting message send: {
      ticketId: ${ticket.id},
      contactNumber: '${ticket.contact.number}',
      contactId: ${ticket.contact.id},
      isGroup: ${ticket.isGroup},
      hasQuotedMsg: ${!!quotedMsg},
      whatsappConnectionStatus: '${connection.status}'
    }`);

    const formattedBody = formatBody(body, ticket);
    
    logger.info(`📤 [WHATIZE-TICKETZ] SendWhatsAppMessage - Formatted body: { 
      originalBody: "${body?.substring(0, 50)}",
      formattedBody: "${formattedBody?.substring(0, 50)}",
      bodyLength: ${formattedBody?.length}
    }`);

    logger.info(`📤 [SEND-MSG] PRONTO PARA ENVIAR - Dados finais: {
      targetJid: '${targetJid}',
      messageText: "${formattedBody?.substring(0, 100)}",
      hasQuoteOptions: ${Object.keys(options).length > 0},
      ticketId: ${ticket.id}
    }`);

    logger.info(`🚀 [SEND-MSG] CHAMANDO wbot.sendMessage AGORA...`);
    
    const sentMessage = await wbot.sendMessage(
      targetJid,
      {
        text: formattedBody
      },
      {
        ...options
      }
    );
    
    logger.info(`📨 [SEND-MSG] wbot.sendMessage RETORNOU: {
      success: true,
      messageKeyId: '${sentMessage?.key?.id}',
      messageFromMe: ${sentMessage?.key?.fromMe},
      messageRemoteJid: '${sentMessage?.key?.remoteJid}',
      messageParticipant: '${sentMessage?.key?.participant || "none"}',
      messagePushName: '${sentMessage?.pushName || "none"}',
      messageStatus: '${sentMessage?.status || "unknown"}'
    }`);

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

    logger.info(`📋 [SEND-MSG] Processando mensagem no banco de dados...`);
    
    if (sentMessage?.message?.extendedTextMessage?.thumbnailDirectPath) {
      logger.info("📤 [SEND-MSG] Processing as media message");
      await verifyMediaMessage(sentMessage, ticket, ticket.contact, undefined, isForwarded, false, undefined, userId);
    } else {
      logger.info("📤 [SEND-MSG] Processing as text message");
      await verifyMessage(sentMessage, ticket, ticket.contact, undefined, false, isForwarded, userId);
    }
    
    logger.info("✅ [SEND-MSG] Message processing completed successfully - MENSAGEM SALVA NO BANCO");
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
