// src/theme/mui-theme.ts - Tema unificado preservando cores atuais
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

// Preservar cores do tema atual do sistema
const currentPrimaryColor = '#065183'; // Cor principal atual
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