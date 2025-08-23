# 🎨 Design System Whatize

> Sistema de cores padronizado para interface consistente e personalizável

## 📋 Índice

- [Paleta de Cores](#paleta-de-cores)
- [Modo Light e Dark](#modo-light-e-dark)
- [Variáveis CSS](#variáveis-css)
- [Componentes](#componentes)
- [Classes Utilitárias](#classes-utilitárias)
- [Como Usar](#como-usar)
- [Personalização](#personalização)

---

## 🎯 Paleta de Cores

A identidade visual do Whatize é baseada em uma paleta minimalista e moderna:

### Cores Principais

| Cor | Código | Uso | Preview |
|-----|--------|-----|---------|
| **Preto Principal** | `#111416` | Backgrounds, navbar, sidebar | ![#111416](https://via.placeholder.com/20/111416/111416.png) |
| **Verde Principal** | `#00C307` | Botões, ícones, acentos | ![#00C307](https://via.placeholder.com/20/00C307/00C307.png) |
| **Branco** | `#FFFFFF` | Textos em dark, backgrounds claros | ![#FFFFFF](https://via.placeholder.com/20/FFFFFF/FFFFFF.png) |

### Variações de Verde

| Variação | Código | Uso |
|----------|--------|-----|
| Verde Hover | `#00e608` | Estados hover brilhantes |
| Verde Escuro | `#00a006` | Estados pressed/active |
| Verde Claro | `#33d433` | Estados disabled/loading |

### Escala de Cinzas (Baseada no Preto Principal)

| Tonalidade | Código | Uso |
|------------|--------|-----|
| Preto 50 | `#f8f9fa` | Fundos muito claros |
| Preto 100 | `#e9ecef` | Bordas suaves |
| Preto 200 | `#dee2e6` | Bordas padrão |
| Preto 300 | `#ced4da` | Textos desabilitados |
| Preto 400 | `#6c757d` | Textos secundários |
| Preto 500 | `#495057` | Textos terciários |
| Preto 600 | `#343a40` | Textos em fundos claros |
| Preto 700 | `#212529` | Fundos escuros médios |
| Preto 800 | `#1a1d21` | Fundos escuros |
| Preto 900 | `#111416` | **Principal** - Fundos principais |

---

## 🌓 Modo Light e Dark

### Light Mode (Padrão)
- **Fundo Principal**: Branco/cinza claro
- **Navbar/Sidebar**: Preto principal (`#111416`)
- **Textos**: Preto sobre fundo claro
- **Acentos**: Verde (`#00C307`)

### Dark Mode
- **Fundo Principal**: Preto principal (`#111416`)
- **Navbar/Sidebar**: Preto principal (`#111416`)
- **Textos**: Branco sobre fundo escuro
- **Acentos**: Verde (`#00C307`)

**Ativação**: Controlado pelo atributo `data-theme="dark"` no `<html>`

---

## 💻 Variáveis CSS

### Cores Base
```css
:root {
  --color-primary: #111416;     /* Preto principal */
  --color-accent: #00C307;      /* Verde principal */
  --color-white: #FFFFFF;       /* Branco */
  --color-black: #000000;       /* Preto puro */
}
```

### Cores Semânticas
```css
:root {
  /* Backgrounds */
  --bg-primary: var(--color-white);
  --bg-secondary: var(--color-black-50);
  --bg-navbar: var(--color-primary);
  --bg-sidebar: var(--color-primary);
  --bg-content: var(--color-black-50);
  
  /* Textos */
  --text-primary: var(--color-primary);
  --text-secondary: var(--color-black-600);
  --text-on-dark: var(--color-white);
  --text-on-accent: var(--color-white);
  
  /* Bordas */
  --border-primary: var(--color-black-200);
  --border-focus: var(--color-accent);
}
```

### Estados Interativos
```css
:root {
  /* Hovers */
  --hover-bg-light: rgba(0, 195, 7, 0.05);
  --hover-bg-medium: rgba(0, 195, 7, 0.1);
  --hover-bg-strong: rgba(0, 195, 7, 0.15);
  
  /* Focus */
  --focus-ring: rgba(0, 195, 7, 0.3);
  --focus-ring-offset: 2px;
  
  /* Sombras */
  --shadow-green: 0 4px 12px rgba(0, 195, 7, 0.15);
  --shadow-green-lg: 0 8px 25px rgba(0, 195, 7, 0.2);
}
```

### Utilitários
```css
:root {
  /* Bordas */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Transições */
  --transition-fast: 0.15s ease-out;
  --transition-normal: 0.2s ease-out;
  --transition-slow: 0.3s ease-out;
}
```

---

## 🧩 Componentes

### Botões

#### Botão Primário
```css
.btn-primary {
  background-color: var(--color-accent);
  color: var(--text-on-accent);
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.btn-primary:hover {
  background-color: var(--color-green-hover);
  box-shadow: var(--shadow-green);
  transform: translateY(-1px);
}
```

#### Botão Secundário
```css
.btn-secondary {
  background-color: transparent;
  border: 2px solid var(--color-accent);
  color: var(--color-accent);
  font-weight: 600;
  border-radius: var(--radius-md);
}

.btn-secondary:hover {
  background-color: var(--color-accent);
  color: var(--text-on-accent);
  box-shadow: var(--shadow-green);
}
```

### Inputs
```css
.input-modern {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: var(--transition-normal);
}

.input-modern:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--focus-ring);
}
```

---

## 🛠 Classes Utilitárias

### Backgrounds
```css
.bg-primary { background-color: var(--bg-primary); }
.bg-secondary { background-color: var(--bg-secondary); }
.bg-accent { background-color: var(--color-accent); }
.bg-navbar { background-color: var(--bg-navbar); }
.bg-sidebar { background-color: var(--bg-sidebar); }
```

### Textos
```css
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-accent { color: var(--color-accent); }
.text-on-dark { color: var(--text-on-dark); }
```

### Bordas
```css
.border-primary { border-color: var(--border-primary); }
.border-accent { border-color: var(--color-accent); }
```

### Interações
```css
.hover-accent:hover {
  background-color: var(--hover-bg-medium);
  transition: var(--transition-normal);
}

.focus-accent:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
```

---

## 🚀 Como Usar

### 1. Arquivo CSS Já Importado
O sistema está automaticamente disponível em `src/styles/colors.css`

### 2. Usando em Componentes Styled
```javascript
const MyButton = styled('button')(() => ({
  backgroundColor: 'var(--color-accent)',
  color: 'var(--text-on-accent)',
  border: '1px solid var(--border-accent)',
  borderRadius: 'var(--radius-md)',
  
  '&:hover': {
    backgroundColor: 'var(--color-green-hover)',
    boxShadow: 'var(--shadow-green)',
  }
}));
```

### 3. Usando Classes CSS
```jsx
<button className="bg-accent text-on-accent hover-accent">
  Botão Verde
</button>
```

### 4. Modo Dark/Light
```javascript
// Ativar modo dark
document.documentElement.setAttribute('data-theme', 'dark');

// Voltar para light
document.documentElement.removeAttribute('data-theme');
```

---

## ⚙️ Personalização

### Para Futuras Customizações

O sistema está preparado para receber personalização via JavaScript:

```javascript
// Exemplo para página de personalização
const updateColors = (newAccentColor) => {
  const root = document.documentElement;
  root.style.setProperty('--color-accent', newAccentColor);
  root.style.setProperty('--color-green-main', newAccentColor);
  
  // Calcular variações automaticamente
  const hoverColor = adjustBrightness(newAccentColor, 10);
  root.style.setProperty('--color-green-hover', hoverColor);
};
```

### Compatibilidade
- ✅ Mantém compatibilidade com `--primaryColor` (variável atual)
- ✅ Suporta temas light/dark automáticos
- ✅ Funciona com todos os navegadores modernos
- ✅ Integração com Material-UI e Styled Components

---

## 📁 Estrutura de Arquivos

```
src/
├── styles/
│   ├── colors.css          # Sistema de cores principal
│   └── tailwind.css        # Classes utilitárias atualizadas
├── App.jsx                 # Aplicação das variáveis CSS
└── layout/
    ├── index.jsx          # Layout principal atualizado
    └── MainListItems.jsx  # Menu lateral atualizado
```

---

## 🎨 Exemplos Visuais

### Paleta Completa

**Modo Light:**
- Navbar: ![#111416](https://via.placeholder.com/20/111416/111416.png) Preto
- Fundo: ![#FFFFFF](https://via.placeholder.com/20/FFFFFF/FFFFFF.png) Branco  
- Acentos: ![#00C307](https://via.placeholder.com/20/00C307/00C307.png) Verde

**Modo Dark:**
- Fundo: ![#111416](https://via.placeholder.com/20/111416/111416.png) Preto
- Textos: ![#FFFFFF](https://via.placeholder.com/20/FFFFFF/FFFFFF.png) Branco
- Acentos: ![#00C307](https://via.placeholder.com/20/00C307/00C307.png) Verde

### Estados Interativos
- Normal: ![#00C307](https://via.placeholder.com/20/00C307/00C307.png) `#00C307`
- Hover: ![#00e608](https://via.placeholder.com/20/00e608/00e608.png) `#00e608`
- Active: ![#00a006](https://via.placeholder.com/20/00a006/00a006.png) `#00a006`

---

## 📝 Notas de Implementação

- ✅ **Zero Breaking Changes**: Sistema retrocompatível
- ✅ **Performance**: CSS Variables nativas (sem JS runtime)
- ✅ **Manutenibilidade**: Centralizado em arquivo único
- ✅ **Flexibilidade**: Preparado para customizações futuras
- ✅ **Consistência**: Paleta unificada em toda aplicação

---

*Sistema criado para o Whatize - Versão 1.0 | Novembro 2024*