import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled ScrollArea usando Material-UI
const StyledScrollArea = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
}));

const StyledScrollContent = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingRight: '8px', // Espaço para a scrollbar
  marginRight: '-8px', // Compensa o padding
  
  // Custom scrollbar styles
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'var(--border-primary)',
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: 'var(--text-secondary)',
    },
  },
  
  // Firefox scrollbar styles
  scrollbarWidth: 'thin',
  scrollbarColor: 'var(--border-primary) transparent',
}));

const StyledScrollbar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: '6px',
  background: 'transparent',
  zIndex: 1,
  borderRadius: '3px',
  transition: 'background-color 0.2s ease',
  
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
  }
}));

const StyledScrollThumb = styled(Box)(({ theme }) => ({
  width: '100%',
  backgroundColor: 'var(--border-primary)',
  borderRadius: '3px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  
  '&:hover': {
    backgroundColor: 'var(--text-secondary)',
  }
}));

// ScrollArea Root Component (versão simplificada sem CVA)
const ScrollArea = React.forwardRef(({ 
  size = "full",
  children,
  className,
  sx,
  ...props 
}, ref) => {
  // Sizes mapping
  const sizeStyles = {
    sm: { maxHeight: '128px' },
    md: { maxHeight: '256px' }, 
    lg: { maxHeight: '384px' },
    xl: { maxHeight: '512px' },
    full: { height: '100%' }
  };

  return (
    <StyledScrollArea
      ref={ref}
      className={className}
      sx={{
        ...sizeStyles[size],
        ...sx
      }}
      {...props}
    >
      <StyledScrollContent>
        {children}
      </StyledScrollContent>
    </StyledScrollArea>
  );
});
ScrollArea.displayName = "ScrollArea";

export default ScrollArea;