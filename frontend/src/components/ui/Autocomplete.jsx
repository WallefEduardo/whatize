import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Paper, List, ListItem, ListItemText, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChevronDown, Check, Search } from 'lucide-react';

// Styled Components
const StyledTrigger = styled(Box)(({ theme, size = 'md', variant = 'bordered' }) => {
  const sizeStyles = {
    sm: { height: '32px', padding: '0 8px', fontSize: '12px' },
    md: { height: '40px', padding: '0 12px', fontSize: '13px' },
    lg: { height: '48px', padding: '0 16px', fontSize: '14px' }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    cursor: 'pointer',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-primary)',
    transition: 'all 0.2s ease',
    fontFamily: theme.typography.fontFamily,
    color: 'var(--text-secondary)',
    ...currentSize,

    '&:hover': {
      borderColor: 'var(--color-accent)',
    },

    '&.focused': {
      borderColor: 'var(--color-accent)',
      boxShadow: '0 0 0 2px rgba(0, 195, 7, 0.2)',
    }
  };
});

const StyledDropdown = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: '4px',
  zIndex: 1000,
  border: '1px solid var(--border-primary)',
  borderRadius: '6px',
  backgroundColor: 'var(--bg-primary)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  maxHeight: '300px',
  overflow: 'hidden',
  animation: 'fadeIn 0.2s ease-out',

  '@keyframes fadeIn': {
    '0%': { opacity: 0, transform: 'translateY(-8px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' }
  }
}));

const StyledSearchInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    border: 'none',
    borderBottom: '1px solid var(--border-primary)',
    borderRadius: 0,
    backgroundColor: 'transparent',
    '& fieldset': { border: 'none' },
    '&:hover fieldset': { border: 'none' },
    '&.Mui-focused fieldset': { border: 'none' }
  },
  '& .MuiInputBase-input': {
    padding: '12px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    '&::placeholder': {
      color: 'var(--text-secondary)',
      opacity: 0.6
    }
  }
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: '8px 12px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  borderRadius: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',

  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
  },

  '&.selected': {
    backgroundColor: 'rgba(0, 195, 7, 0.1)',
    color: 'var(--color-accent)',
  }
}));

const StyledEmptyState = styled(Box)(({ theme }) => ({
  padding: '16px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
  fontSize: '13px'
}));

const Autocomplete = React.forwardRef(({
  label = "Select item...",
  placeholder = "Buscar...",
  options = [],
  value = null,
  onChange = () => {},
  onInputChange = () => {},
  getOptionLabel = (option) => option.label || option.name || option,
  getOptionValue = (option) => option.value || option.id || option,
  renderOption = null,
  loading = false,
  noOptionsText = "No options found",
  size = 'md',
  variant = 'bordered',
  disabled = false,
  className,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedOption, setSelectedOption] = useState(value);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Usar opções direto (filtragem feita no backend ou não necessária)
  const filteredOptions = options;

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Atualizar valor selecionado quando prop value mudar
  useEffect(() => {
    setSelectedOption(value);
  }, [value]);

  const handleTriggerClick = () => {
    if (disabled) return;
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (newOpenState) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Chamar callback de busca vazia para carregar todas as opções
      if (searchValue === '' && onInputChange) {
        onInputChange('');
      }
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    onChange(option);
    setIsOpen(false);
    setSearchValue('');
  };

  const handleSearchChange = (event) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
    onInputChange(newValue);
  };

  const displayValue = selectedOption ? getOptionLabel(selectedOption) : label;

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <StyledTrigger
        className={`${isOpen ? 'focused' : ''} ${className || ''}`}
        onClick={handleTriggerClick}
        size={size}
        variant={variant}
        sx={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <span style={{ 
          flex: 1, 
          textAlign: 'left',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: selectedOption ? 500 : 400
        }}>
          {displayValue}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-secondary)'
          }} 
        />
      </StyledTrigger>

      {/* Dropdown */}
      {isOpen && (
        <StyledDropdown>
          {/* Search Input */}
          <StyledSearchInput
            ref={inputRef}
            fullWidth
            placeholder={placeholder}
            value={searchValue}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search size={16} style={{ marginRight: 8, color: 'var(--text-secondary)' }} />
            }}
          />

          {/* Options List */}
          <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
            {loading ? (
              <StyledEmptyState>
                <CircularProgress size={20} sx={{ color: 'var(--color-accent)' }} />
                <Typography variant="body2" sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                  Carregando...
                </Typography>
              </StyledEmptyState>
            ) : filteredOptions.length === 0 ? (
              <StyledEmptyState>
                {noOptionsText}
              </StyledEmptyState>
            ) : (
              <List sx={{ padding: 0 }}>
                {filteredOptions.map((option, index) => {
                  const isSelected = selectedOption && getOptionValue(selectedOption) === getOptionValue(option);
                  
                  return (
                    <StyledListItem
                      key={getOptionValue(option)}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handleOptionSelect(option)}
                    >
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <ListItemText 
                          primary={getOptionLabel(option)}
                          sx={{ 
                            '& .MuiListItemText-primary': {
                              fontSize: '13px',
                              color: 'inherit'
                            }
                          }}
                        />
                      )}
                      {isSelected && (
                        <Check size={16} style={{ color: 'var(--color-accent)' }} />
                      )}
                    </StyledListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </StyledDropdown>
      )}
    </Box>
  );
});

Autocomplete.displayName = "Autocomplete";

export { Autocomplete };