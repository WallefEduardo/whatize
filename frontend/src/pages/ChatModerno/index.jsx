import React, { useState, useEffect, useRef, useCallback, useReducer, useContext, useMemo } from 'react';
import { Box, Typography, useMediaQuery, useTheme, TextField, Tooltip } from '@mui/material';
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
import ChatHeader from './components/ChatHeader';
import MessageItem from '../Chat/components/MessageItem';
import MessageInput from '../Chat/components/MessageInput';
import ConversationInfo from '../Chat/components/ConversationInfo';
import FilterDropdown from '../../components/ui/FilterDropdown';
import MessageSearchPanel from './components/MessageSearchPanel';
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
  isObjectNotEmpty,
  isSameDay
} from '../Chat/data/mockData';

// API real para mensagens
import api from '../../services/api';
import toastError from '../../errors/toastError';

// Context API do sistema original
import { ReplyMessageProvider, ReplyMessageContext } from '../../context/ReplyingMessage/ReplyingMessageContext';
import { ForwardMessageProvider, ForwardMessageContext } from '../../context/ForwarMessage/ForwardMessageContext';
import { EditMessageProvider, EditMessageContext } from '../../context/EditingMessage/EditingMessageContext';
import DeleteMessageModal from '../../components/DeleteMessageModal';
import ModernForwardMessageModal from '../../components/ForwardMessageModal/ModernForwardMessageModal';

// Hook de tickets do sistema original
import useTickets from '../../hooks/useTickets';

// Componentes auxiliares
import NewConversationModal from '../../components/ui/NewConversationModal';
import ChatTabs from './components/ChatTabs';
import SearchAndFilters from './components/SearchAndFilters';
import TicketsList from './components/TicketsList';
import ResolverTicketModal from '../../components/ResolverTicketModal';

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
import CheckBoxIcon from '@mui/icons-material/CheckBox';

// Componente memoizado para itens da fila
const QueueDropdownItem = React.memo(({ queue, isSelected, onToggle }) => {
  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        onToggle(queue.id);
      }}
      sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        fontSize: '13px',
        '&:hover': {
          backgroundColor: 'var(--bg-secondary)',
        }
      }}
    >
      {/* Checkbox customizado */}
      <Box
        sx={{
          width: '16px',
          height: '16px',
          borderRadius: '3px',
          border: `2px solid ${queue.color}`,
          backgroundColor: isSelected ? queue.color : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 1.5,
          transition: 'all 0.2s ease',
        }}
      >
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </Box>

      {/* Nome da fila */}
      <Box sx={{ color: 'var(--text-primary)', fontSize: '13px' }}>
        {queue.name}
      </Box>
    </Box>
  );
});

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

const MessageArea = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSearchOpen',
})(({ theme, isSearchOpen }) => ({
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  minHeight: 0,
  height: '100%',
  // Ajustar largura quando painel de busca estiver aberto
  width: isSearchOpen ? 'calc(100% - 320px)' : '100%',
  transition: 'width 0.2s ease-in-out',

  // No mobile, manter largura total (painel fica em overlay)
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
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

// Componente interno que tem acesso ao ReplyMessageContext
const ChatModernoContent = () => {
  // Parâmetros da rota
  const { ticketId } = useParams();
  const history = useHistory();
  
  // Context
  const { user, socket, updateUser } = React.useContext(AuthContext);
  const { tabOpen, setTabOpen, currentTicket, setCurrentTicket } = React.useContext(TicketsContext);
  const { replyingMessage, setReplyingMessage } = useContext(ReplyMessageContext);
  const { 
    showSelectMessageCheckbox,
    setShowSelectMessageCheckbox,
    selectedMessages,
    setSelectedMessages,
    forwardMessageModalOpen,
    setForwardMessageModalOpen 
  } = useContext(ForwardMessageContext);
  
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
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isForward, setIsForward] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // 🔍 Estados para busca de mensagens
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  // 🎯 Estado para modal de finalizar conversa
  const [showCloseTicketModal, setShowCloseTicketModal] = useState(false);
  
  // 🚀 Estados otimistas para mensagens instantâneas
  const [optimisticMessages, setOptimisticMessages] = useState(new Map());
  const [messageQueue, setMessageQueue] = useState(new Map());
  const tempIdCounter = useRef(0);

  // 🚀 OTIMIZAÇÃO: Set para verificação rápida de duplicatas (O(1))
  const [messageIds, setMessageIds] = useState(new Set());

  // 🚀 Estados para setinha de scroll e contador de mensagens novas
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [lastSeenMessageId, setLastSeenMessageId] = useState(null);
  
  // Estado para modal de deletar mensagem
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  
  // Estados para encaminhar mensagem
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  
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

  // Estados do filtro de filas
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [showQueueFilter, setShowQueueFilter] = useState(false);
  
  // Estados dos filtros salvos
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState('');

  // 🎭 Estado para gerenciar reações de todas as mensagens
  const [messageReactions, setMessageReactions] = useState({});
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
  const [showClosedTickets, setShowClosedTickets] = useState(false);
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
  const [searchOnMessages, setSearchOnMessages] = useState(false);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  
  // Estado do modal de nova conversa
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Função para salvar as preferências de fila no banco
  const saveQueuePreferences = useCallback(async (queueIds) => {
    if (!user?.id) return;

    try {
      const { data } = await api.put(`/users/${user.id}/selected-queues`, {
        selectedQueueIds: queueIds
      });

      // Atualizar o contexto do usuário com os dados atualizados
      if (data && typeof updateUser === 'function') {
        updateUser(data);
      }
    } catch (err) {
      console.error('Erro ao salvar preferências de filas:', err);
      toastError(err);
    }
  }, [user?.id, updateUser]);

  // Função debounced para salvar preferências (300ms)
  const debouncedSaveQueuePreferences = useCallback(
    (() => {
      let timeoutId;
      return (queueIds) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          saveQueuePreferences(queueIds);
        }, 300);
      };
    })()
  , [saveQueuePreferences]);

  // Funções de manipulação do filtro de filas
  const handleQueueToggle = useCallback(async (queueId) => {
    let newSelectedQueueIds;
    if (selectedQueueIds.includes(queueId)) {
      newSelectedQueueIds = selectedQueueIds.filter(id => id !== queueId);
    } else {
      newSelectedQueueIds = [...selectedQueueIds, queueId];
    }

    setSelectedQueueIds(newSelectedQueueIds);
    debouncedSaveQueuePreferences(newSelectedQueueIds);
    setRefreshTickets(prev => !prev);
  }, [selectedQueueIds, debouncedSaveQueuePreferences, setRefreshTickets]);

  const handleSelectAllQueues = useCallback(async () => {
    const allQueueIds = user?.queues?.map(queue => queue.id) || [];
    setSelectedQueueIds(allQueueIds);
    // Para "Selecionar Todas" usar chamada imediata (sem debounce)
    await saveQueuePreferences(allQueueIds);
    setRefreshTickets(prev => !prev);
  }, [user?.queues, saveQueuePreferences, setRefreshTickets]);

  const handleClearAllQueues = useCallback(async () => {
    setSelectedQueueIds([]);
    // Para "Desmarcar Todas" usar chamada imediata (sem debounce)
    await saveQueuePreferences([]);
    setRefreshTickets(prev => !prev);
  }, [selectedQueueIds, saveQueuePreferences, setRefreshTickets]);

  // Estado para paginação
  const [pageNumber, setPageNumber] = useState(1);

  // Debounce otimizado: mais rápido para busca normal, mais lento para busca em mensagens
  useEffect(() => {
    // Timing inteligente baseado no tipo de busca
    const debounceTime = searchOnMessages ? 500 : 200;

    const timer = setTimeout(() => {
      setDebouncedSearchParam(searchParam);
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [searchParam, searchOnMessages]);

  // Cancelamento refinado - só cancela quando mudança real na busca
  useEffect(() => {
    // Só cancelar se houver busca ativa com parâmetros
    if (debouncedSearchParam && searchControllerRef.current) {
      searchControllerRef.current.abort();
    }

    // Criar controller só para buscas com parâmetros
    if (debouncedSearchParam) {
      searchControllerRef.current = new AbortController();
    }

    return () => {
      // Cleanup apenas se houver busca
      if (debouncedSearchParam && searchControllerRef.current) {
        searchControllerRef.current.abort();
      }
    };
  }, [debouncedSearchParam, searchOnMessages]); // Removido selectedQueueIds
  

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

  // Carregar preferências de filas do usuário
  useEffect(() => {
    if (user && user.queues) {
      const userQueueIds = user.queues.map(q => q.id);

      if (user.selectedQueueIds !== undefined && user.selectedQueueIds !== null) {
        // Se o usuário tem preferências salvas (mesmo que seja array vazio), usar elas
        setSelectedQueueIds(user.selectedQueueIds);
      } else {
        // Se nunca foi salvo (undefined/null), usar todas as filas do usuário
        setSelectedQueueIds(userQueueIds);
      }
    }
  }, [user?.id, user?.queues]);
  
  // Refs
  const messagesEndRef = useRef(null);
  const chatHeightRef = useRef(null);
  const searchControllerRef = useRef(null);
  
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

  // 🚀 CACHE INTELIGENTE: Armazena tickets por status para evitar requisições HTTP
  const ticketsCache = useRef({
    open: [],
    pending: [],
    closed: [],
    lastFetch: {},
    isLoading: false
  });

  // 🚀 CACHE ESTRATÉGIA: Determina se precisa fazer nova requisição
  const shouldFetchFromAPI = useCallback((status) => {
    const cache = ticketsCache.current;
    const lastFetch = cache.lastFetch[status];
    const cacheAge = lastFetch ? Date.now() - lastFetch : Infinity;
    const CACHE_DURATION = 30000; // 30 segundos de cache

    return !cache[status]?.length || cacheAge > CACHE_DURATION;
  }, []);

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

  // Memoizar queueIds para evitar loop infinito - usar filas selecionadas ou todas
  const queueIds = useMemo(() => {
    // Se temos filas selecionadas, usar elas. Senão usar todas as filas do usuário
    const targetQueues = selectedQueueIds.length > 0 ? selectedQueueIds : (user?.queues?.map(q => q.id) || []);
    return JSON.stringify(targetQueues);
  }, [selectedQueueIds, user?.queues]);
  
  // Buscar tickets usando o hook original
  const ticketParams = {
    searchParam: debouncedSearchParam,
    pageNumber: pageNumber,
    status: showClosedTickets ? 'closed' : tabOpen,
    showAll: showClosedTickets ? true : showAllTickets, // Forçar showAll=true para tickets fechados
    queueIds: queueIds,
    // Parâmetros de filtros aplicados (usando versões memoizadas)
    tags: tagIds,
    users: userIds,
    whatsappIds: connectionIds,
    // Status filter NÃO enviado para API (controlado localmente via shouldShowTicketsInTab)
    forceSearch: refreshTickets,
    searchOnMessages: searchOnMessages
  };

  // Debug removido - testando correção

  const { tickets: ticketsData, loading: ticketsLoading, hasMore } = useTickets(ticketParams);


  // Loading state específico para busca em mensagens
  useEffect(() => {
    if (searchOnMessages && debouncedSearchParam && ticketsLoading) {
      setIsSearchingMessages(true);
    } else {
      setIsSearchingMessages(false);
    }
  }, [searchOnMessages, debouncedSearchParam, ticketsLoading]);

  // 🚀 DEBOUNCE SELETIVO: Separar operações instantâneas das que precisam delay

  // Resetar APENAS para parâmetros que exigem nova busca na API
  useEffect(() => {
    setPageNumber(1);
    dispatch({ type: "RESET" });
  }, [debouncedSearchParam, appliedTags, appliedConnections, appliedStatuses, appliedUsers, selectedQueueIds, searchOnMessages]);

  // Reset INSTANTÂNEO para mudanças locais (sem delay de rede)
  useEffect(() => {
    if (showClosedTickets) {
      setPageNumber(1);
      dispatch({ type: "RESET" });
    }
  }, [showClosedTickets]);

  // Reset INSTANTÂNEO para mudança de aba
  useEffect(() => {
    if (!showClosedTickets) {
      setPageNumber(1);
      dispatch({ type: "RESET" });
    }
  }, [tabOpen, showAllTickets]);

  // 🚀 CARREGAR TICKETS NO REDUCER + ATUALIZAR CACHE
  useEffect(() => {
    if (ticketsData) {
      // Para página 1: RESET e carrega. Para páginas > 1: apenas adiciona
      if (pageNumber === 1) {
        dispatch({ type: "RESET" });
      }
      dispatch({ type: "LOAD_TICKETS", payload: ticketsData });

      // 🚀 ATUALIZAR CACHE: Separar tickets por status para cache inteligente
      const cache = ticketsCache.current;
      const currentStatus = showClosedTickets ? 'closed' : tabOpen;

      if (pageNumber === 1) {
        // Nova busca - substitui cache completamente
        cache[currentStatus] = [...ticketsData];
      } else {
        // Paginação - adiciona ao cache existente
        const existing = cache[currentStatus] || [];
        const newTickets = ticketsData.filter(newTicket =>
          !existing.some(existing => existing.id === newTicket.id)
        );
        cache[currentStatus] = [...existing, ...newTickets];
      }

      // Marcar timestamp da última busca
      cache.lastFetch[currentStatus] = Date.now();
    }
  }, [ticketsData, pageNumber, showClosedTickets, tabOpen]);
  
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
      if (data.action === "update" && data.ticket) {
        // Aceitar updates de reação (lastMessage contém "Você reagiu") ou status igual à aba
        const isReactionUpdate = data.ticket.lastMessage?.includes("Você reagiu");
        const isStatusMatch = data.ticket.status === tabOpen;

        if (isReactionUpdate || isStatusMatch) {
          dispatch({ type: "UPDATE_TICKET", payload: data.ticket });
        }
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }
    };

    const onCompanyAppMessage = (data) => {
      // 🚀 RECONCILIAÇÃO OTIMISTA INTELIGENTE
      if (data.action === "create" && data.message) {
        // Verificar se é mensagem que estava pendente (reconciliação)
        const tempMessage = findOptimisticByContent(data.message.body);
        if (tempMessage) {
          // Substituir otimista por mensagem real
          replaceOptimisticMessage(tempMessage.id, data.message);
          
          // Atualizar lista de mensagens real (se for o chat atual)
          if (data.message.ticketId?.toString() === selectedChatId?.toString()) {
            // 🚀 OTIMIZAÇÃO: Verificação rápida de duplicatas com Set (O(1))
            if (!messageIds.has(data.message.id)) {
              setMessages(prev => [...prev, data.message].sort((a, b) =>
                new Date(a.createdAt) - new Date(b.createdAt)
              ));
              setMessageIds(prev => new Set([...prev, data.message.id]));
            }
          }
        } else if (data.message.ticketId?.toString() === selectedChatId?.toString()) {
          // 📨 MENSAGEM NOVA de outro usuário
          // 🚀 OTIMIZAÇÃO: Verificação rápida de duplicatas com Set (O(1))
          if (!messageIds.has(data.message.id)) {
            setMessages(prev => [...prev, data.message].sort((a, b) =>
              new Date(a.createdAt) - new Date(b.createdAt)
            ));
            setMessageIds(prev => new Set([...prev, data.message.id]));

            // 🚀 INCREMENTAR CONTADOR se usuário não está no final da conversa
            if (isScrolledUp && !data.message.fromMe) {
              setNewMessagesCount(prev => prev + 1);
            }
          }
        }
      }

      // Tratamento para mensagens atualizadas (incluindo deletadas)
      if (data.action === "update" && data.message) {

        // ✅ FILTRO: Ignorar reações - não são updates de mensagens normais
        if (data.message.mediaType === "reactionMessage") {
          return;
        }

        // ✅ FILTRO ADICIONAL: Ignorar mensagens que são reações baseadas no conteúdo
        if (data.message.reactionMessage || data.message.body === "reaction") {
          return;
        }


        // Verificar se deve atualizar a mensagem no chat atual
        if (data.message.ticketId?.toString() === selectedChatId?.toString()) {
          setMessages(prev => {
            const updatedMessages = prev.map(msg => {
              const isMatch = msg.id === data.message.id ||
                             msg.id.toString() === data.message.id.toString() ||
                             Number(msg.id) === Number(data.message.id);

              if (isMatch) {
                // 🎯 MERGE INTELIGENTE: Preservar dados do usuário da mensagem local
                const updatedMessage = {
                  ...msg,
                  ...data.message,
                  // Preservar user se a mensagem local tiver dados completos
                  user: msg.user && msg.user.profileImage ? msg.user : data.message.user
                };
                // Forçar re-render atualizando também um timestamp para garantir detecção de mudança
                updatedMessage._lastUpdated = Date.now();
                return updatedMessage;
              }
              return msg;
            });

            // 🎯 IMPORTANTE: Verificar se houve mudança real para forçar re-render
            const hasChanges = updatedMessages.some((msg, index) => {
              const original = prev[index];
              return !original || msg._lastUpdated !== original._lastUpdated;
            });

            return hasChanges ? [...updatedMessages] : prev;
          });
        }

        // Remover das mensagens otimistas se existir
        removeOptimisticMessage(data.message.id);
      }

      // Tratamento para mensagens deletadas
      if (data.action === "delete" && data.message) {
        if (data.message.ticketId?.toString() === selectedChatId?.toString()) {
          setMessages(prev => 
            prev.filter(msg => msg.id !== data.message.id)
          );
        }
        
        // Remover das mensagens otimistas se existir
        removeOptimisticMessage(data.message.id);
        
        // Remover das mensagens fixadas se existir
        setPinnedMessages(prev => 
          prev.filter(msg => msg.id !== data.message.id)
        );
      }
      
      // Manter lógica original para tickets
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

  // useEffect para joinChatBox quando seleciona conversa específica
  useEffect(() => {
    if (!socket || !selectedChatId) return;

    socket.emit("joinChatBox", selectedChatId.toString());

    return () => {
      socket.emit("joinChatBoxLeave", selectedChatId.toString());
    };
  }, [socket, selectedChatId]);

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

  // 🚀 SINGLE-PASS FILTER: Filtro + contadores em uma única passada (3x mais eficiente)
  const { tickets, counts } = useMemo(() => {
    const cache = ticketsCache.current;
    const targetStatus = showClosedTickets ? 'closed' : tabOpen;

    // 🚀 CACHE HIT: Usar dados do cache se disponível e fresco
    const cachedTickets = cache[targetStatus];
    const lastFetch = cache.lastFetch[targetStatus];
    const isRecent = lastFetch && (Date.now() - lastFetch < 30000);

    let sourceTickets = ticketsList;
    if (showClosedTickets && cachedTickets?.length && isRecent) {
      sourceTickets = cachedTickets;
    }

    // 🚀 SINGLE PASS: Filtrar E contar simultaneamente (O(n) ao invés de O(3n))
    return sourceTickets.reduce((acc, ticket) => {
      // Contar todos os tickets por status (sempre fazer isso)
      if (ticket.status === 'pending') acc.counts.pending++;
      if (ticket.status === 'open') acc.counts.open++;

      // Filtrar para a lista visível
      const matchesStatus = showClosedTickets ?
        ticket.status === 'closed' :
        ticket.status === tabOpen;

      const shouldShowInThisTab = shouldShowTicketsInTab(tabOpen);

      if (matchesStatus && shouldShowInThisTab) {
        acc.tickets.push(ticket);
      }

      return acc;
    }, {
      tickets: [],
      counts: { pending: 0, open: 0 }
    });
  }, [ticketsList, showClosedTickets, tabOpen, appliedStatuses]);

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

  // 🚀 FUNÇÕES OTIMISTAS ULTRA-PERFORMÁTICAS
  
  // Gerador de IDs únicos para mensagens temporárias  
  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${++tempIdCounter.current}_${user?.id || 'unknown'}`;
  }, [user?.id]);

  // Atualizar status de mensagem otimista
  const updateOptimisticStatus = useCallback((tempId, newAck) => {
    setOptimisticMessages(prev => {
      const updated = new Map(prev);
      const message = updated.get(tempId);
      if (message) {
        updated.set(tempId, { ...message, ack: newAck });
      }
      return updated;
    });
  }, []);

  // Substituir mensagem otimista por real do servidor
  const replaceOptimisticMessage = useCallback((tempId, realMessage) => {
    setOptimisticMessages(prev => {
      const updated = new Map(prev);
      const optimisticMessage = prev.get(tempId);

      // 🎯 PRESERVAR dados do usuário da mensagem otimista
      if (optimisticMessage && optimisticMessage.user) {
        // Merge inteligente: usar dados do servidor + preservar user da otimista
        const mergedMessage = {
          ...realMessage,
          user: optimisticMessage.user // Preservar dados completos do usuário
        };

        // Se a mensagem real também tem user mas sem dados completos, fazer merge
        if (realMessage.user) {
          mergedMessage.user = {
            ...optimisticMessage.user,
            ...realMessage.user,
            // Garantir que campos essenciais são preservados
            profileImage: optimisticMessage.user.profileImage || realMessage.user.profileImage,
            companyId: optimisticMessage.user.companyId || realMessage.user.companyId
          };
        }

        // Atualizar a mensagem real no array principal
        setMessages(prev => prev.map(msg =>
          msg.id === realMessage.id ? mergedMessage : msg
        ));
      }

      updated.delete(tempId);
      return updated;
    });
  }, []);

  // Remover mensagem otimista (para deleteMessage)
  const removeOptimisticMessage = useCallback((messageId) => {
    setOptimisticMessages(prev => {
      const updated = new Map(prev);
      // Verificar se existe uma mensagem otimista com esse ID real
      for (const [tempId, message] of prev.entries()) {
        if (message.id === messageId) {
          updated.delete(tempId);
          break;
        }
      }
      return updated;
    });
  }, []);

  // Encontrar mensagem otimista por conteúdo (para reconciliação)
  const findOptimisticByContent = useCallback((bodyContent) => {
    for (const [tempId, message] of optimisticMessages.entries()) {
      if (message.body === bodyContent && message.fromMe) {
        return { id: tempId, ...message };
      }
    }
    return null;
  }, [optimisticMessages]);

  // 🚀 OTIMIZAÇÃO: Função pura não precisa de useCallback (Risco Zero)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 🎭 FUNÇÕES PARA GERENCIAR REAÇÕES
  const addReactionToMessage = useCallback((messageId, reaction) => {
    setMessageReactions(prev => {
      const currentReactions = prev[messageId] || [];
      return {
        ...prev,
        [messageId]: [...currentReactions, reaction]
      };
    });
  }, []);

  const getMessageReactions = useCallback((messageId) => {
    return messageReactions[messageId] || [];
  }, [messageReactions]);

  // 🚀 BACKGROUND PROCESSING COM RETRY INTELIGENTE
  const sendToBackend = useCallback(async (tempId, messageText, quotedMessage = null) => {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Atualizar para "enviando" se ainda não foi  
        if (attempt === 0) {
          updateOptimisticStatus(tempId, 0);
        }
        
        const messageData = {
          read: 1,
          fromMe: true,
          mediaUrl: "",
          body: messageText.trim(),
          quotedMsg: quotedMessage, // Incluir mensagem citada se existir
          isPrivate: "false"
        };
        
        const response = await api.post(`/messages/${selectedChatId}`, messageData);
        
        // ✅ SUCESSO: Atualizar status para enviado
        updateOptimisticStatus(tempId, 1);
        
        // Remover da queue de pendentes
        setMessageQueue(prev => {
          const updated = new Map(prev);
          updated.delete(tempId);
          return updated;
        });
        
        // Recarregar mensagens para ver a nova mensagem real
        setTimeout(() => {
          if (selectedChatId) {
            api.get(`/messages/${selectedChatId}`)
              .then(response => {
                const messagesData = response.data.messages || [];
                setMessages(Array.isArray(messagesData) ? messagesData : []);
                
                // Tentar reconciliar com mensagem otimista
                const realMessage = messagesData.find(msg => 
                  msg.body === messageText.trim() && 
                  msg.fromMe && 
                  new Date(msg.createdAt).getTime() > Date.now() - 10000
                );
                
                if (realMessage) {
                  replaceOptimisticMessage(tempId, realMessage);
                }
              })
              .catch(error => console.error('Erro ao recarregar mensagens:', error));
          }
        }, 500);
        
        return;
        
      } catch (error) {
        attempt++;
        
        if (attempt >= maxRetries) {
          // ❌ FALHA FINAL: Marcar como erro
          updateOptimisticStatus(tempId, -1);
          
          // Manter na queue para retry manual futuro
          setMessageQueue(prev => {
            const updated = new Map(prev);
            updated.set(tempId, { 
              messageText, 
              status: 'failed', 
              lastAttempt: Date.now() 
            });
            return updated;
          });
        } else {
          // ⏳ RETRY: Aguardar com backoff exponencial  
          const delay = 1000 * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }
  }, [selectedChatId, updateOptimisticStatus, replaceOptimisticMessage, sleep]);

  // 🚀 RETRY MANUAL para mensagens com erro (APÓS sendToBackend)
  const retryFailedMessage = useCallback((tempId) => {
    const message = optimisticMessages.get(tempId);
    const queueItem = messageQueue.get(tempId);
    
    if (message && queueItem && message.ack === -1) {
      // Voltar status para "enviando"
      updateOptimisticStatus(tempId, 0);
      
      // Atualizar queue
      setMessageQueue(prev => new Map(prev.set(tempId, {
        ...queueItem,
        status: 'retrying',
        lastAttempt: Date.now()
      })));
      
      // Reenviar
      sendToBackend(tempId, message.body, message.quotedMsg).catch(error => {
        console.error('Erro no retry manual:', error);
      });
    }
  }, [optimisticMessages, messageQueue, updateOptimisticStatus, sendToBackend]);

  // Handler para busca otimizada
  const handleSearch = useCallback((event) => {
    const searchTerm = event.target.value;
    setSearchParam(searchTerm);
  }, []);

  // 🔍 Handlers para busca de mensagens
  const handleMessageSearchToggle = useCallback(() => {
    setIsMessageSearchOpen(prev => !prev);
  }, []);

  const handleMessageSearchClose = useCallback(() => {
    setIsMessageSearchOpen(false);
    setHighlightedMessageId(null);
  }, []);

  // 🔄 Fechar painel de busca automaticamente ao trocar de conversa
  useEffect(() => {
    if (isMessageSearchOpen) {
      setIsMessageSearchOpen(false);
      setHighlightedMessageId(null);
    }
  }, [selectedChatId]); // Executa sempre que trocar de conversa

  const handleMessageClick = useCallback((message) => {
    // Destacar a mensagem
    setHighlightedMessageId(message.id);

    // 🎯 Usar a mesma lógica do reply/scroll existente
    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Remover highlight após alguns segundos
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    } else {
      console.warn('🔍 Mensagem não encontrada no DOM:', message.id);
    }
  }, []);

  // 🎯 Handler para abrir modal de resolver conversa (igual ao dropdown)
  const handleResolveTicket = useCallback(() => {
    setShowCloseTicketModal(true);
  }, []);

  // 🎯 Handler para resolver COM mensagem de despedida
  const handleResolverComMensagem = useCallback(async () => {
    if (!selectedChatId) return;

    try {
      await api.put(`/tickets/${selectedChatId}`, {
        status: 'closed',
        sendFarewellMessage: true
      });

      // Fechar modal
      setShowCloseTicketModal(false);

      // Refresh da lista de tickets
      forceTicketsRefresh();

      console.log('Conversa resolvida com mensagem de despedida');
    } catch (error) {
      console.error('Erro ao resolver com mensagem:', error);
    }
  }, [selectedChatId, forceTicketsRefresh]);

  // 🎯 Handler para resolver SEM mensagem de despedida
  const handleResolverSemMensagem = useCallback(async () => {
    if (!selectedChatId) return;

    try {
      await api.put(`/tickets/${selectedChatId}`, {
        status: 'closed',
        sendFarewellMessage: false
      });

      // Fechar modal
      setShowCloseTicketModal(false);

      // Refresh da lista de tickets
      forceTicketsRefresh();

      console.log('Conversa resolvida sem mensagem de despedida');
    } catch (error) {
      console.error('Erro ao resolver sem mensagem:', error);
    }
  }, [selectedChatId, forceTicketsRefresh]);

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
  
  
  // Scroll to bottom - Método mais robusto
  const scrollToBottom = useCallback(() => {
    // Método 1: Usar messagesEndRef (mais confiável)
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
      return;
    }
    
    // Método 2: Fallback usando chatHeightRef
    if (chatHeightRef.current) {
      const scrollElement = chatHeightRef.current.querySelector('[data-scrollable]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, []);

  // Scroll para mensagem específica (reply click)
  const scrollToMessage = useCallback((messageId) => {
    if (!messageId) return;
    
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Destacar mensagem temporariamente
      messageElement.style.backgroundColor = 'var(--hover-bg-medium)';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
  }, []);

  // 🚀 SCROLL INTELIGENTE QUANDO EU ENVIO MENSAGEM
  const scrollToBottomOnSend = useCallback(() => {
    const forceScrollToBottom = () => {
      // Método 1: Usar messagesEndRef direto
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }
      
      // Método 2: Scroll direto no container
      if (chatHeightRef.current) {
        const scrollElement = chatHeightRef.current.querySelector('[data-scrollable]');
        if (scrollElement) {
          const maxHeight = scrollElement.scrollHeight;
          
          // Scrolls múltiplos para garantir chegada ao final
          scrollElement.scrollTop = maxHeight;
          scrollElement.scrollTo({
            top: maxHeight,
            behavior: 'smooth'
          });
          
          // Garantir scroll final com requestAnimationFrame
          requestAnimationFrame(() => {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          });
          
          return scrollElement.scrollHeight;
        }
      }
      return 0;
    };
    
    // Execução imediata
    forceScrollToBottom();
    
    // Retry inteligente para lidar com renderização assíncrona
    [50, 100, 200, 500].forEach((delay) => {
      setTimeout(() => {
        forceScrollToBottom();
      }, delay);
    });
  }, []);

  // 🚀 RENDERING HÍBRIDO - Mesclar mensagens reais com otimistas
  const allMessages = useMemo(() => {
    const realMessages = messages || [];
    const optimisticArray = Array.from(optimisticMessages.values());
    
    // Combinar mensagens reais com otimistas
    const combined = [...realMessages, ...optimisticArray]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    return combined;
  }, [messages, optimisticMessages]);

  // 🚀 DETECÇÃO DE SCROLL OTIMIZADA
  const handleScroll = useCallback(() => {    
    if (chatHeightRef.current) {
      let scrollElement = null;
      
      // Encontrar elemento com scroll real
      const allElements = chatHeightRef.current.querySelectorAll('*');
      const elementsWithScroll = Array.from(allElements).filter(el => {
        const style = getComputedStyle(el);
        return style.overflowY === 'auto' || style.overflowY === 'scroll';
      });
      
      if (elementsWithScroll.length > 0) {
        scrollElement = elementsWithScroll[0];
      }
      
      if (scrollElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        
        // Lógica de detecção de scroll
        const hasScroll = scrollHeight > clientHeight + 10;
        const isAtBottom = hasScroll ? 
          (scrollTop + clientHeight) >= (scrollHeight - 50) : 
          true;
        
        setIsScrolledUp(!isAtBottom);
        
        // Se chegou no final, zerar contador de mensagens novas
        if (isAtBottom) {
          setNewMessagesCount(0);
          if (allMessages.length > 0) {
            const lastMessage = allMessages[allMessages.length - 1];
            setLastSeenMessageId(lastMessage.id);
          }
        }
      }
    }
  }, [allMessages, newMessagesCount]);

  // 🚀 SCROLL PARA BAIXO ao clicar na setinha
  const scrollDownToLatest = useCallback(() => {
    setNewMessagesCount(0);
    scrollToBottomOnSend();
  }, [scrollToBottomOnSend]);

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
      // 🚀 OTIMIZAÇÃO: Limpar Set de IDs quando não há chat selecionado
      setMessageIds(new Set());
      return;
    }
    
    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        // Buscar mensagens reais da API usando o ticketId
        const response = await api.get(`/messages/${selectedChatId}`);
        const messagesData = response.data.messages || [];
        
        // Buscar dados do ticket
        const ticketResponse = await api.get(`/tickets/${selectedChatId}`);
        const ticketData = ticketResponse.data;
        
        // NÃO chamar setCurrentTicket para evitar redirecionamento
        // setCurrentTicket(ticketData); <- REMOVIDO para evitar redirecionamento
        
        // Garantir que messages é sempre um array
        const validMessages = Array.isArray(messagesData) ? messagesData : [];
        setMessages(validMessages);

        // 🚀 OTIMIZAÇÃO: Atualizar Set de IDs para verificação rápida de duplicatas
        setMessageIds(new Set(validMessages.map(msg => msg.id)));

        // Definir contato selecionado baseado no ticket
        if (ticketData?.contact) {
          setSelectedContact({
            id: ticketData.contact.id,
            name: ticketData.contact.name,
            avatar: ticketData.contact.profilePicUrl || ticketData.contact.urlPicture,
            phone: ticketData.contact.number
          });
        }
        
        // 🚀 SCROLL INICIAL ao abrir conversa (após carregar mensagens)
        // Scroll instantâneo sem animação para abertura de conversa
        const scrollToBottomInstant = () => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'instant', 
              block: 'end',
              inline: 'nearest'
            });
          } else if (chatHeightRef.current) {
            const scrollElement = chatHeightRef.current.querySelector('[data-scrollable]');
            if (scrollElement) {
              scrollElement.scrollTop = scrollElement.scrollHeight;
            }
          }
        };
        
        // Múltiplas tentativas para garantir o scroll
        requestAnimationFrame(() => {
          scrollToBottomInstant();
          setTimeout(scrollToBottomInstant, 100);
          setTimeout(scrollToBottomInstant, 300);
        });
        
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
        setSelectedContact(null);
      } finally {
        setMessagesLoading(false);
      }
    };
    
    loadMessages();
  }, [selectedChatId]);

  // 🚀 CONTROLE DE SCROLL INTELIGENTE
  // Scroll automático quando mensagens são carregadas pela primeira vez (conversa aberta)
  useEffect(() => {
    if (messages && messages.length > 0 && !messagesLoading && selectedChatId) {
      // Scroll instantâneo para última mensagem ao abrir conversa
      const scrollToEnd = () => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: 'instant',
            block: 'end',
            inline: 'nearest'
          });
        }
      };
      
      // Múltiplas tentativas com requestAnimationFrame
      requestAnimationFrame(() => {
        scrollToEnd();
        setTimeout(scrollToEnd, 50);
        setTimeout(scrollToEnd, 200);
      });
    }
  }, [messages.length, messagesLoading, selectedChatId]);

  // Handle chat selection
  const openChat = (chatId) => {
    setSelectedChatId(chatId);
    
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

  // 🚀 Handle send message - VERSÃO OTIMISTA INSTANTÂNEA
  const handleSendMessage = async (message) => {
    if (!selectedChatId || !message.trim()) {
      return;
    }
    
    // 🚀 ADIÇÃO INSTANTÂNEA (0ms lag)
    const tempId = generateTempId();
    const tempMessage = {
      id: tempId,
      body: message.trim(),
      fromMe: true,
      ack: 0, // Status: enviando (relógio)
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      mediaUrl: "",
      mediaType: "chat",
      read: false,
      quotedMsg: replyingMessage, // Incluir mensagem sendo respondida
      isPrivate: false,
      user: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
        companyId: user.companyId
      }
    };
    
    // Adicionar instantaneamente à lista otimista
    setOptimisticMessages(prev => new Map(prev.set(tempId, tempMessage)));
    
    // Adicionar à queue de pendentes
    setMessageQueue(prev => new Map(prev.set(tempId, { 
      messageText: message.trim(), 
      status: 'pending',
      createdAt: Date.now()
    })));
    
    
    // 🚀 SCROLL AUTOMÁTICO - Desce pro final quando EU envio
    scrollToBottomOnSend();
    
    // 🚀 ENVIO BACKGROUND ASSÍNCRONO
    sendToBackend(tempId, message.trim(), replyingMessage).catch(error => {
      console.error('Erro no envio background:', error);
    });
  };

  // Handle delete message - Agora abre modal ao invés de deletar diretamente
  const handleDeleteMessage = (messageId) => {
    const message = allMessages.find(msg => msg.id === messageId);
    setMessageToDelete({ id: messageId, text: message?.body || '' });
    setDeleteModalOpen(true);
  };

  // Deletar mensagem (apenas para todos)
  const handleDeleteForAll = async () => {
    if (!messageToDelete) return;
    
    try {
      // Fazer a requisição DELETE para a API (mesma lógica do chat antigo)
      await api.delete(`/messages/${messageToDelete.id}`);
      
      // Remove from pinned messages if exists
      setPinnedMessages(prev => 
        prev.filter(msg => msg.id !== messageToDelete.id)
      );
      
      // Atualizar estado local imediatamente para feedback visual
      setMessages(prev => prev.map(msg => 
        msg.id === messageToDelete.id 
          ? { 
              ...msg, 
              isDeleted: true, 
              originalBody: messageToDelete.text, // Usar o texto original salvo
              deletedForAll: true,               // Flag para tooltip
              body: '🚫 Você apagou esta mensagem' 
            }
          : msg
      ));
      
      // O socket.io vai atualizar automaticamente via listener `appMessage`
      
    } catch (error) {
      console.error('Error deleting message:', error);
      toastError(error);
    }
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

  // Handle forward - ativar modo de seleção estilo WhatsApp
  const handleForward = (messageId) => {
    const message = allMessages.find(msg => msg.id === messageId);
    if (message) {
      // Ativar modo de seleção
      setShowSelectMessageCheckbox(true);
      // Limpar seleções anteriores e selecionar esta mensagem
      setSelectedMessages([message]);
    }
  };

  // Handle scroll to reply message - navegar até mensagem original
  const handleScrollToMessage = useCallback((messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Adicionar efeito de destaque temporário
      messageElement.style.backgroundColor = 'rgba(37, 211, 102, 0.3)'; // Verde WhatsApp
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
  }, []);

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
    // Copiar seleções para estados aplicados
    setAppliedTags([...selectedTags]);
    setAppliedConnections([...selectedConnections]);
    setAppliedStatuses([...selectedStatuses]);
    setAppliedUsers([...selectedUsers]);
    
    // Trigger refresh
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

  // 🚀 MEMORY MANAGEMENT & CLEANUP
  useEffect(() => {
    // Limpeza automática de mensagens otimistas antigas (30s timeout)
    const cleanup = setInterval(() => {
      const cutoff = Date.now() - 30000; // 30 segundos
      
      setOptimisticMessages(prev => {
        const cleaned = new Map();
        let removedCount = 0;
        
        prev.forEach((message, tempId) => {
          const messageTime = new Date(message.createdAt).getTime();
          if (messageTime > cutoff) {
            cleaned.set(tempId, message);
          } else {
            removedCount++;
          }
        });
        
        // Limpeza automática de mensagens antigas concluída
        
        return cleaned;
      });
      
      // Limpar queue também
      setMessageQueue(prev => {
        const cleaned = new Map();
        let removedCount = 0;
        
        prev.forEach((queueItem, tempId) => {
          if (queueItem.createdAt > cutoff) {
            cleaned.set(tempId, queueItem);
          } else {
            removedCount++;
          }
        });
        
        return cleaned;
      });
    }, 10000); // Check a cada 10s
    
    return () => clearInterval(cleanup);
  }, []);

  // 🚀 OTIMIZAÇÃO: Consolidar limpeza quando muda de chat (Risco Zero)
  useEffect(() => {
    if (selectedChatId) {
      // Limpando mensagens otimistas ao trocar de chat
      setOptimisticMessages(new Map());
      setMessageQueue(new Map());

      // 🚀 RESETAR estados da setinha
      setIsScrolledUp(false);
      setNewMessagesCount(0);
      setLastSeenMessageId(null);
    }
  }, [selectedChatId]);

  // 🚀 EVENT LISTENER para elemento com scroll real
  useEffect(() => {
    if (chatHeightRef.current) {
      let scrollElement = null;
      
      // Buscar elemento com scroll real
      const allElements = chatHeightRef.current.querySelectorAll('*');
      const elementsWithScroll = Array.from(allElements).filter(el => {
        const style = getComputedStyle(el);
        return style.overflowY === 'auto' || style.overflowY === 'scroll';
      });
      
      if (elementsWithScroll.length > 0) {
        scrollElement = elementsWithScroll[0];
      }
      
      if (scrollElement) {
        // Throttle para performance
        let scrollTimeout;
        const throttledHandleScroll = () => {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(handleScroll, 50);
        };
        
        // Event listeners
        const events = ['scroll', 'wheel', 'touchmove'];
        events.forEach(eventName => {
          scrollElement.addEventListener(eventName, throttledHandleScroll, { passive: true });
        });
        
        // Check inicial após render
        setTimeout(() => {
          handleScroll();
        }, 1000);
        
        return () => {
          if (scrollElement) {
            events.forEach(eventName => {
              scrollElement.removeEventListener(eventName, throttledHandleScroll);
            });
          }
          clearTimeout(scrollTimeout);
        };
      } else {
        // Fallback: tentar novamente após delay
        setTimeout(() => {
          handleScroll();
        }, 2000);
      }
    }
  }, [handleScroll, selectedChatId]);

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
                  <Tooltip title={showAllTickets ? 'Ocultar todos os tickets' : 'Mostrar todos os tickets'} placement="bottom">
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
                    >
                      {showAllTickets ? (
                        <EyeIcon style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <EyeSlashIcon style={{ width: '16px', height: '16px' }} />
                      )}
                    </Box>
                  </Tooltip>
                  )}

                  {/* Closed Tickets Button - Tickets Finalizados */}
                  <Tooltip title={showClosedTickets ? 'Ocultar tickets finalizados' : 'Mostrar tickets finalizados'} placement="bottom">
                    <Box
                      onClick={() => {
                        setShowClosedTickets(!showClosedTickets);
                        if (!showClosedTickets) {
                          setShowAllTickets(false); // Desativar "mostrar todos" quando ativar finalizados
                        }
                      }}
                      sx={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        backgroundColor: showClosedTickets ? 'var(--color-primary)' : 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        color: showClosedTickets ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: showClosedTickets ? 'var(--color-primary-dark)' : 'var(--bg-tertiary)',
                          color: showClosedTickets ? 'white' : 'var(--text-primary)',
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      <CheckBoxIcon style={{ width: '16px', height: '16px' }} />
                    </Box>
                  </Tooltip>

                  {/* Queue Filter Button */}
                  <Box sx={{ position: 'relative' }}>
                    <Tooltip title="Filtrar por Filas" placement="bottom">
                      <Box
                        onClick={() => setShowQueueFilter(!showQueueFilter)}
                        sx={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          backgroundColor: showQueueFilter ? 'var(--color-accent)' : 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          color: showQueueFilter ? 'white' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: showQueueFilter ? 'var(--color-green-hover)' : 'var(--bg-tertiary)',
                            color: showQueueFilter ? 'white' : 'var(--text-primary)',
                            transform: 'scale(1.05)',
                          }
                        }}
                      >
                        {/* Ícone de filas (layers/stack) */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Box>
                    </Tooltip>

                    {/* Queue Filter Alert Dot - aparece quando nem todas as filas estão selecionadas */}
                    {user?.queues?.length > 0 && selectedQueueIds.length !== user?.queues?.length && selectedQueueIds.length > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#ff9800',
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': {
                              opacity: 1,
                              transform: 'scale(1)',
                            },
                            '50%': {
                              opacity: 0.5,
                              transform: 'scale(1.2)',
                            },
                            '100%': {
                              opacity: 1,
                              transform: 'scale(1)',
                            },
                          }
                        }}
                      />
                    )}

                    {/* Queue Filter Dropdown */}
                    {showQueueFilter && (
                      <>
                        <Box
                          onClick={() => setShowQueueFilter(false)}
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
                          minWidth: '200px',
                          maxHeight: '300px',
                          overflow: 'auto'
                        }}>
                          {/* Botão dinâmico no topo */}
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedQueueIds.length === user?.queues?.length) {
                                handleClearAllQueues();
                              } else {
                                handleSelectAllQueues();
                              }
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1,
                              p: 1.5,
                              mx: 2,
                              my: 1,
                              background: selectedQueueIds.length === user?.queues?.length
                                ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                                : 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              color: '#ffffff',
                              fontWeight: 600,
                              textAlign: 'center',
                              border: 'none',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                background: selectedQueueIds.length === user?.queues?.length
                                  ? 'linear-gradient(135deg, #fa5252 0%, #e03131 100%)'
                                  : 'linear-gradient(135deg, #40c057 0%, #2f9e44 100%)',
                              },
                              '&:active': {
                                transform: 'translateY(0px)',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                              }
                            }}
                          >
                            {/* Ícone dinâmico */}
                            {selectedQueueIds.length === user?.queues?.length ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}

                            {/* Texto dinâmico */}
                            <Box component="span" sx={{ lineHeight: 1 }}>
                              {selectedQueueIds.length === user?.queues?.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                            </Box>
                          </Box>

                          <Box sx={{ borderTop: '1px solid var(--border-primary)', mt: 1 }} />

                          {/* Lista de filas com checkboxes - Otimizada com React.memo */}
                          {user?.queues?.map((queue) => (
                            <QueueDropdownItem
                              key={queue.id}
                              queue={queue}
                              isSelected={selectedQueueIds.includes(queue.id)}
                              onToggle={handleQueueToggle}
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                  
                  {/* Sort Dropdown */}
                  <Box sx={{ position: 'relative' }}>
                    <Tooltip title="Ordenar por" placement="bottom">
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
                    </Tooltip>
                    
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
                  <Tooltip title="Iniciar nova conversa" placement="bottom">
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
                  </Tooltip>
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
                searchOnMessages={searchOnMessages}
                setSearchOnMessages={setSearchOnMessages}
                isSearchingMessages={isSearchingMessages}
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
                  showClosedTickets={showClosedTickets}
                  setShowClosedTickets={setShowClosedTickets}
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
                ticket={currentTicket}
                showInfo={showInfo}
                handleShowInfo={handleShowInfo}
                profile={profile}
                mobileMenuHandler={handleShowSidebar}
                onSearch={handleMessageSearchToggle}
                onRefresh={forceTicketsRefresh}
                onResolveTicket={handleResolveTicket}
              />
            </CardHeader>

            {selectedChatId ? (
              <>
                {/* Messages Area with Search Panel */}
                <CardContent sx={{
                  flex: 1,
                  p: 0,
                  overflow: 'hidden',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative' // Para permitir posicionamento absoluto do painel
                }}>
                  <MessageArea ref={chatHeightRef} isSearchOpen={isMessageSearchOpen}>
                    <ScrollArea 
                      size="full"
                      sx={{ 
                        // 🚀 Altura dinâmica baseada na tela - permite scroll natural
                        height: '100%',
                        maxHeight: 'calc(100vh - 280px)', // Altura da viewport - headers/footers
                      }}
                    >
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
                            {Array.isArray(allMessages) && allMessages.length > 0 ? (
                              allMessages.map((message, index) => {
                                // Verificar se deve mostrar separador de data
                                const showDateSeparator = index === 0 || 
                                  !isSameDay(
                                    message.createdAt || message.timestamp,
                                    allMessages[index - 1]?.createdAt || allMessages[index - 1]?.timestamp
                                  );

                                return (
                                  <MessageItem
                                    key={`message-${index}-${message.id}`}
                                    id={`message-${message.id}`} // ID para scroll
                                    message={message}
                                    contact={selectedContact}
                                    profile={profile}
                                    currentUser={user}
                                    onDelete={handleDeleteMessage}
                                    index={index}
                                    selectedChatId={selectedChatId}
                                    handleForward={handleForward}
                                    handlePinMessage={handlePinMessage}
                                    pinnedMessages={pinnedMessages}
                                    showDateSeparator={showDateSeparator}
                                    onScrollToMessage={scrollToMessage}
                                    // 🔍 Props para highlight de busca
                                    isHighlighted={highlightedMessageId === message.id}
                                    // 🎭 Props para reações persistentes
                                    addReactionToMessage={addReactionToMessage}
                                    getMessageReactions={getMessageReactions}
                                  />
                                );
                              })
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


                        {/* 🚀 SETINHA FLUTUANTE COM CONTADOR - Só aparece quando scrollado pra cima */}
                        {isScrolledUp && (
                          <Box
                            onClick={scrollDownToLatest}
                            sx={{
                              position: 'absolute',
                              bottom: '30px', // Bem mais baixo
                              right: '15px', // Mais pra direita (5px)
                              width: '40px', // Menor
                              height: '40px', // Menor
                              borderRadius: '50%',
                              backgroundColor: '#EEF1F9', // Fundo cinza claro
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 1000,
                              transition: 'all 0.2s ease',
                              border: '1px solid var(--border-primary)',
                              '&:hover': {
                                backgroundColor: '#E0E4ED',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                transform: 'translateY(-2px)',
                              },
                              '&:active': {
                                transform: 'translateY(0px)',
                              }
                            }}
                          >
                            {/* Ícone da seta para baixo */}
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              style={{ color: 'var(--text-gray-medium)' }}
                            >
                              <path
                                d="M7 10L12 15L17 10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>

                            {/* 🚀 CONTADOR de mensagens novas */}
                            {newMessagesCount > 0 && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '-4px',
                                  right: '-4px',
                                  minWidth: '20px',
                                  height: '20px',
                                  borderRadius: '10px',
                                  backgroundColor: '#ff4444',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '0 6px',
                                  border: '2px solid white',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                }}
                              >
                                {newMessagesCount > 99 ? '99+' : newMessagesCount}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </ScrollArea>
                  </MessageArea>

                  {/* Message Search Panel */}
                  <MessageSearchPanel
                    isOpen={isMessageSearchOpen}
                    onClose={handleMessageSearchClose}
                    messages={messages}
                    onMessageClick={handleMessageClick}
                    ticketId={selectedChatId}
                    selectedContact={selectedContact}
                    currentUser={user}
                    profile={profile}
                  />
                </CardContent>

                {/* Message Input */}
                <Box sx={{ 
                  borderTop: '1px solid var(--border-primary)',
                  flexShrink: 0
                }}>
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    disabled={messagesLoading || currentTicket?.status === 'pending'}
                    placeholder={
                      currentTicket?.status === 'pending'
                        ? "Aceite este ticket para enviar mensagens..."
                        : "Digite sua mensagem..."
                    }
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
        
        {/* Modal de Deletar Mensagem */}
        <DeleteMessageModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setMessageToDelete(null);
          }}
          onDeleteForAll={handleDeleteForAll}
          messageText={messageToDelete?.text}
        />
        
        {/* Modal de Encaminhar Mensagem */}
        <ModernForwardMessageModal
          modalOpen={forwardMessageModalOpen}
          messages={selectedMessages.length > 0 ? selectedMessages : (messageToForward || [])}
          onClose={() => {
            setForwardMessageModalOpen(false);
            setMessageToForward(null);
            // Resetar modo de seleção
            setShowSelectMessageCheckbox(false);
            setSelectedMessages([]);
          }}
          forceTicketsRefresh={forceTicketsRefresh}
        />

        {/* Modal de Resolver Conversa - Igual ao dropdown */}
        <ResolverTicketModal
          isVisible={showCloseTicketModal}
          onClose={() => setShowCloseTicketModal(false)}
          onResolverComMensagem={handleResolverComMensagem}
          onResolverSemMensagem={handleResolverSemMensagem}
          contactName={selectedContact?.name || 'Contato'}
        />
        </Box>
    </ChatPageBase>
  );
};

// Componente wrapper que fornece o ReplyMessageContext, ForwardMessageContext e EditMessageContext
const ChatModerno = () => {
  return (
    <ReplyMessageProvider>
      <ForwardMessageProvider>
        <EditMessageProvider>
          <ChatModernoContent />
        </EditMessageProvider>
      </ForwardMessageProvider>
    </ReplyMessageProvider>
  );
};

export default ChatModerno;