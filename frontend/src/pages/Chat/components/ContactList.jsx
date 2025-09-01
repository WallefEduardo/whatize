import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';
import { formatTime } from '../data/mockData';

// Nossos componentes UI
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/AvatarOptimized';
import Badge from '../../../components/ui/Badge';
// Icons
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Check, X } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../../../context/Auth/AuthContext';
import { TicketsContext } from '../../../context/Tickets/TicketsContext';
import api from '../../../services/api';
import toastError from '../../../errors/toastError';
import { Tooltip } from '@mui/material';
import AcceptTicketWithoutQueueModal from '../../../components/AcceptTicketWithoutQueueModal';
import ConversationDropdown from '../../../components/ui/ConversationDropdown';

const StyledContactItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})(({ theme, isSelected }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 16px',
  cursor: 'pointer',
  borderLeft: '3px solid transparent',
  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  borderRadius: '0 8px 8px 0',
  transition: 'all 0.2s ease',
  position: 'relative',
  
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
  },
  
  ...(isSelected && {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderLeftColor: 'var(--color-accent)',
  }),
}));

const ContactInfo = styled(Box)(() => ({
  flex: 1,
  minWidth: 0, // Para permitir text-overflow
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}));

const ContactMeta = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
}));

const ContactName = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: '14px',
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const LastMessage = styled(Typography)(() => ({
  fontSize: '13px',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden', 
  textOverflow: 'ellipsis',
  maxWidth: '150px',
}));

const TimeStamp = styled(Typography)(() => ({
  fontSize: '12px',
  color: 'var(--text-secondary)',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}));

const UnreadBadge = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'unreadCount',
})(({ unreadCount }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: unreadCount > 0 ? '20px' : '16px',
  height: unreadCount > 0 ? '20px' : '16px',
  borderRadius: '50%',
  backgroundColor: unreadCount > 0 ? 'var(--color-accent)' : 'var(--text-secondary)',
  color: 'white',
  fontSize: '11px',
  fontWeight: 600,
}));

const TypingIndicator = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: 'var(--color-accent)',
  fontSize: '13px',
  fontStyle: 'italic',
  
  '&::before': {
    content: '""',
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-accent)',
    animation: 'typing-pulse 1.5s infinite',
  },
  
  '@keyframes typing-pulse': {
    '0%, 60%, 100%': {
      opacity: 0.3,
    },
    '30%': {
      opacity: 1,
    },
  },
}));


const ContactList = ({ contact, selectedChatId, openChat, ticket = null, currentTab = null, onRefresh = null }) => {
  const { id, name, avatar, status, lastMessage, lastSeen, unreadCount, isTyping, userAvatar, userName } = contact;
  const { user: currentUser } = useContext(AuthContext);
  const { setCurrentTicket } = useContext(TicketsContext);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  
  const isSelected = id === selectedChatId;

  
  const handleClick = () => {
    openChat(id);
  };

  // Handler para aceitar ticket - agora abre o modal
  const handleAcceptTicket = (e) => {
    e.stopPropagation();
    setAcceptModalOpen(true);
  };

  // Handler quando o modal é fechado (ticket aceito ou cancelado)
  const handleModalClose = () => {
    setAcceptModalOpen(false);
    // Forçar atualização imediata da lista
    if (onRefresh) {
      console.log('🔄 Modal fechado - forçando refresh da lista de tickets');
      // Chamar imediatamente e depois um backup após delay
      onRefresh();
      setTimeout(() => {
        onRefresh();
      }, 1000);
    }
  };

  // Handler para ignorar ticket
  const handleIgnoreTicket = async (e) => {
    e.stopPropagation();
    
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "closed",
        userId: null,
        sendFarewellMessage: false
      });
    } catch (err) {
      toastError(err);
    }
  };
  
  // Status indicator variant based on contact status
  const getStatusVariant = (status) => {
    switch (status) {
      case 'online': return 'online';
      case 'busy': return 'busy';
      case 'away': return 'away';
      case 'offline': return 'offline';
      default: return 'offline';
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Dropdown handlers
  const handleFinalizarConversa = async () => {
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "closed",
        userId: currentUser.id,
        sendFarewellMessage: true
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      toastError(err);
    }
  };

  const handleTransferirConversa = () => {
    // TODO: Implementar modal de transferência
    console.log('Transferir conversa:', ticket.id);
  };

  const handleMarcarNaoLido = async () => {
    try {
      await api.put(`/tickets/${ticket.id}`, {
        unreadMessages: (ticket.unreadMessages || 0) + 1
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <StyledContactItem 
      isSelected={isSelected}
      onClick={handleClick}
    >
      {/* Avatar with Status and Unread Count */}
      <Box sx={{ position: 'relative' }}>
        <Avatar 
          src={avatar} 
          alt={name} 
          size="xl" 
          fallbackText={name}
        />
        
        {/* Status Badge */}
        <Box sx={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          zIndex: 1,
        }}>
          <Badge variant={getStatusVariant(status)} />
        </Box>
        
        {/* Contador de mensagens não lidas - pontinha superior direita do avatar */}
        {ticket?.unreadMessages > 0 && (
          <Box sx={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            minWidth: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10,
            border: '2px solid white'
          }}>
            {ticket.unreadMessages > 99 ? '99+' : ticket.unreadMessages}
          </Box>
        )}
      </Box>

      {/* Contact Info */}
      <ContactInfo>
        <ContactMeta>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContactName variant="body2">
              {name}
            </ContactName>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end', // ✅ Alinha à direita
            justifyContent: 'flex-start', // ✅ Alinha ao topo
            position: 'relative',
            top: '-18px', // ✅ Sobe para quase o topo do card
            height: 'fit-content',
            minHeight: 0,
            '@media (max-width: 768px)': {
              top: '-15px', // ✅ Responsivo: mobile
              fontSize: '10px'
            },
            '@media (max-width: 480px)': {
              top: '-12px', // ✅ Responsivo: mobile pequeno
              fontSize: '9px'
            }
          }}>
            {/* Data/Hora no topo */}
            <TimeStamp 
              variant="caption"
              sx={{
                fontSize: { xs: '10px', sm: '11px', md: '12px' }, // ✅ Responsivo
                lineHeight: 1,
                whiteSpace: 'nowrap'
              }}
            >
              {formatTime(lastSeen)}
            </TimeStamp>
          </Box>
        </ContactMeta>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginTop: '-15px'
        }}>
          {isTyping ? (
            <TypingIndicator>
              digitando...
            </TypingIndicator>
          ) : (
            <LastMessage variant="caption">
              {lastMessage}
            </LastMessage>
          )}
          
          {/* Status de lida OU Avatar do usuário */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Prioridade: Avatar do usuário > Check de lida */}
            {userAvatar || userName ? (
              <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Box
                  title={`Responsável: ${userName || 'Usuário'}`}
                  sx={{ 
                    cursor: 'help',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  <Avatar 
                    src={userAvatar ? `${process.env.REACT_APP_BACKEND_URL || ''}/public/company${currentUser?.companyId}/users/${userAvatar}` : null}
                    alt={userName || 'Usuário'} 
                    size="sm" 
                    fallbackText={userName ? userName.charAt(0).toUpperCase() : 'U'}
                  />
                </Box>

                {/* ConversationDropdown */}
                {ticket && ticket.status === 'open' && (
                  <ConversationDropdown
                    triggerText="Geral"
                    triggerColor="success"
                    triggerSize="xs"
                    align="end"
                    onFinalizarConversa={handleFinalizarConversa}
                    onTransferirConversa={handleTransferirConversa}
                    onMarcarNaoLido={handleMarcarNaoLido}
                  />
                )}
              </Box>
            ) : unreadCount === 0 ? (
              <UnreadBadge unreadCount={0}>
                <CheckIcon style={{ width: '12px', height: '12px' }} />
              </UnreadBadge>
            ) : null}
          </Box>
        </Box>
        
      </ContactInfo>


      {/* Ícones para tickets pending */}
      {ticket && ticket.status === 'pending' && currentTab === 'pending' && (
        <Box sx={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          display: 'flex',
          gap: '6px'
        }}>
          <Tooltip title="Aceitar conversa" arrow>
            <Box
              onClick={handleAcceptTicket}
              sx={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                }
              }}
            >
              <Check size={14} color="#4caf50" />
            </Box>
          </Tooltip>
          
          <Tooltip title="Ignorar conversa" arrow>
            <Box
              onClick={handleIgnoreTicket}
              sx={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)'
                }
              }}
            >
              <X size={14} color="#f44336" />
            </Box>
          </Tooltip>
        </Box>
      )}

      {/* Modal para aceitar ticket com seleção de fila */}
      <AcceptTicketWithoutQueueModal
        modalOpen={acceptModalOpen}
        onClose={handleModalClose}
        ticketId={ticket?.id}
        ticket={ticket}
      />
    </StyledContactItem>
  );
};

export default ContactList;