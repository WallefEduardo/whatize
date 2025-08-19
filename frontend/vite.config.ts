import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.', // Define o diretório raiz
  publicDir: 'public', // Diretório público
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
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
    },
  },
  define: {
    // Manter variáveis de ambiente existentes
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      // Pré-bundling de dependências críticas
      'react', 
      'react-dom',
      'axios',
      'socket.io-client',
      '@mui/material',
      'zustand'
    ]
  }
})