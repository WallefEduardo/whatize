import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("UserKanbanColumnOrders", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      columnId: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "ID da coluna (lane0 para Em aberto, ou ID da tag)"
      },
      columnType: {
        type: DataTypes.ENUM('default', 'tag'),
        allowNull: false,
        defaultValue: 'tag',
        comment: "Tipo da coluna: default (Em aberto) ou tag"
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Posição da coluna na ordem personalizada"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("UserKanbanColumnOrders");
  }
}; 