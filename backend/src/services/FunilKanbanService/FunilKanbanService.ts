import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import FunilKanban from "../../models/FunilKanban";
import Tag from "../../models/Tag";
import User from "../../models/User";
import FunilUser from "../../models/FunilUser";

interface FunilKanbanData {
  name: string;
  companyId: number;
  isActive?: boolean;
  userIds?: number[];
}

interface ListFunilKanbanParams {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
  userId?: number;
  userProfile?: string;
}

interface UpdateFunilKanbanParams {
  name?: string;
  isActive?: boolean;
  userIds?: number[];
}

class FunilKanbanService {
  async create(funilKanbanData: FunilKanbanData): Promise<FunilKanban> {
    const { name, companyId, userIds } = funilKanbanData;

    // Validar tamanho do nome
    if (name.length > 20) {
      throw new AppError("O nome do funil não pode conter mais de 20 caracteres.");
    }

    const funilKanban = await FunilKanban.create({
      name,
      companyId
    });

    // Associar usuários se fornecidos
    if (userIds && userIds.length > 0) {
      await this.updateFunilUsers(funilKanban.id, userIds);
    }

    return await this.findById(funilKanban.id, companyId);
  }

  async list({
    searchParam = "",
    pageNumber = "1",
    companyId,
    userId,
    userProfile
  }: ListFunilKanbanParams): Promise<{
    funilKanbans: FunilKanban[];
    count: number;
    hasMore: boolean;
  }> {
    // Remover limitação de paginação para buscar todos os funis
    // const limit = 20;
    // const offset = (parseInt(pageNumber, 10) - 1) * limit;

    let whereCondition: any = {
      companyId,
      [Op.or]: [
        {
          name: {
            [Op.like]: `%${searchParam}%`
          }
        }
      ]
    };

    // Para usuários não-admin, usar uma abordagem diferente
    if (userProfile !== 'admin' && userId) {
      // Buscar todos os funis onde o usuário tem acesso OU que não têm usuários associados
      const { count, rows: allFunnels } = await FunilKanban.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: Tag,
            required: false,
            where: {
              kanban: 1
            }
          },
          {
            model: User,
            as: "users",
            attributes: ["id", "name", "email"],
            through: { attributes: [] },
            required: false
          }
        ],
        // Remover limit e offset para buscar todos
        // limit,
        // offset,
        order: [["id", "ASC"]] // Ordenar por ID em vez de nome
      });

      // Filtrar funis após a consulta
      const funilKanbans = allFunnels.filter(funnel => {
        // Se o funil não tem usuários associados, todos têm acesso
        if (!funnel.users || funnel.users.length === 0) {
          return true;
        }
        // Se o funil tem usuários associados, verificar se o usuário atual está na lista
        return funnel.users.some(user => user.id === userId);
      });

      // Como não há mais paginação, hasMore sempre será false
      const hasMore = false;

      return {
        funilKanbans,
        count: funilKanbans.length,
        hasMore
      };
    } else {
      // Para admins, retornar todos os funis
      const { count, rows: allFunnels } = await FunilKanban.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: Tag,
            required: false,
            where: {
              kanban: 1
            }
          },
          {
            model: User,
            as: "users",
            attributes: ["id", "name", "email"],
            through: { attributes: [] },
            required: false
          }
        ],
        // Remover limit e offset para buscar todos
        // limit,
        // offset,
        order: [["id", "ASC"]] // Ordenar por ID em vez de nome
      });

      // Como não há mais paginação, hasMore sempre será false
      const hasMore = false;

      return {
        funilKanbans: allFunnels,
        count,
        hasMore
      };
    }
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
        },
        {
          model: User,
          as: "users",
          attributes: ["id", "name", "email"],
          through: { attributes: [] }
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

    await funilKanban.update({
      name: funilKanbanData.name,
      isActive: funilKanbanData.isActive
    });

    // Atualizar usuários se fornecidos
    if (funilKanbanData.userIds !== undefined) {
      await this.updateFunilUsers(id, funilKanbanData.userIds);
    }

    return await this.findById(id, companyId);
  }

  private async updateFunilUsers(funilId: number, userIds: number[]): Promise<void> {
    // Remover todas as associações existentes
    await FunilUser.destroy({
      where: { funilId }
    });

    // Criar novas associações
    if (userIds.length > 0) {
      const funilUsers = userIds.map(userId => ({
        funilId,
        userId
      }));

      await FunilUser.bulkCreate(funilUsers);
    }
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
