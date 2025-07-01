# Plano de Melhorias do Sistema Whatize - ATUALIZADO

## Visão Geral
Este plano aborda quatro problemas principais identificados no sistema:
1. **Remoção do Tailwind CSS** - Conflitos com Material-UI
2. **Melhorias nos Filtros de Funil e Etapa Kanban** - Dependência condicional
3. **Correção do Comportamento das Tabs** - Manter visibilidade durante filtros
4. **Aprimoramento do Filtro "Todos"** - Integração com filtro de filas

## **DECISÕES TOMADAS:**
- ✅ **Tailwind**: Remoção completa, ajustes conforme necessário
- ✅ **Filtros de Funil**: Campo Etapa Kanban cinza/desabilitado quando sem funil + funil padrão automático
- ✅ **Tabs**: Sempre visíveis, independente dos filtros
- ✅ **Filtro "Todos"**: Mostra todos os tickets + filtro de filas funciona sobre essa lista
- ✅ **Prioridade**: Começar pela remoção do Tailwind
- ✅ **Testes**: Validação manual/visual pelo usuário
- ✅ **Estrutura**: Dividir em 2 fases principais

---

## **FASE 1: Correções Fundamentais (PRIORIDADE ALTA)** ✅ **CONCLUÍDA**

### **Objetivo**
Resolver problemas críticos que afetam a usabilidade atual do sistema.

### **1.1 Remoção Completa do Tailwind CSS** ✅ CONCLUÍDA
- [x] Criar backup completo do projeto
- [x] Remover dependências do Tailwind do `package.json`
- [x] Remover arquivos de configuração (`tailwind.config.js`)
- [x] Buscar e remover imports/classes Tailwind no código
- [x] Substituir por equivalentes Material-UI quando necessário
- [x] Testar build e corrigir erros

### **1.2 Correção do Comportamento das Tabs** ✅ CONCLUÍDA
- [x] Analisar lógica atual de visibilidade das tabs
- [x] Separar lógica de filtros da visibilidade das tabs
- [x] Garantir que "Atendendo", "Aguardando" e "Grupo" sempre fiquem visíveis
- [x] Ajustar funções de filtro para não mudar tab para "search"
- [x] Testar diferentes cenários de filtros

### **1.3 Aprimoramento do Filtro "Todos"** ✅ CORRIGIDA
- [x] Mapear lógica atual de `showAllTickets` e `selectedQueueIds`
- [x] **PROBLEMA IDENTIFICADO**: Backend ignorava `queueIds` quando `showAll=true` e `allHistoric=enabled`
- [x] **CORREÇÃO APLICADA**: Modificado `ListTicketsService.ts` para sempre respeitar filtro de filas
- [x] Lógica agora funciona corretamente:
  - "Todos" ativo + nenhuma fila = todos os tickets de todas as filas ✅
  - "Todos" ativo + filas selecionadas = todos os tickets apenas das filas selecionadas ✅
- [x] Componente `TicketsList` já suporta filtros combinados
- [x] Indicadores visuais já existem (ícone do olho + seletor de filas)

---

## **FASE 2: Melhorias de UX e Funcionalidades (PRIORIDADE MÉDIA)**

### **Objetivo**
Implementar melhorias na experiência do usuário e funcionalidades avançadas.

### **2.1 Melhorias nos Filtros de Funil e Etapa Kanban** ✅ CONCLUÍDA
- [x] Mapear relação entre funis e tags kanban no backend
- [x] Implementar funil padrão automático (primeiro da lista)
- [x] Campo "Etapa Kanban" desabilitado/cinza quando sem funil selecionado
- [x] Adicionar feedback visual no campo desabilitado ("Selecione um funil primeiro")
- [x] Lógica para detectar mudanças nos funis selecionados
- [x] ~~Limpar seleção de Etapa Kanban ao alterar funil~~ - **DESNECESSÁRIO** (conforme feedback do usuário)
- [ ] Adicionar tooltip explicativo no campo desabilitado
- [ ] Implementar loading states e cache inteligente

### **2.2 Otimizações de Performance** ✅ CONCLUÍDA
- [x] Implementar debounce na seleção de filtros (500ms)
- [x] Cache para consultas frequentes (funis e tags)
- [x] Otimizar re-renderizações desnecessárias (useMemo para menuItems e selectedValue)
- [x] Melhorar feedback do usuário (UI responsiva antes da API)

### **2.3 Melhorias na Interface** ✅ CONCLUÍDA
- [x] Botão "Limpar Filtros" para resetar todos os filtros (só aparece quando há filtros ativos)
- [x] Feedback visual claro sobre filtros ativos (badge no botão de filtro)
- [x] Indicadores quando filtros estão combinados (tooltip e ícone vermelho)
- [x] Melhorar responsividade dos componentes (otimizações aplicadas)

---

## **Cronograma Revisado**

| Fase | Duração Estimada | Tarefas Principais |
|------|------------------|-------------------|
| **Fase 1** | 4-6 dias | Tailwind + Tabs + Filtro "Todos" |
| **Fase 2** | 6-8 dias | Filtros Funil + UX + Performance |

**Total Estimado: 10-14 dias úteis**

---

## **Especificações Técnicas Detalhadas**

### **Filtro "Todos" - Comportamento Esperado:**
```javascript
// Lógica do filtro "Todos"
if (showAllTickets && selectedQueueIds.length === 0) {
  // Mostrar TODOS os tickets de TODAS as filas
  return getAllTicketsFromAllQueues();
} else if (showAllTickets && selectedQueueIds.length > 0) {
  // Mostrar TODOS os tickets APENAS das filas selecionadas
  return getAllTicketsFromSelectedQueues(selectedQueueIds);
} else {
  // Comportamento normal (sem "Todos")
  return getTicketsByUserPermissions();
}
```

### **Filtros de Funil - Comportamento Esperado:**
```javascript
// Estado inicial: primeiro funil selecionado automaticamente
const [selectedFunnels, setSelectedFunnels] = useState([]);
const [isEtapaKanbanEnabled, setIsEtapaKanbanEnabled] = useState(false);

// Lógica de habilitação
useEffect(() => {
  setIsEtapaKanbanEnabled(selectedFunnels.length > 0);
  if (selectedFunnels.length === 0) {
    clearEtapaKanbanSelection();
  }
}, [selectedFunnels]);
```

### **Tabs - Comportamento Esperado:**
```javascript
// Tabs sempre visíveis, independente dos filtros
const shouldShowTabs = true; // Sempre true
const shouldShowFilters = filter; // Controlado pelo botão de filtro

// Separar completamente as duas lógicas
```

---

## **Próximos Passos Imediatos**

1. ✅ **Plano Atualizado** - Concluído
2. ✅ **Fase 1 Concluída** - Tailwind removido + Tabs corrigidas + Filtro "Todos" verificado
3. 🚀 **Iniciando Fase 2** - Melhorias nos filtros de funil e etapa kanban
4. 📝 **Validação Manual** - Testes visuais após cada etapa
5. 🔄 **Feedback Contínuo** - Ajustes conforme necessário

---

*Plano atualizado com base no feedback do usuário. Foco em resolver problemas críticos primeiro, depois melhorias de UX.* 