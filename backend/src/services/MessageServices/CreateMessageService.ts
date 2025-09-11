import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";

export interface MessageData {
  wid: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  queueId?: number;
  channel?: string;
  ticketTrakingId?: number;
  isPrivate?: boolean;
  ticketImported?: any;
  isForwarded?: boolean;
  userId?: number; // ✅ Adicionado userId opcional
}
interface Request {
  messageData: MessageData;
  companyId: number;
}

const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<Message> => {
  await Message.upsert({ ...messageData, companyId });

  const message = await Message.findOne({
    where: {
      wid: messageData.wid,
      companyId
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
            attributes: ["id", "name", "profileImage"]
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
        include: ["contact"]
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "profileImage"]
      }
    ]
  });

  if (message.ticket.queueId !== null && message.queueId === null) {
    await message.update({ queueId: message.ticket.queueId });
  }

  if (message.isPrivate) {
    await message.update({ wid: `PVT${message.id}` });
  }

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

const io = getIO();
const ns = io.of(String(companyId)); // mesmo padrão do socket (namespaces dinâmicos)

if (!messageData?.ticketImported) {
  // ✅ REABILITADO: Socket.IO não estava causando XML corruption
  
  // 🛡️ ANTI-DUPLICAÇÃO: Cache robusto para evitar emissões duplicadas
  // Usar o wid original (messageData.wid) em vez do message.wid que pode ter sido alterado para mensagens privadas
  const originalWid = messageData.wid;
  const messageKey = `${originalWid}_${message.ticketId}_${message.fromMe ? 'OUT' : 'IN'}`;
  const now = Date.now();
  
  // 🔍 DEBUG ANTI-DUP: Log detalhado para investigar duplicação
  console.log(`🔍 [DEBUG-ANTI-DUP] Verificando mensagem: {
    dbId: '${message.id}',
    originalWid: '${originalWid}',
    currentWid: '${message.wid}',
    ticketId: ${message.ticketId},
    fromMe: ${message.fromMe},
    key: '${messageKey}',
    body: '${message.body?.substring(0, 20)}...',
    createdAt: '${message.createdAt}'
  }`);
  
  // Verificar se já emitimos essa mensagem
  if (!global.messageEmitCache) {
    global.messageEmitCache = new Map();
  }
  
  const lastEmit = global.messageEmitCache.get(messageKey);
  if (lastEmit) {
    // Para mensagens fromMe (enviadas), usar cache mais longo (5 minutos)
    // Para mensagens recebidas, usar cache mais curto (30 segundos)
    const cacheTimeout = message.fromMe ? 300000 : 30000;
    
    if ((now - lastEmit) < cacheTimeout) {
      console.log(`🛡️ [ANTI-DUP] Bloqueando emissão duplicada: ${messageKey} (${message.fromMe ? 'enviada' : 'recebida'}) - idade: ${now - lastEmit}ms`);
      return message;
    } else {
      console.log(`⚠️ [ANTI-DUP] Cache expirado para: ${messageKey} (${message.fromMe ? 'enviada' : 'recebida'}) - idade: ${now - lastEmit}ms`);
    }
  } else {
    console.log(`✅ [ANTI-DUP] Primeira emissão para: ${messageKey} (${message.fromMe ? 'enviada' : 'recebida'})`);
  }
  
  // Registrar emissão
  global.messageEmitCache.set(messageKey, now);
  
  // Limpar cache antigo a cada 200 emissões
  if (global.messageEmitCache.size > 200) {
    const cutoff = now - 600000; // 10 minutos atrás
    const keysToDelete = [];
    for (const [key, time] of global.messageEmitCache.entries()) {
      if (time < cutoff) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => global.messageEmitCache.delete(key));
    console.log(`🧹 [ANTI-DUP] Limpou ${keysToDelete.length} entradas antigas do cache`);
  }

  const rooms = [
    message.ticketId.toString(),
    "notification",
    message.ticket.status
  ];

  ns.to(rooms).emit(`company-${companyId}-appMessage`, {
    action: "create",
    message,
    ticket: message.ticket,
    contact: message.ticket.contact
  });

  ns.to("notification").emit(
    `company-${companyId}-contact`,
    { action: "update", contact: message.ticket.contact }
  );
}



  return message;
};

export default CreateMessageService;
