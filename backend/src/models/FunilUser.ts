import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  BelongsTo,
  ForeignKey
} from "sequelize-typescript";
import FunilKanban from "./FunilKanban";
import User from "./User";

@Table
class FunilUser extends Model<FunilUser> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => FunilKanban)
  @AllowNull(false)
  @Column
  funilId: number;

  @BelongsTo(() => FunilKanban)
  funil: FunilKanban;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default FunilUser; 