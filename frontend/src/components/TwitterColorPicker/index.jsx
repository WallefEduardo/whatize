import React from "react";
import { Box, Tooltip } from "@mui/material";

/**
 * TwitterColorPicker - Componente de seletor de cores estilo Twitter
 * otimizado para badges com cores que se destacam bem
 * 
 * @param {Object} props
 * @param {string} props.color - Cor atual selecionada
 * @param {Function} props.onChange - Callback quando a cor muda
 * @param {Array} props.colors - Cores customizadas (opcional)
 * @param {string} props.width - Largura do picker
 * @param {Array} props.usedColors - Cores já utilizadas (serão bloqueadas)
 */
const TwitterColorPicker = ({
  color,
  onChange,
  colors,
  width = "400px",
  usedColors = [],
  ...props
}) => {
  // Paleta de cores otimizada para badges - organizada em fileiras para layout mais largo
  const defaultColors = [
    // Fileira 1 - Vermelhos e laranjas vibrantes
    '#FF6B6B', '#E74C3C', '#C0392B', '#FF4757', '#FF3838', '#FF9500', '#F39C12', '#E67E22',
    
    // Fileira 2 - Amarelos e verdes destacados  
    '#FFD93D', '#F1C40F', '#FFC312', '#FFB142', '#2ECC71', '#27AE60', '#00D2D3', '#26de81',
    
    // Fileira 3 - Azuis e roxos marcantes
    '#3498DB', '#2980B9', '#74B9FF', '#0984E3', '#6C5CE7', '#9B59B6', '#8E44AD', '#A29BFE',
    
    // Fileira 4 - Rosas e verdes-azulados vibrantes
    '#FD79A8', '#E84393', '#FF7675', '#FF69B4', '#1ABC9C', '#16A085', '#00CEC9', '#81ECEC',
    
    // Fileira 5 - Tons escuros e cinzas modernos
    '#34495E', '#2C3E50', '#2D3436', '#636E72', '#95A5A6', '#7F8C8D', '#BDC3C7', '#F8F9FA'
  ];

  const pickerColors = colors || defaultColors;

  // Função para verificar se uma cor está bloqueada
  const isColorUsed = (colorHex) => {
    return usedColors.includes(colorHex.toUpperCase()) || usedColors.includes(colorHex.toLowerCase());
  };

  // Handler para mudança de cor
  const handleColorChange = (selectedColor) => {
    if (isColorUsed(selectedColor)) {
      return; // Bloqueia cores já usadas
    }
    
    onChange({ hex: selectedColor });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 0.5,
        padding: 1,
        maxWidth: width,
        width: '100%'
      }}>
        {pickerColors.map((colorHex, index) => {
          const isUsed = isColorUsed(colorHex);
          const isSelected = color === colorHex;
          
          const colorButton = (
            <Box
              key={`${colorHex}-${index}`}
              onClick={() => handleColorChange(colorHex)}
              sx={{
                width: 28,
                height: 28,
                backgroundColor: colorHex,
                borderRadius: '4px',
                cursor: isUsed ? 'not-allowed' : 'pointer',
                border: isSelected ? '3px solid #000' : '1px solid rgba(0,0,0,0.1)',
                position: 'relative',
                transition: 'all 0.2s ease',
                opacity: isUsed ? 0.3 : 1,
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                '&:hover': !isUsed ? {
                  transform: isSelected ? 'scale(1.1)' : 'scale(1.05)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                } : {},
                // Overlay para cores usadas
                '&::after': isUsed ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                } : {},
                // X para cores usadas
                '&::before': isUsed ? {
                  content: '"✕"',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1,
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: 'bold'
                } : {}
              }}
            />
          );

          if (isUsed) {
            return (
              <Tooltip 
                key={`tooltip-${colorHex}-${index}`}
                title="Cor já utilizada por outra fila"
                placement="top"
              >
                <span>{colorButton}</span>
              </Tooltip>
            );
          }

          return colorButton;
        })}
      </Box>
    </Box>
  );
};

export default TwitterColorPicker;