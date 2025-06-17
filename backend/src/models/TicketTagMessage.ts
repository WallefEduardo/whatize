import { Model, DataTypes } from "sequelize";
import database from "../database";

class TicketTagMessage extends Model {
  declare id: number;
  declare ticketId: number;
  declare tagId: number;
  declare messageSent: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

TicketTagMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    ticketId: {
      type: DataTypes.INTEGER,
      references: { model: "Tickets", key: "id" },
      onDelete: "CASCADE",
      allowNull: false
    },
    tagId: {
      type: DataTypes.INTEGER,
      references: { model: "Tags", key: "id" },
      onDelete: "CASCADE",
      allowNull: false
    },
    messageSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  },
  {
    sequelize: database,
    tableName: "TicketTagMessages"
  }
);

export default TicketTagMessage;