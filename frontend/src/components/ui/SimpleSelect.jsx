import React, { useState, useRef, useEffect } from 'react';
import { Box, styled, InputBase } from '@mui/material';
import { ChevronDown, Search } from 'lucide-react';

const SelectContainer = styled(Box)({
  position: 'relative',
  width: '100%',
});

const SelectButton = styled(Box, {
  shouldForwardProp: (prop) => !['disabled', 'isOpen'].includes(prop),
})(({ disabled, isOpen }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '12px 16px',
  backgroundColor: 'white',
  border: `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--border-primary)'}`,
  borderRadius: '8px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '14px',
  color: 'var(--text-primary)',
  transition: 'all 0.2s ease',
  userSelect: 'none',
  '&:hover': {
    borderColor: disabled ? 'var(--border-primary)' : 'var(--color-accent)',
  },
  '&:focus': {
    outline: 'none',
    borderColor: 'var(--color-accent)',
    boxShadow: '0 0 0 2px rgba(0, 195, 7, 0.1)',
  },
}));

const DropdownMenu = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
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
  maxHeight: '320px',
  overflowY: 'hidden',
  display: isOpen ? 'block' : 'none',
}));

const SearchContainer = styled(Box)({
  padding: '8px',
  borderBottom: '1px solid var(--border-primary)',
  position: 'sticky',
  top: 0,
  backgroundColor: 'white',
  zIndex: 1,
});

const SearchInput = styled(InputBase)({
  width: '100%',
  fontSize: '14px',
  padding: '6px 12px 6px 36px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '6px',
  border: '1px solid var(--border-primary)',
  '&:focus': {
    borderColor: 'var(--color-accent)',
  },
  '&::placeholder': {
    color: 'var(--text-secondary)',
    opacity: 1,
  },
});

const SearchIcon = styled(Search)({
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-secondary)',
  pointerEvents: 'none',
});

const MenuList = styled(Box)({
  maxHeight: '250px',
  overflowY: 'auto',
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
});

const MenuItem = styled(Box)(({ selected }) => ({
  padding: '10px 16px',
  cursor: 'pointer',
  fontSize: '14px',
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
  shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ isOpen }) => ({
  transform: `rotate(${isOpen ? '180deg' : '0deg'})`,
  transition: 'transform 0.2s ease',
  color: 'var(--text-secondary)',
  flexShrink: 0,
}));

const SimpleSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Selecione...',
  displayKey = 'label',
  valueKey = 'value',
  disabled = false,
  size = 'md',
  searchPlaceholder = 'Pesquisar...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Encontrar opção selecionada
  const selectedOption = options.find(option => {
    const optionValue = typeof option === 'object' ? option[valueKey] : option;
    return optionValue.toString() === value.toString();
  });

  // Texto exibido
  const displayText = selectedOption
    ? (typeof selectedOption === 'object' ? selectedOption[displayKey] : selectedOption)
    : placeholder;

  // Filtrar opções pela busca
  const filteredOptions = options.filter(option => {
    if (!searchTerm) return true;
    const optionLabel = typeof option === 'object' ? option[displayKey] : option;
    return optionLabel.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Fechar ao clicar fora
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
      if (!isOpen) {
        // Focar no campo de busca quando abrir
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      } else {
        // Limpar busca quando fechar
        setSearchTerm('');
      }
    }
  };

  // Selecionar item
  const handleSelect = (option) => {
    const optionValue = typeof option === 'object' ? option[valueKey] : option;
    onChange?.(optionValue.toString(), option);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Limpar busca quando fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <SelectContainer ref={containerRef}>
      <SelectButton
        disabled={disabled}
        isOpen={isOpen}
        onClick={handleToggle}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <span style={{ 
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {displayText}
        </span>
        <ChevronIcon size={16} isOpen={isOpen} />
      </SelectButton>

      <DropdownMenu isOpen={isOpen}>
        {/* Campo de busca */}
        <SearchContainer>
          <Box sx={{ position: 'relative' }}>
            <SearchIcon size={16} />
            <SearchInput
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
            />
          </Box>
        </SearchContainer>

        {/* Lista de opções */}
        <MenuList>
          {filteredOptions.length === 0 ? (
            <MenuItem>
              {searchTerm ? 'Nenhuma opção encontrada' : 'Nenhuma opção disponível'}
            </MenuItem>
          ) : (
            filteredOptions.map((option, index) => {
              const optionValue = typeof option === 'object' ? option[valueKey] : option;
              const optionLabel = typeof option === 'object' ? option[displayKey] : option;
              const isSelected = optionValue.toString() === value.toString();

              return (
                <MenuItem
                  key={index}
                  selected={isSelected}
                  onClick={() => handleSelect(option)}
                >
                  {optionLabel}
                </MenuItem>
              );
            })
          )}
        </MenuList>
      </DropdownMenu>
    </SelectContainer>
  );
};

export default SimpleSelect;