import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  variant = 'default',
  size = 'md',
  className = '',
  containerClassName = '',
  type = 'text',
  ...props
}, ref) => {
  const baseClasses = 'w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500',
    error: 'border-error-300 bg-error-50 dark:bg-error-900/20 text-error-900 dark:text-error-200 placeholder-error-400 focus:ring-error-500 focus:border-error-500',
    success: 'border-success-300 bg-success-50 dark:bg-success-900/20 text-success-900 dark:text-success-200 placeholder-success-400 focus:ring-success-500 focus:border-success-500',
    glass: 'glass border-white/20 dark:border-gray-700/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const currentVariant = error ? 'error' : variant;
  
  const inputClasses = twMerge(
    baseClasses,
    variants[currentVariant],
    sizes[size],
    icon && iconPosition === 'left' ? 'pl-10' : '',
    icon && iconPosition === 'right' ? 'pr-10' : '',
    className
  );
  
  const containerClasses = twMerge('relative', containerClassName);
  
  return (
    <div className={containerClasses}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={`${iconSizes[size]} text-gray-400`}>
              {icon}
            </span>
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={type}
          className={inputClasses}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.1 }}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className={`${iconSizes[size]} text-gray-400`}>
              {icon}
            </span>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <motion.p
          className={`mt-2 text-sm ${error ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 