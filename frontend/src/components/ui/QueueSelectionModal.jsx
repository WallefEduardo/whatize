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

const QueueSelectionModal = ({ isOpen, contacts, onClose, onCreateAndOpen }) => {
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
    console.log('👥 QueueSelectionModal - contacts:', contacts);
    if (isOpen) {
      console.log('📤 QueueSelectionModal - Carregando filas e conexões...');
      fetchQueues();
      fetchWhatsapps();
    }
  }, [isOpen, fetchQueues, fetchWhatsapps, contacts]);

  // Reset ao fechar
  const handleClose = () => {
    setSelectedQueue(null);
    setSelectedWhatsapp(null);
    onClose();
  };

  // Criar conversas para todos os contatos e abrir a primeira
  const handleCreateConversation = async () => {
    if (!contacts || contacts.length === 0 || !selectedQueue || !selectedWhatsapp) return;

    try {
      setLoading(true);
      
      console.log('🎯 Criando conversas para múltiplos contatos...');
      console.log('👥 Contatos:', contacts.length);
      console.log('📋 Dados base:', {
        queueId: selectedQueue.id,
        whatsappId: selectedWhatsapp.id,
        userId: user.id
      });
      
      // Criar tickets para todos os contatos
      const ticketsData = contacts.map(contact => ({
        contactId: contact.id,
        queueId: selectedQueue.id,
        whatsappId: selectedWhatsapp.id,
        userId: user.id,
        status: "open"
      }));

      // Chamar callback para criação de múltiplos tickets
      await onCreateAndOpen(ticketsData, contacts[0]); // Passar o primeiro contato para redirecionamento
      
    } catch (error) {
      console.error('❌ Erro ao criar conversas:', error);
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
            {/* Contatos selecionados */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'var(--text-primary)' }}>
                {contacts?.length === 1 ? 'Novo Ticket para' : `Novos Tickets para ${contacts?.length || 0} contatos`}
              </Typography>
              
              {/* Lista de contatos */}
              <Box sx={{ 
                maxHeight: contacts?.length > 3 ? '200px' : 'auto',
                overflowY: contacts?.length > 3 ? 'auto' : 'visible',
                border: '2px solid var(--color-accent)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'var(--border-primary)',
                  borderRadius: '3px',
                },
              }}>
                {contacts?.map((contact, index) => (
                  <Box 
                    key={contact.id}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 2,
                      borderBottom: index < contacts.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    }}
                  >
                    <Box sx={{ mr: 2 }}>
                      <Avatar
                        src={contact?.urlPicture}
                        alt={contact?.name || contact?.number}
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: '#E5F3E5',
                          color: 'var(--color-accent)',
                          fontWeight: 600,
                          fontSize: '12px'
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
                ))}
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
                {contacts?.length === 1 
                  ? 'Este contato não possui conversa ativa. Selecione uma fila para criar um novo ticket.'
                  : `Estes ${contacts?.length || 0} contatos não possuem conversa ativa. Selecione uma fila para criar novos tickets.`
                }
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
            disabled={!contacts || contacts.length === 0 || !selectedQueue || !selectedWhatsapp || loading}
            loading={loading}
            loadingText={contacts?.length === 1 ? "Criando conversa..." : `Criando ${contacts?.length || 0} conversas...`}
            icon={<MessageCircle size={18} />}
            variant="primary"
            size="medium"
            sx={{ width: '100%' }}
          >
            {contacts?.length === 1 ? 'Criar Conversa e Abrir' : `Criar ${contacts?.length || 0} Conversas e Abrir`}
          </GradientButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default QueueSelectionModal;