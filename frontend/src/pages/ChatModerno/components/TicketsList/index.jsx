import React from 'react';
import { Box, Typography } from '@mui/material';
import { MessageSquare, Clock } from 'lucide-react';
import TicketCard from '../TicketCard/index.jsx';
import ScrollArea from '../../../../components/ui/ScrollArea';

const TicketsList = ({ 
  tickets, 
  tabOpen,
  selectedChatId,
  openChat,
  currentTab,
  onRefresh,
  onAccept,
  pinnedConversations,
  handlePinConversation
}) => {
  
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
      style={{ 
        flex: 1, 
        height: '100%' 
      }}
      data-scrollable
    >
      <Box sx={{ px: 1 }}>
        {tickets.map((ticket) => (
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
      </Box>
    </ScrollArea>
  );
};

export default TicketsList;