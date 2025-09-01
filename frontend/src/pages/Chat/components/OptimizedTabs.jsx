import React, { memo, useCallback, useContext } from 'react';
import { Box, Typography, Badge } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TicketsContext } from '../../../context/Tickets/TicketsContext';
import { cn } from '../../../utils/cn';

// Icons
import { 
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const TabsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#F8F9FA',
  border: '1px solid #E2E8F0',
  marginBottom: '16px'
}));

const TabButton = styled(Box)(({ theme, active }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px 16px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: active ? 'var(--color-accent)' : 'transparent',
  color: active ? 'white' : 'var(--text-secondary)',
  fontWeight: active ? 600 : 400,
  fontSize: '14px',
  position: 'relative',
  
  '&:hover': {
    backgroundColor: active ? 'var(--color-green-hover)' : 'rgba(0, 195, 7, 0.1)',
    color: active ? 'white' : 'var(--color-accent)'
  },
  
  '&:not(:last-child)': {
    borderRight: '1px solid #E2E8F0'
  },
  
  '& svg': {
    width: '16px',
    height: '16px'
  }
}));

const TabBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#f44336',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px'
  }
}));

const TabIcon = styled(Box)(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'inherit'
}));

// Configuração das abas com performance otimizada
const TAB_CONFIG = {
  open: {
    key: 'open',
    label: 'Atendendo',
    icon: ChatBubbleLeftRightIcon
  },
  pending: {
    key: 'pending', 
    label: 'Esperando', // Mudança de "Aguardando" para "Esperando"
    icon: ClockIcon
  }
};

const OptimizedTabs = memo(({ counts = {}, onTabChange }) => {
  const { tabOpen, setTabOpen } = useContext(TicketsContext);

  // Handler otimizado para mudança de aba
  const handleTabClick = useCallback((tabKey) => {
    if (tabKey !== tabOpen) {
      setTabOpen(tabKey);
      onTabChange?.(tabKey);
    }
  }, [tabOpen, setTabOpen, onTabChange]);

  // Renderizar abas
  const renderTab = useCallback((tabKey) => {
    const config = TAB_CONFIG[tabKey];
    const isActive = tabOpen === tabKey;
    const count = counts[tabKey] || 0;
    const IconComponent = config.icon;
    
    return (
      <TabButton
        key={tabKey}
        active={isActive}
        onClick={() => handleTabClick(tabKey)}
        role="tab"
        aria-selected={isActive}
        aria-label={`${config.label} (${count} tickets)`}
      >
        <TabIcon active={isActive}>
          <IconComponent />
        </TabIcon>
        
        <Typography
          variant="body2"
          sx={{ 
            color: 'inherit',
            fontWeight: 'inherit',
            fontSize: 'inherit'
          }}
        >
          {config.label}
        </Typography>
        
        {count > 0 && (
          <TabBadge
            badgeContent={count > 99 ? '99+' : count}
            color="error"
            sx={{ 
              '& .MuiBadge-badge': {
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.9)' : '#f44336',
                color: isActive ? 'var(--color-accent)' : 'white'
              }
            }}
          >
            <Box sx={{ width: 0, height: 0 }} />
          </TabBadge>
        )}
      </TabButton>
    );
  }, [tabOpen, counts, handleTabClick]);

  return (
    <TabsContainer role="tablist">
      {Object.keys(TAB_CONFIG).map(renderTab)}
    </TabsContainer>
  );
});

OptimizedTabs.displayName = 'OptimizedTabs';

export default OptimizedTabs;