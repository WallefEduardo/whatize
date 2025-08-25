import React from "react";
import { Chip } from "@mui/material";

/**
 * StatusBadge - Componente reutilizável para badges coloridos
 * 
 * @param {Object} props
 * @param {string} props.label - Texto do badge
 * @param {string} props.color - Cor do badge (hex, rgb, etc)
 * @param {string} props.variant - Variante do chip ('filled', 'outlined')
 * @param {string} props.size - Tamanho do badge ('small', 'medium')
 * @param {Object} props.sx - Estilos customizados do MUI
 */
const StatusBadge = ({ 
  label, 
  color = "#00c307", 
  variant = "filled",
  size = "small",
  sx = {},
  ...props 
}) => {
  // Função para converter cor hex para rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Definir cores baseadas na cor principal
  const backgroundColor = variant === "filled" 
    ? hexToRgba(color, 0.15) // Fundo transparente fraco
    : "transparent";
  
  const textColor = color; // Texto na cor forte
  const borderColor = variant === "outlined" ? hexToRgba(color, 0.3) : "transparent";

  return (
    <Chip
      label={label}
      variant={variant}
      size={size}
      sx={{
        backgroundColor,
        color: textColor,
        border: variant === "outlined" ? `1px solid ${borderColor}` : "none",
        fontWeight: 600,
        fontSize: size === "small" ? "0.75rem" : "0.875rem",
        borderRadius: "4px",
        textShadow: variant === "filled" ? "none" : "1px 1px 1px rgba(0, 0, 0, 0.1)",
        '&:hover': {
          backgroundColor: variant === "filled" 
            ? hexToRgba(color, 0.25) 
            : hexToRgba(color, 0.1),
          transform: 'scale(1.02)',
        },
        transition: 'all 0.2s ease',
        ...sx
      }}
      {...props}
    />
  );
};

export default StatusBadge;