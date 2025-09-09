import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { X, Tags } from 'lucide-react';
import thumbtacksIcon from '../../../../assets/iconeswhatize/thumbtacks.svg';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/AvatarOptimized';
import ConversationDropdown from '../../../../components/ui/ConversationDropdown';
import { AuthContext } from '../../../../context/Auth/AuthContext';
import { TicketsContext } from '../../../../context/Tickets/TicketsContext';
import AcceptTicketWithoutQueueModal from '../../../../components/AcceptTicketWithoutQueueModal';
import TransferTicketModernModal from '../../../../components/TransferTicketModernModal';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import ResolverTicketModal from '../../../../components/ResolverTicketModal';
import TagSelector from '../../../../components/ui/TagSelector';
import StatusBadge from '../../../../components/StatusBadge';
import ModernModal from '../../../../components/ModernModal';
import TagForm from '../../../../components/TagForm';
import api from '../../../../services/api';
import toastError from '../../../../errors/toastError';
import { 
  Users, Headphones, MessageCircle, Phone, Mail, Clock, Settings,
  Star, Heart, Shield, Zap, Target, Award, CheckCircle, 
  AlertCircle, Info, HelpCircle, UserCheck, UserPlus
} from 'lucide-react';

// Função para renderizar ícone da fila (mesma lógica da página Queues)
const getIconComponent = (iconName) => {
  const iconMap = {
    Users, Headphones, MessageCircle, Phone, Mail, Clock, Settings,
    Star, Heart, Shield, Zap, Target, Award, CheckCircle, 
    AlertCircle, Info, HelpCircle, UserCheck, UserPlus
  };
  return iconMap[iconName] || Users;
};

// Função de formatação personalizada de tempo (igual ao ContactList)
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
    transform: 'scale(1.02)',
    transition: 'all 0.2s ease',
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
  opacity: unreadCount > 0 ? 1 : 0.6,
}));

// Componente para tooltip flutuante usando portal
const TooltipContainer = ({ ticket, tag, remainingCount }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setShowTooltip(true);
  };
  
  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const tooltipContent = showTooltip && ticket.contact.tags.length > 2 && (
    <Box
      sx={{
        position: 'fixed',
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: 'translate(-50%, -100%)',
        backgroundColor: '#f8f9fa',
        color: '#374151',
        padding: '8px',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--border-primary)',
        fontSize: '10px',
        zIndex: 10000,
        minWidth: '120px',
        pointerEvents: 'none',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          border: '4px solid transparent',
          borderTopColor: '#f8f9fa'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4px',
        alignItems: 'flex-start'
      }}>
        {ticket.contact.tags.slice(1).map((tagItem) => (
          <Box key={tagItem.id} sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: tagItem.color ? `${tagItem.color}20` : '#6366f120',
            color: tagItem.color || '#6366f1',
            fontSize: '8px',
            fontWeight: 600,
            height: '16px',
            px: '6px',
            borderRadius: '4px',
            maxWidth: '120px',
            overflow: 'hidden'
          }}>
            <Tags size={8} style={{ color: tagItem.color || '#6366f1', flexShrink: 0 }} />
            <Box sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {tagItem.name}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{ position: 'relative' }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: tag.color ? `${tag.color}20` : '#8b5cf620',
        color: tag.color || '#8b5cf6',
        fontSize: '8px',
        fontWeight: 600,
        height: '16px',
        px: '6px',
        borderRadius: '4px',
        cursor: 'pointer',
        ...(tag.name.length > 30 && {
          maxWidth: '60px',
          overflow: 'hidden'
        })
      }}>
        <Tags size={8} style={{ color: tag.color || '#8b5cf6', flexShrink: 0 }} />
        <Box sx={{
          ...(tag.name.length > 30 && {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          })
        }}>
          {ticket.contact.tags.length === 2 
            ? tag.name 
            : `${tag.name} +${remainingCount}`
          }
        </Box>
      </Box>
      
      {/* Renderizar tooltip usando portal */}
      {tooltipContent && ReactDOM.createPortal(tooltipContent, document.body)}
    </Box>
  );
};

const TicketCard = ({ 
  ticket, 
  selectedChatId, 
  openChat, 
  currentTab, 
  onRefresh, 
  onAccept,
  isPinned,
  onPin 
}) => {
  
  const { user: currentUser } = useContext(AuthContext);
  const { setCurrentTicket } = useContext(TicketsContext);
  
  // Estados dos modais
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResolverModal, setShowResolverModal] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [tagAnchorEl, setTagAnchorEl] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTicketTags, setSelectedTicketTags] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  
  const isSelected = selectedChatId === ticket.id;
  
  // Dados do contato e ticket
  const contact = ticket.contact;
  const unreadCount = ticket.unreadMessages || 0;
  const lastSeen = ticket.updatedAt;
  const lastMessage = ticket.lastMessage || 'Nova conversa';
  const userAvatar = ticket.user?.profileImage || null;
  const userName = ticket.user?.name || null;

  // Debug - vamos ver os dados do usuário E DA FILA
  console.log('TicketCard Debug:', {
    ticketId: ticket.id,
    user: ticket.user,
    userAvatar,
    userName,
    hasUser: !!(userAvatar || userName),
    // DADOS DA FILA - vamos ver se está chegando
    queue: ticket.queue,
    queueId: ticket.queueId,
    queueIcon: ticket.queue?.icon,
    queueName: ticket.queue?.name,
    queueColor: ticket.queue?.color,
    fullImageUrl: userAvatar ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000'}/public/company${currentUser?.companyId}/${userAvatar}` : null
  });

  const handleClick = () => {
    const contactFromTicket = {
      id: ticket.id,
      name: contact?.name || 'Contato sem nome',
      avatar: contact?.profilePicUrl || contact?.urlPicture || null,
      status: ticket.status === 'open' ? 'online' : 'offline',
      lastMessage: lastMessage,
      lastSeen: lastSeen,
      unreadCount: unreadCount,
      isTyping: false,
      userAvatar: userAvatar,
      userName: userName
    };
    
    openChat(ticket.id, contactFromTicket, ticket);
  };

  // Handlers dos modais
  const handleFinalizarConversa = () => {
    console.log('handleFinalizarConversa chamado - abrindo modal resolver');
    setShowResolverModal(true);
  };

  const handleResolverComMensagem = async () => {
    try {
      console.log('Resolvendo conversa COM mensagem de despedida:', ticket.id);
      await api.put(`/tickets/${ticket.id}`, {
        status: 'closed',
        sendFarewellMessage: true
      });
      
      if (onRefresh) onRefresh();
      setShowResolverModal(false);
    } catch (err) {
      console.error('Erro ao resolver com mensagem:', err);
      toastError(err);
    }
  };

  const handleResolverSemMensagem = async () => {
    try {
      console.log('Resolvendo conversa SEM mensagem de despedida:', ticket.id);
      await api.put(`/tickets/${ticket.id}`, {
        status: 'closed',
        sendFarewellMessage: false
      });
      
      if (onRefresh) onRefresh();
      setShowResolverModal(false);
    } catch (err) {
      console.error('Erro ao resolver sem mensagem:', err);
      toastError(err);
    }
  };

  const handleTransferirConversa = () => {
    console.log('handleTransferirConversa chamado - abrindo modal transferir');
    setShowTransferModal(true);
  };

  const handleMarcarNaoLido = async () => {
    try {
      console.log('Marcando ticket como não lido:', ticket.id);
      console.log('Usuario antes:', { userAvatar, userName, userId: ticket.user?.id });
      
      // Apenas marcar como não lido, sem alterar outros campos
      await api.put(`/tickets/${ticket.id}`, {
        unreadMessages: (ticket.unreadMessages || 0) + 1
      });
      
      console.log('Chamando onRefresh...');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erro ao marcar como não lido:', err);
      toastError(err);
    }
  };

  const handleRemoverDaFila = async () => {
    try {
      console.log('Removendo ticket da fila:', ticket.id);
      setConfirmAction(() => async () => {
        await api.put(`/tickets/${ticket.id}`, {
          status: 'pending',
          userId: null,
          queueId: null
        });
        
        if (onRefresh) onRefresh();
        setShowConfirmModal(false);
      });
      setShowConfirmModal(true);
    } catch (err) {
      console.error('Erro ao remover da fila:', err);
      toastError(err);
    }
  };

  const handleAdicionarEtiqueta = async (e) => {
    console.log('handleAdicionarEtiqueta chamado - abrindo dropdown etiqueta');
    e.stopPropagation();
    
    // Buscar tags disponíveis (apenas tags normais, não kanban)
    try {
      const response = await api.get('/tags/list', {
        params: { kanban: 0 }
      });
      // A API já filtra por kanban=0, mas garantimos aqui também
      const normalTags = (response.data || []).filter(tag => tag.kanban === 0);
      setAvailableTags(normalTags);
      console.log('🏷️ Tags normais carregadas:', normalTags);
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      setAvailableTags([]);
    }
    
    // Buscar tags atuais do CONTATO no backend
    try {
      const contactResponse = await api.get(`/contacts/${ticket.contact.id}`);
      const currentContactTags = contactResponse.data.tags || [];
      setSelectedTicketTags(currentContactTags);
      console.log('🏷️ Tags atuais do CONTATO buscadas do backend:', currentContactTags);
    } catch (error) {
      console.error('Erro ao buscar tags do contato:', error);
      setSelectedTicketTags(ticket.contact?.tags || []);
    }
    
    setTagAnchorEl(e.currentTarget);
    setShowTagSelector(true);
  };

  const handleTagToggle = async (tag, isSelected) => {
    console.log('🏷️ handleTagToggle - INÍCIO:', {
      tagName: tag.name,
      tagId: tag.id,
      isSelected,
      contactId: ticket.contact.id,
      currentTags: selectedTicketTags
    });
    
    try {
      // Para tags normais, vamos atualizar a lista de tags do CONTATO
      const currentTags = selectedTicketTags || [];
      let updatedTags;
      
      if (isSelected) {
        // Remover tag da lista
        updatedTags = currentTags.filter(t => t.id !== tag.id);
        console.log('🗑️ REMOVENDO tag:', tag.name, 'Tags restantes:', updatedTags);
      } else {
        // Adicionar tag à lista
        updatedTags = [...currentTags, tag];
        console.log('➕ ADICIONANDO tag:', tag.name, 'Tags atualizadas:', updatedTags);
      }
      
      // Usar a mesma lógica do drawer antigo com /tags/sync
      console.log('🌐 Fazendo requisição POST /tags/sync');
      await api.post(`/tags/sync`, {
        contactId: ticket.contact.id,
        tags: updatedTags
      });
      
      console.log('✅ Requisição concluída com sucesso!');
      
      // Atualizar o contato local e modal com as tags atualizadas
      if (ticket.contact) {
        ticket.contact.tags = updatedTags;
      }
      setSelectedTicketTags(updatedTags);
      console.log('🔄 Contato e modal atualizados com tags:', updatedTags);
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('❌ Erro ao atualizar tag do contato:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);
      toastError(error);
    }
  };

  const handleCreateTag = async (tagName, color) => {
    try {
      const response = await api.post('/tags', {
        name: tagName,
        color: color,
        kanban: 0  // Criar como tag normal
      });
      
      const newTag = response.data;
      setAvailableTags(prev => [...prev, newTag]);
      
      // Associar automaticamente ao CONTATO usando a mesma lógica de handleTagToggle
      const currentTags = selectedTicketTags || [];
      const updatedTags = [...currentTags, newTag];
      
      await api.put(`/contacts/${ticket.contact.id}`, {
        tags: updatedTags.map(t => t.id)
      });
      
      // Atualizar estado local
      setSelectedTicketTags(updatedTags);
      if (ticket.contact) {
        ticket.contact.tags = updatedTags;
      }
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      toastError(error);
    }
  };

  const handleOpenCreateTagModal = () => {
    console.log('🏷️ Abrindo modal de criar nova tag...');
    // Fechar o TagSelector primeiro
    setShowTagSelector(false);
    setTagAnchorEl(null);
    // Depois abrir o modal
    setTimeout(() => {
      setShowCreateTagModal(true);
    }, 100);
  };

  const handleCloseCreateTagModal = () => {
    setShowCreateTagModal(false);
  };

  const handleSaveNewTag = async (newTag) => {
    console.log('Nova tag salva pelo TagForm:', newTag);
    
    try {
      // Adicionar à lista de tags disponíveis
      setAvailableTags(prev => [...prev, newTag]);
      
      // Recarregar as tags para garantir que estão atualizadas
      const response = await api.get('/tags/list', {
        params: { kanban: 0 }
      });
      const normalTags = (response.data || []).filter(tag => tag.kanban === 0);
      setAvailableTags(normalTags);
      
      console.log('Tags atualizadas após criação:', normalTags);
      
    } catch (error) {
      console.error('Erro ao atualizar lista de tags:', error);
    }
    
    // Fechar modal
    setShowCreateTagModal(false);
    
    // Atualizar RefreshContext se necessário
    if (onRefresh) {
      setTimeout(() => onRefresh(), 100);
    }
  };

  const handleSilenciarNotificacoes = () => {
    console.log('handleSilenciarNotificacoes chamado');
    // TODO: Implementar silenciar notificações
  };

  const handleAceitarConversa = async (queueId) => {
    try {
      console.log('Aceitando conversa:', ticket.id, 'queueId:', queueId);
      await api.put(`/tickets/${ticket.id}`, {
        status: 'open',
        userId: currentUser.id,
        queueId: queueId
      });
      
      if (onRefresh) onRefresh();
      if (onAccept) onAccept(ticket.id, queueId);
      
    } catch (err) {
      console.error('Erro ao aceitar conversa:', err);
      toastError(err);
    }
  };

  return (
    <>
      <StyledContactItem isSelected={isSelected} onClick={handleClick}>
        {/* Avatar do contato com badge de não lidas */}
        <Box sx={{ position: 'relative', mb: '24px', ml: '-4px' }}>
          <Avatar 
            src={contact?.profilePicUrl || contact?.urlPicture}
            alt={contact?.name || 'Contato'} 
            size="xl"
            fallbackText={contact?.name ? contact.name.charAt(0).toUpperCase() : '?'}
          />
          
          {/* Badge de não lidas no avatar do contato */}
          {unreadCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 1
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Box>
          )}
        </Box>

        {/* Informações do contato */}
        <ContactInfo sx={{ mb: '24px' }}>
          <ContactName>
            {contact?.name || 'Contato sem nome'}
          </ContactName>
          
          <LastMessage>
            {lastMessage}
          </LastMessage>

        </ContactInfo>

        {/* Container horizontal: Tags + Fila do contato - alinhado com botão Geral */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          flexWrap: 'wrap',
          position: 'absolute',
          bottom: '14px',
          left: '4px',
          right: '80px'
        }}>
          {/* Tags do contato primeiro */}
          {ticket.contact?.tags && ticket.contact.tags.length > 0 && (
            <>
              {/* Primeira tag */}
              {ticket.contact.tags[0] && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: ticket.contact.tags[0].color ? `${ticket.contact.tags[0].color}20` : '#6366f120',
                  color: ticket.contact.tags[0].color || '#6366f1',
                  fontSize: '8px',
                  fontWeight: 600,
                  height: '16px',
                  px: '6px',
                  borderRadius: '4px',
                  ...(ticket.contact.tags[0].name.length > 30 && {
                    maxWidth: '60px',
                    overflow: 'hidden'
                  })
                }}>
                  <Tags size={8} style={{ color: ticket.contact.tags[0].color || '#6366f1', flexShrink: 0 }} />
                  <Box sx={{
                    ...(ticket.contact.tags[0].name.length > 30 && {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    })
                  }}>
                    {ticket.contact.tags[0].name}
                  </Box>
                </Box>
              )}
              
              {/* Segunda tag com tooltip das demais */}
              {ticket.contact.tags.length > 1 && (
                <TooltipContainer 
                  ticket={ticket}
                  tag={ticket.contact.tags[1]}
                  remainingCount={ticket.contact.tags.length - 2}
                />
              )}
            </>
          )}

          {/* Quadradinho da fila por último */}
          {ticket.queue && (
            <Box 
              title={`Fila: ${ticket.queue.name}`}
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '3px',
                backgroundColor: ticket.queue.color ? `${ticket.queue.color}20` : '#00BCD420',
                border: `1px solid ${ticket.queue.color || '#00BCD4'}40`,
                cursor: 'default',
                color: ticket.queue.color || '#00BCD4',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: ticket.queue.color ? `${ticket.queue.color}35` : '#00BCD435',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              {React.createElement(getIconComponent(ticket.queue.icon), { size: 8 })}
            </Box>
          )}
        </Box>
        
        {/* Coluna direita: Data/Horário, Avatar, Badge */}
        {(userAvatar || userName || ticket.status === 'open') ? (
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
              title={`Responsável: ${userName || ticket.user?.name || 'Usuário'}`}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.1)',
                  transition: 'transform 0.2s ease'
                }
              }}
            >
              <Avatar 
                src={userAvatar ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000'}/public/company${currentUser?.companyId}/${userAvatar}` : ticket.user?.profileImage ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000'}/public/company${currentUser?.companyId}/${ticket.user.profileImage}` : null}
                alt={userName || ticket.user?.name || 'Usuário'} 
                size="sm" 
                fallbackText={(userName || ticket.user?.name) ? (userName || ticket.user?.name).charAt(0).toUpperCase() : 'U'}
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
                
                <Box
                  sx={{
                    '&:hover': {
                      transform: 'scale(1.1)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  <ConversationDropdown
                    triggerText="✓"
                    triggerColor="success"
                    triggerSize="xs"
                    align="end"
                    onFinalizarConversa={handleFinalizarConversa}
                    onTransferirConversa={handleTransferirConversa}
                    onMarcarNaoLido={handleMarcarNaoLido}
                    onAdicionarEtiqueta={handleAdicionarEtiqueta}
                    onSilenciarNotificacoes={handleSilenciarNotificacoes}
                    onFixarConversa={onPin}
                    isPinned={isPinned}
                  />
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          /* Layout quando não tem usuário responsável */
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 0.5,
            ml: 1
          }}>
            <TimeStamp>
              {formatCustomTime(lastSeen)}
            </TimeStamp>
            
            {ticket.status === 'pending' && (
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentUser?.queues?.length === 1) {
                    handleAceitarConversa(currentUser.queues[0].id);
                  } else {
                    setShowAcceptModal(true);
                  }
                }}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'var(--color-green-hover)',
                  }
                }}
              >
                Aceitar
              </Box>
            )}
            
            {unreadCount > 0 && (
              <UnreadBadge unreadCount={unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </UnreadBadge>
            )}
          </Box>
        )}
      </StyledContactItem>

      {/* Modais */}
      <AcceptTicketWithoutQueueModal
        modalOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        ticketId={ticket.id}
        onAccept={handleAceitarConversa}
      />
      
      <TransferTicketModernModal
        modalOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        ticketid={ticket.id}
        ticket={ticket}
        onTransfer={onRefresh}
      />
      
      <ResolverTicketModal
        isVisible={showResolverModal}
        onClose={() => setShowResolverModal(false)}
        onResolverComMensagem={handleResolverComMensagem}
        onResolverSemMensagem={handleResolverSemMensagem}
        contactName={contact?.name || 'Contato'}
      />
      
      <ConfirmationModal
        title="Confirmar Ação"
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
      >
        Tem certeza que deseja remover este ticket da fila?
      </ConfirmationModal>
      
      {showTagSelector && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1200,
          }}
        >
          <TagSelector
            isOpen={true}
            onClose={() => setShowTagSelector(false)}
            availableTags={availableTags}
            selectedTags={selectedTicketTags}
            onTagToggle={handleTagToggle}
            onCreateTag={handleOpenCreateTagModal}
            entityType="Conversa"
          />
        </Box>
      )}
      
      {showTagSelector && (
        <Box
          onClick={() => setShowTagSelector(false)}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1199,
          }}
        />
      )}
      
      {/* Modal de criar nova tag */}
      {console.log('🏷️ Estado showCreateTagModal:', showCreateTagModal)}
      <Dialog
        open={showCreateTagModal}
        onClose={handleCloseCreateTagModal}
        maxWidth="sm"
        fullWidth
        sx={{ 
          zIndex: 15000,
          '& .MuiDialog-paper': {
            borderRadius: '12px',
            padding: '8px'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" component="div">
            Criar Nova Tag
          </Typography>
          <IconButton 
            onClick={handleCloseCreateTagModal}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TagForm
            kanban={0}
            onSave={handleSaveNewTag}
            onCancel={handleCloseCreateTagModal}
            hideButtons={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TicketCard;