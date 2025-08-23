import React from "react";
import { createRoot } from "react-dom/client"; // React 18 API
import CssBaseline from "@mui/material/CssBaseline";
import * as serviceworker from './serviceWorker'

import App from "./App";

// Log da migração
console.log('[MIGRATION] Inicializando React 18');

// Verificar se elemento root existe (preservar funcionalidade)
const container = document.getElementById('root');
if (!container) {
  console.error('[MIGRATION ERROR] Elemento root não encontrado!');
  throw new Error('Elemento root não encontrado - verifique index.html');
}

// Usar nova API do React 18, mas com fallback
try {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <CssBaseline>
        <App />
      </CssBaseline>
    </React.StrictMode>
  );
  console.log('[MIGRATION] React 18 inicializado com sucesso');
  
  // Preservar funcionalidade do finishProgress
  if (window.finishProgress) {
    window.finishProgress();
  }
} catch (error) {
  console.error('[MIGRATION ERROR] Falha ao inicializar React 18:', error);
  // Em caso de erro, manter funcionalidade (não implementar fallback aqui, apenas logar)
  throw error;
}

serviceworker.register()