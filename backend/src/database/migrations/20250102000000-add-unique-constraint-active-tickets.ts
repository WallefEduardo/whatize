import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    try {
      // Primeiro, vamos limpar tickets duplicados existentes (PostgreSQL syntax)
      await queryInterface.sequelize.query(`
        DELETE FROM "Tickets" t1
        USING "Tickets" t2 
        WHERE t1.id < t2.id 
        AND t1."contactId" = t2."contactId" 
        AND t1."companyId" = t2."companyId" 
        AND t1."whatsappId" = t2."whatsappId"
        AND t1.status IN ('open', 'pending', 'group', 'nps', 'lgpd')
        AND t2.status IN ('open', 'pending', 'group', 'nps', 'lgpd')
      `);

      // Adicionar índice único composto para evitar tickets duplicados em estados ativos
      await queryInterface.addIndex("Tickets", 
        ["contactId", "companyId", "whatsappId", "status"], 
        {
          name: "unique_active_ticket_per_contact",
          unique: false, // Não único porque precisamos permitir múltiplos tickets 'closed'
        }
      );

      // Criar um índice para busca rápida de tickets ativos
      await queryInterface.addIndex("Tickets", 
        ["contactId", "companyId", "whatsappId", "status", "updatedAt"], 
        {
          name: "idx_tickets_active_search",
          unique: false,
        }
      );

      // Criar um índice para performance em buscas por último ticket
      await queryInterface.addIndex("Tickets", 
        ["contactId", "companyId", "whatsappId", "updatedAt"], 
        {
          name: "idx_tickets_latest_by_contact",
          unique: false,
        }
      );

      // Criar um índice para status + updatedAt (para buscas temporais)
      await queryInterface.addIndex("Tickets", 
        ["status", "updatedAt"], 
        {
          name: "idx_tickets_status_updated",
          unique: false,
        }
      );

    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    try {
      await queryInterface.removeIndex("Tickets", "unique_active_ticket_per_contact");
      await queryInterface.removeIndex("Tickets", "idx_tickets_active_search");
      await queryInterface.removeIndex("Tickets", "idx_tickets_latest_by_contact");
      await queryInterface.removeIndex("Tickets", "idx_tickets_status_updated");
    } catch (error) {
      console.error('Error in migration rollback:', error);
      throw error;
    }
  }
}; 