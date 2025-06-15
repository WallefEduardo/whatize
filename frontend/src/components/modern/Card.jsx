import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'soft',
  hover = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200';
  
  const variants = {
    default: '',
    glass: 'glass',
    gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20',
    bordered: 'border-2 border-primary-200 dark:border-primary-700',
  };
  
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };
  
  const shadows = {
    none: 'shadow-none',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong',
  };
  
  const hoverEffects = hover ? 'hover:shadow-medium hover:-translate-y-1 cursor-pointer' : '';
  
  const classes = twMerge(
    baseClasses,
    variants[variant],
    paddings[padding],
    shadows[shadow],
    hoverEffects,
    className
  );
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };
  
  return (
    <motion.div
      className={classes}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4 } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Componentes auxiliares para estruturar o Card
Card.Header = ({ children, className = '', ...props }) => (
  <div className={twMerge('border-b border-gray-100 dark:border-gray-700 pb-4 mb-4', className)} {...props}>
    {children}
  </div>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div className={twMerge('', className)} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={twMerge('border-t border-gray-100 dark:border-gray-700 pt-4 mt-4', className)} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className = '', ...props }) => (
  <h3 className={twMerge('text-lg font-semibold text-gray-900 dark:text-white', className)} {...props}>
    {children}
  </h3>
);

Card.Subtitle = ({ children, className = '', ...props }) => (
  <p className={twMerge('text-sm text-gray-500 dark:text-gray-400 mt-1', className)} {...props}>
    {children}
  </p>
);

export default Card; 