import React from "react";
import { Box, IconButton, CircularProgress } from "@mui/material";
import { FilterList as FilterIcon, Refresh as RefreshIcon } from "@mui/icons-material";

/**
 * FilterButton - Componente de botão de filtro reutilizável baseado no design do Reports
 * 
 * @param {Object} props
 * @param {Function} props.onClick - Função chamada ao clicar no botão
 * @param {boolean} props.loading - Estado de carregamento
 * @param {string} props.children - Texto do botão
 * @param {React.ReactNode} props.icon - Ícone do botão
 * @param {React.ReactNode} props.loadingIcon - Ícone durante o carregamento
 * @param {string} props.loadingText - Texto durante o carregamento
 * @param {boolean} props.disabled - Botão desabilitado
 * @param {Object} props.sx - Estilos adicionais
 */
const FilterButton = ({
  onClick = () => {},
  loading = false,
  children = "Aplicar Filtro",
  icon = <FilterIcon />,
  loadingIcon = <RefreshIcon />,
  loadingText = "Filtrando...",
  disabled = false,
  sx = {},
  ...props
}) => {
  return (
    <Box sx={{ 
      background: 'var(--gradient-green-button)',
      borderRadius: 2,
      p: 0.5,
      boxShadow: 'var(--shadow-green-lg)',
      ...sx
    }}>
      <IconButton
        onClick={onClick}
        disabled={loading || disabled}
        sx={{
          backgroundColor: 'transparent',
          color: 'white',
          px: 3,
          py: 1,
          borderRadius: 1.5,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)',
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.3s ease',
          fontSize: '0.95rem',
          '&:disabled': {
            color: 'rgba(255,255,255,0.7)'
          }
        }}
        {...props}
      >
        {loading ? (
          <>
            {React.cloneElement(loadingIcon, { sx: { mr: 1 } })}
            {loadingText}
          </>
        ) : (
          <>
            {React.cloneElement(icon, { sx: { mr: 1 } })}
            {children}
          </>
        )}
      </IconButton>
    </Box>
  );
};

export default FilterButton;