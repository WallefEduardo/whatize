import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const TimePickerContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
}));

const TimeInput = styled('input')(({ theme, error }) => ({
  width: '100%',
  height: '36px',
  fontSize: '13px',
  fontWeight: 400,
  fontFamily: 'Inter, sans-serif',
  color: 'var(--text-primary)', // Mesma cor dos outros inputs
  backgroundColor: 'var(--bg-primary)',
  border: `1px solid ${error ? '#ef4444' : 'var(--border-primary)'}`,
  borderRadius: '4px',
  padding: '0 12px',
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  
  '&:hover': {
    borderColor: error ? '#ef4444' : 'var(--border-primary)',
  },
  
  '&:focus': {
    borderColor: error ? '#ef4444' : 'var(--color-accent)',
    boxShadow: error 
      ? '0 0 0 2px rgba(239, 68, 68, 0.1)' 
      : '0 0 0 2px rgba(0, 195, 7, 0.1)',
  },
  
  '&::placeholder': {
    color: 'var(--text-secondary)',
    opacity: 1,
  },
  
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
    backgroundColor: 'var(--bg-secondary)',
  },
}));

const PickerDropdown = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: '4px',
  width: '300px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  overflow: 'hidden',
  zIndex: 1000,
}));

const PickerHeader = styled(Box)(({ theme }) => ({
  backgroundColor: 'var(--bg-primary)',
  borderBottom: '1px solid var(--border-primary)',
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const PickerButton = styled('button')(({ theme, variant }) => ({
  color: variant === 'save' ? 'var(--color-accent)' : 'var(--text-secondary)',
  fontSize: '16px',
  fontWeight: variant === 'save' ? 600 : 400,
  fontFamily: 'Inter, sans-serif',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  
  '&:hover': {
    color: variant === 'save' 
      ? 'var(--color-green-hover, #00e608)' 
      : 'var(--text-primary)',
  },
}));

const PickerWheels = styled(Box)(({ theme }) => ({
  backgroundColor: 'var(--bg-primary)',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '15px',
}));

const WheelContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '150px',
  width: '60px',
  overflow: 'hidden',
  position: 'relative',
  
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    right: 0,
    height: '40px',
    background: 'linear-gradient(to bottom, var(--bg-primary) 0%, transparent 100%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  
  '&::before': {
    top: 0,
  },
  
  '&::after': {
    bottom: 0,
    background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 100%)',
  },
}));

const WheelScroll = styled(Box)(({ theme }) => ({
  height: '100%',
  overflowY: 'auto',
  scrollbarWidth: 'none',
  paddingTop: '40px',
  paddingBottom: '40px',
  
  '&::-webkit-scrollbar': {
    display: 'none',
  },
}));

const WheelItem = styled(Box)(({ theme, selected }) => ({
  color: selected ? 'var(--color-accent)' : 'var(--text-secondary)',
  fontSize: '18px',
  fontFamily: 'Inter, sans-serif',
  fontWeight: selected ? 600 : 400,
  padding: '8px 0',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: selected ? 1 : 0.7,
  
  '&:hover': {
    opacity: 1,
  },
}));

const Separator = styled(Box)(({ theme }) => ({
  color: 'var(--text-primary)',
  fontSize: '24px',
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
  margin: '0 5px',
  lineHeight: 1,
}));

const CustomTimePicker = ({ 
  value = '', 
  onChange, 
  placeholder = "Selecione um horário",
  disabled = false,
  error = false,
  helperText = "",
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempHour, setTempHour] = useState(0);
  const [tempMinute, setTempMinute] = useState(0);
  
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // Parse value inicial
  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':').map(Number);
      setTempHour(hour || 0);
      setTempMinute(minute || 0);
    }
  }, [value]);

  // Gerar arrays de horas e minutos
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleSave = () => {
    const timeString = `${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`;
    onChange({ target: { value: timeString } });
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Restaurar valores originais
    if (value) {
      const [hour, minute] = value.split(':').map(Number);
      setTempHour(hour || 0);
      setTempMinute(minute || 0);
    }
    setIsOpen(false);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('[data-timepicker]')) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const scrollToItem = (ref, index, itemHeight = 40) => {
    if (ref.current) {
      const scrollTop = index * itemHeight;
      ref.current.scrollTop = scrollTop;
    }
  };

  // Auto scroll to selected items when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToItem(hourScrollRef, tempHour);
        scrollToItem(minuteScrollRef, tempMinute);
      }, 100);
    }
  }, [isOpen, tempHour, tempMinute]);

  const displayValue = value || '';

  return (
    <Box>
      <TimePickerContainer data-timepicker>
        <TimeInput
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          readOnly
          onClick={handleInputClick}
          {...props}
        />
        
        {isOpen && (
          <PickerDropdown>
            <PickerHeader>
              <PickerButton variant="cancel" onClick={handleCancel}>
                Cancelar
              </PickerButton>
              <PickerButton variant="save" onClick={handleSave}>
                Salvar
              </PickerButton>
            </PickerHeader>
            
            <PickerWheels>
              {/* Wheel de Horas */}
              <WheelContainer>
                <WheelScroll ref={hourScrollRef}>
                  {hours.map((hour) => (
                    <WheelItem
                      key={hour}
                      selected={hour === tempHour}
                      onClick={() => setTempHour(hour)}
                    >
                      {hour.toString().padStart(2, '0')}
                    </WheelItem>
                  ))}
                </WheelScroll>
              </WheelContainer>
              
              <Separator>:</Separator>
              
              {/* Wheel de Minutos */}
              <WheelContainer>
                <WheelScroll ref={minuteScrollRef}>
                  {minutes.map((minute) => (
                    <WheelItem
                      key={minute}
                      selected={minute === tempMinute}
                      onClick={() => setTempMinute(minute)}
                    >
                      {minute.toString().padStart(2, '0')}
                    </WheelItem>
                  ))}
                </WheelScroll>
              </WheelContainer>
            </PickerWheels>
          </PickerDropdown>
        )}
      </TimePickerContainer>
      
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

export { CustomTimePicker as TimePicker };
export default CustomTimePicker;