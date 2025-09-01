import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChevronDown, X, ArrowRightLeft, Mail } from 'lucide-react';

// Styled Trigger Button
const StyledTrigger = styled(Box)(({ triggerColor, triggerSize }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  fontSize: triggerSize === 'xs' ? '10px' : triggerSize === 'sm' ? '11px' : '12px',
  fontWeight: 600,
  padding: triggerSize === 'xs' ? '2px 6px' : triggerSize === 'sm' ? '4px 8px' : '6px 10px',
  gap: triggerSize === 'xs' ? '2px' : '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: triggerColor === 'success' ? 'rgba(76, 175, 80, 0.15)' : 
                   triggerColor === 'primary' ? 'rgba(25, 118, 210, 0.15)' :
                   'rgba(255, 152, 0, 0.15)',
  color: triggerColor === 'success' ? '#4caf50' : 
         triggerColor === 'primary' ? '#1976d2' : 
         '#ff9800',
  border: triggerColor === 'success' ? '1px solid rgba(76, 175, 80, 0.3)' :
          triggerColor === 'primary' ? '1px solid rgba(25, 118, 210, 0.3)' :
          '1px solid rgba(255, 152, 0, 0.3)',
  
  '&:hover': {
    backgroundColor: triggerColor === 'success' ? 'rgba(76, 175, 80, 0.25)' :
                     triggerColor === 'primary' ? 'rgba(25, 118, 210, 0.25)' :
                     'rgba(255, 152, 0, 0.25)',
    transform: 'scale(1.02)',
  }
}));

// Styled Dropdown Content
const StyledDropdownContent = styled(Box)(({ align }) => ({
  position: 'absolute',
  top: '100%',
  [align === 'start' ? 'left' : align === 'center' ? 'left' : 'right']: align === 'center' ? '50%' : 0,
  transform: align === 'center' ? 'translateX(-50%)' : 'none',
  marginTop: '4px',
  minWidth: '196px',
  backgroundColor: 'white',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  zIndex: 1000,
  overflow: 'hidden',
  animation: 'dropdownFadeIn 0.2s ease-out',
  
  '@keyframes dropdownFadeIn': {
    '0%': {
      opacity: 0,
      transform: align === 'center' ? 'translateX(-50%) scale(0.95)' : 'scale(0.95)',
    },
    '100%': {
      opacity: 1,
      transform: align === 'center' ? 'translateX(-50%) scale(1)' : 'scale(1)',
    }
  }
}));

// Styled Header
const StyledHeader = styled(Box)(() => ({
  padding: '8px 12px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#374151',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
  backgroundColor: '#f9fafb',
  textAlign: 'center'
}));

// Styled Menu Item
const StyledMenuItem = styled(Box)(({ variant }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  
  '&:hover': {
    backgroundColor: variant === 'destructive' ? '#fef2f2' : '#f5f5f5',
    
    '& .menu-icon': {
      color: variant === 'destructive' ? '#dc2626' : '#374151',
    },
    
    '& .menu-title': {
      color: variant === 'destructive' ? '#dc2626' : '#111827',
    }
  }
}));

// Icon Container
const StyledIconContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  minWidth: '16px',
  height: '16px',
  marginRight: '8px',
  color: '#9ca3af',
  transition: 'color 0.2s ease'
}));

// Text Container
const StyledTextContainer = styled(Box)(() => ({
  flex: 1,
}));

// Title
const StyledTitle = styled(Box)(() => ({
  fontSize: '13px',
  lineHeight: '20px',
  color: '#374151',
  fontWeight: 500,
  transition: 'color 0.2s ease'
}));

// Description  
const StyledDescription = styled(Box)(() => ({
  fontSize: '11px',
  lineHeight: '18px',
  color: '#6b7280',
  marginTop: '1px'
}));

const ConversationDropdown = ({ 
  triggerText = "Geral",
  triggerColor = "success",
  triggerSize = "xs",
  align = "end",
  onFinalizarConversa,
  onTransferirConversa,
  onMarcarNaoLido,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha o dropdown quando clica fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleItemClick = (action) => (e) => {
    e.stopPropagation();
    action?.(e);
    setIsOpen(false);
  };

  return (
    <Box ref={dropdownRef} sx={{ position: 'relative' }}>
      {/* Trigger Button */}
      <StyledTrigger
        triggerColor={triggerColor}
        triggerSize={triggerSize}
        onClick={handleTriggerClick}
        sx={{
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {triggerText}
        <ChevronDown 
          size={10} 
          style={{ 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </StyledTrigger>

      {/* Dropdown Content */}
      {isOpen && (
        <StyledDropdownContent align={align}>
          {/* Header */}
          <StyledHeader>
            Ações da Conversa
          </StyledHeader>

          {/* Finalizar Conversa */}
          <StyledMenuItem
            variant="destructive"
            onClick={handleItemClick(onFinalizarConversa)}
          >
            <StyledIconContainer className="menu-icon">
              <X size={14} />
            </StyledIconContainer>
            <StyledTitle className="menu-title">
              Finalizar Conversa
            </StyledTitle>
          </StyledMenuItem>

          {/* Transferir Conversa */}
          <StyledMenuItem
            onClick={handleItemClick(onTransferirConversa)}
          >
            <StyledIconContainer className="menu-icon">
              <ArrowRightLeft size={14} />
            </StyledIconContainer>
            <StyledTitle className="menu-title">
              Transferir Conversa
            </StyledTitle>
          </StyledMenuItem>

          {/* Marcar como não Lido */}
          <StyledMenuItem
            onClick={handleItemClick(onMarcarNaoLido)}
          >
            <StyledIconContainer className="menu-icon">
              <Mail size={14} />
            </StyledIconContainer>
            <StyledTitle className="menu-title">
              Marcar como não Lido
            </StyledTitle>
          </StyledMenuItem>
        </StyledDropdownContent>
      )}
    </Box>
  );
};

export default ConversationDropdown;