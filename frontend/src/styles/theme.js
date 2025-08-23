import { createTheme } from '@mui/material/styles';

/**
 * Theme customizado que integra MUI com Tailwind
 * Cores do sistema: #00C307 (verde principal), #111416 (preto principal)
 */
export const createCustomTheme = (mode = 'light') => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#00C307',
        light: '#33d433',
        dark: '#00a006',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#111416',
        light: '#1a1d21',
        dark: '#000000',
        contrastText: '#ffffff',
      },
      background: {
        default: isLight ? '#f8fafc' : '#0f172a',
        paper: isLight ? '#ffffff' : '#1e293b',
      },
      text: {
        primary: isLight ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
        secondary: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      },
      divider: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      // Custom colors
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#047857',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
        letterSpacing: '-0.015em',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
        letterSpacing: '-0.015em',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.5,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5,
        letterSpacing: '-0.01em',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none',
        letterSpacing: '0.01em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      ...Array(18).fill('0 25px 50px -12px rgba(0, 0, 0, 0.25)'),
    ],
    components: {
      // Button customizations
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 500,
            textTransform: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      // Paper customizations
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
          },
          elevation1: {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      // TextField customizations
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00C307',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00C307',
                boxShadow: `0 0 0 4px rgba(0, 195, 7, 0.1)`,
              },
            },
          },
        },
      },
      // Table customizations
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
          },
          head: {
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          },
        },
      },
      // Card customizations
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
    },
    // Breakpoints compatíveis com Tailwind
    breakpoints: {
      values: {
        xs: 0,
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
      },
    },
  });
};