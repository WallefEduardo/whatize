import React, { useState, createContext, useContext } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Context para gerenciar estado dos tabs
const TabsContext = createContext();

// Container dos tabs
const TabsContainer = styled(Box)(() => ({
  width: '100%',
  borderBottom: '1px solid #e2e8f0',
  marginBottom: '24px',
}));

// Lista dos tabs
const TabsList = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  position: 'relative',
}));

// Item individual do tab
const TabsItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active'
})(({ active }) => ({
  position: 'relative',
  padding: '12px 20px',
  cursor: 'pointer',
  borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '120px',
  
  '&:hover': {
    backgroundColor: active ? 'rgba(0, 195, 7, 0.05)' : 'rgba(0, 0, 0, 0.04)',
  },
  
  '&:active': {
    backgroundColor: 'rgba(0, 195, 7, 0.1)',
  },
}));

// Texto do tab - usando span em vez de Typography para evitar nesting
const TabText = styled('span', {
  shouldForwardProp: (prop) => prop !== 'active'
})(({ active }) => ({
  fontSize: '14px',
  fontWeight: active ? 600 : 500,
  color: active ? 'var(--color-accent)' : '#64748b',
  transition: 'all 0.2s ease',
  fontFamily: 'Inter, sans-serif',
  userSelect: 'none',
  lineHeight: 1.4,
}));

// Container do conteúdo
const TabsContent = styled(Box)(() => ({
  width: '100%',
}));

// Componente principal ModernTabs
export const ModernTabs = ({ children, defaultValue, onValueChange, value, ...props }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || value);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ 
      activeTab: value || activeTab, 
      setActiveTab: handleTabChange 
    }}>
      <Box {...props}>
        {children}
      </Box>
    </TabsContext.Provider>
  );
};

// Componente da lista de tabs
export const ModernTabsList = ({ children, ...props }) => {
  return (
    <TabsContainer>
      <TabsList {...props}>
        {children}
      </TabsList>
    </TabsContainer>
  );
};

// Componente do item do tab
export const ModernTabsTrigger = ({ value, children, ...props }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const active = activeTab === value;

  return (
    <TabsItem 
      active={active}
      onClick={() => setActiveTab(value)}
      data-active={active.toString()}
      {...props}
    >
      <TabText active={active}>
        {children}
      </TabText>
    </TabsItem>
  );
};

// Componente do conteúdo do tab
export const ModernTabsContent = ({ value, children, ...props }) => {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) {
    return null;
  }

  return (
    <TabsContent {...props}>
      {children}
    </TabsContent>
  );
};

// Export default para o componente principal
export default ModernTabs;