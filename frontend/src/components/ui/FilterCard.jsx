import React from 'react';
import { Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * FilterCard - Card moderno com glassmorphism para seções de filtros
 */
const FilterCard = ({ 
  children, 
  className = '', 
  animate = true,
  ...props 
}) => {
  const cardContent = (
    <Paper
      className={cn(
        // Base styles
        'relative overflow-visible p-6',
        // Glassmorphism effect
        'bg-white/95 backdrop-blur-sm',
        // Modern shadows
        'shadow-lg shadow-gray-200/50',
        // Border and radius
        'border border-gray-100 rounded-2xl',
        // Dark mode support
        'dark:bg-gray-900/95 dark:border-gray-800 dark:shadow-gray-900/50',
        // Responsive padding
        'sm:p-8',
        className
      )}
      elevation={0}
      {...props}
    >
      {children}
    </Paper>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default FilterCard;