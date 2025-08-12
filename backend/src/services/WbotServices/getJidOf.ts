import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";

export function getJidOf(reference: string | Contact | Ticket) {
  console.log("🔍 [WHATIZE-TICKETZ] getJidOf - INPUT:", {
    type: reference instanceof Contact ? "Contact" : reference instanceof Ticket ? "Ticket" : "string",
    reference: reference instanceof Contact ? { id: reference.id, number: reference.number, isGroup: reference.isGroup } :
               reference instanceof Ticket ? { id: reference.id, contactNumber: reference.contact.number, isGroup: reference.isGroup } :
               reference
  });

  let address = reference;
  let isGroup = false;
  if (reference instanceof Contact) {
    isGroup = reference.isGroup;
    address = reference.number;
    console.log("🔍 [WHATIZE-TICKETZ] getJidOf - Contact detected:", { contactId: reference.id, number: reference.number, isGroup });
  } else if (reference instanceof Ticket) {
    isGroup = reference.isGroup;
    address = reference.contact.number;
    console.log("🔍 [WHATIZE-TICKETZ] getJidOf - Ticket detected:", { ticketId: reference.id, contactNumber: reference.contact.number, isGroup });
  }

  if (typeof address !== "string") {
    console.log("❌ [WHATIZE-TICKETZ] getJidOf - ERROR: Invalid reference type", { address, type: typeof address });
    throw new Error("Invalid reference type");
  }

  console.log("🔍 [WHATIZE-TICKETZ] getJidOf - Address extracted:", { address, isGroup });

  if (address.includes("@")) {
    console.log("✅ [WHATIZE-TICKETZ] getJidOf - Address already contains @, returning as is:", address);
    const isLidFormat = address.includes("@lid");
    if (isLidFormat) {
      console.log("🚨 [WHATIZE-TICKETZ] getJidOf - LID FORMAT DETECTED:", address);
    }
    return address;
  }

  const finalJid = `${address}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
  console.log("🔍 [WHATIZE-TICKETZ] getJidOf - Final JID constructed:", finalJid);
  
  return finalJid;
}