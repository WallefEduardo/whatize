import { Op, fn, where, col, Filterable, Includeable } from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import ContactTag from "../../models/ContactTag";
import { intersection } from "lodash";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  date?: string;
  dateStart?: string;
  dateEnd?: string;
  updatedAt?: string;
  showAll?: string;
  userId: string;
  withUnreadMessages?: string;
  queueIds: number[];
  tags: number[];
  users: number[];
  companyId: number;
  funilId?: number;
}

interface Response {
  tickets: Ticket[];
  count: number;
  hasMore: boolean;
}

const ListTicketsServiceKanban = async ({
  searchParam = "",
  pageNumber = "1",
  queueIds,
  tags,
  users,
  status,
  date,
  dateStart,
  dateEnd,
  updatedAt,
  showAll,
  userId,
  withUnreadMessages,
  companyId,
  funilId
}: Request): Promise<Response> => {
  let whereCondition: Filterable["where"] = {
    queueId: { [Op.or]: [queueIds, null] }
  };
  let includeCondition: Includeable[];

  includeCondition = [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "name", "number", "email", "companyId", "urlPicture"],
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "name", "color", "kanban"],
          through: { attributes: [] }
        }
      ]
    },
    {
      model: Queue,
      as: "queue",
      attributes: ["id", "name", "color"]
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name"]
    },
    {
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color", "kanban"],
      through: { attributes: [] }
    },
    {
      model: Whatsapp,
      as: "whatsapp",
      attributes: ["name"]
    },
  ];

  // Se há filtro de usuários específicos, forçar showAll para permitir busca em todos os tickets
  const hasUserFilter = Array.isArray(users) && users.length > 0;
  const shouldShowAll = showAll === "true" || hasUserFilter;
  
  if (shouldShowAll) {
    console.log('🌐 Modo showAll ativado (showAll ou filtro de usuários)');
    whereCondition = { 
      queueId: { [Op.or]: [queueIds, null] }
    };
  } else {
    // Se não for showAll, aplicar filtro de usuário logado OU tickets pendentes
    console.log('👤 Aplicando filtro de usuário logado ou tickets pendentes');
    whereCondition = {
      ...whereCondition,
      [Op.or]: [{ userId }, { status: "pending" }]
    };
  }

  whereCondition = {
    ...whereCondition,
    status: { [Op.or]: ["pending", "open"] }
  };

  if (searchParam) {
    const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();

    includeCondition = [
      ...includeCondition,
      {
        model: Message,
        as: "messages",
        attributes: ["id", "body"],
        where: {
          body: where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        required: false,
        duplicating: false
      }
    ];

    whereCondition = {
      ...whereCondition,
      [Op.or]: [
        {
          "$contact.name$": where(
            fn("LOWER", col("contact.name")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        { "$contact.number$": { [Op.like]: `%${sanitizedSearchParam}%` } },
        {
          "$message.body$": where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        }
      ]
    };
  }

  if (dateStart && dateEnd) {
    whereCondition = {
      ...whereCondition,
      createdAt: {
        [Op.between]: [+startOfDay(parseISO(dateStart)), +endOfDay(parseISO(dateEnd))]
      }
    };
  }

  if (updatedAt) {
    whereCondition = {
      ...whereCondition,
      updatedAt: {
        [Op.between]: [
          +startOfDay(parseISO(updatedAt)),
          +endOfDay(parseISO(updatedAt))
        ]
      }
    };
  }

  if (withUnreadMessages === "true") {
    const user = await ShowUserService(userId, companyId);
    const userQueueIds = user.queues.map(queue => queue.id);

    whereCondition = {
      [Op.or]: [{ userId }, { status: "pending" }],
      queueId: { [Op.or]: [userQueueIds, null] },
      unreadMessages: { [Op.gt]: 0 }
    };
  }

  // Aplicar filtros de tags, funil e usuários
  let filteredTicketIds: number[] | null = null;

  console.log('🔍 ListTicketsServiceKanban - Iniciando filtros');
  console.log('🏷️ Tags recebidas:', tags);
  console.log('👥 Users recebidos:', users);
  console.log('🎯 FunilId recebido:', funilId);

  // Filtro por tags específicas (AND - deve ter todas as tags)
  if (Array.isArray(tags) && tags.length > 0) {
    console.log('🏷️ Aplicando filtro de tags...');
    
    // Verificar se as tags existem no sistema
    const existingTags = await Tag.findAll({
      where: { 
        id: { [Op.in]: tags },
        companyId 
      },
      attributes: ['id', 'name', 'kanban']
    });
    console.log('🏷️ Tags existentes no sistema:', existingTags.map(t => ({ id: t.id, name: t.name, kanban: t.kanban })));
    
    // Verificar se existem tickets com tags no sistema
    const allTicketTags = await TicketTag.findAll({
      attributes: ['ticketId', 'tagId'],
      limit: 10
    });
    console.log('🔍 Primeiros 10 TicketTags no sistema:', allTicketTags.map(tt => ({ ticketId: tt.ticketId, tagId: tt.tagId })));
    
    // Verificar também ContactTags
    const allContactTags = await ContactTag.findAll({
      attributes: ['contactId', 'tagId'],
      limit: 10
    });
    console.log('🔍 Primeiros 10 ContactTags no sistema:', allContactTags.map(ct => ({ contactId: ct.contactId, tagId: ct.tagId })));
    
    const ticketsTagFilter: any[] = [];
    for (let tag of tags) {
      // Buscar tickets que têm a tag diretamente
      const ticketTags = await TicketTag.findAll({
        where: { tagId: tag }
      });
      console.log(`🏷️ Tag ${tag} encontrada em ${ticketTags.length} tickets diretos`);
      
      // Buscar tickets através de contatos que têm a tag
      const contactTags = await ContactTag.findAll({
        where: { tagId: tag },
        attributes: ['contactId']
      });
      
      let ticketIdsFromContacts = [];
      if (contactTags.length > 0) {
        const contactIds = contactTags.map(ct => ct.contactId);
        const ticketsFromContacts = await Ticket.findAll({
          where: { 
            contactId: { [Op.in]: contactIds },
            companyId
          },
          attributes: ['id']
        });
        ticketIdsFromContacts = ticketsFromContacts.map(t => t.id);
      }
      
      console.log(`🏷️ Tag ${tag} encontrada em ${ticketIdsFromContacts.length} tickets via contatos`);
      
      // Combinar IDs de tickets diretos e via contatos
      const allTicketIds = [
        ...ticketTags.map(t => t.ticketId),
        ...ticketIdsFromContacts
      ];
      
      // Remover duplicatas
      const uniqueTicketIds = [...new Set(allTicketIds)];
      console.log(`🏷️ Tag ${tag} total de tickets únicos: ${uniqueTicketIds.length}`);
      
      if (uniqueTicketIds.length > 0) {
        ticketsTagFilter.push(uniqueTicketIds);
      }
    }

    if (ticketsTagFilter.length > 0) {
      // Usar união (OR) em vez de interseção (AND) para múltiplas tags
      const allTicketIds = ticketsTagFilter.flat();
      filteredTicketIds = [...new Set(allTicketIds)]; // Remove duplicatas
      console.log('🏷️ IDs filtrados por tags (união - OR):', filteredTicketIds);
    } else {
      filteredTicketIds = [];
      console.log('🏷️ Nenhum ticket encontrado com as tags selecionadas');
    }
  }

  // Filtro por funil (aplica apenas se não houver tags específicas selecionadas)
  if (funilId && (!Array.isArray(tags) || tags.length === 0)) {
    const tagsFromFunnel = await Tag.findAll({
      where: { 
        funilId,
        companyId
      },
      attributes: ['id']
    });
    
    const tagIds = tagsFromFunnel.map(tag => tag.id);
    
    if (tagIds.length > 0) {
      const ticketTags = await TicketTag.findAll({
        where: { 
          tagId: {
            [Op.in]: tagIds
          }
        },
        attributes: ['ticketId']
      });
      
      filteredTicketIds = ticketTags.map(ticketTag => ticketTag.ticketId);
    } else {
      filteredTicketIds = [];
    }
  }

  // Aplicar filtro de IDs se houver (tags ou funil)
  if (filteredTicketIds !== null) {
    if (filteredTicketIds.length === 0) {
      console.log('🚫 Nenhum ticket encontrado com os filtros de tags/funil - retornando vazio');
      whereCondition = {
        ...whereCondition,
        id: {
          [Op.in]: [-1] // Nenhum resultado
        }
      };
    } else {
      console.log('✅ Aplicando filtro de IDs:', filteredTicketIds);
      whereCondition = {
        ...whereCondition,
        id: {
          [Op.in]: filteredTicketIds
        }
      };
    }
  }

  // Filtro por usuários (OR - pode ser qualquer um dos usuários)
  // IMPORTANTE: Este filtro SUBSTITUI a lógica de usuário padrão quando aplicado
  if (Array.isArray(users) && users.length > 0) {
    console.log('👥 Aplicando filtro de usuários:', users);
    
    // Remove qualquer filtro de usuário existente na whereCondition
    if (whereCondition[Op.or]) {
      console.log('🔄 Removendo filtro de usuário padrão para aplicar filtro específico');
      delete whereCondition[Op.or];
    }
    
    // Se já temos filtro de IDs (tags/funil), precisamos combinar com AND
    if (filteredTicketIds !== null) {
      console.log('🔗 Combinando filtro de usuários com filtro de IDs existente');
      whereCondition = {
        ...whereCondition,
        [Op.and]: [
          { id: { [Op.in]: filteredTicketIds.length > 0 ? filteredTicketIds : [-1] } },
          { userId: { [Op.in]: users } }
        ]
      };
      // Remove o filtro de ID individual pois agora está no AND
      delete (whereCondition as any).id;
    } else {
      // Se não há filtro de IDs, aplica apenas o filtro de usuários
      whereCondition = {
        ...whereCondition,
        userId: {
          [Op.in]: users
        }
      };
    }
    console.log('👥 WhereCondition após filtro de usuários:', JSON.stringify(whereCondition, null, 2));
  }

  const limit = 400;
  const offset = limit * (+pageNumber - 1);

  whereCondition = {
    ...whereCondition,
    companyId
  };

  console.log('🔍 WhereCondition final:', JSON.stringify(whereCondition, null, 2));

  const { count, rows: tickets } = await Ticket.findAndCountAll({
    where: whereCondition,
    include: includeCondition,
    distinct: true,
    limit,
    offset,
    order: [["updatedAt", "DESC"]],
    subQuery: false
  });
  const hasMore = count > offset + tickets.length;

  console.log('📊 Tickets encontrados:', tickets.length);

  return {
    tickets,
    count,
    hasMore
  };
};

export default ListTicketsServiceKanban;