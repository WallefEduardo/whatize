import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { fadeInUp } from '../../animations/motion-config';
import { logger } from '../../utils/logger';
import { phase5Logger } from '../../utils/logger-phase5';

const PageTransition = ({ 
  children, 
  preserveNavigation = true // Garantir que navegação não quebra
}) => {
  const location = useLocation();
  
  React.useEffect(() => {
    logger.development.build(`Page transition: ${location.pathname}`);
    phase5Logger.uxEnhancements.userFlowPreservation(
      'page-navigation',
      true,
      [`Navegação para ${location.pathname}`]
    );
  }, [location.pathname]);

  if (preserveNavigation) {
    // Modo seguro: apenas fade simples
    return React.createElement(
      AnimatePresence,
      { mode: "wait" },
      React.createElement(
        motion.div,
        {
          key: location.pathname,
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.2 }
        },
        children
      )
    );
  }

  // Modo completo: animação mais elaborada
  return React.createElement(
    AnimatePresence,
    { mode: "wait" },
    React.createElement(
      motion.div,
      {
        key: location.pathname,
        variants: fadeInUp,
        initial: "initial",
        animate: "animate",
        exit: "exit"
      },
      children
    )
  );
};

export default PageTransition;