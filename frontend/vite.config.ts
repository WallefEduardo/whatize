import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,tsx,js,ts}",
      jsxRuntime: 'automatic',
      babel: {
        parserOpts: {
          plugins: ['jsx']
        }
      }
    })
  ],
  worker: {
    format: 'es'
  },
  root: '.', // Define o diretório raiz
  publicDir: 'public', // Diretório público
  esbuild: {
    loader: 'jsx'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Manter aliases existentes para não quebrar imports
      'src': path.resolve(__dirname, './src'),
      'components': path.resolve(__dirname, './src/components'),
      'pages': path.resolve(__dirname, './src/pages'),
      'services': path.resolve(__dirname, './src/services'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'context': path.resolve(__dirname, './src/context'),
      'utils': path.resolve(__dirname, './src/utils'),
      'assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3002, // Manter porta do projeto
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4002', // Backend na porta 4002
        changeOrigin: true,
        secure: false
      },
      '/public-settings': {
        target: 'http://localhost:4002', // Backend para configurações públicas
        changeOrigin: true,
        secure: false
      },
    },
  },
  assetsInclude: ['**/*.xlsx', '**/*.xls', '**/*.doc', '**/*.docx', '**/*.pdf'],
  build: {
    outDir: 'build', // Manter diretório de build atual
    sourcemap: process.env.NODE_ENV === 'development',
    assetsDir: 'static',
    rollupOptions: {
      output: {
        manualChunks: {
          // Otimização de chunks para melhor performance
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          utils: ['axios', 'date-fns', 'lodash'],
        },
      },
      external: (id) => {
        // Não externalizar mic-recorder-to-mp3, mas tratar como módulo especial
        return false;
      },
      // Configuração especial para mic-recorder-to-mp3
      plugins: [],
      // Configurar esbuild para tratar .js como jsx
      onwarn: (warning, warn) => {
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
      }
    },
    commonjsOptions: {
      // Configurações para lidar com módulos CommonJS como mic-recorder-to-mp3
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  define: {
    // Manter variáveis de ambiente existentes
    global: 'globalThis',
    // Definir processo global para compatibilidade com bibliotecas antigas
    'process.browser': JSON.stringify(true),
    // Definir Lame globalmente para mic-recorder-to-mp3
    'window.Lame': 'window.lamejs',
    'process.env': {
      REACT_APP_BACKEND_URL: JSON.stringify(process.env.REACT_APP_BACKEND_URL || 'http://localhost:4002'),
      REACT_APP_HOURS_CLOSE_TICKETS_AUTO: JSON.stringify(process.env.REACT_APP_HOURS_CLOSE_TICKETS_AUTO || '24'),
      REACT_APP_OPENAI_API_KEY: JSON.stringify(process.env.REACT_APP_OPENAI_API_KEY || ''),
      REACT_APP_FACEBOOK_APP_ID: JSON.stringify(process.env.REACT_APP_FACEBOOK_APP_ID || ''),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  },
  optimizeDeps: {
    include: [
      // Pré-bundling de dependências críticas
      'react', 
      'react-dom',
      'axios',
      'socket.io-client',
      '@mui/material',
      'zustand',
      'webrtc-adapter',
      'lamejs'
    ],
    exclude: [
      // Excluir mic-recorder-to-mp3 do pré-bundling para evitar problemas com Lame
      'mic-recorder-to-mp3'
    ],
    // Forçar pré-bundling em modo de desenvolvimento para detectar problemas
    force: process.env.NODE_ENV === 'development'
  }
})