import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';
import { formatTime } from '../data/mockData';

// Nossos componentes UI
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import StatusBadge from '../../../components/StatusBadge';

// Icons
import { CheckIcon } from '@heroicons/react/24/outline';
import { TagIcon } from '@heroicons/react/24/outline';

const StyledContactItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})(({ theme, isSelected }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px 16px',
  cursor: 'pointer',
  borderLeft: '3px solid transparent',
  borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
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

const TagsContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  marginTop: '4px',
  flexWrap: 'wrap',
}));

const TagDropdown = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ isOpen }) => ({
  position: 'absolute',
  bottom: '100%',
  left: '0',
  marginBottom: '8px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  zIndex: 1000,
  minWidth: '200px',
  padding: '8px',
  display: isOpen ? 'block' : 'none',
}));

const TagButton = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  position: 'relative',
  
  '& svg': {
    color: 'var(--color-accent)',
  },
  
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const MultiTagBadge = styled(Box)(({ tagCount }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '18px',
  height: '18px',
  borderRadius: '50%',
  backgroundColor: 'var(--text-secondary)',
  color: 'white',
  fontSize: '10px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  
  '&:hover': {
    backgroundColor: 'var(--color-accent)',
    transform: 'scale(1.1)',
  },
}));

const ContactList = ({ contact, selectedChatId, openChat }) => {
  const { id, name, avatar, status, lastMessage, lastSeen, unreadCount, isTyping } = contact;
  
  // Tags mockadas para demonstração
  const mockTags = [
    { id: 1, name: 'Cliente VIP', color: '#4CAF50' },
    { id: 2, name: 'Urgente', color: '#F44336' },
    { id: 3, name: 'Suporte', color: '#2196F3' },
    { id: 4, name: 'Vendas', color: '#FF9800' },
    { id: 5, name: 'Marketing', color: '#9C27B0' }
  ];
  
  // Simular tags diferentes para diferentes contatos
  const tags = id % 3 === 0 ? mockTags.slice(0, 3) : 
               id % 2 === 0 ? mockTags.slice(0, 1) : [];
  
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  
  const isSelected = id === selectedChatId;
  
  const handleClick = () => {
    openChat(id);
  };
  
  const toggleTagDropdown = (e) => {
    e.stopPropagation();
    setShowTagDropdown(!showTagDropdown);
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
          <ContactName variant="body2">
            {name}
          </ContactName>
          
          <TimeStamp variant="caption">
            {formatTime(lastSeen)}
          </TimeStamp>
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
          
          {/* Unread Messages or Read Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            {unreadCount > 0 ? (
              <UnreadBadge unreadCount={unreadCount}>
                {unreadCount}
              </UnreadBadge>
            ) : (
              <UnreadBadge unreadCount={0}>
                <CheckIcon style={{ width: '12px', height: '12px' }} />
              </UnreadBadge>
            )}
          </Box>
        </Box>
        
        {/* Tags Section */}
        <TagsContainer>
          {/* Sempre mostra o ícone de etiqueta - clicável para abrir dropdown */}
          <Box sx={{ position: 'relative' }}>
            <TagButton onClick={toggleTagDropdown}>
              <TagIcon style={{ width: '12px', height: '12px' }} />
            </TagButton>
            
            {/* Dropdown com tags mockadas */}
            <TagDropdown isOpen={showTagDropdown}>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block',
                  mb: 1,
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                Tags da Conversa
              </Typography>
              
              {tags.length > 0 ? (
                tags.map((tag, index) => (
                  <Box key={tag.id} sx={{ mb: index < tags.length - 1 ? 1 : 0 }}>
                    <StatusBadge
                      label={tag.name}
                      color={tag.color}
                      variant="filled"
                      size="small"
                      sx={{ fontSize: '11px', width: '100%' }}
                    />
                  </Box>
                ))
              ) : (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'var(--text-secondary)',
                    fontSize: '10px',
                    fontStyle: 'italic'
                  }}
                >
                  Nenhuma tag aplicada
                </Typography>
              )}
              
              {/* Botão para adicionar nova tag */}
              <Box sx={{ 
                mt: 1.5, 
                pt: 1.5, 
                borderTop: '1px solid var(--border-primary)' 
              }}>
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Adicionar nova tag para conversa:', id);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    '&:hover': {
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--color-accent)',
                    }
                  }}
                >
                  <TagIcon style={{ width: '12px', height: '12px' }} />
                  <span>Adicionar tag</span>
                </Box>
              </Box>
            </TagDropdown>
            
            {/* Overlay para fechar dropdown */}
            {showTagDropdown && (
              <Box
                onClick={() => setShowTagDropdown(false)}
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999,
                }}
              />
            )}
          </Box>
        </TagsContainer>
      </ContactInfo>
    </StyledContactItem>
  );
};

export default ContactList;