import React from 'react';
import { Skeleton, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * LoadingState - Componentes de loading elegantes
 */
export const FiltersSkeleton = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn('space-y-4', className)}
  >
    {/* Header skeleton */}
    <Skeleton 
      variant="text" 
      width="30%" 
      height={32}
      className="rounded-lg"
    />
    
    {/* Filters grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton 
            variant="text" 
            width="60%" 
            height={20}
            className="rounded"
          />
          <Skeleton 
            variant="rectangular" 
            height={40}
            className="rounded-xl"
          />
        </div>
      ))}
    </div>
    
    {/* Actions skeleton */}
    <div className="flex justify-end space-x-3 pt-4">
      <Skeleton 
        variant="rectangular" 
        width={120} 
        height={40}
        className="rounded-xl"
      />
      <Skeleton 
        variant="rectangular" 
        width={80} 
        height={40}
        className="rounded-xl"
      />
    </div>
  </motion.div>
);

export const TableSkeleton = ({ rows = 5, columns = 6, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn('space-y-1', className)}
  >
    {/* Header skeleton */}
    <div className="grid gap-4 p-4 bg-gray-50 rounded-t-2xl" style={{gridTemplateColumns: `repeat(${columns}, 1fr)`}}>
      {[...Array(columns)].map((_, index) => (
        <Skeleton 
          key={index}
          variant="text" 
          width={`${60 + Math.random() * 40}%`}
          height={24}
          className="rounded"
        />
      ))}
    </div>
    
    {/* Rows skeleton */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div 
        key={rowIndex} 
        className="grid gap-4 p-4 border-b border-gray-100"
        style={{gridTemplateColumns: `repeat(${columns}, 1fr)`}}
      >
        {[...Array(columns)].map((_, colIndex) => (
          <Skeleton 
            key={colIndex}
            variant="text" 
            width={`${40 + Math.random() * 60}%`}
            height={20}
            className="rounded"
          />
        ))}
      </div>
    ))}
  </motion.div>
);

export const CardSkeleton = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={cn('p-6 bg-white rounded-2xl border border-gray-100', className)}
  >
    <div className="space-y-4">
      <Skeleton 
        variant="text" 
        width="40%" 
        height={24}
        className="rounded-lg"
      />
      <Skeleton 
        variant="rectangular" 
        height={120}
        className="rounded-xl"
      />
      <div className="flex space-x-2">
        <Skeleton 
          variant="rectangular" 
          width={80} 
          height={32}
          className="rounded-lg"
        />
        <Skeleton 
          variant="rectangular" 
          width={100} 
          height={32}
          className="rounded-lg"
        />
      </div>
    </div>
  </motion.div>
);

export const ButtonSkeleton = ({ width = 120, height = 40, className = '' }) => (
  <Skeleton 
    variant="rectangular" 
    width={width} 
    height={height}
    className={cn('rounded-xl animate-pulse', className)}
  />
);

export const InputSkeleton = ({ className = '' }) => (
  <div className={cn('space-y-2', className)}>
    <Skeleton 
      variant="text" 
      width="30%" 
      height={20}
      className="rounded"
    />
    <Skeleton 
      variant="rectangular" 
      height={40}
      className="rounded-xl"
    />
  </div>
);

// Shimmer effect para carregamentos mais elegantes
export const ShimmerSkeleton = ({ className = '', children, ...props }) => (
  <Box
    className={cn(
      'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200',
      'bg-[length:200%_100%] animate-shimmer',
      className
    )}
    {...props}
  >
    {children}
  </Box>
);

// Loading state para toda a página
export const PageSkeleton = () => (
  <div className="space-y-6 p-6">
    <FiltersSkeleton />
    <TableSkeleton />
  </div>
);