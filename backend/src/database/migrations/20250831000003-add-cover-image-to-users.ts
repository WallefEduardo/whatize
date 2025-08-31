import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Users", "coverImage", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      comment: "Cover image filename for user profile"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Users", "coverImage");
  }
};