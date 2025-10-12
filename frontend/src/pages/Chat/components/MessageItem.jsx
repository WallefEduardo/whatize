import React, { useState, useContext, useRef } from 'react';
import { Box, Typography, IconButton, Tooltip, Checkbox } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';
import { formatTime, formatDateSeparator, isSameDay } from '../data/mockData';

// Context API do chat antigo
import { ReplyMessageContext } from '../../../context/ReplyingMessage/ReplyingMessageContext';
import { ForwardMessageContext } from '../../../context/ForwarMessage/ForwardMessageContext';
import { EditMessageContext } from '../../../context/EditingMessage/EditingMessageContext';

// Nossos componentes UI
import { Avatar } from '../../../components/ui/AvatarOptimized';
import Dropdown, { DropdownTrigger, DropdownContent, DropdownItem } from '../../../components/ui/Dropdown';
import MessageReactionsPopover from './MessageReactionsPopover';
import MediaRenderer from '../../ChatModerno/components/MediaRenderer';

// API e utils
import api from '../../../services/api';
import toastError from '../../../errors/toastError';
import { toast } from '../../../components/ui/ToastProvider';
import { getBackendUrl } from '../../../config';
import whatsappIcon from '../../../assets/nopicture.png';

// Icons
import {
  EllipsisVerticalIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  FaceSmileIcon, // Para reações
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  PencilIcon, // Para editar
  DocumentDuplicateIcon, // Para copiar
  ArrowDownTrayIcon // Para download
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkSolidIcon,
  MapPinIcon
} from '@heroicons/react/24/solid';

const MessageContainer = styled(Box, {
  shouldForwardProp: (prop) => !['isSent', 'showCheckbox', 'isSelected', 'isDeleted'].includes(prop)
})(({ theme, isSent, showCheckbox, isSelected, isDeleted }) => ({
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
    
  // Faixa verde bem transparente - quase invisível (não para mensagens deletadas)
  backgroundColor: isSelected && showCheckbox && !isDeleted
    ? 'rgba(37, 211, 102, 0.08)' // Bem sutil
    : 'transparent',
    
  // Estender faixa com box-shadow (mesma transparência, não para deletadas)
  boxShadow: isSelected && showCheckbox && !isDeleted
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
  position: 'relative', // Para permitir posicionamento absoluto das reações
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => !['isSent', 'isDeleted', 'isPrivate'].includes(prop)
})(({ theme, isSent, isDeleted, isPrivate }) => ({
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
    // Mensagens privadas: azul claro (#afeaff)
    // Mensagens normais: verde claro
    backgroundColor: isPrivate ? '#afeaff' : 'rgba(0, 195, 7, 0.15)',
    color: isPrivate ? '#303030' : 'var(--text-primary)',
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

// 📝 Função para formatar texto com Markdown simples (*bold*, _italic_, ~strike~, ```code```)
const formatMessageText = (text) => {
  if (!text) return null;

  // Dividir o texto por quebras de linha primeiro
  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    const parts = [];
    let currentText = line;
    let key = 0;

    // Regex para encontrar padrões de formatação
    // *texto* = negrito
    const boldRegex = /\*([^*]+)\*/g;

    let lastIndex = 0;
    let match;

    // Processar negritos
    while ((match = boldRegex.exec(line)) !== null) {
      // Adicionar texto antes do match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lineIndex}-${key++}`}>
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Adicionar texto em negrito
      parts.push(
        <strong key={`bold-${lineIndex}-${key++}`} style={{ fontWeight: 600 }}>
          {match[1]}
        </strong>
      );

      lastIndex = match.index + match[0].length;
    }

    // Adicionar texto restante após o último match
    if (lastIndex < line.length) {
      parts.push(
        <span key={`text-${lineIndex}-${key++}`}>
          {line.substring(lastIndex)}
        </span>
      );
    }

    // Se não houver formatação, retornar a linha como está
    if (parts.length === 0) {
      parts.push(<span key={`text-${lineIndex}-${key++}`}>{line}</span>);
    }

    // Adicionar quebra de linha entre linhas (exceto a última)
    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0px' }}>
            <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }} />
            <CheckIcon style={{ width: '12px', height: '12px', color: 'var(--text-secondary)' }} />
          </span>
        );
      case 3:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0px' }}>
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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0px' }}>
          <CheckIcon style={{ width: '12px', height: '12px' }} />
          <CheckIcon style={{ width: '12px', height: '12px' }} />
        </span>
      );
    case 'read':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0px' }}>
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
  currentUser,
  onDelete,
  index,
  selectedChatId,
  handleReply,
  replyData,
  handleForward,
  handlePinMessage,
  pinnedMessages,
  showDateSeparator = false,
  onScrollToMessage,
  // 🎭 Props para reações persistentes
  addReactionToMessage,
  getMessageReactions,
  // Para galeria de mídias
  allMessages = []
}) => {
  const backendUrl = getBackendUrl();

  // 🎯 Função para construir URL do avatar (usando lógica absorvida)
  const getAvatarUrl = (user) => {
    if (!user) return whatsappIcon;

    // Se tem profileImage, construir URL completa
    if (user.profileImage && user.companyId) {
      return `${backendUrl}/public/company${user.companyId}/${user.profileImage}`;
    }

    // Fallback para avatar antigo ou nopicture
    return user.avatar || user.profilePicUrl || whatsappIcon;
  };

  // Context API para reply - igual ao chat antigo
  const { setReplyingMessage } = useContext(ReplyMessageContext);

  // Context API para forward - igual ao chat antigo
  const {
    showSelectMessageCheckbox,
    selectedMessages,
    setSelectedMessages
  } = useContext(ForwardMessageContext);

  // Context API para edit - igual ao chat antigo
  const { setEditingMessage } = useContext(EditMessageContext);
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
  // Para mensagens enviadas: SEMPRE usar currentUser se disponível (dados do usuário logado)
  // Para mensagens recebidas: usar dados do contato
  const messageUser = message.user; // Dados do usuário que enviou a mensagem

  // Debug removido

  const sender = isSent
    ? (messageUser || currentUser || profile) // Prioridade: messageUser > currentUser > profile
    : contact;
  
  // Verificar se a mensagem está pinada (apenas pelo array pinnedMessages)
  const isMessagePinned = pinnedMessages?.some(
    pinnedMessage => pinnedMessage.id === message.id
  ) || false;

  // Estados para controle do popover de reações
  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const messageBubbleRef = useRef(null);

  // 🎭 Obter reações da mensagem - primeiro do backend, fallback para estado local
  const messageReactions = message.reactions ||
                           (getMessageReactions ? getMessageReactions(messageId) : []);


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

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      toast.success('Mensagem copiada!');
    } catch (err) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = messageText;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Mensagem copiada!');
      } catch (fallbackErr) {
        toast.error('Erro ao copiar mensagem');
      }
      document.body.removeChild(textArea);
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

  const handleEditMessage = () => {
    // Usar Context API igual ao chat antigo
    setEditingMessage(message);
  };

  // Função para verificar se ainda está dentro dos 15 minutos para editar
  const isWithinFifteenMinutes = () => {
    const fifteenMinutesInMilliseconds = 15 * 60 * 1000; // 15 minutos em milissegundos
    const currentTime = new Date();
    const messageDateTime = new Date(messageTime);

    // Verifica se a diferença entre o tempo atual e o tempo da mensagem é menor que 15 minutos
    return currentTime - messageDateTime <= fifteenMinutesInMilliseconds;
  };

  const handleReplyClick = () => {
    if (quotedMsg?.id && onScrollToMessage) {
      onScrollToMessage(quotedMsg.id);
    }
  };

  // Handlers para reações
  const handleOpenReactionMenu = (event) => {
    // Usar a referência da mensagem como âncora para posicionamento próximo à mensagem
    const anchorElement = messageBubbleRef.current;

    if (!anchorElement) {
      console.error('MessageBubble ref é null!');
      return;
    }

    // Popover será posicionado próximo à mensagem
    setReactionAnchorEl(anchorElement);
    setReactionMenuOpen(true);
  };

  const handleCloseReactionMenu = () => {
    setReactionAnchorEl(null);
    setReactionMenuOpen(false);
  };

  const [isReacting, setIsReacting] = useState(false);

  const handleReactToMessage = async (reactionType) => {
    if (isReacting) return; // Previne múltiplos cliques

    setIsReacting(true);
    try {
      // 🎭 Enviar para o servidor - reações são salvas no banco e retornam via socket
      const response = await api.post(`/messages/${messageId}/reactions`, {
        type: reactionType
      });

      // As reações chegam via socket e atualizam automaticamente a mensagem

    } catch (err) {
      console.error('❌ Erro ao reagir à mensagem:', err);
      toastError(err);
    } finally {
      setIsReacting(false);
    }
  };

  // Verificar se a mensagem está selecionada
  const isSelected = selectedMessages.some(msg => msg.id === messageId);

  // Handler para selecionar/deselecionar mensagem (não funciona para deletadas)
  const handleSelectMessage = () => {
    if (isDeleted) return; // Não permite selecionar mensagens deletadas

    if (isSelected) {
      // Remover da seleção
      setSelectedMessages(prev => prev.filter(msg => msg.id !== messageId));
    } else {
      // Adicionar à seleção
      setSelectedMessages(prev => [...prev, message]);
    }
  };

  // Handler para download de mídia
  const handleDownloadMedia = async () => {
    if (!message.mediaUrl) {
      toast.error('Mídia não disponível para download');
      return;
    }

    try {
      console.log('[Download] Iniciando download de mídia:', {
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        backendUrl: backendUrl
      });

      // Construir URL completa corretamente
      let mediaUrl = message.mediaUrl;

      // Se não começar com http, adicionar backendUrl
      if (!mediaUrl.startsWith('http')) {
        // Garantir que não tenha barras duplicadas
        const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
        const cleanMediaUrl = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;
        mediaUrl = `${cleanBackendUrl}${cleanMediaUrl}`;
      }

      // Corrigir URLs com portas duplicadas ou inválidas (ex: :443 após :4000)
      // Remover padrões como :443, :80 que aparecem após a porta correta
      mediaUrl = mediaUrl.replace(/(:(\d+)):(\d+)/, '$1');

      console.log('[Download] URL final para download:', mediaUrl);

      // Determinar nome do arquivo
      let fileName = message.mediaUrl.split('/').pop() || 'download';

      // Se tiver mediaType, adicionar extensão apropriada
      if (message.mediaType && !fileName.includes('.')) {
        const ext = message.mediaType.split('/')[1] || '';
        if (ext) fileName += `.${ext}`;
      }

      console.log('[Download] Nome do arquivo:', fileName);

      // Baixar arquivo via axios como blob
      const response = await api.get(mediaUrl, {
        responseType: 'blob'
      });

      console.log('[Download] Arquivo baixado com sucesso, tamanho:', response.data.size);

      // Criar URL do blob
      const blobUrl = window.URL.createObjectURL(response.data);

      // Criar link temporário e forçar download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;

      // Adicionar ao DOM temporariamente
      document.body.appendChild(link);

      // Clicar no link
      link.click();

      // Remover do DOM e limpar blob URL
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      toast.success('Download concluído!');
      console.log('[Download] Download concluído com sucesso');
    } catch (error) {
      console.error('[Download] Erro ao baixar mídia:', {
        error: error,
        message: error.message,
        response: error.response,
        mediaUrl: message.mediaUrl
      });
      toast.error('Erro ao baixar arquivo');
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
        isDeleted={isDeleted}
        data-message-id={messageId}
      >
      {/* Checkbox para seleção - posição absoluta SEMPRE FIXA (não aparece para mensagens deletadas) */}
      {showSelectMessageCheckbox && !isDeleted && (
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
            src={getAvatarUrl(sender)}
            alt={sender?.name}
            size="md"
            fallbackText={sender?.name}
          />
        </Box>
      )}

      {/* Message Actions */}
      {!isDeleted && (
        <MessageActions className="message-actions" isSent={isSent}>
          {/* Botão de Reação - primeiro para mensagens enviadas, segundo para recebidas */}
          {isSent && (
            <IconButton
              size="small"
              onClick={handleOpenReactionMenu}
              sx={{
                marginRight: '4px', // Pequeno espaço entre reação e três pontos
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <FaceSmileIcon style={{ width: '16px', height: '16px' }} />
            </IconButton>
          )}

          {/* Menu de três pontos */}
          <Dropdown>
            <DropdownTrigger asChild>
              <IconButton
                size="small"
                sx={{
                  marginRight: isSent ? '0px' : '4px', // Espaço apenas se for recebida
                }}
              >
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

                {/* Editar - apenas para mensagens enviadas e dentro de 15 minutos */}
                {isWithinFifteenMinutes() && (
                  <DropdownItem
                    onClick={handleEditMessage}
                    icon={<PencilIcon style={{ width: '16px', height: '16px' }} />}
                  >
                    Editar
                  </DropdownItem>
                )}

                <DropdownItem onClick={handleReplyMessage} icon={<ArrowUturnLeftIcon style={{ width: '16px', height: '16px' }} />}>
                  Responder
                </DropdownItem>

                <DropdownItem onClick={handleCopyMessage} icon={<DocumentDuplicateIcon style={{ width: '16px', height: '16px' }} />}>
                  Copiar
                </DropdownItem>

                <DropdownItem onClick={handleForwardMessage} icon={<ArrowTopRightOnSquareIcon style={{ width: '16px', height: '16px' }} />}>
                  Encaminhar
                </DropdownItem>

                <DropdownItem onClick={handleOpenReactionMenu} icon={<FaceSmileIcon style={{ width: '16px', height: '16px' }} />}>
                  Reagir
                </DropdownItem>

                {/* Download - apenas se a mensagem tiver mídia */}
                {message.mediaUrl && (
                  <DropdownItem onClick={handleDownloadMedia} icon={<ArrowDownTrayIcon style={{ width: '16px', height: '16px' }} />}>
                    Download
                  </DropdownItem>
                )}
              </>
            ) : (
              // Options for received messages (left side)
              <>
                <DropdownItem onClick={handleReplyMessage} icon={<ArrowUturnLeftIcon style={{ width: '16px', height: '16px' }} />}>
                  Responder
                </DropdownItem>

                <DropdownItem onClick={handleCopyMessage} icon={<DocumentDuplicateIcon style={{ width: '16px', height: '16px' }} />}>
                  Copiar
                </DropdownItem>

                <DropdownItem onClick={handleForwardMessage} icon={<ArrowTopRightOnSquareIcon style={{ width: '16px', height: '16px' }} />}>
                  Encaminhar
                </DropdownItem>

                <DropdownItem onClick={handleOpenReactionMenu} icon={<FaceSmileIcon style={{ width: '16px', height: '16px' }} />}>
                  Reagir
                </DropdownItem>

                {/* Download - apenas se a mensagem tiver mídia */}
                {message.mediaUrl && (
                  <DropdownItem onClick={handleDownloadMedia} icon={<ArrowDownTrayIcon style={{ width: '16px', height: '16px' }} />}>
                    Download
                  </DropdownItem>
                )}
              </>
            )}
          </DropdownContent>
        </Dropdown>

        {/* Botão de Reação - segundo para mensagens recebidas */}
        {!isSent && (
          <IconButton
            size="small"
            onClick={handleOpenReactionMenu}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            <FaceSmileIcon style={{ width: '16px', height: '16px' }} />
          </IconButton>
        )}

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
          <MessageBubble
            ref={messageBubbleRef}
            isSent={isSent}
            isDeleted={isDeleted}
            isPrivate={message.isPrivate === "true" || message.isPrivate === true}
          >
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
            {/* Renderizar mídia se existir, senão mostrar texto */}
            <MediaRenderer
              message={message}
              isSent={isSent}
              contact={contact}
              allMediaMessages={allMessages.filter(msg =>
                msg.mediaUrl && (
                  msg.mediaType === 'image' ||
                  msg.mediaType?.startsWith('image/') ||
                  msg.mediaType === 'video' ||
                  msg.mediaType?.startsWith('video/')
                )
              )}
            />

            {/* Mostrar texto apenas se não for mídia ou se mídia tem legenda */}
            {messageText && (!message.mediaUrl || message.mediaType === 'chat') && (
              <Typography variant="body2" sx={{ lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                {formatMessageText(messageText)}
              </Typography>
            )}
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

        {/* Reações da mensagem - embaixo no canto da caixinha */}
        {messageReactions.length > 0 && (
          <Box sx={{
            position: 'absolute',
            bottom: '50px', // Mesmo para ambas
            // Para mensagens ENVIADAS (verde): posicionar na ESQUERDA
            // Para mensagens RECEBIDAS (branca): posicionar na DIREITA
            [isSent ? 'left' : 'right']: '2px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            zIndex: 2,
          }}>
            {messageReactions.map((reaction) => (
              <Box
                key={reaction.id}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff', // Branco sólido
                  borderRadius: '6px', // Diminuído de 10px para 6px
                  padding: '2px 4px', // Diminuído de 3px 5px para 2px 4px
                  fontSize: '10px', // Diminuído de 12px para 10px
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                  opacity: reaction.isOptimistic ? 0.8 : 1,
                  transition: 'opacity 0.2s ease',
                  minWidth: '20px', // Diminuído de 24px para 20px
                  justifyContent: 'center',
                }}
              >
                <span>{reaction.type}</span>
              </Box>
            ))}
          </Box>
        )}
      </MessageContent>

      {/* Avatar para mensagens enviadas (direita) */}
      {isSent && (
        <Box sx={{ flexShrink: 0, alignSelf: 'flex-end', mb: '20px', order: 2 }}>
          <Avatar
            src={getAvatarUrl(sender)}
            alt={sender?.name}
            size="md"
            fallbackText={sender?.name}
          />
        </Box>
      )}
    </MessageContainer>

    {/* Popover de Reações - fora do container para melhor posicionamento */}
    <MessageReactionsPopover
      anchorEl={reactionAnchorEl}
      open={reactionMenuOpen}
      onClose={handleCloseReactionMenu}
      onReact={handleReactToMessage}
      placement={isSent ? 'bottom-end' : 'bottom-start'}
      disabled={isReacting}
    />
    </>
  );
};

// 🚀 OTIMIZAÇÃO: React.memo para evitar re-renders desnecessários
export default React.memo(MessageItem, (prevProps, nextProps) => {
  // Só re-renderizar se props essenciais mudaram
  const message = prevProps.message;
  const nextMessage = nextProps.message;

  // Comparar propriedades que realmente importam para o render
  return (
    message.id === nextMessage.id &&
    message.body === nextMessage.body &&
    message.ack === nextMessage.ack &&
    message.isDeleted === nextMessage.isDeleted &&
    JSON.stringify(message.reactions) === JSON.stringify(nextMessage.reactions) &&
    prevProps.index === nextProps.index &&
    prevProps.selectedChatId === nextProps.selectedChatId
  );
});