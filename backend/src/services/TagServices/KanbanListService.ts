import { Op } from "sequelize";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";
import FunilKanban from "../../models/FunilKanban";
import User from "../../models/User";
import FunilUser from "../../models/FunilUser";

interface Request {
  companyId: number;
  funilId?: number;
  funilIds?: number[];
  userId?: number;
  userProfile?: string;
}

const KanbanListService = async ({
  companyId,
  funilId,
  funilIds = [],
  userId,
  userProfile
}: Request): Promise<Tag[]> => {
  // Se não for admin, precisamos filtrar pelos funis que o usuário tem acesso
  let allowedFunilIds: number[] = [];
  
  if (userProfile !== 'admin' && userId) {
    try {
      // Verificar se há associações diretas na tabela FunilUsers
      const funilUserAssociations = await FunilUser.findAll({
        where: { userId },
        include: [
          {
            model: FunilKanban,
            as: "funil",
            where: { companyId },
            required: true
          }
        ]
      });
      
      if (funilUserAssociations.length > 0) {
        // Se há associações explícitas, usar apenas essas
        allowedFunilIds = funilUserAssociations.map(fu => fu.funilId);
      } else {
        // Se não há associações explícitas, verificar funis sem restrição
        const allFunnels = await FunilKanban.findAll({
          where: { companyId },
          include: [
            {
              model: User,
              as: "users",
              required: false
            }
          ]
        });
        
        // Filtrar funis que não têm usuários associados (acesso livre)
        const freeAccessFunnels = allFunnels.filter(funnel => 
          !funnel.users || funnel.users.length === 0
        );
        
        allowedFunilIds = freeAccessFunnels.map(funnel => funnel.id);
      }
      
    } catch (error) {
      console.error("Erro ao buscar associações de funil:", error);
      // Em caso de erro, não retornar nenhuma tag por segurança
      return [];
    }
  }
  
  // Preparar condição base
  let whereCondition: any = {
    kanban: 1,
    companyId
  };
  
  // Aplicar filtros de funil
  if (userProfile !== 'admin' && userId) {
    // Para usuários não-admin, usar apenas funis permitidos
    if (allowedFunilIds.length > 0) {
      whereCondition[Op.or] = [
        {
          funilId: {
            [Op.in]: allowedFunilIds
          }
        },
        {
          funilId: null // Incluir tags sem funil (comportamento legado)
        }
      ];
    } else {
      // Se não tem acesso a nenhum funil, retornar apenas tags sem funil
      whereCondition.funilId = null;
    }
  } else {
    // Para admin, aplicar filtros normais
    if (funilIds && funilIds.length > 0) {
      whereCondition.funilId = {
        [Op.in]: funilIds
      };
    } else if (funilId) {
      whereCondition.funilId = funilId;
    }
  }
  
  const tags = await Tag.findAll({
    where: whereCondition,
    order: [["id", "ASC"]],
    raw: true,
  });
  
  return tags;
};

export default KanbanListService;