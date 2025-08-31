import React, { useState } from 'react';
import { Button, Popover, Box, Typography } from '@mui/material';
import { CalendarDays } from 'lucide-react';
import { styled } from '@mui/material/styles';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StyledButton = styled(Button)(({ theme }) => ({
  width: '100%',
  height: '36px',
  justifyContent: 'space-between',
  textAlign: 'left',
  color: 'var(--text-secondary)',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-primary) !important',
  borderRadius: '4px !important',
  padding: '0 12px',
  fontSize: '13px',
  fontWeight: 400,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border-secondary) !important'
  },
  '&:focus': {
    borderColor: 'var(--color-accent) !important',
    outline: 'none',
    boxShadow: '0 0 0 2px rgba(0, 195, 7, 0.1)'
  }
}));

const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Selecione uma data",
  disabled = false,
  error = false,
  helperText = "",
  ...props 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  // Função para formatar data de forma segura
  const formatDateSafely = (dateValue) => {
    if (!dateValue) return null;
    
    try {
      // Se é uma string, tenta fazer parse
      if (typeof dateValue === 'string') {
        const parsedDate = parseISO(dateValue);
        if (isValid(parsedDate)) {
          return format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
        }
      }
      
      // Se já é um objeto Date
      if (dateValue instanceof Date && isValid(dateValue)) {
        return format(dateValue, 'dd/MM/yyyy', { locale: ptBR });
      }
      
      return null;
    } catch (error) {
      console.warn('Erro ao formatar data:', error, dateValue);
      return null;
    }
  };

  const handleClick = (event) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (newDate) => {
    onChange(newDate);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box>
        <StyledButton
          onClick={handleClick}
          disabled={disabled}
          variant="outlined"
          sx={{
            borderColor: error ? '#ef4444 !important' : 'var(--border-primary) !important',
            '&:hover': {
              borderColor: error ? '#ef4444 !important' : 'var(--border-secondary) !important'
            }
          }}
          {...props}
        >
          <span style={{ 
            color: value ? 'var(--text-secondary)' : 'var(--text-secondary)',
            opacity: value ? 1 : 0.6
          }}>
            {value ? (formatDateSafely(value) || placeholder) : placeholder}
          </span>
          <CalendarDays size={16} color="var(--text-secondary)" />
        </StyledButton>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '4px !important',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)',
              '& .MuiDateCalendar-root': {
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              },
              '& .MuiPickersCalendarHeader-root': {
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              },
              '& .MuiDayCalendar-weekDayLabel': {
                color: 'var(--text-secondary)'
              },
              '& .MuiPickersDay-root': {
                color: 'var(--text-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--bg-secondary)'
                },
                '&.Mui-selected': {
                  backgroundColor: 'var(--color-accent) !important',
                  color: 'white !important'
                },
                '&.MuiPickersDay-today': {
                  border: '1px solid var(--color-accent)'
                }
              },
              '& .MuiPickersArrowSwitcher-button': {
                color: 'var(--text-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--bg-secondary)'
                }
              }
            }
          }}
        >
          <StaticDatePicker
            value={value ? (typeof value === 'string' ? parseISO(value) : value) : null}
            onChange={handleDateChange}
            showDaysOutsideCurrentMonth
            displayStaticWrapperAs="desktop"
            slots={{
              actionBar: () => null // Remove action bar
            }}
          />
        </Popover>

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
    </LocalizationProvider>
  );
};

export { DatePicker };
export default DatePicker;