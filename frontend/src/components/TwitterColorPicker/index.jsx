import React from "react";
import { TwitterPicker } from 'react-color';
import { Box } from "@mui/material";

/**
 * TwitterColorPicker - Componente de seletor de cores estilo Twitter
 * otimizado para badges com cores que se destacam bem
 * 
 * @param {Object} props
 * @param {string} props.color - Cor atual selecionada
 * @param {Function} props.onChange - Callback quando a cor muda
 * @param {Array} props.colors - Cores customizadas (opcional)
 * @param {string} props.width - Largura do picker
 */
const TwitterColorPicker = ({
  color,
  onChange,
  colors,
  width = "400px",
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

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        '& .twitter-picker': {
          backgroundColor: 'transparent !important',
          boxShadow: 'none !important',
        },
        '& .twitter-picker > div': {
          backgroundColor: 'transparent !important',
        }
      }}
    >
      <TwitterPicker
        color={color}
        onChange={onChange}
        colors={pickerColors}
        width={width}
        triangle="hide"
        {...props}
      />
    </Box>
  );
};

export default TwitterColorPicker;