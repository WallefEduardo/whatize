import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Atualiza todas as empresas existentes para terem as configurações padrão como "disabled"
    await queryInterface.sequelize.query(`
      UPDATE "CompaniesSettings" 
      SET 
        "acceptCallWhatsapp" = 'disabled',
        "userRandom" = 'disabled',
        "sendGreetingMessageOneQueues" = 'disabled',
        "sendSignMessage" = 'disabled',
        "sendGreetingAccepted" = 'disabled',
        "CheckMsgIsGroup" = 'disabled',
        "sendQueuePosition" = 'disabled',
        "acceptAudioMessageContact" = 'disabled',
        "sendMsgTransfTicket" = 'disabled',
        "updatedAt" = current_timestamp
      WHERE "companyId" IS NOT NULL;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // Reverte para os valores anteriores (enabled)
    await queryInterface.sequelize.query(`
      UPDATE "CompaniesSettings" 
      SET 
        "acceptCallWhatsapp" = 'enabled',
        "userRandom" = 'enabled',
        "sendGreetingMessageOneQueues" = 'enabled',
        "sendSignMessage" = 'enabled',
        "sendGreetingAccepted" = 'enabled',
        "CheckMsgIsGroup" = 'enabled',
        "sendQueuePosition" = 'enabled',
        "acceptAudioMessageContact" = 'enabled',
        "sendMsgTransfTicket" = 'enabled',
        "updatedAt" = current_timestamp
      WHERE "companyId" IS NOT NULL;
    `);
  }
}; 