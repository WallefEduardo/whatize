import React, { useState, useEffect, useRef, useCallback, useReducer, useContext, useMemo } from 'react';
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

// Hook de tickets do sistema original
import useTickets from '../../hooks/useTickets';

// Componentes auxiliares
import NewConversationModal from '../../components/ui/NewConversationModal';
import ChatTabs from './components/ChatTabs';
import SearchAndFilters from './components/SearchAndFilters';
import TicketsList from './components/TicketsList';

// Componentes de filtro (reutilizados do chat antigo)
import { TagsFilter } from '../../components/TagsFilter';
import { WhatsappsFilter } from '../../components/WhatsappsFilter';
import { StatusFilter } from '../../components/StatusFilter';
import { UsersFilter } from '../../components/UsersFilter';

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
  const { user, socket } = React.useContext(AuthContext);
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
  
  // Estados dos filtros - SELECIONADOS (UI apenas)
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Estados dos filtros - APLICADOS (efetivos)
  const [appliedTags, setAppliedTags] = useState([]);
  const [appliedConnections, setAppliedConnections] = useState([]);
  const [appliedStatuses, setAppliedStatuses] = useState([]);
  const [appliedUsers, setAppliedUsers] = useState([]);
  
  // Estados dos filtros salvos
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [refreshTickets, setRefreshTickets] = useState(false);
  
  // Estados para as opções dos filtros (carregadas da API)
  const [tagsOptions, setTagsOptions] = useState([]);
  const [connectionsOptions, setConnectionsOptions] = useState([]);
  const [usersOptions, setUsersOptions] = useState([]);
  const statusOptions = ['Atendendo', 'Esperando', 'Finalizado', 'Grupos'];
  
  // Cache dos dados completos para mapeamento nome → ID
  const [tagsData, setTagsData] = useState([]);
  const [connectionsData, setConnectionsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  
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
  
  // Estado para paginação
  const [pageNumber, setPageNumber] = useState(1);

  // Debounce para busca otimizada
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchParam(searchParam);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchParam]);
  

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
  


  // Reducer igual ao sistema original
  const reducer = (state, action) => {
    if (action.type === "LOAD_TICKETS") {
      const newTickets = action.payload;
      if (Array.isArray(newTickets)) {
        newTickets.forEach(ticket => {
          const ticketIndex = state.findIndex(t => t.id === ticket.id);
          if (ticketIndex !== -1) {
            state[ticketIndex] = ticket;
          } else {
            state.push(ticket);
          }
        });
      }
      return [...state];
    }

    if (action.type === "UPDATE_TICKET") {
      const ticket = action.payload;
      const ticketIndex = state.findIndex(t => t.id === ticket.id);
      if (ticketIndex !== -1) {
        state[ticketIndex] = ticket;
      } else {
        state.unshift(ticket);
      }
      return [...state];
    }

    if (action.type === "UPDATE_TICKET_UNREAD_MESSAGES") {
      const ticket = action.payload;
      const ticketIndex = state.findIndex(t => t.id === ticket.id);
      if (ticketIndex !== -1) {
        state[ticketIndex] = ticket;
        state.unshift(state.splice(ticketIndex, 1)[0]);
      } else {
        state.unshift(ticket);
      }
      return [...state];
    }

    if (action.type === "DELETE_TICKET") {
      const ticketId = action.payload;
      const ticketIndex = state.findIndex(t => t.id === ticketId);
      if (ticketIndex !== -1) {
        state.splice(ticketIndex, 1);
      }
      return [...state];
    }

    if (action.type === "RESET") {
      return [];
    }
  };

  const [ticketsList, dispatch] = useReducer(reducer, []);
  
  // Memoizar conversões de nomes para IDs para evitar loops infinitos
  const tagIds = useMemo(() => {
    if (appliedTags.length === 0) return undefined;
    return appliedTags.map(name => {
      const tag = tagsData.find(t => t.name === name);
      return tag ? tag.id : null;
    }).filter(id => id !== null);
  }, [appliedTags, tagsData]);

  const connectionIds = useMemo(() => {
    if (appliedConnections.length === 0) return undefined;
    return appliedConnections.map(name => {
      const connection = connectionsData.find(c => c.name === name);
      return connection ? connection.id : null;
    }).filter(id => id !== null);
  }, [appliedConnections, connectionsData]);

  const userIds = useMemo(() => {
    if (appliedUsers.length === 0) return undefined;
    return appliedUsers.map(name => {
      const user = usersData.find(u => u.name === name);
      return user ? user.id : null;
    }).filter(id => id !== null);
  }, [appliedUsers, usersData]);

  // Memoizar queueIds para evitar loop infinito
  const queueIds = useMemo(() => {
    return JSON.stringify(user?.queues?.map(q => q.id) || []);
  }, [user?.queues]);
  
  // Buscar tickets usando o hook original
  const { tickets: ticketsData, loading: ticketsLoading, hasMore } = useTickets({
    searchParam: debouncedSearchParam,
    pageNumber: pageNumber,
    status: tabOpen,
    showAll: showAllTickets,
    queueIds: queueIds,
    // Parâmetros de filtros aplicados (usando versões memoizadas)
    tags: tagIds,
    users: userIds,
    whatsappIds: connectionIds,
    // Status filter NÃO enviado para API (controlado localmente via shouldShowTicketsInTab)
    forceSearch: refreshTickets
  });



  // Resetar reducer e página quando parâmetros de busca mudam
  useEffect(() => {
    setPageNumber(1); // Reset para página 1
    dispatch({ type: "RESET" });
  }, [debouncedSearchParam, tabOpen, showAllTickets, appliedTags, appliedConnections, appliedStatuses, appliedUsers]);

  // Carregar tickets no reducer
  useEffect(() => {
    if (ticketsData) {
      console.log('✅ Query otimizada - Tickets retornados:', ticketsData.length);
      
      // Para página 1: RESET e carrega. Para páginas > 1: apenas adiciona
      if (pageNumber === 1) {
        dispatch({ type: "RESET" });
      }
      dispatch({ type: "LOAD_TICKETS", payload: ticketsData });
    }
  }, [ticketsData, pageNumber]);
  
  // Função para carregar mais tickets (paginação)
  const handleLoadMore = useCallback(() => {
    if (hasMore && !ticketsLoading) {
      setPageNumber(prev => prev + 1);
    }
  }, [hasMore, ticketsLoading]);

  // Socket listeners igual ao original
  useEffect(() => {
    if (!socket || !user?.companyId) return;
    const companyId = user.companyId;

    const onCompanyTicket = (data) => {
      if (data.action === "update" && data.ticket && data.ticket.status === tabOpen) {
        dispatch({ type: "UPDATE_TICKET", payload: data.ticket });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }
    };

    const onCompanyAppMessage = (data) => {
      if (data.action === "create" && data.ticket && data.ticket.status === tabOpen) {
        dispatch({ type: "UPDATE_TICKET_UNREAD_MESSAGES", payload: data.ticket });
      }
    };

    const onConnect = () => {
      socket.emit("joinTickets", tabOpen);
    };

    socket.on("connect", onConnect);
    socket.on(`company-${companyId}-ticket`, onCompanyTicket);
    socket.on(`company-${companyId}-appMessage`, onCompanyAppMessage);

    if (socket.connected) {
      socket.emit("joinTickets", tabOpen);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off(`company-${companyId}-ticket`, onCompanyTicket);
      socket.off(`company-${companyId}-appMessage`, onCompanyAppMessage);
      socket.emit("leaveTickets", tabOpen);
    };
  }, [socket, tabOpen, user?.companyId]);

  // Mapeamento de nomes de status para códigos da API
  const statusMap = {
    'Atendendo': 'open',
    'Esperando': 'pending', 
    'Finalizado': 'closed',
    'Grupos': 'group'
  };

  // Função para determinar se um tab deve mostrar tickets baseado nos filtros aplicados
  const shouldShowTicketsInTab = (currentTabStatus) => {
    // Se não há filtro de status aplicado, mostrar em todos os tabs
    if (appliedStatuses.length === 0) {
      return true;
    }
    
    // Se há filtro de status, só mostrar no tab correspondente
    const targetStatuses = appliedStatuses.map(s => statusMap[s] || s);
    return targetStatuses.includes(currentTabStatus);
  };

  // Filtrar tickets por status - com lógica inteligente de filtros
  const tickets = ticketsList.filter(ticket => {
    // Primeiro filtrar por status da aba
    const matchesStatus = ticket.status === tabOpen;
    
    // Depois aplicar lógica inteligente de filtros
    const shouldShowInThisTab = shouldShowTicketsInTab(tabOpen);
    
    return matchesStatus && shouldShowInThisTab;
  });

  // Log dos tickets filtrados finais
  
  // Contar tickets
  const counts = {
    pending: ticketsList.filter(t => t.status === 'pending').length,
    open: ticketsList.filter(t => t.status === 'open').length
  };

  // Função para refresh
  const refreshTicketsList = () => {
    setForceRefresh(prev => prev + 1);
  };

  // Função para aceitar ticket
  const acceptTicket = async (ticketId, queueId) => {
    try {
      const res = await api.put(`/tickets/${ticketId}`, {
        status: 'open',
        userId: user?.id,
        queueId: queueId
      });
      
      dispatch({ type: "DELETE_TICKET", payload: ticketId });
      
      return res.data;
    } catch (err) {
      console.error('❌ Error accepting:', err);
      throw err;
    }
  };
  
  
  
  // Contexto do drawer
  const { drawerOpen, setDrawerOpen } = useDrawerControl();
  const [originalDrawerState, setOriginalDrawerState] = useState(null);
  
  // Função para forçar refresh dos tickets
  const forceTicketsRefresh = useCallback(() => {
    refreshTicketsList();
  }, [refreshTicketsList]);

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

  // Funções para carregar opções das APIs
  const loadTagsOptions = useCallback(async () => {
    try {
      const { data } = await api.get('/tags/list', { params: { kanban: 0 } });
      setTagsData(data); // Salvar dados completos
      setTagsOptions(data.map(tag => tag.name)); // Para UI
    } catch (err) {
      console.error('Erro ao carregar tags:', err);
      setTagsData([]);
      setTagsOptions([]);
    }
  }, []);

  const loadConnectionsOptions = useCallback(async () => {
    try {
      const { data } = await api.get('/whatsapp');
      setConnectionsData(data); // Salvar dados completos
      setConnectionsOptions(data.map(conn => conn.name)); // Para UI
    } catch (err) {
      console.error('Erro ao carregar conexões:', err);
      setConnectionsData([]);
      setConnectionsOptions([]);
    }
  }, []);

  const loadUsersOptions = useCallback(async () => {
    try {
      const { data } = await api.get('/users/list');
      setUsersData(data); // Salvar dados completos
      setUsersOptions(data.map(user => user.name)); // Para UI
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setUsersData([]);
      setUsersOptions([]);
    }
  }, []);

  // Carregar opções ao abrir os filtros
  useEffect(() => {
    if (showFilters) {
      loadTagsOptions();
      loadConnectionsOptions();
      if (user?.profile === "admin") {
        loadUsersOptions();
      }
    }
  }, [showFilters, loadTagsOptions, loadConnectionsOptions, loadUsersOptions, user?.profile]);



  // Função para determinar se um tab deve mostrar tickets baseado nos filtros aplicados

  // Função para aplicar filtros selecionados (sem fechar sidebar)
  const handleApplyFilters = () => {
    console.log('🎯 ===== APLICANDO FILTROS =====');
    console.log('📝 Tags selecionadas:', selectedTags);
    console.log('📝 Connections selecionadas:', selectedConnections);
    console.log('📝 Status selecionados:', selectedStatuses);
    console.log('📝 Users selecionados:', selectedUsers);
    
    // Copiar seleções para estados aplicados
    setAppliedTags([...selectedTags]);
    setAppliedConnections([...selectedConnections]);
    setAppliedStatuses([...selectedStatuses]);
    setAppliedUsers([...selectedUsers]);
    
    console.log('✅ Filtros aplicados!');
    
    // Trigger refresh (sem fechar sidebar)
    setRefreshTickets(prev => !prev);
  };

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    // Limpar tanto selecionados quanto aplicados
    setSelectedTags([]);
    setSelectedConnections([]);
    setSelectedStatuses([]);
    setSelectedUsers([]);
    setAppliedTags([]);
    setAppliedConnections([]);
    setAppliedStatuses([]);
    setAppliedUsers([]);
    setRefreshTickets(prev => !prev);
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
                  options={tagsOptions}
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
                  options={connectionsOptions}
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
                  options={statusOptions}
                  value={selectedStatuses}
                  onChange={setSelectedStatuses}
                />
              </Box>

              {/* Usuário Dropdown */}
              {user?.profile === "admin" && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 600, fontSize: '14px' }}>
                    Usuário
                  </Typography>
                  <FilterDropdown 
                    placeholder="Selecionar usuário..."
                    options={usersOptions}
                    value={selectedUsers}
                    onChange={setSelectedUsers}
                  />
                </Box>
              )}

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
                onClick={clearAllFilters}
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
                onClick={handleApplyFilters}
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

              {/* Search and Filters Component */}
              <SearchAndFilters 
                searchParam={searchParam}
                handleSearch={handleSearch}
                showSortOptions={showSortOptions}
                setShowSortOptions={setShowSortOptions}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onFilterToggle={handleFilterToggle}
              />

              {/* Tabs Component */}
              <ChatTabs 
                showAllTickets={showAllTickets}
                setShowAllTickets={setShowAllTickets}
                tabCounts={tabCounts}
                setTabCounts={setTabCounts}
              />
            </CardHeader>
            
            
            <CardContent sx={{ 
              flex: 1, 
              p: 0, 
              overflow: 'hidden',
              minHeight: 0
            }}>
              {ticketsLoading ? (
                <Box sx={{ p: 2, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Carregando conversas...
                </Box>
              ) : (
                <TicketsList 
                  tickets={tickets}
                  tabOpen={tabOpen}
                  selectedChatId={selectedChatId}
                  openChat={openChat}
                  currentTab={tabOpen}
                  onRefresh={refreshTickets}
                  onAccept={acceptTicket}
                  pinnedConversations={pinnedConversations}
                  handlePinConversation={handlePinConversation}
                  hasMore={hasMore}
                  loading={ticketsLoading}
                  onLoadMore={handleLoadMore}
                />
              )}
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