import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  channel?: string;
  extraInfo?: ExtraInfo[];
  remoteJid?: string;
  whatsappId?: number;
  wbot?: any;
}

export const updateContact = async (
  contact: Contact,
  contactData: any
) => {
  await contact.update(contactData);

  const io = getIO();
  io.to(`company-${contact.companyId}-mainchannel`).emit(
    `company-${contact.companyId}-contact`,
    {
      action: "update",
      contact
    }
  );
  return contact;
};

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  channel = "whatsapp",
  companyId,
  extraInfo = [],
  remoteJid = "",
  whatsappId
}: Request): Promise<Contact> => {
  
  // Sanitize number (preserving LID format from Whatize)
  const number = isGroup ? rawNumber : 
    rawNumber.includes('@lid') ? rawNumber : rawNumber.replace(/[^0-9]/g, "");
    
  const io = getIO();
  let contact: Contact | null;

  try {
    // SIMPLE CREATE ATTEMPT (Ticketz Pattern)
    contact = await Contact.create({
      name,
      number,
      email,
      isGroup,
      companyId,
      channel,
      acceptAudioMessage: false,
      profilePicUrl,
      remoteJid,
      whatsappId
    });

    await contact.reload({ 
      include: ["tags", "extraInfo", "whatsappLidMap"] 
    });

    io.to(`company-${companyId}-mainchannel`).emit(
      `company-${companyId}-contact`,
      {
        action: "create",
        contact
      }
    );

  } catch (createError) {
    if (createError.name === "SequelizeUniqueConstraintError") {
      // SIMPLE FIND AND UPDATE (Ticketz Pattern)
      contact = await Contact.findOne({
        where: { number, companyId },
        include: ["tags", "extraInfo", "whatsappLidMap"]
      });

      if (contact) {
        await updateContact(contact, { 
          profilePicUrl: profilePicUrl || contact.profilePicUrl,
          name: name || contact.name,
          remoteJid: remoteJid || contact.remoteJid,
          whatsappId: whatsappId || contact.whatsappId
        });
      }
    } else {
      console.error("Error creating contact:", createError);
      throw createError;
    }
  }

  return contact;
};

export default CreateOrUpdateContactService;