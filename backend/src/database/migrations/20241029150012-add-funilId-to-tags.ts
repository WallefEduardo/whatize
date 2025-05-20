import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Tags", "funilId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "FunilKanbans", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Tags", "funilId");
  }
}; 