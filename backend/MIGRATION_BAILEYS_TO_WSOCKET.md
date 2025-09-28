# 📋 PLANO DE MIGRAÇÃO: BAILEYS → WSOCKET

## 🎯 OBJETIVO
Migrar o sistema de Baileys (v6.7.18) para WSocket para resolver problemas críticos de:
- ❌ **Bad MAC errors** que causam crashes constantes
- ❌ **XML malformed errors** em operações com LID
- ❌ **Instabilidade em sessões de longa duração**
- ❌ **Problemas de reconexão após falhas**

## 🔍 ANÁLISE COMPARATIVA

### Baileys Atual (v6.7.18)
```json
{
  "versão": "6.7.18",
  "problemas": [
    "Bad MAC errors frequentes",
    "XML corruption com sendPresenceUpdate em LID",
    "Problemas de deduplicação de contatos",
    "Instabilidade em reconexões"
  ]
}
```

### WSocket (Ticketz)
```json
{
  "baseado": "Fork modificado do Baileys",
  "vantagens": [
    "Tratamento melhorado de erros de sessão",
    "Sistema LID/JID mais estável",
    "Menos crashes por Bad MAC",
    "Melhor gestão de reconexões"
  ]
}
```

## 🏗️ ARQUITETURA DE MIGRAÇÃO

### Componentes Afetados
1. **Core WhatsApp** (`/src/libs/wbot.ts`)
2. **Message Listener** (`/src/services/WbotServices/wbotMessageListener.ts`)
3. **Contact Management** (`/src/services/WbotServices/verifyContact.ts`)
4. **Send Services** (`/src/services/WbotServices/Send*.ts`)
5. **Session Management** (`/src/services/WbotServices/StartWhatsAppSession.ts`)

### Mapeamento de Funções Críticas

| Baileys | WSocket | Mudança Necessária |
|---------|---------|-------------------|
| `makeWASocket()` | `makeWASocket()` | Ajustar configurações de sessão |
| `downloadMediaMessage()` | `downloadMediaMessage()` | Sem mudança |
| `jidNormalizedUser()` | `jidNormalizedUser()` | Sem mudança |
| `sendPresenceUpdate()` | `sendPresenceUpdate()` | Adicionar proteções para LID |
| `getMessage()` | `getMessage()` | Implementação obrigatória correta |

## 📋 PLANO DE MIGRAÇÃO EM FASES

### 🚀 FASE 0: PREPARAÇÃO (2-3 dias)
**Objetivo:** Preparar ambiente sem afetar produção

#### Tasks:
1. **Backup Completo**
   ```bash
   # Backup do código
   cp -r /www/wwwroot/WhatizeBeta /www/wwwroot/WhatizeBeta_backup_$(date +%Y%m%d)
   
   # Backup do banco de dados
   pg_dump whatize > whatize_backup_$(date +%Y%m%d).sql
   
   # Backup das sessões WhatsApp
   cp -r /www/wwwroot/WhatizeBeta/backend/.wwebjs_auth /www/wwwroot/WhatizeBeta_backup_sessions
   ```

2. **Criar Branch de Migração**
   ```bash
   git checkout -b migration/wsocket-integration
   git push -u origin migration/wsocket-integration
   ```

3. **Análise de Dependências**
   - Identificar todas as importações de `baileys`
   - Mapear funções customizadas
   - Documentar comportamentos específicos

### 🔧 FASE 1: INSTALAÇÃO E CONFIGURAÇÃO (1 dia)

#### Tasks:
1. **Instalar WSocket**
   ```bash
   # Remover Baileys atual
   npm uninstall baileys
   
   # Instalar WSocket
   npm install github:renatoiub/WSocket#main
   ```

2. **Ajustar package.json**
   ```json
   {
     "dependencies": {
       "wsocket": "github:renatoiub/WSocket#main"
     }
   }
   ```

3. **Criar Adapter Layer**
   ```typescript
   // src/libs/wsocket-adapter.ts
   export * from 'wsocket';
   
   // Adicionar funções de compatibilidade se necessário
   export const legacyAdapter = {
     // Mapeamento de funções antigas para novas
   };
   ```

### 🔄 FASE 2: MIGRAÇÃO DO CORE (3-4 dias)

#### 2.1 - Session Management
**Arquivo:** `src/libs/wbot.ts`

```typescript
// ANTES (Baileys)
import makeWASocket, { 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore  // ⚠️ Não usar com WSocket
} from "baileys";

// DEPOIS (WSocket)
import makeWASocket, { 
  DisconnectReason, 
  fetchLatestBaileysVersion
  // Remover makeCacheableSignalKeyStore
} from "wsocket";
```

**Mudanças Críticas:**
1. Remover `makeCacheableSignalKeyStore`
2. Implementar `getMessage` corretamente
3. Ajustar auth state management

#### 2.2 - Message Handler Implementation
**Arquivo:** `src/services/WbotServices/wbotMessageListener.ts`

```typescript
// Implementação getMessage OBRIGATÓRIA
const getMessage = async (key: proto.IMessageKey): Promise<proto.IMessage | undefined> => {
  if (!key.id) return undefined;
  
  // Buscar mensagem do banco de dados
  const msg = await Message.findOne({
    where: { 
      messageId: key.id,
      remoteJid: key.remoteJid
    }
  });
  
  if (msg) {
    return proto.Message.fromObject(JSON.parse(msg.dataJson));
  }
  
  return undefined;
};
```

#### 2.3 - Contact Verification Enhancement
**Arquivo:** `src/services/WbotServices/verifyContact.ts`

Implementar melhorias do Ticketz:
```typescript
// Adicionar tratamento melhorado de LID/JID
export async function verifyContact(
  msgContact: IMe,
  wbot: any,
  companyId: number
): Promise<Contact> {
  // Usar jidNormalizedUser para padronização
  const normalizedJid = jidNormalizedUser(msgContact.id);
  
  // Implementar mutex para evitar race conditions
  return contactMutex.runExclusive(async () => {
    // Lógica de verificação com proteções adicionais
    // ...
  });
}
```

### 🛡️ FASE 3: PROTEÇÕES E TRATAMENTO DE ERROS (2 dias)

#### 3.1 - Bad MAC Protection
```typescript
// src/helpers/wsocket-error-handler.ts
export class WSocketErrorHandler {
  static handleBadMac(error: any, wbot: any) {
    if (error.message?.includes('Bad MAC')) {
      logger.error('Bad MAC detected, attempting recovery...');
      
      // Estratégia 1: Limpar cache de mensagens
      clearMessageCache();
      
      // Estratégia 2: Recriar sessão se necessário
      if (shouldRecreateSession(error)) {
        recreateSession(wbot);
      }
    }
  }
}
```

#### 3.2 - XML Protection for LID
```typescript
// Proteção para sendPresenceUpdate com LID
const safePresenceUpdate = async (wbot: any, type: string, jid: string) => {
  try {
    // Nunca enviar presence para LID (causa XML corruption)
    if (!jid.includes('@lid')) {
      await wbot.sendPresenceUpdate(type, jid);
    }
  } catch (error) {
    logger.error(`Presence update failed: ${error.message}`);
  }
};
```

#### 3.3 - Reconnection Strategy
```typescript
// Estratégia de reconexão melhorada
const handleDisconnect = async (reason: DisconnectReason) => {
  switch (reason) {
    case DisconnectReason.badSession:
      // Limpar sessão e reconectar
      await clearSession();
      await reconnect();
      break;
      
    case DisconnectReason.connectionLost:
      // Aguardar e tentar reconexão
      await delay(5000);
      await reconnect();
      break;
      
    default:
      // Log e análise
      logger.error(`Disconnect reason: ${reason}`);
  }
};
```

### 🧪 FASE 4: TESTES E VALIDAÇÃO (3-4 dias)

#### 4.1 - Unit Tests
```typescript
// __tests__/wsocket-migration.spec.ts
describe('WSocket Migration', () => {
  it('should handle LID contacts correctly', async () => {
    // Teste de criação/atualização de contato LID
  });
  
  it('should recover from Bad MAC error', async () => {
    // Simular e testar recuperação de Bad MAC
  });
  
  it('should maintain message history', async () => {
    // Verificar integridade de mensagens após migração
  });
});
```

#### 4.2 - Integration Tests
- [ ] Teste de conexão inicial (QR Code)
- [ ] Teste de envio de mensagens (texto, mídia)
- [ ] Teste de recebimento de mensagens
- [ ] Teste de grupos
- [ ] Teste de reconexão após falha
- [ ] Teste de múltiplas sessões simultâneas

#### 4.3 - Stress Tests
```bash
# Script de teste de carga
npm run test:stress -- --connections=10 --messages=1000
```

### 🚀 FASE 5: DEPLOYMENT GRADUAL (2-3 dias)

#### 5.1 - Staging Environment
1. Deploy em ambiente de teste
2. Migrar uma conexão de teste
3. Monitorar por 24 horas
4. Coletar métricas e logs

#### 5.2 - Production Rollout (Gradual)
```yaml
# Estratégia de rollout
Dia 1: 10% das conexões
Dia 2: 25% das conexões  
Dia 3: 50% das conexões
Dia 4: 100% das conexões
```

#### 5.3 - Rollback Plan
```bash
#!/bin/bash
# rollback.sh
echo "🔄 Iniciando rollback..."

# Parar serviços
pm2 stop whatizeBeta-backend

# Restaurar código
rm -rf /www/wwwroot/WhatizeBeta
cp -r /www/wwwroot/WhatizeBeta_backup_$(date +%Y%m%d) /www/wwwroot/WhatizeBeta

# Reinstalar dependências
cd /www/wwwroot/WhatizeBeta/backend
npm install

# Reiniciar serviços
pm2 start whatizeBeta-backend
```

## 📊 MONITORAMENTO E MÉTRICAS

### KPIs para Acompanhamento
1. **Taxa de Bad MAC Errors** (deve reduzir > 90%)
2. **Uptime de Conexões** (meta: > 99%)
3. **Tempo Médio de Reconexão** (meta: < 10s)
4. **Taxa de Duplicação de Contatos** (meta: < 0.1%)

### Dashboard de Monitoramento
```typescript
// src/monitoring/wsocket-metrics.ts
export class WSocketMetrics {
  static track() {
    return {
      badMacErrors: 0,
      reconnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      activeSessions: 0,
      averageUptime: '0h'
    };
  }
}
```

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Perda de sessões | Média | Alto | Backup de auth state antes da migração |
| Incompatibilidade de API | Baixa | Alto | Adapter layer + testes extensivos |
| Degradação de performance | Baixa | Médio | Monitoramento + rollback rápido |
| Problemas com grupos | Média | Médio | Testes específicos para grupos |

## 📝 CHECKLIST FINAL

### Pré-Migração
- [ ] Backup completo realizado
- [ ] Branch de migração criado
- [ ] Documentação revisada
- [ ] Equipe alinhada

### Durante Migração
- [ ] WSocket instalado
- [ ] Core adaptado
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Staging validado

### Pós-Migração
- [ ] Produção estável por 72h
- [ ] Métricas dentro do esperado
- [ ] Documentação atualizada
- [ ] Equipe treinada

## 🔧 COMANDOS ÚTEIS

```bash
# Verificar versão atual
npm list baileys

# Instalar WSocket
npm install github:renatoiub/WSocket#main

# Rodar testes
npm test

# Verificar logs de erro
tail -f logs/wsocket-errors.log

# Monitorar conexões
pm2 monit

# Restart com limpeza de cache
pm2 restart whatizeBeta-backend --update-env
```

## 📚 REFERÊNCIAS

1. [WSocket Repository](https://github.com/renatoiub/WSocket)
2. [Ticketz Implementation](https://github.com/ticketz-oss/ticketz)
3. [Baileys Documentation](https://baileys.wiki)
4. [WhatsApp Web Protocol](https://github.com/sigalor/whatsapp-web-reveng)

## 🤝 SUPORTE E CONTATOS

- **Desenvolvedor WSocket:** @renatoiub (GitHub)
- **Comunidade Ticketz:** [GitHub Discussions](https://github.com/ticketz-oss/ticketz/discussions)
- **Documentação Baileys:** [baileys.wiki](https://baileys.wiki)

---

📅 **Criado em:** 2025-09-28  
📝 **Última Atualização:** 2025-09-28  
👤 **Responsável:** Equipe de Desenvolvimento  
🏷️ **Versão:** 1.0.0