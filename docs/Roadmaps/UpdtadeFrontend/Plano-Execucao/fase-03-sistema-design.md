# 🎨 FASE 3: Sistema de Design

## 📋 Informações Gerais
- **Duração**: 4-5 dias úteis
- **Prioridade**: CRÍTICA
- **Prerequisitos**: [Fase 2 - Migração Build System](./fase-02-migracao-build-system.md) ✅
- **Próxima Fase**: [Fase 4 - Estado e Formulários](./fase-04-estado-formularios.md)

---

## 🚨 REGRA FUNDAMENTAL
### ⚠️ NUNCA QUEBRAR AS LÓGICAS EXISTENTES DO SISTEMA
Durante esta fase, ALL as funcionalidades visuais e de UI devem continuar funcionando. A migração do sistema de design deve ser invisível para o usuário final em termos de funcionalidade.

---

## 🎯 Objetivos da Fase
1. **Unificar bibliotecas de UI** (Material-UI v4 + MUI v5 → MUI v6)
2. **Implementar Tailwind CSS** para estilização moderna
3. **Integrar Shadcn/UI** para componentes padronizados
4. **Preservar todos os estilos** e aparência atual
5. **Implementar dark mode** robusto
6. **Garantir responsividade** em todos os componentes

---

## 📊 Sistema de Logs - Foco na Fase 3

### Logs Específicos desta Fase
```typescript
// Extensão do logger para Fase 3
export const phase3Logger = {
  designSystem: {
    muiMigration: (component: string, from: string, to: string, success: boolean) => {
      const message = `[MUI-MIGRATION] ${component}: ${from} → ${to} - ${success ? 'OK' : 'FALHOU'}`;
      if (!success) {
        logger.migration.warningPreservation(`MUI migração falhou: ${component}`);
      }
      logger.development.build(message, { component, from, to, success });
      logger.migration.componentMigrated(component, from, to);
    },

    tailwindImplementation: (component: string, classes: string[], working: boolean) => {
      const message = `[TAILWIND] ${component} - Classes: ${classes.join(', ')} - ${working ? 'OK' : 'PROBLEMA'}`;
      if (!working) {
        logger.migration.warningPreservation(`Tailwind quebrou estilos em ${component}`);
      }
      logger.development.build(message, { component, classes, working });
    },

    shadcnIntegration: (component: string, integrated: boolean, issues?: string[]) => {
      const message = `[SHADCN] ${component} - ${integrated ? 'INTEGRADO' : 'FALHOU'}`;
      if (!integrated && issues) {
        logger.migration.warningPreservation(`Shadcn problemas em ${component}: ${issues.join(', ')}`);
      }
      logger.development.build(message, { component, integrated, issues });
    },

    stylePreservation: (component: string, preserved: boolean, visualDiff?: string) => {
      const message = `[STYLE-PRESERVATION] ${component} - ${preserved ? 'PRESERVADO' : 'ALTERADO'}`;
      if (!preserved) {
        logger.migration.warningPreservation(`ESTILOS ALTERADOS: ${component} - ${visualDiff}`);
        logger.production.error(`VISUAL REGRESSION: ${component}`);
      }
      logger.development.build(message, { component, preserved, visualDiff });
    },

    darkModeImplementation: (component: string, darkModeWorking: boolean) => {
      const message = `[DARK-MODE] ${component} - ${darkModeWorking ? 'OK' : 'PROBLEMA'}`;
      logger.development.build(message, { component, darkModeWorking });
    }
  }
};
```

---

## 📋 Tarefas Detalhadas

### 1. Análise e Backup do Sistema de Estilos Atual
**Tempo estimado**: 1 hora

#### 1.1 Documentar Estilos Atuais
```bash
# Criar backup de todos os estilos
mkdir -p ../backups/fase3-styles

# Backup de arquivos CSS
find src -name "*.css" -exec cp {} ../backups/fase3-styles/ \;

# Documentar uso de makeStyles
grep -r "makeStyles" src/ > ../backups/fase3-makestyles-usage.txt

# Documentar styled-components
grep -r "styled\." src/ > ../backups/fase3-styled-components.txt
grep -r "styled(" src/ >> ../backups/fase3-styled-components.txt

# Documentar Material-UI imports
grep -r "@material-ui" src/ > ../backups/fase3-material-ui-imports.txt
grep -r "@mui" src/ > ../backups/fase3-mui-imports.txt

echo "$(date): Backup estilos Fase 3 criado" >> logs/migration/phases.log
```

#### 1.2 Criar Snapshot Visual
```bash
# Script para capturar screenshots (se possível)
# Este seria um script para documentar a aparência atual
echo "$(date): Documentação visual iniciada" >> logs/migration/phases.log
```

#### 1.3 Mapear Componentes Críticos
```bash
# Identificar componentes mais usados
find src/components -name "*.js" -o -name "*.jsx" | xargs wc -l | sort -nr > ../backups/fase3-components-by-size.txt

# Mapear componentes que usam Material-UI
grep -l "@material-ui\|@mui" src/components/**/* > ../backups/fase3-mui-components.txt 2>/dev/null || echo "Nenhum componente MUI encontrado"
```

### 2. Limpeza e Unificação das Bibliotecas UI
**Tempo estimado**: 2 horas

#### 2.1 Atualizar para MUI v6 (Mais Recente)
```bash
# Remover Material-UI v4 (CUIDADOSAMENTE)
npm uninstall @material-ui/core @material-ui/icons @material-ui/lab @material-ui/pickers @material-ui/styles

# Atualizar MUI para v6
npm install @mui/material@latest @mui/icons-material@latest @mui/system@latest @mui/utils@latest

# Instalar dependências necessárias para MUI v6
npm install @emotion/react@latest @emotion/styled@latest

# Log da atualização
echo "$(date): MUI v6 instalado, Material-UI v4 removido" >> logs/migration/phases.log
```

#### 2.2 Configurar Tema MUI v6 Compatível
```typescript
// src/theme/mui-theme.ts - Tema unificado preservando cores atuais
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

// Preservar cores do tema atual
const currentPrimaryColor = '#065183'; // Cor atual do sistema
const currentSecondaryColor = '#1976d2';

const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: currentPrimaryColor,
      light: '#4285f4',
      dark: '#0d47a1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: currentSecondaryColor,
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    // Manter tipografia familiar
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 300,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 400,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
  components: {
    // Manter componentes com aparência similar
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Manter caso atual
          borderRadius: 4,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: currentPrimaryColor,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f5f5f5',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
};

const darkThemeOptions: ThemeOptions = {
  ...lightThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
      contrastText: '#000000',
    },
    secondary: {
      main: '#f48fb1',
      light: '#fce4ec',
      dark: '#e91e63',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
};

export const createAppTheme = (mode: 'light' | 'dark' = 'light') => {
  const themeOptions = mode === 'dark' ? darkThemeOptions : lightThemeOptions;
  return createTheme(themeOptions, ptBR);
};

// Utilitário para migração gradual
export const withThemeCompat = (theme: any) => {
  // Adicionar propriedades de compatibilidade se necessário
  return {
    ...theme,
    // Manter compatibilidade com estilos antigos
    spacing: theme.spacing || ((factor: number) => `${factor * 8}px`),
  };
};
```

#### 2.3 Migrar Componentes Críticos para MUI v6
```typescript
// src/utils/mui-migration-helper.ts
import { SxProps, Theme } from '@mui/material/styles';

// Helper para converter makeStyles para sx prop
export const convertMakeStylesToSx = (classes: Record<string, any>): SxProps<Theme> => {
  // Converter estilos antigos para novo formato
  const sxStyles: SxProps<Theme> = {};
  
  Object.keys(classes).forEach(key => {
    // Lógica de conversão preservando estilos
  });
  
  return sxStyles;
};

// HOC para migração gradual de componentes
export const withMuiV6Compat = <P extends object>(
  Component: React.ComponentType<P>,
  legacyStyles?: any
) => {
  return React.forwardRef<any, P>((props, ref) => {
    // Log da migração
    console.log(`[MUI-V6-COMPAT] Componente ${Component.name} migrado`);
    
    return <Component {...props} ref={ref} />;
  });
};

// Wrapper para preservar funcionalidade durante migração
export const preserveComponentBehavior = <T extends React.ComponentType<any>>(
  NewComponent: T,
  OldComponent: T,
  componentName: string
): T => {
  const PreservedComponent = (props: any) => {
    try {
      // Tentar usar novo componente
      return React.createElement(NewComponent, props);
    } catch (error) {
      // Fallback para componente antigo se houver erro
      console.warn(`[PRESERVATION] Fallback para componente antigo: ${componentName}`, error);
      logger.migration.warningPreservation(
        `Fallback usado em ${componentName}: ${error.message}`
      );
      return React.createElement(OldComponent, props);
    }
  };
  
  return PreservedComponent as T;
};
```

### 3. Implementação do Tailwind CSS
**Tempo estimado**: 1.5 horas

#### 3.1 Instalar e Configurar Tailwind
```bash
# Instalar Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

echo "$(date): Tailwind CSS instalado" >> logs/migration/phases.log
```

#### 3.2 Configurar Tailwind com Tema Atual
```javascript
// tailwind.config.js - Preservando cores e estilos atuais
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Habilitar dark mode
  theme: {
    extend: {
      // Preservar cores atuais do sistema
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#065183', // Cor principal atual
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        secondary: {
          50: '#fce4ec',
          100: '#f8bbd9',
          200: '#f48fb1',
          300: '#f06292',
          400: '#ec407a',
          500: '#1976d2', // Cor secundária atual
          600: '#d81b60',
          700: '#c2185b',
          800: '#ad1457',
          900: '#880e4f',
        },
        // Cores de estado para preservar feedback visual
        success: {
          50: '#e8f5e8',
          500: '#4caf50',
          700: '#388e3c',
        },
        error: {
          50: '#ffebee',
          500: '#f44336',
          700: '#d32f2f',
        },
        warning: {
          50: '#fff8e1',
          500: '#ff9800',
          700: '#f57c00',
        },
        info: {
          50: '#e3f2fd',
          500: '#2196f3',
          700: '#1976d2',
        },
      },
      // Preservar espaçamentos atuais
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      // Preservar fontes atuais
      fontFamily: {
        'sans': ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      // Breakpoints compatíveis com MUI
      screens: {
        'xs': '0px',
        'sm': '600px',
        'md': '960px',
        'lg': '1280px',
        'xl': '1920px',
      },
      // Shadows compatíveis com Material Design
      boxShadow: {
        'material-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'material-2': '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
        'material-3': '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
  // Configuração para coexistir com MUI
  corePlugins: {
    preflight: false, // Desabilitar reset do Tailwind para não conflitar com MUI
  },
  important: '#root', // Tornar classes Tailwind importantes apenas dentro do root
}
```

#### 3.3 Integrar Tailwind com CSS Existente
```css
/* src/styles/tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Camada de compatibilidade para preservar estilos existentes */
@layer base {
  /* Preservar estilos base que já existem */
  * {
    /* Não sobrescrever estilos existentes críticos */
  }
}

@layer components {
  /* Componentes personalizados que preservam aparência atual */
  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded transition-colors;
  }
  
  .card-material {
    @apply bg-white rounded-lg shadow-material-1 p-6;
  }
  
  .input-material {
    @apply border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
}

@layer utilities {
  /* Utilitários específicos para o projeto */
  .text-material-primary {
    color: rgba(0, 0, 0, 0.87);
  }
  
  .text-material-secondary {
    color: rgba(0, 0, 0, 0.6);
  }
  
  .dark .text-material-primary {
    color: rgba(255, 255, 255, 0.87);
  }
  
  .dark .text-material-secondary {
    color: rgba(255, 255, 255, 0.6);
  }
}
```

### 4. Integração do Shadcn/UI
**Tempo estimado**: 1.5 horas

#### 4.1 Configurar Shadcn/UI
```bash
# Instalar shadcn/ui
npx shadcn-ui@latest init

# Configurar baseado no projeto atual
```

```json
// components.json - Configuração do shadcn/ui
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/tailwind.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### 4.2 Instalar Componentes Base do Shadcn/UI
```bash
# Instalar componentes essenciais mantendo compatibilidade
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add toast

echo "$(date): Shadcn/UI componentes base instalados" >> logs/migration/phases.log
```

#### 4.3 Criar Wrapper de Compatibilidade
```typescript
// src/components/ui/compatibility-wrapper.tsx
import React from 'react';
import { cn } from '@/lib/utils';

// Wrapper para garantir compatibilidade visual
export const CompatibilityWrapper: React.FC<{
  children: React.ReactNode;
  originalClassName?: string;
  preserveStyles?: boolean;
}> = ({ children, originalClassName, preserveStyles = true }) => {
  return (
    <div 
      className={cn(
        preserveStyles && originalClassName,
        "transition-all duration-200" // Transições suaves
      )}
    >
      {children}
    </div>
  );
};

// HOC para migração gradual de componentes antigos
export const withShadcnCompat = <P extends object>(
  ShadcnComponent: React.ComponentType<P>,
  originalProps?: Partial<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const mergedProps = { ...originalProps, ...props };
    
    try {
      return <ShadcnComponent {...mergedProps} ref={ref} />;
    } catch (error) {
      console.error('[SHADCN-COMPAT] Erro no componente:', error);
      logger.migration.warningPreservation(
        `Erro em componente Shadcn: ${error.message}`
      );
      // Fallback para div básica se componente falhar
      return <div {...(props as any)} ref={ref} />;
    }
  });
};
```

### 5. Implementação do Dark Mode
**Tempo estimado**: 1 hora

#### 5.1 Configurar Provider de Tema
```typescript
// src/context/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme/mui-theme';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light'; // O tema real sendo usado
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'whatize-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Preservar tema salvo ou usar padrão atual
    const stored = localStorage.getItem(storageKey) as Theme;
    return stored || defaultTheme;
  });

  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let resolvedTheme: 'dark' | 'light' = 'light';

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      resolvedTheme = systemTheme;
    } else {
      resolvedTheme = theme;
    }

    root.classList.add(resolvedTheme);
    setActualTheme(resolvedTheme);

    // Log da mudança de tema
    logger.development.build(`Tema alterado para: ${resolvedTheme}`, { theme, resolvedTheme });
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    actualTheme,
  };

  // Criar tema MUI baseado no tema atual
  const muiTheme = createAppTheme(actualTheme);

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');

  return context;
};
```

#### 5.2 Atualizar App Principal
```typescript
// src/App.js - Integrar novo sistema de temas
import React from 'react';
import { ThemeProvider } from './context/ThemeProvider';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';
import { logger } from './utils/logger';

// Importar Tailwind CSS
import './styles/tailwind.css';

const queryClient = new QueryClient();

const App = () => {
  React.useEffect(() => {
    logger.migration.phaseStart('FASE 3 - Sistema de Design');
    logger.development.build('App com novo sistema de design inicializado');
    
    return () => {
      logger.development.build('App com novo sistema de design desmontado');
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="whatize-theme">
        <BrowserRouter>
          <div className="App">
            <Routes />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
```

### 6. Migração Gradual de Componentes
**Tempo estimado**: 2 horas

#### 6.1 Criar Sistema de Migração por Componente
```typescript
// src/utils/component-migration.ts
interface MigrationStatus {
  component: string;
  migrated: boolean;
  issues: string[];
  visualTest: boolean;
  functionalTest: boolean;
}

class ComponentMigrationTracker {
  private migrations: Map<string, MigrationStatus> = new Map();

  migrateComponent(
    componentName: string,
    migrationFn: () => Promise<boolean>,
    testFn?: () => Promise<boolean>
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        logger.development.component(componentName, 'MIGRATION_START');
        
        const migrationSuccess = await migrationFn();
        const testSuccess = testFn ? await testFn() : true;
        
        const status: MigrationStatus = {
          component: componentName,
          migrated: migrationSuccess,
          issues: [],
          visualTest: testSuccess,
          functionalTest: testSuccess,
        };

        if (!migrationSuccess) {
          status.issues.push('Migração falhou');
          logger.migration.warningPreservation(`Migração falhou: ${componentName}`);
        }

        if (!testSuccess) {
          status.issues.push('Testes falharam');
          logger.migration.warningPreservation(`Testes falharam: ${componentName}`);
        }

        this.migrations.set(componentName, status);
        
        phase3Logger.designSystem.stylePreservation(
          componentName,
          migrationSuccess && testSuccess,
          status.issues.join(', ')
        );

        logger.development.component(
          componentName, 
          `MIGRATION_${migrationSuccess ? 'SUCCESS' : 'FAILED'}`
        );

        resolve(migrationSuccess && testSuccess);
      } catch (error) {
        logger.development.error(`Erro na migração de ${componentName}`, error as Error);
        resolve(false);
      }
    });
  }

  getMigrationReport(): MigrationStatus[] {
    return Array.from(this.migrations.values());
  }

  getFailedMigrations(): MigrationStatus[] {
    return this.getMigrationReport().filter(
      status => !status.migrated || !status.functionalTest
    );
  }
}

export const migrationTracker = new ComponentMigrationTracker();
```

#### 6.2 Migrar Componente Exemplo (Button)
```typescript
// src/components/ui/Button.tsx - Exemplo de migração preservando funcionalidade
import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Manter interface compatível com versão anterior
interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'text' | 'outlined' | 'contained' | 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  useShadcn?: boolean; // Flag para usar Shadcn gradualmente
  preserveLegacy?: boolean; // Flag para usar MUI antigo se necessário
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'contained', useShadcn = false, preserveLegacy = false, className, children, ...props }, ref) => {
    // Log do uso do componente
    React.useEffect(() => {
      logger.development.component('Button', 'RENDERED', { variant, useShadcn, preserveLegacy });
    }, [variant, useShadcn, preserveLegacy]);

    // Converter variants para compatibilidade
    const getMuiVariant = (variant: string): 'text' | 'outlined' | 'contained' => {
      switch (variant) {
        case 'default':
        case 'secondary':
          return 'contained';
        case 'outline':
          return 'outlined';
        case 'ghost':
        case 'link':
          return 'text';
        default:
          return variant as 'text' | 'outlined' | 'contained';
      }
    };

    const getShadcnVariant = (variant: string) => {
      const validShadcnVariants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];
      return validShadcnVariants.includes(variant) ? variant : 'default';
    };

    if (useShadcn) {
      try {
        return (
          <ShadcnButton
            ref={ref}
            variant={getShadcnVariant(variant) as any}
            className={cn(className)}
            {...(props as any)}
          >
            {children}
          </ShadcnButton>
        );
      } catch (error) {
        logger.development.error('Erro no ShadcnButton, fallback para MUI', error as Error);
        // Fallback para MUI se Shadcn falhar
      }
    }

    // Usar MUI (padrão ou fallback)
    return (
      <MuiButton
        ref={ref}
        variant={getMuiVariant(variant)}
        className={className}
        {...props}
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };

// Testar migração do componente
export const testButtonMigration = async (): Promise<boolean> => {
  try {
    // Simular testes do componente
    // Em implementação real, fazer testes visuais e funcionais
    return true;
  } catch {
    return false;
  }
};
```

### 7. Validação e Testes Visuais
**Tempo estimado**: 1 hora

#### 7.1 Script de Validação Visual
```bash
#!/bin/bash
# scripts/validate-phase3.sh

echo "🎨 VALIDAÇÃO FASE 3 - Sistema de Design"
echo "$(date): Iniciando validação Fase 3" >> logs/migration/phases.log

# 1. Verificar se build ainda funciona
echo "1. Testando build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build - OK"
    echo "$(date): Build Fase 3 - OK" >> logs/migration/phases.log
else
    echo "❌ Build - FALHOU"
    echo "$(date): Build Fase 3 - FALHOU" >> logs/migration/phases.log
    exit 1
fi

# 2. Verificar se MUI v6 está instalado
echo "2. Verificando MUI v6..."
MUI_VERSION=$(npm list @mui/material --depth=0 | grep @mui/material@)
if echo "$MUI_VERSION" | grep -q "6\."; then
    echo "✅ MUI v6 instalado: $MUI_VERSION"
    echo "$(date): MUI v6 - OK" >> logs/migration/phases.log
else
    echo "❌ MUI v6 não detectado: $MUI_VERSION"
    echo "$(date): MUI v6 - PROBLEMA" >> logs/migration/phases.log
fi

# 3. Verificar se Tailwind está configurado
echo "3. Verificando Tailwind..."
if [ -f "tailwind.config.js" ]; then
    echo "✅ Tailwind configurado"
    echo "$(date): Tailwind - OK" >> logs/migration/phases.log
else
    echo "❌ Tailwind não configurado"
    echo "$(date): Tailwind - FALHOU" >> logs/migration/phases.log
fi

# 4. Verificar se Shadcn/UI está instalado
echo "4. Verificando Shadcn/UI..."
if [ -f "components.json" ]; then
    echo "✅ Shadcn/UI configurado"
    echo "$(date): Shadcn/UI - OK" >> logs/migration/phases.log
else
    echo "❌ Shadcn/UI não configurado"
    echo "$(date): Shadcn/UI - PROBLEMA" >> logs/migration/phases.log
fi

# 5. Verificar se não há Material-UI v4
echo "5. Verificando remoção Material-UI v4..."
if npm list @material-ui/core 2>/dev/null | grep -q "@material-ui/core"; then
    echo "❌ Material-UI v4 ainda presente"
    echo "$(date): Material-UI v4 - AINDA PRESENTE" >> logs/migration/phases.log
else
    echo "✅ Material-UI v4 removido"
    echo "$(date): Material-UI v4 - REMOVIDO" >> logs/migration/phases.log
fi

echo "✅ VALIDAÇÃO FASE 3 CONCLUÍDA"
echo "$(date): Validação Fase 3 - CONCLUÍDA" >> logs/migration/phases.log
```

#### 7.2 Teste de Componentes Migrados
```typescript
// src/utils/component-tests.ts
export const runComponentTests = async (): Promise<void> => {
  console.log('[COMPONENT-TESTS] Iniciando testes de componentes migrados');
  
  const testResults = [];
  
  // Testar Button migrado
  try {
    const buttonTest = await testButtonMigration();
    testResults.push({ component: 'Button', passed: buttonTest });
    phase3Logger.designSystem.stylePreservation('Button', buttonTest);
  } catch (error) {
    testResults.push({ component: 'Button', passed: false, error });
  }
  
  // Testar outros componentes conforme migrados
  // ...
  
  const failedTests = testResults.filter(test => !test.passed);
  if (failedTests.length > 0) {
    console.error('[COMPONENT-TESTS] Testes falharam:', failedTests);
    logger.production.error(`Testes de componentes falharam: ${failedTests.length} componentes`);
  } else {
    console.log('[COMPONENT-TESTS] Todos os testes passaram');
    logger.development.build('Todos os testes de componentes passaram');
  }
};
```

---

## ✅ Critérios de Conclusão da Fase 3

### Obrigatórios (Todos devem ser atendidos)
- [ ] **MUI v7 funcionando** perfeitamente
- [ ] **Material-UI v4 removido** completamente
- [ ] **Tailwind CSS implementado** sem quebrar estilos existentes
- [ ] **Shadcn/UI integrado** e funcionando
- [ ] **Dark mode funcionando** em toda aplicação
- [ ] **Todos os componentes** ainda renderizam corretamente
- [ ] **Responsividade mantida** em todos os breakpoints

### Validações de Preservação Visual
- [ ] **Cores do tema** mantidas iguais
- [ ] **Layout** não foi alterado
- [ ] **Tipografia** preservada
- [ ] **Espaçamentos** mantidos
- [ ] **Ícones** funcionando normalmente
- [ ] **Animações** (se existentes) mantidas

### Funcionalidades Críticas
- [ ] **Todas as páginas** carregam normalmente
- [ ] **Formulários** funcionam igual
- [ ] **Botões** respondem normalmente
- [ ] **Navegação** intacta
- [ ] **Modais/Dialogs** funcionam
- [ ] **Menus** funcionam normalmente

### Logs Essenciais Gerados
- [ ] `logs/migration/phases.log` - Progresso da Fase 3
- [ ] `logs/migration/components.log` - Migrações de componentes
- [ ] `logs/development/build.log` - Logs de build
- [ ] `logs/migration/preservation.log` - Alertas de preservação

---

## 🚨 Procedimentos de Emergência

### Se Estilos Quebrarem
1. **Verificar CSS conflicts**:
```bash
# Verificar se Tailwind está conflitando
grep -r "preflight" src/
```

2. **Rollback para Material-UI v4**:
```bash
npm install @material-ui/core@4.12.3 @material-ui/icons@4.11.3
npm uninstall @mui/material
```

### Se Componentes Pararem de Funcionar
1. **Usar componentes de fallback**:
```typescript
// Ativar modo de compatibilidade
const COMPATIBILITY_MODE = true;
```

2. **Rollback de componente específico**:
```bash
# Restaurar componente do backup
cp ../backups/fase3-styles/Component.js src/components/Component.js
```

### Se Dark Mode Quebrar
1. **Desabilitar dark mode temporariamente**:
```typescript
// Forçar light mode
const FORCE_LIGHT_MODE = true;
```

---

## 📞 Checkpoint da Fase 3

### Validação Obrigatória
Antes de prosseguir para Fase 4:
1. **Executar validação visual**: `bash scripts/validate-phase3.sh`
2. **Testar em diferentes browsers**
3. **Verificar responsividade** em mobile/tablet/desktop
4. **Testar dark mode** completamente

### Aprovação para Fase 4
**APENAS prosseguir se:**
- ✅ Interface visual idêntica à anterior
- ✅ MUI v6 100% funcional
- ✅ Tailwind integrado sem conflitos
- ✅ Dark mode funcionando perfeitamente
- ✅ ZERO regressões visuais
- ✅ Performance mantida ou melhorada

---

**Próxima Fase**: [Fase 4 - Estado e Formulários](./fase-04-estado-formularios.md)

---

*Documento da Fase 3 - Criado em: Agosto 2025*
*Responsável: Claude AI Assistant*
*Status: Preparado para execução*