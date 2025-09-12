import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';
import { formatTime, formatDateSeparator, isSameDay } from '../data/mockData';

// Nossos componentes UI
import { Avatar } from '../../../components/ui/AvatarOptimized';
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
  padding: isSent ? '0 32px 0 16px' : '0 16px 0 32px', // Mais espaço nas bordas para ambos os lados
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
  shouldForwardProp: (prop) => !['isSent', 'isDeleted'].includes(prop)
})(({ theme, isSent, isDeleted }) => ({
  padding: '8px 12px',
  borderRadius: '12px',
  wordBreak: 'break-word',
  position: 'relative',
  
  ...(isDeleted ? {
    // Estilo para mensagens deletadas
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: 'rgba(0, 0, 0, 0.4)',
    fontStyle: 'italic',
    border: '1px dashed rgba(0, 0, 0, 0.2)',
  } : isSent ? {
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

const DateSeparator = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '16px 0',
  position: 'relative',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: 'var(--border-primary)',
    zIndex: 0,
  },
}));

const DateLabel = styled(Typography)(() => ({
  backgroundColor: 'var(--bg-primary)',
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-primary)',
  zIndex: 1,
}));

const MessageStatus = ({ status, ack, isOptimistic }) => {
  // 🚀 Sistema otimista: usar ack numérico se disponível
  if (typeof ack === 'number') {
    switch (ack) {
      case 0:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ClockIcon style={{ 
              width: '12px', 
              height: '12px', 
              color: 'rgba(255, 255, 255, 0.7)',
              animation: isOptimistic ? 'spin 1s linear infinite' : 'none'
            }} />
            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </Box>
        );
      case 1:
        return <CheckIcon style={{ width: '12px', height: '12px', color: 'rgba(255, 255, 255, 0.7)' }} />;
      case 2:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
            <CheckIcon style={{ width: '12px', height: '12px', color: 'rgba(255, 255, 255, 0.7)' }} />
            <CheckIcon style={{ width: '12px', height: '12px', color: 'rgba(255, 255, 255, 0.7)' }} />
          </Box>
        );
      case 3:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
            <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--color-accent)' }} />
            <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--color-accent)' }} />
          </Box>
        );
      case -1:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              fontSize: '12px', 
              color: '#ff4444', 
              fontWeight: 'bold' 
            }}>❌</span>
          </Box>
        );
      default:
        return null;
    }
  }
  
  // Fallback para sistema legado com strings
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
  pinnedMessages,
  showDateSeparator = false
}) => {
  // Adaptar para API real - usar campos reais da mensagem
  const messageText = message.body || message.content || '';
  const messageTime = message.createdAt || message.timestamp;
  const messageId = message.id;
  const isSent = message.fromMe || false; // Campo real da API
  const ack = message.ack; // Status de entrega
  const quotedMsg = message.quotedMsg; // Mensagem citada/reply
  const isDeleted = message.isDeleted || false; // Status de mensagem deletada
  
  // ✅ Determinar o remetente correto
  // Para mensagens enviadas: usar dados do usuário remetente se disponível, senão fallback para profile
  // Para mensagens recebidas: usar dados do contato
  const messageUser = message.user; // Dados do usuário que enviou a mensagem
  const sender = isSent 
    ? (messageUser ? messageUser : profile) // Se tem usuário da mensagem, usar ele; senão usar profile atual
    : contact;
  
  // Verificar se a mensagem está pinada (apenas pelo array pinnedMessages)
  const isMessagePinned = pinnedMessages?.some(
    pinnedMessage => pinnedMessage.id === message.id
  ) || false;

  const handleDeleteMessage = () => {
    onDelete(messageId);
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


  return (
    <>
      {/* Separador de Data */}
      {showDateSeparator && (
        <DateSeparator>
          <DateLabel>
            {formatDateSeparator(messageTime)}
          </DateLabel>
        </DateSeparator>
      )}
      
      <MessageContainer isSent={isSent}>
      {/* Avatar para mensagens recebidas (esquerda) */}
      {!isSent && (
        <Box sx={{ flexShrink: 0, alignSelf: 'flex-end', mb: '20px', order: 0 }}>
          <Avatar 
            src={sender?.profileImage || sender?.avatar} 
            alt={sender?.name}
            size="md"
            fallbackText={sender?.name}
          />
        </Box>
      )}

      {/* Message Actions */}
      {!isDeleted && (
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
      )}

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
        {isDeleted ? (
          <Tooltip 
            title={
              messageText.includes('🚫') || messageText.includes('_Mensagem Apagada_') 
                ? "Conteúdo original não disponível"
                : `Mensagem original: "${messageText}"`
            } 
            arrow 
            placement={isSent ? "left" : "right"}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  fontSize: '12px',
                  maxWidth: '300px',
                }
              }
            }}
          >
            <MessageBubble isSent={isSent} isDeleted={isDeleted}>
              <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                🚫 {isSent ? 'Você apagou esta mensagem' : 'Esta mensagem foi apagada'}
              </Typography>
            </MessageBubble>
          </Tooltip>
        ) : (
          <MessageBubble isSent={isSent} isDeleted={isDeleted}>
            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
              {messageText}
            </Typography>
          </MessageBubble>
        )}

        {/* Message Time and Status */}
        <MessageTime isSent={isSent}>
          {formatTime(messageTime)}
          {isSent && <MessageStatus 
            status={ack} 
            ack={message.ack} 
            isOptimistic={message.isOptimistic}
          />}
        </MessageTime>
      </MessageContent>

      {/* Avatar para mensagens enviadas (direita) */}
      {isSent && (
        <Box sx={{ flexShrink: 0, alignSelf: 'flex-end', mb: '20px', order: 2 }}>
          <Avatar 
            src={sender?.profileImage || sender?.avatar} 
            alt={sender?.name}
            size="md"
            fallbackText={sender?.name}
          />
        </Box>
      )}
    </MessageContainer>
    </>
  );
};

export default MessageItem;