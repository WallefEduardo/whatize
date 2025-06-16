import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Users", "kanbanSelectedFunnel", {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Users", "kanbanSelectedTags", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Users", "kanbanSelectedUsers", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Users", "kanbanSelectedFunnel"),
      queryInterface.removeColumn("Users", "kanbanSelectedTags"),
      queryInterface.removeColumn("Users", "kanbanSelectedUsers")
    ]);
  }
}; 