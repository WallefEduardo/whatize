import React from 'react';
import { motion } from 'framer-motion';
import { CircularProgress, Skeleton } from '@mui/material';
import { spinLoader, pulseLoader } from '../../animations/motion-config';
import { phase5Logger } from '../../utils/logger-phase5';

// Loading Spinner moderno
export const LoadingSpinner = ({
  size = 'medium',
  color = 'primary',
  text
}) => {
  React.useEffect(() => {
    phase5Logger.uxEnhancements.loadingStateImplementation(
      'LoadingSpinner',
      'spinner',
      true
    );
  }, []);

  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60,
  };

  return React.createElement(
    'div',
    { className: 'flex flex-col items-center justify-center p-4' },
    React.createElement(
      motion.div,
      { variants: spinLoader, animate: 'animate' },
      React.createElement(CircularProgress, {
        size: sizeMap[size],
        color: color,
        thickness: 4,
      })
    ),
    text && React.createElement(
      motion.p,
      {
        className: 'mt-2 text-sm text-gray-600 dark:text-gray-400',
        variants: pulseLoader,
        animate: 'animate'
      },
      text
    )
  );
};

// Loading Skeleton para listas
export const LoadingSkeleton = ({
  items = 3,
  height = 60,
  variant = 'rectangular'
}) => {
  React.useEffect(() => {
    phase5Logger.uxEnhancements.loadingStateImplementation(
      'LoadingSkeleton',
      'skeleton',
      true
    );
  }, []);

  return React.createElement(
    'div',
    { className: 'space-y-2' },
    Array.from({ length: items }).map((_, index) =>
      React.createElement(Skeleton, {
        key: index,
        variant: variant,
        height: height,
        animation: 'wave',
      })
    )
  );
};

// Loading Button State
export const LoadingButton = ({
  loading,
  children,
  onClick,
  disabled,
  variant = 'contained'
}) => {
  const handleClick = () => {
    if (!loading && !disabled && onClick) {
      onClick();
    }
  };

  const baseClasses = 'relative px-4 py-2 rounded-md font-medium transition-all duration-200';
  const variantClasses = {
    contained: 'bg-primary-500 text-white hover:bg-primary-600',
    outlined: 'border border-primary-500 text-primary-500 hover:bg-primary-50',
    text: 'text-primary-500 hover:bg-primary-50'
  };
  const stateClasses = (loading || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return React.createElement(
    motion.button,
    {
      onClick: handleClick,
      disabled: loading || disabled,
      className: `${baseClasses} ${variantClasses[variant]} ${stateClasses}`,
      whileTap: !loading && !disabled ? { scale: 0.95 } : {},
    },
    loading && React.createElement(
      motion.div,
      {
        className: 'absolute inset-0 flex items-center justify-center',
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      },
      React.createElement(LoadingSpinner, { size: 'small' })
    ),
    React.createElement(
      motion.span,
      {
        className: loading ? 'opacity-0' : 'opacity-100',
        transition: { duration: 0.2 },
      },
      children
    )
  );
};

// Loading Overlay para páginas
export const LoadingOverlay = ({
  loading,
  text = 'Carregando...',
  children
}) => {
  return React.createElement(
    'div',
    { className: 'relative' },
    children,
    loading && React.createElement(
      motion.div,
      {
        className: 'absolute inset-0 bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80 flex items-center justify-center z-50',
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      React.createElement(LoadingSpinner, { text })
    )
  );
};