import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  TablePagination,
  IconButton,
  Tooltip,
  Grid,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import {
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  BarChart3,
  Edit3,
  Trash2,
  MoreHorizontal,
  Eye,
  ArrowUpDown,
  List,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Componente de botões de ação estilizados
const ActionButton = ({ 
  onClick, 
  icon: Icon, 
  color = 'var(--text-secondary)', 
  hoverColor = 'var(--color-accent)',
  size = 16, 
  disabled = false,
  tooltip = '',
  ...props 
}) => (
  <Tooltip title={tooltip} placement="top">
    <IconButton
      size="small"
      onClick={onClick}
      disabled={disabled}
      sx={{
        padding: 1,
        color: disabled ? 'var(--text-disabled)' : color,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '6px',
        '&:hover': disabled ? {} : {
          backgroundColor: 'var(--hover-bg-light)',
          color: hoverColor,
          transform: 'scale(1.05)',
          borderColor: hoverColor
        },
        '&.Mui-disabled': {
          backgroundColor: 'var(--bg-disabled)',
          borderColor: 'var(--border-disabled)'
        },
        transition: 'all 0.2s ease',
        mx: 0.5
      }}
      {...props}
    >
      <Icon size={size} />
    </IconButton>
  </Tooltip>
);

// Componente de grupo de ações
const ActionGroup = ({ children, ...props }) => (
  <Box sx={{
    display: 'flex',
    gap: 0.5,
    justifyContent: 'center',
    alignItems: 'center'
  }} {...props}>
    {children}
  </Box>
);

/**
 * BaseTable - Componente de tabela reutilizável usando MUI Table
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
 * @param {boolean} props.enableSorting - Habilitar ordenação
 * @param {boolean} props.enableViewToggle - Habilitar alternância de visualização
 * @param {string} props.defaultView - Visualização padrão ('table' ou 'cards')
 * @param {Function} props.renderCard - Função para renderizar cards personalizados
 * @param {string} props.initialSortBy - Coluna inicial para ordenação
 * @param {'asc'|'desc'} props.initialSortOrder - Ordem inicial de ordenação
 */
const BaseTable = ({
  records = [],
  columns = [],
  loading = false,
  noRecordsTitle = "Nenhum resultado encontrado",
  noRecordsText = "Ajuste os filtros para visualizar os dados",
  noRecordsIcon = <BarChart3 size={48} />,
  minHeight = 650,
  pageNumber = 1,
  pageSize = 10,
  totalRecords = null,
  onPageChange = () => {},
  onPageSizeChange = () => {},
  showPagination = true,
  pageSizeOptions = [5, 10, 20, 50],
  enableSorting = true,
  enableViewToggle = true,
  defaultView = 'table',
  renderCard = null,
  initialSortBy = null,
  initialSortOrder = 'asc',
  ...props
}) => {
  // Estados para funcionalidades avançadas
  const [view, setView] = useState(defaultView);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  // Se totalRecords não for fornecido, usar records.length
  const effectiveTotalRecords = totalRecords !== null ? totalRecords : records.length;
  
  // Aplicar ordenação nos dados
  const processedRecords = useMemo(() => {
    let sorted = [...records];
    
    // Aplicar ordenação
    if (sortBy) {
      sorted.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        } else {
          comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    return sorted;
  }, [records, sortBy, sortOrder]);
  
  const hasRecords = processedRecords && processedRecords.length > 0;

  // Componente de ações da paginação
  const TablePaginationActions = (props) => {
    const { count, page, rowsPerPage, onPageChange } = props;

    const handleFirstPageButtonClick = (event) => {
      onPageChange(event, 0);
    };

    const handleBackButtonClick = (event) => {
      onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event) => {
      onPageChange(event, page + 1);
    };

    const handleLastPageButtonClick = (event) => {
      onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };

    return (
      <Box sx={{ flexShrink: 0, ml: 2.5 }}>
        <IconButton
          onClick={handleFirstPageButtonClick}
          disabled={page === 0}
          aria-label="primeira página"
          sx={{
            color: 'var(--text-secondary)',
            '&:hover': { 
              backgroundColor: 'var(--hover-bg-light)',
              color: 'var(--color-accent)'
            },
            '&.Mui-disabled': { 
              color: 'var(--text-disabled)' 
            }
          }}
        >
          <ChevronFirst size={20} />
        </IconButton>
        <IconButton
          onClick={handleBackButtonClick}
          disabled={page === 0}
          aria-label="página anterior"
          sx={{
            color: 'var(--text-secondary)',
            '&:hover': { 
              backgroundColor: 'var(--hover-bg-light)',
              color: 'var(--color-accent)'
            },
            '&.Mui-disabled': { 
              color: 'var(--text-disabled)' 
            }
          }}
        >
          <ChevronLeft size={20} />
        </IconButton>
        <IconButton
          onClick={handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="próxima página"
          sx={{
            color: 'var(--text-secondary)',
            '&:hover': { 
              backgroundColor: 'var(--hover-bg-light)',
              color: 'var(--color-accent)'
            },
            '&.Mui-disabled': { 
              color: 'var(--text-disabled)' 
            }
          }}
        >
          <ChevronRight size={20} />
        </IconButton>
        <IconButton
          onClick={handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="última página"
          sx={{
            color: 'var(--text-secondary)',
            '&:hover': { 
              backgroundColor: 'var(--hover-bg-light)',
              color: 'var(--color-accent)'
            },
            '&.Mui-disabled': { 
              color: 'var(--text-disabled)' 
            }
          }}
        >
          <ChevronLast size={20} />
        </IconButton>
      </Box>
    );
  };

  // Renderizar skeleton rows durante loading
  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {columns.map((col, colIndex) => (
          <TableCell key={`skeleton-${index}-${colIndex}`}>
            <Skeleton variant="text" animation="wave" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  // Renderizar empty state
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={columns.length} align="center">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            color: 'var(--text-secondary)'
          }}
        >
          {React.cloneElement(noRecordsIcon, {
            style: {
              ...noRecordsIcon.props?.style,
              fontSize: 64,
              marginBottom: 16,
              color: 'var(--text-secondary)',
              opacity: 0.3
            }
          })}
          <Typography variant="h6" gutterBottom sx={{ color: 'var(--text-primary)' }}>
            {noRecordsTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            {noRecordsText}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );

  // Componente de barra de ferramentas (apenas alternância de view)
  const renderToolbar = () => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'flex-end',
      gap: 2,
      mb: 2,
      flexWrap: 'wrap'
    }}>
      {enableViewToggle && (
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(e, newView) => newView && setView(newView)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)',
              '&:hover': {
                backgroundColor: 'var(--hover-bg-light)',
                color: 'var(--color-accent)',
              },
              '&.Mui-selected': {
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'var(--color-accent)',
                },
              },
            },
          }}
        >
          <ToggleButton value="table" aria-label="visualização em tabela">
            <List size={18} />
          </ToggleButton>
          <ToggleButton value="cards" aria-label="visualização em cards">
            <LayoutGrid size={18} />
          </ToggleButton>
        </ToggleButtonGroup>
      )}
    </Box>
  );

  // Componente de ordenação
  const handleSort = (columnAccessor) => {
    if (!enableSorting) return;
    
    const column = columns.find(col => col.accessor === columnAccessor);
    if (column && column.sortable === false) return;
    
    if (sortBy === columnAccessor) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnAccessor);
      setSortOrder('asc');
    }
  };

  // Componente de cabeçalho da tabela com ordenação
  const renderSortableHeader = (column, index) => {
    const isActive = sortBy === column.accessor;
    const canSort = enableSorting && column.sortable !== false && column.accessor !== 'actions';
    
    return (
      <TableCell
        key={index}
        align={column.textAlignment || 'left'}
        width={column.width}
        sx={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-gray-medium)',
          fontWeight: 600,
          fontSize: '0.875rem',
          borderBottom: '2px solid var(--border-primary)',
          py: 2,
          cursor: canSort ? 'pointer' : 'default',
          textAlign: column.textAlignment || 'left', // Força o alinhamento do texto do título
          '&:hover': canSort ? {
            backgroundColor: 'var(--hover-bg-light)',
          } : {},
        }}
        onClick={() => canSort && handleSort(column.accessor)}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          justifyContent: column.textAlignment === 'center' ? 'center' : 
                        column.textAlignment === 'right' ? 'flex-end' : 'flex-start'
        }}>
          {column.title}
          {canSort && (
            <ArrowUpDown 
              size={14} 
              style={{ 
                opacity: isActive ? 1 : 0.5,
                transform: isActive && sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                transition: 'all 0.2s ease'
              }} 
            />
          )}
        </Box>
      </TableCell>
    )
  };

  // Componente de visualização em cards
  const renderCardsView = () => {
    if (!hasRecords && !loading) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              color: 'var(--text-secondary)'
            }}
          >
            {React.cloneElement(noRecordsIcon, {
              style: {
                ...noRecordsIcon.props?.style,
                fontSize: 64,
                marginBottom: 16,
                color: 'var(--text-secondary)',
                opacity: 0.3
              }
            })}
            <Typography variant="h6" gutterBottom sx={{ color: 'var(--text-primary)' }}>
              {noRecordsTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              {noRecordsText}
            </Typography>
          </Box>
        </motion.div>
      );
    }
    
    if (loading) {
      return (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          width: '100%'
        }}>
          {Array.from({ length: 12 }).map((_, index) => (
            <motion.div
              key={`skeleton-card-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              style={{ 
                width: '100%',
                minHeight: '280px'
              }}
            >
                  <Card sx={{ 
                    backgroundColor: 'var(--bg-primary)', 
                    border: '1px solid var(--border-primary)',
                    borderRadius: 3,
                    width: '100%',
                    height: 280,
                    minHeight: 280,
                    maxHeight: 280,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <CardContent sx={{ p: 3, height: '100%' }}>
                      <Skeleton 
                        variant="rectangular" 
                        height={24} 
                        width="90%" 
                        animation="wave"
                        sx={{ mb: 2, borderRadius: 1 }}
                      />
                      <Skeleton 
                        variant="text" 
                        height={20} 
                        width="70%" 
                        animation="wave" 
                        sx={{ mb: 1 }} 
                      />
                      <Skeleton 
                        variant="text" 
                        height={20} 
                        width="50%" 
                        animation="wave" 
                        sx={{ mb: 2 }} 
                      />
                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 2 }}>
                        <Skeleton variant="circular" width={32} height={32} animation="wave" />
                        <Skeleton variant="circular" width={32} height={32} animation="wave" />
                      </Box>
                    </CardContent>
                  </Card>
            </motion.div>
          ))}
        </Box>
      );
    }
    
    return (
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)'
        },
        gap: 3,
        width: '100%'
      }}>
        <AnimatePresence mode="popLayout">
          {processedRecords.map((record, index) => (
            <motion.div
              key={record.id || index}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.05,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2, type: "spring", stiffness: 300 } 
              }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                width: '100%',
                height: '100%',
                minHeight: '280px'
              }}
            >
                  {renderCard ? renderCard(record, index) : (
                    <Card sx={{ 
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 3,
                      width: '100%',
                      height: 280,
                      minHeight: 280,
                      maxHeight: 280,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: `
                        linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%),
                        var(--bg-primary)
                      `,
                      '&:hover': {
                        borderColor: 'var(--color-accent)',
                        boxShadow: `
                          0 10px 25px -5px rgba(0, 0, 0, 0.1),
                          0 10px 10px -5px rgba(0, 0, 0, 0.04),
                          0 0 0 1px var(--color-accent-alpha, rgba(59, 130, 246, 0.1))
                        `,
                        '&::before': {
                          opacity: 1,
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-dark, #1e40af))',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        borderRadius: '12px 12px 0 0',
                      }
                    }}>
                      <CardContent sx={{ 
                        p: 3, 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        position: 'relative'
                      }}>
                        {/* Conteúdo do card */}
                        <Box sx={{ flex: 1 }}>
                          {columns.filter(col => col.accessor !== 'actions').map((column, idx) => (
                            <motion.div
                              key={column.accessor}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 + 0.2 }}
                            >
                              <Box sx={{ mb: 2 }}>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'var(--text-secondary)',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.5px',
                                    lineHeight: 1,
                                    opacity: 0.8
                                  }}
                                >
                                  {column.title}
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    lineHeight: 1.3,
                                    mt: 0.5,
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {column.render ? column.render(record) : record[column.accessor]}
                                </Typography>
                              </Box>
                            </motion.div>
                          ))}
                        </Box>
                        
                        {/* Ações no card */}
                        {columns.find(col => col.accessor === 'actions') && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              gap: 1.5, 
                              mt: 2,
                              pt: 2.5,
                              borderTop: '1px solid var(--border-primary)',
                              position: 'relative',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '40px',
                                height: '1px',
                                background: 'var(--color-accent)',
                                opacity: 0.3
                              }
                            }}>
                              {columns.find(col => col.accessor === 'actions').render(record)}
                            </Box>
                          </motion.div>
                        )}
                        
                        {/* Decorative elements */}
                        <Box sx={{
                          position: 'absolute',
                          top: -20,
                          right: -20,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'var(--color-accent)',
                          opacity: 0.05,
                          pointerEvents: 'none'
                        }} />
                      </CardContent>
                    </Card>
                  )}
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          background: 'transparent',
          border: 'none',
          overflow: 'visible',
          width: '100%',
          maxWidth: 'none'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Barra de Ferramentas */}
          {enableViewToggle && renderToolbar()}

          {/* Conteúdo da Tabela ou Cards */}
          {view === 'cards' ? (
            <Box sx={{ 
              minHeight: minHeight,
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 2,
              p: { xs: 2, sm: 3, md: 4 },
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              {renderCardsView()}
            </Box>
          ) : (
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{
                height: minHeight,
                minHeight: minHeight,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 1,
                overflow: 'auto',
                '& .MuiTable-root': {
                  minWidth: '100%'
                }
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((column, index) => renderSortableHeader(column, index))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    renderSkeletonRows()
                  ) : !hasRecords ? (
                    renderEmptyState()
                  ) : (
                    processedRecords.map((record, rowIndex) => (
                      <TableRow
                        key={record.id || rowIndex}
                        hover
                        sx={{
                          '&:hover': {
                            backgroundColor: 'var(--hover-bg-light)'
                          },
                          '& .MuiTableCell-root': {
                            borderBottom: '1px solid var(--border-primary)',
                            py: 1.5
                          }
                        }}
                      >
                        {columns.map((column, colIndex) => (
                          <TableCell
                            key={`${rowIndex}-${colIndex}`}
                            align={column.textAlignment || 'left'}
                            sx={{
                              color: 'var(--text-primary)',
                              fontSize: '0.875rem'
                            }}
                          >
                            {column.render ? column.render(record) : record[column.accessor]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Paginação Melhorada */}
          {showPagination && hasRecords && !loading && (
            <Box sx={{ 
              borderTop: '2px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              px: 2,
              py: 1.5,
              minHeight: 64
            }}>
              <TablePagination
                component="div"
                count={effectiveTotalRecords}
                page={pageNumber - 1}
                onPageChange={(event, newPage) => onPageChange(newPage + 1)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={(event) => {
                  onPageSizeChange(parseInt(event.target.value, 10));
                  onPageChange(1);
                }}
                rowsPerPageOptions={pageSizeOptions}
                labelRowsPerPage="Registros por página:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                }
                ActionsComponent={TablePaginationActions}
                sx={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  '& .MuiTablePagination-toolbar': {
                    paddingLeft: 0,
                    paddingRight: 0,
                    minHeight: 'auto'
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500
                  },
                  '& .MuiTablePagination-select': {
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    '&:hover': {
                      backgroundColor: 'var(--hover-bg-light)'
                    }
                  },
                  '& .MuiSelect-icon': {
                    color: 'var(--text-secondary)'
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Exportar componentes auxiliares para reutilização
export { ActionButton, ActionGroup };

export default BaseTable;