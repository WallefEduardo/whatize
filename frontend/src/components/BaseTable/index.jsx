import React from "react";
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
  Tooltip
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
  Eye
} from "lucide-react";
import { motion } from "framer-motion";

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
  ...props
}) => {
  // Se totalRecords não for fornecido, usar records.length
  const effectiveTotalRecords = totalRecords !== null ? totalRecords : records.length;
  const hasRecords = records && records.length > 0;

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
                  {columns.map((column, index) => (
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
                        py: 2
                      }}
                    >
                      {column.title}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  renderSkeletonRows()
                ) : !hasRecords ? (
                  renderEmptyState()
                ) : (
                  records.map((record, rowIndex) => (
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