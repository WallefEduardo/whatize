import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../../context/Auth/AuthContext';
import api from '../../services/api';
import toastError from '../../errors/toastError';
import SimpleSelect from './SimpleSelect';
import GradientButton from '../GradientButton';

// Container principal do modal
const ModalOverlay = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ isOpen }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 999999,
  opacity: isOpen ? 1 : 0,
  visibility: isOpen ? 'visible' : 'hidden',
  transition: 'all 0.3s ease',
}));

// Modal que desliza da esquerda
const ModalContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ isOpen }) => ({
  position: 'absolute',
  top: '64px',
  left: 0,
  width: '420px',
  height: 'calc(100% - 64px)',
  backgroundColor: '#fff',
  boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
  transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}));

// Header do modal
const ModalHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px',
  borderBottom: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
}));

// Conteúdo do modal
const ModalContent = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

// Footer do modal
const ModalFooter = styled(Box)(() => ({
  padding: '20px 24px',
  borderTop: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
}));

const QueueSelectionModal = ({ isOpen, contact, onClose, onCreateAndOpen }) => {
  const { user } = useContext(AuthContext);
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [queues, setQueues] = useState([]);
  const [whatsapps, setWhatsapps] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState(null);

  // Buscar filas do usuário
  const fetchQueues = useCallback(async () => {
    try {
      const { data } = await api.get('/queue');
      const userQueues = user?.queues || [];
      const availableQueues = data.filter(queue => 
        userQueues.some(uq => uq.id === queue.id)
      );
      setQueues(availableQueues);
      
      // Selecionar primeira fila por padrão
      if (availableQueues.length > 0) {
        setSelectedQueue(availableQueues[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar filas:', error);
      toastError(error);
    }
  }, [user]);

  // Buscar conexões WhatsApp
  const fetchWhatsapps = useCallback(async () => {
    try {
      const { data } = await api.get('/whatsapp');
      const activeWhatsapps = data.filter(w => w.status === 'CONNECTED');
      setWhatsapps(activeWhatsapps);
      
      // Selecionar primeira conexão por padrão
      if (activeWhatsapps.length > 0) {
        setSelectedWhatsapp(activeWhatsapps[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar conexões:', error);
      toastError(error);
    }
  }, []);

  // Carregar dados quando abrir o modal
  useEffect(() => {
    console.log('🎯 QueueSelectionModal - isOpen mudou para:', isOpen);
    console.log('👤 QueueSelectionModal - contact:', contact);
    if (isOpen) {
      console.log('📤 QueueSelectionModal - Carregando filas e conexões...');
      fetchQueues();
      fetchWhatsapps();
    }
  }, [isOpen, fetchQueues, fetchWhatsapps]);

  // Reset ao fechar
  const handleClose = () => {
    setSelectedQueue(null);
    setSelectedWhatsapp(null);
    onClose();
  };

  // Criar conversa e abrir
  const handleCreateConversation = async () => {
    if (!contact || !selectedQueue || !selectedWhatsapp) return;

    try {
      setLoading(true);
      
      console.log('🎯 Criando nova conversa para contato encaminhado...');
      console.log('📋 Dados:', {
        contactId: contact.id,
        queueId: selectedQueue.id,
        whatsappId: selectedWhatsapp.id,
        userId: user.id
      });
      
      const ticketData = {
        contactId: contact.id,
        queueId: selectedQueue.id,
        whatsappId: selectedWhatsapp.id,
        userId: user.id,
        status: "open"
      };

      // Chamar callback para criação e abertura
      await onCreateAndOpen(ticketData);
      
    } catch (error) {
      console.error('❌ Erro ao criar conversa:', error);
      toastError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleClose}>
      <ModalContainer 
        isOpen={isOpen} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <ModalHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              onClick={handleClose}
              sx={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <ArrowLeft size={20} color="var(--text-primary)" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Criar Conversa
            </Typography>
          </Box>
        </ModalHeader>

        {/* Conteúdo */}
        <ModalContent>
          <Box sx={{ p: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Contato selecionado */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'var(--text-primary)' }}>
                Novo Ticket para
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2, 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px',
                border: '2px solid var(--color-accent)',
              }}>
                <Box sx={{ mr: 2 }}>
                  <Avatar
                    src={contact?.urlPicture}
                    alt={contact?.name || contact?.number}
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: '#E5F3E5',
                      color: 'var(--color-accent)',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    {!contact?.urlPicture && (contact?.name || contact?.number)?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {contact?.name || contact?.number}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                    {contact?.number}
                  </Typography>
                </Box>
              </Box>
              
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'var(--text-secondary)', 
                  display: 'block', 
                  mt: 1, 
                  fontStyle: 'italic' 
                }}
              >
                Este contato não possui conversa ativa. Selecione uma fila para criar um novo ticket.
              </Typography>
            </Box>

            {/* Selecionar fila */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'var(--text-primary)' }}>
                Selecionar Fila
              </Typography>
              <SimpleSelect
                options={queues}
                value={selectedQueue?.id || ''}
                onChange={(queueId, queue) => setSelectedQueue(queue)}
                placeholder="Escolha uma fila..."
                displayKey="name"
                valueKey="id"
                size="md"
              />
            </Box>

            {/* Selecionar conexão */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'var(--text-primary)' }}>
                Selecionar Conexão
              </Typography>
              <SimpleSelect
                options={whatsapps}
                value={selectedWhatsapp?.id || ''}
                onChange={(whatsappId, whatsapp) => setSelectedWhatsapp(whatsapp)}
                placeholder="Escolha uma conexão..."
                displayKey="name"
                valueKey="id"
                size="md"
              />
            </Box>
          </Box>
        </ModalContent>

        {/* Footer */}
        <ModalFooter>
          <GradientButton
            onClick={handleCreateConversation}
            disabled={!contact || !selectedQueue || !selectedWhatsapp || loading}
            loading={loading}
            loadingText="Criando conversa..."
            icon={<MessageCircle size={18} />}
            variant="primary"
            size="medium"
            sx={{ width: '100%' }}
          >
            Criar Conversa e Abrir
          </GradientButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default QueueSelectionModal;