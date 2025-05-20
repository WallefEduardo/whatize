import { Op, Sequelize } from "sequelize";
import Tag from "../../models/Tag";
import Contact from "../../models/Contact";

interface Request {
  companyId: number;
  searchParam?: string;
  kanban?: number;
  funilId?: number;
}

const ListService = async ({
  companyId,
  searchParam,
  kanban = 0,
  funilId = null
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

  if (funilId && kanban === 1) {
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
