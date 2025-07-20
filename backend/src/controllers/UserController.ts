import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { isEmpty, isNil } from "lodash";
import CheckSettingsHelper from "../helpers/CheckSettings";
import AppError from "../errors/AppError";

import CreateUserService from "../services/UserServices/CreateUserService";
import ListUsersService from "../services/UserServices/ListUsersService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import ShowUserService from "../services/UserServices/ShowUserService";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import SimpleListService from "../services/UserServices/SimpleListService";
import CreateCompanyService from "../services/CompanyService/CreateCompanyService";
import { SendMail } from "../helpers/SendMail";
import { useDate } from "../utils/useDate";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import { getWbot } from "../libs/wbot";
import FindCompaniesWhatsappService from "../services/CompanyService/FindCompaniesWhatsappService";
import User from "../models/User";
import Company from "../models/Company";

import { head } from "lodash";
import ToggleChangeWidthService from "../services/UserServices/ToggleChangeWidthService";
import APIShowEmailUserService from "../services/UserServices/APIShowEmailUserService";
import UpdateSelectedQueuesService from "../services/UserServices/UpdateSelectedQueuesService";
import UpdateKanbanFiltersService from "../services/UserServices/UpdateKanbanFiltersService";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";


type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};


export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;

  const { users, count, hasMore } = await ListUsersService({
    searchParam,
    pageNumber,
    companyId,
    profile
  });

  return res.json({ users, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    email,
    password,
    name,
    profile,
    companyId: bodyCompanyId,
    queueIds,
    startWork,
    endWork,
    whatsappId,
    allTicket,
    defaultTheme,
    defaultMenu,
    allowGroup,
    allHistoric,
    allUserChat,
    userClosePendingTicket,
    showDashboard,
    defaultTicketsManagerWidth,
    allowRealTime,
    allowConnections,
    companyName,
    planId,
    phone,
    document
  } = req.body;

  let userCompanyId: number | null = null;

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
  }

  if (
    req.url === "/signup" &&
    (await CheckSettingsHelper("userCreation")) === "disabled"
  ) {
    throw new AppError("ERR_USER_CREATION_DISABLED", 403);
  } else if (req.url !== "/signup" && req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (process.env.DEMO === "ON") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const companyUser = bodyCompanyId || userCompanyId;

  if (!companyUser) {
    const dataNowMoreTwoDays = new Date();
    dataNowMoreTwoDays.setDate(dataNowMoreTwoDays.getDate() + 3);

    const date = dataNowMoreTwoDays.toISOString().split("T")[0];

    const companyData = {
      name: companyName,
      email: email,
      phone: phone,
      planId: planId,
      status: true,
      dueDate: date,
      recurrence: "",
      document: document,
      paymentMethod: "",
      password: password,
      companyUserName: name,
      startWork: "00:01",
      endWork: "23:59",
      defaultTheme: 'light',
      defaultMenu: 'closed',
      allowGroup: false,
      allHistoric: false,
      userClosePendingTicket: false,
      showDashboard: false,
      defaultTicketsManagerWidth: '550',
      allowRealTime: false,
      allowConnections: false
    };

    try {
      // Verificar se já existe empresa com o mesmo nome
      const existingCompanyByName = await Company.findOne({
        where: { name: companyName }
      });

      if (existingCompanyByName) {
        throw new AppError("Já existe uma empresa cadastrada com este nome. Por favor, escolha outro nome.", 400);
      }

      // Verificar se já existe empresa com o mesmo documento
      const existingCompanyByDocument = await Company.findOne({
        where: { document: document }
      });

      if (existingCompanyByDocument) {
        throw new AppError("Já existe uma empresa cadastrada com este CPF/CNPJ.", 400);
      }

      // Verificar se já existe empresa com o mesmo email
      const existingCompanyByEmail = await Company.findOne({
        where: { email: email }
      });

      if (existingCompanyByEmail) {
        throw new AppError("Já existe uma empresa cadastrada com este email.", 400);
      }

      // Verificar se já existe usuário com o mesmo email
      const existingUser = await User.findOne({
        where: { email: email }
      });

      if (existingUser) {
        throw new AppError("Já existe um usuário cadastrado com este email.", 400);
      }

      const user = await CreateCompanyService(companyData);

      // Envio de email com tratamento de erro robusto
      try {
        if (process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS) {
          const { dateToClient } = useDate();
          const _email = {
            to: email,
            subject: `Login e senha do Whatize para empresa ${companyName}`,
            text: `Olá ${name}, obrigado por iniciar o seu período de teste no Whatize! Estou te enviando este email para confirmar o cadastro da empresa ${companyName}!<br><br>
            Também vou lhe passar os dados de login para caso você esqueça:<br><br>Nome: ${companyName}<br>Email: ${email}<br>Senha: ${password}<br>Data de vencimento do teste: ${dateToClient(date)}<br>Página de login: https://whatize.pro/login`
          }

          // Timeout de 10 segundos para envio de email
          const emailPromise = SendMail(_email);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email timeout')), 10000)
          );
          
          await Promise.race([emailPromise, timeoutPromise]);
        }
      } catch (error) {
        // Email não é crítico para o cadastro
        console.log('Aviso: Erro ao enviar email de confirmação:', error.message);
      }

      // Envio de WhatsApp com tratamento de erro robusto
      try {
        console.log('Iniciando tentativa de envio de WhatsApp...');
        
        const whatsappPromise = (async () => {
          try {
            // Verificar se existe empresa ID 1
            const company = await ShowCompanyService(1);
            if (!company) {
              console.log('Empresa ID 1 não encontrada');
              return false;
            }
            console.log('Empresa ID 1 encontrada:', company.name);

            // Buscar conexões WhatsApp da empresa
            const whatsappCompany = await FindCompaniesWhatsappService(company.id);
            if (!whatsappCompany) {
              console.log('Nenhuma empresa com WhatsApp encontrada para ID 1');
              return false;
            }
            console.log('Empresa com WhatsApp encontrada');

            // Verificar se há conexões WhatsApp
            if (!whatsappCompany.whatsapps || whatsappCompany.whatsapps.length === 0) {
              console.log('Nenhuma conexão WhatsApp encontrada para a empresa ID 1');
              return false;
            }
            console.log(`${whatsappCompany.whatsapps.length} conexão(ões) WhatsApp encontrada(s)`);

            // Verificar se a primeira conexão está conectada
            const firstWhatsapp = whatsappCompany.whatsapps[0];
            if (firstWhatsapp.status !== "CONNECTED") {
              console.log(`Conexão WhatsApp não está conectada. Status: ${firstWhatsapp.status}`);
              return false;
            }
            console.log('Conexão WhatsApp está conectada');

            // Verificar se o telefone é válido
            if (!phone || isNil(phone) || isEmpty(phone)) {
              console.log('Telefone não fornecido ou inválido');
              return false;
            }
            console.log('Telefone válido fornecido:', phone);

            const whatsappId = firstWhatsapp.id;
            const wbot = getWbot(whatsappId);
            
            if (!wbot) {
              console.log('Bot WhatsApp não encontrado');
              return false;
            }
            console.log('Bot WhatsApp obtido com sucesso');

            // Formatar telefone para WhatsApp (garantir que tenha 55 no início)
            let formattedPhone = phone.replace(/\D/g, ''); // Remove tudo que não é número
            
            console.log('Telefone original:', phone);
            console.log('Telefone apenas números:', formattedPhone);
            
            // Verificar se o telefone tem 10 dígitos (sem o 9 do celular) e adicionar o 9
            if (formattedPhone.length === 10) {
              // Telefone com 10 dígitos (DDD + 8 dígitos), adicionar o 9
              const ddd = formattedPhone.substring(0, 2);
              const numero = formattedPhone.substring(2);
              formattedPhone = ddd + '9' + numero;
              console.log('Adicionado 9 do celular:', formattedPhone);
            }
            
            // Se não começar com 55, adiciona
            if (!formattedPhone.startsWith('55')) {
              formattedPhone = '55' + formattedPhone;
            }
            
            console.log('Telefone final formatado:', formattedPhone);

            const body = `Olá ${name}, \n\nQue bom ter você com a gente! 🎉\n\nVocê acaba de iniciar seu *período de teste no Whatize*, a plataforma que vai transformar seu atendimento e impulsionar seus resultados com chatbots inteligentes, CRM e automações poderosas.\n\nPara te ajudar a aproveitar ao máximo todos os recursos, que tal uma rápida apresentação com um de nossos especialistas? 🚀 \n\nÉ só digitar *Quero*! 😊`;

            const messageTarget = `${formattedPhone}@s.whatsapp.net`;
            console.log('Enviando mensagem para:', messageTarget);
            
            await wbot.sendMessage(messageTarget, { text: body });
            console.log('Mensagem WhatsApp enviada com sucesso!');
            return true;
            
          } catch (innerError) {
            console.log('Erro interno no envio do WhatsApp:', innerError.message);
            return false;
          }
        })();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('WhatsApp timeout')), 10000)
        );
        
        const result = await Promise.race([whatsappPromise, timeoutPromise]);
        if (result) {
          console.log('WhatsApp enviado com sucesso para o novo usuário');
        } else {
          console.log('WhatsApp não foi enviado (condições não atendidas)');
        }
        
      } catch (error) {
        // WhatsApp não é crítico para o cadastro
        console.log('Aviso: Erro ao enviar WhatsApp de boas-vindas:', error.message);
      }

      return res.status(200).json(user);
    } catch (error) {
      // Se for um erro conhecido (AppError), retorna a mensagem personalizada
      if (error instanceof AppError) {
        throw error;
      }
      
      // Se for erro de constraint única do Sequelize
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        switch (field) {
          case 'name':
            throw new AppError("Já existe uma empresa cadastrada com este nome. Por favor, escolha outro nome.", 400);
          case 'email':
            throw new AppError("Já existe uma empresa cadastrada com este email.", 400);
          case 'document':
            throw new AppError("Já existe uma empresa cadastrada com este CPF/CNPJ.", 400);
          default:
            throw new AppError("Dados já cadastrados no sistema. Verifique as informações e tente novamente.", 400);
        }
      }
      
      // Para outros erros, retorna mensagem genérica
      console.error('Erro no cadastro:', error);
      throw new AppError("Erro interno do servidor. Tente novamente em alguns instantes.", 500);
    }
  }

  if (companyUser) {
    const user = await CreateUserService({
      email,
      password,
      name,
      profile,
      companyId: companyUser,
      queueIds,
      startWork,
      endWork,
      whatsappId,
      allTicket,
      defaultTheme,
      defaultMenu,
      allowGroup,
      allHistoric,
      allUserChat,
      userClosePendingTicket,
      showDashboard,
      defaultTicketsManagerWidth,
      allowRealTime,
      allowConnections
    });

    const io = getIO();
    io.of(userCompanyId.toString())
      .emit(`company-${userCompanyId}-user`, {
        action: "create",
        user
      });

    return res.status(200).json(user);
  }
};

// export const store = async (req: Request, res: Response): Promise<Response> => {
//   const {
//     email,
//     password,
//     name,
//     profile,
//     companyId: bodyCompanyId,
//     queueIds
//   } = req.body;
//   let userCompanyId: number | null = null;

//   if (req.user !== undefined) {
//     const { companyId: cId } = req.user;
//     userCompanyId = cId;
//   }

//   if (
//     req.url === "/signup" &&
//     (await CheckSettingsHelper("userCreation")) === "disabled"
//   ) {
//     throw new AppError("ERR_USER_CREATION_DISABLED", 403);
//   } else if (req.url !== "/signup" && req.user.profile !== "admin") {
//     throw new AppError("ERR_NO_PERMISSION", 403);
//   }

//   const user = await CreateUserService({
//     email,
//     password,
//     name,
//     profile,
//     companyId: bodyCompanyId || userCompanyId,
//     queueIds
//   });

//   const io = getIO();
//   io.of(String(companyId))
//  .emit(`company-${userCompanyId}-user`, {
//     action: "create",
//     user
//   });

//   return res.status(200).json(user);
// };

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;

  const user = await ShowUserService(userId, companyId);

  return res.status(200).json(user);
};

export const showEmail = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.params;

  const user = await APIShowEmailUserService(email);

  return res.status(200).json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {

  // if (req.user.profile !== "admin") {
  //   throw new AppError("ERR_NO_PERMISSION", 403);
  // }

  if (process.env.DEMO === "ON") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { id: requestUserId, companyId } = req.user;
  const { userId } = req.params;
  const userData = req.body;

  const user = await UpdateUserService({
    userData,
    userId,
    companyId,
    requestUserId: +requestUserId
  });


  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-user`, {
      action: "update",
      user
    });

  return res.status(200).json(user);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { companyId, id, profile } = req.user;

  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (process.env.DEMO === "ON") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const user = await User.findOne({
    where: { id: userId }
  });

  if (companyId !== user.companyId) {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  } else {
    await DeleteUserService(userId, companyId);

    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-user`, {
        action: "delete",
        userId
      });

    return res.status(200).json({ message: "User deleted" });
  }

};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
  const { companyId: userCompanyId } = req.user;

  const users = await SimpleListService({
    companyId: companyId ? +companyId : userCompanyId
  });

  return res.status(200).json(users);
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  try {
    let user = await User.findByPk(userId);
    user.profileImage = file.filename.replace('/', '-');

    await user.save();

    user = await ShowUserService(userId, companyId);
    
    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-user`, {
        action: "update",
        user
      });


    return res.status(200).json({ user, message: "Imagem atualizada" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const toggleChangeWidht = async (req: Request, res: Response): Promise<Response> => {
  var { userId } = req.params;
  const { defaultTicketsManagerWidth } = req.body;

  const { companyId } = req.user;
  const user = await ToggleChangeWidthService({ userId, defaultTicketsManagerWidth });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-user`, {
      action: "update",
      user
    });

  return res.status(200).json(user);
};

export const recoverPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("ERR_EMAIL_REQUIRED", 400);
  }

  const user = await User.findOne({
    where: { email }
  });

  if (!user) {
    return res.status(200).json({ message: "Se o email existir, você receberá as instruções de recuperação" });
  }

  // Gerar token único e definir expiração (24 horas)
  const resetToken = uuidv4();
  const resetExpires = new Date();
  resetExpires.setHours(resetExpires.getHours() + 24);

  
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetExpires;
  await user.save();


  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const _email = {
    to: email,
    subject: "Recuperação de Senha",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fb;">
        <div style="width: 100%; max-width: 100%; margin: 0 auto; background-color: #f5f7fb; padding: 20px 0;">
          <!-- Container Principal -->
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); padding: 32px 24px; border: 1px solid rgba(0, 47, 108, 0.06);">
            
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="${process.env.FRONTEND_URL}/logo.png" alt="Logo" style="max-width: 140px; height: auto;">
            </div>

            <!-- Ícone e Título -->
            <div style="text-align: center; margin-bottom: 28px;">
             
              
              <h1 style="color: #1a2942; font-size: 22px; font-weight: 600; margin: 0; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Recuperação de Senha
              </h1>
            </div>

            <!-- Mensagem -->
            <div style="text-align: center; margin-bottom: 28px;">
              <p style="color: #4a5567; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Olá <strong style="color: #1a2942;">${user.name}</strong>,<br>
                Recebemos uma solicitação para redefinir sua senha.
              </p>
            </div>

            <!-- Botão -->
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #0046a5 0%, #0055c8 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; letter-spacing: 0.3px; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; transition: all 0.2s ease;">
                Redefinir Senha
              </a>
            </div>

            <!-- Link Alternativo -->
            <div style="text-align: center; background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #4a5567; font-size: 13px; margin: 0 0 8px 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
              </p>
              <a href="${resetLink}" 
                 style="color: #0055c8; font-size: 12px; word-break: break-all; text-decoration: none; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${resetLink}
              </a>
            </div>

            <!-- Tempo de Expiração -->
            <div style="text-align: center; background-color: #f0f7ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
              <p style="color: #4a5567; font-size: 13px; margin: 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Este link é válido por <strong style="color: #1a2942;">24 horas</strong>
              </p>
            </div>

            <!-- Aviso de Segurança -->
            <div style="background-color: #fff8f0; border-left: 3px solid #ffb74d; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="color: #b45309; font-size: 13px; margin: 0; line-height: 1.5; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Se você não solicitou esta alteração, ignore este email ou entre em contato com nosso suporte.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 28px; padding-top: 24px; border-top: 1px solid #edf2f7;">
              <p style="color: #4a5567; font-size: 13px; margin: 0 0 16px 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Precisa de ajuda? <a href="https://wa.me/5561982213735" style="color: #0055c8; text-decoration: none;">Entre em contato</a>
              </p>

              <!-- Copyright -->
              <p style="color: #8795a7; font-size: 12px; margin: 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                © ${new Date().getFullYear()} Ojos Chat. Todos os direitos reservados.
              </p>
            </div>

          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await SendMail(_email);
    return res.status(200).json({ 
      message: "Se o email existir, você receberá as instruções de recuperação" 
    });
  } catch (err) {
    console.error("Error sending email:", err); // Log para verificar o erro
    throw new AppError("ERR_SENDING_EMAIL", 500);
  }
};

// Novo endpoint para realizar o reset da senha
export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    throw new AppError("ERR_MISSING_RESET_INFO", 400);
  }

  if (password !== confirmPassword) {
    throw new AppError("ERR_PASSWORDS_DO_NOT_MATCH", 400);
  }

  const user = await User.findOne({
    where: { 
      resetPasswordToken: token,
      resetPasswordExpires: {
        [Op.gt]: new Date() // Verifica se o token ainda não expirou
      }
    }
  });

  if (!user) {
    throw new AppError("ERR_INVALID_RESET_TOKEN", 400);
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return res.status(200).json({ message: "Senha atualizada com sucesso" });
};

export const updateSelectedQueues = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { selectedQueueIds } = req.body;
  const { companyId } = req.user;

  const user = await UpdateSelectedQueuesService({
    userId,
    selectedQueueIds,
    companyId
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-user`, {
      action: "update",
      user
    });

  return res.status(200).json(user);
};

export const updateKanbanFilters = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { kanbanSelectedFunnel, kanbanSelectedTags, kanbanSelectedUsers, kanbanCollapsedColumns, kanbanColumnOrder } = req.body;
  const { companyId } = req.user;

  const user = await UpdateKanbanFiltersService({
    userId,
    kanbanSelectedFunnel,
    kanbanSelectedTags,
    kanbanSelectedUsers,
    kanbanCollapsedColumns,
    kanbanColumnOrder,
    companyId
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-user`, {
      action: "update",
      user
    });

  return res.status(200).json(user);
};