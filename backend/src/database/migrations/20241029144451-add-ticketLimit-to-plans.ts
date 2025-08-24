import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.addColumn('Plans', 'ticketLimit', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn('Plans', 'ticketLimit');
  }
}; 