import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Tag from "../../models/Tag";
import ShowService from "./ShowService";

interface TagData {
  id?: number;
  name?: string;
  color?: string;
  kanban?: number;
  timeLane?: number;
  nextLaneId?: number;
  greetingMessageLane: string;
  rollbackLaneId?: number;
  funilId?: number;
}

interface Request {
  tagData: TagData;
  id: string | number;
}

const UpdateUserService = async ({
  tagData,
  id
}: Request): Promise<Tag | undefined> => {
  const tag = await ShowService(id);

  const schema = Yup.object().shape({
    name: Yup.string().min(3)
  });

  const { name, color, kanban,
    timeLane,
    nextLaneId = null,
    greetingMessageLane,
    rollbackLaneId = null,
    funilId = null} = tagData;

  try {
    await schema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (Number(kanban) === 1 && !funilId) {
    throw new AppError("É necessário selecionar um funil para atualizar uma seção de kanban");
  }

  await tag.update({
    name,
    color,
    kanban,
    timeLane,
    nextLaneId: String(nextLaneId) === "" ? null : nextLaneId,
    greetingMessageLane,
    rollbackLaneId: String(rollbackLaneId) === "" ? null : rollbackLaneId,
    funilId: Number(kanban) === 1 ? funilId : null
  });

  await tag.reload();
  return tag;
};

export default UpdateUserService;
