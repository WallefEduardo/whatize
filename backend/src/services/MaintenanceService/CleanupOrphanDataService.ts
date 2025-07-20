import { QueryTypes } from "sequelize";
import sequelize from "../../database";
import logger from "../../utils/logger";

const CleanupOrphanDataService = async (): Promise<void> => {
  try {
    logger.info("🧹 [CLEANUP] Starting automatic orphan data cleanup");

    // 1. Remover tickets órfãos (sem contato)
    const orphanTicketsResult = await sequelize.query(`
      DELETE FROM "Tickets" 
      WHERE "contactId" NOT IN (SELECT id FROM "Contacts")
    `, {
      type: QueryTypes.DELETE
    });

    if (orphanTicketsResult[1] > 0) {
      logger.warn(`🗑️ [CLEANUP] Removed ${orphanTicketsResult[1]} orphan tickets`);
    }

    // 2. Remover mensagens órfãs (sem ticket)
    const orphanMessagesResult = await sequelize.query(`
      DELETE FROM "Messages" 
      WHERE "ticketId" NOT IN (SELECT id FROM "Tickets")
    `, {
      type: QueryTypes.DELETE
    });

    if (orphanMessagesResult[1] > 0) {
      logger.warn(`🗑️ [CLEANUP] Removed ${orphanMessagesResult[1]} orphan messages`);
    }

    // 3. Remover contatos duplicados (manter apenas o mais recente por número/empresa)
    const duplicateContactsResult = await sequelize.query(`
      DELETE FROM "Contacts" c1
      WHERE EXISTS (
        SELECT 1 FROM "Contacts" c2 
        WHERE c2.number = c1.number 
        AND c2."companyId" = c1."companyId"
        AND c2.id > c1.id
      )
    `, {
      type: QueryTypes.DELETE
    });

    if (duplicateContactsResult[1] > 0) {
      logger.warn(`🗑️ [CLEANUP] Removed ${duplicateContactsResult[1]} duplicate contacts`);
    }

    // 4. Fechar tickets antigos sem atividade (mais de 30 dias em "pending")
    const staleTicketsResult = await sequelize.query(`
      UPDATE "Tickets" 
      SET status = 'closed', "updatedAt" = NOW()
      WHERE status = 'pending' 
      AND "updatedAt" < NOW() - INTERVAL '30 days'
      AND id NOT IN (
        SELECT DISTINCT "ticketId" 
        FROM "Messages" 
        WHERE "createdAt" > NOW() - INTERVAL '30 days'
      )
    `, {
      type: QueryTypes.UPDATE
    });

    if (staleTicketsResult[1] > 0) {
      logger.info(`📝 [CLEANUP] Closed ${staleTicketsResult[1]} stale tickets`);
    }

    // 5. Verificar inconsistências (tickets com empresa diferente do contato)
    const inconsistentTickets = await sequelize.query(`
      SELECT 
        t.id as ticket_id,
        t."companyId" as ticket_company,
        c."companyId" as contact_company
      FROM "Tickets" t
      JOIN "Contacts" c ON t."contactId" = c.id
      WHERE t."companyId" != c."companyId"
      LIMIT 10
    `, {
      type: QueryTypes.SELECT
    });

    if (inconsistentTickets.length > 0) {
      logger.error(`❌ [CLEANUP] Found ${inconsistentTickets.length} tickets with company mismatch!`);
      
      // Corrigir inconsistências (usar empresa do contato)
      const fixInconsistenciesResult = await sequelize.query(`
        UPDATE "Tickets" t
        SET "companyId" = c."companyId", "updatedAt" = NOW()
        FROM "Contacts" c
        WHERE t."contactId" = c.id 
        AND t."companyId" != c."companyId"
      `, {
        type: QueryTypes.UPDATE
      });

      if (fixInconsistenciesResult[1] > 0) {
        logger.warn(`🔧 [CLEANUP] Fixed ${fixInconsistenciesResult[1]} company mismatches`);
      }
    }

    logger.info("✅ [CLEANUP] Automatic cleanup completed successfully");

  } catch (error) {
    logger.error(`❌ [CLEANUP] Error during cleanup: ${error.message}`);
  }
};

export default CleanupOrphanDataService; 