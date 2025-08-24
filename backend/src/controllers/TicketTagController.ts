import { Request, Response } from "express";
import TicketTag from '../models/TicketTag';
import Tag from '../models/Tag'
import { getIO } from "../libs/socket";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import { getWbot } from "../libs/wbot";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import TicketTagMessage from "../models/TicketTagMessage";
import sequelize from "../database";


export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId, tagId } = req.params;
  const { companyId } = req.user;
  
  const transaction = await sequelize.transaction();

  try {
    const ticketIdInt = parseInt(ticketId);
    const tagIdInt = parseInt(tagId);

    // Get ticket once
    const ticket = await ShowTicketService(ticketId, companyId);

    // Get current and target tags in one query
    const [currentTicketTag, targetTag] = await Promise.all([
      TicketTag.findOne({
        where: { ticketId: ticketIdInt },
        include: [{ model: Tag, as: "tag" }],
        transaction
      }),
      Tag.findOne({
        where: { id: tagIdInt, kanban: 1 },
        transaction
      })
    ]);

    if (!targetTag) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Tag not found or not a kanban tag' });
    }

    let finalTag = targetTag;
    let message = targetTag.greetingMessageLane;

    // Validate movement and check time
    if (currentTicketTag?.tag) {
      const currentTag = currentTicketTag.tag;
      const isValidMove = targetTag.id === currentTag.nextLaneId || targetTag.id === currentTag.rollbackLaneId;

      if (!isValidMove) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid lane movement' });
      }

      if (currentTag.timeLane > 0) {
        const timeElapsed = (Date.now() - new Date(currentTicketTag.createdAt).getTime()) / 1000 / 60;
        
        if (timeElapsed > currentTag.timeLane) {
          const rollbackTag = await Tag.findOne({
            where: { id: currentTag.rollbackLaneId },
            transaction
          });

          if (rollbackTag) {
            finalTag = rollbackTag;
            message = `Seu ticket retornou para ${rollbackTag.name} devido ao tempo excedido`;
          }
        }
      }
    }

    const messageHistory = await TicketTagMessage.findOne({
      where: { 
        ticketId: ticketIdInt,
        tagId: finalTag.id,
        messageSent: true
      },
      transaction
    });

    await Promise.all([
      TicketTag.destroy({ where: { ticketId: ticketIdInt }, transaction }),
      TicketTag.create({
        ticketId: ticketIdInt,
        tagId: finalTag.id
      }, { transaction }),
      !messageHistory && message ? SendWhatsAppMessage({
        body: message,
        ticket,
        quotedMsg: null,
        msdelay: 0,
        isForwarded: false
      }) : Promise.resolve(),
      !messageHistory && message ? TicketTagMessage.create({
        ticketId: ticketIdInt,
        tagId: finalTag.id,
        messageSent: true
      }, { transaction }) : Promise.resolve()
    ]);

    await transaction.commit();

    const io = getIO();
    io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error("Error:", error);
    return res.status(500).json({ error: 'Failed to update ticket tag' });
  }
};

/*
export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;



  try {
    await TicketTag.destroy({ where: { ticketId } });
    return res.status(200).json({ message: 'Ticket tags removed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove ticket tags.' });
  }
};
*/
export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  //console.log("remove");
  //console.log(req.params);

  try {
    // Retrieve tagIds associated with the provided ticketId from TicketTags
    const ticketTags = await TicketTag.findAll({ where: { ticketId } });
    const tagIds = ticketTags.map((ticketTag) => ticketTag.tagId);

    // Find the tagIds with kanban = 1 in the Tags table
    const tagsWithKanbanOne = await Tag.findAll({
      where: {
        id: tagIds,
        kanban: 1,
      },
    });

    // Remove the tagIds with kanban = 1 from TicketTags
    const tagIdsWithKanbanOne = tagsWithKanbanOne.map((tag) => tag.id);
    if (tagIdsWithKanbanOne)
      await TicketTag.destroy({ where: { ticketId, tagId: tagIdsWithKanbanOne } });


    const ticket = await ShowTicketService(ticketId, companyId);

    const io = getIO();
    io.of(String(companyId))
      // .to(ticket.status)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });
    return res.status(200).json({ message: 'Ticket tags removed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove ticket tags.' });
  }
};