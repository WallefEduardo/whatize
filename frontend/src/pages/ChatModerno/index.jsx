import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, useMediaQuery, useTheme, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useParams, useHistory } from 'react-router-dom';
import { MessageCircle, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

// Context
import { AuthContext } from '../../context/Auth/AuthContext';
import { TicketsContext } from '../../context/Tickets/TicketsContext';

// Nossos componentes UI
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import ScrollArea from '../../components/ui/ScrollArea';
import ChatPageBase from '../../components/ChatPageBase';

// Componentes do Chat
import ContactList from '../Chat/components/ContactList';
import ChatHeader from '../Chat/components/ChatHeader';
import MessageItem from '../Chat/components/MessageItem';
import MessageInput from '../Chat/components/MessageInput';
import ConversationInfo from '../Chat/components/ConversationInfo';
import FilterDropdown from '../../components/ui/FilterDropdown';
import { useDrawerControl } from '../../context/DrawerContext';

// Componentes otimizados
import OptimizedTabs from '../Chat/components/OptimizedTabs';
import OptimizedContactList from '../Chat/components/OptimizedContactList';
import VirtualizedContactList from '../Chat/components/VirtualizedContactList';

// Mock data e API
import {
  getContacts,
  getProfile,
  sendMessage,
  deleteMessage,
  isObjectNotEmpty
} from '../Chat/data/mockData';

// API real para mensagens
import api from '../../services/api';

// Hooks otimizados
import useOptimizedTickets from '../../hooks/useOptimizedTickets';

// Componentes auxiliares
import NewConversationModal from '../../components/ui/NewConversationModal';

// Icons
import { 
  ChatBubbleLeftRightIcon,
  HomeIcon,
  UserGroupIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 'calc(100vh - 40px)',
  gap: '16px',
  position: 'relative',
  backgroundColor: '#EEF1F9',
  borderRadius: '12px',
  padding: '12px',
  overflow: 'hidden',
  
  // Dark mode
  '@media (prefers-color-scheme: dark)': {
    backgroundColor: 'var(--bg-primary)',
  },
  
  [theme.breakpoints.down('md')]: {
    height: 'calc(100vh - 32px)',
    gap: '0',
    padding: '8px',
  },
}));

const SidebarContainer = styled(Box, {
  // Filtrar props que não devem ser passadas para o DOM
  shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ theme, isOpen }) => ({
  width: '360px',
  flexShrink: 0,
  transition: 'all 0.3s ease',
  height: '100%',
  overflow: 'hidden',
  
  [theme.breakpoints.down('md')]: {
    position: 'absolute',
    left: isOpen ? 0 : '-100%',
    top: 0,
    height: '100%',
    width: '280px',
    zIndex: 1000,
    backgroundColor: 'var(--bg-primary)',
    borderRight: '1px solid var(--border-primary)',
  },
}));

const ChatArea = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  height: '100%',
  overflow: 'hidden',
}));

const MessageArea = styled(Box)(() => ({
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  minHeight: 0,
  height: '100%',
}));

const EmptyState = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '40px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
}));

const Overlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 999,
  display: 'none',
  
  [theme.breakpoints.down('md')]: {
    display: 'block',
  },
}));

const ChatModerno = () => {
  // Parâmetros da rota
  const { ticketId } = useParams();
  const history = useHistory();
  
  // Context
  const { user } = React.useContext(AuthContext);
  const { tabOpen, setTabOpen, currentTicket, setCurrentTicket } = React.useContext(TicketsContext);
  
  // Estados
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  
  // Estados do chat
  const [showSidebar, setShowSidebar] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [reply, setReply] = useState(false);
  const [replyData, setReplyData] = useState({});
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isForward, setIsForward] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados dos filtros
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Estados dos filtros salvos
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState('');
  
  // Estado para mostrar todos os tickets - padrão false como esperado
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [pinnedConversations, setPinnedConversations] = useState(new Set());
  const [tabCounts, setTabCounts] = useState({ open: 0, pending: 0 });
  
  // Estados do SidebarContainer
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortBy, setSortBy] = useState('Data de Criação');
  
  // Estados para controle do drawer principal
  const [shouldCollapseDrawer, setShouldCollapseDrawer] = useState(false);
  
  // Estado para forçar refresh dos tickets
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Estados de busca
  const [searchParam, setSearchParam] = useState('');
  const [debouncedSearchParam, setDebouncedSearchParam] = useState('');
  
  // Estado do modal de nova conversa
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Debounce para busca otimizada
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchParam(searchParam);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchParam]);
  
  // Função para buscar counts de todos os status
  const fetchTabCounts = useCallback(async () => {
    try {
      const showAllForUser = showAllTickets;
      const userQueueIds = user?.queues?.map(q => q.id) || [];
      
      const [openResponse, pendingResponse] = await Promise.all([
        api.get('/tickets', { 
          params: { 
            status: 'open', 
            showAll: showAllForUser,
            queueIds: JSON.stringify(userQueueIds), // Usar as mesmas filas
            pageNumber: 1, 
            pageSize: 1
          } 
        }),
        api.get('/tickets', { 
          params: { 
            status: 'pending', 
            showAll: showAllForUser,
            queueIds: JSON.stringify(userQueueIds), // Usar as mesmas filas
            pageNumber: 1, 
            pageSize: 1 
          } 
        })
      ]);
      
      setTabCounts({
        open: openResponse.data.count || 0,
        pending: pendingResponse.data.count || 0
      });
    } catch (error) {
      console.error('Erro ao buscar counts:', error);
    }
  }, [showAllTickets, user?.queues]);

  // Função para fixar/desafixar conversa
  const handlePinConversation = (ticketId) => {
    setPinnedConversations(prev => {
      const newPinned = new Set(prev);
      if (newPinned.has(ticketId)) {
        newPinned.delete(ticketId);
      } else {
        newPinned.add(ticketId);
      }
      // Salvar no localStorage para persistir
      localStorage.setItem('pinnedConversations', JSON.stringify([...newPinned]));
      return newPinned;
    });
  };

  // Carregar conversas fixadas do localStorage
  useEffect(() => {
    const savedPinned = localStorage.getItem('pinnedConversations');
    if (savedPinned) {
      try {
        setPinnedConversations(new Set(JSON.parse(savedPinned)));
      } catch (error) {
        console.error('Erro ao carregar conversas fixadas:', error);
      }
    }
  }, []);
  
  // Refs
  const messagesEndRef = useRef(null);
  const chatHeightRef = useRef(null);
  
  // Hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg')); // Para controle do drawer
  


  // Hook otimizado de tickets
  const {
    loading: ticketsLoading,
    tickets,
    counts,
    refetch: refetchTickets
  } = useOptimizedTickets({
    status: tabOpen || 'open',
    searchParam: debouncedSearchParam,
    selectedQueueIds: user?.queues?.map(q => q.id) || [], // Usar filas do usuário
    showAll: showAllTickets,
    forceRefresh: forceRefresh
  });
  
  
  
  // Contexto do drawer
  const { drawerOpen, setDrawerOpen } = useDrawerControl();
  const [originalDrawerState, setOriginalDrawerState] = useState(null);
  
  // Função para forçar refresh dos tickets
  const forceTicketsRefresh = useCallback(() => {
    setForceRefresh(prev => prev + 1);
    if (refetchTickets) {
      refetchTickets();
    }
  }, [refetchTickets]);

  // Handler para busca otimizada
  const handleSearch = useCallback((event) => {
    const searchTerm = event.target.value;
    setSearchParam(searchTerm);
  }, []);

  // Handler para criar nova conversa
  const handleCreateTicket = useCallback((newTicket) => {
    // Forçar refresh dos tickets para mostrar a nova conversa
    forceTicketsRefresh();
    
    // Navegar para a nova conversa usando UUID
    if (newTicket?.uuid) {
      history.push(`/chat-moderno/${newTicket.uuid}`);
    }
    
    console.log('✅ Nova conversa criada:', newTicket.id);
  }, [forceTicketsRefresh, history]);
  

  // Auto-selecionar ticket quando passado via URL
  useEffect(() => {
    if (ticketId && tickets && tickets.length > 0) {
      // Buscar o ticket na lista de tickets
      const targetTicket = tickets.find(ticket => 
        ticket.uuid === ticketId || ticket.id.toString() === ticketId
      );
      
      if (targetTicket) {
        setSelectedChatId(targetTicket.id);
        setCurrentTicket(targetTicket);
        
        // Se estiver em mobile, fechar sidebar
        if (isMobile) {
          setShowSidebar(false);
        }
      }
    }
  }, [ticketId, tickets, setCurrentTicket, isMobile]);

  // Limpar chat quando ticket selecionado não existe mais na lista
  useEffect(() => {
    if (selectedChatId && tickets && tickets.length > 0) {
      const ticketExists = tickets.find(ticket => ticket.id === selectedChatId);
      
      if (!ticketExists) {
        setSelectedChatId(null);
        setCurrentTicket({ id: null, code: null });
        
        // Também atualizar URL para remover o ticket ID
        if (history.location.pathname !== '/chat-moderno') {
          history.replace('/chat-moderno');
        }
      }
    }
  }, [tickets, selectedChatId, setCurrentTicket, history]);
  
  // Buscar counts quando componente montar ou showAllTickets mudar
  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);
  
  // Atualizar counts quando lista de tickets mudar
  useEffect(() => {
    if (tickets && tickets.length >= 0) {
      fetchTabCounts();
    }
  }, [tickets, fetchTabCounts]);
  
  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (chatHeightRef.current) {
      const scrollElement = chatHeightRef.current.querySelector('[data-scrollable]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, []);

  // Load contacts and profile
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [contactsData, profileData] = await Promise.all([
          getContacts(),
          getProfile()
        ]);
        
        setContacts(contactsData.contacts || []);
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setSelectedContact(null);
      return;
    }
    
    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        // Buscar mensagens reais da API usando o ticketId
        const response = await api.get(`/messages/${selectedChatId}`);
        const messagesData = response.data.messages || []; // <- Correção aqui!
        
        // Buscar dados do ticket
        const ticketResponse = await api.get(`/tickets/${selectedChatId}`);
        const ticketData = ticketResponse.data;
        
        // NÃO chamar setCurrentTicket para evitar redirecionamento
        // setCurrentTicket(ticketData); <- REMOVIDO para evitar redirecionamento
        
        // Garantir que messages é sempre um array
        setMessages(Array.isArray(messagesData) ? messagesData : []);
        
        // Definir contato selecionado baseado no ticket
        if (ticketData?.contact) {
          setSelectedContact({
            id: ticketData.contact.id,
            name: ticketData.contact.name,
            avatar: ticketData.contact.profilePicUrl || ticketData.contact.urlPicture,
            phone: ticketData.contact.number
          });
        }
        
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
        // setCurrentTicket(null); <- REMOVIDO para evitar redirecionamento
        setSelectedContact(null);
      } finally {
        setMessagesLoading(false);
      }
    };
    
    loadMessages();
  }, [selectedChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle chat selection
  const openChat = (chatId) => {
    setSelectedChatId(chatId);
    setReply(false);
    setReplyData({});
    
    // Atualizar URL com o UUID do ticket
    if (tickets && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === chatId);
      if (ticket && ticket.uuid) {
        history.replace(`/chat-moderno/${ticket.uuid}`);
      }
    }
    
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Handle send message
  const handleSendMessage = async (message) => {
    if (!selectedChatId || !message.trim()) return;
    
    const contact = contacts.find(c => c.id === selectedChatId);
    if (!contact) return;
    
    try {
      const newMessage = {
        message: message,
        contact: { id: selectedChatId },
        replayMetadata: isObjectNotEmpty(replyData) ? replyData : null,
      };
      
      await sendMessage(newMessage);
      
      // Reload messages
      const messagesData = await getMessages(selectedChatId);
      setMessages(messagesData.chat?.chat || []);
      
      // Clear reply
      setReply(false);
      setReplyData({});
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (selectedChatId, index) => {
    try {
      await deleteMessage({ selectedChatId, index });
      
      // Remove from pinned messages if exists
      setPinnedMessages(prev => 
        prev.filter(msg => !(msg.chatId === selectedChatId && msg.index === index))
      );
      
      // Reload messages
      const messagesData = await getMessages(selectedChatId);
      setMessages(messagesData.chat?.chat || []);
      
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Handle reply
  const handleReply = (message, contact) => {
    setReply(true);
    setReplyData({
      message: message,
      contact: contact,
    });
  };

  // Handle pin message
  const handlePinMessage = (messageData) => {
    setPinnedMessages(prev => {
      const exists = prev.find(msg => msg.id === messageData.id);
      
      if (exists) {
        // Unpin
        return prev.filter(msg => msg.id !== messageData.id);
      } else {
        // Pin
        return [...prev, messageData];
      }
    });
  };

  // Handle forward
  const handleForward = () => {
    setIsForward(!isForward);
  };

  // Handle show info
  const handleShowInfo = () => {
    setShowInfo(!showInfo);
  };

  // Handle mobile sidebar
  const handleShowSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Funções dos filtros salvos
  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;
    
    const hasSelectedFilters = selectedTags.length > 0 || 
                              selectedConnections.length > 0 || 
                              selectedStatuses.length > 0 || 
                              selectedUsers.length > 0;
    
    if (!hasSelectedFilters) return;
    
    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: {
        tags: selectedTags,
        connections: selectedConnections,
        statuses: selectedStatuses,
        users: selectedUsers
      }
    };
    
    setSavedFilters(prev => [...prev, newFilter]);
    setFilterName('');
  };

  const applySavedFilter = (savedFilter) => {
    setSelectedTags(savedFilter.filters.tags || []);
    setSelectedConnections(savedFilter.filters.connections || []);
    setSelectedStatuses(savedFilter.filters.statuses || []);
    setSelectedUsers(savedFilter.filters.users || []);
    
    // Fechar filtros usando a função que controla o drawer
    handleFilterToggle();
  };

  const deleteSavedFilter = (filterId) => {
    setSavedFilters(prev => prev.filter(filter => filter.id !== filterId));
  };

  // Função para controlar o drawer principal
  const handleFilterToggle = () => {
    const newShowFilters = !showFilters;
    setShowFilters(newShowFilters);
    
    // Se estamos em tela pequena (lg ou menor), colapsa/expande o drawer
    if (isSmallScreen) {
      if (newShowFilters) {
        // Filtros sendo abertos - salvar estado original e colapsar drawer
        if (originalDrawerState === null) {
          setOriginalDrawerState(drawerOpen);
        }
        setShouldCollapseDrawer(true);
        setDrawerOpen(false);
      } else {
        // Filtros sendo fechados - restaurar estado original
        setShouldCollapseDrawer(false);
        if (originalDrawerState !== null) {
          setDrawerOpen(originalDrawerState);
          setOriginalDrawerState(null);
        }
      }
    }
  };

  // Limpar estado ao desmontar componente
  useEffect(() => {
    return () => {
      // Restaurar drawer ao sair da página se estava colapsado
      if (shouldCollapseDrawer && isSmallScreen && originalDrawerState !== null) {
        setDrawerOpen(originalDrawerState);
      }
    };
  }, [shouldCollapseDrawer, isSmallScreen, originalDrawerState, setDrawerOpen]);

  // Update selected contact when selectedChatId or contacts change
  useEffect(() => {
    const contact = contacts.find(c => c.id === selectedChatId);
    setSelectedContact(contact || null);
  }, [selectedChatId, contacts]);

  // Loading state
  if (loading) {
    return (
      <ChatPageBase
        title=""
        showBreadcrumb={false}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px' 
        }}>
          <Typography>Carregando chat...</Typography>
        </Box>
      </ChatPageBase>
    );
  }

  return (
    <ChatPageBase
      title=""
      showBreadcrumb={false}
    >
      <Box sx={{
        display: 'flex',
        height: '100%',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        marginTop: '20px',
        marginBottom: '30px'
      }}>
        {/* Overlay for mobile */}
        {isMobile && showSidebar && (
          <Overlay onClick={() => setShowSidebar(false)} />
        )}

        {/* Filter Panel */}
        {showFilters && (
          <Box sx={{
            width: '280px',
            height: 'calc(100vh - 128px)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Filter Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid var(--border-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px' }}>
                Filtros
              </Typography>
              <Box
                onClick={() => handleFilterToggle()}
                sx={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  '&:hover': {
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
            </Box>

            {/* Filter Content */}
            <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
              {/* Etiquetas Dropdown */}
              <Box sx={{ mb: 1.8 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 600, fontSize: '14px' }}>
                  Etiquetas
                </Typography>
                <FilterDropdown 
                  placeholder="Selecionar etiquetas..."
                  options={['Urgente', 'Suporte', 'Vendas', 'Bug', 'Reclamação', 'Dúvida']}
                  value={selectedTags}
                  onChange={setSelectedTags}
                />
              </Box>

              {/* Conexão Dropdown */}
              <Box sx={{ mb: 1.8 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 600, fontSize: '14px' }}>
                  Conexão
                </Typography>
                <FilterDropdown 
                  placeholder="Selecionar conexão..."
                  options={['WhatsApp Business', 'WhatsApp Web', 'Telegram', 'Instagram']}
                  value={selectedConnections}
                  onChange={setSelectedConnections}
                />
              </Box>

              {/* Status Dropdown */}
              <Box sx={{ mb: 1.8 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 600, fontSize: '14px' }}>
                  Status
                </Typography>
                <FilterDropdown 
                  placeholder="Selecionar status..."
                  options={['Aberto', 'Pendente', 'Resolvido', 'Fechado']}
                  value={selectedStatuses}
                  onChange={setSelectedStatuses}
                />
              </Box>

              {/* Usuário Dropdown */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 600, fontSize: '14px' }}>
                  Usuário
                </Typography>
                <FilterDropdown 
                  placeholder="Selecionar usuário..."
                  options={['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira']}
                  value={selectedUsers}
                  onChange={setSelectedUsers}
                />
              </Box>

              {/* Seção de Salvar Filtro */}
              <Box sx={{ 
                p: 2, 
                borderTop: '1px solid var(--border-primary)',
                borderBottom: '1px solid var(--border-primary)' 
              }}>
                <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 600, fontSize: '14px' }}>
                  Salvar Filtro
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Nome do filtro..."
                    size="small"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        '& fieldset': { border: 'none' },
                        '&:hover': {
                          backgroundColor: 'var(--bg-tertiary)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'white',
                          borderColor: 'var(--color-accent)',
                        },
                        '& input': {
                          fontSize: '13px',
                          padding: '8px 12px',
                          color: 'var(--text-primary)',
                        },
                      }
                    }}
                  />
                  <Box
                    onClick={saveCurrentFilter}
                    sx={{
                      px: 2,
                      py: 1,
                      backgroundColor: 'var(--color-accent)',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: 'fit-content',
                      '&:hover': {
                        backgroundColor: 'var(--color-green-hover)',
                      }
                    }}
                  >
                    Salvar
                  </Box>
                </Box>
              </Box>

              {/* Filtros Salvos */}
              {savedFilters.length > 0 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 600, fontSize: '14px' }}>
                    Filtros Salvos
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {savedFilters.map((savedFilter) => (
                      <Box
                        key={savedFilter.id}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          '&:hover': {
                            backgroundColor: 'var(--bg-tertiary)',
                            borderColor: 'var(--color-accent)',
                          }
                        }}
                      >
                        <Box onClick={() => applySavedFilter(savedFilter)} sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                            {savedFilter.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                            {[
                              savedFilter.filters.tags?.length && `${savedFilter.filters.tags.length} etiquetas`,
                              savedFilter.filters.connections?.length && `${savedFilter.filters.connections.length} conexões`,
                              savedFilter.filters.statuses?.length && `${savedFilter.filters.statuses.length} status`,
                              savedFilter.filters.users?.length && `${savedFilter.filters.users.length} usuários`
                            ].filter(Boolean).join(', ')}
                          </Typography>
                        </Box>
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedFilter(savedFilter.id);
                          }}
                          sx={{
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '3px',
                            color: 'var(--text-secondary)',
                            '&:hover': {
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'red',
                            }
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Filter Actions */}
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid var(--border-primary)',
              display: 'flex',
              gap: 1
            }}>
              <Box
                onClick={() => {
                  setSelectedTags([]);
                  setSelectedConnections([]);
                  setSelectedStatuses([]);
                  setSelectedUsers([]);
                }}
                sx={{
                  flex: 1,
                  py: 1.5,
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  '&:hover': {
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                  }
                }}
              >
                Limpar
              </Box>
              <Box
                onClick={() => {
                  // Aqui você pode implementar a lógica de aplicar filtros
                  handleFilterToggle();
                }}
                sx={{
                  flex: 1,
                  py: 1.5,
                  textAlign: 'center',
                  backgroundColor: 'var(--color-accent)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'var(--color-green-hover)',
                  }
                }}
              >
                Aplicar
              </Box>
            </Box>
          </Box>
        )}

        {/* Sidebar - Lista de Contatos */}
        <SidebarContainer isOpen={showSidebar}>
          <Card sx={{ 
            height: 'calc(100vh - 128px)', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <CardHeader sx={{ p: 2, flexShrink: 0 }}>
              {/* Top Actions Row */}
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px' }}>
                    Conversas
                  </Typography>
                  {showAllTickets && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'var(--color-accent)', 
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'block',
                        mt: -0.5
                      }}
                    >
                      Mostrando todos
                    </Typography>
                  )}
                </Box>
                
                {/* Actions Icons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Show All Button - Apenas para admins */}
                  {user?.profile === 'admin' && (
                  <Box
                    onClick={() => setShowAllTickets(!showAllTickets)}
                    sx={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      backgroundColor: showAllTickets ? 'var(--color-accent)' : 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: showAllTickets ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: showAllTickets ? 'var(--color-green-hover)' : 'var(--bg-tertiary)',
                        color: showAllTickets ? 'white' : 'var(--text-primary)',
                        transform: 'scale(1.05)',
                      }
                    }}
                    title={showAllTickets ? 'Ocultar todos os tickets' : 'Mostrar todos os tickets'}
                  >
                    {showAllTickets ? (
                      <EyeIcon style={{ width: '16px', height: '16px' }} />
                    ) : (
                      <EyeSlashIcon style={{ width: '16px', height: '16px' }} />
                    )}
                  </Box>
                  )}
                  
                  {/* Sort Dropdown */}
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      onClick={() => setShowSortOptions(!showSortOptions)}
                      sx={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        backgroundColor: showSortOptions ? 'var(--color-accent)' : 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        color: showSortOptions ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: showSortOptions ? 'var(--color-green-hover)' : 'var(--bg-tertiary)',
                          color: showSortOptions ? 'white' : 'var(--text-primary)',
                        }
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H21M7 12H17M11 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Box>
                    
                    {/* Sort Options Dropdown */}
                    {showSortOptions && (
                      <>
                        <Box
                          onClick={() => setShowSortOptions(false)}
                          sx={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999,
                          }}
                        />
                        <Box sx={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          mt: 1,
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          zIndex: 1000,
                          minWidth: '180px'
                        }}>
                          <Typography variant="caption" sx={{ 
                            p: 1.5, 
                            borderBottom: '1px solid var(--border-primary)',
                            display: 'block',
                            fontWeight: 600,
                            fontSize: '12px',
                            color: 'var(--text-secondary)'
                          }}>
                            Ordenar por:
                          </Typography>
                          {['Data de Criação', 'Última Mensagem', 'Esperando Resposta'].map((option) => (
                            <Box
                              key={option}
                              onClick={() => {
                                setSortBy(option);
                                setShowSortOptions(false);
                              }}
                              sx={{
                                p: 1.5,
                                fontSize: '13px',
                                cursor: 'pointer',
                                color: sortBy === option ? 'var(--color-accent)' : 'var(--text-primary)',
                                fontWeight: sortBy === option ? 600 : 400,
                                '&:hover': {
                                  backgroundColor: 'var(--bg-secondary)',
                                }
                              }}
                            >
                              {option}
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                  
                  {/* New Conversation Button */}
                  <Box
                    onClick={() => setShowNewConversationModal(true)}
                    sx={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-accent)',
                      border: '1px solid var(--color-accent)',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'var(--color-green-hover)',
                        borderColor: 'var(--color-green-hover)',
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Box>
                </Box>
              </Box>

              {/* Search Input */}
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Pesquisar..."
                  size="small"
                  value={searchParam}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19S2 15.194 2 10.5 5.806 2 10.5 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Box>
                    ),
                    endAdornment: searchParam && (
                      <Box 
                        onClick={() => setSearchParam('')}
                        sx={{ 
                          ml: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          '&:hover': { color: 'var(--text-primary)' }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Box>
                    ),
                    sx: {
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      '& fieldset': { border: 'none' },
                      '&:hover': {
                        backgroundColor: 'var(--bg-tertiary)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        borderColor: 'var(--color-accent)',
                        boxShadow: '0 0 0 3px rgba(0, 195, 7, 0.1)',
                      },
                      '& input': {
                        fontSize: '14px',
                        padding: '8px 12px',
                        color: 'var(--text-primary)',
                        '&::placeholder': {
                          color: 'var(--text-secondary)',
                          opacity: 1,
                        },
                      },
                    }
                  }}
                />
                
                {/* Filter Button */}
                <Box
                  onClick={handleFilterToggle}
                  sx={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    backgroundColor: showFilters ? 'var(--color-accent)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: showFilters ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: showFilters ? 'var(--color-green-hover)' : 'var(--bg-tertiary)',
                      borderColor: showFilters ? 'var(--color-green-hover)' : 'var(--color-accent)',
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 4.6C3 4.03995 3 3.75992 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.75992 3 4.03995 3 4.6 3H19.4C19.9601 3 20.2401 3 20.4540 3.10899C20.6422 3.20487 20.7951 3.35785 20.8910 3.54601C21 3.75992 21 4.03995 21 4.6V6.33726C21 6.58185 21 6.70414 20.9724 6.81923C20.9479 6.92127 20.9075 7.01881 20.8526 7.10828C20.7908 7.2092 20.7043 7.29568 20.5314 7.46863L14.4686 13.5314C14.2957 13.7043 14.2092 13.7908 14.1474 13.8917C14.0925 13.9812 14.0521 14.0787 14.0276 14.1808C14 14.2959 14 14.4182 14 14.6627V17L10 21V14.6627C10 14.4182 10 14.2959 9.97237 14.1808C9.94787 14.0787 9.90747 13.9812 9.85264 13.8917C9.7908 13.7908 9.70432 13.7043 9.53137 13.5314L3.46863 7.46863C3.29568 7.29568 3.2092 7.2092 3.14736 7.10828C3.09253 7.01881 3.05213 6.92127 3.02763 6.81923C3 6.70414 3 6.58185 3 6.33726V4.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
              </Box>

              {/* Tabs with animated line */}
              <Box sx={{ 
                display: 'flex',
                borderBottom: '1px solid var(--border-primary)',
                mb: 0
              }}>
                {[
                  { 
                    key: 'open', 
                    label: 'Atendendo', 
                    count: tabCounts.open || 0,
                    icon: MessageCircle
                  },
                  { 
                    key: 'pending', 
                    label: 'Esperando', 
                    count: tabCounts.pending || 0,
                    icon: Clock
                  }
                ].map((tab, index) => {
                  const isActive = tabOpen === tab.key;
                  return (
                    <Box
                      key={tab.key}
                      onClick={() => setTabOpen(tab.key)}
                      sx={{
                        flex: 1, // Ocupa toda largura disponível dividido igualmente
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        position: 'relative',
                        color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                        transition: 'all 0.3s ease',
                        marginBottom: '-1px',
                        gap: 1,
                        '&:hover': {
                          color: 'var(--color-accent)',
                          transform: 'translateY(-1px)',
                        },
                        '&:hover .tab-icon': {
                          transform: 'scale(1.15)',
                        },
                        '&:active': {
                          transform: 'translateY(0px)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: isActive ? '100%' : '0%',
                          height: '2px',
                          backgroundColor: 'var(--color-accent)',
                          transition: 'width 0.3s ease',
                        },
                        '&:hover::before': {
                          width: '100%',
                        }
                      }}
                    >
                      <Box
                        className="tab-icon"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <tab.icon size={16} />
                      </Box>
                      <span style={{ userSelect: 'none' }}>{tab.label}</span>
                      {tab.count > 0 && (
                        <Box
                          sx={{
                            ml: 1,
                            backgroundColor: isActive ? 'var(--color-accent)' : '#f44336',
                            color: 'white',
                            borderRadius: '50%',
                            minWidth: '18px',
                            height: '18px',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                          }}
                        >
                          {tab.count > 99 ? '99+' : tab.count}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </CardHeader>
            
            {/* Search Results Indicator */}
            {searchParam && (
              <Box sx={{ 
                px: 2, 
                py: 1, 
                backgroundColor: 'var(--bg-tertiary)',
                borderBottom: '1px solid var(--border-primary)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19S2 15.194 2 10.5 5.806 2 10.5 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                {tickets.length === 0 ? (
                  <span>Nenhum resultado para "{searchParam}"</span>
                ) : (
                  <span>{tickets.length} resultado{tickets.length !== 1 ? 's' : ''} para "{searchParam}"</span>
                )}
              </Box>
            )}
            
            <CardContent sx={{ 
              flex: 1, 
              p: 0, 
              overflow: 'hidden',
              minHeight: 0
            }}>
              <ScrollArea size="full">
                <Box data-scrollable>
                  {ticketsLoading ? (
                    <Box sx={{ p: 2, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Carregando conversas...
                    </Box>
                  ) : tickets.length === 0 ? (
                    <Box sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      color: 'var(--text-secondary)',
                      fontSize: '14px' 
                    }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                        Nenhuma conversa encontrada
                      </Typography>
                      <Typography variant="caption">
                        {tabOpen === 'open' ? 
                          'Não há conversas em atendimento no momento' : 
                          'Não há conversas esperando atendimento'
                        }
                      </Typography>
                    </Box>
                  ) : (
                    tickets
                      .sort((a, b) => {
                        // Primeiro critério: conversas fixadas vêm antes
                        const aIsPinned = pinnedConversations.has(a.id);
                        const bIsPinned = pinnedConversations.has(b.id);
                        
                        if (aIsPinned && !bIsPinned) return -1;
                        if (!aIsPinned && bIsPinned) return 1;
                        
                        // Se ambas são fixadas ou não fixadas, ordenar por data
                        return new Date(b.updatedAt) - new Date(a.updatedAt);
                      })
                      .map((ticket) => {
                      // Converter ticket para formato de contact para manter compatibilidade
                      const contactFromTicket = {
                        id: ticket.id, // Usar ticket.id em vez de uuid
                        name: ticket.contact?.name || 'Contato sem nome',
                        avatar: ticket.contact?.profilePicUrl || ticket.contact?.urlPicture || null,
                        status: ticket.status === 'open' ? 'online' : 'offline',
                        lastMessage: ticket.lastMessage || 'Nova conversa',
                        lastSeen: ticket.updatedAt,
                        unreadCount: ticket.unreadMessages || 0,
                        isTyping: false,
                        // Informações do usuário responsável  
                        userAvatar: ticket.user?.profileImage || null,
                        userName: ticket.user?.name || null
                      };
                      
                      
                      return (
                        <ContactList
                          key={ticket.id}
                          contact={contactFromTicket}
                          selectedChatId={selectedChatId}
                          openChat={openChat}
                          ticket={ticket}
                          currentTab={tabOpen}
                          onRefresh={forceTicketsRefresh}
                          isPinned={pinnedConversations.has(ticket.id)}
                          onPinConversation={() => handlePinConversation(ticket.id)}
                        />
                      );
                    })
                  )}
                </Box>
              </ScrollArea>
            </CardContent>
          </Card>
        </SidebarContainer>

        {/* Chat Area */}
        <ChatArea>
          <Card sx={{ 
            height: 'calc(100vh - 128px)', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Chat Header */}
            <CardHeader sx={{ p: 0, mb: 0, flexShrink: 0 }}>
              <ChatHeader
                contact={selectedContact}
                showInfo={showInfo}
                handleShowInfo={handleShowInfo}
                profile={profile}
                mobileMenuHandler={handleShowSidebar}
                onSearch={() => {/* TODO: Implement search */}}
              />
            </CardHeader>

            {selectedChatId ? (
              <>
                {/* Messages Area */}
                <CardContent sx={{ 
                  flex: 1, 
                  p: 0, 
                  overflow: 'hidden',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <MessageArea ref={chatHeightRef}>
                    <ScrollArea size="full">
                      <Box data-scrollable sx={{ p: 2 }}>
                        {messagesLoading ? (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            py: 4 
                          }}>
                            <Typography>Carregando mensagens...</Typography>
                          </Box>
                        ) : (
                          <>
                            {Array.isArray(messages) && messages.length > 0 ? (
                              messages.map((message, index) => (
                              <MessageItem
                                key={`message-${index}-${message.id}`}
                                message={message}
                                contact={selectedContact}
                                profile={profile}
                                onDelete={handleDeleteMessage}
                                index={index}
                                selectedChatId={selectedChatId}
                                handleReply={handleReply}
                                replyData={replyData}
                                handleForward={handleForward}
                                handlePinMessage={handlePinMessage}
                                pinnedMessages={pinnedMessages}
                              />
                            ))
                            ) : (
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                py: 8 
                              }}>
                                <Typography color="textSecondary">
                                  Nenhuma mensagem encontrada para esta conversa.
                                </Typography>
                              </Box>
                            )}
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </Box>
                    </ScrollArea>
                  </MessageArea>
                </CardContent>

                {/* Message Input */}
                <Box sx={{ 
                  borderTop: '1px solid var(--border-primary)',
                  flexShrink: 0
                }}>
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    reply={reply}
                    setReply={setReply}
                    replyData={replyData}
                    disabled={messagesLoading}
                  />
                </Box>
              </>
            ) : (
              /* Empty State */
              <CardContent sx={{ flex: 1, display: 'flex' }}>
                <EmptyState>
                  <ChatBubbleLeftRightIcon style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Bem-vindo ao Chat Moderno
                  </Typography>
                  <Typography variant="body2">
                    Selecione uma conversa para começar a trocar mensagens
                  </Typography>
                </EmptyState>
              </CardContent>
            )}
          </Card>
        </ChatArea>

        {/* Conversation Info Panel */}
        {showInfo && selectedContact && (
          <ConversationInfo 
            contact={selectedContact}
            onClose={handleShowInfo}
            showInfo={showInfo}
          />
        )}

        {/* Modal de Nova Conversa */}
        <NewConversationModal
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          onCreateTicket={handleCreateTicket}
        />
      </Box>
    </ChatPageBase>
  );
};

export default ChatModerno;