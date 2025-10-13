import { Request, Response } from "express";
import TextCorrectionService from "../services/TextCorrectionService";

/**
 * TextCorrectionController - Controller para correção de texto
 */
export const correctText = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { text } = req.body;
  const { companyId } = req.user;

  if (!companyId) {
    return res.status(401).json({
      error: "Não autorizado. CompanyId não encontrado."
    });
  }

  if (!text || typeof text !== "string") {
    return res.status(400).json({
      error: "Campo 'text' é obrigatório e deve ser uma string."
    });
  }

  if (text.trim().length === 0) {
    return res.status(400).json({
      error: "Texto vazio não pode ser corrigido."
    });
  }

  if (text.length > 2000) {
    return res.status(400).json({
      error: "Texto muito longo. Máximo de 2000 caracteres."
    });
  }

  try {
    const result = await TextCorrectionService({
      text,
      companyId
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro no TextCorrectionController:", error);

    return res.status(500).json({
      error: error.message || "Erro ao corrigir texto"
    });
  }
};
