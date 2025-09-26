import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Box, Typography, IconButton, TextField, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import {
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Componentes internos
import SearchInput from './SearchInput';
import SearchResults from './SearchResults';

const PanelContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ theme, isOpen }) => ({
  position: 'absolute',
  top: 0,
  right: isOpen ? 0 : '-320px',
  width: '320px',
  height: '100%',
  backgroundColor: 'var(--bg-primary)',
  borderLeft: '1px solid var(--border-primary)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  transition: 'right 0.2s ease-in-out',
  boxShadow: isOpen ? '0 0 20px rgba(0,0,0,0.1)' : 'none',

  // Mobile: overlay full-screen
  [theme.breakpoints.down('md')]: {
    right: isOpen ? 0 : '-100vw',
    width: '100vw',
    zIndex: 1300, // Acima de tudo no mobile
  }
}));

const PanelHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
  minHeight: '72px', // Mesmo height do ChatHeader
}));

const PanelContent = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const PanelTitle = styled(Typography)(() => ({
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
}));

const CloseButton = styled(IconButton)(() => ({
  color: 'var(--text-secondary)',
  padding: '8px',
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  }
}));

// Overlay para mobile (fundo escuro)
const MobileOverlay = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ theme, isOpen }) => ({
  display: 'none',

  [theme.breakpoints.down('md')]: {
    display: isOpen ? 'block' : 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1200,
  }
}));

const MessageSearchPanel = ({
  isOpen = false,
  onClose,
  messages = [],
  onMessageClick,
  ticketId,
  selectedContact,
  currentUser,
  profile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const panelRef = useRef(null);

  // 🎯 Hook de debounce centralizado
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Debounce centralizado da query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fechar ao clicar no overlay (mobile)
  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Função de busca local nas mensagens
  const searchInMessages = useCallback((query, messagesToSearch) => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    return messagesToSearch.filter(message => {
      // Buscar no corpo da mensagem
      if (message.body && message.body.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Buscar no nome do contato
      if (message.contact?.name && message.contact.name.toLowerCase().includes(searchTerm)) {
        return true;
      }

      return false;
    }).sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
  }, []);

  // 🧹 Clear function centralizada - SEM conflitos
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // 🎯 Busca quando debouncedQuery muda
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Simular delay de busca para UX
    setTimeout(() => {
      const results = searchInMessages(debouncedQuery, messages).map(message => ({
        ...message,
        // Garantir que cada mensagem tem dados do contato
        contact: message.contact || selectedContact
      }));
      setSearchResults(results);
      setIsSearching(false);
    }, 200);
  }, [debouncedQuery, messages, searchInMessages, selectedContact]);

  // Handler simples para mudanças no input
  const handleInputChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleMessageResultClick = useCallback((message) => {
    if (onMessageClick) {
      onMessageClick(message);
    }
  }, [onMessageClick]);

  // Não renderizar se não estiver aberto (otimização)
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <MobileOverlay isOpen={isOpen} onClick={handleOverlayClick} />

      {/* Panel */}
      <PanelContainer ref={panelRef} isOpen={isOpen}>
        {/* Header */}
        <PanelHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MagnifyingGlassIcon style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }} />
            <PanelTitle>
              Pesquisar mensagens
            </PanelTitle>
          </Box>
          <CloseButton onClick={onClose}>
            <XMarkIcon style={{ width: '20px', height: '20px' }} />
          </CloseButton>
        </PanelHeader>

        {/* Content */}
        <PanelContent>
          {/* Search Input */}
          <Box sx={{ p: 2, borderBottom: '1px solid var(--border-primary)' }}>
            <SearchInput
              value={searchQuery}
              onChange={handleInputChange}
              onClear={clearSearch}
              isLoading={isSearching}
              placeholder="Digite para pesquisar..."
            />
          </Box>

          {/* Results */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <SearchResults
              results={searchResults}
              query={searchQuery}
              isLoading={isSearching}
              onMessageClick={handleMessageResultClick}
              currentUser={currentUser}
              profile={profile}
              selectedContact={selectedContact}
            />
          </Box>
        </PanelContent>
      </PanelContainer>
    </>
  );
};

export default MessageSearchPanel;