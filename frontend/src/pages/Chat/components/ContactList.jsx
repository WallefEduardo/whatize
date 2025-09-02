import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';
import { formatTime } from '../data/mockData';

// Função de formatação personalizada de tempo
const formatCustomTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // Menos de 1 dia - mostra hora (ex: 20h00)
  if (diffInDays < 1) {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }).replace(':', 'h');
  }
  
  // 1 dia - mostra "ontem"
  if (diffInDays === 1) {
    return 'ontem';
  }
  
  // 2-6 dias - mostra "X dias atrás"
  if (diffInDays < 7) {
    return `${diffInDays} dias atrás`;
  }
  
  // 1-3 semanas - mostra "X semana(s) atrás"
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? '1 semana atrás' : `${diffInWeeks} semanas atrás`;
  }
  
  // 1-11 meses - mostra "X mês(meses) atrás"
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 mês atrás' : `${diffInMonths} meses atrás`;
  }
  
  // 1+ anos - mostra "X ano(s) atrás"
  return diffInYears === 1 ? '1 ano atrás' : `${diffInYears} anos atrás`;
};

// Nossos componentes UI
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/AvatarOptimized';
import Badge from '../../../components/ui/Badge';
// Icons
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Check, X } from 'lucide-react';
import thumbtacksIcon from '../../../assets/iconeswhatize/thumbtacks.svg';
import { useContext } from 'react';
import { AuthContext } from '../../../context/Auth/AuthContext';
import { TicketsContext } from '../../../context/Tickets/TicketsContext';
import api from '../../../services/api';
import toastError from '../../../errors/toastError';
import { Tooltip } from '@mui/material';
import AcceptTicketWithoutQueueModal from '../../../components/AcceptTicketWithoutQueueModal';
import ConversationDropdown from '../../../components/ui/ConversationDropdown';
import TransferTicketModernModal from '../../../components/TransferTicketModernModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import ResolverTicketModal from '../../../components/ResolverTicketModal';

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
  justifyContent: 'center',
  gap: '0px',
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
  marginBottom: '5px',
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


const ContactList = ({ contact, selectedChatId, openChat, ticket = null, currentTab = null, onRefresh = null, isPinned = false, onPinConversation = null }) => {
  const { id, name, avatar, status, lastMessage, lastSeen, unreadCount, isTyping, userAvatar, userName } = contact;
  const { user: currentUser } = useContext(AuthContext);
  const { setCurrentTicket } = useContext(TicketsContext);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [resolverModalOpen, setResolverModalOpen] = useState(false);
  
  const isSelected = id === selectedChatId;
  
  // Debug do estado resolverModalOpen
  useEffect(() => {
    console.log('resolverModalOpen mudou para:', resolverModalOpen);
  }, [resolverModalOpen]);

  
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
  const handleFinalizarConversa = () => {
    console.log('handleFinalizarConversa chamado - abrindo modal resolver');
    console.log('Estado antes:', resolverModalOpen);
    setResolverModalOpen(true);
    console.log('setResolverModalOpen(true) executado');
  };

  const handleConfirmFinalizarConversa = async () => {
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

  const handleFinalizarSemDespedida = async () => {
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "closed",
        userId: currentUser.id,
        sendFarewellMessage: false,
        amountUsedBotQueues: 0
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      toastError(err);
    }
  };

  const handleTransferirConversa = () => {
    setTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setTransferModalOpen(false);
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
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <ContactName variant="body2">
              {name}
            </ContactName>
            
            {/* Mensagem logo abaixo do nome */}
            {isTyping ? (
              <TypingIndicator>
                digitando...
              </TypingIndicator>
            ) : (
              <LastMessage variant="caption">
                {lastMessage}
              </LastMessage>
            )}
          </Box>
          
          {/* Coluna direita: Data/Horário, Avatar, Badge */}
          {userAvatar || userName ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              ml: 1,
              marginRight: '5px'
            }}>
              {/* Data/Horário no topo */}
              <TimeStamp 
                variant="caption"
                sx={{
                  fontSize: { xs: '10px', sm: '11px', md: '12px' },
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  color: 'var(--text-secondary)',
                  textAlign: 'center'
                }}
              >
                {formatCustomTime(lastSeen)}
              </TimeStamp>

              {/* Avatar do usuário no meio */}
              <Box
                title={`Responsável: ${userName || 'Usuário'}`}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    transition: 'transform 0.2s ease'
                  }
                }}
              >
                <Avatar 
                  src={userAvatar ? `${(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080').replace(/"/g, '')}/public/company${currentUser?.companyId}/${userAvatar}` : null}
                  alt={userName || 'Usuário'} 
                  size="sm" 
                  fallbackText={userName ? userName.charAt(0).toUpperCase() : 'U'}
                />
              </Box>

              {/* Badge "Geral" e ícone de Pin */}
              {ticket && ticket.status === 'open' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '5px' }}>
                  {/* Ícone de Pin quando fixada - lado esquerdo */}
                  {isPinned && (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '14px',
                      height: '14px',
                    }}>
                      <img 
                        src={thumbtacksIcon} 
                        alt="Fixada" 
                        style={{ 
                          width: '12px', 
                          height: '12px', 
                          filter: 'grayscale(1) brightness(0.6)' // cinza
                        }} 
                      />
                    </Box>
                  )}
                  
                  <ConversationDropdown
                    triggerText="Geral"
                    triggerColor="success"
                    triggerSize="xs"
                    align="end"
                    onFinalizarConversa={handleFinalizarConversa}
                    onTransferirConversa={handleTransferirConversa}
                    onMarcarNaoLido={handleMarcarNaoLido}
                    onAdicionarEtiqueta={() => console.log('Adicionar Etiqueta')}
                    onSilenciarNotificacoes={() => console.log('Silenciar Notificações')}
                    onFixarConversa={onPinConversation}
                    isPinned={isPinned}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <TimeStamp 
              variant="caption"
              sx={{
                fontSize: { xs: '10px', sm: '11px', md: '12px' },
                lineHeight: 1,
                whiteSpace: 'nowrap',
                color: 'var(--text-secondary)',
                marginRight: '5px'
              }}
            >
              {formatCustomTime(lastSeen)}
            </TimeStamp>
          )}
          
          {/* Check de lida se não tiver avatar */}
          {!(userAvatar || userName) && unreadCount === 0 && (
            <UnreadBadge unreadCount={0}>
              <CheckIcon style={{ width: '12px', height: '12px' }} />
            </UnreadBadge>
          )}
        </ContactMeta>
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

      {/* Modal de transferência */}
      {transferModalOpen && (
        <TransferTicketModernModal
          modalOpen={transferModalOpen}
          onClose={handleCloseTransferModal}
          ticketid={ticket.id}
          ticket={ticket}
        />
      )}

      {/* Modal de resolução moderno */}
      <ResolverTicketModal
        isVisible={resolverModalOpen}
        onClose={() => setResolverModalOpen(false)}
        onResolverSemMensagem={handleFinalizarSemDespedida}
        onResolverComMensagem={handleConfirmFinalizarConversa}
        contactName={name}
      />

      {/* Modal de confirmação para finalizar */}
      <ConfirmationModal
        title={`Finalizar conversa #${ticket?.id}?`}
        open={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        onConfirm={handleConfirmFinalizarConversa}
        confirmText="Com despedida"
        cancelText="Sem despedida"
        onCancel={handleFinalizarSemDespedida}
      >
        Deseja finalizar esta conversa? Você pode escolher enviar ou não uma mensagem de despedida.
      </ConfirmationModal>
    </StyledContactItem>
  );
};

export default ContactList;