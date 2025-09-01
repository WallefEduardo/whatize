import React, { memo, useCallback, useContext } from 'react';
import { Box, Typography, Avatar, Badge, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketsContext } from '../../../context/Tickets/TicketsContext';
import { AuthContext } from '../../../context/Auth/AuthContext';
import api from '../../../services/api';
import toastError from '../../../errors/toastError';
import { cn } from '../../../utils/cn';

// Icons para status/canal
import { 
  CheckIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  CheckIcon as CheckSolidIcon
} from '@heroicons/react/24/solid';

const ContactItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})(({ theme, isSelected }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  marginBottom: '4px',
  position: 'relative',
  
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
  },
  
  ...(isSelected && {
    backgroundColor: 'rgba(0, 195, 7, 0.1)',
    borderLeft: '3px solid var(--color-accent)',
    paddingLeft: '13px'
  }),
  
  // Separador inferior
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '16px',
    right: '16px',
    height: '1px',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  }
}));

const ContactAvatar = styled(Avatar)(({ theme }) => ({
  width: '48px',
  height: '48px',
  flexShrink: 0,
  backgroundColor: '#E5F3E5',
  color: 'var(--color-accent)',
  fontWeight: 600,
  fontSize: '16px'
}));

const ContactInfo = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}));

const ContactHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px'
}));

const ContactName = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: '14px',
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1
}));

const ContactMeta = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}));

const TimeStamp = styled(Typography)(() => ({
  fontSize: '12px',
  color: 'var(--text-secondary)',
  fontWeight: 500,
  whiteSpace: 'nowrap'
}));

const UnreadBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: 'var(--color-accent)',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    minWidth: '18px',
    height: '18px'
  }
}));

const LastMessage = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'hasUnread',
})(({ hasUnread }) => ({
  fontSize: '13px',
  color: hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
  fontWeight: hasUnread ? 500 : 400,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: 1.3
}));

const StatusContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginTop: '4px'
}));

const QueueBadge = styled(Box)(({ theme, queueColor }) => ({
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 600,
  backgroundColor: queueColor ? `${queueColor}20` : '#f0f0f0',
  color: queueColor || '#666',
  whiteSpace: 'nowrap',
  textTransform: 'uppercase'
}));

const UserBadge = styled(Box)(({ theme }) => ({
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 600,
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap'
}));

const MessageStatus = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  color: 'var(--color-accent)',
  
  '& svg': {
    width: '14px',
    height: '14px'
  }
}));

const PendingActions = styled(Box)(() => ({
  position: 'absolute',
  bottom: '8px',
  right: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  
  '& .MuiIconButton-root': {
    padding: '6px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    
    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
    
    '& svg': {
      width: '18px',
      height: '18px'
    }
  },
  
  '& .accept-btn': {
    backgroundColor: '#4caf50',
    color: 'white',
    
    '&:hover': {
      backgroundColor: '#45a049',
    }
  },
  
  '& .ignore-btn': {
    backgroundColor: '#f44336',
    color: 'white',
    
    '&:hover': {
      backgroundColor: '#da190b',
    }
  }
}));

// Função para formatar timestamp otimizada
const formatTimestamp = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'dd/MM');
    }
  } catch (error) {
    return '';
  }
};

// Função para obter iniciais do nome
const getInitials = (name) => {
  if (!name) return '??';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

// Função para processar mensagem (remover markdown, detectar mídia, etc.)
const processMessage = (message) => {
  if (!message) return 'Nova conversa';
  
  // Detectar tipos de conteúdo especiais
  if (message.includes('data:image') || message.includes('base64')) {
    return '📷 Imagem';
  }
  
  if (message.includes('data:audio') || message.includes('.mp3')) {
    return '🎵 Áudio';
  }
  
  if (message.includes('data:video') || message.includes('.mp4')) {
    return '🎥 Vídeo';
  }
  
  if (message.includes('BEGIN:VCARD')) {
    return '👤 Contato';
  }
  
  if (message.includes('fb.me')) {
    return '🔗 Clique de Anúncio';
  }
  
  // Limitar tamanho da mensagem
  return message.length > 50 ? `${message.substring(0, 50)}...` : message;
};

const OptimizedContactList = memo(({ 
  ticket, 
  selectedChatId, 
  onContactSelect,
  currentTab = null
}) => {
  const { setCurrentTicket } = useContext(TicketsContext);
  const { user: currentUser } = useContext(AuthContext);
  
  // Dados do ticket
  const {
    id,
    uuid,
    contact,
    lastMessage,
    updatedAt,
    unreadMessages = 0,
    queue,
    user,
    status,
    whatsapp
  } = ticket;

  const isSelected = selectedChatId === uuid;
  const hasUnread = unreadMessages > 0;

  // Handler otimizado para seleção
  const handleSelect = useCallback(() => {
    if (!isSelected) {
      setCurrentTicket({ id, uuid });
      onContactSelect?.(uuid);
    }
  }, [id, uuid, isSelected, setCurrentTicket, onContactSelect]);

  // Handler para aceitar ticket
  const handleAcceptTicket = useCallback(async (e) => {
    e.stopPropagation(); // Prevenir seleção do ticket
    
    try {
      await api.put(`/tickets/${id}`, {
        status: ticket.isGroup ? "group" : "open",
        userId: currentUser?.id
      });
      
      // Atualizar contexto
      setCurrentTicket({ id, uuid });
      onContactSelect?.(uuid);
    } catch (err) {
      toastError(err);
    }
  }, [id, uuid, ticket.isGroup, currentUser?.id, setCurrentTicket, onContactSelect]);

  // Handler para ignorar ticket
  const handleIgnoreTicket = useCallback(async (e) => {
    e.stopPropagation(); // Prevenir seleção do ticket
    
    try {
      await api.put(`/tickets/${id}`, {
        status: "closed",
        userId: null,
        sendFarewellMessage: false
      });
    } catch (err) {
      toastError(err);
    }
  }, [id]);

  // Memoizar componentes pesados
  const avatarComponent = React.useMemo(() => (
    <ContactAvatar 
      src={contact?.urlPicture} 
      alt={contact?.name}
    >
      {!contact?.urlPicture && getInitials(contact?.name)}
    </ContactAvatar>
  ), [contact?.urlPicture, contact?.name]);

  const timestampComponent = React.useMemo(() => (
    <TimeStamp>
      {formatTimestamp(updatedAt)}
    </TimeStamp>
  ), [updatedAt]);

  const unreadBadgeComponent = React.useMemo(() => {
    if (!hasUnread) return null;
    
    return (
      <UnreadBadge badgeContent={unreadMessages > 99 ? '99+' : unreadMessages}>
        <Box sx={{ width: 0, height: 0 }} />
      </UnreadBadge>
    );
  }, [hasUnread, unreadMessages]);

  const statusBadgesComponent = React.useMemo(() => (
    <StatusContainer>
      {queue && (
        <QueueBadge queueColor={queue.color}>
          {queue.name}
        </QueueBadge>
      )}
      
      {user && (
        <UserBadge>
          {user.name}
        </UserBadge>
      )}
    </StatusContainer>
  ), [queue, user]);

  const messageStatusComponent = React.useMemo(() => {
    if (status === 'closed') {
      return (
        <MessageStatus>
          <CheckSolidIcon />
        </MessageStatus>
      );
    }
    return null;
  }, [status]);

  const pendingActionsComponent = React.useMemo(() => {
    if (status === 'pending' && currentTab === 'pending') {
      return (
        <PendingActions>
          <IconButton
            className="accept-btn"
            onClick={handleAcceptTicket}
            size="small"
            title="Aceitar conversa"
          >
            <CheckIcon />
          </IconButton>
          <IconButton
            className="ignore-btn"
            onClick={handleIgnoreTicket}
            size="small"
            title="Ignorar conversa"
          >
            <XMarkIcon />
          </IconButton>
        </PendingActions>
      );
    }
    return null;
  }, [status, currentTab, handleAcceptTicket, handleIgnoreTicket]);

  return (
    <ContactItem 
      isSelected={isSelected}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Conversa com ${contact?.name || 'Contato'}`}
    >
      {avatarComponent}
      
      <ContactInfo>
        <ContactHeader>
          <ContactName>
            {contact?.name || 'Contato sem nome'}
          </ContactName>
          
          <ContactMeta>
            {timestampComponent}
            {unreadBadgeComponent}
            {messageStatusComponent}
          </ContactMeta>
        </ContactHeader>
        
        <LastMessage hasUnread={hasUnread}>
          {processMessage(lastMessage)}
        </LastMessage>
        
        {statusBadgesComponent}
      </ContactInfo>
      
      {pendingActionsComponent}
    </ContactItem>
  );
});

OptimizedContactList.displayName = 'OptimizedContactList';

export default OptimizedContactList;