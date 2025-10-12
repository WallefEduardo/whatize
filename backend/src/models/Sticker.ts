import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  BelongsTo,
  ForeignKey
} from "sequelize-typescript";
import User from "./User";
import Company from "./Company";

@Table
class Sticker extends Model<Sticker> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  mediaUrl: string;

  @Default("sticker")
  @Column
  mediaType: string;

  @Column
  fileName: string;

  @Column
  fileSize: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Default(0)
  @Column
  order: number;

  @Default(true)
  @Column
  isFavorite: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Sticker;
