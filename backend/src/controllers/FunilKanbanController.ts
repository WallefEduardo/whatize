import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import FunilKanbanService from "../services/FunilKanbanService/FunilKanbanService";

interface FunilKanbanRequest {
  name: string;
  isActive?: boolean;
  userIds?: number[];
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const funilKanbanData: FunilKanbanRequest = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required().max(20, "O nome do funil não pode conter mais de 20 caracteres"),
    userIds: Yup.array().of(Yup.number()).optional()
  });

  try {
    await schema.validate(funilKanbanData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const funilKanban = await FunilKanbanService.create({
    ...funilKanbanData,
    companyId
  });

  const io = req.app.get("io");
  if (io) {
    io.emit(`company-${companyId}-funilKanban`, {
      action: "create",
      funilKanban
    });
  }

  return res.status(200).json(funilKanban);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId, profile } = req.user;
  const { searchParam, pageNumber } = req.query as {
    searchParam?: string;
    pageNumber?: string;
  };

  const { funilKanbans, count, hasMore } = await FunilKanbanService.list({
    searchParam,
    pageNumber,
    companyId,
    userId: Number(userId),
    userProfile: profile
  });

  return res.status(200).json({ funilKanbans, count, hasMore });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;

  const funilKanban = await FunilKanbanService.findById(Number(id), companyId);

  return res.status(200).json(funilKanban);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const funilKanbanData: FunilKanbanRequest = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().max(20, "O nome do funil não pode conter mais de 20 caracteres"),
    isActive: Yup.boolean(),
    userIds: Yup.array().of(Yup.number()).optional()
  });

  try {
    await schema.validate(funilKanbanData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const funilKanban = await FunilKanbanService.update(
    Number(id),
    funilKanbanData,
    companyId
  );

  const io = req.app.get("io");
  if (io) {
    io.emit(`company-${companyId}-funilKanban`, {
      action: "update",
      funilKanban
    });
  }

  return res.status(200).json(funilKanban);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;

  await FunilKanbanService.delete(Number(id), companyId);

  const io = req.app.get("io");
  if (io) {
    io.emit(`company-${companyId}-funilKanban`, {
      action: "delete",
      funilKanbanId: id
    });
  }

  return res.status(200).json({ message: "Funil excluído com sucesso" });
};
