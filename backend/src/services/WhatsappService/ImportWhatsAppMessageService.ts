
import AppError from "../../errors/AppError";

import Whatsapp from "../../models/Whatsapp";

import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import { Op } from "sequelize";
import { add } from "date-fns";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import { dataMessages, getWbot } from "../../libs/wbot";
import { handleMessage } from "../WbotServices/wbotMessageListener";
import fs from 'fs';
import moment from "moment";
import { addLogs } from "../../helpers/addLogs";

// 🔒 MUTEX: Controle para evitar múltiplas execuções simultâneas
const importRunning = new Map<number | string, boolean>();

export const closeTicketsImported = async (whatsappId) => {

  const tickets = await Ticket.findAll({
    where: {
      status: 'pending',
      whatsappId,
      imported: { [Op.lt]: +add(new Date(), { hours: +5 }) }
    }
  })


  for (const ticket of tickets) {
    await new Promise(r => setTimeout(r, 330));
    await UpdateTicketService({ ticketData: { status: "closed" }, ticketId: ticket.id, companyId: ticket.companyId })
  }
  let whatsApp = await Whatsapp.findByPk(whatsappId);
  whatsApp.update({ statusImportMessages: null })
  const io = getIO();
  io.of(whatsApp.companyId.toString())
    .emit(`importMessages-${whatsApp.companyId}`, {
      action: "refresh",
    });

}



function sortByMessageTimestamp(a, b) {
  return b.messageTimestamp - a.messageTimestamp
}

function cleaner(array) {
  const mapa = new Map();
  const resultado = [];

  for (const objeto of array) {
    const valorChave = objeto['key']['id'];
    if (!mapa.has(valorChave)) {
      mapa.set(valorChave, true);
      resultado.push(objeto);
    }
  }

  return resultado.sort(sortByMessageTimestamp)
}






const ImportWhatsAppMessageService = async (whatsappId: number | string) => {
  // 🔒 MUTEX: Verificar se já está executando
  if (importRunning.get(whatsappId)) {
    addLogs({
      fileName: `debugImportConditions_${whatsappId}.txt`, 
      text: `🔒 MUTEX BLOQUEIO: Import já está executando para WhatsApp ${whatsappId}`});
    return;
  }

  // 🔒 MUTEX: Marcar como executando
  importRunning.set(whatsappId, true);

  let whatsApp = await Whatsapp.findByPk(whatsappId);

  const wbot = getWbot(whatsApp.id);

  try {

    const io = getIO();
    
    // 🔄 RESET: Limpar status no frontend no início da importação
    io.of(whatsApp.companyId.toString())
      .emit(`importMessages-${whatsApp.companyId}`, {
        action: "update",
        status: { this: -1, all: 0, date: moment().format("DD/MM/YY HH:mm:ss") }
      });
    
    // 🔍 DEBUG: Log para verificar dataMessages antes do processamento
    addLogs({
      fileName: `debugDataMessages_${whatsappId}.txt`, forceNewFile: true,
      text: `
=== DEBUG DATAMESSAGES CONTENT ===
Data/Hora: ${moment().format("DD/MM/YYYY HH:mm:ss")}
WhatsApp ID: ${whatsappId}
dataMessages[${whatsappId}] exists: ${!!dataMessages[whatsappId]}
Raw count before cleaner: ${dataMessages[whatsappId]?.length || 0}
Sample message structure: ${JSON.stringify(dataMessages[whatsappId]?.[0], null, 2)}
===================================
`});

    const messages = cleaner(dataMessages[whatsappId])
    let dateOldLimit = new Date(whatsApp.importOldMessages).getTime();
    let dateRecentLimit = new Date(whatsApp.importRecentMessages).getTime();

    // 🔍 DEBUG: Log adicional após cleaner
    addLogs({
      fileName: `debugDataMessages_${whatsappId}.txt`, 
      text: `
=== APÓS CLEANER FUNCTION ===
Clean messages count: ${messages.length}
Date limits - Old: ${moment(dateOldLimit).format("DD/MM/YYYY HH:mm:ss")}
Date limits - Recent: ${moment(dateRecentLimit).format("DD/MM/YYYY HH:mm:ss")}
=============================
`});

    addLogs({
      fileName: `processImportMessagesWppId${whatsappId}.txt`, forceNewFile: true,
      text: `Aguardando conexão para iniciar a importação de mensagens:
    Whatsapp nome: ${whatsApp.name}
    Whatsapp Id: ${whatsApp.id}
    Criação do arquivo de logs: ${moment().format("DD/MM/YYYY HH:mm:ss")}
    Selecionado Data de inicio de importação: ${moment(dateOldLimit).format("DD/MM/YYYY HH:mm:ss")} 
    Selecionado Data final da importação: ${moment(dateRecentLimit).format("DD/MM/YYYY HH:mm:ss")} 
    `
    })


    const qtd = messages.length
    let i = 0
    while (i < qtd) {

      try {
        const msg = messages[i]
        addLogs({
          fileName: `processImportMessagesWppId${whatsappId}.txt`, text: `
Mensagem ${i + 1} de ${qtd}
              `})
        await handleMessage(msg, wbot, whatsApp.companyId, true);

        if (i % 2 === 0) {
          const timestampMsg = Math.floor(msg.messageTimestamp["low"] * 1000)
          io.of(whatsApp.companyId.toString())
            .emit(`importMessages-${whatsApp.companyId}`, {
              action: "update",
              status: { this: i + 1, all: qtd, date: moment(timestampMsg).format("DD/MM/YY HH:mm:ss") }
            });

        }


        if (i + 1 === qtd) {
          dataMessages[whatsappId] = [];

          if (whatsApp.closedTicketsPostImported) {
            await closeTicketsImported(whatsappId)
          }
          await whatsApp.update({
            statusImportMessages: whatsApp.closedTicketsPostImported ? null : "renderButtonCloseTickets",
            importOldMessages: null,
            importRecentMessages: null
          });



          io.of(whatsApp.companyId.toString())
            .emit(`importMessages-${whatsApp.companyId}`, {
              action: "refresh",
            });
        }
      } catch (error) { 
        // 🔍 DEBUG: Log de erros que estavam sendo silenciados
        addLogs({
          fileName: `errorImportMessages_${whatsappId}.txt`, 
          text: `
=== ERROR DURANTE PROCESSAMENTO DA MENSAGEM ${i + 1} ===
Data/Hora: ${moment().format("DD/MM/YYYY HH:mm:ss")}
Erro: ${error.message}
Stack: ${error.stack}
Mensagem index: ${i}
Total mensagens: ${qtd}
========================================================
`});
        
        // Continua o processamento mesmo com erro (comportamento original preservado)
      }

      i++
    }


  } catch (error) {
    // 🔒 MUTEX: Limpar mutex em caso de erro
    importRunning.delete(whatsappId);
    throw new AppError("ERR_NOT_MESSAGE_TO_IMPORT", 403);
  } finally {
    // 🔒 MUTEX: Sempre limpar o mutex no final
    importRunning.delete(whatsappId);
  }

  return "whatsapps";
};

export default ImportWhatsAppMessageService;