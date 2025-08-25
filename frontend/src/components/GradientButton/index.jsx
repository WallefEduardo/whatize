import React from "react";
import { Box, Button, CircularProgress } from "@mui/material";

/**
 * GradientButton - Componente de botão com gradiente baseado no design do Reports
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo do botão
 * @param {React.ReactNode} props.icon - Ícone do botão
 * @param {React.ReactNode} props.loadingIcon - Ícone durante loading
 * @param {string} props.loadingText - Texto durante loading
 * @param {Function} props.onClick - Callback do clique
 * @param {boolean} props.loading - Estado de loading
 * @param {boolean} props.disabled - Estado disabled
 * @param {string} props.variant - Tipo do botão ('primary', 'secondary')
 * @param {string} props.size - Tamanho ('small', 'medium', 'large')
 * @param {Object} props.sx - Estilos customizados
 */
const GradientButton = ({
  children,
  icon,
  loadingIcon,
  loadingText = "Carregando...",
  onClick = () => {},
  loading = false,
  disabled = false,
  variant = "primary",
  size = "medium",
  sx = {},
  ...props
}) => {
  // Configurações de tamanho
  const sizeConfig = {
    small: { px: 2, py: 0.75, fontSize: '0.875rem', height: 36 },
    medium: { px: 3, py: 1, fontSize: '0.95rem', height: 44 },
    large: { px: 4, py: 1.25, fontSize: '1rem', height: 52 }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Estilos baseados no variant
  const variantStyles = {
    primary: {
      background: 'var(--gradient-green-button, linear-gradient(135deg, #00c307 0%, #00e608 100%))',
      boxShadow: 'var(--shadow-green-lg, 0 8px 25px rgba(0, 195, 7, 0.2))'
    },
    secondary: {
      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.2)'
    }
  };

  const currentStyle = variantStyles[variant] || variantStyles.primary;

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      sx={{
        background: currentStyle.background,
        boxShadow: currentStyle.boxShadow,
        color: 'white',
        px: config.px,
        py: config.py,
        borderRadius: '4px !important',
        fontSize: config.fontSize,
        fontWeight: 600,
        textTransform: 'none',
        border: 'none',
        minHeight: config.height,
        height: config.height,
        '&:hover': {
          background: variant === 'primary' 
            ? 'linear-gradient(135deg, #00e608 0%, #0ff70a 50%, #4eff4a 100%)'
            : 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
          transform: 'translateY(-2px)',
          boxShadow: variant === 'primary'
            ? '0 8px 25px rgba(0, 195, 7, 0.4)'
            : '0 8px 25px rgba(99, 102, 241, 0.4)'
        },
        '&:active': {
          transform: 'translateY(-1px)'
        },
        '&.Mui-disabled': {
          background: 'rgba(0,0,0,0.12)',
          color: 'rgba(0,0,0,0.26)',
          boxShadow: 'none'
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '& .MuiButton-startIcon': {
          marginRight: 1,
          marginLeft: 0,
          '& svg': {
            transition: 'transform 0.2s ease'
          }
        },
        '&:hover .MuiButton-startIcon svg': {
          transform: 'scale(1.1)'
        },
        ...sx
      }}
      startIcon={
        loading ? (
          loadingIcon || <CircularProgress size={16} sx={{ color: 'white' }} />
        ) : (
          icon
        )
      }
      {...props}
    >
      {loading ? loadingText : children}
    </Button>
  );
};

export default GradientButton;