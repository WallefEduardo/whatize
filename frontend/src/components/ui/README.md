# Design System - Componentes UI Reutilizáveis

Este diretório contém o design system personalizado para o projeto, combinando **MUI v7** + **Tailwind CSS v4** com as cores e padrões do sistema.

## 🎨 Paleta de Cores

- **Primary**: `#00C307` (Verde principal)
- **Secondary**: `#111416` (Preto principal)  
- **Background**: `#FFFFFF` (Branco)
- **Success**: `#10b981`
- **Warning**: `#f59e0b`
- **Error**: `#ef4444`

## 📦 Componentes Disponíveis

### FilterCard
Card com efeito glassmorphism para seções de filtros.

```jsx
import { FilterCard } from '../components/ui';

<FilterCard animate={true}>
  <div>Conteúdo dos filtros</div>
</FilterCard>
```

**Props:**
- `animate` (boolean): Ativa animações de entrada
- `className` (string): Classes CSS adicionais

### ModernButton
Botão estilizado com múltiplas variantes e animações.

```jsx
import { ModernButton } from '../components/ui';

<ModernButton 
  variant="primary" 
  size="medium"
  onClick={handleClick}
  startIcon={<SaveIcon />}
>
  Salvar
</ModernButton>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'danger'`
- `size`: `'small' | 'medium' | 'large'`
- `animate` (boolean): Ativa micro-animações
- `disabled` (boolean): Estado desabilitado

### SearchInput
Campo de busca com ícones e animações.

```jsx
import { SearchInput } from '../components/ui';

<SearchInput
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Buscar contatos..."
  onClear={() => setSearch('')}
/>
```

**Props:**
- `value` (string): Valor atual
- `onChange` (function): Handler de mudança
- `onClear` (function): Handler para limpar
- `placeholder` (string): Texto placeholder
- `animate` (boolean): Ativa animações

### DataTable
Tabela moderna com hover effects e loading states.

```jsx
import { DataTable } from '../components/ui';

const columns = [
  { key: 'id', label: 'ID', align: 'center' },
  { key: 'name', label: 'Nome', align: 'left' },
  { 
    key: 'status', 
    label: 'Status', 
    render: (value) => <StatusBadge status={value} />
  }
];

<DataTable
  columns={columns}
  data={tickets}
  loading={false}
  onRowClick={(row) => navigate(`/ticket/${row.id}`)}
/>
```

**Props:**
- `columns` (array): Definição das colunas
- `data` (array): Dados para exibir
- `loading` (boolean): Estado de carregamento
- `onRowClick` (function): Handler de clique na linha
- `animate` (boolean): Ativa animações

### PageHeader
Header padronizado para páginas.

```jsx
import { PageHeader } from '../components/ui';

<PageHeader
  title="Relatórios"
  subtitle="Visualize e exporte dados"
  breadcrumbs={[
    { label: 'Dashboard', href: '/' },
    { label: 'Relatórios' }
  ]}
  actions={
    <ModernButton variant="primary">
      Nova Ação
    </ModernButton>
  }
/>
```

**Props:**
- `title` (string): Título da página
- `subtitle` (string): Subtítulo opcional
- `breadcrumbs` (array): Navegação breadcrumb
- `actions` (ReactNode): Botões de ação

## 🔄 Loading States

### Skeletons Disponíveis

```jsx
import { 
  FiltersSkeleton, 
  TableSkeleton, 
  CardSkeleton,
  ButtonSkeleton,
  InputSkeleton,
  PageSkeleton
} from '../components/ui';

// Para filtros
<FiltersSkeleton />

// Para tabelas
<TableSkeleton rows={5} columns={6} />

// Para cards
<CardSkeleton />

// Página completa
<PageSkeleton />
```

## 🎭 Animações

### Framer Motion Integration

Todos os componentes suportam animações via Framer Motion:

```jsx
// Animação de entrada
<FilterCard animate={true}>
  {/* conteúdo */}
</FilterCard>

// Animação personalizada
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* conteúdo */}
</motion.div>
```

## 🎯 Classes Tailwind Customizadas

### Componentes CSS

```css
.btn-primary          /* Botão principal */
.btn-secondary        /* Botão secundário */
.card-glassmorphism   /* Card com efeito vidro */
.input-modern         /* Input moderno */
.table-row-modern     /* Linha de tabela moderna */
```

### Animações CSS

```css
.animate-shimmer      /* Efeito shimmer */
.animate-fade-in      /* Fade in suave */
.animate-slide-up     /* Slide up */
.scrollbar-modern     /* Scrollbar customizada */
```

## 📱 Responsividade

Todos os componentes são mobile-first e responsivos:

```jsx
<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
  {/* Conteúdo responsivo */}
</Grid>
```

**Breakpoints:**
- `xs`: 0px (mobile)
- `sm`: 640px (tablet)
- `md`: 768px (desktop pequeno)
- `lg`: 1024px (desktop)
- `xl`: 1280px (desktop grande)

## 🌙 Dark Mode

Suporte nativo ao dark mode via classe `.dark`:

```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Conteúdo com suporte a dark mode
</div>
```

## 🛠️ Utilitários

### cn() Helper

```jsx
import { cn } from '../utils/cn';

const className = cn(
  'base-class',
  isActive && 'active-class',
  variant === 'primary' && 'primary-class'
);
```

### Custom Theme

```jsx
import { createCustomTheme } from '../styles/theme';
import { ThemeProvider } from '@mui/material/styles';

const theme = createCustomTheme('light'); // ou 'dark'

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

## 🚀 Padrões de Uso

### 1. Página Típica

```jsx
import { 
  PageHeader, 
  FilterCard, 
  ModernButton, 
  DataTable 
} from '../components/ui';

const MyPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <Container maxWidth="xl" className="py-8">
      <PageHeader title="Minha Página" />
      
      <FilterCard>
        {/* Filtros */}
      </FilterCard>
      
      <DataTable {...props} />
    </Container>
  </div>
);
```

### 2. Formulário Moderno

```jsx
<FilterCard>
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, md: 6 }}>
      <SearchInput {...props} />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <ModernButton variant="primary">
        Filtrar
      </ModernButton>
    </Grid>
  </Grid>
</FilterCard>
```

Este design system garante consistência visual, performance otimizada e experiência de usuário moderna em todas as páginas do sistema.