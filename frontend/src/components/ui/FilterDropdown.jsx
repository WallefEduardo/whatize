import React, { useState } from 'react';
import { Box, TextField } from '@mui/material';

/**
 * FilterDropdown - Componente de dropdown com busca e seleção múltipla
 * 
 * @param {Object} props
 * @param {string} props.placeholder - Texto do placeholder
 * @param {Array} props.options - Array de opções para seleção
 * @param {Array} props.value - Array com valores selecionados (controlado)
 * @param {Function} props.onChange - Callback chamado quando seleção muda
 * @param {string} props.searchPlaceholder - Placeholder do campo de busca
 */
const FilterDropdown = ({ 
  placeholder = "Selecionar opções...",
  options = [],
  value = [],
  onChange,
  searchPlaceholder = "Buscar..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const toggleOption = (option) => {
    const newSelection = value.includes(option) 
      ? value.filter(item => item !== option)
      : [...value, option];
    
    if (onChange) {
      onChange(newSelection);
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm(''); // Limpa busca ao fechar
  };
  
  return (
    <Box sx={{ position: 'relative' }}>
      {/* Dropdown Trigger */}
      <Box
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          p: 1,
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '4px',
          fontSize: '13px',
          cursor: 'pointer',
          border: '1px solid var(--border-primary)',
          color: value.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '36px',
          '&:hover': {
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--color-accent)',
          }
        }}
      >
        <Box sx={{ flex: 1 }}>
          {value.length > 0 
            ? `${value.length} selecionado${value.length > 1 ? 's' : ''}`
            : placeholder
          }
        </Box>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none"
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Box>
      
      {/* Dropdown Content */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <Box
            onClick={handleClose}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
          
          <Box sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Search Input */}
            <Box sx={{ p: 1.5, borderBottom: '1px solid var(--border-primary)' }}>
              <TextField
                fullWidth
                placeholder={searchPlaceholder}
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19S2 15.194 2 10.5 5.806 2 10.5 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Box>
                  ),
                  sx: {
                    '& fieldset': { border: 'none' },
                    '& input': {
                      fontSize: '12px',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      '&::placeholder': {
                        color: 'var(--text-secondary)',
                        opacity: 1,
                      },
                    },
                  }
                }}
              />
            </Box>
            
            {/* Options List */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {filteredOptions.map((option) => (
                <Box
                  key={option}
                  onClick={() => toggleOption(option)}
                  sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    minHeight: '32px',
                    '&:hover': {
                      backgroundColor: 'var(--bg-secondary)',
                    }
                  }}
                >
                  {/* Checkbox */}
                  <Box
                    sx={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      border: '2px solid var(--border-primary)',
                      backgroundColor: value.includes(option) ? 'var(--color-accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {value.includes(option) && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </Box>
                  <span>{option}</span>
                </Box>
              ))}
              
              {filteredOptions.length === 0 && (
                <Box sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  color: 'var(--text-secondary)',
                  fontSize: '12px'
                }}>
                  Nenhuma opção encontrada
                </Box>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default FilterDropdown;