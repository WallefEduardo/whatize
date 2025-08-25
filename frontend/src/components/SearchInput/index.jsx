import React from "react";
import { Box, TextField, InputAdornment, IconButton } from "@mui/material";
import { Search } from "lucide-react";

/**
 * SearchInput - Componente de campo de busca moderno e padronizado
 * 
 * @param {Object} props
 * @param {string} props.placeholder - Placeholder do campo
 * @param {string} props.value - Valor do campo
 * @param {Function} props.onChange - Callback para mudança de valor
 * @param {Function} props.onSearch - Callback para busca (opcional)
 * @param {boolean} props.showButton - Mostrar botão de busca
 * @param {string} props.size - Tamanho do campo ('small', 'medium', 'large')
 * @param {boolean} props.fullWidth - Campo ocupar toda largura disponível
 * @param {Object} props.sx - Estilos customizados
 */
const SearchInput = ({
  placeholder = "Buscar...",
  value = "",
  onChange = () => {},
  onSearch = () => {},
  showButton = true,
  size = "medium",
  fullWidth = true,
  sx = {},
  ...props
}) => {
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSearch(value);
    }
  };

  const handleSearchClick = () => {
    onSearch(value);
  };

  // Definir tamanhos
  const sizeConfig = {
    small: { height: 36, fontSize: '0.875rem', iconSize: 18 },
    medium: { height: 44, fontSize: '0.95rem', iconSize: 20 },
    large: { height: 52, fontSize: '1rem', iconSize: 22 }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <Box
      sx={{
        position: 'relative',
        width: fullWidth ? '100%' : 'auto',
        maxWidth: fullWidth ? 'none' : '700px',
        ...sx
      }}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(value);
        }}
        sx={{
          position: 'relative',
          border: '1px solid var(--border-primary)',
          borderRadius: 1,
          width: '100%',
          height: config.height,
          display: 'flex',
          backgroundColor: 'var(--bg-primary)',
          overflow: 'hidden',
          '&:hover': {
            borderColor: 'var(--color-accent)',
            boxShadow: '0 0 8px 2px rgba(0, 195, 7, 0.1)',
          },
          '&:focus-within': {
            borderColor: 'var(--color-accent)',
            boxShadow: '0 0 5px 2px rgba(194, 213, 255, 0.62)',
          },
          transition: 'all 0.2s ease'
        }}
      >
        {showButton && (
          <IconButton
            onClick={handleSearchClick}
            type="submit"
            sx={{
              color: 'var(--color-accent)',
              borderRadius: 0,
              borderRight: '1px solid var(--border-primary)',
              height: '100%',
              px: 2,
              minWidth: 'auto',
              width: 'auto',
              '&:hover': {
                backgroundColor: 'var(--hover-bg-light)',
                color: 'var(--color-accent)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            <Search size={config.iconSize} />
          </IconButton>
        )}
        
        <TextField
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyPress={handleKeyPress}
          variant="standard"
          fullWidth={fullWidth}
          sx={{
            '& .MuiInput-root': {
              '&:before': { display: 'none' },
              '&:after': { display: 'none' },
            },
            '& .MuiInputBase-input': {
              padding: `${config.height / 2 - 10}px 16px`,
              fontSize: config.fontSize,
              fontWeight: 400,
              color: 'var(--text-primary)',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              '&::placeholder': {
                color: 'var(--text-secondary)',
                opacity: 0.8,
                fontWeight: 400,
                letterSpacing: '0.5px'
              },
              '&:focus': {
                outline: 'none'
              }
            }
          }}
          {...props}
        />
      </Box>
    </Box>
  );
};

export default SearchInput;