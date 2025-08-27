import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import GetDefaultWhatsAppByUser from "./GetDefaultWhatsAppByUser";

const GetDefaultWhatsApp = async (
  companyId: number | null = null,
  whatsappId?: number,
  userId?: number
): Promise<Whatsapp> => {
  let connection: Whatsapp;
  let defaultWhatsapp = null;

  if(whatsappId){
    defaultWhatsapp = await Whatsapp.findOne({
      where: { id: whatsappId, companyId }
    });
  } else {
    defaultWhatsapp = await Whatsapp.findOne({
      where: { status: "CONNECTED", companyId, channel: "whatsapp" }
    });
  }
   

  if (defaultWhatsapp?.status === 'CONNECTED') {
    connection = defaultWhatsapp;
  } else {
    // Buscar qualquer conexão WhatsApp ativa
    const whatsapp = await Whatsapp.findOne({
      where: { status: "CONNECTED", companyId, channel: "whatsapp" },
      order: [["updatedAt", "DESC"]] // Pegar a mais recente
    });
    connection = whatsapp;
  }

  /*
  if (userId) {
    const whatsappByUser = await GetDefaultWhatsAppByUser(userId);
    if (whatsappByUser?.status === 'CONNECTED') {
      connection = whatsappByUser;
    } else {
      const whatsapp = await Whatsapp.findOne({
        where: { status: "CONNECTED", companyId }
      });
      connection = whatsapp;
    }
  }
  */

  if (!connection) {
    throw new AppError(`ERR_NO_DEF_WAPP_FOUND in COMPANY ${companyId} and WhatsappId is ${whatsappId}`);
  }

  return connection;
};

export default GetDefaultWhatsApp;