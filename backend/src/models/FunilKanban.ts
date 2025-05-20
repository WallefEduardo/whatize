import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  BelongsTo,
  ForeignKey,
  HasMany,
  Default
} from "sequelize-typescript";
import Company from "./Company";
import Tag from "./Tag";

@Table
class FunilKanban extends Model<FunilKanban> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Tag)
  tags: Tag[];

  @Default(true)
  @AllowNull(false)
  @Column
  isActive: boolean;
}

export default FunilKanban;
