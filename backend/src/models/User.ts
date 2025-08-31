import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  BeforeCreate,
  BeforeUpdate,
  PrimaryKey,
  AutoIncrement,
  Default,
  HasMany,
  BelongsToMany,
  ForeignKey,
  BelongsTo,
  BeforeDestroy
} from "sequelize-typescript";
import { hash, compare } from "bcryptjs";
import Ticket from "./Ticket";
import Queue from "./Queue";
import UserQueue from "./UserQueue";
import Company from "./Company";
import QuickMessage from "./QuickMessage";
import Whatsapp from "./Whatsapp";
import Chatbot from "./Chatbot";
import FunilKanban from "./FunilKanban";
import FunilUser from "./FunilUser";

@Table
class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  email: string;

  @Column(DataType.VIRTUAL)
  password: string;

  @Column
  passwordHash: string;

  @Default(0)
  @Column
  tokenVersion: number;

  @Default("admin")
  @Column
  profile: string;

  @Default(null)
  @Column
  profileImage: string;

  @Default(null)
  @Column
  coverImage: string;
  
  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;
  
  @Column
  super: boolean;

  @Column
  online: boolean;

  @Default("00:00")
  @Column
  startWork: string;

  @Default("23:59")
  @Column
  endWork: string;

  @Default("")
  @Column
  color: string;

  @Default("disable")
  @Column
  allTicket: string;

  @Default(false)
  @Column
  allowGroup: boolean;

  @Default("light")
  @Column
  defaultTheme: string;

  @Default("closed")
  @Column
  defaultMenu: string;

  @Default("")
  @Column(DataType.TEXT)
  farewellMessage: string;

  // Novos campos de dados pessoais/profissionais
  @Column
  telefone: string;

  @Column
  cargo: string;

  @Column
  departamento: string;

  @Column(DataType.DATEONLY)
  dataAdmissao: Date;

  @Column(DataType.TEXT)
  sobre: string;

  // Novos campos de endereço
  @Column
  cep: string;

  @Column
  endereco: string;

  @Column
  numero: string;

  @Column
  complemento: string;

  @Column
  bairro: string;

  @Column
  cidade: string;

  @Column
  estado: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @BelongsToMany(() => Queue, () => UserQueue)
  queues: Queue[];

  @BelongsToMany(() => FunilKanban, () => FunilUser)
  funis: FunilKanban[];

  @HasMany(() => QuickMessage, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  quickMessages: QuickMessage[];

  @BeforeUpdate
  @BeforeCreate
  static hashPassword = async (instance: User): Promise<void> => {
    if (instance.password) {
      instance.passwordHash = await hash(instance.password, 8);
    }
  };

  public checkPassword = async (password: string): Promise<boolean> => {
    return compare(password, this.getDataValue("passwordHash"));
  };

  @Default("disabled")
  @Column
  allHistoric: string;

  @HasMany(() => Chatbot, {
    onUpdate: "SET NULL",
    onDelete: "SET NULL",
    hooks: true
  })
  chatbot: Chatbot[];

  @Default("disabled")
  @Column
  allUserChat: string;

  @Default("disabled")
  @Column
  userClosePendingTicket: string;

  @Default("disabled")
  @Column
  showDashboard: string;

  @Default(550)
  @Column
  defaultTicketsManagerWidth: number;

  @Column({
    allowNull: true
  })
  resetPasswordToken: string;

  @Column({
    allowNull: true
  })
  resetPasswordExpires: Date;

  @Default("disable")
  @Column
  allowRealTime: string;

  @Default("disable")
  @Column
  allowConnections: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('selectedQueueIds' as any);
      return value ? JSON.parse(value) : null;
    },
    set(value: number[] | null) {
      this.setDataValue('selectedQueueIds' as any, value ? JSON.stringify(value) : null);
    }
  })
  selectedQueueIds: number[];

  @Column({
    allowNull: true
  })
  kanbanSelectedFunnel: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('kanbanSelectedTags' as any);
      return value ? JSON.parse(value) : null;
    },
    set(value: number[] | null) {
      this.setDataValue('kanbanSelectedTags' as any, value ? JSON.stringify(value) : null);
    }
  })
  kanbanSelectedTags: number[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('kanbanSelectedUsers' as any);
      return value ? JSON.parse(value) : null;
    },
    set(value: number[] | null) {
      this.setDataValue('kanbanSelectedUsers' as any, value ? JSON.stringify(value) : null);
    }
  })
  kanbanSelectedUsers: number[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('kanbanCollapsedColumns' as any);
      return value ? JSON.parse(value) : null;
    },
    set(value: string[] | null) {
      this.setDataValue('kanbanCollapsedColumns' as any, value ? JSON.stringify(value) : null);
    }
  })
  kanbanCollapsedColumns: string[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('kanbanColumnOrder' as any);
      return value ? JSON.parse(value) : null;
    },
    set(value: string[] | null) {
      this.setDataValue('kanbanColumnOrder' as any, value ? JSON.stringify(value) : null);
    }
  })
  kanbanColumnOrder: string[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "JSON string containing user portfolio links",
    get() {
      const value = this.getDataValue('portfolio' as any);
      return value ? JSON.parse(value) : null;
    },
    set(value: any[] | null) {
      this.setDataValue('portfolio' as any, value ? JSON.stringify(value) : null);
    }
  })
  portfolio: any[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "JSON string containing user skills/habilidades",
    get() {
      const value = this.getDataValue('skills' as any);
      return value ? JSON.parse(value) : null;
    },
    set(value: string[] | null) {
      this.setDataValue('skills' as any, value ? JSON.stringify(value) : null);
    }
  })
  skills: string[];

  @BeforeDestroy
  static async updateChatbotsUsersReferences(user: User) {
    // Atualizar os registros na tabela Chatbots onde optQueueId é igual ao ID da fila que será excluída
    await Chatbot.update({ optUserId: null }, { where: { optUserId: user.id } });
  }
}

export default User;
