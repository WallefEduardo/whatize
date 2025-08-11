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
        include: ["contact"]
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
  
  // 🛡️ ANTI-DUPLICAÇÃO: Cache simples para evitar emissões duplicadas em sequência
  const messageKey = `${message.id}_${message.ticketId}`;
  const now = Date.now();
  
  // Verificar se já emitimos essa mensagem nos últimos 2 segundos
  if (!global.messageEmitCache) {
    global.messageEmitCache = new Map();
  }
  
  const lastEmit = global.messageEmitCache.get(messageKey);
  if (lastEmit && (now - lastEmit) < 2000) {
    console.log(`🛡️ [ANTI-DUP] Bloqueando emissão duplicada: ${messageKey}`);
    return message;
  }
  
  // Registrar emissão
  global.messageEmitCache.set(messageKey, now);
  
  // Limpar cache antigo a cada 100 emissões
  if (global.messageEmitCache.size > 100) {
    const cutoff = now - 10000; // 10 segundos atrás
    for (const [key, time] of global.messageEmitCache.entries()) {
      if (time < cutoff) {
        global.messageEmitCache.delete(key);
      }
    }
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
