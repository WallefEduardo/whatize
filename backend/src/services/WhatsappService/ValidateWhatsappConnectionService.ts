import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";

interface WhatsappData {
  name: string;
  number?: string;
  companyId: number;
  id?: number;
}

const ValidateWhatsappConnectionService = async (
  whatsappData: WhatsappData
): Promise<void> => {
  const { number, companyId, id } = whatsappData;

  if (!number) {
    return; // Se não tem número, não há validação necessária
  }

  // Remove caracteres não numéricos do número
  const cleanNumber = number.replace(/\D/g, "");
  
  if (!cleanNumber) {
    return; // Se número vazio após limpeza, não valida
  }

  // Busca conexões existentes com o mesmo número em outras empresas
  const existingConnections = await Whatsapp.findAll({
    where: {
      number: cleanNumber
    },
    include: [
      {
        association: "company",
        attributes: ["id", "name"]
      }
    ]
  });

  // Filtra conexões de outras empresas (excluindo a atual se for edição)
  const otherCompanyConnections = existingConnections.filter(conn => {
    // Se é edição (tem id), exclui a própria conexão
    if (id && conn.id === id) {
      return false;
    }
    // Retorna conexões de outras empresas
    return conn.companyId !== companyId;
  });

  if (otherCompanyConnections.length > 0) {
    const conflictingCompanies = otherCompanyConnections
      .map(conn => `"${conn.company?.name || `Empresa ${conn.companyId}`}"`)
      .join(", ");

    throw new AppError(
      `❌ ERRO: Este número WhatsApp (+${cleanNumber}) já está sendo usado pela(s) empresa(s): ${conflictingCompanies}.\n\n` +
      `🚫 IMPORTANTE: O WhatsApp permite apenas 1 conexão ativa por número.\n\n` +
      `💡 SOLUÇÕES:\n` +
      `1️⃣ Use um número diferente para esta empresa\n` +
      `2️⃣ Remova a conexão da outra empresa primeiro\n` +
      `3️⃣ Use WhatsApp Business API com números separados`,
      400
    );
  }

  // Verifica se há múltiplas conexões com status 'CONNECTED' para o mesmo número
  const connectedInstances = existingConnections.filter(conn => 
    conn.status === "CONNECTED" && 
    (id ? conn.id !== id : true)
  );

  if (connectedInstances.length > 0) {
    const activeCompanies = connectedInstances
      .map(conn => `"${conn.company?.name || `Empresa ${conn.companyId}`}"`)
      .join(", ");

    throw new AppError(
      `⚠️ AVISO: O número +${cleanNumber} já está CONECTADO e ativo na(s) empresa(s): ${activeCompanies}.\n\n` +
      `🔄 O que acontecerá:\n` +
      `• A conexão anterior será desconectada automaticamente\n` +
      `• Este pode causar instabilidade no atendimento\n\n` +
      `📱 RECOMENDAÇÃO: Use um número WhatsApp diferente para cada empresa`,
      400
    );
  }
};

export default ValidateWhatsappConnectionService; 