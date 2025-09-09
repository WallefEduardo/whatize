import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Box, Typography, Badge } from '@mui/material';
import { Clock, MessageSquare } from 'lucide-react';
import api from '../../../../services/api';
import { AuthContext } from '../../../../context/Auth/AuthContext';
import { TicketsContext } from '../../../../context/Tickets/TicketsContext';

const ChatTabs = ({ 
  showAllTickets, 
  setShowAllTickets, 
  tabCounts, 
  setTabCounts,
  onTabCountsUpdate 
}) => {
  const { user } = useContext(AuthContext);
  const { tabOpen, setTabOpen } = useContext(TicketsContext);

  // Função para buscar counts de todos os status
  const fetchTabCounts = useCallback(async () => {
    try {
      const showAllForUser = showAllTickets;
      const userQueueIds = user?.queues?.map(q => q.id) || [];
      
      const [openResponse, pendingResponse] = await Promise.all([
        api.get("/tickets", {
          params: {
            status: 'open',
            showAll: showAllForUser,
            queueIds: JSON.stringify(userQueueIds)
          }
        }),
        api.get("/tickets", {
          params: {
            status: 'pending',
            showAll: showAllForUser,
            queueIds: JSON.stringify(userQueueIds)
          }
        })
      ]);
      
      const newCounts = {
        open: openResponse.data.count || 0,
        pending: pendingResponse.data.count || 0
      };
      
      setTabCounts(newCounts);
      
      // Callback para notificar o componente pai
      if (onTabCountsUpdate) {
        onTabCountsUpdate(newCounts);
      }
    } catch (error) {
      console.error('Erro ao buscar counts:', error);
    }
  }, [showAllTickets, user?.queues, setTabCounts, onTabCountsUpdate]);

  // Buscar counts inicial
  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);

  // Refetch counts quando showAllTickets mudar
  useEffect(() => {
    fetchTabCounts();
  }, [showAllTickets, fetchTabCounts]);

  const tabs = [
    {
      key: 'open',
      label: 'Atendendo',
      count: tabCounts.open,
      icon: MessageSquare
    },
    {
      key: 'pending',
      label: 'Esperando',
      count: tabCounts.pending,
      icon: Clock
    }
  ];

  return (
    <Box sx={{ 
      display: 'flex',
      borderBottom: '1px solid var(--border-primary)',
      position: 'relative',
      backgroundColor: 'var(--background-default)',
    }}>
      {tabs.map((tab, index) => {
        const isActive = tabOpen === tab.key;
        return (
          <Box
            key={tab.key}
            onClick={() => setTabOpen(tab.key)}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              padding: '12px 16px',
              cursor: 'pointer',
              position: 'relative',
              backgroundColor: isActive ? 'var(--background-paper)' : 'transparent',
              transition: 'all 0.2s ease-in-out',
              borderBottom: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
              '&:hover': {
                backgroundColor: 'var(--background-paper)',
              }
            }}
          >
            <Box sx={{ 
              color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
              transition: 'color 0.2s ease-in-out'
            }}>
              <tab.icon size={16} />
            </Box>
            <Typography 
              variant="body2" 
              fontWeight={isActive ? 600 : 400}
              sx={{ 
                color: 'var(--text-secondary)',
                transition: 'color 0.2s ease-in-out'
              }}
            >
              {tab.label}
            </Typography>
            <Badge 
              badgeContent={tab.count} 
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '11px',
                  height: '18px',
                  minWidth: '18px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  top: '-8px',
                  right: '-6px'
                }
              }}
            />
          </Box>
        );
      })}

    </Box>
  );
};

export default ChatTabs;