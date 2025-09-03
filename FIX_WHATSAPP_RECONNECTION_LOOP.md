# 🔧 Correção do Loop de Reconexão WhatsApp - Guia de Implementação

## 📋 Sumário do Problema

### Problemas Identificados
1. **Loop infinito de reconexão** - Sessões WhatsApp reconectando constantemente após erro "stream:error conflict type:replaced"
2. **Todas as 32 sessões com estado `readyState: unknown`** - Conexões não funcionais
3. **Logs excessivos** - Sistema gerando milhares de logs por minuto
4. **Falha no recebimento de mensagens** - Tickets não sendo criados devido a sessões instáveis
5. **Múltiplas tentativas simultâneas** - Sem controle de rate limiting nas reconexões

### Causa Raiz
- Quando uma sessão WhatsApp desconecta com erro de conflito (outra sessão usando o mesmo número), o sistema tenta reconectar imediatamente (2 segundos)
- Não há verificação se já existe uma tentativa de reconexão em andamento
- Não há limite de tentativas de reconexão
- Logs de debug muito verbosos causando sobrecarga

## 🛠️ Arquivos a Serem Modificados

### 1. `/backend/src/libs/wbot.ts`
**Local das mudanças: Linhas 65-68 e 400-440**

### 2. `/backend/src/helpers/GetTicketWbot.ts`
**Local das mudanças: Linhas 11-34**

### 3. `/backend/src/services/WbotServices/StartWhatsAppSession.ts`
**Local das mudanças: Linhas 10-38**

## 📝 Implementação Detalhada

### PASSO 1: Adicionar Controle de Reconexão em `wbot.ts`

#### 1.1 Adicionar Maps de Controle (Após linha 67)

```typescript
// Adicionar após a linha 67 (const retriesQrCodeMap = new Map<number, number>();)

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
```

#### 1.2 Criar Função de Controle de Reconexão (Após linha 117)

```typescript
// Adicionar após a função getWbot (linha 117)

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
```

#### 1.3 Modificar Lógica de Desconexão (Linhas 400-440)

```typescript
// SUBSTITUIR as linhas 400-440 no evento connection.update com:

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

// Quando conectar com sucesso, limpar tentativas de reconexão
if (connection === "open") {
  clearReconnectionAttempts(id);
  // ... resto do código existente ...
}
```

#### 1.4 Reduzir Verbosidade dos Logs em getWbot (Linhas 99-116)

```typescript
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
```

### PASSO 2: Otimizar `GetTicketWbot.ts`

```typescript
import { WASocket } from "baileys";
import { getWbot } from "../libs/wbot";
import GetDefaultWhatsApp from "./GetDefaultWhatsApp";
import Ticket from "../models/Ticket";
import logger from "../utils/logger";

type Session = WASocket & {
  id?: number;
};

// Cache de sessões para reduzir logs
const wbotCache = new Map<number, { wbot: Session; timestamp: number }>();
const CACHE_TTL = 3000; // 3 segundos

const GetTicketWbot = async (ticket: Ticket): Promise<Session> => {
  // Log apenas em debug mode ou primeira vez
  const isDebugMode = process.env.DEBUG_WBOT === 'true';
  
  if (!ticket.whatsappId) {
    if (isDebugMode) {
      logger.info(`⚠️ [TICKET-WBOT] Ticket sem whatsappId, buscando WhatsApp padrão...`);
    }
    const defaultWhatsapp = await GetDefaultWhatsApp(ticket.companyId, ticket.whatsappId);
    await ticket.$set("whatsapp", defaultWhatsapp);
    await ticket.reload();
  }
  
  // Verificar cache
  const cached = wbotCache.get(ticket.whatsappId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.wbot;
  }
  
  try {
    const wbot = getWbot(ticket.whatsappId);
    
    // Atualizar cache
    wbotCache.set(ticket.whatsappId, {
      wbot,
      timestamp: Date.now()
    });
    
    return wbot;
  } catch (error) {
    logger.error(`❌ [TICKET-WBOT] Erro ao obter wbot para ticket ${ticket.id}: ${error.message}`);
    throw error;
  }
};

export default GetTicketWbot;
```

### PASSO 3: Adicionar Controle em `StartWhatsAppSession.ts`

```typescript
import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import logger from "../../utils/logger";
import PresenceService from "./PresenceService";
import * as Sentry from "@sentry/node";

// Controle de sessões em inicialização
const startingSessions = new Map<number, boolean>();

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  // Verificar se já está iniciando
  if (startingSessions.get(whatsapp.id)) {
    logger.warn(`⚠️ [START-SESSION] Sessão ${whatsapp.name} já está sendo iniciada. Ignorando duplicata.`);
    return;
  }
  
  startingSessions.set(whatsapp.id, true);
  
  try {
    await whatsapp.update({ status: "OPENING" });

    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-whatsappSession`, {
        action: "update",
        session: whatsapp
      });

    try {
      const wbot = await initWASocket(whatsapp);
     
      if (wbot.id) {
        wbotMessageListener(wbot, companyId);
        wbotMonitor(wbot, whatsapp, companyId);
        
        // Configurar listener de presence
        PresenceService.setupPresenceListener(wbot, companyId);
        logger.info(`✅ [START-SESSION] Sessão ${whatsapp.name} iniciada com sucesso`);
      }
    } catch (err) {
      logger.error(`❌ [START-SESSION] Erro ao iniciar sessão ${whatsapp.name}: ${err.message}`);
      Sentry.captureException(err);
      throw err;
    }
  } finally {
    // Sempre limpar o flag de inicialização
    startingSessions.delete(whatsapp.id);
  }
};
```

## 🔐 Proteções Importantes

### Preservar Lógica LID/JID
**IMPORTANTE:** Nenhuma das mudanças acima afeta o tratamento de LID/JID. Os arquivos relacionados ao mapeamento LID/JID não são modificados:
- `/backend/src/services/WbotServices/getJidOf.ts` - **NÃO MODIFICAR**
- `/backend/src/services/ContactServices/verifyContact.ts` - **NÃO MODIFICAR**
- `/backend/src/models/WhatsappLidMap.ts` - **NÃO MODIFICAR**

### Validações Críticas
1. Sempre verificar se a sessão já está sendo reconectada antes de iniciar nova tentativa
2. Manter limite máximo de tentativas de reconexão
3. Usar backoff exponencial para evitar sobrecarga
4. Limpar timeouts e maps quando sessão conectar com sucesso

## 📊 Configurações Recomendadas

### Variáveis de Ambiente (.env)
Adicionar ao arquivo `.env` do backend:

```bash
# Controle de reconexão WhatsApp
MAX_RECONNECTION_ATTEMPTS=5
RECONNECTION_BASE_DELAY=10000
RECONNECTION_MAX_DELAY=300000
DEBUG_WBOT=false
```

### Monitoramento
Para monitorar o sistema após as mudanças:

```bash
# Ver apenas logs de reconexão
pm2 logs whatize-backend | grep "RECONNECT-CONTROL"

# Ver status das sessões
pm2 logs whatize-backend | grep "WBOT-STATE"

# Ver erros de conexão
pm2 logs whatize-backend | grep "CONNECTION-ERROR"
```

## 🧪 Procedimento de Teste

### Ambiente de Desenvolvimento

1. **Backup do código atual**
   ```bash
   cp -r backend backend.backup
   ```

2. **Aplicar mudanças gradualmente**
   - Primeiro: Implementar controle de reconexão em `wbot.ts`
   - Testar com 1-2 sessões WhatsApp
   - Segundo: Adicionar cache em `GetTicketWbot.ts`
   - Terceiro: Adicionar controle em `StartWhatsAppSession.ts`

3. **Testes específicos**
   - Desconectar uma sessão manualmente e verificar reconexão controlada
   - Verificar se logs diminuíram significativamente
   - Confirmar que mensagens continuam sendo recebidas
   - Testar criação de novos tickets
   - Verificar que contatos não estão sendo duplicados

4. **Validação LID/JID**
   ```sql
   -- Verificar se não há duplicação de contatos após mudanças
   SELECT number, COUNT(*) as count 
   FROM Contacts 
   WHERE companyId = [ID_DA_EMPRESA]
   GROUP BY number 
   HAVING count > 1;
   ```

## 🚀 Deploy em Produção

### Pré-requisitos
1. Testes completos em desenvolvimento
2. Backup completo do banco de dados
3. Snapshot do servidor (se possível)

### Procedimento
1. **Horário de menor movimento** (madrugada recomendado)
2. **Aplicar mudanças**
   ```bash
   # Parar PM2
   pm2 stop whatize-backend
   
   # Aplicar mudanças
   # (copiar arquivos modificados)
   
   # Reiniciar
   pm2 start whatize-backend
   
   # Monitorar logs
   pm2 logs whatize-backend
   ```

3. **Rollback se necessário**
   ```bash
   pm2 stop whatize-backend
   cp -r backend.backup/* backend/
   pm2 start whatize-backend
   ```

## 📈 Métricas de Sucesso

Após implementação, você deve observar:
- ✅ Redução de 90% no volume de logs
- ✅ Sessões reconectando com delays progressivos
- ✅ Não mais de 5 tentativas de reconexão por sessão
- ✅ Mensagens sendo recebidas normalmente
- ✅ Tickets sendo criados corretamente
- ✅ Sem duplicação de contatos
- ✅ CPU e memória estáveis

## ⚠️ Avisos Importantes

1. **NÃO modificar** arquivos relacionados ao tratamento LID/JID
2. **Sempre testar** em desenvolvimento primeiro
3. **Manter backup** antes de qualquer mudança
4. **Monitorar** logs após implementação
5. **Ter plano de rollback** pronto

## 📞 Suporte

Em caso de problemas:
1. Verificar logs com `pm2 logs whatize-backend`
2. Procurar por padrões de erro com grep
3. Verificar se todas as mudanças foram aplicadas corretamente
4. Em último caso, fazer rollback e investigar com mais calma

---

**Documento criado em:** 21/08/2025  
**Versão:** 1.0  
**Autor:** Sistema de Análise Whatize  
**Criticidade:** ALTA - Sistema em Produção