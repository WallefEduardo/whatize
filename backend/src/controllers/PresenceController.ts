import { Request, Response } from "express";
import PresenceService from "../services/WbotServices/PresenceService";
import { getWbot } from "../libs/wbot";
import AppError from "../errors/AppError";

export const subscribePresence = async (req: Request, res: Response): Promise<Response> => {
  const { contactNumber, whatsappId } = req.body;
  const { companyId } = req.user;

  if (!contactNumber) {
    throw new AppError("Contact number is required", 400);
  }

  try {
    const wbot = getWbot(whatsappId);
    await PresenceService.subscribeToPresence(wbot, contactNumber, companyId);

    return res.json({ message: "Subscribed to presence successfully" });
  } catch (error) {
    throw new AppError("Error subscribing to presence", 500);
  }
};

export const getPresence = async (req: Request, res: Response): Promise<Response> => {
  const { contactNumber } = req.params;

  if (!contactNumber) {
    throw new AppError("Contact number is required", 400);
  }

  try {
    const presence = await PresenceService.getContactPresence(contactNumber);
    return res.json(presence);
  } catch (error) {
    throw new AppError("Error getting presence", 500);
  }
};

export const sendPresenceUpdate = async (req: Request, res: Response): Promise<Response> => {
  const { contactNumber, type, whatsappId } = req.body;
  const { companyId } = req.user;

  if (!contactNumber || !type) {
    throw new AppError("Contact number and type are required", 400);
  }

  try {
    const wbot = getWbot(whatsappId);
    const contactJid = `${contactNumber.replace(/\D/g, '')}@s.whatsapp.net`;
    
    await PresenceService.sendPresenceUpdate(wbot, contactJid, type);

    return res.json({ message: "Presence update sent successfully" });
  } catch (error) {
    throw new AppError("Error sending presence update", 500);
  }
};

export const unsubscribePresence = async (req: Request, res: Response): Promise<Response> => {
  const { contactNumber } = req.body;
  const { companyId } = req.user;

  if (!contactNumber) {
    throw new AppError("Contact number is required", 400);
  }

  try {
    await PresenceService.unsubscribeFromPresence(contactNumber, companyId);
    return res.json({ message: "Unsubscribed from presence successfully" });
  } catch (error) {
    throw new AppError("Error unsubscribing from presence", 500);
  }
}; 