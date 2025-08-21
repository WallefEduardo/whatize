import * as Sentry from "@sentry/node";
import makeWASocket, {
  AuthenticationState,
  Browsers,
  DisconnectReason,
  WAMessage,
  WAMessageKey,
  WASocket,
  fetchLatestWaWebVersion,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidGroup,
  jidNormalizedUser,
  makeCacheableSignalKeyStore
} from "baileys";

// Importação separada do makeInMemoryStore
// import makeInMemoryStore from "baileys/lib/Store/make-in-memory-store";

import { FindOptions } from "sequelize/types";
import Whatsapp from "../models/Whatsapp";
import logger from "../utils/logger";
import MAIN_LOGGER from "baileys/lib/Utils/logger";

const loggerBaileys = MAIN_LOGGER.child({});
loggerBaileys.level = "error";
import { useMultiFileAuthState } from "../helpers/useMultiFileAuthState";
import { Boom } from "@hapi/boom";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import cacheLayer from "./cache";
import ImportWhatsAppMessageService from "../services/WhatsappService/ImportWhatsAppMessageService";
import { add } from "date-fns";
import moment from "moment";
import { getTypeMessage, isValidMsg } from "../services/WbotServices/wbotMessageListener";
import { addLogs } from "../helpers/addLogs";
import NodeCache from "node-cache";
import { Store } from "./store";
import readline from "readline";


const msgRetryCounterCache = new NodeCache({
  stdTTL: 600,
  maxKeys: 1000,
  checkperiod: 300,
  useClones: false
});
const msgCache = new NodeCache({
  stdTTL: 60,
  maxKeys: 1000,
  checkperiod: 300,
  useClones: false
});

// Removido: duplicação com linha 25

export type Session = WASocket & {
  id?: number;
  store?: Store;
  cacheMessage?: (msg: WAMessage) => void;
};

const sessions: Session[] = [];

// Exportar sessions para uso em outros módulos
export { sessions };

const retriesQrCodeMap = new Map<number, number>();

// Controle de reconexão com backoff exponencial
const reconnectionAttempts = new Map<number, {
  count: number;
  lastAttempt: number;
  timeout?: NodeJS.Timeout;
  isReconnecting: boolean;
}>();

// Configurações de reconexão
const RECONNECTION_CONFIG = {
  MAX_ATTEMPTS: 5,
  BASE_DELAY: 10000, // 10 segundos
  MAX_DELAY: 300000, // 5 minutos
  BACKOFF_MULTIPLIER: 2
};

// Cache de sessões para reduzir chamadas
const sessionStateCache = new Map<number, {
  state: string;
  timestamp: number;
}>();
const SESSION_CACHE_TTL = 5000; // 5 segundos

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))

export default function msg() {
  return {
    get: (key: WAMessageKey) => {
      const { id } = key;
      if (!id) return;
      let data = msgCache.get(id);
      if (data) {
        try {
          let msg = JSON.parse(data as string);
          return msg?.message;
        } catch (error) {
          logger.error(error);
        }
      }
    },
    save: (msg: WAMessage) => {
      const { id } = msg.key;
      const msgtxt = JSON.stringify(msg);
      try {
        msgCache.set(id as string, msgtxt);
      } catch (error) {
        logger.error(error);
      }
    }
  }
}

export const getWbot = (whatsappId: number): Session => {
  // Verificar cache primeiro
  const cached = sessionStateCache.get(whatsappId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < SESSION_CACHE_TTL) {
    // Usar cache, não logar
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      return sessions[sessionIndex];
    }
  }
  
  // Log apenas em caso de erro ou primeira chamada
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  
  if (sessionIndex === -1) {
    logger.error(`❌ [WBOT-ERROR] Sessão não encontrada: { whatsappId: ${whatsappId} }`);
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  
  const session = sessions[sessionIndex];
  const state = (session as any).readyState || 'unknown';
  
  // Atualizar cache
  sessionStateCache.set(whatsappId, {
    state,
    timestamp: now
  });
  
  // Log apenas se estado mudou ou é unknown
  if (state === 'unknown' && (!cached || cached.state !== 'unknown')) {
    logger.warn(`⚠️ [WBOT-STATE] Sessão em estado unknown: { whatsappId: ${whatsappId} }`);
  }
  
  return session;
};

const shouldReconnect = (whatsappId: number): boolean => {
  const reconnectInfo = reconnectionAttempts.get(whatsappId);
  
  if (!reconnectInfo) {
    reconnectionAttempts.set(whatsappId, {
      count: 0,
      lastAttempt: Date.now(),
      isReconnecting: false
    });
    return true;
  }
  
  // Se já está reconectando, não permitir nova tentativa
  if (reconnectInfo.isReconnecting) {
    logger.warn(`⚠️ [RECONNECT-CONTROL] Reconexão já em andamento para WhatsApp ID ${whatsappId}`);
    return false;
  }
  
  // Verificar se excedeu o número máximo de tentativas
  if (reconnectInfo.count >= RECONNECTION_CONFIG.MAX_ATTEMPTS) {
    logger.error(`❌ [RECONNECT-CONTROL] Máximo de tentativas excedido para WhatsApp ID ${whatsappId}`);
    return false;
  }
  
  // Calcular delay com backoff exponencial
  const delay = Math.min(
    RECONNECTION_CONFIG.BASE_DELAY * Math.pow(RECONNECTION_CONFIG.BACKOFF_MULTIPLIER, reconnectInfo.count),
    RECONNECTION_CONFIG.MAX_DELAY
  );
  
  const timeSinceLastAttempt = Date.now() - reconnectInfo.lastAttempt;
  
  if (timeSinceLastAttempt < delay) {
    logger.info(`⏱️ [RECONNECT-CONTROL] Aguardando ${(delay - timeSinceLastAttempt) / 1000}s antes da próxima tentativa para WhatsApp ID ${whatsappId}`);
    return false;
  }
  
  return true;
};

const scheduleReconnection = (whatsapp: Whatsapp): void => {
  const whatsappId = whatsapp.id;
  
  if (!shouldReconnect(whatsappId)) {
    return;
  }
  
  const reconnectInfo = reconnectionAttempts.get(whatsappId) || {
    count: 0,
    lastAttempt: Date.now(),
    isReconnecting: false
  };
  
  // Cancelar timeout anterior se existir
  if (reconnectInfo.timeout) {
    clearTimeout(reconnectInfo.timeout);
  }
  
  reconnectInfo.count++;
  reconnectInfo.isReconnecting = true;
  
  const delay = Math.min(
    RECONNECTION_CONFIG.BASE_DELAY * Math.pow(RECONNECTION_CONFIG.BACKOFF_MULTIPLIER, reconnectInfo.count - 1),
    RECONNECTION_CONFIG.MAX_DELAY
  );
  
  logger.info(`🔄 [RECONNECT-CONTROL] Agendando reconexão ${reconnectInfo.count}/${RECONNECTION_CONFIG.MAX_ATTEMPTS} para WhatsApp ${whatsapp.name} (ID: ${whatsappId}) em ${delay / 1000}s`);
  
  reconnectInfo.timeout = setTimeout(async () => {
    try {
      logger.info(`🔌 [RECONNECT-CONTROL] Iniciando reconexão para WhatsApp ${whatsapp.name} (ID: ${whatsappId})`);
      reconnectInfo.lastAttempt = Date.now();
      await StartWhatsAppSession(whatsapp, whatsapp.companyId);
    } catch (error) {
      logger.error(`❌ [RECONNECT-CONTROL] Erro na reconexão do WhatsApp ${whatsapp.name}: ${error.message}`);
    } finally {
      reconnectInfo.isReconnecting = false;
    }
  }, delay);
  
  reconnectionAttempts.set(whatsappId, reconnectInfo);
};

const clearReconnectionAttempts = (whatsappId: number): void => {
  const reconnectInfo = reconnectionAttempts.get(whatsappId);
  if (reconnectInfo?.timeout) {
    clearTimeout(reconnectInfo.timeout);
  }
  reconnectionAttempts.delete(whatsappId);
  logger.info(`✅ [RECONNECT-CONTROL] Limpo controle de reconexão para WhatsApp ID ${whatsappId}`);
};

export const restartWbot = async (
  companyId: number,
  session?: any
): Promise<void> => {
  try {
    const options: FindOptions = {
      where: {
        companyId,
      },
      attributes: ["id"],
    }

    const whatsapp = await Whatsapp.findAll(options);

    whatsapp.map(async c => {
      const sessionIndex = sessions.findIndex(s => s.id === c.id);
      if (sessionIndex !== -1) {
        // @ts-ignore
        sessions[sessionIndex].ws.close(undefined);
      }

    });

  } catch (err) {
    logger.error(err);
  }
};

export const removeWbot = async (
  whatsappId: number,
  isLogout = true
): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      if (isLogout) {
        sessions[sessionIndex].logout();
        sessions[sessionIndex].ws.close();
      }

      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(err);
  }
};

export var dataMessages: any = {};

export const msgDB = msg();
const waitForPhoneNumber = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const phoneNumber = "5571991685206";
      resolve(phoneNumber);
    }, 5000); 
  });
};
export const initWASocket = async (whatsapp: Whatsapp): Promise<Session> => {
  return new Promise(async (resolve, reject) => {
    try {
      (async () => {
        logger.info(`Starting session ${whatsapp.name}`);
        
        const io = getIO();

        const whatsappUpdate = await Whatsapp.findOne({
          where: { id: whatsapp.id }
        });

        // ✅ Expor cacheMessage como no Ticketz (após wsocket ser definido)

        if (!whatsappUpdate) return;

        const { id, name, allowGroup, companyId } = whatsappUpdate;

        // const { version, isLatest } = await fetchLatestWaWebVersion({});
        const { version, isLatest } = await fetchLatestBaileysVersion();
        const versionB = [2,3000,1015920675];
        logger.info(`Versão: v${version.join(".")}, isLatest: ${isLatest}`);
        logger.info(`Starting session ${name}`);
        let retriesQrCode = 0;

        let wsocket: Session = null;
        // const store = makeInMemoryStore({
        //   logger: loggerBaileys
        // });
        const { state, saveCreds } = await useMultiFileAuthState(whatsapp);

        wsocket = makeWASocket({
          version,
          logger: loggerBaileys,
          printQRInTerminal: false,
          // auth: state as AuthenticationState,
          auth: {
            creds: state.creds,
            /** caching makes the store faster to send/recv messages */
            keys: makeCacheableSignalKeyStore(state.keys, logger),
          },
          generateHighQualityLinkPreview: true,
          linkPreviewImageThumbnailWidth: 192,
          // shouldIgnoreJid: jid => isJidBroadcast(jid),

          shouldIgnoreJid: (jid) => {
            //   // const isGroupJid = !allowGroup && isJidGroup(jid)
            return isJidBroadcast(jid) || (!allowGroup && isJidGroup(jid)) //|| jid.includes('newsletter')
          },
          browser: ['ubuntu', 'chrome', ''],
          defaultQueryTimeoutMs: undefined,
          msgRetryCounterCache,
          markOnlineOnConnect: false,
          retryRequestDelayMs: 500,
          maxMsgRetryCount: 5,
          emitOwnEvents: true,
          fireInitQueries: true,
          transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
          connectTimeoutMs: 25_000,
          // keepAliveIntervalMs: 60_000,
          getMessage: msgDB.get,
        });

        // Agora que wsocket existe, anexar cacheMessage
        wsocket.cacheMessage = (msg: WAMessage) => {
          try {
            msgDB.save(msg);
          } catch (e) {
            logger.error(e);
          }
        };




        setTimeout(async () => {
          const wpp = await Whatsapp.findByPk(whatsapp.id);
          // console.log("Status:::::",wpp.status)
          if (wpp?.importOldMessages && wpp.status === "CONNECTED") {
            let dateOldLimit = new Date(wpp.importOldMessages).getTime();
            let dateRecentLimit = new Date(wpp.importRecentMessages).getTime();

            addLogs({
              fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, forceNewFile: true,
              text: `Aguardando conexão para iniciar a importação de mensagens:
  Whatsapp nome: ${wpp.name}
  Whatsapp Id: ${wpp.id}
  Criação do arquivo de logs: ${moment().format("DD/MM/YYYY HH:mm:ss")}
  Selecionado Data de inicio de importação: ${moment(dateOldLimit).format("DD/MM/YYYY HH:mm:ss")} 
  Selecionado Data final da importação: ${moment(dateRecentLimit).format("DD/MM/YYYY HH:mm:ss")} 
  `})

            const statusImportMessages = new Date().getTime();

            await wpp.update({
              statusImportMessages
            });
            wsocket.ev.on("messaging-history.set", async (messageSet: any) => {
              //if(messageSet.isLatest){

              const statusImportMessages = new Date().getTime();

              await wpp.update({
                statusImportMessages
              });
              const whatsappId = whatsapp.id;
              let filteredMessages = messageSet.messages
              let filteredDateMessages = []
              filteredMessages.forEach(msg => {
                const timestampMsg = Math.floor(msg.messageTimestamp["low"] * 1000)
                if (isValidMsg(msg) && dateOldLimit < timestampMsg && dateRecentLimit > timestampMsg) {
                  if (msg.key?.remoteJid.split("@")[1] != "g.us") {
                    addLogs({
                      fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, text: `Adicionando mensagem para pos processamento:
  Não é Mensagem de GRUPO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  Data e hora da mensagem: ${moment(timestampMsg).format("DD/MM/YYYY HH:mm:ss")}
  Contato da Mensagem : ${msg.key?.remoteJid}
  Tipo da mensagem : ${getTypeMessage(msg)}
  
  `})
                    filteredDateMessages.push(msg)
                  } else {
                    if (wpp?.importOldMessagesGroups) {
                      addLogs({
                        fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, text: `Adicionando mensagem para pos processamento:
  Mensagem de GRUPO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  Data e hora da mensagem: ${moment(timestampMsg).format("DD/MM/YYYY HH:mm:ss")}
  Contato da Mensagem : ${msg.key?.remoteJid}
  Tipo da mensagem : ${getTypeMessage(msg)}
  
  `})
                      filteredDateMessages.push(msg)
                    }
                  }
                }

              });


              if (!dataMessages?.[whatsappId]) {
                dataMessages[whatsappId] = [];

                dataMessages[whatsappId].unshift(...filteredDateMessages);
              } else {
                dataMessages[whatsappId].unshift(...filteredDateMessages);
              }

              setTimeout(async () => {
                const wpp = await Whatsapp.findByPk(whatsappId);




                io.of(String(companyId))
                  .emit(`importMessages-${wpp.companyId}`, {
                    action: "update",
                    status: { this: -1, all: -1 }
                  });



                io.of(String(companyId))
                  .emit(`company-${companyId}-whatsappSession`, {
                    action: "update",
                    session: wpp
                  });
                //console.log(JSON.stringify(wpp, null, 2));
              }, 500);

              setTimeout(async () => {


                const wpp = await Whatsapp.findByPk(whatsappId);

                if (wpp?.importOldMessages) {
                  let isTimeStamp = !isNaN(
                    new Date(Math.floor(parseInt(wpp?.statusImportMessages))).getTime()
                  );

                  if (isTimeStamp) {
                    const ultimoStatus = new Date(
                      Math.floor(parseInt(wpp?.statusImportMessages))
                    ).getTime();
                    const dataLimite = +add(ultimoStatus, { seconds: +45 }).getTime();

                    if (dataLimite < new Date().getTime()) {
                      //console.log("Pronto para come?ar")
                      ImportWhatsAppMessageService(wpp.id)
                      wpp.update({
                        statusImportMessages: "Running"
                      })

                    } else {
                      //console.log("Aguardando inicio")
                    }
                  }
                }
                io.of(String(companyId))
                  .emit(`company-${companyId}-whatsappSession`, {
                    action: "update",
                    session: wpp
                  });
              }, 1000 * 45);

            });
          }

        }, 2500);



      
        wsocket.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect, qr }) => {
            logger.info(`🔌 [CONNECTION-UPDATE] INICIO: { connection: '${connection}', name: '${name}', hasError: ${!!lastDisconnect}, hasQr: ${!!qr} }`);
            
            try {
              logger.info(
                `Socket  ${name} Connection Update ${connection || ""} ${lastDisconnect ? lastDisconnect.error.message : ""
                }`
              );

            if (connection === "close") {
              logger.warn(`⚠️ [CONNECTION-CLOSE] WhatsApp ${name} desconectado: ${lastDisconnect?.error?.message || 'Unknown error'}`);
              
              // Log detalhado do erro
              if (lastDisconnect?.error) {
                const error = lastDisconnect.error as Boom;
                logger.error(`❌ [CONNECTION-ERROR] Detalhes: StatusCode=${error?.output?.statusCode}, Message=${error?.message}`);
                
                // Se for erro de conflito (stream replaced), adicionar tratamento especial
                if (error?.message?.includes('Stream Errored') || error?.output?.statusCode === 440) {
                  logger.warn(`🔄 [STREAM-CONFLICT] Detectado conflito de sessão para ${name}. Aplicando delay maior.`);
                  
                  // Aumentar contador de reconexão para aplicar delay maior
                  const reconnectInfo = reconnectionAttempts.get(id) || { count: 0, lastAttempt: 0, isReconnecting: false };
                  reconnectInfo.count = Math.min(reconnectInfo.count + 2, RECONNECTION_CONFIG.MAX_ATTEMPTS - 1);
                  reconnectionAttempts.set(id, reconnectInfo);
                }
              }
              
              // Erro 403: Forbidden - sessão deslogada
              if ((lastDisconnect?.error as Boom)?.output?.statusCode === 403) {
                logger.error(`🚫 [FORBIDDEN] WhatsApp ${name} foi deslogado. Limpando sessão.`);
                await whatsapp.update({ status: "PENDING", session: "" });
                await DeleteBaileysService(whatsapp.id);
                await cacheLayer.delFromPattern(`sessions:${whatsapp.id}:*`);
                clearReconnectionAttempts(id);
                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                removeWbot(id, false);
                return; // Não reconectar automaticamente
              }
              
              // Se não for logout intencional, agendar reconexão
              if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                removeWbot(id, false);
                scheduleReconnection(whatsapp);
              } else {
                // Logout intencional
                logger.info(`👋 [LOGOUT] WhatsApp ${name} deslogado intencionalmente`);
                await whatsapp.update({ status: "PENDING", session: "" });
                await DeleteBaileysService(whatsapp.id);
                await cacheLayer.delFromPattern(`sessions:${whatsapp.id}:*`);
                clearReconnectionAttempts(id);
                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                removeWbot(id, false);
              }
            }

            if (connection === "open") {
              // Limpar tentativas de reconexão quando conectar com sucesso
              clearReconnectionAttempts(id);
              
              const phoneNumber = wsocket.type === "md"
                ? jidNormalizedUser((wsocket as WASocket).user.id).split("@")[0]
                : "-";

              // ✅ VALIDAÇÃO: Verificar se número já está em uso por outra empresa
              if (phoneNumber !== "-") {
                const { default: ValidateWhatsappConnectionService } = await import("../services/WhatsappService/ValidateWhatsappConnectionService");
                try {
                  await ValidateWhatsappConnectionService({
                    name: whatsapp.name,
                    number: phoneNumber,
                    companyId: whatsapp.companyId,
                    id: whatsapp.id
                  });
                } catch (validationError) {
                  // Se a validação falhar, desconecta e define status como erro
                  logger.error(`❌ Validação falhou para WhatsApp ${whatsapp.name}: ${validationError.message}`);
                  
                  await whatsapp.update({
                    status: "DISCONNECTED",
                    qrcode: "",
                    retries: 0,
                    number: ""
                  });

                  // Emitir erro para o frontend
                  io.of(String(companyId))
                    .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                      action: "validation_error",
                      session: whatsapp,
                      error: validationError.message
                    });

                  // Fechar conexão
                  wsocket.logout();
                  wsocket.ws.close();
                  removeWbot(id, false);
                  return;
                }
              }

              await whatsapp.update({
                status: "CONNECTED",
                qrcode: "",
                retries: 0,
                number: phoneNumber
              });

              io.of(String(companyId))
                .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });

              const sessionIndex = sessions.findIndex(
                s => s.id === whatsapp.id
              );
              if (sessionIndex === -1) {
                wsocket.id = whatsapp.id;
                sessions.push(wsocket);
              }

              resolve(wsocket);
            }

            if (qr !== undefined) {
              if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= 3) {
                await whatsappUpdate.update({
                  status: "DISCONNECTED",
                  qrcode: ""
                });
                await DeleteBaileysService(whatsappUpdate.id);
                await cacheLayer.delFromPattern(`sessions:${whatsapp.id}:*`);
                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsappUpdate
                  });
                wsocket.ev.removeAllListeners("connection.update");
                wsocket.ws.close();
                wsocket = null;
                retriesQrCodeMap.delete(id);
              } else {
                logger.info(`Session QRCode Generate ${name}`);
                retriesQrCodeMap.set(id, (retriesQrCode += 1));

                await whatsapp.update({
                  qrcode: qr,
                  status: "qrcode",
                  retries: 0,
                  number: ""
                });
                const sessionIndex = sessions.findIndex(
                  s => s.id === whatsapp.id
                );

                if (sessionIndex === -1) {
                  wsocket.id = whatsapp.id;
                  sessions.push(wsocket);
                }

                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
              }
            }
            
            logger.info(`🔌 [CONNECTION-UPDATE] CONCLUIDO: { connection: '${connection}', name: '${name}' }`);
            } catch (error) {
              logger.error(`❌ [CONNECTION-UPDATE] ERRO CRITICO: { name: '${name}', error: ${error.message}, stack: ${error.stack} }`);
              throw error; // Re-throw para manter comportamento original
            }
          }
        );
        // conect no whatsapp via code
        // if (true && !state.creds.registered) {
        //   const phoneNumber = await waitForPhoneNumber() as string;
        //   if (phoneNumber) {
        //     try {
        //       console.log("Solicitando o código de emparelhamento...");
        //       const code =await wsocket.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ""));
        //       console.log("Codigo de emparelhamento:", code);
        //     } catch (error) {
        //       console.error("Erro ao solicitar o código de emparelhamento:", error);
        //       process.exit(1);
        //     }
        //   } else {
        //     console.log("Número de telefone inválido.");
        //     process.exit(1);
        //   }
        // }
        wsocket.ev.on("creds.update", async (creds) => {
          logger.info(`🔑 [CREDS-UPDATE] INICIO: { name: '${name}', hasUpdate: ${!!creds} }`);
          try {
            await saveCreds();
            logger.info(`🔑 [CREDS-UPDATE] CONCLUIDO: { name: '${name}' }`);
          } catch (error) {
            logger.error(`❌ [CREDS-UPDATE] ERRO CRITICO: { name: '${name}', error: ${error.message}, stack: ${error.stack} }`);
            throw error;
          }
        });
        // wsocket.store = store;
        // store.bind(wsocket.ev);
      })();
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      reject(error);
    }
  });
};