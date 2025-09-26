import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Box, Typography, IconButton, Tooltip, Button, Menu, MenuItem } from '@mui/material';
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
  CheckIcon,
  CheckCircleIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

// Context e API
import { AuthContext } from '../../../../context/Auth/AuthContext';
import api from '../../../../services/api';
import { toast } from '../../../../components/ui/ToastProvider';
import toastError from '../../../../errors/toastError';

// Modal para aceitar ticket
import AcceptTicketWithoutQueueModal from '../../../../components/AcceptTicketWithoutQueueModal';
// Modal para transferir ticket
import TransferTicketModernModal from '../../../../components/TransferTicketModernModal';
// Modais para dropdown
import ShowTicketLogModal from '../../../../components/ShowTicketLogModal';
import TicketMessagesDialog from '../../../../components/TicketMessagesDialog';
import ConfirmationModal from '../../../../components/ConfirmationModal';

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
  onRefresh,
  onResolveTicket
}) => {
  const { user: currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [acceptTicketModalOpen, setAcceptTicketModalOpen] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Estados do dropdown de três pontinhos
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [showTicketLogOpen, setShowTicketLogOpen] = useState(false);
  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const [disableBot, setDisableBot] = useState(ticket?.contact?.disableBot || false);
  const [enableIntegration, setEnableIntegration] = useState(ticket?.useIntegration || false);

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

  // 🔄 FUNÇÃO PARA DEVOLVER TICKET PARA A FILA (Baseada na handleAcceptTicket)
  const handleReturnToQueue = async () => {
    if (!ticket) return;

    try {
      setLoading(true);

      // Devolver ticket para fila (status: pending, userId: null)
      await api.put(`/tickets/${ticket.id}`, {
        status: 'pending',
        userId: null
      });

      toast.success('Ticket devolvido para a fila com sucesso!');

      // Refresh da lista de tickets
      if (onRefresh) {
        onRefresh();
      }

    } catch (err) {
      console.error('❌ Erro ao devolver ticket para fila:', err);
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔀 FUNÇÃO PARA ABRIR MODAL DE TRANSFERIR (Baseada no TicketCard)
  const handleTransferTicket = () => {
    setShowTransferModal(true);
  };

  // Função para fechar modal de transferir e refresh se necessário
  const handleTransferModalClose = (transferred = false) => {
    setShowTransferModal(false);
    if (transferred && onRefresh) {
      onRefresh();
    }
  };

  // 🔻 FUNÇÕES DO DROPDOWN DE TRÊS PONTINHOS (Baseadas no TicketActionButtonsCustom)
  const handleMenu = event => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenConfirmationModal = (e) => {
    setConfirmationOpen(true);
    handleCloseMenu();
  };

  const handleExportPDF = async () => {
    setOpenTicketMessageDialog(true);
    handleCloseMenu();
  };

  const handleEnableIntegration = async () => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        useIntegration: !enableIntegration
      });
      setEnableIntegration(!enableIntegration);
      toast.success(`Integração ${!enableIntegration ? 'habilitada' : 'desabilitada'} com sucesso!`);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
    handleCloseMenu();
  };

  const handleShowLogTicket = async () => {
    setShowTicketLogOpen(true);
    handleCloseMenu();
  };

  const handleContactToggleDisableBot = async () => {
    if (!ticket?.contact?.id) return;

    try {
      const { data } = await api.put(`/contacts/toggleDisableBot/${ticket.contact.id}`);
      setDisableBot(data.disableBot);
      toast.success(`Chatbot ${data.disableBot ? 'desabilitado' : 'habilitado'} com sucesso!`);
    } catch (err) {
      toastError(err);
    }
    handleCloseMenu();
  };

  const handleDeleteTicket = async () => {
    try {
      await api.delete(`/tickets/${ticket.id}`);
      toast.success('Ticket deletado com sucesso!');
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      toastError(err);
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
          <Box
            onClick={handleShowInfo}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Avatar
              src={contact?.avatar}
              alt={contact?.name || 'Contato'}
              size="md"
              fallbackText={contact?.name ? contact.name.charAt(0).toUpperCase() : '?'}
            />
          </Box>
          <ContactDetails>
            <ContactName
              onClick={handleShowInfo}
              sx={{ cursor: 'pointer' }}
            >
              {contact?.name || 'Selecione uma conversa'}
            </ContactName>
            <Tooltip title="Número do Ticket" placement="bottom">
              <ContactStatus>
                #{ticket?.id || 'Ticket'}
              </ContactStatus>
            </Tooltip>
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
              <Tooltip title="Resolver conversa" placement="bottom">
                <IconButton
                  onClick={onResolveTicket}
                  sx={{ color: 'var(--text-secondary)' }}
                >
                  <CheckCircleIcon style={{ width: '20px', height: '20px' }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Devolver para fila" placement="bottom">
                <IconButton
                  onClick={handleReturnToQueue}
                  disabled={loading}
                  sx={{ color: 'var(--text-secondary)' }}
                >
                  <ArrowUturnLeftIcon style={{ width: '20px', height: '20px' }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Transferir conversa" placement="bottom">
                <IconButton
                  onClick={handleTransferTicket}
                  sx={{ color: 'var(--text-secondary)' }}
                >
                  <ArrowsRightLeftIcon style={{ width: '20px', height: '20px' }} />
                </IconButton>
              </Tooltip>

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

              <Tooltip title="Mais opções" placement="bottom">
                <IconButton
                  onClick={handleMenu}
                  sx={{ color: 'var(--text-secondary)' }}
                >
                  <EllipsisVerticalIcon style={{ width: '20px', height: '20px' }} />
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

      {/* Modal para transferir ticket */}
      {showTransferModal && (
        <TransferTicketModernModal
          modalOpen={showTransferModal}
          onClose={handleTransferModalClose}
          ticketid={ticket?.id}
          ticket={ticket}
        />
      )}

      {/* Dropdown de três pontinhos */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={menuOpen}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleContactToggleDisableBot}>
          {disableBot ? 'Habilitar chatbot' : 'Desabilitar chatbot'}
        </MenuItem>
        <MenuItem onClick={handleShowLogTicket}>
          Logs do Ticket
        </MenuItem>
        <MenuItem onClick={handleEnableIntegration}>
          {enableIntegration ? 'Desabilitar integração' : 'Habilitar integração'}
        </MenuItem>
        <MenuItem onClick={handleExportPDF}>
          Exportar em PDF
        </MenuItem>
        <MenuItem onClick={handleOpenConfirmationModal}>
          Deletar Ticket
        </MenuItem>
      </Menu>

      {/* Modal de confirmação para deletar ticket */}
      {confirmationOpen && (
        <ConfirmationModal
          title={`Deletar ticket #${ticket?.id}?`}
          open={confirmationOpen}
          onClose={() => setConfirmationOpen(false)}
          onConfirm={handleDeleteTicket}
        >
          Esta ação não pode ser desfeita. Tem certeza que deseja deletar este ticket?
        </ConfirmationModal>
      )}

      {/* Modal para mostrar logs do ticket */}
      {showTicketLogOpen && (
        <ShowTicketLogModal
          isOpen={showTicketLogOpen}
          handleClose={() => setShowTicketLogOpen(false)}
          ticketId={ticket?.id}
        />
      )}

      {/* Modal para exportar mensagens em PDF */}
      {openTicketMessageDialog && (
        <TicketMessagesDialog
          open={openTicketMessageDialog}
          handleClose={() => setOpenTicketMessageDialog(false)}
          ticketId={ticket?.id}
        />
      )}
    </>
  );
};

export default ChatModernoHeader;