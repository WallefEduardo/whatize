import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Autocomplete, {
  createFilterOptions,
} from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import { styled } from '@mui/material/styles';
import { Box, Typography, IconButton, Avatar, Checkbox } from "@mui/material";
import { FormControlLabel, Switch } from "@mui/material";
import { Send, X } from 'lucide-react';

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ContactModal from "../ContactModal";
import toastError from "../../errors/toastError"; 
import { AuthContext } from "../../context/Auth/AuthContext";
import QueueSelectionModal from "../ui/QueueSelectionModal";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '12px',
    padding: '0',
    maxWidth: '500px',
    width: '100%',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '18px',
  fontWeight: 600,
  borderBottom: '1px solid var(--border-primary)',
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: '24px',
  backgroundColor: 'var(--bg-primary)',
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: '16px 24px',
  backgroundColor: 'var(--bg-primary)',
  borderTop: '1px solid var(--border-primary)',
  gap: '12px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    '& fieldset': {
      borderColor: 'var(--border-primary)',
    },
    '&:hover fieldset': {
      borderColor: 'var(--color-accent)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--color-accent)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-secondary)',
    '&.Mui-focused': {
      color: 'var(--color-accent)',
    },
  },
}));

// Componente ContactItem para lista de contatos
const ContactItem = React.memo(({ contact, isSelected, onToggle }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        '&:hover': {
          backgroundColor: 'var(--hover-bg-light)',
        },
        borderRadius: '6px',
        margin: '2px 0',
        minHeight: '56px',
        backgroundColor: isSelected ? 'rgba(37, 211, 102, 0.1)' : 'transparent',
      }}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onClick={(e) => e.stopPropagation()}
        size="small"
        sx={{
          marginRight: '12px',
          color: 'var(--text-secondary)',
          '&.Mui-checked': {
            color: 'var(--color-accent)',
          },
        }}
      />
      
      {/* Avatar */}
      <Avatar
        src={contact.profilePicUrl}
        sx={{
          width: 40,
          height: 40,
          marginRight: '12px',
          backgroundColor: 'var(--color-accent)',
          fontSize: '16px',
        }}
      >
        {contact.name?.charAt(0)?.toUpperCase()}
      </Avatar>
      
      {/* Contact Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {contact.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {contact.number || 'Contato'}
        </Typography>
      </Box>
    </Box>
  );
});

const ModernForwardMessageModal = ({ messages, onClose, modalOpen, onCreateTicket, forceTicketsRefresh }) => {
    const [optionsContacts, setOptionsContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]); // Lista completa de contatos
  const [newContact, setNewContact] = useState({});
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const [sending, setSending] = useState(false);
  const [messageSending, setMessageSending] = useState('');
  const [signMessage, setSignMessage] = useState(true);
  const [showQueueSelection, setShowQueueSelection] = useState(false);
  const [contactsForNewTickets, setContactsForNewTickets] = useState([]);
  const [messagesToForward, setMessagesToForward] = useState([]);

    // Carregar todos os contatos ao abrir o modal
    useEffect(() => {
      if (!modalOpen) {
        return;
      }
      
      const fetchAllContacts = async () => {
        setLoading(true);
        try {
          const { data } = await api.get("contacts", {
            params: { pageNumber: 1, searchParam: "" }, // Carregar todos
          });
          console.log('all contacts loaded:', data.contacts);
          setAllContacts(data.contacts || []);
          setOptionsContacts(data.contacts || []); // Mostrar todos inicialmente
        } catch (err) {
          toastError(err);
          setOptionsContacts([]);
        } finally {
          setLoading(false);
        }
      };

      fetchAllContacts();
    }, [modalOpen]);

    // Filtro local em tempo real quando usuário digita
    useEffect(() => {
      if (!modalOpen) {
        return;
      }

      // Se não tem busca, mostrar todos os contatos
      if (searchParam.length === 0) {
        setOptionsContacts(allContacts);
        return;
      }

      // Filtro local para busca instantânea
      const filteredContacts = allContacts.filter(contact => 
        contact.name?.toLowerCase().includes(searchParam.toLowerCase()) ||
        contact.number?.includes(searchParam)
      );
      
      setOptionsContacts(filteredContacts);
    }, [searchParam, allContacts, modalOpen]);

  const history = useHistory();

  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

    // Toggle selection of contact
    const handleToggleContact = (contact) => {
      setSelectedContacts(prev => {
        const exists = prev.some(c => c.id === contact.id);
        if (exists) {
          return prev.filter(c => c.id !== contact.id);
        } else {
          return [...prev, contact];
        }
      });
    };

    // Função para enviar mensagens para todos os contatos selecionados
    const sendMessagesToContacts = async () => {
      console.log('📤 Iniciando envio de mensagens...');
      console.log('👥 Contatos selecionados:', selectedContacts.length);
      console.log('📨 Mensagens para enviar:', messages.length);
      
      setSending(true);
      const responseList = [];
      
      for (const contact of selectedContacts) {
        console.log(`📤 Enviando para contato: ${contact.name} (ID: ${contact.id})`);
        for (const message of messages) {
          try {
            setMessageSending(`${contact.name} - ${message.id}`);
            console.log(`📨 Enviando mensagem ${message.id} para contato ${contact.id}`);
            const response = await api.post('/message/forward', {
              messageId: message.id, 
              contactId: contact.id, 
              signMessage: signMessage
            });
            responseList.push(response);
            console.log(`✅ Mensagem ${message.id} enviada com sucesso`);
            await sleep(500);
          } catch (error) {
            console.error(`❌ Erro ao enviar mensagem ${message.id} para contato ${contact.id}:`, error);
            toastError(error);
          }		
        }
      }
      setSending(false);
      console.log('📬 Envio de mensagens finalizado. Total de respostas:', responseList.length);
      return responseList;
    };

    // Função para enviar mensagens para contatos específicos (usada após criar tickets)
    const sendMessagesToSpecificContacts = async (contactsToSend) => {
      console.log('📤 Iniciando envio de mensagens para contatos específicos...');
      console.log('👥 Contatos específicos:', contactsToSend.length);
      console.log('📨 Mensagens para enviar:', messagesToForward.length);
      
      if (!contactsToSend || contactsToSend.length === 0) {
        console.log('⚠️ Nenhum contato específico para enviar mensagens');
        return [];
      }

      if (!messagesToForward || messagesToForward.length === 0) {
        console.log('⚠️ Nenhuma mensagem salva para enviar');
        return [];
      }
      
      setSending(true);
      const responseList = [];
      
      for (const contact of contactsToSend) {
        console.log(`📤 Enviando para contato específico: ${contact.name || contact.number} (ID: ${contact.id})`);
        for (const message of messagesToForward) {
          try {
            setMessageSending(`${contact.name || contact.number} - ${message.id}`);
            console.log(`📨 Enviando mensagem ${message.id} para contato ${contact.id}`);
            const response = await api.post('/message/forward', {
              messageId: message.id, 
              contactId: contact.id, 
              signMessage: signMessage
            });
            responseList.push(response);
            console.log(`✅ Mensagem ${message.id} enviada com sucesso`);
            await sleep(500);
          } catch (error) {
            console.error(`❌ Erro ao enviar mensagem ${message.id} para contato ${contact.id}:`, error);
            toastError(error);
          }		
        }
      }
      setSending(false);
      console.log('📬 Envio de mensagens específicas finalizado. Total de respostas:', responseList.length);
      return responseList;
    };

    const handleForwardMessage = async() => {
      if (selectedContacts.length === 0) return;
      
      // Salvar mensagens antes de qualquer operação que possa limpar o estado
      setMessagesToForward([...messages]);
      
      console.log('🚀 Iniciando processo de encaminhamento para', selectedContacts.length, 'contatos');
      console.log('📨 Salvando', messages.length, 'mensagens para encaminhar');
      
      try {
        // 1. PRIMEIRO: Buscar todos os tickets disponíveis
        console.log('🔍 Buscando todos os tickets...');
        const { data } = await api.get('/tickets');
        let allTickets = [...(data.tickets || [])];
        
        // Buscar mais páginas de tickets para ter certeza
        try {
          for (let page = 2; page <= 5; page++) {
            const { data: morePage } = await api.get('/tickets', {
              params: { pageNumber: page }
            });
            if (morePage.tickets && morePage.tickets.length > 0) {
              allTickets = [...allTickets, ...morePage.tickets];
            } else {
              break;
            }
          }
        } catch (error) {
          console.log('⚠️ Erro ao buscar páginas adicionais:', error.message);
        }
        
        console.log('📊 Total de tickets encontrados:', allTickets.length);
        
        // 2. SEGUNDO: Verificar quais contatos já têm tickets abertos
        const contactsWithTickets = [];
        const contactsWithoutTickets = [];
        
        for (const contact of selectedContacts) {
          console.log(`🔍 Verificando contato: ${contact.name || contact.number} (ID: ${contact.id})`);
          
          // Buscar tickets do contato por múltiplas estratégias
          let contactTickets = allTickets.filter(t => 
            t.contactId === contact.id ||
            t.contact?.number === contact.number ||
            t.contact?.name === contact.name ||
            t.contact?.name === contact.number
          );
          
          console.log(`🔍 DEBUG: Busca para contato ${contact.name || contact.number}:`);
          console.log(`   - contact.id: ${contact.id}`);
          console.log(`   - contact.number: ${contact.number}`);
          console.log(`   - contact.name: ${contact.name}`);
          console.log(`   - Tickets encontrados:`, contactTickets.map(t => ({
            id: t.id,
            uuid: t.uuid, 
            status: t.status,
            contactId: t.contactId,
            contactName: t.contact?.name,
            contactNumber: t.contact?.number
          })));
          
          // Filtrar apenas tickets abertos (pending ou open)
          const openTickets = contactTickets.filter(t => t.status === 'pending' || t.status === 'open');
          
          console.log(`📋 Contato ${contact.name}: ${contactTickets.length} tickets total, ${openTickets.length} abertos`);
          
          if (openTickets.length > 0) {
            contactsWithTickets.push({ contact, ticket: openTickets[0] });
            console.log(`✅ ${contact.name} TEM ticket aberto: ${openTickets[0].uuid}`);
          } else {
            contactsWithoutTickets.push(contact);
            console.log(`❌ ${contact.name} NÃO tem ticket aberto`);
          }
        }
        
        console.log('📊 Resumo:');
        console.log('✅ Contatos COM tickets abertos:', contactsWithTickets.length);
        console.log('❌ Contatos SEM tickets abertos:', contactsWithoutTickets.length);
        
        // 3. TERCEIRO: Decidir fluxo baseado na análise
        if (contactsWithoutTickets.length === 0) {
          // TODOS os contatos já têm tickets abertos
          console.log('🎯 CENÁRIO 1: Todos os contatos já têm tickets abertos');
          console.log('📤 Enviando mensagens para todos e redirecionando para o primeiro...');
          
          // Enviar mensagens para todos os contatos
          await sendMessagesToContacts();
          
          // Redirecionar para o primeiro contato
          const firstContactWithTicket = contactsWithTickets[0];
          const redirectUrl = `/chat-moderno/${firstContactWithTicket.ticket.uuid}`;
          
          console.log('🚀 Redirecionando para:', redirectUrl);
          
          if (forceTicketsRefresh) {
            forceTicketsRefresh();
          }
          
          history.push(redirectUrl);
          handleClose();
          
        } else if (contactsWithTickets.length === 0) {
          // NENHUM contato tem ticket aberto
          console.log('🎯 CENÁRIO 2: Nenhum contato tem ticket aberto');
          console.log('📋 Abrindo modal para criar tickets para', contactsWithoutTickets.length, 'contatos');
          
          // Fechar modal principal e abrir modal de seleção
          handleClose();
          
          setTimeout(() => {
            setContactsForNewTickets(contactsWithoutTickets);
            setShowQueueSelection(true);
          }, 100);
          
        } else {
          // ALGUNS contatos têm tickets, OUTROS não
          console.log('🎯 CENÁRIO 3: Mistura - alguns têm tickets, outros não');
          console.log('📤 Enviando mensagens para contatos com tickets...');
          console.log('📋 E abrindo modal para criar tickets para os demais...');
          
          // Enviar mensagens apenas para contatos que já têm tickets
          const originalSelectedContacts = [...selectedContacts];
          setSelectedContacts(contactsWithTickets.map(item => item.contact));
          
          await sendMessagesToContacts();
          
          // Restaurar seleção original
          setSelectedContacts(originalSelectedContacts);
          
          // Fechar modal principal e abrir modal de seleção para contatos sem tickets
          handleClose();
          
          setTimeout(() => {
            setContactsForNewTickets(contactsWithoutTickets);
            setShowQueueSelection(true);
          }, 100);
          
          // Redirecionar para o primeiro contato que já tinha ticket
          const firstContactWithTicket = contactsWithTickets[0];
          const redirectUrl = `/chat-moderno/${firstContactWithTicket.ticket.uuid}`;
          
          console.log('🚀 Redirecionando para contato que já tinha ticket:', redirectUrl);
          
          if (forceTicketsRefresh) {
            forceTicketsRefresh();
          }
          
          // Pequeno delay para permitir o modal abrir antes do redirect
          setTimeout(() => {
            history.push(redirectUrl);
          }, 200);
        }
        
      } catch (error) {
        console.error('❌ Erro no processo de encaminhamento:', error);
        // Fallback: tratar todos como se não tivessem tickets
        console.log('🔄 Usando fallback - tratando todos como sem tickets');
        
        handleClose();
        
        setTimeout(() => {
          setContactsForNewTickets(selectedContacts);
          setShowQueueSelection(true);
        }, 100);
      }
    }

    // Handler para criar tickets e abrir conversa do primeiro
    const handleCreateTicketAndOpen = async (ticketsData, firstContact) => {
      try {
        console.log('🎯 Criando tickets para múltiplos contatos...');
        console.log('📋 Quantidade de tickets a criar:', ticketsData.length);
        console.log('👤 Primeiro contato para redirecionamento:', firstContact?.name);
        
        const createdTickets = [];
        
        // Criar tickets para todos os contatos
        for (const ticketData of ticketsData) {
          console.log('📋 Criando ticket para contactId:', ticketData.contactId);
          const { data: newTicket } = await api.post('/tickets', ticketData);
          createdTickets.push(newTicket);
          console.log('✅ Ticket criado:', newTicket.uuid);
          
          // Pequeno delay entre criações para evitar sobrecarga
          if (ticketsData.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        console.log('✅ Todos os tickets criados! Total:', createdTickets.length);
        console.log('📤 Agora enviando mensagens...');
        
        // AGORA SIM: Enviar mensagens para todos os contatos que criaram tickets
        const contactsFromTickets = ticketsData.map(td => 
          contactsForNewTickets.find(c => c.id === td.contactId)
        ).filter(Boolean);
        
        console.log('📤 Enviando mensagens para contatos que criaram tickets:', contactsFromTickets.length);
        
        await sendMessagesToSpecificContacts(contactsFromTickets);
        
        console.log('📬 Mensagens enviadas com sucesso!');
        
        // Forçar refresh dos tickets
        if (forceTicketsRefresh) {
          forceTicketsRefresh();
        }
        
        // Redirecionar para a conversa do primeiro contato
        const firstTicket = createdTickets[0];
        const redirectUrl = `/chat-moderno/${firstTicket.uuid}`;
        
        console.log('🚀 Redirecionando para primeiro ticket criado:', redirectUrl);
        history.push(redirectUrl);
        
        // Fechar ambos os modais
        setShowQueueSelection(false);
        setContactsForNewTickets([]);
        handleFullClose();
        
      } catch (error) {
        console.error('❌ Erro ao criar tickets:', error);
        toastError(error);
      }
    };

    const handleClose = () => {
    // Limpar todos os estados ao fechar o modal
    setSearchParam("");
    setSelectedContacts([]);
    setSending(false);
    setMessageSending('');
    // NÃO resetar o showQueueSelection e contactsForNewTickets aqui 
    // para não interferir com a transição entre modais
    onClose();
  };

  const handleFullClose = () => {
    // Limpar TODOS os estados (usado quando realmente quer fechar tudo)
    setSearchParam("");
    setSelectedContacts([]);
    setSending(false);
    setMessageSending('');
    setShowQueueSelection(false);
    setContactsForNewTickets([]);
    setMessagesToForward([]);
    onClose();
  };

    const handleCloseContactModal = () => {
    setContactModalOpen(false);
  };

    return (
        <>
      <ContactModal
        open={contactModalOpen}
        initialValues={newContact}
        onClose={handleCloseContactModal}
      />
      
      <StyledDialog open={modalOpen} onClose={handleFullClose}>
        <StyledDialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Send size={20} color="var(--color-accent)" />
            Encaminhar mensagem
          </Box>
          <IconButton
            onClick={handleFullClose}
            size="small"
            sx={{ 
              color: 'var(--text-secondary)',
              '&:hover': { color: 'var(--text-primary)' }
            }}
          >
            <X size={18} />
          </IconButton>
        </StyledDialogTitle>

        <StyledDialogContent>
          {/* Campo de busca */}
          <Box sx={{ marginBottom: '16px' }}>
            <StyledTextField
              fullWidth
              placeholder="Pesquisar nome ou número"
              value={searchParam}
              onChange={e => setSearchParam(e.target.value)}
              variant="outlined"
              autoFocus
              size="small"
              InputProps={{
                startAdornment: (
                  <Box sx={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                    <svg width="16" height="16" fill="var(--text-secondary)" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </Box>
                ),
                endAdornment: loading && (
                  <CircularProgress 
                    size={20}
                    sx={{ color: 'var(--color-accent)' }}
                  />
                )
              }}
            />
          </Box>

          {/* Lista de contatos */}
          <Box sx={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            position: 'relative',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'var(--border-primary)',
              borderRadius: '3px',
              '&:hover': {
                backgroundColor: 'var(--text-secondary)',
              },
            },
          }}>
            {optionsContacts.length > 0 ? (
              optionsContacts.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedContacts.some(c => c.id === contact.id)}
                  onToggle={() => handleToggleContact(contact)}
                />
              ))
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                padding: '32px',
                color: 'var(--text-secondary)'
              }}>
                {searchParam.length > 0 ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
              </Box>
            )}
          </Box>

          {sending && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              padding: '12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <CircularProgress size={20} sx={{ color: 'var(--color-accent)' }} />
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                Enviando mensagem {messageSending}...
              </Typography>
            </Box>
          )}
        </StyledDialogContent>

        {/* Botão de enviar - só aparece quando há contatos selecionados */}
        {selectedContacts.length > 0 && (
          <StyledDialogActions>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%' 
            }}>
              {/* Switch de assinar mensagem */}
              <FormControlLabel
                style={{ color: 'var(--text-secondary)' }}
                label={i18n.t("messagesInput.signMessage")}
                labelPlacement="start"
                control={
                  <Switch
                    size="small"
                    checked={signMessage}
                    onChange={(e) => setSignMessage(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'var(--color-accent)',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: 'var(--color-accent)',
                      },
                    }}
                  />
                }
              />
              
              {/* Botão de encaminhar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  {selectedContacts.length} selecionado{selectedContacts.length !== 1 ? 's' : ''}
                </Typography>
                <ButtonWithSpinner
                  variant="contained"
                  type="button"
                  disabled={sending}
                  onClick={handleForwardMessage}
                  sx={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    minWidth: '120px',
                    '&:hover': {
                      backgroundColor: 'var(--color-green-dark)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'var(--disabled-bg)',
                      color: 'var(--disabled-text)',
                    },
                  }}
                  loading={sending}
                >
                  <Send size={16} style={{ marginRight: '8px' }} />
                  Encaminhar
                </ButtonWithSpinner>
              </Box>
            </Box>
          </StyledDialogActions>
        )}
      </StyledDialog>
      
      {/* Modal de Seleção de Fila */}
      {console.log('🎯 Renderizando QueueSelectionModal - showQueueSelection:', showQueueSelection, 'contactsForNewTickets:', contactsForNewTickets.length)}
      <QueueSelectionModal
        isOpen={showQueueSelection}
        contacts={contactsForNewTickets}
        onClose={() => {
          console.log('🚪 Fechando QueueSelectionModal');
          setShowQueueSelection(false);
          setContactsForNewTickets([]);
          // Se o usuário cancelar, não abre mais nenhum modal
        }}
        onCreateAndOpen={handleCreateTicketAndOpen}
      />
    </>
    );
};

export default ModernForwardMessageModal;