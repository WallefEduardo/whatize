import React from 'react';
import { Typography, Breadcrumbs, Link } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * PageHeader - Header padrão para todas as páginas
 */
const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  className = '',
  animate = true,
  ...props
}) => {
  const headerContent = (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center sm:justify-between',
      'space-y-4 sm:space-y-0 sm:space-x-6',
      'pb-6 border-b border-gray-200',
      'dark:border-gray-700',
      className
    )} {...props}>
      {/* Title section */}
      <div className="min-w-0 flex-1">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" className="text-gray-400" />}
            className="mb-2"
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography
                  key={index}
                  color="text.primary"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  key={index}
                  href={crumb.href}
                  onClick={crumb.onClick}
                  className="text-sm text-gray-500 hover:text-[#065183] transition-colors"
                  underline="hover"
                >
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}
        
        {/* Title */}
        <Typography
          variant="h4"
          component="h1"
          className={cn(
            'font-bold text-gray-900 dark:text-gray-100',
            'text-2xl sm:text-3xl lg:text-4xl',
            'leading-tight'
          )}
        >
          {title}
        </Typography>
        
        {/* Subtitle */}
        {subtitle && (
          <Typography
            variant="body1"
            className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl"
          >
            {subtitle}
          </Typography>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex-shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {actions}
          </div>
        </div>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {headerContent}
      </motion.div>
    );
  }

  return headerContent;
};

export default PageHeader;