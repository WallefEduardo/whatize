// URL da API de lookup
const LOOKUP_API_URL = "https://lookup.zmaxsys.com.br";

// Função para consultar backend URL via API lookup
export const getBackendUrlByCompanyCode = async (companyCode) => {
  try {
    const response = await fetch(`${LOOKUP_API_URL}/lookup/${companyCode.toUpperCase()}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Código da empresa "${companyCode}" não encontrado. Verifique com o administrador.`);
      }
      throw new Error(`Erro ao consultar código da empresa: ${response.status}`);
    }
    
    const data = await response.json();
    return data.backendUrl;
    
  } catch (error) {
    // Se a API lookup estiver fora do ar, usar fallback
    if (error.message.includes('fetch')) {
      console.warn('API Lookup indisponível, usando fallback');
      return process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";
    }
    throw error;
  }
};

// Função para validar se o código existe (via API)
export const isValidCompanyCode = async (companyCode) => {
  try {
    await getBackendUrlByCompanyCode(companyCode);
    return true;
  } catch {
    return false;
  }
};

// Função para listar todas as empresas (para admin)
export const getAllCompanies = async () => {
  try {
    const response = await fetch(`${LOOKUP_API_URL}/companies`);
    if (!response.ok) throw new Error('Erro ao buscar empresas');
    
    const data = await response.json();
    return data.companies;
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return [];
  }
};

export default { getBackendUrlByCompanyCode, isValidCompanyCode, getAllCompanies };