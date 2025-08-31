import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Users", "portfolio", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: "JSON string containing user portfolio links"
      }),
      queryInterface.addColumn("Users", "skills", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: "JSON string containing user skills/habilidades"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Users", "portfolio"),
      queryInterface.removeColumn("Users", "skills")
    ]);
  }
};