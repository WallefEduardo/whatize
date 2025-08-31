import React, { createContext, useContext, useState } from 'react';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

// Context for Tabs
const TabsContext = createContext({});

// Styled Tab Components
const StyledTabsList = styled(Box)(({ theme, variant = 'default', fullWidth = false }) => ({
  display: 'inline-flex',
  height: '40px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  backgroundColor: '#f1f5f9',
  padding: '4px',
  color: '#64748b',
  width: fullWidth ? '100%' : 'auto',
  
  ...(variant === 'line' && {
    backgroundColor: 'transparent',
    borderBottom: '1px solid #e2e8f0',
    borderRadius: '0px',
    padding: '0px',
    height: 'auto',
  }),
  
  ...(variant === 'pills' && {
    backgroundColor: '#f1f5f9',
    borderRadius: '20px',
  }),
}));

const StyledTabsTrigger = styled(Button)(({ theme, variant = 'default', active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '14px',
  fontWeight: 500,
  minWidth: 'auto',
  textTransform: 'none',
  transition: 'all 0.2s ease',
  border: 'none',
  boxShadow: 'none',
  
  '&:hover': {
    boxShadow: 'none',
  },
  
  '&:focus': {
    outline: 'none',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
  },
  
  '&:disabled': {
    pointerEvents: 'none',
    opacity: 0.5,
  },
  
  ...(variant === 'default' && {
    color: active ? '#1e293b' : '#64748b',
    backgroundColor: active ? '#ffffff' : 'transparent',
    boxShadow: active ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
  }),
  
  ...(variant === 'line' && {
    borderRadius: '0px',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    padding: '8px 16px',
    borderBottomColor: active ? '#3b82f6' : 'transparent',
    color: active ? '#3b82f6' : '#64748b',
  }),
  
  ...(variant === 'pills' && {
    borderRadius: '20px',
    backgroundColor: active ? '#3b82f6' : 'transparent',
    color: active ? '#ffffff' : '#64748b',
  }),
}));

// Root Tabs Component
export const Tabs = ({ 
  children, 
  defaultValue, 
  value, 
  onValueChange,
  sx,
  ...props 
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue || '');
  
  const currentValue = value !== undefined ? value : activeTab;
  const handleValueChange = onValueChange || setActiveTab;

  return (
    <TabsContext.Provider value={{ currentValue, handleValueChange }}>
      <Box sx={{ width: '100%', ...sx }} {...props}>
        {children}
      </Box>
    </TabsContext.Provider>
  );
};

// Tabs List Component
export const TabsList = React.forwardRef(({ 
  variant,
  fullWidth,
  children,
  sx,
  ...props 
}, ref) => (
  <StyledTabsList
    ref={ref}
    variant={variant}
    fullWidth={fullWidth}
    role="tablist"
    sx={sx}
    {...props}
  >
    {children}
  </StyledTabsList>
));
TabsList.displayName = "TabsList";

// Tabs Trigger Component
export const TabsTrigger = React.forwardRef(({ 
  variant,
  value,
  children,
  disabled,
  sx,
  ...props 
}, ref) => {
  const { currentValue, handleValueChange } = useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <StyledTabsTrigger
      ref={ref}
      variant={variant}
      active={isActive}
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      disabled={disabled}
      onClick={() => !disabled && handleValueChange(value)}
      sx={sx}
      {...props}
    >
      {children}
    </StyledTabsTrigger>
  );
});
TabsTrigger.displayName = "TabsTrigger";

// Tabs Content Component
export const TabsContent = React.forwardRef(({ 
  value,
  children,
  sx,
  ...props 
}, ref) => {
  const { currentValue } = useContext(TabsContext);
  const isActive = currentValue === value;

  if (!isActive) return null;

  return (
    <Box
      ref={ref}
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      sx={{
        marginTop: '8px',
        '&:focus-visible': {
          outline: 'none',
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
});
TabsContent.displayName = "TabsContent";

export default Tabs;