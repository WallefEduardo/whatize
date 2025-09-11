import moment from "moment";
import * as Sentry from "@sentry/node";
import { Op } from "sequelize";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import { isNil } from "lodash";
import sendFaceMessage from "../FacebookServices/sendFacebookMessage";
import { verifyMessageFace } from "../FacebookServices/facebookMessageListener";
import ShowUserService from "../UserServices/ShowUserService";
import User from "../../models/User";
import CompaniesSettings from "../../models/CompaniesSettings";
import CreateLogTicketService from "./CreateLogTicketService";
import TicketTag from "../../models/TicketTag";
import Tag from "../../models/Tag";
import CreateMessageService from "../MessageServices/CreateMessageService";
import FindOrCreateTicketService from "./FindOrCreateTicketService";
import formatBody from "../../helpers/Mustache";
import { Mutex } from "async-mutex";
import AppError from "../../errors/AppError";

interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  isBot?: boolean;
  queueOptionId?: number;
  sendFarewellMessage?: boolean;
  amountUsedBotQueues?: number;
  lastMessage?: string;
  integrationId?: number;
  useIntegration?: boolean;
  unreadMessages?: number;
  msgTransfer?: string;
  isTransfered?: boolean;
  chatbot?: boolean;
  justClose?: boolean; // ✅ TICKETZ COMPAT: Evita mensagens de rating/completion na deduplicação
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  companyId: number;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  companyId
}: Request): Promise<Response> => {
  try {
    let {
      queueId,
      userId,
      sendFarewellMessage = true,
      amountUsedBotQueues,
      lastMessage,
      integrationId,
      useIntegration,
      unreadMessages,
      msgTransfer,
      isTransfered = false,
      status,
      justClose = false // ✅ TICKETZ COMPAT: Para deduplicação silenciosa
    } = ticketData;
    let isBot: boolean | null = ticketData.isBot || false;
    let queueOptionId: number | null = ticketData.queueOptionId || null;

    const io = getIO();

    const settings = await CompaniesSettings.findOne({
      where: {
        companyId: companyId
      }
    });

    let ticket = await ShowTicketService(ticketId, companyId);

    if (ticket.channel === "whatsapp" && ticket.whatsappId) {
      SetTicketMessagesAsRead(ticket);
    }

    const oldStatus = ticket?.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket?.queueId;

    if (isNil(ticket.whatsappId) && status === "closed") {
      await CreateLogTicketService({
        userId,
        queueId: ticket.queueId,
        ticketId,
        type: "closed"
      });

      await ticket.update({
        status: "closed"
      });

      io.of(String(companyId))
        // .to(oldStatus)
        // .to(ticketId.toString())
        .emit(`company-${ticket.companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });
      return { ticket, oldStatus, oldUserId };
    }

    if (oldStatus === "closed") {
      let otherTicket = await Ticket.findOne({
        where: {
          contactId: ticket.contactId,
          status: { [Op.or]: ["open", "pending", "group"] },
          whatsappId: ticket.whatsappId
        }
      });
      if (otherTicket) {
        if (otherTicket.id !== ticket.id) {
          otherTicket = await ShowTicketService(otherTicket.id, companyId)
          return { ticket: otherTicket, oldStatus, oldUserId }
        }
      }

      isBot = false;
    }

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket?.whatsappId
    });
    const { complationMessage, ratingMessage, groupAsTicket } = await ShowWhatsAppService(
      ticket?.whatsappId,
      companyId
    );

    if (status !== undefined && ["closed"].indexOf(status) > -1) {
      const _userId = ticket.userId || userId;
      let user
      if (_userId) {
        user = await User.findByPk(_userId);
      }

      if (settings.userRating === "enabled" &&
        (sendFarewellMessage || sendFarewellMessage === undefined) &&
        (!isNil(ratingMessage) && ratingMessage !== "") &&
        !ticket.isGroup &&
        !justClose) { // ✅ TICKETZ COMPAT: Não enviar rating na deduplicação

        if (ticketTraking.ratingAt == null) {
          const ratingTxt = ratingMessage || "";
          let bodyRatingMessage = `\u200e ${ratingTxt}\n`;

          if (ticket.channel === "whatsapp" && ticket.whatsapp.status === 'CONNECTED') {
            const msg = await SendWhatsAppMessage({ body: bodyRatingMessage, ticket, isForwarded: false });
            await verifyMessage(msg, ticket, ticket.contact);
          } else
            if (["facebook", "instagram"].includes(ticket.channel)) {
              const msg = await sendFaceMessage({ body: bodyRatingMessage, ticket });
              await verifyMessageFace(msg, bodyRatingMessage, ticket, ticket.contact);
            }

          await ticketTraking.update({
            userId: ticket.userId,
            closedAt: moment().toDate()
          });

          await CreateLogTicketService({
            userId: ticket.userId,
            queueId: ticket.queueId,
            ticketId,
            type: "nps"
          });

          await ticket.update({
            status: "nps",
            amountUsedBotQueuesNPS: 1
          })

          io.of(String(companyId))
            // .to(oldStatus)
            // .to(ticketId.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });

          return { ticket, oldStatus, oldUserId };
        }
      }

      if (((!isNil(user?.farewellMessage) && user?.farewellMessage !== "") ||
        (!isNil(complationMessage) && complationMessage !== "")) &&
        (sendFarewellMessage || sendFarewellMessage === undefined) &&
        !justClose) { // ✅ TICKETZ COMPAT: Não enviar farewell na deduplicação

        let body: any

        if ((ticket.status !== 'pending') || (ticket.status === 'pending' && settings.sendFarewellWaitingTicket === 'enabled')) {
          if (!isNil(user) && !isNil(user?.farewellMessage) && user?.farewellMessage !== "") {
            body = `\u200e ${user.farewellMessage}`;
          } else {
            body = `\u200e ${complationMessage}`;
          }
          if (ticket.channel === "whatsapp" && (!ticket.isGroup || groupAsTicket === "enabled") && ticket.whatsapp.status === 'CONNECTED') {
            const sentMessage = await SendWhatsAppMessage({ body, ticket, isForwarded: false });

            await verifyMessage(sentMessage, ticket, ticket.contact);

          }

          if (["facebook", "instagram"].includes(ticket.channel) && (!ticket.isGroup || groupAsTicket === "enabled")) {
            const sentMessage = await sendFaceMessage({ body, ticket });
          }
        }
      }

      ticketTraking.finishedAt = moment().toDate();
      ticketTraking.closedAt = moment().toDate();
      ticketTraking.whatsappId = ticket?.whatsappId;
      ticketTraking.userId = ticket.userId;

      await CreateLogTicketService({
        userId,
        queueId: ticket.queueId,
        ticketId,
        type: "closed"
      });

      await ticketTraking.save();

      await ticket.update({
        status: "closed",
        lastFlowId: null,
        dataWebhook: null,
        hashFlowId: null,
      });

      io.of(String(companyId))
        // .to(oldStatus)
        // .to(ticketId.toString())
        .emit(`company-${ticket.companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });
      return { ticket, oldStatus, oldUserId };
    }
    let queue
    if (!isNil(queueId)) {
      queue = await Queue.findByPk(queueId);
      ticketTraking.queuedAt = moment().toDate();
    }

    if (isTransfered) {
      if (settings.closeTicketOnTransfer) {
        let newTicketTransfer = ticket;
        if (oldQueueId !== queueId) {
          await ticket.update({
            status: "closed",
            lastFlowId: null,
            dataWebhook: null,
            queueId: null,
            hashFlowId: null,
            flowWebhook: false,
          });

          await ticket.reload();

          io.of(String(companyId))
            // .to(oldStatus)
            // .to(ticketId.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });

          newTicketTransfer = await FindOrCreateTicketService(
            ticket.contact,
            ticket.whatsapp,
            1,
            ticket.companyId,
            queueId,
            userId,
            null,
            ticket.channel, false, false, settings, isTransfered);

          await FindOrCreateATicketTrakingService({ ticketId: newTicketTransfer.id, companyId, whatsappId: ticket.whatsapp.id, userId });

        }

        if (!isNil(msgTransfer)) {
          const messageData = {
            wid: `PVT${newTicketTransfer.updatedAt.toString().replace(' ', '')}`,
            ticketId: newTicketTransfer.id,
            contactId: undefined,
            body: msgTransfer,
            fromMe: true,
            mediaType: 'extendedTextMessage',
            read: true,
            quotedMsgId: null,
            ack: 2,
            remoteJid: newTicketTransfer.contact?.remoteJid,
            participant: null,
            dataJson: null,
            ticketTrakingId: null,
            isPrivate: true
          };

          await CreateMessageService({ messageData, companyId: ticket.companyId });
        }

        await newTicketTransfer.update({
          queueId,
          userId,
          status
        })

        await newTicketTransfer.reload();

        if (settings.sendMsgTransfTicket === "enabled") {
          if ((oldQueueId !== queueId || oldUserId !== userId) && !isNil(oldQueueId) && !isNil(queueId) && !isNil(queueId)) {
            const msgtxt = formatBody(`\u200e ${settings.transferMessage.replace("${queue.name}", queue?.name)}`, ticket);
            
            // ✅ Verificar o canal do ticket para usar o serviço correto
            if (ticket.channel === "whatsapp" && ticket.whatsapp.status === 'CONNECTED') {
              const wbot = await GetTicketWbot(ticket);
              const queueChangedMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                {
                  text: msgtxt
                }
              );
              await verifyMessage(queueChangedMessage, ticket, ticket.contact, ticketTraking);
            } else if (["facebook", "instagram"].includes(ticket.channel)) {
              const sentMessage = await sendFaceMessage({ body: msgtxt, ticket });
              await verifyMessageFace(sentMessage, msgtxt, ticket, ticket.contact, true);
            }
          }
        }

        if (oldUserId !== userId && oldQueueId === queueId && !isNil(oldUserId) && !isNil(userId)) {
          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
        } else
          if (oldUserId !== userId && oldQueueId === queueId && !isNil(oldUserId) && !isNil(userId)) {
            await CreateLogTicketService({
              userId: oldUserId,
              queueId: oldQueueId,
              ticketId,
              type: "transfered"
            });
            await CreateLogTicketService({
              userId,
              queueId: oldQueueId,
              ticketId: newTicketTransfer.id,
              type: "receivedTransfer"
            });
          } else
            if (oldUserId !== userId && oldQueueId !== queueId && !isNil(oldUserId) && !isNil(userId)) {
              await CreateLogTicketService({
                userId: oldUserId,
                queueId: oldQueueId,
                ticketId,
                type: "transfered"
              });
              await CreateLogTicketService({
                userId,
                queueId,
                ticketId: newTicketTransfer.id,
                type: "receivedTransfer"
              });
            } else
              if (oldUserId !== undefined && isNil(userId) && oldQueueId !== queueId && !isNil(queueId)) {
                await CreateLogTicketService({
                  userId: oldUserId,
                  queueId: oldQueueId,
                  ticketId,
                  type: "transfered"
                });
              }

        if (newTicketTransfer.status !== oldStatus || newTicketTransfer.user?.id !== oldUserId) {
          await ticketTraking.update({
            userId: newTicketTransfer.userId
          })
          io.of(String(companyId))
            // .to(oldStatus)
            .emit(`company-${companyId}-ticket`, {
              action: "delete",
              ticketId: newTicketTransfer.id
            });
        }

        io.of(String(companyId))
          // .to(newTicketTransfer.status)
          // .to("notification")
          // .to(newTicketTransfer.id.toString())
          .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket: newTicketTransfer
          });

        return { ticket: newTicketTransfer, oldStatus, oldUserId };
      } else {
        if (settings.sendMsgTransfTicket === "enabled") {
          if (oldQueueId !== queueId || oldUserId !== userId && !isNil(oldQueueId) && !isNil(queueId)) {
            const msgtxt = formatBody(`\u200e ${settings.transferMessage.replace("${queue.name}", queue?.name)}`, ticket);
            
            // ✅ Verificar o canal do ticket para usar o serviço correto
            if (ticket.channel === "whatsapp" && ticket.whatsapp.status === 'CONNECTED') {
              const wbot = await GetTicketWbot(ticket);
              const queueChangedMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                {
                  text: msgtxt
                }
              );
              await verifyMessage(queueChangedMessage, ticket, ticket.contact, ticketTraking);
            } else if (["facebook", "instagram"].includes(ticket.channel)) {
              const sentMessage = await sendFaceMessage({ body: msgtxt, ticket });
              await verifyMessageFace(sentMessage, msgtxt, ticket, ticket.contact, true);
            }
          }
        }

        if (!isNil(msgTransfer)) {
          const messageData = {
            wid: `PVT${ticket.updatedAt.toString().replace(' ', '')}`,
            ticketId: ticket.id,
            contactId: undefined,
            body: msgTransfer,
            fromMe: true,
            mediaType: 'extendedTextMessage',
            read: true,
            quotedMsgId: null,
            ack: 2,
            remoteJid: ticket.contact?.remoteJid,
            participant: null,
            dataJson: null,
            ticketTrakingId: null,
            isPrivate: true
          };

          await CreateMessageService({ messageData, companyId: ticket.companyId });
        }

        if (oldUserId !== userId && oldQueueId === queueId && !isNil(oldUserId) && !isNil(userId)) {
          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });

        } else
          if (oldUserId !== userId && oldQueueId === queueId && !isNil(oldUserId) && !isNil(userId)) {
            await CreateLogTicketService({
              userId: oldUserId,
              queueId: oldQueueId,
              ticketId,
              type: "transfered"
            });
            await CreateLogTicketService({
              userId,
              queueId: oldQueueId,
              ticketId: ticket.id,
              type: "receivedTransfer"
            });
          } else
            if (oldUserId !== userId && oldQueueId !== queueId && !isNil(oldUserId) && !isNil(userId)) {
              await CreateLogTicketService({
                userId: oldUserId,
                queueId: oldQueueId,
                ticketId,
                type: "transfered"
              });
              await CreateLogTicketService({
                userId,
                queueId,
                ticketId: ticket.id,
                type: "receivedTransfer"
              });
            } else
              if (oldUserId !== undefined && isNil(userId) && oldQueueId !== queueId && !isNil(queueId)) {
                await CreateLogTicketService({
                  userId: oldUserId,
                  queueId: oldQueueId,
                  ticketId,
                  type: "transfered"
                });
              }
      }
    }

    status = queue && queue.closeTicket ? "closed" : status;

    await ticket.update({
      status,
      queueId,
      userId,
      isBot,
      queueOptionId,
      amountUsedBotQueues: status === "closed" ? 0 : amountUsedBotQueues ? amountUsedBotQueues : ticket.amountUsedBotQueues,
      lastMessage: lastMessage ? lastMessage : ticket.lastMessage,
      useIntegration,
      integrationId,
      typebotSessionId: !useIntegration ? null : ticket.typebotSessionId,
      typebotStatus: useIntegration,
      unreadMessages
    });

    ticketTraking.queuedAt = moment().toDate();
    ticketTraking.queueId = queueId;

    await ticket.reload();

    if (status !== undefined && ["pending"].indexOf(status) > -1) {
      await CreateLogTicketService({
        userId: oldUserId,
        ticketId,
        type: "pending"
      });

      await ticketTraking.update({
        whatsappId: ticket.whatsappId,
        startedAt: null,
        userId: null
      });
    }

    if (status !== undefined && ["open"].indexOf(status) > -1) {
      await ticketTraking.update({
        startedAt: moment().toDate(),
        ratingAt: null,
        rated: false,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId,
        queueId: ticket.queueId
      });

      await CreateLogTicketService({
        userId: userId,
        queueId: ticket.queueId,
        ticketId,
        type: oldStatus === "pending" ? "open" : "reopen"
      });
    }

    await ticketTraking.save();

    if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId || ticket.queueId !== oldQueueId) {
      io.of(String(companyId))
        // .to(oldStatus)
        .emit(`company-${companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });
    }

    io.of(String(companyId))
      // .to(ticket.status)
      // .to("notification")
      // .to(ticketId.toString())
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });

    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    console.error("erro ao atualizar o ticket", ticketId, "ticketData", ticketData);
    console.error("❌ [UPDATE-TICKET] ERRO COMPLETO:", err.message, err.stack);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }
};

export default UpdateTicketService;