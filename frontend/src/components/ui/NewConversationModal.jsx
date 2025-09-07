import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Box, TextField, Typography, Chip, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search, MessageCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../../context/Auth/AuthContext';
import { useHistory } from 'react-router-dom';
import api from '../../services/api';
import toastError from '../../errors/toastError';
import SimpleSelect from './SimpleSelect';
import GradientButton from '../GradientButton';
import { getBackendUrl } from '../../config';

// Componente Avatar com autenticação
const AuthenticatedAvatar = ({ src, alt, sx, children, fallbackText }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!src) {
      setImageSrc(null);
      setImageError(false);
      return;
    }

    const loadImage = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setImageSrc(imageUrl);
          setImageError(false);
        } else {
          setImageError(true);
        }
      } catch (error) {
        console.debug('Erro ao carregar imagem:', error);
        setImageError(true);
      }
    };

    loadImage();
    
    // Cleanup
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, imageSrc]);

  return (
    <Avatar
      src={!imageError ? imageSrc : undefined}
      alt={alt}
      sx={sx}
    >
      {(imageError || !imageSrc) && fallbackText}
    </Avatar>
  );
};

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
  zIndex: 99999,
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

// Lista de contatos
const ContactsList = styled(Box)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: '16px 0',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'var(--bg-secondary)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'var(--border-primary)',
    borderRadius: '3px',
  },
}));

// Item de contato
const ContactItem = styled(Box)(({ selected }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 24px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: selected ? 'rgba(0, 195, 7, 0.08)' : 'transparent',
  borderLeft: selected ? '3px solid var(--color-accent)' : '3px solid transparent',
  '&:hover': {
    backgroundColor: selected ? 'rgba(0, 195, 7, 0.12)' : 'var(--bg-secondary)',
  },
}));

// Footer do modal
const ModalFooter = styled(Box)(() => ({
  padding: '20px 24px',
  borderTop: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
}));

const NewConversationModal = ({ isOpen, onClose, onCreateTicket }) => {
  const { user } = useContext(AuthContext);
  const history = useHistory();
  const backendUrl = getBackendUrl();
  
  // Estados do modal
  const [step, setStep] = useState(1); // 1: selecionar contato, 2: selecionar fila/conexão
  const [loading, setLoading] = useState(false);
  
  // Estados para contatos
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchContact, setSearchContact] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  
  // Estados para fila e conexão
  const [queues, setQueues] = useState([]);
  const [whatsapps, setWhatsapps] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState(null);

  // Buscar contatos
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/contacts', {
        params: {
          searchParam: '',
          pageNumber: 1
        }
      });
      setContacts(data.contacts || []);
      setFilteredContacts(data.contacts || []);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toastError(error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Filtrar contatos pela busca
  useEffect(() => {
    if (!searchContact.trim()) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchContact.toLowerCase()) ||
        contact.number?.includes(searchContact)
      );
      setFilteredContacts(filtered);
    }
  }, [searchContact, contacts]);

  // Carregar dados quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      fetchQueues();
      fetchWhatsapps();
    }
  }, [isOpen, fetchContacts, fetchQueues, fetchWhatsapps]);

  // Função para construir URL da imagem do contato (mesma lógica do sidebar)
  const getContactImageUrl = (contact) => {
    return contact?.urlPicture || null;
  };

  // Reset ao fechar
  const handleClose = () => {
    setStep(1);
    setSelectedContact(null);
    setSelectedQueue(null);
    setSelectedWhatsapp(null);
    setSearchContact('');
    onClose();
  };

  // Continuar para próximo step
  const handleContinue = () => {
    if (step === 1 && selectedContact) {
      setStep(2);
    }
  };

  // Voltar step
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  // Criar conversa
  const handleCreateConversation = async () => {
    if (!selectedContact || !selectedQueue || !selectedWhatsapp) return;

    try {
      setLoading(true);
      
      console.log('🎯 Criando nova conversa...');
      console.log('📋 Dados:', {
        contactId: selectedContact.id,
        queueId: selectedQueue.id,
        whatsappId: selectedWhatsapp.id,
        userId: user.id
      });
      
      const ticketData = {
        contactId: selectedContact.id,
        queueId: selectedQueue.id,
        whatsappId: selectedWhatsapp.id,
        userId: user.id,
        status: "open" // Forçar status open para nova conversa
      };

      const { data: newTicket } = await api.post('/tickets', ticketData);
      
      console.log('✅ Conversa criada completa:', JSON.stringify(newTicket, null, 2));
      console.log('🔍 UUID retornado:', newTicket.uuid);
      console.log('🔍 ID retornado:', newTicket.id);
      
      console.log('✅ Conversa criada - passando para componente pai');
      
      // Fechar modal
      handleClose();
      
      // Callback para o componente pai (abre o chat automaticamente)
      onCreateTicket?.(newTicket);
      
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
              onClick={step === 2 ? handleBack : handleClose}
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
              Nova Conversa
            </Typography>
          </Box>
        </ModalHeader>

        {/* Conteúdo */}
        <ModalContent>
          {step === 1 ? (
            // Step 1: Selecionar contato
            <>
              {/* Campo de busca */}
              <Box sx={{ p: '20px 24px 16px' }}>
                <TextField
                  fullWidth
                  placeholder="Pesquisar contatos..."
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                        <Search size={18} />
                      </Box>
                    ),
                    sx: {
                      borderRadius: '8px',
                      '& fieldset': { borderColor: 'var(--border-primary)' },
                    }
                  }}
                />
              </Box>

              {/* Lista de contatos */}
              <ContactsList>
                {loading ? (
                  <Box sx={{ p: 3, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Carregando contatos...
                  </Box>
                ) : filteredContacts.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {searchContact ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
                  </Box>
                ) : (
                  filteredContacts.map((contact) => (
                    <ContactItem
                      key={contact.id}
                      selected={selectedContact?.id === contact.id}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <Box sx={{ mr: 2 }}>
                        <Avatar
                          src={contact?.urlPicture}
                          alt={contact?.name || contact?.number}
                          sx={{
                            width: 48,
                            height: 48,
                            backgroundColor: '#E5F3E5',
                            color: 'var(--color-accent)',
                            fontWeight: 600,
                            fontSize: '16px'
                          }}
                        >
                          {!contact?.urlPicture && (contact?.name || contact?.number)?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500, 
                            color: 'var(--text-primary)',
                            mb: 0.5
                          }}
                        >
                          {contact.name || contact.number}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ color: 'var(--text-secondary)' }}
                        >
                          {contact.number}
                        </Typography>
                      </Box>
                    </ContactItem>
                  ))
                )}
              </ContactsList>
            </>
          ) : (
            // Step 2: Selecionar fila e conexão
            <Box sx={{ p: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Contato selecionado */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Contato Selecionado
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <Box sx={{ mr: 2 }}>
                    <Avatar
                      src={selectedContact?.urlPicture}
                      alt={selectedContact?.name || selectedContact?.number}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: '#E5F3E5',
                        color: 'var(--color-accent)',
                        fontWeight: 600,
                        fontSize: '14px'
                      }}
                    >
                      {!selectedContact?.urlPicture && (selectedContact?.name || selectedContact?.number)?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {selectedContact?.name || selectedContact?.number}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                      {selectedContact?.number}
                    </Typography>
                  </Box>
                </Box>
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
          )}
        </ModalContent>

        {/* Footer */}
        <ModalFooter>
          {step === 1 ? (
            <GradientButton
              onClick={handleContinue}
              disabled={!selectedContact}
              icon={<ArrowRight size={18} />}
              variant="primary"
              size="medium"
              sx={{ width: '100%' }}
            >
              Continuar
            </GradientButton>
          ) : (
            <GradientButton
              onClick={handleCreateConversation}
              disabled={!selectedContact || !selectedQueue || !selectedWhatsapp || loading}
              loading={loading}
              loadingText="Criando..."
              icon={<MessageCircle size={18} />}
              variant="primary"
              size="medium"
              sx={{ width: '100%' }}
            >
              Criar Conversa
            </GradientButton>
          )}
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NewConversationModal;