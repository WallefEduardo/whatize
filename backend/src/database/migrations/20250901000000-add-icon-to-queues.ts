import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Queues", "icon", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Users"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Queues", "icon");
  }
};