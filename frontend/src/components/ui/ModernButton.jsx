import React from 'react';
import { Button as MuiButton } from '@mui/material';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * ModernButton - Botão estilizado com variantes e micro-animações
 */
const ModernButton = ({
  variant = 'primary',
  size = 'medium',
  animate = true,
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  // Variantes de estilo
  const variants = {
    primary: cn(
      'bg-gradient-to-r from-[#065183] to-[#1976d2]',
      'text-white font-semibold',
      'hover:shadow-lg hover:shadow-blue-500/25',
      'active:scale-95',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ),
    secondary: cn(
      'bg-white border-2 border-[#065183]',
      'text-[#065183] font-semibold',
      'hover:bg-[#065183] hover:text-white',
      'hover:shadow-lg hover:shadow-blue-500/25',
      'active:scale-95',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ),
    ghost: cn(
      'bg-transparent border border-gray-300',
      'text-gray-700 font-medium',
      'hover:bg-gray-50 hover:border-gray-400',
      'active:scale-95',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ),
    danger: cn(
      'bg-gradient-to-r from-red-500 to-red-600',
      'text-white font-semibold',
      'hover:shadow-lg hover:shadow-red-500/25',
      'active:scale-95',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ),
  };

  // Tamanhos
  const sizes = {
    small: 'px-4 py-2 text-sm rounded-lg min-h-[32px]',
    medium: 'px-6 py-3 text-sm rounded-xl min-h-[40px]',
    large: 'px-8 py-4 text-base rounded-xl min-h-[48px]',
  };

  const buttonContent = (
    <MuiButton
      className={cn(
        // Base styles
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
        'transform-gpu', // GPU acceleration
        // Variant styles
        variants[variant],
        // Size styles
        sizes[size],
        // Custom className
        className
      )}
      disabled={disabled}
      disableElevation
      disableRipple
      {...props}
    >
      {children}
    </MuiButton>
  );

  if (animate && !disabled) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {buttonContent}
      </motion.div>
    );
  }

  return buttonContent;
};

export default ModernButton;