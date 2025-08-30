import React, { useState } from 'react';
import { Button, Popover, Box, Typography, TextField } from '@mui/material';
import { CalendarDays } from 'lucide-react';
import { styled } from '@mui/material/styles';

const StyledDateInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: '36px',
    fontSize: '13px',
    fontWeight: 400,
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)',
    '& fieldset': {
      borderColor: 'var(--border-primary)',
    },
    '&:hover fieldset': {
      borderColor: 'var(--border-secondary)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--color-accent)',
      boxShadow: '0 0 0 2px rgba(0, 195, 7, 0.1)',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '0 12px',
    height: '36px',
    boxSizing: 'border-box',
    '&::placeholder': {
      color: 'var(--text-secondary)',
      opacity: 0.6,
    }
  }
}));

const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = "dd/mm/yyyy",
  disabled = false,
  error = false,
  helperText = "",
  ...props 
}) => {
  
  const formatDateValue = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return date;
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Se já for uma Date, retorna
    if (dateString instanceof Date) return dateString;
    
    // Parse dd/mm/yyyy
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    return null;
  };

  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    
    // Permite apenas números e barras
    const sanitized = inputValue.replace(/[^\d/]/g, '');
    
    // Auto-formatar dd/mm/yyyy
    let formatted = sanitized;
    if (sanitized.length >= 2 && !sanitized.includes('/')) {
      formatted = sanitized.slice(0, 2) + '/' + sanitized.slice(2);
    }
    if (sanitized.length >= 4 && sanitized.split('/').length === 2) {
      const parts = sanitized.split('/');
      formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
    }
    if (sanitized.length >= 6 && sanitized.split('/').length === 3) {
      const parts = sanitized.split('/');
      formatted = parts[0] + '/' + parts[1] + '/' + parts[2].slice(0, 4);
    }
    
    // Limitar o comprimento máximo
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }
    
    // Se a data estiver completa, validar e chamar onChange
    if (formatted.length === 10) {
      const parsedDate = parseDate(formatted);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        onChange(parsedDate);
      } else {
        onChange(formatted); // Manter string se inválida para mostrar erro
      }
    } else {
      onChange(formatted);
    }
  };

  const inputValue = formatDateValue(value);

  return (
    <Box>
      <StyledDateInput
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        fullWidth
        InputProps={{
          endAdornment: (
            <CalendarDays 
              size={16} 
              style={{ color: 'var(--text-secondary)', marginRight: '8px' }} 
            />
          )
        }}
        {...props}
      />

      {helperText && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: error ? '#ef4444' : 'var(--text-secondary)',
            fontSize: '12px',
            mt: 0.5,
            display: 'block'
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export { DatePicker };
export default DatePicker;