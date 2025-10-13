import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Skeleton,
  Avatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search, X, Check, User } from 'lucide-react';
import api from '../../services/api';
import toastError from '../../errors/toastError';
import ContactItem from './ContactItem';

// ============= STYLED COMPONENTS =============

const ModalContainer = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '12px',
    maxWidth: '450px',
    width: '100%',
    height: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  }
}));

const HeaderContainer = styled(DialogTitle)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
}));

const HeaderTitle = styled(Typography)(() => ({
  fontSize: '18px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}));

const SearchContainer = styled(Box)(() => ({
  padding: '16px',
  borderBottom: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
}));

const SearchInputContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '8px',
  padding: '8px 12px',
  border: '1px solid var(--border-primary)',
}));

const SearchInput = styled(TextField)(() => ({
  flex: 1,
  '& .MuiInputBase-root': {
    color: 'var(--text-primary)',
    fontSize: '14px',
    padding: 0,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& input::placeholder': {
    color: 'var(--text-secondary)',
    opacity: 1,
  },
}));

const ContactListContainer = styled(DialogContent)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: '8px',
  backgroundColor: 'var(--bg-primary)',

  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'var(--border-secondary)',
    borderRadius: '3px',
  },
}));

const EmptyState = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  color: 'var(--text-secondary)',
  textAlign: 'center',
}));

const SelectedPreviewContainer = styled(Box)(() => ({
  borderTop: '1px solid var(--border-primary)',
  padding: '0',
  backgroundColor: 'var(--bg-primary)',
  maxHeight: '200px',
  overflowY: 'auto',

  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'var(--border-secondary)',
    borderRadius: '3px',
  },
}));

const ContactCard = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: 'transparent',
  borderRadius: '0',
  border: 'none',
  borderBottom: '1px solid var(--border-primary)',
  marginBottom: '0',
  transition: 'all 0.2s ease',

  '&:last-child': {
    borderBottom: 'none',
  },

  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
  }
}));

const ContactCardInfo = styled(Box)(() => ({
  flex: 1,
  overflow: 'hidden',
}));

const ContactCardName = styled(Typography)(() => ({
  fontSize: '16px',
  fontWeight: 500,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: '22px',
}));

const ContactCardNumber = styled(Typography)(() => ({
  fontSize: '14px',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: '20px',
}));

const SendButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'disabled'
})(({ disabled }) => ({
  padding: '8px',
  backgroundColor: disabled ? 'var(--bg-tertiary)' : '#00a884',
  color: 'white',
  borderRadius: '50%',

  '&:hover': {
    backgroundColor: disabled ? 'var(--bg-tertiary)' : '#00916a',
  },

  '&:disabled': {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-disabled)',
  }
}));

const RemoveButton = styled(IconButton)(() => ({
  padding: '4px',
  color: 'var(--text-secondary)',

  '&:hover': {
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  }
}));

// Skeleton de loading
const ContactSkeleton = () => (
  <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
    <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'var(--bg-tertiary)' }} />
    <Box sx={{ flex: 1 }}>
      <Skeleton width="60%" height={20} sx={{ bgcolor: 'var(--bg-tertiary)', mb: 1 }} />
      <Skeleton width="40%" height={16} sx={{ bgcolor: 'var(--bg-tertiary)' }} />
    </Box>
  </Box>
);

/**
 * ModernContactSendModal - Modal para envio de contatos estilo WhatsApp
 * Features:
 * - Carrega todos os contatos automaticamente ao abrir
 * - Busca instantânea local (sem debounce)
 * - Seleção múltipla com checkboxes
 * - Preview dos contatos selecionados na parte inferior
 * - Dark mode support completo
 */
const ModernContactSendModal = ({ open, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Carregar todos os contatos quando o modal abre
  useEffect(() => {
    if (!open) return;

    const fetchContacts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('contacts', {
          params: {
            searchParam: '',
            pageNumber: 1,
            channel: 'whatsapp',
            isGroup: 'false'
          }
        });
        setContacts(data.contacts || []);
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [open]);

  // Filtrar contatos pela busca local (sem debounce, instantâneo)
  const filteredContacts = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return contacts;
    }
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.number?.includes(searchTerm)
    );
  }, [searchTerm, contacts]);

  // Toggle seleção de contato
  const handleToggleContact = (contact) => {
    setSelectedContactIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contact.id)) {
        newSet.delete(contact.id);
      } else {
        newSet.add(contact.id);
      }
      return newSet;
    });
  };

  // Remover contato da seleção
  const handleRemoveContact = (contactId) => {
    setSelectedContactIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(contactId);
      return newSet;
    });
  };

  // Limpar busca
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Enviar contatos selecionados
  const handleSend = () => {
    const selectedContacts = contacts.filter(c =>
      selectedContactIds.has(c.id)
    );
    onClose(selectedContacts);
  };

  // Fechar modal
  const handleClose = () => {
    onClose([]);
    setSearchTerm('');
    setContacts([]);
    setSelectedContactIds(new Set());
  };

  // Contatos selecionados para preview
  const selectedContacts = contacts.filter(c =>
    selectedContactIds.has(c.id)
  );

  return (
    <ModalContainer open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      {/* Header */}
      <HeaderContainer>
        <HeaderTitle>
          <User size={20} />
          Enviar contato
          {selectedContactIds.size > 0 && (
            <Typography
              component="span"
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: 'var(--text-secondary)',
                ml: 1
              }}
            >
              ({selectedContactIds.size} selecionado{selectedContactIds.size !== 1 ? 's' : ''})
            </Typography>
          )}
        </HeaderTitle>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Botão enviar */}
          <SendButton
            onClick={handleSend}
            disabled={selectedContactIds.size === 0}
            title="Enviar contatos"
          >
            <Check size={18} />
          </SendButton>

          {/* Botão fechar */}
          <IconButton
            onClick={handleClose}
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': {
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
              }
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>
      </HeaderContainer>

      {/* Campo de busca */}
      <SearchContainer>
        <SearchInputContainer>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <SearchInput
            placeholder="Pesquisar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="standard"
            autoFocus
          />
          {searchTerm && (
            <IconButton
              size="small"
              onClick={handleClearSearch}
              sx={{
                padding: '4px',
                color: 'var(--text-secondary)',
              }}
            >
              <X size={16} />
            </IconButton>
          )}
        </SearchInputContainer>
      </SearchContainer>

      {/* Lista de contatos */}
      <ContactListContainer>
        {loading && (
          <>
            <ContactSkeleton />
            <ContactSkeleton />
            <ContactSkeleton />
            <ContactSkeleton />
          </>
        )}

        {!loading && filteredContacts.length === 0 && (
          <EmptyState>
            <User size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
            </Typography>
          </EmptyState>
        )}

        {!loading && filteredContacts.length > 0 && (
          <>
            {filteredContacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                selected={selectedContactIds.has(contact.id)}
                onToggle={handleToggleContact}
              />
            ))}
          </>
        )}
      </ContactListContainer>

      {/* Preview dos contatos selecionados */}
      {selectedContacts.length > 0 && (
        <SelectedPreviewContainer>
          {selectedContacts.map((contact) => (
            <ContactCard key={contact.id}>
              {/* Ícone de pessoa ao invés da foto */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <User size={20} style={{ color: 'var(--text-secondary)' }} />
              </Box>
              <ContactCardInfo>
                <ContactCardName>{contact.name}</ContactCardName>
                <ContactCardNumber>{contact.number}</ContactCardNumber>
              </ContactCardInfo>
              <RemoveButton
                size="small"
                onClick={() => handleRemoveContact(contact.id)}
                title="Remover"
              >
                <X size={16} />
              </RemoveButton>
            </ContactCard>
          ))}
        </SelectedPreviewContainer>
      )}
    </ModalContainer>
  );
};

export default ModernContactSendModal;
