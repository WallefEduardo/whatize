## Plano de Alinhamento LID/JID (Whatize x Ticketz)

### Objetivo
Alinhar o tratamento de LID/JID do `whatize` ao comportamento estável do `ticketz`, garantindo deduplicação correta de contatos/tickets e envio/recebimento de mensagens sem duplicidades ou quebras.

### Diagnóstico (diferenças relevantes)

- verifyContact (entrada LID x JID)
  - Ticketz: ao receber LID, procura mapeamento direto em `WhatsappLidMap` e usa o contato mapeado; também trata contato parcial (número sem `@lid`).
  - Whatize: AGORA ALINHADO. Implementado lookup em `WhatsappLidMap` para LID, fallback de parcial LID → full LID e resolução JID→LID com deduplicação e criação de mapping quando necessário.

  Evidências (Whatize atualizado):
  
  ```startLine:endLine:/home/eduardo_wallef/sistemas/DevsSystem/whatize/backend/src/services/WbotServices/verifyContact.ts
147:       // 2A.2 - Buscar via WhatsappLidMap
148:       const foundMappedContact = await WhatsappLidMap.findOne({
... existing code ...
165:       // 2A.3 - Busca parcial LID (fallback)
166:       const partialLidNumber = number.substring(0, number.indexOf("@"));
...
232:       // ========== ESTÁGIO 3: RESOLUÇÃO LID PARA NOVOS CONTATOS JID ==========
233:       if (wbot?.onWhatsApp) {
  ```

- wbotMessageListener (integração com verifyContact)
  - Ambos chamam `verifyContact` corretamente com base em `remoteJid`. No `whatize`, o fluxo é compatível, mas herda o problema do `verifyContact` acima quando a entrada é LID.

  ```startLine:endLine:/home/eduardo_wallef/sistemas/DevsSystem/whatize/backend/src/services/WbotServices/wbotMessageListener.ts
3094:     const isLid = msgContact.id.includes("@lid");
... existing code ...
3103:     const contact = await verifyContact(
3104:       msgContact.id,
3105:       msgContact.name,
3106:       companyId,
3107:       wbot.id,
3108:       isLid,
3109:       isContactGroup,
3110:       wbot
3111:     );
```

- SendWhatsAppMessage (envio e persistência das mensagens)
  - Ticketz: sempre resolve JID com `getJidOf()`, envia, dá `cacheMessage` e persiste via `verifyMessage/verifyMediaMessage`.
  - Whatize: resolve JID usando `contact.remoteJid` (ok para LID), mas ainda retorna o `sentMessage` antes de persistir/atualizar ticket (não chama `cacheMessage` e `verifyMessage/verifyMediaMessage`). Isso pode causar mensagens não persistidas.

  ```startLine:endLine:/home/eduardo_wallef/sistemas/DevsSystem/ticketz/backend/src/services/WbotServices/SendWhatsAppMessage.ts
79:     // Obter o JID antes de enviar para logar
80:     const targetJid = getJidOf(ticket);
... existing code ...
112:     wbot.cacheMessage(sentMessage);
... existing code ...
118:       await verifyMessage(sentMessage, ticket, ticket.contact);
```

  ```startLine:endLine:/home/eduardo_wallef/sistemas/DevsSystem/whatize/backend/src/services/WbotServices/SendWhatsAppMessage.ts
178:     try {
179:       const sentMessage = await wbot.sendMessage(number, messageData, sendOptions);
180:       
181:       logger.info(`✅ [SEND-MSG-INTERCEPT] DEPOIS do sendMessage: SUCESSO { messageId: ${sentMessage.key?.id} }`);
182:       return sentMessage;
```

- getJidOf
  - Ambos preservam JID/LID quando a string já contém `@` — alinhado.

  ```startLine:endLine:/home/eduardo_wallef/sistemas/DevsSystem/whatize/backend/src/services/WbotServices/getJidOf.ts
26:   if (address.includes("@")) {
27:     logger.info(`✅ [GET-JID] Já contém @, retornando: '${address}'`);
28:     return address;
```

- Presence para LID
  - Ticketz: bloqueia envio de `presence` para LID.
  - Whatize: também protege via `safePresenceUpdate` e serviços – alinhado.

  ```startLine:endLine:/home/eduardo_wallef/sistemas/DevsSystem/ticketz/backend/src/libs/wbot.ts
584:     const jid = getJidOf(ticket);
586:     if (jid.endsWith("@lid")) {
587:       return;
```

  ```startLine:endLine:/home/eduardo_wallef/sistemas/DevsSystem/whatize/backend/src/services/TypebotServices/typebotListener.ts
25: if (jid.endsWith("@lid")) {
26:   logger.debug(`🛡️ [TYPEBOT-PRESENCE-PROTECTION] Bloqueando envio de presence ${type} para LID: ${jid}`);
```

### Causas prováveis dos problemas restantes
- Deduplicação: a função `checkAndDedup` do `whatize` atualiza tickets apenas quando status != 'closed' e destrói o contato LID; isso pode deixar tickets fechados órfãos ou provocar deleção em cascata indesejada. O `ticketz` fecha tickets ativos do contato LID e reatribui TODOS os tickets ao contato principal, depois remove o duplicado.
- Envio de mensagens: ausência de `cacheMessage` e de `verifyMessage/verifyMediaMessage` após `sendMessage` faz com que a mensagem não seja persistida no histórico/ticket.

### Plano — somente itens pendentes

1) SendWhatsAppMessage (whatize)
   - Após `sendMessage`:
     - Chamar `wbot.cacheMessage(sentMessage)`;
     - Invocar `verifyMessage(sentMessage, ticket, ticket.contact)` ou `verifyMediaMessage` quando aplicável;
     - Só então retornar.
   - Manter estratégia atual de usar `contact.remoteJid` quando presente (preserva LID corretamente).

2) checkAndDedup (whatize)
   - Alinhar ao `ticketz`:
     - Fechar tickets não fechados do contato LID duplicado;
     - Reatribuir TODOS os tickets (incluindo fechados) para o contato principal;
     - Só então destruir o contato duplicado.

3) Migração/Índices (opcional – robustez)
   - Avaliar adicionar constraint única em `WhatsappLidMaps(companyId, lid)` e/ou `(companyId, contactId)` para evitar mapeamentos duplicados.

### Critérios de Aceite / Testes
- Cenário A: Receber primeiro em LID, depois em JID
  - Deve existir um único `Contact` e um único `Ticket`.
  - `WhatsappLidMap` deve apontar para o contato consolidado.

- Cenário B: Receber primeiro em JID, depois em LID
  - Deduplicação deve ocorrer (mensagens/ticket unificados).
  - `contact.number` deve ficar no formato JID normal (sem `@lid`), mantendo o mapping LID em `WhatsappLidMap`.

- Cenário C: Enviar mensagem para contato LID
  - Envio deve funcionar; presence para LID não deve ser emitido.
  - Mensagem enviada deve aparecer no histórico (persistida via `verifyMessage`).

- Cenário D: Contato parcial LID (sem `@lid`) aparece
  - Sistema deve atualizar para LID completo e não criar duplicatas.

### Checklist de implementação
- [ ] SendWhatsAppMessage: adicionar `cacheMessage` + `verifyMessage/verifyMediaMessage` antes do `return`.
- [ ] checkAndDedup: fechar tickets abertos do contato LID duplicado e reatribuir TODOS os tickets ao contato principal antes de destruir o duplicado.
- [ ] Testes manuais A/B/C/D e verificação de integridade do histórico.
- [ ] (Opcional) Constraint única em `WhatsappLidMaps`.

### Riscos e Rollback
- Risco de tocar dados sensíveis de contatos/tickets. Mitigar com rollout por empresa e backup lógico (dump) antes.
- Rollback: reverter commits e remover constraint única se criadas; não há migração destrutiva sugerida.

### Observações finais
- `getJidOf` já preserva LID em ambos os projetos — manter.
- Proteções de presence para LID já existem no `whatize` — manter e padronizar uso de helper seguro.

