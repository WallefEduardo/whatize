import React from 'react';
import { Box, IconButton, Typography, Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cva } from '../../../lib/cva';

// Variantes do CVA para os botões de paginação
const paginationButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-9 w-9 text-sm",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "sm",
    },
  }
);

const CustomPagination = ({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
  selectedRows = 0
}) => {
  // Calcular range de registros
  const startRecord = Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords);
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  // Gerar array de páginas para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        p: 3,
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-primary)',
        width: '100%'
      }}
    >
      {/* Info lado esquerdo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
        >
          {selectedRows > 0 && (
            <>
              {selectedRows} de {totalRecords} linha(s) selecionada(s)
            </>
          )}
          {selectedRows === 0 && totalRecords > 0 && (
            <>
              Mostrando {startRecord}-{endRecord} de {totalRecords} resultados
            </>
          )}
          {totalRecords === 0 && "Nenhum resultado encontrado"}
        </Typography>
      </Box>

      {/* Controles de paginação */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Botão anterior */}
          <IconButton
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            sx={{
              width: 32,
              height: 32,
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: 'var(--hover-bg-light)',
                color: 'var(--color-accent)',
                borderColor: 'var(--color-accent)'
              },
              '&:disabled': {
                opacity: 0.5,
                cursor: 'not-allowed',
                '&:hover': {
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-primary)'
                }
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronLeft size={16} />
          </IconButton>

          {/* Números das páginas */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {pageNumbers.map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <Box
                  key={pageNum}
                  component="button"
                  onClick={() => onPageChange(pageNum)}
                  className={paginationButtonVariants({
                    variant: isActive ? 'default' : 'outline',
                    size: 'sm'
                  })}
                  sx={{
                    width: 32,
                    height: 32,
                    border: isActive ? 'none' : '1px solid var(--border-primary)',
                    backgroundColor: isActive 
                      ? 'var(--color-accent)' 
                      : 'var(--bg-secondary)',
                    color: isActive 
                      ? 'white' 
                      : 'var(--text-secondary)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? 'var(--color-accent)' 
                        : 'var(--hover-bg-light)',
                      color: isActive 
                        ? 'white' 
                        : 'var(--color-accent)',
                      borderColor: isActive 
                        ? 'var(--color-accent)' 
                        : 'var(--color-accent)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {pageNum}
                </Box>
              );
            })}
          </Box>

          {/* Botão próximo */}
          <IconButton
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            sx={{
              width: 32,
              height: 32,
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: 'var(--hover-bg-light)',
                color: 'var(--color-accent)',
                borderColor: 'var(--color-accent)'
              },
              '&:disabled': {
                opacity: 0.5,
                cursor: 'not-allowed',
                '&:hover': {
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-primary)'
                }
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronRight size={16} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default CustomPagination;