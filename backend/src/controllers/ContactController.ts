import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";

import ListContactsService from "../services/ContactServices/ListContactsService";
import CreateContactService from "../services/ContactServices/CreateContactService";
import ShowContactService from "../services/ContactServices/ShowContactService";
import UpdateContactService from "../services/ContactServices/UpdateContactService";
import DeleteContactService from "../services/ContactServices/DeleteContactService";
import GetContactService from "../services/ContactServices/GetContactService";

import CheckContactNumber from "../services/WbotServices/CheckNumber";
import CheckIsValidContact from "../services/WbotServices/CheckIsValidContact";
import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";
import AppError from "../errors/AppError";
import SimpleListService, {
  SearchContactParams
} from "../services/ContactServices/SimpleListService";
import ContactCustomField from "../models/ContactCustomField";
import ToggleAcceptAudioContactService from "../services/ContactServices/ToggleAcceptAudioContactService";
import BlockUnblockContactService from "../services/ContactServices/BlockUnblockContactService";
import { ImportContactsService } from "../services/ContactServices/ImportContactsService";
import NumberSimpleListService from "../services/ContactServices/NumberSimpleListService";
import CreateOrUpdateContactServiceForImport from "../services/ContactServices/CreateOrUpdateContactServiceForImport";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService";
import Contact from "../models/Contact";
import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import { getWbot } from "../libs/wbot";
import UpdateContactWalletsService from "../services/ContactServices/UpdateContactWalletsService";

import FindContactTags from "../services/ContactServices/FindContactTags";
import { log } from "console";
import ToggleDisableBotContactService from "../services/ContactServices/ToggleDisableBotContactService";
import Tag from "../models/Tag";
import ContactTag from "../models/ContactTag";
import logger from "../utils/logger";
import Ticket from "../models/Ticket";
import { Op } from "sequelize";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  contactTag: string;
  isGroup?: string;
};

type IndexGetContactQuery = {
  name: string;
  number: string;
};

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}
interface ContactData {
  name: string;
  number: string;
  email?: string;
  extraInfo?: ExtraInfo[];
  disableBot?: boolean;
  remoteJid?: string;
  wallets?: null | number[] | string[];
}



export const importXls = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { number, name, email, validateContact, tags } = req.body;
  const simpleNumber = String(number).replace(/[^\d.-]+/g, '');
  let validNumber = simpleNumber;


  if (validateContact === "true") {
    validNumber = await CheckContactNumber(simpleNumber, companyId);
  }
  /**
   * Código desabilitado por demora no retorno
   */
  // 
  // const profilePicUrl = await GetProfilePicUrl(validNumber, companyId);
  // const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const contactData = {
    name: `${name}`,
    number: validNumber,
    profilePicUrl: "",
    isGroup: false,
    email,
    companyId,
    // whatsappId: defaultWhatsapp.id
  };

  const contact = await CreateOrUpdateContactServiceForImport(contactData);

  if (tags) {
    const tagList = tags.split(',').map(tag => tag.trim());

    for (const tagName of tagList) {
      try {
        let [tag, created] = await Tag.findOrCreate({
          where: { name: tagName, companyId, color: "#A4CCCC", kanban: 0 }

        });


        // Associate the tag with the contact
        await ContactTag.findOrCreate({
          where: {
            contactId: contact.id,
            tagId: tag.id
          }
        });
      } catch (error) {
        logger.info("Erro ao criar Tags", error)
      }
    }
  }
  const io = getIO();



  io.of(String(companyId))
    .emit(`company-${companyId}-contact`, {
      action: "create",
      contact
    });

  return res.status(200).json(contact);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, contactTag: tagIdsStringified, isGroup } = req.query as IndexQuery;
  const { id: userId, companyId } = req.user;

  let tagsIds: number[] = [];

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  const { contacts, count, hasMore } = await ListContactsService({
    searchParam,
    pageNumber,
    companyId,
    tagsIds,
    isGroup,
    userId: Number(userId)
  });

  return res.json({ contacts, count, hasMore });
};

export const getContact = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, number } = req.body as IndexGetContactQuery;
  const { companyId } = req.user;

  const contact = await GetContactService({
    name,
    number,
    companyId
  });

  return res.status(200).json(contact);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const newContact: ContactData = req.body;
  const newRemoteJid = newContact.number;

  const findContact = await Contact.findOne({
    where: {
      number: newContact.number.replace("-", "").replace(" ", ""),
      companyId
    }
  })
  if (findContact) {
    throw new AppError("O contato informado já existe!");
  }

  newContact.number = newContact.number.replace("-", "").replace(" ", "");


  const schema = Yup.object().shape({
    name: Yup.string().required(),
    number: Yup.string()
      .required()
      // ✅ Alinhar com Ticketz: permitir sufixo opcional @lid
      .matches(/^\d+(@lid)?$/, "Formato de número inválido. Use apenas dígitos ou sufixo @lid.")
  });

  try {
    await schema.validate(newContact);
  } catch (err: any) {
    throw new AppError(err.message);
  }


  const validNumber = await CheckContactNumber(newContact.number, companyId);

  /**
   * Código desabilitado por demora no retorno
   */
  // const profilePicUrl = await GetProfilePicUrl(validNumber.jid, companyId);

  const contact = await CreateContactService({
    ...newContact,
    number: validNumber,
    // profilePicUrl,
    companyId
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-contact`, {
      action: "create",
      contact
    });

  return res.status(200).json(contact);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const contact = await ShowContactService(contactId, companyId);

  return res.status(200).json(contact);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const contactData: ContactData = req.body;
  const { companyId } = req.user;
  const { contactId } = req.params;

  const schema = Yup.object().shape({
    name: Yup.string(),
    number: Yup.string().matches(
      /^\d+(@lid)?$/,
      "Formato de número inválido. Use apenas dígitos ou sufixo @lid."
    )
  });

  try {
    await schema.validate(contactData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const oldContact = await ShowContactService(contactId, companyId);

  if (oldContact.number != contactData.number && oldContact.channel == "whatsapp") {
    const isGroup = oldContact && oldContact.remoteJid ? oldContact.remoteJid.endsWith("@g.us") : oldContact.isGroup;
    const validNumber = await CheckContactNumber(contactData.number, companyId, isGroup);
    const number = validNumber;
    contactData.number = number;
  }

  const contact = await UpdateContactService({
    contactData,
    contactId,
    companyId
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });

  return res.status(200).json(contact);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  await ShowContactService(contactId, companyId);

  await DeleteContactService(contactId);

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-contact`, {
      action: "delete",
      contactId
    });

  return res.status(200).json({ message: "Contact deleted" });
};

export const bulkDelete = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactIds } = req.body;
  const { companyId } = req.user;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    throw new AppError("Lista de contatos é obrigatória");
  }

  // Importar o helper para verificar tickets abertos
  const CheckContactOpenTickets = (await import("../helpers/CheckContactOpenTickets")).default;
  
  const results = {
    deleted: [],
    skipped: [],
    errors: []
  };

  for (const contactId of contactIds) {
    try {
      // Verificar se o contato existe e pertence à empresa
      const contact = await ShowContactService(contactId, companyId);
      
      // Verificar se o contato tem tickets abertos
      try {
        await CheckContactOpenTickets(contactId, contact.whatsappId, companyId);
      } catch (error) {
        if (error.message === "ERR_OTHER_OPEN_TICKET") {
          results.skipped.push({
            contactId,
            name: contact.name,
            reason: "Contato possui tickets abertos"
          });
          continue;
        }
        throw error;
      }

      // Deletar o contato
      await DeleteContactService(contactId);
      results.deleted.push({
        contactId,
        name: contact.name
      });

      // Emitir evento de socket
      const io = getIO();
      io.of(String(companyId))
        .emit(`company-${companyId}-contact`, {
          action: "delete",
          contactId
        });

    } catch (error) {
      results.errors.push({
        contactId,
        reason: error.message
      });
    }
  }

  return res.status(200).json({
    message: "Exclusão em massa processada",
    results
  });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { name } = req.query as unknown as SearchContactParams;
  const { companyId } = req.user;

  const contacts = await SimpleListService({ name, companyId });

  return res.json(contacts);
};

export const toggleAcceptAudio = async (
  req: Request,
  res: Response
): Promise<Response> => {
  var { contactId } = req.params;
  const { companyId } = req.user;
  const contact = await ToggleAcceptAudioContactService({ contactId });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });

  return res.status(200).json(contact);
};

export const blockUnblock = async (
  req: Request,
  res: Response
): Promise<Response> => {
  var { contactId } = req.params;
  const { companyId } = req.user;
  const { active } = req.body;

  const contact = await BlockUnblockContactService({ contactId, companyId, active });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });

  return res.status(200).json(contact);
};

export const upload = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const file: Express.Multer.File = head(files) as Express.Multer.File;
  const { companyId } = req.user;

  const response = await ImportContactsService(companyId, file);

  const io = getIO();

  io.of(String(companyId))
    .emit(`company-${companyId}-contact`, {
      action: "reload",
      records: response
    });

  return res.status(200).json(response);
};

export const getContactProfileURL = async (req: Request, res: Response) => {
  const { number } = req.params
  const { companyId } = req.user;

  try {
    if (!number) {
      return res.status(400).json({ error: "Número não fornecido" });
    }

    // Validar se o número tem formato válido (mínimo 10 dígitos, máximo 15)
    const cleanNumber = number.replace(/\D/g, "");
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      return res.status(400).json({ error: "Número com formato inválido" });
    }

    // Validar número específico problemático
    if (number === "253725780217903") {
      return res.status(400).json({ error: "Número inválido ou corrompido" });
    }

    const validNumber = await CheckContactNumber(number, companyId);
    const profilePicUrl = await GetProfilePicUrl(validNumber, companyId);
    const contact = await NumberSimpleListService({ number: validNumber, companyId: companyId })

    let obj: any;
    if (contact.length > 0) {
      obj = {
        contactId: contact[0].id,
        profilePicUrl: profilePicUrl
      }
    } else {
      obj = {
        contactId: 0,
        profilePicUrl: profilePicUrl
      }
    }
    return res.status(200).json(obj);
  } catch (error) {
    console.error('Erro ao buscar perfil do contato:', error);
    return res.status(400).json({ error: "Erro ao validar número do contato" });
  }
};

export const diagnoseContactImage = async (req: Request, res: Response) => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  try {
    const contact = await Contact.findOne({
      where: { id: contactId, companyId }
    });

    if (!contact) {
      return res.status(404).json({ error: "Contato não encontrado" });
    }

    const diagnosis = {
      contactId: contact.id,
      name: contact.name,
      number: contact.number,
      remoteJid: contact.remoteJid,
      profilePicUrl: contact.profilePicUrl,
      urlPicture: contact.urlPicture,
      pictureUpdated: contact.pictureUpdated,
      isGroup: contact.isGroup,
      hasProfilePicUrl: !!contact.profilePicUrl && contact.profilePicUrl !== `${process.env.FRONTEND_URL}/nopicture.png`,
      hasLocalImage: !!contact.urlPicture && contact.urlPicture !== "",
      issues: []
    };

    // Verificar problemas comuns
    if (!contact.remoteJid) {
      diagnosis.issues.push("RemoteJid não definido");
    }

    if (contact.number === "253725780217903") {
      diagnosis.issues.push("Número corrompido conhecido");
    }

    if (contact.number.length > 15 || contact.number.length < 10) {
      diagnosis.issues.push(`Número com tamanho inválido: ${contact.number.length} dígitos`);
    }

    if (!contact.profilePicUrl) {
      diagnosis.issues.push("ProfilePicUrl vazio");
    }

    return res.status(200).json(diagnosis);

  } catch (error) {
    console.error('Erro ao diagnosticar imagem do contato:', error);
    return res.status(500).json({ 
      error: "Erro ao diagnosticar contato" 
    });
  }
};

export const getContactVcard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, number } = req.query as IndexGetContactQuery;
  const { companyId } = req.user;

  let vNumber = number;
  const numberDDI = vNumber.toString().substr(0, 2);
  const numberDDD = vNumber.toString().substr(2, 2);
  const numberUser = vNumber.toString().substr(-8, 8);

  if (numberDDD <= '30' && numberDDI === '55') {
    
    vNumber = `${numberDDI + numberDDD + 9 + numberUser}@s.whatsapp.net`;
  } else if (numberDDD > '30' && numberDDI === '55') {
    
    vNumber = `${numberDDI + numberDDD + numberUser}@s.whatsapp.net`;
  } else {
    vNumber = `${number}@s.whatsapp.net`;
  }


  const contact = await GetContactService({
    name,
    number,
    companyId
  });

  return res.status(200).json(contact);
};

export const getContactTags = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;

  const contactTags = await FindContactTags({ contactId });

  let tags = false;

  if (contactTags.length > 0) {
    tags = true;
  }

  return res.status(200).json({ tags: tags });

}

export const toggleDisableBot = async (req: Request, res: Response): Promise<Response> => {
  var { contactId } = req.params;
  const { companyId } = req.user;
  const contact = await ToggleDisableBotContactService({ contactId });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });

  return res.status(200).json(contact);
};

export const updateContactWallet = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { wallets } = req.body;
  const { contactId } = req.params;
  const { companyId } = req.user;

  const contact = await UpdateContactWalletsService({
    wallets,
    contactId,
    companyId
  });

  return res.status(200).json(contact);
};

export const listWhatsapp = async (req: Request, res: Response): Promise<Response> => {

  const { name } = req.query as unknown as SearchContactParams;
  const { companyId } = req.user;

  const contactsAll = await SimpleListService({ name, companyId });

  const contacts = contactsAll.filter(contact => contact.channel == "whatsapp");

  return res.json(contacts);
};

export const CheckContactQueueService = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const ticket = await Ticket.findOne({
    where: { contactId, companyId, status: "open" },
    include: ["user"]
  });

  if (ticket) {
    if (ticket.userId === companyId) {
      return res.json("inQueue");
    } else {
      return res.json(`beingAttendedBy:${ticket.user.name}`);
    }
  }

  return res.json("available");
};

export const refreshContactImage = async (req: Request, res: Response) => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  try {
    // Buscar o contato
    const contact = await Contact.findOne({
      where: { id: contactId, companyId }
    });

    if (!contact) {
      return res.status(404).json({ error: "Contato não encontrado" });
    }

    // Tentar obter nova imagem via WhatsApp seguindo documentação Baileys
    let newProfilePicUrl = "";
    let hasRealImage = false;
    
    try {
      const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
      const wbot = getWbot(defaultWhatsapp.id);
      
      // Determinar JID correto baseado no contact
      let targetJid = contact.remoteJid;
      if (!targetJid) {
        targetJid = contact.isGroup ? `${contact.number}@g.us` : `${contact.number}@s.whatsapp.net`;
      }
      
      // Primeiro verificar se o contato existe no WhatsApp
      if (!contact.isGroup) {
        const [result] = await wbot.onWhatsApp(targetJid);
        if (!result?.exists) {
          return res.status(400).json({ 
            error: "Contato não existe no WhatsApp",
            success: false 
          });
        }
        targetJid = result.jid; // Usar JID canônico
      }
      
      // Tentar obter imagem em alta resolução primeiro, depois baixa
      try {
        newProfilePicUrl = await wbot.profilePictureUrl(targetJid, "image");
        hasRealImage = true;
      } catch (hdError) {
        try {
          newProfilePicUrl = await wbot.profilePictureUrl(targetJid);
          hasRealImage = true;
        } catch (lowError) {
          newProfilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
          hasRealImage = false;
        }
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao obter imagem de perfil:', error);
      newProfilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
      hasRealImage = false;
    }

    // Se não há imagem real disponível, retornar informação
    if (!hasRealImage) {
      return res.status(200).json({ 
        success: false, 
        message: "Nenhuma imagem de perfil disponível para este contato",
        hasImage: false,
        profilePicUrl: newProfilePicUrl
      });
    }

    // Atualizar o contato diretamente no banco e forçar download
    await contact.update({
      profilePicUrl: newProfilePicUrl,
      pictureUpdated: false // Força re-download
    });

    // Obter wbot para passar para o serviço
    const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
    const wbot = getWbot(defaultWhatsapp.id);

    // Usar CreateOrUpdateContactService para download da imagem
    const updatedContact = await CreateOrUpdateContactService({
      name: contact.name,
      number: contact.number,
      email: contact.email || "",
      profilePicUrl: newProfilePicUrl,
      isGroup: contact.isGroup,
      companyId: contact.companyId,
      remoteJid: contact.remoteJid,
      whatsappId: contact.whatsappId,
      wbot: wbot, // Passa o objeto wbot correto
      channel: contact.channel || 'whatsapp'
    });

    return res.status(200).json({ 
      success: true, 
      message: "Imagem atualizada com sucesso",
      hasImage: true,
      contact: updatedContact 
    });

  } catch (error) {
    console.error('Erro ao atualizar imagem do contato:', error);
    return res.status(500).json({ 
      error: "Erro interno do servidor ao atualizar imagem" 
    });
  }
};

export const investigateCorruptedNumbers = async (req: Request, res: Response) => {
  const { companyId } = req.user;

  try {
    // Buscar contatos suspeitos
    const suspiciousContacts = await Contact.findAll({
      where: {
        companyId,
        [Op.or]: [
          // Números muito longos
          { number: { [Op.like]: '%253725780217903%' } },
          // Números que não seguem padrão brasileiro ou internacional comum
          { number: { [Op.not]: { [Op.regexp]: '^(55)?[1-9][0-9]{8,10}$' } } },
        ]
      },
      limit: 50
    });

    const results = suspiciousContacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      number: contact.number,
      remoteJid: contact.remoteJid,
      profilePicUrl: contact.profilePicUrl,
      urlPicture: contact.urlPicture,
      createdAt: contact.createdAt
    }));

    return res.status(200).json({
      found: results.length,
      contacts: results,
      message: `Encontrados ${results.length} contatos suspeitos`
    });

  } catch (error) {
    console.error('Erro ao investigar números corrompidos:', error);
    return res.status(500).json({ 
      error: "Erro ao investigar números corrompidos" 
    });
  }
};