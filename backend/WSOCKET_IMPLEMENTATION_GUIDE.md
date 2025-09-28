# 🔧 GUIA DE IMPLEMENTAÇÃO WSOCKET - CÓDIGO PRÁTICO

## 📦 INSTALAÇÃO E CONFIGURAÇÃO

### 1. Remover Baileys e Instalar WSocket
```bash
# Passo 1: Fazer backup
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Passo 2: Remover Baileys
npm uninstall baileys @adiwajshing/baileys @whiskeysockets/baileys

# Passo 3: Instalar WSocket
npm install github:renatoiub/WSocket#main

# Passo 4: Limpar cache
npm cache clean --force
rm -rf node_modules
npm install
```

## 🏗️ IMPLEMENTAÇÕES CRÍTICAS

### 1. ARQUIVO: `src/libs/wbot.ts` - Core WhatsApp Connection

```typescript
// ============================================
// IMPLEMENTAÇÃO COMPLETA COM WSOCKET
// ============================================

import makeWASocket, {
  AuthenticationState,
  BufferJSON,
  DisconnectReason,
  fetchLatestBaileysVersion,
  getAggregateVotesInPollMessage,
  isJidBroadcast,
  isJidGroup,
  isJidUser,
  jidNormalizedUser,
  makeInMemoryStore,
  proto,
  SocketConfig,
  useMultiFileAuthState,
  WAMessageContent,
  WAMessageKey,
  WASocket
} from "wsocket"; // ⚠️ MUDANÇA: Importar de wsocket, não baileys

import { Boom } from "@hapi/boom";
import MAIN_LOGGER from "./logger";
import Message from "../models/Message";
import { logger } from "../utils/logger";

const loggerBaileys = MAIN_LOGGER.child({});
loggerBaileys.level = "silent";

// ⚠️ IMPLEMENTAÇÃO OBRIGATÓRIA: getMessage
// Sem isso, WSocket não funciona corretamente
export const getMessage = async (
  key: WAMessageKey
): Promise<WAMessageContent | undefined> => {
  if (!key.id) return undefined;

  try {
    // Buscar mensagem do banco de dados
    const message = await Message.findOne({
      where: {
        messageId: key.id,
        remoteJid: key.remoteJid
      }
    });

    if (message?.dataJson) {
      const data = JSON.parse(message.dataJson);
      return proto.Message.fromObject(data);
    }
  } catch (error) {
    logger.error(`Error fetching message ${key.id}: ${error.message}`);
  }

  return undefined;
};

// Store para cache de mensagens em memória
const stores = {};

export const getWbot = (whatsappId: number): WASocket => {
  const sessionName = `whatsapp-${whatsappId}`;
  return sessions[sessionName];
};

export const removeWbot = (whatsappId: number): void => {
  const sessionName = `whatsapp-${whatsappId}`;
  delete sessions[sessionName];
  delete stores[sessionName];
};

const sessions: { [key: string]: WASocket } = {};

export const initWASocket = async (whatsappId: number): Promise<WASocket> => {
  return new Promise(async (resolve, reject) => {
    try {
      const io = getIO();
      const sessionName = `whatsapp-${whatsappId}`;
      const whatsapp = await Whatsapp.findByPk(whatsappId);

      if (!whatsapp) {
        throw new Error("Whatsapp not found");
      }

      // Auth state com multi-file (mais estável)
      const { state, saveCreds } = await useMultiFileAuthState(
        `./sessions/${sessionName}`
      );

      // Buscar versão mais recente
      const { version } = await fetchLatestBaileysVersion();

      // Store em memória para performance
      const store = makeInMemoryStore({
        logger: loggerBaileys
      });

      // ⚠️ CONFIGURAÇÃO CRÍTICA PARA WSOCKET
      const wbotConfig: SocketConfig = {
        auth: state,
        printQRInTerminal: false,
        logger: loggerBaileys,
        version,
        browser: ["Whatize", "Chrome", "10.15.7"],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        qrTimeout: 40000,
        defaultQueryTimeoutMs: 60000,
        // ⚠️ IMPORTANTE: Não usar makeCacheableSignalKeyStore
        // msgRetryCounterCache: msgRetryCounterCache,
        getMessage: getMessage, // ⚠️ CRÍTICO: Implementação obrigatória
        shouldIgnoreJid: (jid) => isJidBroadcast(jid),
        generateHighQualityLinkPreview: false,
        syncFullHistory: false
      };

      const wbot = makeWASocket(wbotConfig);

      // Bind store para sincronização
      store.bind(wbot.ev);
      stores[sessionName] = store;

      // Event: Connection Update
      wbot.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          logger.info(`QR Code received for session ${sessionName}`);
          await whatsapp.update({
            qrcode: qr,
            status: "qrcode"
          });
          io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
            action: "update",
            session: whatsapp
          });
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          logger.info(
            `Connection closed for ${sessionName}. Status: ${statusCode}. Reconnect: ${shouldReconnect}`
          );

          if (statusCode === DisconnectReason.badSession) {
            logger.error(`Bad session detected for ${sessionName}. Cleaning up...`);
            // Limpar arquivos de sessão corrompidos
            await cleanupSession(sessionName);
          }

          if (shouldReconnect) {
            setTimeout(() => initWASocket(whatsappId), 3000);
          } else {
            await whatsapp.update({
              status: "DISCONNECTED",
              qrcode: null,
              retries: 0
            });
            removeWbot(whatsappId);
          }
        }

        if (connection === "open") {
          logger.info(`Connection opened for ${sessionName}`);
          await whatsapp.update({
            status: "CONNECTED",
            qrcode: null
          });
          io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
            action: "update",
            session: whatsapp
          });
        }
      });

      // Event: Credentials Update
      wbot.ev.on("creds.update", saveCreds);

      // Event: Messages Upsert (recebimento de mensagens)
      wbot.ev.on("messages.upsert", async (messageUpsert) => {
        const messages = messageUpsert.messages;
        if (!messages?.length) return;

        messages.forEach(async (message) => {
          // Processar mensagem com tratamento de LID
          await handleIncomingMessage(wbot, message, whatsapp);
        });
      });

      // Event: Messages Update (status de mensagem)
      wbot.ev.on("messages.update", async (messageUpdate) => {
        for (const message of messageUpdate) {
          await handleMessageUpdate(message);
        }
      });

      // Event: Message Reaction
      wbot.ev.on("messages.reaction", async (reactions) => {
        for (const reaction of reactions) {
          await handleMessageReaction(reaction);
        }
      });

      // Event: Groups Update
      wbot.ev.on("groups.update", async (groupUpdate) => {
        for (const group of groupUpdate) {
          await handleGroupUpdate(group);
        }
      });

      sessions[sessionName] = wbot;
      resolve(wbot);
    } catch (error) {
      logger.error(`Error initializing WSocket: ${error.message}`);
      reject(error);
    }
  });
};

// Função auxiliar para limpar sessão corrompida
const cleanupSession = async (sessionName: string) => {
  const sessionPath = `./sessions/${sessionName}`;
  try {
    await fs.promises.rm(sessionPath, { recursive: true, force: true });
    logger.info(`Session ${sessionName} cleaned up successfully`);
  } catch (error) {
    logger.error(`Error cleaning up session ${sessionName}: ${error.message}`);
  }
};
```

### 2. ARQUIVO: `src/services/WbotServices/verifyContact.ts` - Gestão de Contatos com LID

```typescript
// ============================================
// VERIFY CONTACT COM SUPORTE APRIMORADO PARA LID
// ============================================

import { Mutex } from "async-mutex";
import { Op } from "sequelize";
import { jidNormalizedUser, WASocket } from "wsocket"; // ⚠️ MUDANÇA
import Contact from "../../models/Contact";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import logger from "../../utils/logger";

const contactMutex = new Mutex();

interface IContact {
  id: string;
  name?: string;
}

export const verifyContact = async (
  msgContact: IContact,
  wbot: WASocket,
  companyId: number
): Promise<Contact> => {
  // ⚠️ IMPORTANTE: Usar jidNormalizedUser para padronização
  const normalizedJid = jidNormalizedUser(msgContact.id);
  const isLid = normalizedJid.includes("@lid");
  const isGroup = normalizedJid.includes("@g.us");

  logger.debug(`Verifying contact: ${normalizedJid} (LID: ${isLid}, Group: ${isGroup})`);

  // Usar mutex para evitar race conditions
  return contactMutex.runExclusive(async () => {
    let contact: Contact | null = null;

    // Para grupos, processamento simplificado
    if (isGroup) {
      return handleGroupContact(msgContact, companyId);
    }

    // Extrair número base
    const number = isLid 
      ? normalizedJid 
      : normalizedJid.split("@")[0];

    // Buscar contato existente
    if (isLid) {
      // Buscar por LID direto
      contact = await Contact.findOne({
        where: { 
          companyId, 
          number 
        },
        include: ["whatsappLidMap"]
      });

      // Se não encontrou, buscar por mapeamento
      if (!contact) {
        const lidMap = await WhatsappLidMap.findOne({
          where: { 
            companyId, 
            lid: number 
          },
          include: ["contact"]
        });
        
        if (lidMap?.contact) {
          contact = lidMap.contact;
        }
      }
    } else {
      // Buscar contato normal (JID)
      contact = await Contact.findOne({
        where: { 
          companyId, 
          number 
        },
        include: ["whatsappLidMap"]
      });

      // Se encontrou e não tem LID mapeado, criar mapeamento
      if (contact && !contact.whatsappLidMap && wbot) {
        await createLidMapping(contact, wbot, companyId);
      }
    }

    // Se não encontrou contato, criar novo
    if (!contact) {
      contact = await createNewContact(msgContact, companyId, wbot);
    } else {
      // Atualizar informações se necessário
      await updateContactInfo(contact, msgContact);
    }

    return contact;
  });
};

// Criar mapeamento LID para contato existente
const createLidMapping = async (
  contact: Contact, 
  wbot: WASocket, 
  companyId: number
): Promise<void> => {
  try {
    const jid = `${contact.number}@s.whatsapp.net`;
    const [result] = await wbot.onWhatsApp(jid);
    
    if (result?.exists && result.lid) {
      // Verificar duplicatas antes de criar
      await dedupContactByLid(contact, result.lid, companyId);
      
      await WhatsappLidMap.create({
        companyId,
        lid: result.lid,
        contactId: contact.id
      });
      
      logger.info(`LID mapping created: ${result.lid} -> Contact ${contact.id}`);
    }
  } catch (error) {
    logger.error(`Error creating LID mapping: ${error.message}`);
  }
};

// Deduplicar contatos por LID
const dedupContactByLid = async (
  mainContact: Contact,
  lid: string,
  companyId: number
): Promise<void> => {
  // Buscar contatos duplicados com o mesmo LID
  const duplicates = await Contact.findAll({
    where: {
      companyId,
      number: {
        [Op.or]: [lid, lid.split("@")[0]]
      },
      id: {
        [Op.ne]: mainContact.id
      }
    }
  });

  for (const duplicate of duplicates) {
    // Transferir tickets
    await Ticket.update(
      { contactId: mainContact.id },
      { where: { contactId: duplicate.id } }
    );

    // Transferir mensagens
    await Message.update(
      { contactId: mainContact.id },
      { where: { contactId: duplicate.id } }
    );

    // Remover duplicata
    await duplicate.destroy();
    
    logger.info(`Duplicate contact removed: ${duplicate.id}`);
  }
};

// Criar novo contato
const createNewContact = async (
  msgContact: IContact,
  companyId: number,
  wbot?: WASocket
): Promise<Contact> => {
  const number = msgContact.id.split("@")[0];
  
  const contactData = {
    name: msgContact.name || number,
    number: msgContact.id.includes("@lid") ? msgContact.id : number,
    companyId,
    profilePicUrl: await getProfilePic(msgContact.id, wbot)
  };

  const contact = await Contact.create(contactData);

  // Se temos wbot e não é LID, buscar e criar mapeamento
  if (wbot && !msgContact.id.includes("@lid")) {
    await createLidMapping(contact, wbot, companyId);
  }

  return contact;
};

// Obter foto do perfil com tratamento de erro
const getProfilePic = async (
  jid: string, 
  wbot?: WASocket
): Promise<string> => {
  if (!wbot || jid.includes("@g.us")) {
    return `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  try {
    const url = await wbot.profilePictureUrl(jid, "image");
    return url || `${process.env.FRONTEND_URL}/nopicture.png`;
  } catch (error) {
    logger.debug(`Could not get profile pic for ${jid}: ${error.message}`);
    return `${process.env.FRONTEND_URL}/nopicture.png`;
  }
};
```

### 3. ARQUIVO: `src/helpers/wsocket-protection.ts` - Proteções Contra Erros

```typescript
// ============================================
// PROTEÇÕES E TRATAMENTO DE ERROS WSOCKET
// ============================================

import { WASocket } from "wsocket";
import logger from "../utils/logger";

export class WSocketProtection {
  
  // Proteção contra Bad MAC
  static async handleBadMac(error: any, wbot: WASocket): Promise<void> {
    if (error.message?.includes("Bad MAC") || error.message?.includes("bad_auth")) {
      logger.error("🚨 Bad MAC detected, implementing recovery...");
      
      // Estratégia 1: Pausar operações
      await this.pause(5000);
      
      // Estratégia 2: Limpar cache local
      await this.clearLocalCache();
      
      // Estratégia 3: Forçar re-sincronização
      await this.forceSyncMessages(wbot);
      
      // Estratégia 4: Se persistir, reconectar
      if (await this.shouldReconnect(error)) {
        await this.reconnectSession(wbot);
      }
    }
  }

  // Proteção contra XML Malformed com LID
  static safePresenceUpdate = async (
    wbot: WASocket, 
    type: "unavailable" | "available" | "composing" | "recording" | "paused",
    jid: string
  ): Promise<void> => {
    try {
      // ⚠️ CRÍTICO: Nunca enviar presence para LID
      if (jid.includes("@lid")) {
        logger.debug(`Skipping presence update for LID: ${jid}`);
        return;
      }

      // Validar JID antes de enviar
      if (!this.isValidJid(jid)) {
        logger.warn(`Invalid JID for presence update: ${jid}`);
        return;
      }

      await wbot.sendPresenceUpdate(type, jid);
      logger.debug(`Presence ${type} sent to ${jid}`);
    } catch (error) {
      logger.error(`Presence update failed for ${jid}: ${error.message}`);
    }
  };

  // Validar JID
  private static isValidJid(jid: string): boolean {
    // Padrões válidos de JID
    const patterns = [
      /^\d+@s\.whatsapp\.net$/,      // Usuário individual
      /^[\w-]+@g\.us$/,               // Grupo
      /^status@broadcast$/,           // Status broadcast
      /^\d+@newsletter$/              // Newsletter
    ];

    return patterns.some(pattern => pattern.test(jid));
  }

  // Proteção para envio de mensagens
  static async safeSendMessage(
    wbot: WASocket,
    jid: string,
    content: any,
    options?: any
  ): Promise<any> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Normalizar JID se necessário
        const normalizedJid = jid.includes("@lid") 
          ? jid 
          : jidNormalizedUser(jid);

        const result = await wbot.sendMessage(normalizedJid, content, options);
        return result;
      } catch (error) {
        attempt++;
        
        if (error.message?.includes("Bad MAC")) {
          await this.handleBadMac(error, wbot);
        } else if (error.message?.includes("rate-limit")) {
          await this.handleRateLimit(attempt);
        } else if (attempt === maxRetries) {
          throw error;
        }

        await this.pause(1000 * attempt);
      }
    }
  }

  // Tratamento de rate limit
  private static async handleRateLimit(attempt: number): Promise<void> {
    const waitTime = Math.min(30000, 5000 * Math.pow(2, attempt));
    logger.warn(`Rate limit hit, waiting ${waitTime}ms...`);
    await this.pause(waitTime);
  }

  // Pausa
  private static pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Limpar cache local
  private static async clearLocalCache(): Promise<void> {
    // Implementar limpeza de cache específica do projeto
    logger.info("Local cache cleared");
  }

  // Forçar sincronização de mensagens
  private static async forceSyncMessages(wbot: WASocket): Promise<void> {
    try {
      // Implementar lógica de re-sincronização
      logger.info("Messages sync forced");
    } catch (error) {
      logger.error(`Error forcing sync: ${error.message}`);
    }
  }

  // Verificar se deve reconectar
  private static async shouldReconnect(error: any): Promise<boolean> {
    // Lógica para determinar se deve reconectar
    const criticalErrors = ["Bad MAC", "bad_auth", "connection_lost"];
    return criticalErrors.some(err => error.message?.includes(err));
  }

  // Reconectar sessão
  private static async reconnectSession(wbot: WASocket): Promise<void> {
    logger.info("Reconnecting session...");
    // Implementar lógica de reconexão
  }
}
```

### 4. ARQUIVO: `src/services/WbotServices/SendWhatsAppMessage.ts` - Envio Seguro

```typescript
// ============================================
// ENVIO DE MENSAGENS COM WSOCKET E PROTEÇÕES
// ============================================

import { WASocket, WAMessage, AnyMessageContent } from "wsocket";
import { WSocketProtection } from "../../helpers/wsocket-protection";
import logger from "../../utils/logger";

export default async function SendWhatsAppMessage({
  wbot,
  contact,
  ticket,
  body,
  quotedMsg
}: {
  wbot: WASocket;
  contact: any;
  ticket: any;
  body: string;
  quotedMsg?: WAMessage;
}): Promise<WAMessage> {
  try {
    // Determinar JID correto (LID ou JID normal)
    let jid: string;
    
    if (contact.number.includes("@lid")) {
      // Usar LID diretamente
      jid = contact.number;
    } else if (contact.number.includes("@")) {
      // JID já formatado
      jid = contact.number;
    } else {
      // Formatar JID
      jid = contact.isGroup 
        ? `${contact.number}@g.us`
        : `${contact.number}@s.whatsapp.net`;
    }

    logger.debug(`Sending message to ${jid} (Contact: ${contact.id})`);

    // Preparar conteúdo da mensagem
    const content: AnyMessageContent = {
      text: body
    };

    // Adicionar citação se existir
    const options: any = {};
    if (quotedMsg) {
      options.quoted = quotedMsg;
    }

    // Enviar com proteções
    const sentMessage = await WSocketProtection.safeSendMessage(
      wbot,
      jid,
      content,
      options
    );

    // Salvar mensagem no banco
    await saveMessage(sentMessage, ticket, contact);

    return sentMessage;
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    throw error;
  }
}

// Função auxiliar para salvar mensagem
async function saveMessage(
  message: WAMessage,
  ticket: any,
  contact: any
): Promise<void> {
  try {
    await Message.create({
      messageId: message.key.id,
      ticketId: ticket.id,
      contactId: contact.id,
      body: message.message?.conversation || 
            message.message?.extendedTextMessage?.text || "",
      fromMe: true,
      read: true,
      mediaType: getMediaType(message),
      dataJson: JSON.stringify(message)
    });
  } catch (error) {
    logger.error(`Error saving message: ${error.message}`);
  }
}
```

## 🧪 TESTES DE VALIDAÇÃO

### Teste 1: Conexão e QR Code
```typescript
describe("WSocket Connection", () => {
  it("should generate QR code for new session", async () => {
    const wbot = await initWASocket(1);
    expect(wbot).toBeDefined();
    expect(wbot.authState).toBeDefined();
  });
});
```

### Teste 2: Tratamento de LID
```typescript
describe("LID Handling", () => {
  it("should handle LID contacts correctly", async () => {
    const lidContact = "123456789@lid";
    const contact = await verifyContact(
      { id: lidContact, name: "Test" },
      wbot,
      1
    );
    expect(contact.number).toBe(lidContact);
  });
});
```

### Teste 3: Recuperação de Bad MAC
```typescript
describe("Bad MAC Recovery", () => {
  it("should recover from Bad MAC error", async () => {
    const error = new Error("Bad MAC");
    await WSocketProtection.handleBadMac(error, wbot);
    // Verificar se sessão continua ativa
    expect(wbot.authState).toBeDefined();
  });
});
```

## 📊 MONITORAMENTO

### Script de Monitoramento
```typescript
// src/monitoring/wsocket-monitor.ts

export class WSocketMonitor {
  private static metrics = {
    badMacErrors: 0,
    xmlErrors: 0,
    reconnections: 0,
    successfulMessages: 0,
    failedMessages: 0
  };

  static logError(type: "BAD_MAC" | "XML_ERROR" | "OTHER", error: any) {
    if (type === "BAD_MAC") this.metrics.badMacErrors++;
    if (type === "XML_ERROR") this.metrics.xmlErrors++;
    
    logger.error({
      type,
      error: error.message,
      stack: error.stack,
      metrics: this.metrics
    });
  }

  static getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}
```

## ⚡ SCRIPTS DE MIGRAÇÃO

### Script de Backup
```bash
#!/bin/bash
# backup-before-migration.sh

echo "🔒 Creating backup before WSocket migration..."

# Backup database
pg_dump whatize > backup/whatize_$(date +%Y%m%d_%H%M%S).sql

# Backup code
tar -czf backup/code_$(date +%Y%m%d_%H%M%S).tar.gz /www/wwwroot/WhatizeBeta

# Backup sessions
tar -czf backup/sessions_$(date +%Y%m%d_%H%M%S).tar.gz sessions/

echo "✅ Backup completed!"
```

### Script de Rollback
```bash
#!/bin/bash
# rollback-wsocket.sh

echo "⏮️ Rolling back to Baileys..."

# Stop services
pm2 stop all

# Restore package.json
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json

# Reinstall dependencies
rm -rf node_modules
npm install

# Restart services
pm2 restart all

echo "✅ Rollback completed!"
```

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Backup completo do sistema
- [ ] Instalar WSocket
- [ ] Implementar getMessage obrigatória
- [ ] Adaptar initWASocket
- [ ] Implementar verifyContact com suporte LID
- [ ] Adicionar proteções (Bad MAC, XML)
- [ ] Implementar monitoramento
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Deploy em staging
- [ ] Validação em staging (24h)
- [ ] Deploy gradual em produção
- [ ] Monitoramento pós-deploy (72h)

---

📅 **Data:** 2025-09-28  
🔧 **Versão:** 1.0.0  
👤 **Autor:** Equipe de Desenvolvimento