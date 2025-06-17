import Tag from "../../models/Tag";
import FunilKanban from "../../models/FunilKanban";
import TicketTag from "../../models/TicketTag";

interface Request {
  ticketId: number;
  companyId: number;
}

interface TagWithFunnel {
  id: number;
  name: string;
  color: string;
  funilName?: string;
  funilId?: number;
}

const GetTagWithFunnelService = async ({
  ticketId,
  companyId
}: Request): Promise<TagWithFunnel[]> => {

  
  // Buscar todas as tags associadas ao ticket
  const ticketTags = await TicketTag.findAll({
    where: { ticketId },
    include: [
      {
        model: Tag,
        as: "tag",
        where: { companyId, kanban: 1 },
        include: [
          {
            model: FunilKanban,
            as: "funil",
            attributes: ["id", "name"]
          }
        ]
      }
    ]
  });

  
  
  // Mapear os resultados para o formato desejado
  const tagsWithFunnel = ticketTags.map(ticketTag => {
    const tag = ticketTag.tag;
    const result = {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      funilId: tag.funilId,
      funilName: tag.funil?.name
    };
    
    return result;
  });

  return tagsWithFunnel;
};

export default GetTagWithFunnelService; 