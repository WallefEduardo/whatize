import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import FunilKanban from "../../models/FunilKanban";
import Tag from "../../models/Tag";

interface FunilKanbanData {
  name: string;
  companyId: number;
  isActive?: boolean;
}

interface ListFunilKanbanParams {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
}

interface UpdateFunilKanbanParams {
  name?: string;
  isActive?: boolean;
}

class FunilKanbanService {
  async create(funilKanbanData: FunilKanbanData): Promise<FunilKanban> {
    const { name, companyId } = funilKanbanData;

    // Validar tamanho do nome
    if (name.length > 20) {
      throw new AppError("O nome do funil não pode conter mais de 20 caracteres.");
    }

    const funilKanban = await FunilKanban.create({
      name,
      companyId
    });

    return funilKanban;
  }

  async list({
    searchParam = "",
    pageNumber = "1",
    companyId
  }: ListFunilKanbanParams): Promise<{
    funilKanbans: FunilKanban[];
    count: number;
    hasMore: boolean;
  }> {
    const limit = 20;
    const offset = (parseInt(pageNumber, 10) - 1) * limit;

    const { count, rows: funilKanbans } = await FunilKanban.findAndCountAll({
      where: {
        companyId,
        [Op.or]: [
          {
            name: {
              [Op.like]: `%${searchParam}%`
            }
          }
        ]
      },
      include: [
        {
          model: Tag,
          required: false,
          where: {
            kanban: 1
          }
        }
      ],
      limit,
      offset,
      order: [["name", "ASC"]]
    });

    const hasMore = count > offset + funilKanbans.length;

    return {
      funilKanbans,
      count,
      hasMore
    };
  }

  async findById(id: number, companyId: number): Promise<FunilKanban> {
    const funilKanban = await FunilKanban.findOne({
      where: {
        id,
        companyId
      },
      include: [
        {
          model: Tag,
          required: false,
          where: {
            kanban: 1
          }
        }
      ]
    });

    if (!funilKanban) {
      throw new AppError("Funil não encontrado", 404);
    }

    return funilKanban;
  }

  async update(
    id: number,
    funilKanbanData: UpdateFunilKanbanParams,
    companyId: number
  ): Promise<FunilKanban> {
    const funilKanban = await this.findById(id, companyId);

    if (funilKanbanData.name && funilKanbanData.name.length > 20) {
      throw new AppError("O nome do funil não pode conter mais de 20 caracteres.");
    }

    await funilKanban.update(funilKanbanData);

    return funilKanban;
  }

  async delete(id: number, companyId: number): Promise<void> {
    const funilKanban = await this.findById(id, companyId);

    // Verificar se já existem tags associadas a este funil
    const tagsCount = await Tag.count({
      where: {
        funilId: id,
        kanban: 1
      }
    });

    if (tagsCount > 0) {
      throw new AppError(
        `Não é possível excluir este funil pois existem ${tagsCount} seção(ões) associada(s) a ele. Remova ou altere as seções antes de excluir o funil.`
      );
    }

    await funilKanban.destroy();
  }
}

export default new FunilKanbanService();
