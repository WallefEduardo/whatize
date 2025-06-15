import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700 focus:ring-secondary-500',
    success: 'bg-success-500 hover:bg-success-600 text-white focus:ring-success-500',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white focus:ring-warning-500',
    error: 'bg-error-500 hover:bg-error-600 text-white focus:ring-error-500',
    whatsapp: 'bg-whatsapp-500 hover:bg-whatsapp-600 text-white focus:ring-whatsapp-500',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
    glass: 'glass text-gray-700 dark:text-gray-200 hover:bg-white/90 dark:hover:bg-gray-800/90 focus:ring-primary-500',
  };
  
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };
  
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };
  
  const classes = twMerge(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );
  
  const LoadingSpinner = () => (
    <svg className={`animate-spin ${iconSizes[size]} mr-2`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && (
        <span className={`${iconSizes[size]} mr-2`}>
          {icon}
        </span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className={`${iconSizes[size]} ml-2`}>
          {icon}
        </span>
      )}
    </motion.button>
  );
};

export default Button; 