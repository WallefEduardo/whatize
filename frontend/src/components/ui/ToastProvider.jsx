import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { logger } from '../../utils/logger';
import { phase5Logger } from '../../utils/logger-phase5';

// Configuração que preserva comportamento atual
const toastConfig = {
  duration: 4000, // Mesmo tempo que react-toastify
  position: 'top-right', // Posição atual
  style: {
    borderRadius: '8px',
    background: '#333',
    color: '#fff',
    fontSize: '14px',
    maxWidth: '500px',
  },
};

// Provider que integra com tema atual
export const ToastProvider = ({ children }) => {
  // Detectar tema usando CSS custom properties ou context
  const isDark = React.useMemo(() => {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ||
             document.documentElement.classList.contains('dark') ||
             localStorage.getItem('preferredTheme') === 'dark';
    } catch {
      return false;
    }
  }, []);

  const toasterConfig = {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      background: isDark ? '#333' : '#fff',
      color: isDark ? '#fff' : '#333',
      border: isDark ? '1px solid #555' : '1px solid #e0e0e0',
    },
  };

  return React.createElement(
    React.Fragment,
    null,
    children,
    React.createElement(Toaster, {
      toastOptions: toasterConfig,
      containerStyle: {
        top: 20,
        right: 20,
      },
    })
  );
};

// Wrapper de compatibilidade com react-toastify
export const toast = {
  success: (message, options = {}) => {
    logger.development.build('Toast success');
    phase5Logger.uxEnhancements.toastMigration('success', true, true);
    
    return hotToast.success(message, {
      ...toastConfig,
      ...options,
      icon: '✅',
    });
  },

  error: (message, options = {}) => {
    logger.development.error('Toast error');
    logger.production.error('User notification error');
    phase5Logger.uxEnhancements.toastMigration('error', true, true);
    
    return hotToast.error(message, {
      ...toastConfig,
      ...options,
      icon: '❌',
      duration: 5000, // Erros ficam mais tempo
    });
  },

  info: (message, options = {}) => {
    logger.development.build('Toast info');
    phase5Logger.uxEnhancements.toastMigration('info', true, true);
    
    return hotToast(message, {
      ...toastConfig,
      ...options,
      icon: 'ℹ️',
    });
  },

  warning: (message, options = {}) => {
    logger.development.build('Toast warning');
    phase5Logger.uxEnhancements.toastMigration('warning', true, true);
    
    return hotToast(message, {
      ...toastConfig,
      ...options,
      icon: '⚠️',
      style: {
        ...toastConfig.style,
        background: '#ff9800',
        color: '#fff',
      },
    });
  },

  loading: (message, options = {}) => {
    logger.development.build('Toast loading');
    phase5Logger.uxEnhancements.toastMigration('loading', true, true);
    
    return hotToast.loading(message, {
      ...toastConfig,
      ...options,
    });
  },

  // Métodos de controle
  dismiss: (toastId) => {
    return hotToast.dismiss(toastId);
  },

  remove: (toastId) => {
    return hotToast.remove(toastId);
  },

  // Compatibilidade com react-toastify
  POSITION: {
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left',
  },
};

// Hook para toasts com contexto
export const useToast = () => {
  return {
    toast,
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
    loading: toast.loading,
  };
};