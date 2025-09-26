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

const SearchInput = ({
  value = '',
  onChange,
  onClear,
  isLoading = false,
  placeholder = 'Digite para pesquisar...'
}) => {
  const inputRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClear();
    }
  }, [onClear]);

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
        value={value}
        onChange={onChange}
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
          endAdornment: value && (
            <XMarkIcon
              onClick={onClear}
              style={{
                width: '16px',
                height: '16px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            />
          ),
        }}
      />
    </SearchContainer>
  );
};

export default SearchInput;