import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Box, Typography, IconButton, Tooltip, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../../utils/cn';

// Nossos componentes UI
import { Avatar } from '../../../../components/ui/AvatarOptimized';
import Badge from '../../../../components/ui/Badge';

// Icons
import {
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  HandRaisedIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// Context e API
import { AuthContext } from '../../../../context/Auth/AuthContext';
import api from '../../../../services/api';
import { toast } from '../../../../components/ui/ToastProvider';
import toastError from '../../../../errors/toastError';

// Modal para aceitar ticket
import AcceptTicketWithoutQueueModal from '../../../../components/AcceptTicketWithoutQueueModal';

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
  minHeight: '72px',
}));

const ContactInfo = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
  minWidth: 0,
}));

const ContactDetails = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  gap: '2px',
}));

const ContactName = styled(Typography)(() => ({
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ContactStatus = styled(Typography)(() => ({
  fontSize: '13px',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ActionButtons = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}));

const AcceptButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'var(--color-accent)', // #00C307
  color: 'white',
  padding: '8px 16px',
  borderRadius: '4px !important',
  marginRight: '12px',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'none',
  gap: '8px',
  minWidth: 'auto',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#00A005', // Versão mais escura do #00C307
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  '&:disabled': {
    backgroundColor: 'var(--color-accent)',
    opacity: 0.6,
    transform: 'none',
  }
}));

const ChatModernoHeader = ({
  contact,
  ticket,
  showInfo,
  handleShowInfo,
  profile,
  mobileMenuHandler,
  onSearch,
  onRefresh
}) => {
  const { user: currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [acceptTicketModalOpen, setAcceptTicketModalOpen] = useState(false);

  // CORREÇÃO: Derivar estado diretamente do ticket usando useMemo (mais estável)
  // Evita problemas de timing e dependências circulares do useEffect anterior
  const shouldShowButton = useMemo(() => {
    return Boolean(ticket && ticket.status === 'pending');
  }, [ticket?.id, ticket?.status]);

  // 🚀 FUNÇÃO PARA ACEITAR TICKET (Baseada no chat antigo)
  const handleAcceptTicket = async () => {
    if (!ticket) return;

    try {
      setLoading(true);

      // Se o ticket não tem fila definida, abrir modal para seleção
      if (!ticket.queueId) {
        setAcceptTicketModalOpen(true);
        setLoading(false);
        return;
      }

      // Aceitar ticket diretamente (tem fila definida)
      await api.put(`/tickets/${ticket.id}`, {
        status: 'open',
        userId: currentUser?.id
      });

      toast.success('Ticket aceito com sucesso!');

      // Refresh da lista de tickets
      if (onRefresh) {
        onRefresh();
      }

    } catch (err) {
      console.error('❌ Erro ao aceitar ticket:', err);
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  // Modal foi fechado após aceitar ticket
  const handleModalClose = (accepted = false) => {
    setAcceptTicketModalOpen(false);
    if (accepted && onRefresh) {
      onRefresh();
    }
  };


  return (
    <>
      <HeaderContainer>
        {/* Mobile Menu Button */}
        <IconButton
          onClick={mobileMenuHandler}
          sx={{
            display: { xs: 'flex', md: 'none' },
            mr: 2,
            color: 'var(--text-secondary)'
          }}
        >
          <Bars3Icon style={{ width: '20px', height: '20px' }} />
        </IconButton>

        {/* Contact Information */}
        <ContactInfo>
          <Avatar
            src={contact?.avatar}
            alt={contact?.name || 'Contato'}
            size="md"
            fallbackText={contact?.name ? contact.name.charAt(0).toUpperCase() : '?'}
          />
          <ContactDetails>
            <ContactName>
              {contact?.name || 'Selecione uma conversa'}
            </ContactName>
            <ContactStatus>
              Offline
            </ContactStatus>
          </ContactDetails>
        </ContactInfo>

        {/* Action Buttons */}
        <ActionButtons>
          {/* 🚀 BOTÃO ACEITAR - Só aparece quando ticket está pending */}
          {shouldShowButton && (
            <Tooltip title="Aceitar conversa" placement="bottom">
              <AcceptButton
                onClick={handleAcceptTicket}
                disabled={loading}
                startIcon={<CheckCircleIcon style={{ width: '18px', height: '18px' }} />}
              >
                Aceitar
              </AcceptButton>
            </Tooltip>
          )}

          {/* Botões existentes - só aparecem quando ticket NÃO está pending */}
          {ticket?.status !== 'pending' && (
            <>
              <Tooltip title="Buscar mensagens" placement="bottom">
                <IconButton
                  onClick={onSearch}
                  sx={{ color: 'var(--text-secondary)' }}
                >
                  <MagnifyingGlassIcon style={{ width: '20px', height: '20px' }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Fazer chamada" placement="bottom">
                <IconButton sx={{ color: 'var(--text-secondary)' }}>
                  <PhoneIcon style={{ width: '20px', height: '20px' }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Chamada de vídeo" placement="bottom">
                <IconButton sx={{ color: 'var(--text-secondary)' }}>
                  <VideoCameraIcon style={{ width: '20px', height: '20px' }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Informações do contato" placement="bottom">
                <IconButton
                  onClick={handleShowInfo}
                  sx={{
                    color: showInfo ? 'var(--color-primary)' : 'var(--text-secondary)',
                    backgroundColor: showInfo ? 'var(--color-primary-light)' : 'transparent'
                  }}
                >
                  <InformationCircleIcon style={{ width: '20px', height: '20px' }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </ActionButtons>
      </HeaderContainer>

      {/* Modal para aceitar ticket sem fila */}
      {acceptTicketModalOpen && (
        <AcceptTicketWithoutQueueModal
          modalOpen={acceptTicketModalOpen}
          onClose={handleModalClose}
          ticketId={ticket?.id}
          ticket={ticket}
        />
      )}
    </>
  );
};

export default ChatModernoHeader;