# 📊 Documentação da Página Reports - Sistema Whatize

> Documentação completa de funcionalidades, lógicas e componentes da página de relatórios

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estados da Aplicação](#estados-da-aplicação)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Filtros e Componentes](#filtros-e-componentes)
- [Tabela de Dados](#tabela-de-dados)
- [Exportação de Dados](#exportação-de-dados)
- [Paginação](#paginação)
- [Integrações e APIs](#integrações-e-apis)
- [Componentes UI](#componentes-ui)
- [Fluxos de Navegação](#fluxos-de-navegação)

---

## 🎯 Visão Geral

A página **Reports** é uma interface de relatórios avançada que permite visualizar, filtrar e exportar dados de atendimentos (tickets) do sistema Whatize. É uma das páginas mais críticas do sistema, utilizada para análise de performance e geração de relatórios gerenciais.

### Propósito Principal
- Visualização de histórico completo de atendimentos
- Filtragem avançada por múltiplos parâmetros
- Exportação de dados para Excel
- Análise de métricas de suporte e NPS
- Acesso rápido aos detalhes de tickets específicos

---

## 🔄 Estados da Aplicação

### Estados de Loading
```javascript
const [loading, setLoading] = useState(false);
```
- **Quando ativa**: Durante busca de contatos, aplicação de filtros, exportação Excel
- **Comportamento**: Exibe skeletons, spinners e desabilita botões durante operações

### Estados de Paginação
```javascript
const [pageNumber, setPageNumber] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [totalTickets, setTotalTickets] = useState(0);
```
- **pageNumber**: Página atual (inicia em 1)
- **pageSize**: Quantidade de registros por página (5, 10, 20, 50)
- **totalTickets**: Total de registros encontrados para cálculo de páginas

### Estados de Filtros
```javascript
const [searchParam, setSearchParam] = useState("");
const [selectedContactId, setSelectedContactId] = useState(null);
const [selectedWhatsapp, setSelectedWhatsapp] = useState([]);
const [selectedStatus, setSelectedStatus] = useState([]);
const [queueIds, setQueueIds] = useState([]);
const [userIds, setUserIds] = useState([]);
const [dateFrom, setDateFrom] = useState(moment("1", "D").format("YYYY-MM-DD"));
const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
const [onlyRated, setOnlyRated] = useState(false);
```

### Estados de Dados e Interações
```javascript
const [options, setOptions] = useState([]); // Opções de contatos para autocomplete
const [tickets, setTickets] = useState([]); // Dados da tabela
const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
const [ticketOpen, setTicketOpen] = useState(null);
```

---

## ⚙️ Funcionalidades Principais

### 1. Sistema de Busca de Contatos com Debounce
```javascript
useEffect(() => {
  if (searchParam.length < 3) return;
  
  setLoading(true);
  const delayDebounceFn = setTimeout(async () => {
    try {
      const { data } = await api.get("contacts", {
        params: { searchParam },
      });
      setOptions(data.contacts || []);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, 500);
  
  return () => clearTimeout(delayDebounceFn);
}, [searchParam]);
```

**Características:**
- ✅ Busca ativada apenas com 3+ caracteres
- ✅ Debounce de 500ms para otimizar requisições
- ✅ Loading state integrado
- ✅ Tratamento de erros com toast

### 2. Aplicação de Filtros Dinâmicos
```javascript
const handleFilter = async (pageNum = 1) => {
  setLoading(true);
  try {
    const data = await getReport({
      searchParam,
      contactId: selectedContactId,
      whatsappId: JSON.stringify(selectedWhatsapp),
      users: JSON.stringify(userIds),
      queueIds: JSON.stringify(queueIds),
      status: JSON.stringify(selectedStatus),
      dateFrom,
      dateTo,
      page: pageNum,
      pageSize: pageSize,
      onlyRated: onlyRated ? "true" : "false"
    });

    setTotalTickets(data.totalTickets.total);
    setTickets(data.tickets || []);
    setPageNumber(pageNum);
  } catch (error) {
    toastError(error);
  } finally {
    setLoading(false);
  }
};
```

**Parâmetros de Filtro:**
- **searchParam**: Termo de busca livre
- **contactId**: ID específico de contato selecionado
- **whatsappId**: Array de conexões WhatsApp
- **users**: Array de usuários/atendentes
- **queueIds**: Array de filas de atendimento
- **status**: Array de status (open, pending, closed)
- **dateFrom/dateTo**: Período de análise
- **onlyRated**: Apenas tickets com avaliação NPS

### 3. Exportação para Excel
```javascript
const exportarGridParaExcel = async () => {
  setLoading(true);
  try {
    const data = await getReport({
      // ... mesmos parâmetros do filtro
      page: 1,
      pageSize: 9999999, // Busca todos os registros
    });

    const ticketsData = data.tickets.map(ticket => {
      const createdAt = new Date(ticket.createdAt);
      const closedAt = new Date(ticket.closedAt);

      return {
        id: ticket.id,
        Conexão: ticket.whatsappName,
        Contato: ticket.contactName,
        Usuário: ticket.userName,
        Fila: ticket.queueName,
        Status: ticket.status,
        ÚltimaMensagem: ticket.lastMessage,
        DataAbertura: createdAt.toLocaleDateString(),
        HoraAbertura: createdAt.toLocaleTimeString(),
        DataFechamento: ticket.closedAt ? closedAt.toLocaleDateString() : "",
        HoraFechamento: ticket.closedAt ? closedAt.toLocaleTimeString() : "",
        TempoDeAtendimento: ticket.supportTime,
        nps: ticket.NPS,
      };
    });

    const ws = XLSX.utils.json_to_sheet(ticketsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RelatorioDeAtendimentos');
    XLSX.writeFile(wb, 'relatorio-de-atendimentos.xlsx');
  } catch (error) {
    toastError(error);
  } finally {
    setLoading(false);
  }
};
```

**Características da Exportação:**
- ✅ Aplica os mesmos filtros da visualização atual
- ✅ Busca todos os registros (sem limite de paginação)
- ✅ Formata datas para padrão brasileiro
- ✅ Separa data e hora em colunas distintas
- ✅ Nome do arquivo: `relatorio-de-atendimentos.xlsx`

---

## 🔍 Filtros e Componentes

### 1. Autocomplete de Contatos
```javascript
<Autocomplete
  fullWidth
  options={options || []}
  loading={loading}
  size="small"
  getOptionLabel={(option) => 
    option.number ? `${option.name} - ${option.number}` : option.name
  }
  renderOption={renderOption}
  filterOptions={(options, params) => {
    const filtered = filter(options, params);
    if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
      filtered.push({ name: params.inputValue });
    }
    return filtered;
  }}
  onChange={handleSelectOption}
/>
```

**Características:**
- ✅ Busca dinâmica com debounce
- ✅ Exibe nome + número do contato
- ✅ Ícones por canal (WhatsApp, Facebook, Instagram)
- ✅ Opção de criar contato não encontrado
- ✅ Loading indicator integrado

### 2. Filtro de Conexões WhatsApp
```javascript
<WhatsappsFilter onFiltered={handleSelectedWhatsapps} />
```
- **Função**: `handleSelectedWhatsapps(selecteds)`
- **Resultado**: Array com IDs das conexões selecionadas
- **Comportamento**: Multi-seleção com checkboxes

### 3. Filtro de Status
```javascript
<StatusFilter onFiltered={handleSelectedStatus} />
```
- **Opções**: open, pending, closed
- **Função**: `handleSelectedStatus(selecteds)`
- **Resultado**: Array com status selecionados

### 4. Filtro de Usuários/Atendentes
```javascript
<UsersFilter onFiltered={handleSelectedUsers} />
```
- **Função**: `handleSelectedUsers(selecteds)`
- **Resultado**: Array com IDs dos usuários
- **Permissões**: Baseado no contexto de autenticação

### 5. Filtro de Filas
```javascript
<Select
  multiple
  value={queueIds}
  onChange={(e) => setQueueIds(e.target.value)}
  renderValue={(selected) => `${selected.length} selecionada(s)`}
>
  {user?.queues?.map((queue) => (
    <MenuItem key={queue.id} value={queue.id}>
      {queue.name}
    </MenuItem>
  ))}
</Select>
```

### 6. Filtros de Data
```javascript
<TextField
  label="Data Inicial"
  type="date"
  value={dateFrom}
  onChange={(e) => setDateFrom(e.target.value)}
  InputLabelProps={{ shrink: true }}
/>

<TextField
  label="Data Final"
  type="date"
  value={dateTo}
  onChange={(e) => setDateTo(e.target.value)}
  InputLabelProps={{ shrink: true }}
/>
```

**Valores Padrão:**
- **dateFrom**: Primeiro dia do mês atual
- **dateTo**: Data atual

### 7. Switch "Apenas Avaliados"
```javascript
<Switch
  color="primary"
  checked={onlyRated}
  onChange={() => setOnlyRated(!onlyRated)}
/>
```
- **Função**: Filtra apenas tickets com avaliação NPS
- **Valor padrão**: false

---

## 📊 Tabela de Dados

### Colunas da Tabela
```javascript
const tableColumns = [
  { key: 'id', label: "ID", align: 'center', minWidth: 80 },
  { 
    key: 'whatsappName', 
    label: "Conexão WhatsApp", 
    align: 'left',
    render: (value, row) => (
      <div className="flex items-center space-x-2">
        {IconChannel(row.channel)}
        <span>{value}</span>
      </div>
    )
  },
  { key: 'contactName', label: "Contato", align: 'left' },
  { key: 'userName', label: "Usuário", align: 'left' },
  { key: 'queueName', label: "Fila", align: 'left' },
  { 
    key: 'status', 
    label: "Status", 
    align: 'center',
    render: (value) => (
      <span className={cn(
        "px-2 py-1 rounded-full text-xs font-medium",
        value === 'open' && "bg-green-100 text-green-800",
        value === 'pending' && "bg-yellow-100 text-yellow-800",
        value === 'closed' && "bg-gray-100 text-gray-800"
      )}>
        {value}
      </span>
    )
  },
  { key: 'lastMessage', label: "Última Mensagem", align: 'left' },
  { key: 'createdAt', label: "Data Abertura", align: 'center' },
  { key: 'closedAt', label: "Data Fechamento", align: 'center' },
  { key: 'supportTime', label: "Tempo Atendimento", align: 'center' },
  { key: 'NPS', label: "Avaliação", align: 'center' },
  {
    key: 'actions',
    label: "Ações",
    align: 'center',
    render: (_, row) => (
      <div className="flex items-center justify-center space-x-2">
        <Tooltip title="Logs do Ticket">
          <IconButton onClick={() => showTicketLogs(row)}>
            <HistoryIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Acessar Ticket">
          <IconButton onClick={() => history.push(`/tickets/${row.uuid}`)}>
            <OpenIcon />
          </IconButton>
        </Tooltip>
      </div>
    )
  },
];
```

### Ações da Tabela
1. **Visualizar Logs**: Abre modal com histórico detalhado do ticket
2. **Acessar Ticket**: Navega para a página de detalhes do ticket

### Ícones por Canal
```javascript
const IconChannel = (channel) => {
  switch (channel) {
    case "facebook":
      return <Facebook className="text-blue-600 w-4 h-4" />;
    case "instagram":
      return <Instagram className="text-pink-600 w-4 h-4" />;
    case "whatsapp":
      return <WhatsApp className="text-green-600 w-4 h-4" />;
    default:
      return null;
  }
};
```

---

## 📄 Paginação

### Configuração
```javascript
<Pagination
  count={Math.ceil(totalTickets / pageSize)}
  page={pageNumber}
  onChange={(event, value) => handleFilter(value)}
  color="primary"
  size="large"
  showFirstButton
  showLastButton
/>
```

### Seletor de Tamanho de Página
```javascript
<Select
  value={pageSize}
  onChange={(e) => setPageSize(e.target.value)}
>
  <MenuItem value={5}>5</MenuItem>
  <MenuItem value={10}>10</MenuItem>
  <MenuItem value={20}>20</MenuItem>
  <MenuItem value={50}>50</MenuItem>
</Select>
```

**Características:**
- ✅ Cálculo automático do total de páginas
- ✅ Botões primeira/última página
- ✅ Indicador de total de registros
- ✅ Seletor de registros por página

---

## 🔌 Integrações e APIs

### Hook Principal: `useDashboard`
```javascript
const { getReport } = useDashboard();
```

### Endpoint de Relatórios
**Rota**: `GET /reports` (via hook)
**Parâmetros**:
```javascript
{
  searchParam: string,
  contactId: number | null,
  whatsappId: string, // JSON array
  users: string, // JSON array
  queueIds: string, // JSON array
  status: string, // JSON array
  dateFrom: string, // YYYY-MM-DD
  dateTo: string, // YYYY-MM-DD
  page: number,
  pageSize: number,
  onlyRated: string // "true" | "false"
}
```

**Retorno**:
```javascript
{
  tickets: Array<{
    id: number,
    whatsappName: string,
    contactName: string,
    userName: string,
    queueName: string,
    status: string,
    lastMessage: string,
    createdAt: string,
    closedAt: string | null,
    supportTime: string,
    NPS: number | null,
    uuid: string,
    channel: string
  }>,
  totalTickets: {
    total: number
  }
}
```

### Endpoint de Contatos
**Rota**: `GET /contacts`
**Parâmetros**: `{ searchParam: string }`
**Retorno**:
```javascript
{
  contacts: Array<{
    id: number,
    name: string,
    number: string,
    channel: string
  }>
}
```

---

## 🎨 Componentes UI

### Componentes do Design System Utilizados
```javascript
import {
  FilterCard,      // Card para seção de filtros
  ModernButton,    // Botões estilizados
  SearchInput,     // Input de busca
  DataTable,       // Tabela de dados
  PageHeader,      // Cabeçalho da página
  FiltersSkeleton, // Loading dos filtros
  TableSkeleton    // Loading da tabela
} from "../../components/ui";
```

### Material-UI Components
- **Container**: Layout responsivo
- **Grid**: Sistema de grade
- **Autocomplete**: Busca de contatos
- **TextField**: Campos de entrada
- **Select**: Seletores
- **Switch**: Toggle binário
- **Pagination**: Navegação de páginas
- **IconButton**: Botões com ícones
- **Tooltip**: Dicas contextuais

### Animações (Framer Motion)
```javascript
import { motion, AnimatePresence } from "framer-motion";

// Animação da tabela
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.2 }}
>
  <DataTable ... />
</motion.div>

// Animação da paginação
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, delay: 0.4 }}
>
  <Pagination ... />
</motion.div>
```

---

## 🧭 Fluxos de Navegação

### Fluxo Principal
1. **Entrada na Página**: Carrega com filtros padrão (data do mês)
2. **Aplicação de Filtros**: Usuário configura filtros desejados
3. **Clique em "Filtrar"**: Executa `handleFilter(1)` - busca primeira página
4. **Visualização de Resultados**: Tabela exibe dados paginados
5. **Navegação entre Páginas**: `handleFilter(pageNumber)`
6. **Exportação**: `exportarGridParaExcel()` - todos os dados

### Fluxos de Interação
1. **Ver Logs do Ticket**:
   ```
   Clique no ícone History → setOpenTicketMessageDialog(true) → Modal com logs
   ```

2. **Acessar Ticket**:
   ```
   Clique no ícone Open → history.push(`/tickets/${ticket.uuid}`) → Página do ticket
   ```

3. **Busca de Contato**:
   ```
   Digite 3+ caracteres → Debounce 500ms → API call → Atualiza options
   ```

### Contexto de Autenticação
```javascript
const { user } = useContext(AuthContext);
```
- **Permissões**: Controla visibilidade de componentes via `<Can>`
- **Filas Disponíveis**: `user?.queues` para filtro de filas
- **Dados da Empresa**: Contexto multi-tenant

---

## 🚨 Tratamento de Erros

### Toast de Erros
```javascript
import toastError from "../../errors/toastError";

try {
  // operação
} catch (error) {
  toastError(error);
}
```

### Loading States
- **Busca de contatos**: Loading no autocomplete
- **Aplicação de filtros**: Loading geral + skeleton da tabela
- **Exportação Excel**: Loading + disabled nos botões

### Validações
- **Busca de contatos**: Mínimo 3 caracteres
- **Datas**: Validação automática pelo input type="date"
- **Paginação**: Verificação se existem dados antes de renderizar

---

## 📝 Considerações Técnicas

### Performance
- ✅ Debounce na busca de contatos
- ✅ Paginação server-side
- ✅ Lazy loading com skeletons
- ✅ Memoização de componentes pesados

### Acessibilidade
- ✅ Labels em todos os inputs
- ✅ Tooltips explicativos
- ✅ Navegação por teclado
- ✅ Indicadores de loading

### Responsividade
- ✅ Grid system responsivo
- ✅ Breakpoints definidos
- ✅ Tabela com scroll horizontal
- ✅ Layout mobile-first

### Internacionalização
- ✅ Todos os textos via `i18n.t()`
- ✅ Formatação de datas localizadas
- ✅ Suporte a múltiplos idiomas

---

*Documentação criada para preservar todas as funcionalidades durante a modernização da interface - Dezembro 2024*