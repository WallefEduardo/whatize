import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import {
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const SearchContainer = styled(Box)(() => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}));

const SearchField = styled(TextField)(() => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    fontSize: '14px',

    '& fieldset': {
      border: '1px solid var(--border-primary)',
    },

    '&:hover fieldset': {
      borderColor: 'var(--border-hover)',
    },

    '&.Mui-focused fieldset': {
      borderColor: 'var(--color-accent)',
      borderWidth: '2px',
    },
  },

  '& .MuiOutlinedInput-input': {
    padding: '12px 14px',
    color: 'var(--text-primary)',

    '&::placeholder': {
      color: 'var(--text-secondary)',
      opacity: 1,
    },
  },
}));

const ActionButton = styled(IconButton)(() => ({
  color: 'var(--text-secondary)',
  padding: '6px',
  '&:hover': {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
  }
}));

// Hook para debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchInput = ({
  value = '',
  onChange,
  isLoading = false,
  placeholder = 'Digite para pesquisar...',
  debounceMs = 300
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  // Debounce da busca
  const debouncedQuery = useDebounce(localValue, debounceMs);

  // Efeito para chamar onChange quando o valor debounced muda
  useEffect(() => {
    if (onChange && debouncedQuery !== value) {
      onChange(debouncedQuery);
    }
  }, [debouncedQuery, onChange, value]);

  // Sincronizar valor externo com valor local
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = useCallback((e) => {
    setLocalValue(e.target.value);
  }, []);

  // 🆕 Nova função de limpar - simples e direta
  const clearField = () => {
    setLocalValue('');
    onChange('');
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      clearField();
    }
  }, [clearField]);

  // Auto-focus quando componente é montado
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <SearchContainer>
      <SearchField
        inputRef={inputRef}
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
              {isLoading ? (
                <CircularProgress
                  size={16}
                  sx={{ color: 'var(--text-secondary)' }}
                />
              ) : (
                <MagnifyingGlassIcon
                  style={{
                    width: '16px',
                    height: '16px',
                    color: 'var(--text-secondary)'
                  }}
                />
              )}
            </Box>
          ),
          endAdornment: localValue && (
            <Box
              onClick={clearField}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--text-primary)',
                }
              }}
            >
              <XMarkIcon style={{
                width: '12px',
                height: '12px',
                color: 'white'
              }} />
            </Box>
          ),
        }}
      />
    </SearchContainer>
  );
};

export default SearchInput;