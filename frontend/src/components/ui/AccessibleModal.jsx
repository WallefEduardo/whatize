import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useFocusManagement, useScreenReader, useKeyboardNavigation } from '../../utils/accessibility';
import { scaleIn } from '../../animations/motion-config';
import { phase5Logger } from '../../utils/logger-phase5';

const AccessibleModal = ({
  open,
  onClose,
  title,
  children,
  preserveOriginalBehavior = true,
}) => {
  const modalRef = React.useRef(null);
  const { trapFocus, releaseFocus } = useFocusManagement();
  const { announce } = useScreenReader();
  
  // Navegação por teclado
  useKeyboardNavigation(
    undefined, // Enter não faz nada no modal
    onClose,   // Escape fecha o modal
    undefined  // Arrow keys não fazem nada
  );
  
  React.useEffect(() => {
    if (open) {
      // Anunciar abertura do modal
      announce(`Modal aberto: ${title}`, 'assertive');
      
      // Configurar focus trap
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current);
        return cleanup;
      }
    } else {
      releaseFocus();
    }
  }, [open, title, announce, trapFocus, releaseFocus]);
  
  // Log de acessibilidade
  React.useEffect(() => {
    if (open) {
      phase5Logger.uxEnhancements.accessibilityImplementation(
        'AccessibleModal',
        'focus-management',
        true
      );
      
      phase5Logger.uxEnhancements.accessibilityImplementation(
        'AccessibleModal',
        'keyboard-navigation',
        true
      );
    }
  }, [open]);
  
  if (preserveOriginalBehavior) {
    // Modo de compatibilidade - usar MUI Dialog padrão
    return React.createElement(
      Dialog,
      {
        open: open,
        onClose: onClose,
        'aria-labelledby': 'modal-title',
        'aria-describedby': 'modal-content',
        maxWidth: 'md',
        fullWidth: true,
      },
      React.createElement(DialogTitle, { id: 'modal-title' }, title),
      React.createElement(DialogContent, { id: 'modal-content' }, children)
    );
  }
  
  // Modo completo com animações
  return React.createElement(
    AnimatePresence,
    null,
    open && React.createElement(
      React.Fragment,
      null,
      // Backdrop
      React.createElement(motion.div, {
        className: 'fixed inset-0 bg-black bg-opacity-50 z-40',
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: onClose,
      }),
      
      // Modal
      React.createElement(
        motion.div,
        {
          ref: modalRef,
          className: 'fixed inset-0 z-50 flex items-center justify-center p-4',
          variants: scaleIn,
          initial: 'initial',
          animate: 'animate',
          exit: 'exit',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-labelledby': 'modal-title',
          'aria-describedby': 'modal-content',
        },
        React.createElement(
          'div',
          { className: 'bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-full overflow-auto' },
          React.createElement(
            'div',
            { className: 'p-6' },
            React.createElement(
              'h2',
              { id: 'modal-title', className: 'text-lg font-semibold mb-4' },
              title
            ),
            
            React.createElement(
              'div',
              { id: 'modal-content' },
              children
            ),
            
            // Botão de fechar acessível
            React.createElement(
              'button',
              {
                onClick: onClose,
                className: 'mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500',
                'aria-label': 'Fechar modal',
              },
              'Fechar'
            )
          )
        )
      )
    )
  );
};

export default AccessibleModal;