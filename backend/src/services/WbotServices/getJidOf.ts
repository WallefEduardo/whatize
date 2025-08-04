import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import logger from "../../utils/logger";

export function getJidOf(reference: string | Contact | Ticket) {
  let address = reference;
  let isGroup = false;
  
  if (reference instanceof Contact) {
    isGroup = reference.isGroup;
    address = reference.number;
    logger.info(`🎯 [GET-JID] Contact: { number: '${address}', isGroup: ${isGroup} }`);
  } else if (reference instanceof Ticket) {
    isGroup = reference.isGroup;
    address = reference.contact.number;
    logger.info(`🎯 [GET-JID] Ticket: { contactNumber: '${address}', isGroup: ${isGroup} }`);
  } else {
    logger.info(`🎯 [GET-JID] String: { address: '${address}' }`);
  }

  if (typeof address !== "string") {
    logger.error(`❌ [GET-JID] Tipo inválido: ${typeof address}`);
    throw new Error("Invalid reference type");
  }

  if (address.includes("@")) {
    logger.info(`✅ [GET-JID] Já contém @, retornando: '${address}'`);
    return address;
  }

  const result = `${address}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
  logger.info(`🔧 [GET-JID] Formatando: '${address}' → '${result}'`);
  return result;
}