import { Mutex } from "async-mutex";
import { Op } from "sequelize";
import { WASocket } from "baileys";
import Contact from "../../models/Contact";
import CreateOrUpdateContactService, {
  updateContact
} from "../ContactServices/CreateOrUpdateContactService";
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
  lid: string
): Promise<void> {
  const lidContact = await Contact.findOne({
    where: {
      companyId: contact.companyId,
      number: {
        [Op.or]: [lid, lid.substring(0, lid.indexOf("@"))]
      }
    }
  });

  if (!lidContact) {
    return;
  }

  await Message.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId: contact.companyId
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

  // eslint-disable-next-line no-restricted-syntax
  for (const ticket of notClosedTickets) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await UpdateTicketService({
        ticketData: { status: "closed", justClose: true }, // ✅ TICKETZ COMPAT: Evita mensagens na deduplicação
        ticketId: ticket.id,
        companyId: ticket.companyId
      });
    } catch (error) {
      logger.error(`Erro ao fechar ticket ${ticket.id} na deduplicação: ${error.message}`);
      // Continua o processo mesmo com erro
    }
  }

  await Ticket.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId: contact.companyId
      }
    }
  );

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
  
  const msgContact = {
    id: msgContactId,
    name: msgContactName
  };

  console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Starting contact verification:", {
    contactId: msgContact.id,
    contactName: msgContact.name,
    companyId: companyId
  });

  console.log("🔍 [DEBUG-XML] STEP 1: Iniciando verifyContact - Stream OK");

  let profilePicUrl: string;
  const noPicture = `${process.env.FRONTEND_URL}/nopicture.png`;

  console.log("🔍 [DEBUG-XML] STEP 2: Antes GetProfilePicUrl - Stream OK");

  try {
    // 🚨 TEMPORARY FIX: GetProfilePicUrl está corrompendo XML stream - desabilitado
    if (false && wbot && !msgContact.id.includes("g.us")) {
      console.log("🔍 [DEBUG-XML] STEP 3: Chamando GetProfilePicUrl");
      profilePicUrl = await GetProfilePicUrl(msgContact.id, companyId) || noPicture;
      console.log("🔍 [DEBUG-XML] STEP 4: GetProfilePicUrl concluído - Stream OK");
    } else {
      profilePicUrl = noPicture;
      console.log("🔍 [DEBUG-XML] STEP 4-ALT: Usando noPicture - Stream OK");
    }
  } catch (error) {
    profilePicUrl = noPicture;
    console.log("🔍 [DEBUG-XML] STEP 4-ERROR: GetProfilePicUrl erro, usando noPicture");
  }

  console.log("🔍 [DEBUG-XML] STEP 5: Definindo flags LID/Group - Stream OK");
  
  const isLidContact = msgContact.id.includes("@lid");
  const isGroupContact = msgContact.id.includes("@g.us");

  console.log("🔍 [DEBUG-XML] STEP 6: Antes busca no banco - Stream OK");

  console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Contact type detection:", {
    contactId: msgContact.id,
    isLid: isLidContact,
    isGroup: isGroupContact
  });

  const number = isLidContact
    ? msgContact.id
    : msgContact.id.substring(0, msgContact.id.indexOf("@"));

  console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Number extracted:", {
    originalId: msgContact.id,
    extractedNumber: number,
    isLid: isLidContact
  });

  const contactData = {
    name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
    number,
    profilePicUrl,
    isGroup: msgContact.id.includes("g.us"),
    companyId,
    whatsappId: wbotId
  };

  if (isGroupContact) {
    return CreateOrUpdateContactService(contactData);
  }

  return lidUpdateMutex.runExclusive(async () => {
    console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Searching for existing contact:", {
      companyId: companyId,
      number: number,
      isLid: isLidContact
    });

    console.log("🔍 [DEBUG-XML] STEP 7: Antes Contact.findOne - Stream OK");
    
    const foundContact = await Contact.findOne({
      where: {
        companyId,
        number
      },
      include: ["tags", "extraInfo", "whatsappLidMap"]
    });

    console.log("🔍 [DEBUG-XML] STEP 8: Contact.findOne concluído - Stream OK");

    console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Contact search result:", {
      foundContact: !!foundContact,
      contactId: foundContact?.id,
      hasLidMap: !!foundContact?.whatsappLidMap
    });

    if (isLidContact) {
      console.log("🚨 [WHATIZE-TICKETZ] verifyContact - Processing LID contact:", {
        lidNumber: number,
        foundDirectContact: !!foundContact
      });

      if (foundContact) {
        console.log("✅ [WHATIZE-TICKETZ] verifyContact - Found direct LID contact, updating profile pic");
        return updateContact(foundContact, {
          profilePicUrl: contactData.profilePicUrl
        });
      }

      console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Searching for LID mapping:", {
        lid: number,
        companyId: companyId
      });

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

      console.log("🔍 [WHATIZE-TICKETZ] verifyContact - LID mapping search result:", {
        foundMappedContact: !!foundMappedContact,
        mappedContactId: foundMappedContact?.contact?.id,
        mappedContactNumber: foundMappedContact?.contact?.number
      });

      if (foundMappedContact) {
        console.log("✅ [WHATIZE-TICKETZ] verifyContact - Found mapped LID contact, updating profile pic");
        return updateContact(foundMappedContact.contact, {
          profilePicUrl: contactData.profilePicUrl
        });
      }

      const partialLidNumber = number.substring(0, number.indexOf("@"));
      console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Searching for partial LID contact:", {
        partialLidNumber: partialLidNumber,
        originalLid: number
      });

      const partialLidContact = await Contact.findOne({
        where: {
          companyId,
          number: partialLidNumber
        },
        include: ["tags", "extraInfo"]
      });

      console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Partial LID search result:", {
        foundPartialContact: !!partialLidContact,
        partialContactId: partialLidContact?.id,
        partialContactNumber: partialLidContact?.number
      });

      if (partialLidContact) {
        console.log("✅ [WHATIZE-TICKETZ] verifyContact - Found partial LID contact, updating to full LID");
        return updateContact(partialLidContact, {
          number: contactData.number,
          profilePicUrl: contactData.profilePicUrl
        });
      }
    } else if (foundContact) {
      console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Processing existing normal contact:", {
        contactId: foundContact.id,
        contactNumber: foundContact.number,
        hasLidMap: !!foundContact.whatsappLidMap
      });

      if (!foundContact.whatsappLidMap && wbot) {
        console.log("🔍 [WHATIZE-TICKETZ] verifyContact - No LID mapping found, checking onWhatsApp for LID:");
        
        const [ow] = await wbot.onWhatsApp(msgContact.id);
        if (!ow?.exists) {
          throw new Error("ERR_WAPP_CONTACT_NOT_FOUND");
        }
        const lid = ow.lid as string;
        
        console.log("🔍 [WHATIZE-TICKETZ] verifyContact - onWhatsApp result:", {
          exists: ow.exists,
          lid: lid,
          hasLid: !!lid
        });

        if (lid) {
          console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Creating LID mapping for existing contact:", {
            contactId: foundContact.id,
            lid: lid
          });
          
          await checkAndDedup(foundContact, lid);
          await WhatsappLidMap.create({
            companyId,
            lid,
            contactId: foundContact.id
          });
          
          console.log("✅ [WHATIZE-TICKETZ] verifyContact - LID mapping created successfully");
        }
      } else {
        console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Contact already has LID mapping or no wbot:", {
          lidMapId: foundContact.whatsappLidMap?.id,
          mappedLid: foundContact.whatsappLidMap?.lid,
          hasWbot: !!wbot
        });
      }
      
      return updateContact(foundContact, {
        profilePicUrl: contactData.profilePicUrl
      });
    } else {
      console.log("🔍 [WHATIZE-TICKETZ] verifyContact - No existing contact found, creating new one");
      
      if (wbot) {
        const [ow] = await wbot.onWhatsApp(msgContact.id);
        if (!ow?.exists) {
          throw new Error("ERR_WAPP_CONTACT_NOT_FOUND");
        }
        const lid = ow.lid as string;

        console.log("🔍 [WHATIZE-TICKETZ] verifyContact - onWhatsApp result for new contact:", {
          exists: ow.exists,
          lid: lid,
          hasLid: !!lid
        });

        if (lid) {
          console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Searching for existing contact with this LID:", {
            lid: lid,
            lidWithoutAt: lid.substring(0, lid.indexOf("@"))
          });

          const lidContact = await Contact.findOne({
            where: {
              companyId,
              number: {
                [Op.or]: [lid, lid.substring(0, lid.indexOf("@"))]
              }
            },
            include: ["tags", "extraInfo"]
          });

          console.log("🔍 [WHATIZE-TICKETZ] verifyContact - LID contact search result:", {
            foundLidContact: !!lidContact,
            lidContactId: lidContact?.id,
            lidContactNumber: lidContact?.number
          });

          if (lidContact) {
            console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Creating LID mapping for found contact:", {
              contactId: lidContact.id,
              lid: lid
            });

            await WhatsappLidMap.create({
              companyId,
              lid,
              contactId: lidContact.id
            });
            
            console.log("✅ [WHATIZE-TICKETZ] verifyContact - LID mapping created, updating contact number");
            return updateContact(lidContact, {
              number: contactData.number,
              profilePicUrl: contactData.profilePicUrl
            });
          }
        }
      }
    }

    console.log("🔍 [WHATIZE-TICKETZ] verifyContact - Creating new contact service:", {
      contactData: contactData,
      isLid: isLidContact
    });

    const newContact = await CreateOrUpdateContactService(contactData);
    
    console.log("✅ [WHATIZE-TICKETZ] verifyContact - Contact verification completed:", {
      contactId: newContact.id,
      contactNumber: newContact.number,
      isLid: isLidContact
    });

    return newContact;
  });
}

// ✅ TICKETZ COMPATIBILITY WRAPPER
// Wrapper para manter compatibilidade com assinatura simplificada do Ticketz
export async function verifyContactTicketzCompat(
  msgContact: IMe,
  wbot: any,
  companyId: number
): Promise<Contact> {
  const isLid = msgContact.id.includes("@lid");
  const isGroup = msgContact.id.includes("@g.us");
  
  return verifyContact(
    msgContact.id,
    msgContact.name,
    companyId,
    wbot?.id || 0,
    isLid,
    isGroup,
    wbot
  );
}