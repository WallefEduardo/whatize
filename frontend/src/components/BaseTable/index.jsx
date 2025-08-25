import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { DataTable } from 'mantine-datatable';
import { Assessment as AssessmentIcon } from "@mui/icons-material";
import { motion } from "framer-motion";

/**
 * BaseTable - Componente de tabela reutilizável baseado no design do Reports
 * 
 * @param {Object} props
 * @param {Array} props.records - Dados da tabela
 * @param {Array} props.columns - Configuração das colunas
 * @param {boolean} props.loading - Estado de carregamento
 * @param {string} props.noRecordsTitle - Título quando não há registros
 * @param {string} props.noRecordsText - Texto quando não há registros
 * @param {React.ReactNode} props.noRecordsIcon - Ícone quando não há registros
 * @param {number} props.minHeight - Altura mínima da tabela
 * @param {number} props.pageNumber - Página atual
 * @param {number} props.pageSize - Registros por página
 * @param {number} props.totalRecords - Total de registros
 * @param {Function} props.onPageChange - Callback para mudança de página
 * @param {Function} props.onPageSizeChange - Callback para mudança de registros por página
 * @param {boolean} props.showPagination - Mostrar paginação
 * @param {Array} props.pageSizeOptions - Opções de registros por página
 */
const BaseTable = ({
  records = [],
  columns = [],
  loading = false,
  noRecordsTitle = "Nenhum resultado encontrado",
  noRecordsText = "Ajuste os filtros para visualizar os dados",
  noRecordsIcon = <AssessmentIcon style={{ fontSize: 48 }} />,
  minHeight = 400,
  pageNumber = 1,
  pageSize = 10,
  totalRecords = null,
  onPageChange = () => {},
  onPageSizeChange = () => {},
  showPagination = true,
  pageSizeOptions = [5, 10, 20, 50],
  ...props
}) => {
  // Se totalRecords não for fornecido, usar records.length
  const effectiveTotalRecords = totalRecords !== null ? totalRecords : records.length;
  const hasRecords = records && records.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card
        elevation={6}
        sx={{
          mb: 4,
          borderRadius: 3,
          background: 'var(--bg-primary)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-primary)',
          overflow: 'hidden',
          width: '100%',
          maxWidth: 'none'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box 
            sx={{ 
              height: '500px',
              width: '100%',
              overflow: 'hidden',
              '& .datatables': {
                overflowX: 'auto',
                '@media (max-width: 768px)': {
                  overflowX: 'auto'
                }
              },
              '& .mantine-datatable-header': {
                backgroundColor: 'var(--bg-secondary) !important',
                color: 'var(--text-gray-medium) !important',
                fontWeight: 600,
                fontSize: '0.875rem'
              },
              '& .mantine-datatable-table': {
                width: '100% !important',
                tableLayout: 'fixed !important',
                minWidth: '100% !important',
                '@media (max-width: 768px)': {
                  minWidth: '900px !important'
                }
              },
              '& .mantine-datatable': {
                width: '100% !important'
              },
              '& .mantine-datatable thead th': {
                backgroundColor: 'var(--bg-secondary) !important',
                color: 'var(--text-gray-medium) !important',
                border: 'none !important',
                borderRight: 'none !important',
                padding: '12px 16px !important'
              },
              '& .mantine-datatable-header th': {
                whiteSpace: 'nowrap !important'
              },
              '& .mantine-datatable-header th > div': {
                display: 'flex !important',
                alignItems: 'center !important',
                gap: '6px !important',
                flexDirection: 'row !important'
              },
              '& .mantine-datatable-header th button': {
                display: 'flex !important',
                alignItems: 'center !important',
                gap: '6px !important',
                flexDirection: 'row !important'
              },
              '& .mantine-datatable-header th [data-testid="mantine-datatable-column-header-sort-icon"]': {
                position: 'static !important',
                marginLeft: '6px !important',
                marginTop: '0 !important',
                display: 'inline !important'
              },
              '& .mantine-datatable tbody td': {
                whiteSpace: 'nowrap !important',
                color: 'var(--text-gray-medium) !important',
                overflow: 'hidden !important',
                textOverflow: 'ellipsis !important'
              },
              // Esconder SVG database órfão que aparece perdido na tabela
              '& svg[stroke="currentColor"][fill="none"]': {
                display: 'none !important'
              },
            }}
            className="datatables"
          >
            <DataTable
              noRecordsText={
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '60px 20px',
                  color: 'var(--text-secondary)'
                }}>
                  {React.cloneElement(noRecordsIcon, { 
                    style: { 
                      ...noRecordsIcon.props?.style,
                      fontSize: 48, 
                      marginBottom: 16, 
                      color: 'var(--text-secondary)' 
                    } 
                  })}
                  <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: 8 }}>
                    {noRecordsTitle}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {noRecordsText}
                  </div>
                </div>
              }
              highlightOnHover
              className="whitespace-nowrap table-hover"
              records={records}
              fetching={loading}
              minHeight={minHeight}
              columns={columns}
              {...props}
            />
            
            {/* Linha divisória */}
            {showPagination && hasRecords && (
              <div style={{ 
                borderTop: '1px solid var(--border-primary)', 
                margin: '16px 0 0 0' 
              }} />
            )}
            
            {/* Paginação customizada */}
            {showPagination && hasRecords && (
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                gap: '12px',
                flexWrap: 'wrap',
                '@media (max-width: 768px)': {
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '16px 12px'
                }
              }}>
                {/* Info de registros */}
                <Box sx={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)',
                  '@media (max-width: 768px)': {
                    order: 3,
                    textAlign: 'center',
                    fontSize: '13px'
                  }
                }}>
                  Mostrando {((pageNumber - 1) * pageSize) + 1} a {Math.min(pageNumber * pageSize, effectiveTotalRecords)} de {effectiveTotalRecords} registros
                </Box>
                
                {/* Seletor de registros por página */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  '@media (max-width: 768px)': {
                    order: 2,
                    fontSize: '13px'
                  }
                }}>
                  <span style={{ fontSize: 'inherit', color: 'var(--text-secondary)' }}>Por página:</span>
                  <select 
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-primary)',
                      fontSize: 'inherit',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-gray-medium)',
                      cursor: 'pointer'
                    }}
                  >
                    {pageSizeOptions.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </Box>
                
                {/* Paginação com ícones */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  '@media (max-width: 768px)': {
                    order: 1,
                    gap: '2px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                  },
                  '@media (max-width: 480px)': {
                    gap: '1px',
                    '& button': {
                      padding: '6px !important',
                      minWidth: '28px !important'
                    }
                  }
                }}>
                  {/* Primeira página */}
                  <button
                    onClick={() => onPageChange(1)}
                    disabled={pageNumber === 1}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 600,
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: pageNumber === 1 ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: pageNumber === 1 ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                      color: pageNumber === 1 ? '#ced4da' : 'var(--text-primary)',
                      opacity: pageNumber === 1 ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (pageNumber !== 1) {
                        e.target.style.backgroundColor = 'var(--color-accent)';
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pageNumber !== 1) {
                        e.target.style.backgroundColor = 'var(--bg-secondary)';
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41z" fill="currentColor"/>
                      <path d="M6 6h2v12H6z" fill="currentColor"/>
                    </svg>
                  </button>
                  
                  {/* Página anterior */}
                  <button
                    onClick={() => onPageChange(pageNumber - 1)}
                    disabled={pageNumber === 1}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 600,
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: pageNumber === 1 ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: pageNumber === 1 ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                      color: pageNumber === 1 ? '#ced4da' : 'var(--text-primary)',
                      opacity: pageNumber === 1 ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (pageNumber !== 1) {
                        e.target.style.backgroundColor = 'var(--color-accent)';
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pageNumber !== 1) {
                        e.target.style.backgroundColor = 'var(--bg-secondary)';
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                    </svg>
                  </button>
                  
                  {/* Números das páginas */}
                  {(() => {
                    const totalPages = Math.ceil(effectiveTotalRecords / pageSize);
                    const pages = [];
                    
                    // Lógica para mostrar páginas relevantes
                    let startPage = Math.max(1, pageNumber - 2);
                    let endPage = Math.min(totalPages, pageNumber + 2);
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => onPageChange(i)}
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontWeight: 600,
                            padding: '8px 12px',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: pageNumber === i ? 'var(--color-accent)' : 'var(--bg-secondary)',
                            color: pageNumber === i ? 'white' : 'var(--text-primary)',
                            minWidth: '36px'
                          }}
                          onMouseEnter={(e) => {
                            if (pageNumber !== i) {
                              e.target.style.backgroundColor = 'var(--color-accent)';
                              e.target.style.color = 'white';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pageNumber !== i) {
                              e.target.style.backgroundColor = 'var(--bg-secondary)';
                              e.target.style.color = 'var(--text-primary)';
                            }
                          }}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  {/* Próxima página */}
                  <button
                    onClick={() => onPageChange(pageNumber + 1)}
                    disabled={pageNumber >= Math.ceil(effectiveTotalRecords / pageSize)}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 600,
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: pageNumber >= Math.ceil(effectiveTotalRecords / pageSize) ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: pageNumber >= Math.ceil(effectiveTotalRecords / pageSize) ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                      color: pageNumber >= Math.ceil(effectiveTotalRecords / pageSize) ? '#ced4da' : 'var(--text-primary)',
                      opacity: pageNumber >= Math.ceil(effectiveTotalRecords / pageSize) ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (pageNumber < Math.ceil(effectiveTotalRecords / pageSize)) {
                        e.target.style.backgroundColor = 'var(--color-accent)';
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pageNumber < Math.ceil(effectiveTotalRecords / pageSize)) {
                        e.target.style.backgroundColor = 'var(--bg-secondary)';
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                    </svg>
                  </button>
                  
                  {/* Última página */}
                  <button
                    onClick={() => onPageChange(Math.ceil(effectiveTotalRecords / pageSize))}
                    disabled={pageNumber >= Math.ceil(effectiveTotalRecords / pageSize)}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 600,
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: pageNumber >= Math.ceil(effectiveTotalRecords / pageSize) ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: pageNumber >= Math.ceil(effectiveTotalRecords / pageSize) ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                      color: pageNumber >= Math.ceil(effectiveTotalRecords / pageSize) ? '#ced4da' : 'var(--text-primary)',
                      opacity: pageNumber >= Math.ceil(effectiveTotalRecords / pageSize) ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (pageNumber < Math.ceil(effectiveTotalRecords / pageSize)) {
                        e.target.style.backgroundColor = 'var(--color-accent)';
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pageNumber < Math.ceil(effectiveTotalRecords / pageSize)) {
                        e.target.style.backgroundColor = 'var(--bg-secondary)';
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41z" fill="currentColor"/>
                      <path d="M16 6h2v12h-2z" fill="currentColor"/>
                    </svg>
                  </button>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BaseTable;