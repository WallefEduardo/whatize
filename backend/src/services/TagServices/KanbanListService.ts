import { Op } from "sequelize";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";

interface Request {
  companyId: number;
  funilId?: number;
}

const KanbanListService = async ({
  companyId,
  funilId
}: Request): Promise<Tag[]> => {
  // Preparar condição base
  let whereCondition: any = {
    kanban: 1,
    companyId
  };
  
  // Adicionar condição de funilId se fornecido
  if (funilId) {
    whereCondition.funilId = funilId;
  }
  
  const tags = await Tag.findAll({
    where: whereCondition,
    order: [["id", "ASC"]],
    raw: true,
  });
  //console.log(tags);
  return tags;
};

export default KanbanListService;