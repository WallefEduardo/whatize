# 🔧 PLANO DE CORREÇÃO - Erro "Cannot read properties of undefined (reading 'number')"

## 📋 PROBLEMA IDENTIFICADO
**Data:** 22/08/2025  
**Ambiente:** Produção  
**Severidade:** CRÍTICA

### Sintomas:
1. Loop infinito de tentativas de obtenção do WhatsApp Bot (getWbot)
2. Erro repetitivo: `Cannot read properties of undefined (reading 'number')` em `getJidOf.ts:8`
3. Todas as 33 sessões WhatsApp com status `readyState: unknown`
4. Impossibilidade de enviar mensagens pelo sistema
5. Logs repetitivos gerando alta carga no servidor

### Causa Raiz:
- O serviço `wbotClosedTickets.ts` está buscando tickets **SEM incluir o modelo Contact**
- Quando o ticket chega em `getJidOf.ts`, tenta acessar `ticket.contact.number` mas contact está `undefined`
- Isso gera erro que causa loop infinito de tentativas

## ⚠️ IMPORTANTE - PRESERVAÇÃO DE FUNCIONALIDADES

**ESTE PLANO NÃO QUEBRA O TRATAMENTO LID/JID EXISTENTE**

As correções propostas:
- ✅ **MANTÊM** toda lógica de unificação LID/JID intacta
- ✅ **APENAS** adicionam validações e includes faltantes
- ✅ **MELHORAM** tratamento de erros sem alterar fluxo principal
- ✅ **SÃO** retrocompatíveis com código existente
- ✅ **NÃO ALTERAM** mapeamento WhatsappLidMap
- ✅ **NÃO MODIFICAM** lógica de verificação de contatos

## 📝 PLANO DE EXECUÇÃO SEGURO

### FASE 1: Backup e Preparação (5 min)

```bash
# 1.1 - Criar backup do código atual
cd /caminho/do/seu/projeto
git add .
git commit -m "backup: antes da correção do erro contact.number undefined"
git push

# 1.2 - Criar branch para correções
git checkout -b fix/contact-undefined-error

# 1.3 - Verificar status atual e salvar logs
pm2 status > status_antes.txt
pm2 logs --lines 50 > logs_antes.txt
```

### FASE 2: Limpeza de Dependências e Sessões (10 min)

```bash
# 2.1 - Parar todos os serviços
pm2 stop all

# 2.2 - Limpar dependências do Backend
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 2.3 - Limpar dependências do Frontend
cd ../frontend
rm -rf node_modules package-lock.json build
npm cache clean --force
npm install

# 2.4 - Rebuild do Frontend
npm run build

# 2.5 - Limpar sessões problemáticas (MANTÉM dados de LID/JID)
cd ../backend
rm -rf .wwebjs_auth
rm -rf sessions
mkdir sessions
# IMPORTANTE: NÃO deletar tabela WhatsappLidMap ou dados de contatos
```

### FASE 3: Correções de Código SEGURAS (15 min)

#### 3.1 - Corrigir `backend/src/services/WbotServices/wbotClosedTickets.ts`

**⚠️ CRÍTICO: NÃO ALTERAR A LÓGICA, APENAS ADICIONAR INCLUDES**

**Adicionar no topo do arquivo:**
```typescript
import Contact from "../../models/Contact";
```

**Localizar e modificar TODOS os `Ticket.findAll` no arquivo:**

```typescript
// LINHA ~65-67 - Primeiro findAll (tickets para mensagem de inatividade)
const ticketsForInactiveMessage = await Ticket.findAll({
  where: whereCondition1,
  include: [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "number", "name", "isGroup", "companyId"]
    }
  ]
});

// LINHA ~102 - Segundo findAll (tickets expirados)
const tickets = await Ticket.findAll({
  where: whereCondition,
  include: [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "number", "name", "isGroup", "companyId"]
    }
  ]
});

// LINHA ~152 - Terceiro findAll (tickets para completar)
const ticketsComplete = await Ticket.findAll({
  where: whereCondition,
  include: [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "number", "name", "isGroup", "companyId"]
    }
  ]
});
```

#### 3.2 - Adicionar Validação SEGURA em `backend/src/services/WbotServices/getJidOf.ts`

**ADICIONAR validação SEM quebrar funcionalidade LID/JID:**

```typescript
// Adicionar no topo se não existir:
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";

export async function getJidOf(reference: string | Contact | Ticket) {
  console.log("🔍 [WHATIZE-TICKETZ] getJidOf - INPUT:", {
    type: reference instanceof Contact ? "Contact" : reference instanceof Ticket ? "Ticket" : "string",
    reference: reference instanceof Contact ? { id: reference.id, number: reference.number, isGroup: reference.isGroup } :
               reference instanceof Ticket ? { 
                 id: reference.id, 
                 hasContact: !!reference.contact,
                 contactNumber: reference.contact?.number, 
                 isGroup: reference.isGroup 
               } :
               reference
  });

  let address = reference;
  let isGroup = false;
  
  if (reference instanceof Contact) {
    isGroup = reference.isGroup;
    address = reference.number;
    console.log("🔍 [WHATIZE-TICKETZ] getJidOf - Contact detected:", { contactId: reference.id, number: reference.number, isGroup });
    
  } else if (reference instanceof Ticket) {
    // NOVA VALIDAÇÃO - Não quebra funcionalidade existente
    if (!reference.contact) {
      console.log("⚠️ [WHATIZE-TICKETZ] getJidOf - WARNING: Ticket without contact, attempting reload", { 
        ticketId: reference.id 
      });
      
      // Tentar recarregar o ticket com contact
      try {
        await reference.reload({
          include: [{
            model: Contact,
            as: "contact",
            attributes: ["id", "number", "name", "isGroup", "companyId"]
          }]
        });
        console.log("✅ [WHATIZE-TICKETZ] getJidOf - Contact reloaded successfully");
      } catch (error) {
        console.error("❌ [WHATIZE-TICKETZ] getJidOf - Failed to reload contact:", error);
      }
    }
    
    // Validação final
    if (!reference.contact || !reference.contact.number) {
      console.log("❌ [WHATIZE-TICKETZ] getJidOf - ERROR: Ticket without contact after reload", { 
        ticketId: reference.id 
      });
      throw new Error(`Ticket ${reference.id} does not have contact loaded`);
    }
    
    isGroup = reference.isGroup;
    address = reference.contact.number;
    console.log("🔍 [WHATIZE-TICKETZ] getJidOf - Ticket detected:", { 
      ticketId: reference.id, 
      contactNumber: reference.contact.number, 
      isGroup 
    });
  }

  if (typeof address !== "string") {
    console.log("❌ [WHATIZE-TICKETZ] getJidOf - ERROR: Invalid reference type", { address, type: typeof address });
    throw new Error("Invalid reference type");
  }

  console.log("🔍 [WHATIZE-TICKETZ] getJidOf - Address extracted:", { address, isGroup });

  // MANTÉM TODA LÓGICA LID/JID EXISTENTE
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
```

#### 3.3 - Melhorar `backend/src/services/WbotServices/SendWhatsAppMessage.ts`

**Localizar a chamada para getJidOf (linha ~58) e adicionar proteção:**

```typescript
// Adicionar no topo se não existir:
import Contact from "../../models/Contact";

// SUBSTITUIR a linha que chama getJidOf por:
let jid;
try {
  // Garantir que o ticket tem contact carregado
  if (ticket && !ticket.contact) {
    console.log("⚠️ [SEND-MESSAGE] Ticket sem contact, recarregando...");
    await ticket.reload({
      include: [{
        model: Contact,
        as: "contact",
        attributes: ["id", "number", "name", "isGroup", "companyId"]
      }]
    });
  }
  
  jid = await getJidOf(ticket);
  
} catch (error) {
  console.error("❌ [SEND-MESSAGE] Erro ao obter JID:", error);
  
  // Tentar uma vez mais após recarregar
  if (ticket) {
    try {
      await ticket.reload({
        include: [{
          model: Contact,
          as: "contact",
          attributes: ["id", "number", "name", "isGroup", "companyId"]
        }]
      });
      jid = await getJidOf(ticket);
    } catch (retryError) {
      console.error("❌ [SEND-MESSAGE] Falha após retry:", retryError);
      throw retryError;
    }
  } else {
    throw error;
  }
}
```

### FASE 4: Compilação e Reinicialização (10 min)

```bash
# 4.1 - Compilar TypeScript
cd backend
npm run build

# 4.2 - Verificar se build passou sem erros
if [ $? -eq 0 ]; then
  echo "✅ Build concluído com sucesso"
else
  echo "❌ Erro no build - verificar código"
  exit 1
fi

# 4.3 - Reiniciar serviços
cd ..
pm2 restart all

# 4.4 - Monitorar logs (deixar rodando por 2-3 minutos)
pm2 logs --lines 100

# 4.5 - Verificar se erros pararam
grep "Cannot read properties of undefined" ~/.pm2/logs/whatize-backend-error.log | tail -20
```

### FASE 5: Validação Completa (10 min)

#### Checklist de Validação OBRIGATÓRIA:

- [ ] ✅ Logs não mostram mais loop de `getWbot`
- [ ] ✅ Erro `Cannot read properties of undefined` parou
- [ ] ✅ Mensagens estão sendo enviadas normalmente
- [ ] ✅ Sistema identifica corretamente contatos com LID
- [ ] ✅ Sistema identifica corretamente contatos com JID
- [ ] ✅ **NÃO há duplicação de contatos**
- [ ] ✅ Mapeamento WhatsappLidMap continua funcionando
- [ ] ✅ Performance está normal
- [ ] ✅ Sessões WhatsApp voltaram ao status "connected"

#### Comandos de Verificação:

```bash
# 1. Verificar status das sessões
pm2 status

# 2. Verificar que não há mais erros de contact undefined
tail -f ~/.pm2/logs/whatize-backend-error.log | grep -v "Cannot read properties"

# 3. Verificar mapeamento LID/JID (NO BANCO DE DADOS)
# Conectar ao PostgreSQL e executar:
psql -U seu_usuario -d seu_banco -c "
SELECT COUNT(*) as total_mappings 
FROM \"WhatsappLidMaps\" 
WHERE \"createdAt\" > NOW() - INTERVAL '1 hour';
"

# 4. Verificar que não há duplicação de contatos
psql -U seu_usuario -d seu_banco -c "
SELECT number, COUNT(*) as count 
FROM \"Contacts\" 
WHERE \"companyId\" = 37
GROUP BY number 
HAVING COUNT(*) > 1;
"

# 5. Verificar race conditions
tail -f backend/logs/race_conditions.log

# 6. Monitorar CPU e memória
pm2 monit
```

## 🚨 ROLLBACK DE EMERGÊNCIA

Se algo der errado, fazer rollback IMEDIATO:

```bash
# 1. Parar serviços
pm2 stop all

# 2. Voltar ao commit anterior
git stash
git checkout main
git pull

# 3. Reinstalar dependências originais
cd backend
npm install
cd ../frontend
npm install
npm run build

# 4. Reiniciar
cd ..
pm2 restart all

# 5. Verificar logs
pm2 logs --lines 50
```

## 📊 MÉTRICAS DE SUCESSO ESPERADAS

Após aplicar as correções com sucesso:

1. **Redução de 100%** nos erros `Cannot read properties of undefined`
2. **Eliminação total** do loop de reconexão
3. **Melhora de 50%+** no tempo de resposta do envio de mensagens
4. **Estabilidade** nas sessões WhatsApp (readyState = "connected")
5. **Redução de 70%** no uso de CPU
6. **Redução de 40%** no uso de memória
7. **ZERO duplicação** de contatos
8. **Mapeamento LID/JID** funcionando perfeitamente

## 🔍 MONITORAMENTO PÓS-CORREÇÃO (24h)

Criar script de monitoramento contínuo:

```bash
#!/bin/bash
# Salvar como: monitor_fix.sh

LOG_FILE="monitor_contact_fix.log"

while true; do
  echo "=== $(date) ===" >> $LOG_FILE
  
  # Status PM2
  pm2 status --no-color >> $LOG_FILE
  
  # Contar erros
  ERROR_COUNT=$(grep -c "Cannot read properties" ~/.pm2/logs/whatize-backend-error.log 2>/dev/null || echo 0)
  echo "Erros 'undefined': $ERROR_COUNT" >> $LOG_FILE
  
  # Verificar sessões
  SESSIONS=$(pm2 logs --nostream --lines 1 | grep -c "readyState: unknown" || echo 0)
  echo "Sessões unknown: $SESSIONS" >> $LOG_FILE
  
  # CPU e Memória
  pm2 list --no-color | grep whatize >> $LOG_FILE
  
  echo "---" >> $LOG_FILE
  sleep 300 # 5 minutos
done
```

Executar: `chmod +x monitor_fix.sh && nohup ./monitor_fix.sh &`

## 📝 NOTAS CRÍTICAS DE SEGURANÇA

### O que NÃO MODIFICAR:
1. **NUNCA** alterar tabela `WhatsappLidMaps`
2. **NUNCA** modificar lógica de `verifyContact.ts`
3. **NUNCA** alterar estrutura de `Contact` model
4. **NUNCA** mudar lógica de conversão LID↔JID
5. **NUNCA** deletar dados de mapeamento existentes

### O que SEMPRE fazer:
1. **SEMPRE** fazer backup antes
2. **SEMPRE** testar em desenvolvimento primeiro
3. **SEMPRE** verificar duplicação de contatos após correção
4. **SEMPRE** monitorar por 24h após aplicar
5. **SEMPRE** ter plano de rollback pronto

## ✅ RESULTADO FINAL ESPERADO

Após aplicar TODAS as correções corretamente:

- ✅ Sistema volta a enviar mensagens normalmente
- ✅ Não há mais loops infinitos de reconexão
- ✅ Performance melhora drasticamente
- ✅ Logs ficam limpos e informativos
- ✅ **Tratamento LID/JID continua 100% funcional**
- ✅ **Sem duplicação de contatos**
- ✅ **Mapeamento WhatsappLidMap preservado**
- ✅ Todas as funcionalidades existentes mantidas

## 🆘 SUPORTE

Em caso de problemas:

1. **Primeiro:** Verificar se todos os includes foram adicionados
2. **Segundo:** Confirmar que imports estão corretos
3. **Terceiro:** Verificar logs detalhados com grep
4. **Quarto:** Validar que banco de dados está acessível
5. **Se nada funcionar:** Fazer rollback e investigar com calma

---

**Documento criado em:** 22/08/2025  
**Versão:** 2.0  
**Autor:** Sistema de Correção Automatizada  
**Criticidade:** ALTA  
**Ambiente de Origem:** Produção  
**Destino:** Aplicação em DESENVOLVIMENTO primeiro, depois Produção  
**Preserva:** 100% da funcionalidade LID/JID