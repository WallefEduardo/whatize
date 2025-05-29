import { Op, Sequelize } from "sequelize";
import Tag from "../../models/Tag";
import Contact from "../../models/Contact";

interface Request {
  companyId: number;
  searchParam?: string;
  kanban?: number;
  funilId?: number;
  funilIds?: number[];
}

const ListService = async ({
  companyId,
  searchParam,
  kanban = 0,
  funilId = null,
  funilIds = []
}: Request): Promise<Tag[]> => {
  let whereCondition = {};

  if (searchParam) {
    whereCondition = {
      [Op.or]: [
        { name: { [Op.like]: `%${searchParam}%` } },
        { color: { [Op.like]: `%${searchParam}%` } }
      ]
    };
  }

  // Verificamos primeiro se temos múltiplos funilIds
  if (funilIds && funilIds.length > 0 && Number(kanban) === 1) {
    whereCondition = {
      ...whereCondition,
      funilId: {
        [Op.in]: funilIds
      }
    };
  }
  // Se não temos múltiplos mas temos um único, usamos ele
  else if (funilId && Number(kanban) === 1) {
    whereCondition = {
      ...whereCondition,
      funilId
    };
  }

  const tags = await Tag.findAll({
    where: { ...whereCondition, companyId, kanban },
    order: [["name", "ASC"]],
    include: [
      {
        model: Contact,
        as: "contacts"
      }
    ],
    attributes: {
      exclude: ["createdAt", "updatedAt"],
      include: [
        [Sequelize.fn("COUNT", Sequelize.col("contacts.id")), "contactsCount"]
      ]
    },
    group: [
      "Tag.id",
      "contacts.ContactTag.tagId",
      "contacts.ContactTag.contactId",
      "contacts.ContactTag.createdAt",
      "contacts.ContactTag.updatedAt",
      "contacts.id"
    ]
  });

  return tags;
};

export default ListService;
