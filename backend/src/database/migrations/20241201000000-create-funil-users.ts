import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("FunilUsers", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      funilId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "FunilKanbans", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Adicionar índice único para evitar duplicatas
    await queryInterface.addIndex("FunilUsers", ["funilId", "userId"], {
      unique: true,
      name: "funil_users_unique_index"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("FunilUsers");
  }
}; 