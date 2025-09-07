import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
  BeforeUpdate
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";
import User from "./User";
import Company from "./Company";

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "inprogress", 
  COMPLETED = "completed"
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

@Table({
  tableName: "CompletedTasks",
  indexes: [
    {
      fields: ["companyId"]
    },
    {
      fields: ["assignedToId"]
    },
    {
      fields: ["createdById"]
    },
    {
      fields: ["completedById"]
    },
    {
      fields: ["priority"]
    },
    {
      fields: ["completedAt"]
    },
    {
      fields: ["uuid"],
      unique: true
    }
  ]
})
class CompletedTask extends Model<CompletedTask> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Default(uuidv4)
  @Column(DataType.UUID)
  uuid: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Default("completed")
  @Column({
    type: DataType.ENUM("todo", "inprogress", "completed"),
    allowNull: false
  })
  status: string;

  @Default("medium")
  @Column({
    type: DataType.ENUM("low", "medium", "high"),
    allowNull: false
  })
  priority: string;

  @Column(DataType.DATE)
  dueDate: Date;

  @ForeignKey(() => User)
  @Column
  assignedToId: number;

  @BelongsTo(() => User, "assignedToId")
  assignedTo: User;

  @ForeignKey(() => User)
  @Column({
    allowNull: false
  })
  createdById: number;

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @ForeignKey(() => Company)
  @Column({
    allowNull: false
  })
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  completedAt: Date;

  @ForeignKey(() => User)
  @Column({
    allowNull: false
  })
  completedById: number;

  @BelongsTo(() => User, "completedById")
  completedBy: User;

  @Column({
    type: DataType.ENUM("todo", "inprogress"),
    allowNull: false
  })
  originalStatus: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BeforeCreate
  static setUUID(task: CompletedTask): void {
    task.uuid = uuidv4();
  }

  @BeforeUpdate
  static updateUUID(task: CompletedTask): void {
    task.uuid = uuidv4();
  }
}

export default CompletedTask;