import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';
import { formatTime } from '../data/mockData';

// Nossos componentes UI
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/Avatar';
import Dropdown, { DropdownTrigger, DropdownContent, DropdownItem } from '../../../components/ui/Dropdown';

// Icons
import { 
  EllipsisVerticalIcon, 
  ArrowUturnLeftIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolidIcon,
  MapPinIcon
} from '@heroicons/react/24/solid';

const MessageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  display: 'flex',
  gap: '8px',
  alignItems: 'flex-start',
  marginBottom: '16px',
  padding: '0 16px',
  flexDirection: 'row',
  justifyContent: isSent ? 'flex-end' : 'flex-start', // Justifica para direita se enviada
  
  '&:hover .message-actions': {
    opacity: 1,
  },
}));

const MessageContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '70%',
  gap: '4px',
  alignItems: isSent ? 'flex-end' : 'flex-start',
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  padding: '8px 12px',
  borderRadius: '12px',
  wordBreak: 'break-word',
  position: 'relative',
  
  ...(isSent ? {
    backgroundColor: 'var(--color-accent)',
    color: 'white',
    borderBottomRightRadius: '4px',
  } : {
    backgroundColor: '#f5f5f5',
    color: 'var(--text-primary)',
    borderBottomLeftRadius: '4px',
    border: '1px solid #e0e0e0',
  }),
}));

const MessageTime = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  fontSize: '11px',
  color: isSent ? 'rgba(0, 0, 0, 0.6)' : 'var(--text-secondary)', // Mudou para cor mais escura nas mensagens enviadas
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  marginTop: '2px',
}));

const MessageActions = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  marginTop: '4px',
  order: isSent ? 0 : 2, // Para mensagens enviadas: antes do conteúdo, para recebidas: depois
  
  '& .MuiIconButton-root': {
    padding: '4px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-secondary)',
    '&:hover': {
      backgroundColor: 'var(--bg-primary)',
    },
  },
}));

const ReplyMessage = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  padding: '6px 10px',
  marginBottom: '4px',
  borderRadius: '8px',
  backgroundColor: isSent ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-primary)',
  borderLeft: isSent ? '3px solid rgba(255, 255, 255, 0.5)' : '3px solid var(--color-accent)',
  fontSize: '13px',
  color: isSent ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-secondary)',
}));

const PinIndicator = styled(Box)(() => ({
  position: 'absolute',
  top: '-6px',
  right: '8px',
  zIndex: 1,
  transform: 'rotate(45deg)',
}));

const MessageStatus = ({ status }) => {
  switch (status) {
    case 'sending':
      return <ClockIcon style={{ width: '12px', height: '12px' }} />;
    case 'sent':
      return <CheckIcon style={{ width: '12px', height: '12px' }} />;
    case 'delivered':
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
          <CheckIcon style={{ width: '12px', height: '12px' }} />
          <CheckIcon style={{ width: '12px', height: '12px' }} />
        </Box>
      );
    case 'read':
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
          <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--color-accent)' }} />
          <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--color-accent)' }} />
        </Box>
      );
    default:
      return null;
  }
};

const MessageItem = ({ 
  message, 
  contact, 
  profile, 
  onDelete, 
  index, 
  selectedChatId, 
  handleReply, 
  replyData,
  handleForward,
  handlePinMessage,
  pinnedMessages
}) => {
  // Adaptar para API real - usar campos reais da mensagem
  const messageText = message.body || message.content || '';
  const messageTime = message.createdAt || message.timestamp;
  const messageId = message.id;
  const isSent = message.fromMe || false; // Campo real da API
  const ack = message.ack; // Status de entrega
  const quotedMsg = message.quotedMsg; // Mensagem citada/reply
  
  const sender = isSent ? profile : contact;
  
  // Verificar se a mensagem está pinada (apenas pelo array pinnedMessages)
  const isMessagePinned = pinnedMessages?.some(
    pinnedMessage => pinnedMessage.id === message.id
  ) || false;

  const handleDeleteMessage = () => {
    onDelete(selectedChatId, index);
  };

  const handleReplyMessage = () => {
    handleReply(messageText, contact);
  };

  const handleForwardMessage = () => {
    handleForward();
  };

  const handlePinMessageLocal = () => {
    const pinData = {
      id: messageId,
      content: messageText,
      sender: sender,
      timestamp: messageTime,
      chatId: selectedChatId,
      index: index
    };
    handlePinMessage(pinData);
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';
  };

  return (
    <MessageContainer isSent={isSent}>
      {/* Avatar para mensagens recebidas (esquerda) */}
      {!isSent && (
        <Box sx={{ flexShrink: 0, alignSelf: 'flex-end', mb: '20px', order: 0 }}>
          <Avatar size="md">
            <AvatarImage src={sender?.avatar} alt={sender?.name} />
            <AvatarFallback>{getInitials(sender?.name)}</AvatarFallback>
          </Avatar>
        </Box>
      )}

      {/* Message Actions */}
      <MessageActions className="message-actions" isSent={isSent}>
        <Dropdown>
          <DropdownTrigger asChild>
            <IconButton size="small">
              <EllipsisVerticalIcon style={{ width: '16px', height: '16px' }} />
            </IconButton>
          </DropdownTrigger>
          
          <DropdownContent align={isSent ? "end" : "start"} side="top">
            {isSent ? (
              // Options for sent messages (right side)
              <>
                <DropdownItem 
                  onClick={handleDeleteMessage} 
                  destructive 
                  icon={<TrashIcon style={{ width: '16px', height: '16px' }} />}
                >
                  Deletar
                </DropdownItem>
                
                <DropdownItem onClick={handleReplyMessage} icon={<ArrowUturnLeftIcon style={{ width: '16px', height: '16px' }} />}>
                  Responder
                </DropdownItem>
                
                <DropdownItem onClick={handleForwardMessage} icon={<ArrowTopRightOnSquareIcon style={{ width: '16px', height: '16px' }} />}>
                  Encaminhar
                </DropdownItem>
                
                <DropdownItem onClick={() => {}} icon={<FaceSmileIcon style={{ width: '16px', height: '16px' }} />}>
                  Reagir
                </DropdownItem>
              </>
            ) : (
              // Options for received messages (left side)
              <>
                <DropdownItem onClick={handleReplyMessage} icon={<ArrowUturnLeftIcon style={{ width: '16px', height: '16px' }} />}>
                  Responder
                </DropdownItem>
                
                <DropdownItem onClick={handleForwardMessage} icon={<ArrowTopRightOnSquareIcon style={{ width: '16px', height: '16px' }} />}>
                  Encaminhar
                </DropdownItem>
                
                <DropdownItem onClick={() => {}} icon={<FaceSmileIcon style={{ width: '16px', height: '16px' }} />}>
                  Reagir
                </DropdownItem>
              </>
            )}
          </DropdownContent>
        </Dropdown>
      </MessageActions>

      {/* Message Content */}
      <MessageContent isSent={isSent} sx={{ order: 1 }}>
        {/* Pin Indicator */}
        {isMessagePinned && (
          <PinIndicator>
            <MapPinIcon style={{ width: '16px', height: '16px', color: 'var(--color-accent)' }} />
          </PinIndicator>
        )}

        {/* Reply Preview */}
        {quotedMsg && (
          <ReplyMessage isSent={isSent}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '2px' }}>
              <ArrowUturnLeftIcon style={{ width: '12px', height: '12px' }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Respondendo {isSent ? `a ${quotedMsg?.contact?.name}` : 'você'}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ 
              display: 'block', 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
            }}>
              {quotedMsg?.body || 'Mensagem original'}
            </Typography>
          </ReplyMessage>
        )}

        {/* Message Bubble */}
        <MessageBubble isSent={isSent}>
          <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
            {messageText}
          </Typography>
        </MessageBubble>

        {/* Message Time and Status */}
        <MessageTime isSent={isSent}>
          {formatTime(messageTime)}
          {isSent && <MessageStatus status={ack} />}
        </MessageTime>
      </MessageContent>

      {/* Avatar para mensagens enviadas (direita) */}
      {isSent && (
        <Box sx={{ flexShrink: 0, alignSelf: 'flex-end', mb: '20px', order: 2 }}>
          <Avatar size="md">
            <AvatarImage src={profile?.avatar} alt={profile?.name} />
            <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
          </Avatar>
        </Box>
      )}
    </MessageContainer>
  );
};

export default MessageItem;