import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { shouldAnimate, fadeInUp, slideInFromRight, scaleIn } from '../../animations/motion-config';
import { logger } from '../../utils/logger';
import { phase5Logger } from '../../utils/logger-phase5';

const AnimatedWrapper = ({
  children,
  animation = 'fadeInUp',
  disabled = false,
  preserveFunctionality = true, // Flag de segurança
  onAnimationStart,
  onAnimationComplete,
  ...motionProps
}) => {
  const [animationPerformance, setAnimationPerformance] = React.useState(0);
  
  // Verificar se deve animar
  const canAnimate = shouldAnimate() && !disabled;
  
  const handleAnimationStart = () => {
    const startTime = performance.now();
    setAnimationPerformance(startTime);
    onAnimationStart?.();
  };
  
  const handleAnimationComplete = () => {
    if (animationPerformance > 0) {
      const duration = performance.now() - animationPerformance;
      phase5Logger.uxEnhancements.animationImplementation(
        'AnimatedWrapper',
        animation,
        duration
      );
    }
    onAnimationComplete?.();
  };

  // Se não deve animar ou preservar funcionalidade é prioridade
  if (!canAnimate || preserveFunctionality) {
    return React.createElement('div', motionProps, children);
  }

  // Selecionar variante de animação
  const getVariants = () => {
    switch (animation) {
      case 'fadeInUp': return fadeInUp;
      case 'slideInFromRight': return slideInFromRight;
      case 'scaleIn': return scaleIn;
      default: return fadeInUp;
    }
  };

  try {
    return React.createElement(
      motion.div,
      {
        variants: getVariants(),
        initial: "initial",
        animate: "animate",
        exit: "exit",
        onAnimationStart: handleAnimationStart,
        onAnimationComplete: handleAnimationComplete,
        ...motionProps
      },
      children
    );
  } catch (error) {
    // Fallback para div normal se animação falhar
    logger.development.error('AnimatedWrapper error, fallback to div');
    logger.migration.warningPreservation(`Animação falhou, usando fallback: ${error.message}`);
    return React.createElement('div', motionProps, children);
  }
};

export default AnimatedWrapper;

// Hook para animações condicionais
export const useConditionalAnimation = (condition, fallback = true) => {
  return {
    animate: condition && shouldAnimate(),
    fallback: fallback && !condition,
  };
};

// Hook para medir performance de animações
export const useAnimationPerformance = (componentName) => {
  const measureAnimation = React.useCallback((animationType) => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      phase5Logger.uxEnhancements.animationImplementation(
        componentName,
        animationType,
        duration
      );
    };
  }, [componentName]);
  
  return { measureAnimation };
};