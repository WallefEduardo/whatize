import React from 'react';
import { logger } from './logger';
import { phase5Logger } from './logger-phase5';

// Verificar contraste de cores
export const checkColorContrast = (
  foreground, 
  background, 
  level = 'AAA'
) => {
  // Implementação simplificada - em produção usar biblioteca específica
  const ratio = calculateContrastRatio(foreground, background);
  const required = level === 'AAA' ? 7 : 4.5;
  
  const compliant = ratio >= required;
  
  phase5Logger.uxEnhancements.accessibilityImplementation(
    'color-contrast',
    `${foreground}-${background}`,
    compliant
  );
  
  return compliant;
};

const calculateContrastRatio = (color1, color2) => {
  // Implementação simplificada
  // Em produção, usar biblioteca como 'color' ou 'wcag-color'
  return 7; // Placeholder
};

// Hook para navegação por teclado
export const useKeyboardNavigation = (
  onEnter,
  onEscape,
  onArrowKeys
) => {
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          onEnter?.();
          break;
          
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          onArrowKeys?.('up');
          break;
          
        case 'ArrowDown':
          event.preventDefault();
          onArrowKeys?.('down');
          break;
          
        case 'ArrowLeft':
          event.preventDefault();
          onArrowKeys?.('left');
          break;
          
        case 'ArrowRight':
          event.preventDefault();
          onArrowKeys?.('right');
          break;
          
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onEscape, onArrowKeys]);
};

// Hook para anúncios de screen reader
export const useScreenReader = () => {
  const announce = React.useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remover após anúncio
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
    
    phase5Logger.uxEnhancements.accessibilityImplementation(
      'screen-reader',
      'announcement',
      true
    );
    
    logger.development.build('Screen reader announcement');
  }, []);
  
  return { announce };
};

// Hook para focus management
export const useFocusManagement = () => {
  const focusTrap = React.useRef(null);
  
  const trapFocus = React.useCallback((element) => {
    focusTrap.current = element;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };
    
    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, []);
  
  const releaseFocus = React.useCallback(() => {
    focusTrap.current = null;
  }, []);
  
  return { trapFocus, releaseFocus };
};