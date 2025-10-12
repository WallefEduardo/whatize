'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Messages');

    if (!tableInfo.reactions) {
      return queryInterface.addColumn('Messages', 'reactions', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      });
    }

    return Promise.resolve();
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Messages', 'reactions');
  }
};
