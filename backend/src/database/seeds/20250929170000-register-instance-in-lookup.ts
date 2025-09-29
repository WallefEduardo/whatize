import { QueryInterface } from "sequelize";
import RegisterInstanceService from "../../services/LookupService/RegisterInstanceService";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    console.log("🔄 Iniciando registro da instância no Lookup Service...");
    
    try {
      const registerService = new RegisterInstanceService();
      
      // Verificar se o Lookup Service está disponível
      const isHealthy = await registerService.healthCheck();
      
      if (!isHealthy) {
        console.warn("⚠️  Lookup Service indisponível. Pulando registro da instância.");
        console.warn("ℹ️  A instância será registrada automaticamente quando o Lookup Service estiver disponível.");
        return;
      }

      // Registrar ou atualizar a instância
      const result = await registerService.updateInstance();
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`📋 Instância: ${process.env.INSTANCE_CODE}`);
        console.log(`🌐 Backend URL: ${process.env.BACKEND_URL}`);
        console.log(`📝 Nome: ${process.env.INSTANCE_NAME}`);
      } else {
        console.warn(`⚠️  ${result.message}`);
      }

    } catch (error: any) {
      console.error("❌ Erro ao registrar instância:", error.message);
      // Não falhar o seed se o lookup estiver indisponível
      console.warn("ℹ️  Continuando inicialização sem registro no Lookup Service.");
    }
  },

  down: async (queryInterface: QueryInterface) => {
    console.log("🔄 Removendo registro da instância do Lookup Service...");
    
    try {
      const instanceCode = process.env.INSTANCE_CODE;
      
      if (!instanceCode) {
        console.warn("⚠️  INSTANCE_CODE não encontrado no .env");
        return;
      }

      // Aqui poderia implementar a remoção da instância do lookup
      // Por enquanto, apenas log informativo
      console.log(`ℹ️  Para remover a instância ${instanceCode} do Lookup Service,`);
      console.log(`   acesse https://lookup.zmaxsys.com.br/companies e remova manualmente.`);
      
    } catch (error: any) {
      console.error("❌ Erro ao remover instância:", error.message);
    }
  }
};