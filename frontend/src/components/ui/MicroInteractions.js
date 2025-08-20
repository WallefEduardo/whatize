import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { logger } from '../../utils/logger';
import { phase5Logger } from '../../utils/logger-phase5';

// Hook para micro-interações
export const useMicroInteraction = (element) => {
  const controls = useAnimation();
  
  const trigger = React.useCallback(async (interaction) => {
    try {
      switch (interaction) {
        case 'success':
          await controls.start({
            scale: [1, 1.05, 1],
            transition: { duration: 0.3 }
          });
          break;
          
        case 'error':
          await controls.start({
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5 }
          });
          break;
          
        case 'attention':
          await controls.start({
            scale: [1, 1.02, 1],
            transition: { duration: 0.6, repeat: 2 }
          });
          break;
          
        default:
          break;
      }
      
      phase5Logger.uxEnhancements.microInteraction(element, interaction, true);
    } catch (error) {
      logger.development.error('Micro-interaction failed');
      phase5Logger.uxEnhancements.microInteraction(element, interaction, false);
    }
  }, [controls, element]);
  
  return { controls, trigger };
};

// Botão com feedback táctil
export const FeedbackButton = ({
  children,
  onClick,
  feedback = 'none',
  disabled = false,
  className = ''
}) => {
  const { controls, trigger } = useMicroInteraction('FeedbackButton');
  
  const handleClick = async () => {
    if (disabled) return;
    
    // Feedback imediato
    await controls.start({
      scale: 0.95,
      transition: { duration: 0.1 }
    });
    
    await controls.start({
      scale: 1,
      transition: { duration: 0.1 }
    });
    
    // Executar ação
    onClick?.();
    
    // Feedback baseado no resultado
    if (feedback !== 'none') {
      await trigger(feedback);
    }
  };
  
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  const stateClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-90';

  return React.createElement(
    motion.button,
    {
      animate: controls,
      onClick: handleClick,
      disabled: disabled,
      className: `${baseClasses} ${stateClasses} ${className}`,
      whileHover: !disabled ? { scale: 1.02 } : {},
      whileTap: !disabled ? { scale: 0.98 } : {},
    },
    children
  );
};

// Input com feedback visual
export const FeedbackInput = ({
  value,
  onChange,
  placeholder,
  error,
  success,
  className = ''
}) => {
  const { controls, trigger } = useMicroInteraction('FeedbackInput');
  
  React.useEffect(() => {
    if (error) {
      trigger('error');
    } else if (success) {
      trigger('success');
    }
  }, [error, success, trigger]);
  
  const baseClasses = 'w-full px-3 py-2 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';
  const successClasses = success ? 'border-green-500 focus:ring-green-500' : '';
  const normalClasses = !error && !success ? 'border-gray-300 focus:border-primary-500' : '';

  return React.createElement(motion.input, {
    animate: controls,
    value: value,
    onChange: (e) => onChange(e.target.value),
    placeholder: placeholder,
    className: `${baseClasses} ${errorClasses} ${successClasses} ${normalClasses} ${className}`,
    whileFocus: { scale: 1.01 },
  });
};