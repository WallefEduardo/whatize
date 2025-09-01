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
  tableName: "Tasks",
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
      fields: ["status"]
    },
    {
      fields: ["priority"]
    },
    {
      fields: ["dueDate"]
    },
    {
      fields: ["uuid"],
      unique: true
    },
    {
      fields: ["companyId", "status"]
    },
    {
      fields: ["assignedToId", "status"]
    }
  ]
})
class Task extends Model<Task> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      len: [1, 255],
      notEmpty: true
    }
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description: string;

  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.TODO
  })
  status: TaskStatus;

  @Column({
    type: DataType.ENUM(...Object.values(TaskPriority)),
    allowNull: false,
    defaultValue: TaskPriority.MEDIUM
  })
  priority: TaskPriority;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true
  })
  dueDate: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  assignedToId: number;

  @BelongsTo(() => User, "assignedToId")
  assignedTo: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  createdById: number;

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Default(uuidv4)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: true
  })
  uuid: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BeforeCreate
  @BeforeUpdate
  static async generateUuid(task: Task): Promise<void> {
    if (!task.uuid) {
      task.uuid = uuidv4();
    }
  }

  // Métodos auxiliares
  get isOverdue(): boolean {
    if (!this.dueDate || this.status === TaskStatus.COMPLETED) {
      return false;
    }
    const today = new Date();
    const due = new Date(this.dueDate);
    return due < today;
  }

  get priorityWeight(): number {
    const weights = {
      [TaskPriority.LOW]: 1,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.HIGH]: 3
    };
    return weights[this.priority] || 2;
  }

  get statusLabel(): string {
    const labels = {
      [TaskStatus.TODO]: "A Fazer",
      [TaskStatus.IN_PROGRESS]: "Em Andamento", 
      [TaskStatus.COMPLETED]: "Concluído"
    };
    return labels[this.status] || this.status;
  }

  get priorityLabel(): string {
    const labels = {
      [TaskPriority.LOW]: "Baixa",
      [TaskPriority.MEDIUM]: "Média",
      [TaskPriority.HIGH]: "Alta"
    };
    return labels[this.priority] || this.priority;
  }
}

export default Task;