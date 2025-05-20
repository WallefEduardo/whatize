import { Request, Response } from "express";
import GetTagWithFunnelService from "../services/TagServices/GetTagWithFunnelService";

export const getTagsWithFunnel = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  const tagsWithFunnel = await GetTagWithFunnelService({
    ticketId: Number(ticketId),
    companyId
  });

  return res.status(200).json(tagsWithFunnel);
}; 