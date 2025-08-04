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
  logger.info(`🔄 [LID-DEDUP] Iniciando deduplicação: contactId=${contact.id}, lid=${lid}`);
  
  const lidContact = await Contact.findOne({
    where: {
      companyId,
      number: {
        [Op.or]: [lid, lid.substring(0, lid.indexOf("@"))]
      }
    }
  });

  if (!lidContact) {
    logger.info(`✅ [LID-DEDUP] Nenhum contato duplicado encontrado para ${lid}`);
    return;
  }

  logger.info(`🔄 [LID-DEDUP] Movendo mensagens de contactId=${lidContact.id} para contactId=${contact.id}`);
  
  await Message.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId
      }
    }
  );

  const notClosedTickets = await Ticket.findAll({
    where: {
      contactId: lidContact.id,
      status: {
        [Op.not]: "closed"
      }
    }
  });

  logger.info(`🔄 [LID-DEDUP] Fechando ${notClosedTickets.length} tickets ativos do contato duplicado`);

  // eslint-disable-next-line no-restricted-syntax
  for (const ticket of notClosedTickets) {
    // eslint-disable-next-line no-await-in-loop
    await UpdateTicketService({
      ticketData: { status: "closed" },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
  }

  logger.info(`🔄 [LID-DEDUP] Movendo tickets de contactId=${lidContact.id} para contactId=${contact.id}`);

  await Ticket.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId
      }
    }
  );

  logger.info(`🗑️ [LID-DEDUP] Removendo contato duplicado: contactId=${lidContact.id}`);
  await lidContact.destroy();
  
  logger.info(`✅ [LID-DEDUP] Deduplicação concluída com sucesso`);
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
  logger.info(`🔍 ETAPA 1 - verifyContact chamado: {
  msgContactId: '${msgContactId}',
  msgContactName: '${msgContactName}',
  companyId: ${companyId},
  wbotId: ${wbotId},
  isLid: ${isLid},
  isGroup: ${isGroup}
}`);

  let profilePicUrl: string;
  const noPicture = `${process.env.FRONTEND_URL}/nopicture.png`;

  try {
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  } catch (error) {
    profilePicUrl = noPicture;
  }

  // Extrair número baseado no tipo
  const number = isLid
    ? msgContactId // Para LID, mantém o ID completo
    : msgContactId.substring(0, msgContactId.indexOf("@")); // Para JID, extrai só o número

  logger.info(`🔍 ETAPA 3 - Número extraído (${isLid ? 'LID' : 'JID'}): ${number}`);

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
    logger.info(`👥 ETAPA 4 - Processando grupo, criando/atualizando diretamente`);
    return CreateOrUpdateContactService(contactData);
  }

  logger.info(`🔍 ETAPA 4 - Iniciando busca inteligente Ticketz: {
  number: '${number}',
  isLid: ${isLid},
  isGroup: ${isGroup},
  msgContactId: '${msgContactId}',
  msgContactName: '${msgContactName}'
}`);

  // Usar mutex para evitar condições de corrida
  return lidUpdateMutex.runExclusive(async () => {
    logger.info(`🔍 ETAPA 4.2 - Contato individual, usando mutex Ticketz`);
    logger.info(`🔍 ETAPA 4.3 - Dentro do mutex, buscando contato existente`);
    
    // Busca mais inteligente considerando variações de formato
    const numberVariations = [];
    if (isLid) {
      // Para LID: buscar por número completo, parcial e JID equivalente
      const partialNumber = number.substring(0, number.indexOf("@"));
      numberVariations.push(number); // 253725780217903@lid
      numberVariations.push(partialNumber); // 253725780217903
      numberVariations.push(`${partialNumber}@s.whatsapp.net`); // 253725780217903@s.whatsapp.net
    } else {
      // Para JID: buscar por número completo, parcial e LID equivalente
      const partialNumber = number; // já é o número limpo para JID
      numberVariations.push(`${partialNumber}@s.whatsapp.net`); // 559881737884@s.whatsapp.net
      numberVariations.push(partialNumber); // 559881737884
      numberVariations.push(`${partialNumber}@lid`); // 559881737884@lid
    }
    
    logger.info(`🔍 ETAPA 4.3.1 - Buscando contato com variações: [${numberVariations.join(', ')}]`);
    
    const foundContact = await Contact.findOne({
      where: {
        companyId,
        number: {
          [Op.or]: numberVariations
        }
      },
      include: ["tags", "extraInfo", "whatsappLidMap"]
    });

    if (isLid) {
      // PROCESSAMENTO PARA LID
      if (foundContact) {
        logger.info(`🔍 ETAPA 4.4 - Contato ENCONTRADO (LID), atualizando: { contactId: ${foundContact.id}, contactNumber: '${foundContact.number}', isLid: ${isLid} }`);
        
        // Verificar se já existe mapeamento LID para este contato
        const existingMapping = await WhatsappLidMap.findOne({
          where: {
            companyId,
            contactId: foundContact.id
          }
        });
        
        if (!existingMapping) {
          logger.info(`📝 ETAPA 4.4.1 - Criando mapeamento LID para contato existente: { contactId: ${foundContact.id}, lid: '${number}' }`);
          try {
            await WhatsappLidMap.create({
              companyId,
              lid: number,
              contactId: foundContact.id
            });
            logger.info(`✅ ETAPA 4.4.2 - Mapeamento LID criado com sucesso para contato existente`);
          } catch (error) {
            logger.error(`❌ ETAPA 4.4.2 - Erro ao criar mapeamento LID para contato existente: ${error.message}`);
          }
        } else {
          logger.info(`📋 ETAPA 4.4.1 - Mapeamento LID já existe para este contato: { mappingId: ${existingMapping.id} }`);
        }
        
        // Contato LID já existe, apenas atualizar
        await foundContact.update({
          profilePicUrl: contactData.profilePicUrl,
          name: contactData.name
        });
        return foundContact;
      }

      // Buscar mapeamento LID existente
      const foundMappedContact = await WhatsappLidMap.findOne({
        where: {
          companyId,
          lid: number
        },
        include: [
          {
            model: Contact,
            as: "contact",
            include: ["tags", "extraInfo"]
          }
        ]
      });

      if (foundMappedContact) {
        logger.info(`🔍 ETAPA 4.4.1 - Mapeamento LID encontrado, usando contato JID mapeado: { contactId: ${foundMappedContact.contact.id} }`);
        // Atualizar contato mapeado
        await foundMappedContact.contact.update({
          profilePicUrl: contactData.profilePicUrl
        });
        return foundMappedContact.contact;
      }

      // Buscar contato JID parcial (sem @s.whatsapp.net ou @lid) - Merge inteligente
      const partialNumber = number.substring(0, number.indexOf("@"));
      const jidNumber = `${partialNumber}@s.whatsapp.net`;
      
      logger.info(`🔍 ETAPA 4.4.2 - Buscando contato JID parcial para merge: ${partialNumber} | JID: ${jidNumber}`);
      
      const partialLidContact = await Contact.findOne({
        where: {
          companyId,
          number: {
            [Op.or]: [partialNumber, jidNumber]
          }
        },
        include: ["tags", "extraInfo", "whatsappLidMap"]
      });

      if (partialLidContact) {
        logger.info(`🔍 ETAPA 4.4.2 - Contato JID parcial encontrado, realizando merge LID: { contactId: ${partialLidContact.id}, currentNumber: '${partialLidContact.number}' }`);
        
        // Criar mapeamento LID para este contato existente
        const existingMapping = await WhatsappLidMap.findOne({
          where: {
            companyId,
            contactId: partialLidContact.id
          }
        });
        
        if (!existingMapping) {
          await WhatsappLidMap.create({
            companyId,
            lid: number, // número LID completo
            contactId: partialLidContact.id
          });
          logger.info(`✅ ETAPA 4.4.2.1 - Mapeamento LID criado para contato existente: { contactId: ${partialLidContact.id}, lid: '${number}' }`);
        }
        
        // Manter o número JID padrão mas atualizar perfil
        await partialLidContact.update({
          number: jidNumber, // usar JID padrão para compatibilidade
          profilePicUrl: contactData.profilePicUrl,
          name: contactData.name || partialLidContact.name
        });
        
        logger.info(`🔄 ETAPA 4.4.2.2 - Contato atualizado com merge LID: número mantido como '${jidNumber}'`);
        return partialLidContact;
      }

      logger.info(`🔍 ETAPA 4.5 - Contato LID não encontrado, criando novo: {
  number: '${number}',
  isLid: ${isLid},
  msgContactName: '${msgContactName}'
}`);
      
    } else {
      // PROCESSAMENTO PARA JID
      if (foundContact) {
        logger.info(`🔍 ETAPA 4.4 - Contato ENCONTRADO (JID), processando LID mapping: { contactId: ${foundContact.id}, contactNumber: '${foundContact.number}', isLid: ${isLid} }`);
        
        // Verificar se já tem mapeamento LID
        if (!foundContact.whatsappLidMap) {
          logger.info(`🔍 ETAPA 4.4.3 - Contato JID sem mapeamento LID, tentando obter LID do WhatsApp`);
          // Tentar obter LID do WhatsApp usando wbot.onWhatsApp()
          try {
            if (wbot && typeof wbot.onWhatsApp === 'function') {
              logger.info(`🔍 ETAPA 4.4.3.1 - Chamando wbot.onWhatsApp para: ${msgContactId}`);
              const [ow] = await wbot.onWhatsApp(msgContactId);
              
              if (ow?.exists && ow.lid) {
                logger.info(`🎯 ETAPA 4.4.4 - LID descoberto pelo WhatsApp: ${ow.lid} para JID: ${msgContactId}`);
                
                // Verificar duplicação antes de criar mapeamento
                await checkAndDedup(foundContact, ow.lid, companyId);
                
                // Criar mapeamento LID
                await WhatsappLidMap.create({
                  companyId,
                  lid: ow.lid,
                  contactId: foundContact.id
                });
                
                logger.info(`✅ ETAPA 4.4.5 - Mapeamento LID criado automaticamente: { contactId: ${foundContact.id}, lid: '${ow.lid}' }`);
              } else {
                logger.info(`ℹ️ ETAPA 4.4.4 - WhatsApp não retornou LID para: ${msgContactId} (normal para números sem LID)`);
              }
            } else {
              logger.warn(`⚠️ ETAPA 4.4.3.1 - wbot.onWhatsApp não disponível ou wbot não fornecido`);
            }
          } catch (error) {
            logger.warn(`⚠️ ETAPA 4.4.4 - Não foi possível obter LID do WhatsApp: ${error.message}`);
          }
        }
        
        // Atualizar dados do contato
        await foundContact.update({
          profilePicUrl: contactData.profilePicUrl
        });
        return foundContact;
      } else {
        logger.info(`🔍 ETAPA 4.5 - Contato JID não encontrado, verificando se existe LID correspondente`);
        
        // Tentar encontrar contato LID correspondente usando estratégia avançada
        const potentialLid = `${number}@lid`;
        logger.info(`🔍 ETAPA 4.5 - Buscando contato LID correspondente: ${potentialLid}`);
        
        // Buscar por número LID exato ou mapeamento existente
        const lidContact = await Contact.findOne({
          where: {
            companyId,
            number: {
              [Op.or]: [potentialLid, potentialLid.substring(0, potentialLid.indexOf("@"))]
            }
          },
          include: ["tags", "extraInfo", "whatsappLidMap"]
        });

        if (lidContact) {
          logger.info(`🔍 ETAPA 4.5.1 - Contato LID correspondente encontrado, realizando merge inteligente: { lidContactId: ${lidContact.id}, lidNumber: '${lidContact.number}' }`);
          
          // Verificar se já existe mapeamento
          const existingMapping = await WhatsappLidMap.findOne({
            where: {
              companyId,
              contactId: lidContact.id
            }
          });
          
          if (!existingMapping) {
            // Criar mapeamento LID->JID
            await WhatsappLidMap.create({
              companyId,
              lid: potentialLid,
              contactId: lidContact.id
            });
            logger.info(`✅ ETAPA 4.5.1.1 - Mapeamento LID criado: { contactId: ${lidContact.id}, lid: '${potentialLid}' }`);
          } else {
            logger.info(`📋 ETAPA 4.5.1.1 - Mapeamento LID já existe: { mappingId: ${existingMapping.id} }`);
          }
          
          // Atualizar contato para usar JID padrão (mais compatível)
          await lidContact.update({
            number: contactData.number,
            profilePicUrl: contactData.profilePicUrl,
            name: contactData.name || lidContact.name
          });
          
          logger.info(`🔄 ETAPA 4.5.1.2 - Contato LID atualizado para JID: '${lidContact.number}' → '${contactData.number}'`);
          return lidContact;
        }

        logger.info(`🔍 ETAPA 4.5 - Contato JID não encontrado, verificando LID via onWhatsApp: {
  number: '${number}',
  isLid: ${isLid},
  msgContactName: '${msgContactName}'
}`);
        
        // 🎯 ESTRATÉGIA TICKETZ: Usar wbot.onWhatsApp() para descobrir LID de JID
        try {
          if (wbot && typeof wbot.onWhatsApp === 'function') {
            logger.info(`🔍 ETAPA 4.5.1 - Chamando wbot.onWhatsApp para JID não encontrado: ${msgContactId}`);
            const [ow] = await wbot.onWhatsApp(msgContactId);
            
            if (ow?.exists && ow.lid) {
              logger.info(`🎯 ETAPA 4.5.1.1 - LID descoberto para JID novo: ${ow.lid} para JID: ${msgContactId}`);
              
              // Buscar se já existe contato com este LID
              const existingLidContact = await Contact.findOne({
                where: {
                  companyId,
                  number: {
                    [Op.or]: [ow.lid, ow.lid.substring(0, ow.lid.indexOf("@"))]
                  }
                },
                include: ["tags", "extraInfo", "whatsappLidMap"]
              });
              
              if (existingLidContact) {
                logger.info(`🔄 ETAPA 4.5.1.2 - Contato LID existente encontrado, realizando merge: { contactId: ${existingLidContact.id}, lidNumber: '${existingLidContact.number}' }`);
                
                // Criar mapeamento JID->LID no contato existente
                const existingMapping = await WhatsappLidMap.findOne({
                  where: {
                    companyId,
                    contactId: existingLidContact.id
                  }
                });
                
                if (!existingMapping) {
                  await WhatsappLidMap.create({
                    companyId,
                    lid: ow.lid,
                    contactId: existingLidContact.id
                  });
                  logger.info(`✅ ETAPA 4.5.1.3 - Mapeamento LID criado para contato existente: { contactId: ${existingLidContact.id}, lid: '${ow.lid}' }`);
                }
                
                // Atualizar contato para usar JID padrão
                await existingLidContact.update({
                  number: contactData.number, // JID padrão
                  profilePicUrl: contactData.profilePicUrl,
                  name: contactData.name || existingLidContact.name
                });
                
                logger.info(`🔄 ETAPA 4.5.1.4 - Contato existente atualizado para JID: '${existingLidContact.number}' → '${contactData.number}'`);
                return existingLidContact;
              } else {
                logger.info(`ℹ️ ETAPA 4.5.1.2 - LID descoberto mas não há contato existente com esse LID, continuando criação normal`);
              }
            } else {
              logger.info(`ℹ️ ETAPA 4.5.1.1 - WhatsApp não retornou LID para JID: ${msgContactId} (normal para números sem LID)`);
            }
          } else {
            logger.warn(`⚠️ ETAPA 4.5.1 - wbot.onWhatsApp não disponível para JID não encontrado`);
          }
        } catch (error) {
          logger.warn(`⚠️ ETAPA 4.5.1 - Erro ao obter LID para JID não encontrado: ${error.message}`);
        }
      }
    }

    // Criar novo contato se chegou até aqui
    logger.info(`🔍 ETAPA 4.5.1 - Dados do contato ANTES de chamar CreateOrUpdateContactService: {
  contactData: {
    name: '${contactData.name}',
    number: '${contactData.number}',
    profilePicUrl: '${contactData.profilePicUrl.substring(0, 35)}...',
    isGroup: ${contactData.isGroup},
    companyId: ${contactData.companyId},
    whatsappId: ${contactData.whatsappId}
  },
  profilePicUrlLength: ${contactData.profilePicUrl.length},
  nameNotEmpty: ${!!contactData.name},
  numberNotEmpty: ${!!contactData.number},
  companyIdValid: ${!!contactData.companyId},
  wbotIdValid: ${!!contactData.whatsappId}
}`);

    logger.info(`🔍 ETAPA 4.5.2 - CHAMANDO CreateOrUpdateContactService...`);
    const newContact = await CreateOrUpdateContactService(contactData);
    
    logger.info(`🔍 ETAPA 4.5.3 - CreateOrUpdateContactService RETORNOU: {
  contactExists: ${!!newContact},
  contactType: '${typeof newContact}',
  contactId: ${newContact?.id},
  contactNumber: '${newContact?.number}',
  contactName: '${newContact?.name}',
  isNull: ${newContact === null},
  isUndefined: ${newContact === undefined}${newContact?.number ? `,
  hasNumberProperty: ${!!newContact.number}` : ''}
}`);
    
    // Se é um contato LID, criar mapeamento para ele
    if (isLid && newContact) {
      logger.info(`🔍 ETAPA 4.5.4 - Criando mapeamento LID para novo contato: { contactId: ${newContact.id}, lid: '${number}' }`);
      try {
        await WhatsappLidMap.create({
          companyId,
          lid: number,
          contactId: newContact.id
        });
        logger.info(`✅ ETAPA 4.5.5 - Mapeamento LID criado com sucesso`);
      } catch (error) {
        logger.error(`❌ ETAPA 4.5.5 - Erro ao criar mapeamento LID: ${error.message}`);
      }
    }
    
    return newContact;
  });
}