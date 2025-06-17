import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Atualiza todos os usuários existentes para terem as permissões padrão como "disabled"
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET 
        "userClosePendingTicket" = 'disabled',
        "updatedAt" = current_timestamp
      WHERE "id" IS NOT NULL;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // Reverte para o valor anterior (enabled)
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET 
        "userClosePendingTicket" = 'enabled',
        "updatedAt" = current_timestamp
      WHERE "id" IS NOT NULL;
    `);
  }
}; 