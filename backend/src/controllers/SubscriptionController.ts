import { Request, Response } from "express";
import * as Yup from "yup";
import Gerencianet from "sdk-node-apis-efi";
import AppError from "../errors/AppError";
import { format, addMonths } from "date-fns";

import options from "../config/Gn";
import Company from "../models/Company";
import Invoices from "../models/Invoices";
import { getIO } from "../libs/socket";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import Plan from "../models/Plan";
import GenerateNextInvoiceService from "../services/InvoicesService/GenerateNextInvoiceService";
import CreateInvoiceService from "../services/InvoicesService/CreateInvoiceService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const gerencianet = new Gerencianet(options);

  return res.json(gerencianet);
};

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {

  const gerencianet = new Gerencianet(options);
  const { companyId } = req.user;

  // Simplificando a validação para só exigir o invoiceId
  const schema = Yup.object().shape({
    invoiceId: Yup.number().required()
  });

  try {
    if (!(await schema.isValid(req.body))) {
      throw new AppError("Erro: ID da fatura é obrigatório", 400);
    }

    const { invoiceId } = req.body;

    // Buscar a empresa
    const company = await Company.findOne({ where: { id: companyId } });
    if (!company) {
      throw new AppError("Empresa não encontrada", 404);
    }

    // Buscar a fatura específica
    const invoice = await Invoices.findOne({ where: { id: invoiceId, companyId } });
    if (!invoice) {
      throw new AppError("Fatura não encontrada", 404);
    }

    // Buscar o plano
    const plan = await Plan.findOne({ where: { id: company.planId } });
    if (!plan) {
      throw new AppError("Plano não encontrado", 404);
    }

    // Garantir que o valor seja pelo menos 0.01
    const invoiceValue = Math.max(0.01, invoice.value || 0.01);
    
    // Formatar o valor corretamente para a API - usando o formato fixo com 2 casas decimais
    const price = invoiceValue.toFixed(2);
    
    console.log(`Valor da fatura ${invoiceId}: ${invoiceValue}`);
    console.log(`Valor formatado para API: ${price}`);

    // Configurar o objeto devedor com os dados da empresa
    const devedor: { nome: string; cpf?: string; cnpj?: string } = { nome: company.name };
    const doc = company.document ? company.document.replace(/\D/g, "") : "";

    if (!doc) {
      throw new AppError("Documento (CPF/CNPJ) da empresa não encontrado", 400);
    }

    if (doc.length === 11) {
      devedor.cpf = doc;
    } else if (doc.length === 14) {
      devedor.cnpj = doc;
    } else {
      throw new AppError("Documento (CPF/CNPJ) inválido", 400);
    }

    // Corpo da requisição para a API da Gerencianet
    const body = {
      calendario: {
        expiracao: 3600 // 1 hora
      },
      devedor,
      valor: {
        original: price
      },
      chave: process.env.GERENCIANET_CHAVEPIX,
      solicitacaoPagador: `#Fatura:${invoiceId}`
    };

    try {
      // Criar cobrança imediata
      const pix = await gerencianet.pixCreateImmediateCharge(null, body);
      // Gerar QR Code
      const qrcode = await gerencianet.pixGenerateQRCode({ id: pix.loc.id });

      // Atualizar status da fatura para 'pending_payment'
      await invoice.update({
        status: 'pending_payment',
        linkInvoice: qrcode.imagemQrcode || ""
      });

      return res.json({
        ...pix,
        qrcode,
        invoiceId
      });
    } catch (error) {
      console.log('error_subscription_api', error);
      throw new AppError(`Erro na API da Gerencianet: ${error.message || 'Desconhecido'}`, 400);
    }
  } catch (error) {
    console.log('error_subscription', error);
    return res.status(error.statusCode || 400).json({ 
      error: true, 
      message: error.message || "Erro ao criar a assinatura"
    });
  }
};

export const createWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schema = Yup.object().shape({
    chave: Yup.string().required(),
    url: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("erro de validação ao criar o webhook", 400);
  }

  const { chave, url } = req.body;

  const body = {
    webhookUrl: url
  };

  const params = {
    chave
  };

  try {
    const gerencianet = new Gerencianet(options);

    const create = await gerencianet.pixConfigWebhook(params, body);

    // const params1 = {
    //   inicio: '2022-12-20T00:01:35Z',
    //   fim: '2022-12-31T23:59:00Z',
    // };
    // const pixListWebhook = await gerencianet.pixListWebhook(params1);

    // const params2 = {
    //   chave: '02261dcb-ad4d-425f-9968-fe5b406f3030',
    // };
    // const pixDetailWebhook = await gerencianet.pixDetailWebhook(params2);

    return res.json(create);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Erro ao criar o webhook.',  message: error });
  }
};

export const deleteWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schema = Yup.object().shape({
    chave: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("Validation fails", 400);
  }

  const { chave } = req.body;

  const params = {
    chave
  };

  const gerencianet = new Gerencianet(options);

  const deleteWebhook = await gerencianet.pixDeleteWebhook(params);

  return res.json(deleteWebhook);
};

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  console.log("[WEBHOOK] Recebido:", JSON.stringify(req.body));
  console.log("[WEBHOOK] Headers:", JSON.stringify(req.headers));

  // Responda imediatamente com 200 para evitar retentativas da Efí
  // O processamento continuará em segundo plano
  const responsePromise = res.status(200).json({ ok: true });

  try {
    const { type } = req.params;
    const { evento } = req.body;

    if (evento === "teste_webhook") {
      console.log("[WEBHOOK] Teste recebido com sucesso");
      return responsePromise;
    }

    // Verificar se o corpo da requisição contém dados Pix
    if (!req.body.pix || !Array.isArray(req.body.pix) || req.body.pix.length === 0) {
      console.log("[WEBHOOK] Corpo da requisição não contém dados Pix válidos");
      return responsePromise;
    }

    const gerencianet = new Gerencianet(options);

    // Processar cada Pix recebido
    for (const pix of req.body.pix) {
      try {
        console.log(`[WEBHOOK] Processando PIX: ${JSON.stringify(pix)}`);
        
        if (!pix.txid) {
          console.log("[WEBHOOK] PIX sem txid, ignorando");
          continue;
        }

        console.log(`[WEBHOOK] Consultando detalhes do PIX txid: ${pix.txid}`);
        const detalhe = await gerencianet.pixDetailCharge({ txid: pix.txid });
        console.log(`[WEBHOOK] Detalhe recebido: ${JSON.stringify(detalhe)}`);
        
        if (!detalhe || !detalhe.status) {
          console.log("[WEBHOOK] Detalhes do PIX inválidos ou sem status");
          continue;
        }

        console.log(`[WEBHOOK] Status do pagamento: ${detalhe.status}`);

        // Processar apenas pagamentos concluídos
        if (detalhe.status === "CONCLUIDA") {
          const { solicitacaoPagador } = detalhe;
          console.log(`[WEBHOOK] solicitacaoPagador: ${solicitacaoPagador}`);

          // Verificar se o pagamento está relacionado a uma fatura
          if (!solicitacaoPagador || !solicitacaoPagador.includes("#Fatura:")) {
            console.log("[WEBHOOK] Formato de solicitacaoPagador inválido ou não relacionado a fatura");
            continue;
          }

          // Extrair o ID da fatura
          const invoiceIdStr = solicitacaoPagador.replace("#Fatura:", "");
          const invoiceID = parseInt(invoiceIdStr, 10);
          
          if (isNaN(invoiceID)) {
            console.log(`[WEBHOOK] ID da fatura inválido: ${invoiceIdStr}`);
            continue;
          }
          
          console.log(`[WEBHOOK] ID da fatura: ${invoiceID}`);

          // Buscar a fatura
          const invoice = await Invoices.findByPk(invoiceID);
          if (!invoice) {
            console.log(`[WEBHOOK] Fatura não encontrada: ${invoiceID}`);
            continue;
          }

          // Verificar se a fatura já está paga
          if (invoice.status === 'paid') {
            console.log(`[WEBHOOK] Fatura ${invoiceID} já está marcada como paga, ignorando`);
            continue;
          }

          const companyId = invoice.companyId;
          const company = await Company.findByPk(companyId, {
            include: [{ model: Plan, as: "plan" }]
          });
          
          if (!company) {
            console.log(`[WEBHOOK] Empresa não encontrada: ${companyId}`);
            continue;
          }

          console.log(`[WEBHOOK] Atualizando fatura ${invoiceID} para status 'paid'`);
          
          // Atualizar status da fatura para pago
          await invoice.update({ status: 'paid' });
          console.log(`[WEBHOOK] Fatura ${invoiceID} atualizada para 'paid'`);

          // Calcular nova data de vencimento com base na recorrência
          let monthsToAdd = 1; // Padrão: mensal
          
          // Mapear a recorrência para o número de meses
          switch (company.recurrence?.toUpperCase()) {
            case "MENSAL":
              monthsToAdd = 1;
              break;
            case "BIMESTRAL":
              monthsToAdd = 2;
              break;
            case "TRIMESTRAL":
              monthsToAdd = 3;
              break;
            case "SEMESTRAL":
              monthsToAdd = 6;
              break;
            case "ANUAL":
            case "YEARLY":
              monthsToAdd = 12;
              break;
            case "MONTHLY": // Compatibilidade com valores anteriores
              monthsToAdd = 1;
              break;
            default:
              console.log(`[WEBHOOK] Recorrência desconhecida: ${company.recurrence}, usando mensal (1 mês)`);
              monthsToAdd = 1;
          }
          
          console.log(`[WEBHOOK] Recorrência da empresa: ${company.recurrence}, adicionando ${monthsToAdd} meses`);
          
          // Aplicar o cálculo usando addMonths
          const newDueDate = addMonths(new Date(company.dueDate), monthsToAdd);
          const date = format(newDueDate, "yyyy-MM-dd");

          console.log(`[WEBHOOK] Atualizando data de vencimento da empresa ${companyId} de ${company.dueDate} para ${date}`);
          
          // Atualizar data de vencimento da empresa
          await company.update({ dueDate: date });
          await company.reload();
          console.log(`[WEBHOOK] Empresa ${companyId} vencimento atualizado para ${date}`);

          // Forçar geração da próxima fatura imediatamente após pagamento
          console.log(`[WEBHOOK] Gerando próxima fatura para empresa ${companyId}`);
          
          // Detalhes do plano para a próxima fatura
          const planDetails = company.plan || await Plan.findByPk(company.planId);
          
          if (!planDetails) {
            console.log(`[WEBHOOK] Plano não encontrado para empresa ${companyId}`);
            continue;
          }
          
          // Determinar o texto da recorrência para o detalhe da fatura
          let recorrenciaTexto = "mensalidade";
          if (monthsToAdd === 3) recorrenciaTexto = "trimestralidade";
          else if (monthsToAdd === 6) recorrenciaTexto = "semestralidade";
          else if (monthsToAdd === 12) recorrenciaTexto = "anuidade";
          else if (monthsToAdd === 2) recorrenciaTexto = "bimestralidade";
          
          const nextInvoice = await CreateInvoiceService({
            companyId: company.id,
            dueDate: date,
            detail: `Próxima ${recorrenciaTexto} do plano ${planDetails.name}`,
            status: "pending",
            value: parseFloat(planDetails.amount),
            users: planDetails.users,
            connections: planDetails.connections,
            queues: planDetails.queues,
            useWhatsapp: planDetails.useWhatsapp,
            useFacebook: planDetails.useFacebook,
            useInstagram: planDetails.useInstagram,
            useCampaigns: planDetails.useCampaigns,
            useSchedules: planDetails.useSchedules,
            useInternalChat: planDetails.useInternalChat,
            useExternalApi: planDetails.useExternalApi,
            linkInvoice: ""
          });
          
          if (nextInvoice) {
            console.log(`[WEBHOOK] Próxima fatura gerada: ${nextInvoice.id}`);
          } else {
            console.log(`[WEBHOOK] Erro ao gerar próxima fatura`);
          }

          // Notificar frontend via websocket
          const io = getIO();
          const companyUpdate = await Company.findOne({ where: { id: companyId } });
          
          console.log(`[WEBHOOK] Notificando frontend via websocket para company-${companyId}-payment`);
          io.of(String(companyId)).emit(`company-${companyId}-payment`, {
            action: detalhe.status,
            company: companyUpdate
          });
          
          console.log(`[WEBHOOK] Notificando frontend via websocket para company-${companyId}-invoices`);
          io.of(String(companyId)).emit(`company-${companyId}-invoices`, {
            action: 'update',
            invoice: invoice.id
          });
          
          console.log(`[WEBHOOK] Processamento completo para PIX ${pix.txid}`);
        } else {
          console.log(`[WEBHOOK] Status não é CONCLUIDA (${detalhe.status}), ignorando`);
        }
      } catch (error) {
        console.error(`[WEBHOOK] Erro ao processar PIX ${pix?.txid || 'desconhecido'}:`, error);
        // Continuar processando os outros PIX mesmo se um falhar
      }
    }
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar webhook PIX:", error);
  }

  return responsePromise;
};

// Nova função para configurar o webhook automaticamente
export const configureWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const gerencianet = new Gerencianet(options);
    const chave = process.env.GERENCIANET_CHAVEPIX;
    
    if (!chave) {
      throw new AppError("Chave PIX não configurada no ambiente", 400);
    }
    
    // URL base do backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    // Criar a URL do webhook
    const webhookUrl = `${backendUrl}/subscription/webhook`;
    
    console.log(`[CONFIG WEBHOOK] Iniciando configuração webhook na URL: ${webhookUrl}`);
    console.log(`[CONFIG WEBHOOK] Usando chave PIX: ${chave}`);
    
    const body = {
      webhookUrl
    };
    
    const params = {
      chave
    };
    
    // Listar webhooks existentes para verificar se já está configurado
    const params1 = {
      inicio: '2020-01-01T00:01:35Z',
      fim: '2030-12-31T23:59:00Z',
    };
    
    console.log(`[CONFIG WEBHOOK] Listando webhooks existentes...`);
    try {
      const listaWebhooks = await gerencianet.pixListWebhook(params1);
      console.log('[CONFIG WEBHOOK] Webhooks existentes:', JSON.stringify(listaWebhooks));
      
      // Verificar se já existe webhook para esta chave
      if (listaWebhooks && listaWebhooks.webhooks) {
        const webhookExistente = listaWebhooks.webhooks.find(webhook => webhook.chave === chave);
        if (webhookExistente) {
          console.log(`[CONFIG WEBHOOK] Webhook já existe para chave ${chave}: ${webhookExistente.webhookUrl}`);
        }
      }
    } catch (error) {
      console.log('[CONFIG WEBHOOK] Erro ao listar webhooks:', error.message);
    }
    
    // Tentar excluir o webhook existente para essa chave (se houver)
    console.log(`[CONFIG WEBHOOK] Tentando excluir webhook anterior para a chave ${chave}...`);
    try {
      const deleteResult = await gerencianet.pixDeleteWebhook(params);
      console.log('[CONFIG WEBHOOK] Webhook anterior excluído com sucesso:', JSON.stringify(deleteResult));
    } catch (error) {
      console.log('[CONFIG WEBHOOK] Não foi possível excluir webhook anterior:', error.message);
    }
    
    // Configurar o novo webhook
    console.log(`[CONFIG WEBHOOK] Configurando novo webhook: ${webhookUrl}`);
    const result = await gerencianet.pixConfigWebhook(params, body);
    console.log('[CONFIG WEBHOOK] Webhook configurado com sucesso:', JSON.stringify(result));
    
    // Verificar configuração
    try {
      const detail = await gerencianet.pixDetailWebhook(params);
      console.log('[CONFIG WEBHOOK] Detalhes do webhook configurado:', JSON.stringify(detail));
    } catch (error) {
      console.log('[CONFIG WEBHOOK] Erro ao obter detalhes do webhook:', error.message);
    }
    
    return res.json({
      success: true,
      message: 'Webhook configurado com sucesso',
      webhook: {
        chave,
        url: webhookUrl,
        result
      }
    });
  } catch (error) {
    console.error('[CONFIG WEBHOOK] Erro ao configurar webhook:', error);
    return res.status(error.statusCode || 500).json({
      error: true,
      message: error.message || 'Erro ao configurar webhook'
    });
  }
};
