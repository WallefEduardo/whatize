import React, { memo, useMemo } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importar função para backend URL
const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
};

// Função para construir URL do avatar (mesma do MessageItem)
const getAvatarUrl = (user) => {
  if (!user) return '';

  const backendUrl = getBackendUrl();

  // Se tem profileImage, construir URL completa
  if (user.profileImage && user.companyId) {
    return `${backendUrl}/public/company${user.companyId}/${user.profileImage}`;
  }

  // Fallback para avatar antigo ou nopicture
  return user.avatar || user.profilePicUrl || '';
};

// Icons
import {
  UserIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

const ResultCard = styled(Box)(() => ({
  padding: '12px 16px',
  borderBottom: '1px solid var(--border-primary)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  position: 'relative',

  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
  },

  '&:active': {
    backgroundColor: 'var(--bg-tertiary)',
  },

  '&:last-child': {
    borderBottom: 'none',
  }
}));

const MessageHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '6px',
}));

const MessageMeta = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1,
}));

const SenderName = styled(Typography)(() => ({
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  maxWidth: '120px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const MessageTime = styled(Typography)(() => ({
  fontSize: '11px',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
}));

const MessagePreview = styled(Typography)(() => ({
  fontSize: '14px',
  lineHeight: 1.4,
  color: 'var(--text-primary)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  wordBreak: 'break-word',

  // Highlight do termo pesquisado
  '& .highlight': {
    backgroundColor: 'var(--color-accent)',
    color: 'white',
    padding: '1px 2px',
    borderRadius: '2px',
    fontWeight: 600,
  }
}));

const MessageTypeIcon = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  color: 'var(--text-secondary)',
}));

const MediaPreview = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  fontStyle: 'italic',
}));

// Função para destacar termo na mensagem
const highlightText = (text, query) => {
  if (!query.trim() || !text) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="highlight">
        {part}
      </span>
    ) : (
      part
    )
  );
};

// Função para formatar data/hora
const formatMessageTime = (timestamp) => {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);

    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ptBR });
    }

    if (isYesterday(date)) {
      return `Ontem ${format(date, 'HH:mm', { locale: ptBR })}`;
    }

    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
};

// Função para detectar tipo de mídia e retornar preview
const getMediaPreview = (message) => {
  const { mediaType, mediaUrl, body } = message;

  if (mediaType) {
    switch (mediaType.toLowerCase()) {
      case 'image':
        return {
          icon: <PhotoIcon style={{ width: '14px', height: '14px' }} />,
          text: 'Imagem'
        };
      case 'video':
        return {
          icon: <VideoCameraIcon style={{ width: '14px', height: '14px' }} />,
          text: 'Vídeo'
        };
      case 'audio':
        return {
          icon: <SpeakerWaveIcon style={{ width: '14px', height: '14px' }} />,
          text: 'Áudio'
        };
      case 'document':
        return {
          icon: <DocumentTextIcon style={{ width: '14px', height: '14px' }} />,
          text: 'Documento'
        };
      default:
        return {
          icon: <DocumentTextIcon style={{ width: '14px', height: '14px' }} />,
          text: 'Arquivo'
        };
    }
  }

  return null;
};

const MessageResult = memo(({ message, query, onClick, currentUser, profile, selectedContact }) => {
  const {
    id,
    body,
    createdAt,
    contact,
    fromMe,
    mediaType,
    mediaUrl
  } = message;


  // 🎯 Mesma lógica do MessageItem para definir sender
  const messageUser = message.user; // Dados do usuário que enviou a mensagem
  const isSent = fromMe; // Alias para deixar mais claro

  // 🔧 Usar selectedContact como fallback se contact não existir ou estiver incompleto
  const actualContact = useMemo(() => {
    // 🐛 Debug temporário
    console.log('🔍 MessageResult Debug:', {
      messageId: id,
      fromMe,
      messageContact: contact,
      selectedContact,
      hasContactData: contact && (contact.name || contact.avatar || contact.profilePicUrl)
    });

    // Se messageContact não tem avatar, sempre usar selectedContact que tem dados completos
    if (!contact || !contact.avatar) {
      return selectedContact;
    }

    // Se messageContact tem avatar, usar ele
    return contact;
  }, [contact, selectedContact, id, fromMe]);

  const sender = useMemo(() => {
    const result = isSent
      ? (messageUser || currentUser || profile) // Prioridade: messageUser > currentUser > profile
      : actualContact; // ✅ Usar actualContact ao invés de contact direto

    // 🐛 Debug temporário para avatar
    if (!isSent) {
      console.log('🖼️ Avatar Debug:', {
        messageId: id,
        sender: result,
        avatarUrl: getAvatarUrl(result),
        senderName: result?.name
      });
    }

    return result;
  }, [isSent, messageUser, currentUser, profile, actualContact, id]);

  // Memoizar preview de mídia
  const mediaPreview = useMemo(() => getMediaPreview(message), [message]);

  // Memoizar tempo formatado
  const formattedTime = useMemo(() => formatMessageTime(createdAt), [createdAt]);

  // Memoizar nome do remetente
  const senderName = useMemo(() => {
    if (fromMe) return 'Você';
    return sender?.name || actualContact?.name || 'Contato';
  }, [fromMe, sender, actualContact]);

  // Memoizar texto destacado
  const highlightedText = useMemo(() => {
    if (mediaPreview && !body) {
      return `${mediaPreview.text}${body ? `: ${body}` : ''}`;
    }
    return highlightText(body || 'Mensagem sem texto', query);
  }, [body, query, mediaPreview]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <ResultCard onClick={handleClick}>
      {/* Header com avatar e meta */}
      <MessageHeader>
        <Avatar
          src={getAvatarUrl(sender)}
          sx={{
            width: 24,
            height: 24,
            fontSize: '10px',
            backgroundColor: fromMe ? 'var(--color-accent)' : 'var(--bg-tertiary)'
          }}
        >
          {fromMe ? 'V' : (senderName?.charAt(0) || <UserIcon style={{ width: '12px', height: '12px' }} />)}
        </Avatar>

        <MessageMeta>
          <SenderName>
            {senderName}
          </SenderName>

          <MessageTime>
            {formattedTime}
          </MessageTime>
        </MessageMeta>

        {/* Ícone do tipo de mídia */}
        {mediaPreview && (
          <MessageTypeIcon>
            {mediaPreview.icon}
          </MessageTypeIcon>
        )}
      </MessageHeader>

      {/* Preview da mensagem */}
      <MessagePreview>
        {mediaPreview && !body ? (
          <MediaPreview>
            {mediaPreview.icon}
            <span>{mediaPreview.text}</span>
          </MediaPreview>
        ) : (
          highlightedText
        )}
      </MessagePreview>
    </ResultCard>
  );
});

MessageResult.displayName = 'MessageResult';

export default MessageResult;