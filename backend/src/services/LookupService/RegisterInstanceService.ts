import axios from "axios";

interface RegisterInstanceRequest {
  code: string;
  backendUrl: string;
  companyName: string;
}

interface RegisterInstanceResponse {
  success: boolean;
  message: string;
  instanceId?: number;
}

class RegisterInstanceService {
  private lookupApiUrl: string;

  constructor() {
    this.lookupApiUrl = process.env.LOOKUP_API_URL || "https://lookup.zmaxsys.com.br";
  }

  async registerInstance(): Promise<RegisterInstanceResponse> {
    try {
      const instanceCode = process.env.INSTANCE_CODE;
      const instanceName = process.env.INSTANCE_NAME || `Instância ${instanceCode}`;
      const backendUrl = process.env.BACKEND_URL;

      if (!instanceCode || !backendUrl) {
        console.error("❌ INSTANCE_CODE e BACKEND_URL são obrigatórios no .env");
        return {
          success: false,
          message: "Configuração de instância incompleta"
        };
      }

      console.log(`🔄 Registrando instância ${instanceCode} no Lookup Service...`);

      const payload: RegisterInstanceRequest = {
        code: instanceCode,
        backendUrl: backendUrl,
        companyName: instanceName
      };

      const response = await axios.post(`${this.lookupApiUrl}/companies`, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Instância ${instanceCode} registrada com sucesso!`);
      return {
        success: true,
        message: "Instância registrada com sucesso",
        instanceId: response.data.company?.id
      };

    } catch (error: any) {
      // Se o código já existe, não é erro crítico
      if (error.response?.status === 409) {
        console.log(`ℹ️  Instância ${process.env.INSTANCE_CODE} já está registrada no Lookup Service`);
        return {
          success: true,
          message: "Instância já registrada"
        };
      }

      // Se a API lookup estiver offline, não bloquear a aplicação
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.warn(`⚠️  Lookup Service indisponível. Aplicação continuará funcionando.`);
        return {
          success: false,
          message: "Lookup Service indisponível"
        };
      }

      console.error("❌ Erro ao registrar instância no Lookup Service:", error.message);
      return {
        success: false,
        message: error.message || "Erro desconhecido"
      };
    }
  }

  async updateInstance(): Promise<RegisterInstanceResponse> {
    try {
      const instanceCode = process.env.INSTANCE_CODE;
      const instanceName = process.env.INSTANCE_NAME || `Instância ${instanceCode}`;
      const backendUrl = process.env.BACKEND_URL;

      if (!instanceCode || !backendUrl) {
        return {
          success: false,
          message: "Configuração de instância incompleta"
        };
      }

      // Primeiro tenta encontrar a instância
      const lookupResponse = await axios.get(`${this.lookupApiUrl}/lookup/${instanceCode}`);
      
      if (lookupResponse.data.backendUrl !== backendUrl) {
        console.log(`🔄 Atualizando URL da instância ${instanceCode}...`);
        
        // Aqui seria necessário implementar o PUT no lookup service se precisar atualizar
        // Por enquanto, só registra novamente
        return await this.registerInstance();
      }

      return {
        success: true,
        message: "Instância já atualizada"
      };

    } catch (error: any) {
      if (error.response?.status === 404) {
        // Instância não existe, registrar
        return await this.registerInstance();
      }

      console.error("❌ Erro ao verificar instância:", error.message);
      return {
        success: false,
        message: error.message || "Erro desconhecido"
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.lookupApiUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export default RegisterInstanceService;