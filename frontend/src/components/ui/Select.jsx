import React, { useState, useRef, useEffect } from 'react';
import { Box, styled } from '@mui/material';
import { ChevronDown } from 'lucide-react';
import { Input } from './Input';

const SelectContainer = styled(Box)({
  position: 'relative',
  width: '100%',
});

const SelectInput = styled(Input)({
  cursor: 'pointer',
  '&:read-only': {
    cursor: 'pointer',
  },
});

const DropdownContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen'
})(({ isOpen }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: '4px',
  backgroundColor: 'white',
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  zIndex: 1000,
  maxHeight: '200px',
  overflowY: 'auto',
  opacity: isOpen ? 1 : 0,
  visibility: isOpen ? 'visible' : 'hidden',
  transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'var(--bg-secondary)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'var(--border-primary)',
    borderRadius: '3px',
  },
}));

const DropdownOption = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected'
})(({ selected }) => ({
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: '13px',
  color: 'var(--text-primary)',
  backgroundColor: selected ? 'rgba(0, 195, 7, 0.08)' : 'transparent',
  borderLeft: selected ? '3px solid var(--color-accent)' : '3px solid transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: selected ? 'rgba(0, 195, 7, 0.12)' : 'var(--bg-secondary)',
  },
  '&:first-of-type': {
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
  },
  '&:last-of-type': {
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
  },
}));

const ChevronIcon = styled(ChevronDown, {
  shouldForwardProp: (prop) => prop !== 'isOpen'
})(({ isOpen }) => ({
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`,
  transition: 'transform 0.2s ease',
  pointerEvents: 'none',
  color: 'var(--text-secondary)',
  zIndex: 1,
}));

const Select = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Selecione...',
  displayKey = 'label',
  valueKey = 'value',
  disabled = false,
  ...inputProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Encontrar a opção selecionada
  const selectedOption = options.find(option => 
    (typeof option === 'object' ? option[valueKey] : option) === value
  );

  // Texto a ser exibido no input
  const displayText = selectedOption
    ? (typeof selectedOption === 'object' ? selectedOption[displayKey] : selectedOption)
    : '';

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle dropdown
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Selecionar opção
  const handleSelect = (option) => {
    const optionValue = typeof option === 'object' ? option[valueKey] : option;
    onChange?.(optionValue, option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Prevenir foco no input
  const handleFocus = (e) => {
    e.target.blur();
    handleToggle();
  };

  return (
    <SelectContainer ref={containerRef}>
      <Box sx={{ position: 'relative' }}>
        <SelectInput
          ref={inputRef}
          value={displayText}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onFocus={handleFocus}
          onClick={handleToggle}
          {...inputProps}
          style={{
            paddingRight: '36px',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
        <ChevronIcon size={16} isOpen={isOpen} />
      </Box>
      
      <DropdownContainer isOpen={isOpen && !disabled}>
        {options.length === 0 ? (
          <DropdownOption>
            Nenhuma opção disponível
          </DropdownOption>
        ) : (
          options.map((option, index) => {
            const optionValue = typeof option === 'object' ? option[valueKey] : option;
            const optionLabel = typeof option === 'object' ? option[displayKey] : option;
            const isSelected = optionValue === value;

            return (
              <DropdownOption
                key={index}
                selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
              >
                {optionLabel}
              </DropdownOption>
            );
          })
        )}
      </DropdownContainer>
    </SelectContainer>
  );
};

export { Select };