import React, { useState, useContext } from 'react';
import { Box, Typography, IconButton, Tooltip, Checkbox } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';
import { formatTime, formatDateSeparator, isSameDay } from '../data/mockData';

// Context API do chat antigo
import { ReplyMessageContext } from '../../../context/ReplyingMessage/ReplyingMessageContext';
import { ForwardMessageContext } from '../../../context/ForwarMessage/ForwardMessageContext';

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
  shouldForwardProp: (prop) => !['isSent', 'showCheckbox', 'isSelected'].includes(prop)
})(({ theme, isSent, showCheckbox, isSelected }) => ({
  display: 'flex',
  gap: '8px',
  alignItems: 'flex-start',
  marginBottom: '16px',
  padding: showCheckbox 
    ? '0 16px 0 50px' // Quando tem checkbox, espaço para checkbox + margem
    : (isSent ? '0 32px 0 16px' : '0 16px 0 32px'), // Padding normal
  flexDirection: 'row',
  justifyContent: isSent ? 'flex-end' : 'flex-start', // Justifica para direita se enviada
  position: 'relative',
  
  // LAYOUT SEMPRE FIXO - nunca muda
  padding: showCheckbox 
    ? '0 16px 0 50px' // Quando tem checkbox, padding fixo
    : (isSent ? '0 32px 0 16px' : '0 16px 0 32px'), // Padding normal
    
  // Faixa verde bem transparente - quase invisível
  backgroundColor: isSelected && showCheckbox 
    ? 'rgba(37, 211, 102, 0.08)' // Bem sutil
    : 'transparent',
    
  // Estender faixa com box-shadow (mesma transparência)
  boxShadow: isSelected && showCheckbox 
    ? '-16px 0 0 0 rgba(37, 211, 102, 0.08), 16px 0 0 0 rgba(37, 211, 102, 0.08)'
    : 'none',
  
  '&:hover .message-actions': {
    opacity: 1,
  },
}));

const MessageContent = styled(Box, {
  shouldForwardProp: (prop) => !['isSent', 'showCheckbox'].includes(prop)
})(({ theme, isSent, showCheckbox }) => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '70%',
  gap: '4px',
  alignItems: isSent ? 'flex-end' : 'flex-start',
  marginLeft: '0', // Sem margem extra, usa o padding do container
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
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
    border: '1px dashed var(--border-secondary)',
  } : isSent ? {
    backgroundColor: 'rgba(0, 195, 7, 0.15)', // Verde bem clarinho e transparente
    color: 'var(--text-primary)', // Texto que se adapta ao tema
    borderBottomRightRadius: '4px',
  } : {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderBottomLeftRadius: '4px',
    border: '1px solid var(--border-primary)',
  }),
}));

const MessageTime = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  fontSize: '11px',
  color: 'var(--text-secondary)', // Adapta automaticamente ao tema
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
    color: 'var(--text-secondary)',
    '&:hover': {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    },
  },
}));

const ReplyMessage = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  padding: '6px 8px',
  marginBottom: '2px', // Muito pouco espaço para ficar colado
  borderRadius: '6px',
  // Cores que se adaptam ao tema
  backgroundColor: isSent ? 'var(--hover-bg-light)' : 'var(--bg-tertiary)', 
  borderLeft: '3px solid var(--color-accent)', 
  fontSize: '13px',
  color: 'var(--text-primary)', 
  boxShadow: 'var(--shadow-sm)',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: 'var(--hover-bg-medium)',
  },
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
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center'
          }}>
            <ClockIcon style={{ 
              width: '12px', 
              height: '12px', 
              color: 'var(--text-secondary)',
              animation: isOptimistic ? 'spin 1s linear infinite' : 'none'
            }} />
          </span>
        );
      case 1:
        return <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }} />;
      case 2:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
            <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }} />
            <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }} />
          </span>
        );
      case 3:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
            <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--color-accent)' }} />
            <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--color-accent)' }} />
          </span>
        );
      case -1:
        return (
          <span style={{ 
            fontSize: '12px', 
            color: 'var(--color-red, #ff4444)', 
            fontWeight: 'bold' 
          }}>❌</span>
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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
          <CheckIcon style={{ width: '12px', height: '12px' }} />
          <CheckIcon style={{ width: '12px', height: '12px' }} />
        </span>
      );
    case 'read':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
          <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--color-accent)' }} />
          <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--color-accent)' }} />
        </span>
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
  showDateSeparator = false,
  onScrollToMessage
}) => {
  // Context API para reply - igual ao chat antigo
  const { setReplyingMessage } = useContext(ReplyMessageContext);
  
  // Context API para forward - igual ao chat antigo
  const { 
    showSelectMessageCheckbox,
    selectedMessages,
    setSelectedMessages 
  } = useContext(ForwardMessageContext);
  // Adaptar para API real - usar campos reais da mensagem
  const messageText = message.body || message.content || '';
  const messageTime = message.createdAt || message.timestamp;
  const messageId = message.id;
  const isSent = message.fromMe || false; // Campo real da API
  const ack = message.ack; // Status de entrega
  const quotedMsg = message.quotedMsg; // Mensagem citada/reply
  const isDeleted = message.isDeleted || false; // Status de mensagem deletada
  const deletedForAll = message.deletedForAll || false; // Flag para tooltip
  const originalBody = message.originalBody || ''; // Mensagem original
  
  // Debug removido para limpar console
  
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
    // Usar Context API igual ao chat antigo
    setReplyingMessage(message);
  };

  const handleForwardMessage = () => {
    // Se não estamos no modo de seleção, ativar o modo e selecionar esta mensagem
    if (!showSelectMessageCheckbox) {
      handleForward(messageId);
    }
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

  const handleReplyClick = () => {
    if (quotedMsg?.id && onScrollToMessage) {
      onScrollToMessage(quotedMsg.id);
    }
  };

  // Verificar se a mensagem está selecionada
  const isSelected = selectedMessages.some(msg => msg.id === messageId);

  // Handler para selecionar/deselecionar mensagem
  const handleSelectMessage = () => {
    if (isSelected) {
      // Remover da seleção
      setSelectedMessages(prev => prev.filter(msg => msg.id !== messageId));
    } else {
      // Adicionar à seleção
      setSelectedMessages(prev => [...prev, message]);
    }
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
      
      <MessageContainer 
        isSent={isSent} 
        showCheckbox={showSelectMessageCheckbox} 
        isSelected={isSelected}
        data-message-id={messageId}
      >
      {/* Checkbox para seleção - posição absoluta SEMPRE FIXA */}
      {showSelectMessageCheckbox && (
        <Box sx={{ 
          position: 'absolute',
          left: '8px', // SEMPRE 8px - NUNCA muda
          top: '12px', // SEMPRE 12px - NUNCA muda
          zIndex: 2 // Acima da faixa verde
        }}>
          <Checkbox
            checked={isSelected}
            onChange={handleSelectMessage}
            size="small"
            sx={{
              padding: '4px',
              color: 'var(--text-secondary)',
              '&.Mui-checked': {
                color: 'var(--color-accent)',
              },
              '& .MuiSvgIcon-root': {
                fontSize: '18px',
              }
            }}
          />
        </Box>
      )}
      
      {/* Avatar para mensagens recebidas (esquerda) */}
      {!isSent && !showSelectMessageCheckbox && (
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
      <MessageContent isSent={isSent} showCheckbox={showSelectMessageCheckbox} sx={{ order: 1, position: 'relative', zIndex: 1 }}>
        {/* Pin Indicator */}
        {isMessagePinned && (
          <PinIndicator>
            <MapPinIcon style={{ width: '16px', height: '16px', color: 'var(--color-accent)' }} />
          </PinIndicator>
        )}

        {/* Message Bubble - Reply integrado dentro */}
        {isDeleted ? (
          <Tooltip 
            title={originalBody ? `Mensagem original: "${originalBody}"` : 'Mensagem apagada'}
            arrow 
            placement={isSent ? "left" : "right"}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: '#ffffff',
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
            {/* Reply dentro da bubble igual WhatsApp */}
            {quotedMsg && (
              <Box 
                onClick={handleReplyClick}
                sx={{
                  backgroundColor: isSent ? 'var(--hover-bg-light)' : 'var(--bg-tertiary)',
                  borderLeft: '3px solid var(--color-accent)',
                  padding: '6px 8px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'var(--hover-bg-medium)'
                  }
                }}>
                <Typography variant="caption" sx={{ 
                  fontWeight: 600, 
                  fontSize: '11px',
                  color: 'var(--color-accent)',
                  display: 'block',
                  marginBottom: '2px'
                }}>
                  {quotedMsg?.contact?.name || 'Você'}
                </Typography>
                <Typography variant="caption" sx={{ 
                  fontSize: '12px',
                  opacity: 0.8,
                  color: isSent ? 'var(--text-secondary)' : 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '250px',
                  display: 'block'
                }}>
                  {quotedMsg?.body || 'Mensagem original'}
                </Typography>
              </Box>
            )}
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