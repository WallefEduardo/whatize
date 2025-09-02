import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import logger from '../../utils/logger';
import ModernToast from '../ModernToast';
import './toast.css';

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
  // Forçar posição do toast container com máxima agressividade
  React.useEffect(() => {
    const forceToastPosition = () => {
      const containers = document.querySelectorAll('[data-hot-toaster], .toast-fixed-position');
      containers.forEach(container => {
        if (container) {
          Object.assign(container.style, {
            position: 'fixed',
            top: '95px',
            right: '0px',
            left: 'auto',
            bottom: 'auto',
            transform: 'none',
            zIndex: '999999',
            margin: '0',
            padding: '0',
            width: 'auto',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          });
        }
      });
    };

    // Observer para detectar quando elementos são adicionados
    const observer = new MutationObserver(forceToastPosition);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Executar imediatamente e a cada 10ms
    forceToastPosition();
    const interval = setInterval(forceToastPosition, 10);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

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
      position: 'top-right',
      toastOptions: {
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
          position: 'relative',
        },
      },
      containerClassName: 'toast-fixed-position',
      containerStyle: {},
    })
  );
};

// Wrapper de compatibilidade com react-toastify usando ModernToast
export const toast = {
  success: (message, options = {}) => {
    const title = options.title || undefined;
    return hotToast.custom(
      (t) => (
        <ModernToast
          type="success"
          title={title}
          message={message}
          visible={t.visible}
          onClose={() => hotToast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
        ...options,
      }
    );
  },

  error: (message, options = {}) => {
    // Apenas log crítico se necessário
    if (message && message !== 'undefined') {
      console.error(`Toast error: ${message}`);
    }
    
    const title = options.title || undefined;
    return hotToast.custom(
      (t) => (
        <ModernToast
          type="error"
          title={title}
          message={message || 'Erro desconhecido'}
          visible={t.visible}
          onClose={() => hotToast.dismiss(t.id)}
        />
      ),
      {
        duration: 5000, // Erros ficam mais tempo
        ...options,
      }
    );
  },

  info: (message, options = {}) => {
    const title = options.title || undefined;
    return hotToast.custom(
      (t) => (
        <ModernToast
          type="info"
          title={title}
          message={message}
          visible={t.visible}
          onClose={() => hotToast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
        ...options,
      }
    );
  },

  warning: (message, options = {}) => {
    const title = options.title || undefined;
    return hotToast.custom(
      (t) => (
        <ModernToast
          type="warning"
          title={title}
          message={message}
          visible={t.visible}
          onClose={() => hotToast.dismiss(t.id)}
        />
      ),
      {
        duration: 4500,
        ...options,
      }
    );
  },

  loading: (message, options = {}) => {
    const title = options.title || "Carregando...";
    return hotToast.custom(
      (t) => (
        <ModernToast
          type="info"
          title={title}
          message={message}
          visible={t.visible}
          onClose={() => hotToast.dismiss(t.id)}
        />
      ),
      {
        duration: Infinity, // Loading fica até ser removido manualmente
        ...options,
      }
    );
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