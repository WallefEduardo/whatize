import { Mutex } from "async-mutex";
import { Op } from "sequelize";
import { WASocket } from "baileys";
import Contact from "../../models/Contact";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import GetProfilePicUrl from "./GetProfilePicUrl";
import logger from "../../utils/logger";

const lidUpdateMutex = new Mutex();

interface IMe {
  name: string;
  id: string;
}

export async function checkAndDedup(
  contact: Contact,
  lid: string,
  companyId: number
): Promise<void> {
  const lidContact = await Contact.findOne({
    where: {
      companyId,
      number: {
        [Op.or]: [lid, lid.substring(0, lid.indexOf("@"))]
      }
    }
  });

  if (!lidContact) {
    return;
  }

  // 1. Move mensagens para o contato principal
  await Message.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId
      }
    }
  );

  // 2. ✅ CORREÇÃO TICKETZ: Fechar tickets não fechados do contato duplicado
  const notClosedTickets = await Ticket.findAll({
    where: {
      contactId: lidContact.id,
      status: {
        [Op.not]: "closed"
      }
    }
  });

  // Fechar cada ticket aberto usando UpdateTicketService
  for (const ticket of notClosedTickets) {
    try {
      await UpdateTicketService({
        ticketData: { status: "closed" },
        ticketId: ticket.id,
        companyId: ticket.companyId
      });
    } catch (error) {
      logger.error(`Erro ao fechar ticket ${ticket.id} na deduplicação: ${error.message}`);
      // Continua o processo mesmo com erro
    }
  }

  // 3. ✅ CORREÇÃO TICKETZ: Mover TODOS os tickets (sem filtro de status)
  await Ticket.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId
        // ✅ REMOVIDO: status: { [Op.not]: "closed" }
      }
    }
  );

  // 4. Remove contato duplicado
  await lidContact.destroy();
}

export async function verifyContact(
  msgContactId: string,
  msgContactName: string,
  companyId: number,
  wbotId: number,
  isLid: boolean = false,
  isGroup: boolean = false,
  wbot?: any
): Promise<Contact> {
  // Validação de segurança
  if (msgContactId.endsWith('@newsletter')) {
    throw new Error(`Newsletter contacts are not allowed: ${msgContactId}`);
  }
  
  if (msgContactId.endsWith('@broadcast')) {
    throw new Error(`Broadcast contacts are not allowed: ${msgContactId}`);
  }

  const profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  
  // ✅ ESTRATÉGIA TICKETZ: Detectar LID automaticamente e extrair número corretamente
  const isLidContact = msgContactId.includes("@lid");
  
  // 🔥 CORREÇÃO CRÍTICA: Extrair número base consistente
  const baseNumber = msgContactId.substring(0, msgContactId.indexOf("@"));
  const number = isLidContact 
    ? msgContactId  // Para LID, mantém completo: "123@lid"
    : baseNumber;   // Para JID, extrai: "5511999999999"

  const contactData = {
    name: msgContactName || msgContactId.replace(/\D/g, ""),
    number,
    profilePicUrl,
    isGroup,
    companyId,
    whatsappId: wbotId,
    wbot
  };

  // Para grupos, criar/atualizar diretamente
  if (isGroup) {
    return CreateOrUpdateContactService(contactData);
  }

  // Usar mutex para evitar condições de corrida
  return lidUpdateMutex.runExclusive(async () => {
    
    // ========== ESTÁGIO 1: BUSCA UNIFICADA POR MÚLTIPLOS FORMATOS ==========
    // 🔥 CORREÇÃO CRÍTICA: Buscar contato por número base E formato LID
    const foundContact = await Contact.findOne({
      where: {
        companyId,
        number: {
          [Op.or]: [
            number,                    // Formato atual (JID: "123" ou LID: "123@lid")
            baseNumber,               // Número base: "123" 
            `${baseNumber}@lid`       // Formato LID: "123@lid"
          ]
        }
      },
      include: ["tags", "extraInfo", "whatsappLidMap"]
    });

    // ========== ESTÁGIO 2A: PROCESSAMENTO DE CONTATO LID ==========
    if (isLidContact) {
      if (foundContact) {
        // 2A.1 - Contato LID encontrado diretamente
        await foundContact.update({
          profilePicUrl: contactData.profilePicUrl,
          name: contactData.name || foundContact.name
        });
        
        // Garantir mapeamento LID
        const existingMapping = await WhatsappLidMap.findOne({
          where: { companyId, contactId: foundContact.id }
        });
        
        if (!existingMapping) {
          try {
            await WhatsappLidMap.create({
              companyId,
              lid: number,
              contactId: foundContact.id
            });
          } catch (error) {
            // Ignorar erros de constraint única
          }
        }
        
        return foundContact;
      }
      
      // 2A.2 - Buscar via WhatsappLidMap
      const foundMappedContact = await WhatsappLidMap.findOne({
        where: { companyId, lid: number },
        include: [{
          model: Contact,
          as: "contact",
          include: ["tags", "extraInfo"]
        }]
      });
      
      if (foundMappedContact?.contact) {
        await foundMappedContact.contact.update({
          profilePicUrl: contactData.profilePicUrl,
          name: contactData.name || foundMappedContact.contact.name
        });
        return foundMappedContact.contact;
      }
      
      // 2A.3 - Busca parcial LID usando número base (fallback)
      const partialLidContact = await Contact.findOne({
        where: { companyId, number: baseNumber },
        include: ["tags", "extraInfo"]
      });
      
      if (partialLidContact) {
        // Alinhar ao ticketz: apenas atualizar para LID completo
        await partialLidContact.update({
          number: contactData.number,
          profilePicUrl: contactData.profilePicUrl,
          name: contactData.name || partialLidContact.name
        });
        return partialLidContact;
      }
    } else {
      // ========== ESTÁGIO 2B: PROCESSAMENTO DE CONTATO JID ==========
      if (foundContact) {
        // 2B.1 - Contato JID existente, verificar mapeamento LID
        if (!foundContact.whatsappLidMap && wbot?.onWhatsApp) {
          try {
            const [ow] = await wbot.onWhatsApp(msgContactId);
            const lid = ow?.lid as string;
            
            if (lid) {
              // Verificar deduplicação antes de criar mapeamento
              await checkAndDedup(foundContact, lid, companyId);
              
              // Criar mapeamento LID
              try {
                await WhatsappLidMap.create({
                  companyId,
                  lid,
                  contactId: foundContact.id
                });
              } catch (error) {
                // Ignorar erros de constraint única
              }
            }
          } catch (error) {
            // Silenciar erros de API do WhatsApp
          }
        }
        
        await foundContact.update({
          profilePicUrl: contactData.profilePicUrl,
          name: contactData.name || foundContact.name
        });
        
        return foundContact;
      }
      
      // ========== ESTÁGIO 3: RESOLUÇÃO LID PARA NOVOS CONTATOS JID ==========
      if (wbot?.onWhatsApp) {
        try {
          const [ow] = await wbot.onWhatsApp(msgContactId);
          const lid = ow?.lid as string;
          
          if (lid) {
            // 🔥 CORREÇÃO: Buscar contato existente usando número base e formato LID
            const lidBaseNumber = lid.substring(0, lid.indexOf("@"));
            const lidContact = await Contact.findOne({
              where: {
                companyId,
                number: {
                  [Op.or]: [
                    lid,                    // Formato LID completo: "123@lid"
                    lidBaseNumber,         // Número base: "123"
                    `${lidBaseNumber}@lid` // Garantir formato LID
                  ]
                }
              },
              include: ["tags", "extraInfo"]
            });
            
            if (lidContact) {
              // Alinhar ao ticketz: criar mapeamento e atualizar número para JID
              try {
                await WhatsappLidMap.create({
                  companyId,
                  lid,
                  contactId: lidContact.id
                });
              } catch (error) {
                // Ignorar erros de constraint única
              }
              
              // Atualizar para JID padrão
              await lidContact.update({
                number: contactData.number,
                profilePicUrl: contactData.profilePicUrl,
                name: contactData.name || lidContact.name
              });
              
              return lidContact;
            }
          }
        } catch (error) {
          // Silenciar erros de API do WhatsApp
        }
      }
    }

    // ========== ESTÁGIO 4: CRIAR NOVO CONTATO ==========
    const newContact = await CreateOrUpdateContactService(contactData);
    
    // Se é contato LID, criar mapeamento
    if (isLidContact && newContact) {
      try {
        await WhatsappLidMap.create({
          companyId,
          lid: number,
          contactId: newContact.id
        });
      } catch (error) {
        // Ignorar erros de constraint única
      }
    }
    
    return newContact;
  });
}