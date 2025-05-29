import { Op } from "sequelize";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";

interface Request {
  companyId: number;
  funilId?: number;
  funilIds?: number[];
}

const KanbanListService = async ({
  companyId,
  funilId,
  funilIds = []
}: Request): Promise<Tag[]> => {
  // Preparar condição base
  let whereCondition: any = {
    kanban: 1,
    companyId
  };
  
  // Verificamos primeiro se temos múltiplos funilIds
  if (funilIds && funilIds.length > 0) {
    whereCondition.funilId = {
      [Op.in]: funilIds
    };
  }
  // Se não temos múltiplos mas temos um único, usamos ele
  else if (funilId) {
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