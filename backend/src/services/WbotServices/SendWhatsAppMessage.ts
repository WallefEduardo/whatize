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
  
  // 🔧 SOLUÇÃO HÍBRIDA: Buscar contact diretamente como no original (que funcionava)
  const contactNumber = await Contact.findByPk(ticket.contactId);
  logger.info(`📱 [SEND-MSG] Contact encontrado: { contactId: ${contactNumber.id}, number: '${contactNumber.number}', remoteJid: '${contactNumber.remoteJid}' }`);

  let number: string;
  
  // 🎯 ESTRATÉGIA TICKETZ: Usar remoteJid como está (sem conversões LID->JID)
  if (contactNumber.remoteJid && contactNumber.remoteJid !== "" && contactNumber.remoteJid.includes("@")) {
    number = contactNumber.remoteJid;
    logger.info(`✅ [SEND-MSG] Usando remoteJid existente: '${number}'`);
    
    // 🚀 CORREÇÃO TICKETZ: NÃO converter LID para JID - deixar o Baileys processar nativamente
    if (number.endsWith("@lid")) {
      logger.info(`🎯 [SEND-MSG-LID] Número LID detectado, enviando direto para Baileys: '${number}'`);
    }
    
  } else {
    number = `${contactNumber.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`;
    logger.info(`🔧 [SEND-MSG] Formatando number padrão: '${contactNumber.number}' → '${number}'`);
  }
  
  // Log final do número que será usado para envio
  logger.info(`📋 [SEND-MSG] Número final para envio: '${number}' { isGroup: ${ticket.isGroup} }`);

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
        number,
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
    logger.info(`🚀 [SEND-MSG] Tentando enviar mensagem: { number: '${number}', textLength: ${body?.length} }`);
    
    // 🔍 LOGS DETALHADOS: Capturar tudo antes do envio
    logger.info(`🔍 [SEND-MSG-DEBUG] Parâmetros completos do envio: {
      number: '${number}',
      body: '${body?.substring(0, 100)}',
      formattedBody: '${formatBody(body, ticket)?.substring(0, 100)}',
      isForwarded: ${isForwarded},
      options: ${JSON.stringify(options)},
      wbotType: '${wbot.type}',
      wbotUser: '${wbot.user?.id}',
      contactId: ${contactNumber.id},
      contactNumber: '${contactNumber.number}',
      contactRemoteJid: '${contactNumber.remoteJid}'
    }`);
    
    // 🛡️ INTERCEPTAR TUDO: Preparar os dados que serão enviados
    const messageData = {
      text: formatBody(body, ticket),
      contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded ? true : false }
    };
    
    const sendOptions = {
      ...options
    };
    
    logger.info(`🚀 [SEND-MSG-INTERCEPT] ANTES do sendMessage: {
      number: '${number}',
      messageData: ${JSON.stringify(messageData)},
      sendOptions: ${JSON.stringify(sendOptions)},
      wbotId: ${wbot.id},
      wbotType: '${wbot.type}'
    }`);
    
    try {
      const sentMessage = await wbot.sendMessage(number, messageData, sendOptions);
      
      logger.info(`✅ [SEND-MSG-INTERCEPT] DEPOIS do sendMessage: SUCESSO { messageId: ${sentMessage.key?.id} }`);
      
      // 🔥 CORREÇÃO TICKETZ: Persistir mensagem enviada no histórico
      logger.info(`🔄 [SEND-MSG-PERSIST] Iniciando persistência da mensagem enviada`);

      try {
        // Cache local (espelhando Ticketz)
        if (typeof wbot.cacheMessage === "function") {
          wbot.cacheMessage(sentMessage);
        }
        await verifyMessage(sentMessage, ticket, ticket.contact);
        logger.info(`✅ [SEND-MSG-PERSIST] Mensagem persistida com sucesso no histórico`);
      } catch (persistError) {
        logger.error(`❌ [SEND-MSG-PERSIST] Erro na persistência: ${persistError.message}`);
      }
      
      return sentMessage;
      
    } catch (sendError) {
      logger.error(`❌ [SEND-MSG-INTERCEPT] ERRO no sendMessage: {
        error: ${sendError.message},
        stack: ${sendError.stack},
        number: '${number}',
        messageDataStringified: ${JSON.stringify(messageData)}
      }`);
      throw sendError;
    }
    
    await ticket.update({ lastMessage: formatBody(body, ticket), imported: null });
    logger.info(`📝 [SEND-MSG] Ticket atualizado com última mensagem`);
    
    // Retorno já foi feito no try acima
  } catch (err) {
    logger.error(`❌ [SEND-MSG] Erro ao enviar mensagem: { 
      ticketId: ${ticket.id}, 
      contactId: ${ticket.contactId}, 
      companyId: ${ticket.companyId}, 
      number: '${number}', 
      error: ${err.message},
      errorStack: ${err.stack}
    }`);
    console.error(`Erro ao enviar mensagem na company ${ticket.companyId}:`, err);
    Sentry.captureException(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;
