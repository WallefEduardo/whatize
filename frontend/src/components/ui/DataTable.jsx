import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton
} from '@mui/material';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * DataTable - Tabela moderna com hover effects e loading states
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  onRowClick,
  className = '',
  animate = true,
  ...props
}) => {
  // Loading skeleton
  const LoadingSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          {columns.map((column, colIndex) => (
            <TableCell key={`skeleton-cell-${index}-${colIndex}`}>
              <Skeleton 
                variant="text" 
                height={24}
                className="animate-pulse"
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );

  const tableContent = (
    <Paper
      className={cn(
        'overflow-hidden rounded-2xl',
        'border border-gray-100',
        'shadow-lg shadow-gray-200/50',
        // Dark mode
        'dark:border-gray-800 dark:shadow-gray-900/50',
        className
      )}
      elevation={0}
    >
      <TableContainer
        className="max-h-[70vh] overflow-auto"
        sx={{
          // Custom scrollbar
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }
          },
        }}
      >
        <Table stickyHeader {...props}>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={column.key || index}
                  align={column.align || 'left'}
                  className={cn(
                    // Sticky header with blur
                    'backdrop-blur-md bg-white/80',
                    'border-b border-gray-200',
                    'font-semibold text-gray-800',
                    'py-4 px-6',
                    // Dark mode
                    'dark:bg-gray-900/80 dark:text-gray-100 dark:border-gray-700'
                  )}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              data.map((row, rowIndex) => (
                <motion.tr
                  key={row.id || rowIndex}
                  initial={animate ? { opacity: 0, y: 20 } : {}}
                  animate={animate ? { opacity: 1, y: 0 } : {}}
                  transition={animate ? { 
                    duration: 0.3, 
                    delay: rowIndex * 0.05,
                    ease: 'easeOut' 
                  } : {}}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    // Hover effects
                    'hover:bg-gray-50 hover:shadow-md hover:shadow-gray-200/50',
                    'hover:scale-[1.01] hover:-translate-y-[1px]',
                    // Dark mode
                    'dark:hover:bg-gray-800',
                    // Click handler
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick && onRowClick(row)}
                  component="tr"
                >
                  {columns.map((column, colIndex) => (
                    <TableCell
                      key={column.key || colIndex}
                      align={column.align || 'left'}
                      className="py-4 px-6 border-b border-gray-100 dark:border-gray-800"
                    >
                      {column.render 
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]
                      }
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  return tableContent;
};

export default DataTable;