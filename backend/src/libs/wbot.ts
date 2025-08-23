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
import { sessionManager } from "./WhatsAppSessionManager";


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
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  
  const session = sessions[sessionIndex];
  const state = (session as any).readyState || 'unknown';
  
  // Atualizar cache
  sessionStateCache.set(whatsappId, {
    state,
    timestamp: now
  });
  
  
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
    return false;
  }
  
  // Verificar se excedeu o número máximo de tentativas
  if (reconnectInfo.count >= RECONNECTION_CONFIG.MAX_ATTEMPTS) {
    return false;
  }
  
  // Calcular delay com backoff exponencial
  const delay = Math.min(
    RECONNECTION_CONFIG.BASE_DELAY * Math.pow(RECONNECTION_CONFIG.BACKOFF_MULTIPLIER, reconnectInfo.count),
    RECONNECTION_CONFIG.MAX_DELAY
  );
  
  const timeSinceLastAttempt = Date.now() - reconnectInfo.lastAttempt;
  
  if (timeSinceLastAttempt < delay) {
    return false;
  }
  
  return true;
};

const scheduleReconnection = async (whatsapp: Whatsapp, isError515: boolean = false): Promise<void> => {
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
  
  // Error 515 usa delay fixo reduzido
  const delay = isError515 
    ? 5000  // 5s fixo para Error 515
    : Math.min(
        RECONNECTION_CONFIG.BASE_DELAY * Math.pow(RECONNECTION_CONFIG.BACKOFF_MULTIPLIER, reconnectInfo.count - 1),
        RECONNECTION_CONFIG.MAX_DELAY
      );
  
  reconnectInfo.timeout = setTimeout(async () => {
    try {
      reconnectInfo.lastAttempt = Date.now();
      
      // Buscar dados atualizados do WhatsApp antes de reconectar
      const updatedWhatsapp = await Whatsapp.findByPk(whatsappId);
      if (updatedWhatsapp) {
        await StartWhatsAppSession(updatedWhatsapp, updatedWhatsapp.companyId);
      } else {
        logger.error(`WhatsApp ID ${whatsappId} não encontrado no banco`);
      }
    } catch (error) {
      logger.error(`Erro na reconexão do WhatsApp ${whatsapp.name}: ${error.message}`);
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
};

// Função unificada de limpeza completa para disconnect/delete
export const cleanupWhatsAppSession = async (whatsappId: number, mode: 'disconnect' | 'delete' = 'disconnect'): Promise<void> => {
  try {
    const sessionExists = sessions.find(s => s.id === whatsappId);
    const hasReconnectionAttempts = reconnectionAttempts.has(whatsappId);
    const hasSessionCache = sessionStateCache.has(whatsappId);
    
    // 1. Limpar tentativas de reconexão (se existir)
    if (hasReconnectionAttempts) {
      clearReconnectionAttempts(whatsappId);
    }
    
    // 2. Limpar cache de sessão (se existir)
    if (hasSessionCache) {
      sessionStateCache.delete(whatsappId);
    }
    
    // 3. Importar os serviços necessários dinamicamente para evitar dependências circulares
    const { default: cacheLayer } = await import("./cache");
    
    // Limpar cache Redis/MemoryCache (dados de autenticação do Baileys)
    await cacheLayer.delFromPattern(`sessions:${whatsappId}:*`);
    
    if (mode === 'delete') {
      // 5. Para delete, limpeza mais agressiva
      const { default: DeleteBaileysService } = await import("../services/BaileysServices/DeleteBaileysService");
      await DeleteBaileysService(whatsappId);
      
      // Remover da lista de sessões ativas (se existir)
      if (sessionExists) {
        removeWbot(whatsappId, false);
      }
    }
    
  } catch (error) {
    logger.error(`Erro na limpeza ${mode} para WhatsApp ID ${whatsappId}: ${error.message}`);
  }
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
        
        const hasAuthData = state.creds && state.creds.me;

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
            
            try {
              logger.info(
                `Socket  ${name} Connection Update ${connection || ""} ${lastDisconnect ? lastDisconnect.error.message : ""
                }`
              );

            if (connection === "close") {
              if (lastDisconnect?.error) {
                const error = lastDisconnect.error as Boom;
                
                // Tratamento específico para diferentes tipos de erro de stream
                if (error?.message?.includes('Stream Errored') || error?.output?.statusCode === 440) {
                  const reconnectInfo = reconnectionAttempts.get(id) || { count: 0, lastAttempt: 0, isReconnecting: false };
                  
                  // Error 515 "Stream Errored (restart required)" - reconexão rápida
                  if (error?.output?.statusCode === 515 && error?.message?.includes('restart required')) {
                    reconnectInfo.count = 1;
                  } else {
                    reconnectInfo.count = Math.min(reconnectInfo.count + 2, RECONNECTION_CONFIG.MAX_ATTEMPTS - 1);
                  }
                  
                  reconnectionAttempts.set(id, reconnectInfo);
                }
              }
              
              // Erro 403: Forbidden - sessão deslogada
              if ((lastDisconnect?.error as Boom)?.output?.statusCode === 403) {
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
              
              const disconnectReason = (lastDisconnect?.error as Boom)?.output?.statusCode || 'UNKNOWN_ERROR';
              const errorMessage = (lastDisconnect?.error as Boom)?.message || '';
              
              if (disconnectReason === 401 && errorMessage.includes('Connection Failure')) {
                removeWbot(id, false);
                
                sessionManager.markAsDisconnected(id, companyId, 'Connection Failure').catch(error => {
                  logger.error(`Erro ao marcar connection failure: ${error.message}`);
                });
                
              } else if (disconnectReason === DisconnectReason.loggedOut && !errorMessage.includes('Connection Failure')) {
                sessionManager.markAsDisconnected(id, companyId, 'INTENTIONAL_LOGOUT').catch(error => {
                  logger.error(`Erro ao marcar logout: ${error.message}`);
                });
                
                await whatsapp.update({ status: "PENDING", session: "" });
                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                  
              } else {
                removeWbot(id, false);
                
                sessionManager.markAsDisconnected(id, companyId, `ERROR_${disconnectReason}`).catch(error => {
                  logger.error(`Erro ao marcar desconexão: ${error.message}`);
                });
                
                const isError515 = disconnectReason === 515;
                scheduleReconnection(whatsapp, isError515).catch(error => {
                  logger.error(`Erro ao agendar reconexão: ${error.message}`);
                });
              }
            }

            if (connection === "open") {
              // Limpar tentativas de reconexão quando conectar com sucesso
              clearReconnectionAttempts(id);
              
              sessionManager.markAsConnected(id);
              
              const phoneNumber = wsocket.type === "md"
                ? jidNormalizedUser((wsocket as WASocket).user.id).split("@")[0]
                : "-";

              // Verificar se número já está em uso por outra empresa
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
                  logger.error(`Validação falhou para WhatsApp ${whatsapp.name}: ${validationError.message}`);
                  
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
            
            } catch (error) {
              logger.error(`Erro crítico na atualização de conexão: ${error.message}`);
              throw error;
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
          try {
            await saveCreds();
          } catch (error) {
            logger.error(`Erro crítico na atualização de credenciais: ${error.message}`);
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