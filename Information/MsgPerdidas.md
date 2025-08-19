Diagnóstico do Problema "Aguardando Mensagem" no iOS
Causa Raiz Identificada

O problema está relacionado ao manuseio duplo de sessões Axolotl (protocolo de criptografia do WhatsApp) quando o sistema alterna entre LID e JID. Isso causa:

Duas sessões de criptografia diferentes para o mesmo contato

iOS não consegue decriptar mensagens enviadas com a sessão errada

Mensagens ficam em "Aguardando Mensagem" indefinidamente

Descobertas da Investigação

Sistema Atual: Usa getJidOf() que detecta LID mas sempre retorna o JID armazenado

Problema: Quando recebe mensagem com LID, responde com JID (ou vice-versa)

iOS é mais sensível: Android tolera melhor essa inconsistência

📋 Plano de Solução
1. Rastrear Identificador da Última Mensagem

Adicionar campo lastMessageIdentifierType no modelo Ticket

Armazenar se última mensagem veio como LID ou JID

Usar sempre o mesmo tipo ao responder

2. Melhorar getJidOf() para Responder com Mesmo Tipo

Modificar função para aceitar parâmetro preferLid

Buscar e usar LID quando disponível se última mensagem foi LID

Manter JID quando última mensagem foi JID

3. Atualizar SendWhatsAppMessage

Detectar tipo do identificador na última mensagem recebida

Usar mesmo tipo ao enviar resposta

Adicionar logs para rastrear qual tipo está sendo usado

4. Implementar Cache de Sessão

Criar cache temporário para mapear contato → último tipo usado

Expirar cache após 24 horas

Prevenir alternância frequente entre LID/JID

5. Adicionar Fallback Inteligente

Se envio falhar com um tipo, tentar com o outro

Registrar qual funcionou para uso futuro

Atualizar mapeamento LID/JID conforme necessário

6. Testes e Monitoramento

Adicionar logs específicos para rastrear uso de LID vs JID

Criar métricas para identificar taxa de falha por tipo

Testar especificamente com dispositivos iOS