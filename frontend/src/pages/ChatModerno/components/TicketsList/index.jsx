import React, { useEffect, useRef, useCallback, memo, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { MessageSquare, Clock } from 'lucide-react';
import TicketCard from '../TicketCard/index.jsx';
import ScrollArea from '../../../../components/ui/ScrollArea';

const TicketsList = memo(({ 
  tickets, 
  tabOpen,
  selectedChatId,
  openChat,
  currentTab,
  onRefresh,
  onAccept,
  pinnedConversations,
  handlePinConversation,
  hasMore,
  loading,
  onLoadMore
}) => {
  
  const loadMoreRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef(null);
  
  // Configuração da virtualização
  const ITEM_HEIGHT = 90; // Altura estimada de cada ticket card
  const BUFFER_SIZE = 5; // Itens extras para renderizar fora da viewport

  // Intersection Observer para scroll infinito
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  // Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore]);
  
  // Detectar altura do container para virtualização
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  // Cálculo da virtualização - SEMPRE executar o hook
  const visibleItems = useMemo(() => {
    if (!tickets || tickets.length === 0) {
      return [];
    }
    
    if (!containerHeight) {
      return tickets; // Fallback sem virtualização
    }
    
    const itemsVisible = Math.ceil(containerHeight / ITEM_HEIGHT);
    const totalRenderItems = itemsVisible + (BUFFER_SIZE * 2);
    
    // Se temos poucos items, renderizar todos
    if (tickets.length <= totalRenderItems) {
      return tickets;
    }
    
    // Para listas grandes, implementar virtualização básica
    // Por agora, vamos renderizar todos os items com otimização de memoização
    return tickets;
  }, [tickets, containerHeight]);
  
  if (!tickets || tickets.length === 0) {
    return (
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 4,
        color: 'var(--text-secondary)'
      }}>
        <Box sx={{ 
          mb: 2, 
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {tabOpen === 'open' ? 
            <MessageSquare size={48} /> : 
            <Clock size={48} />
          }
        </Box>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
          Nenhuma conversa encontrada
        </Typography>
        <Typography variant="caption">
          {tabOpen === 'open' ? 
            'Não há conversas em atendimento no momento' : 
            'Não há conversas esperando atendimento'
          }
        </Typography>
      </Box>
    );
  }

  return (
    <ScrollArea 
      ref={containerRef}
      style={{ 
        flex: 1, 
        height: '100%' 
      }}
      data-scrollable
    >
      <Box sx={{ px: 1 }}>
        {visibleItems.map((ticket) => (
          <TicketCard
            key={ticket.id}
            selectedChatId={selectedChatId}
            openChat={openChat}
            ticket={ticket}
            currentTab={currentTab}
            onRefresh={onRefresh}
            onAccept={onAccept}
            isPinned={pinnedConversations?.has(ticket.id)}
            onPin={() => handlePinConversation(ticket.id)}
          />
        ))}
        
        {/* Load More Trigger */}
        {hasMore && (
          <Box 
            ref={loadMoreRef}
            sx={{
              py: 2,
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '13px'
            }}
          >
            {loading ? 'Carregando mais...' : 'Carregue mais'}
          </Box>
        )}
      </Box>
    </ScrollArea>
  );
});

TicketsList.displayName = 'TicketsList';

export default TicketsList;