import OpenAI from "openai";
import Prompt from "../models/Prompt";

interface CorrectTextRequest {
  text: string;
  companyId: number;
}

interface CorrectTextResponse {
  originalText: string;
  correctedText: string;
}

/**
 * TextCorrectionService - Corrige texto usando OpenAI API
 *
 * Prioridade de API Key:
 * 1. Tenta usar apiKey do primeiro Prompt da empresa
 * 2. Fallback para process.env.OPENAI_API_KEY
 */
const TextCorrectionService = async ({
  text,
  companyId
}: CorrectTextRequest): Promise<CorrectTextResponse> => {
  if (!text || text.trim().length === 0) {
    throw new Error("Texto vazio não pode ser corrigido");
  }

  let apiKey: string | undefined;

  try {
    // Tentar buscar API key do primeiro prompt da empresa
    const prompt = await Prompt.findOne({
      where: { companyId },
      order: [["createdAt", "DESC"]]
    });

    if (prompt && prompt.apiKey) {
      apiKey = prompt.apiKey;
    }
  } catch (error) {
    console.log("Erro ao buscar Prompt da empresa, usando fallback:", error);
  }

  // Fallback para variável de ambiente
  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY;
  }

  if (!apiKey) {
    throw new Error(
      "Nenhuma API Key da OpenAI configurada. Configure um Prompt com API Key ou adicione OPENAI_API_KEY no .env"
    );
  }

  try {
    // Criar instância do OpenAI
    const openai = new OpenAI({ apiKey });

    // Prompt de correção em português
    const systemPrompt = `Você é um assistente de correção de texto em português. Corrija gramática, ortografia e melhore a clareza do texto preservando o significado e tom original. Retorne apenas o texto corrigido sem explicações ou comentários adicionais.`;

    // Chamar OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      max_tokens: 200,
      temperature: 0.3 // Baixa temperatura para respostas mais determinísticas
    });

    const correctedText = completion.choices[0]?.message?.content?.trim();

    if (!correctedText) {
      throw new Error("OpenAI retornou resposta vazia");
    }

    return {
      originalText: text,
      correctedText
    };
  } catch (error: any) {
    console.error("Erro ao corrigir texto com OpenAI:", error);

    if (error.status === 401) {
      throw new Error("API Key da OpenAI inválida");
    }

    if (error.status === 429) {
      throw new Error("Limite de requisições da OpenAI excedido. Tente novamente em alguns momentos.");
    }

    throw new Error(`Erro ao corrigir texto: ${error.message}`);
  }
};

export default TextCorrectionService;
