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