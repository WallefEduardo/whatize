import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';
import { formatTime } from '../data/mockData';

// Nossos componentes UI
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
// Icons
import { CheckIcon } from '@heroicons/react/24/outline';

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


const ContactList = ({ contact, selectedChatId, openChat }) => {
  const { id, name, avatar, status, lastMessage, lastSeen, unreadCount, isTyping } = contact;
  
  const isSelected = id === selectedChatId;
  
  const handleClick = () => {
    openChat(id);
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

  return (
    <StyledContactItem 
      isSelected={isSelected}
      onClick={handleClick}
    >
      {/* Avatar with Status */}
      <Box sx={{ position: 'relative' }}>
        <Avatar size="lg">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        
        {/* Status Badge */}
        <Box sx={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          zIndex: 1,
        }}>
          <Badge variant={getStatusVariant(status)} />
        </Box>
      </Box>

      {/* Contact Info */}
      <ContactInfo>
        <ContactMeta>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContactName variant="body2">
              {name}
            </ContactName>
            {unreadCount > 0 && (
              <UnreadBadge unreadCount={unreadCount}>
                {unreadCount}
              </UnreadBadge>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            {/* Data/Hora em cima */}
            <TimeStamp variant="caption">
              {formatTime(lastSeen)}
            </TimeStamp>
            
            {/* Avatar do usuário atendente no meio */}
            <Box
              sx={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
                color: 'white',
              }}
            >
              U
            </Box>
          </Box>
        </ContactMeta>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isTyping ? (
            <TypingIndicator>
              digitando...
            </TypingIndicator>
          ) : (
            <LastMessage variant="caption">
              {lastMessage}
            </LastMessage>
          )}
          
          {/* Status de lida */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {unreadCount === 0 && (
              <UnreadBadge unreadCount={0}>
                <CheckIcon style={{ width: '12px', height: '12px' }} />
              </UnreadBadge>
            )}
          </Box>
        </Box>
        
      </ContactInfo>
    </StyledContactItem>
  );
};

export default ContactList;