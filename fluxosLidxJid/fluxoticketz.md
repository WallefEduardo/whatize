🔍 INVESTIGAÇÃO COMPLETA - FLUXO LID/JID NO TICKETZ

✅ ANÁLISE DETALHADA DA ESTRUTURA TICKETZ

Após investigação minuciosa do código do Ticketz, identifiquei como funciona o tratamento LID/JID:

📊 1. MODELO WhatsappLidMap

Tabela de mapeamento: lid → contactId + companyId

Índices otimizados: lid e companyId

Constraint único: lid + companyId

Cascade delete: Remove mapeamento quando contato é deletado

🎯 2. FLUXO verifyContact.ts - CORAÇÃO DO SISTEMA

ENTRADA DE MENSAGEM:

Detecta tipo: Se é @lid ou JID normal

Busca inteligente:

Para LID: Busca exato, depois mapeamento, depois parcial

Para JID: Busca contato, se não tem mapeamento chama onWhatsApp()

LÓGICA DE DEDUPLICAÇÃO PROATIVA:

checkAndDedup(): Migra mensagens + tickets + deleta LID duplicado

Mutex exclusivo: Previne race conditions

Busca Op.or: Encontra variações do número LID

MAPEAMENTO AUTOMÁTICO:

Quando JID aparece, verifica se existe LID relacionado

Cria mapeamento WhatsappLidMap automaticamente

Executa deduplicação se encontra LID existente

📨 3. FLUXO wbotMessageListener.ts

getContactMessage(): Extrai ID da mensagem (pode ser LID)

verifyContact(): Chama a lógica principal de verificação

Processamento sequencial: Recebe → Verifica contato → Processa mensagem

🚀 4. ENVIO SendWhatsAppMessage.ts

getJidOf(): Resolve número do contato para JID

Lógica simples: Se já tem @ usa direto, senão adiciona domínio

Fallback robusto: O mapeamento LID resolve automaticamente

🔄 FLUXO COMPLETO TICKETZ:

Recebe mensagem com LID (ex: 253725780217903@lid)

verifyContact busca contato existente com esse LID

Se não encontra, busca mapeamento em WhatsappLidMap

Se não tem mapeamento, busca número parcial

Quando JID real aparece, chama onWhatsApp() para pegar LID

Executa checkAndDedup() - migra dados e deleta duplicado

Cria mapeamento LID→Contact em WhatsappLidMap

Próximas mensagens usam mapeamento para encontrar contato real

💡 DIFERENCIAL CRÍTICO:

Deduplicação PROATIVA: Não espera usuário fazer nada

Busca inteligente: Op.or para variações do número

Mapeamento automático: Sistema self-healing

Mutex para concorrência: Evita duplicações em alta carga

O Ticketz NÃO resolve LID imediatamente - deixa usuário conversar com LID e só deduplica quando JID real aparece naturalmente no sistema.