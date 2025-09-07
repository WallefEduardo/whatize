import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/Auth/AuthContext';
import api from '../services/api';
import toastError from '../errors/toastError';

// Cache global para evitar re-fetches desnecessários
const ticketsCache = new Map();
const CACHE_DURATION = 30000; // 30 segundos

// Normalizar dados para lookups O(1)
const normalizeTickets = (tickets) => {
  const normalized = new Map();
  const byStatus = {
    open: new Set(),
    pending: new Set(),
    group: new Set()
  };

  tickets.forEach(ticket => {
    normalized.set(ticket.id, ticket);
    if (byStatus[ticket.status]) {
      byStatus[ticket.status].add(ticket.id);
    }
  });

  return { normalized, byStatus };
};

// Debounce otimizado
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

const useOptimizedTickets = ({
  status = 'open',
  searchParam = '',
  selectedQueueIds = [],
  showAll = false,
  tags = [],
  users = [],
  whatsappIds = [],
  forceRefresh = 0
}) => {
  const { user, socket } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState(new Map());
  const [ticketsByStatus, setTicketsByStatus] = useState({
    open: new Set(),
    pending: new Set(),
    group: new Set()
  });
  const [counts, setCounts] = useState({
    open: 0,
    pending: 0,
    group: 0
  });
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  // Debounce para busca
  const debouncedSearch = useDebounce(searchParam, 300);

  // Memoizar parâmetros da API para evitar requests desnecessários  
  const apiParams = useMemo(() => {
    const params = {
      searchParam: debouncedSearch,
      status,
      // CORRIGIDO: Usar mesmo formato que useTickets (JSON string)
      queueIds: selectedQueueIds?.length > 0 ? JSON.stringify(selectedQueueIds) : undefined,
      showAll,
      tags: tags?.length > 0 ? JSON.stringify(tags) : undefined,
      users: users?.length > 0 ? JSON.stringify(users) : undefined,
      whatsapps: whatsappIds?.length > 0 ? JSON.stringify(whatsappIds) : undefined,
      pageNumber: 1,
      sortTickets: 'DESC'
    };
    
    return params;
  }, [debouncedSearch, status, JSON.stringify(selectedQueueIds), showAll, JSON.stringify(tags), JSON.stringify(users), JSON.stringify(whatsappIds)]);

  // Cache key para requests
  const cacheKey = useMemo(() => 
    JSON.stringify(apiParams), [apiParams]
  );

  // Função otimizada para fetch
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cached = ticketsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        const { normalized, byStatus } = normalizeTickets(cached.data.tickets);
        setTickets(normalized);
        setTicketsByStatus(byStatus);
        setHasMore(cached.data.hasMore || false);
        setLoading(false);
        return;
      }

      const { data } = await api.get('/tickets', { params: apiParams });
      
      
      // Processar e normalizar dados
      const { normalized, byStatus } = normalizeTickets(data.tickets || []);
      
      // Cache dos dados
      ticketsCache.set(cacheKey, {
        data: {
          tickets: data.tickets || [],
          hasMore: data.hasMore || false
        },
        timestamp: Date.now()
      });

      setTickets(normalized);
      setTicketsByStatus(byStatus);
      setHasMore(data.hasMore || false);

    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err);
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  // Efeito principal para fetch
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets, forceRefresh]);

  // Handler memoizado para eventos de socket
  const handleSocketEvent = useCallback((eventName, data) => {
    // Invalidar cache para forçar dados frescos
    ticketsCache.clear();
    
    // Forçar re-fetch dos tickets para garantir dados atualizados
    setTimeout(() => {
      fetchTickets();
    }, 200);
  }, [fetchTickets]);

  // Socket listeners otimizados - Eventos reais do sistema
  useEffect(() => {
    if (!socket || !socket.on || !user?.companyId) return;

    // Eventos principais do sistema Whatize
    const events = [
      'ticket',
      'ticketList', 
      'appMessage',
      'contact',
      'ticket:update',
      'message:create',
      'message:update',
      'message:ack',
      'ticket:create',
      'ticket:delete',
      'contact:update',
      // Eventos específicos da empresa (como emitidos pelo backend)
      `company-${user.companyId}-appMessage`,
      `company-${user.companyId}-ticket`,
      `company-${user.companyId}-contact`
    ];

    events.forEach(event => {
      socket.on(event, (data) => handleSocketEvent(event, data));
    });

    // Listener genérico para capturar qualquer evento
    const originalEmit = socket.onevent;
    socket.onevent = function (packet) {
      const args = packet.data || [];
      const eventName = args[0];
      const eventData = args[1];
      
      if (eventName && typeof eventName === 'string') {
        // Se for um evento relacionado a ticket/mensagem, recarregar
        if (eventName.includes('ticket') || eventName.includes('message') || eventName.includes('appMessage')) {
          handleSocketEvent(eventName, eventData);
        }
      }
      
      originalEmit.call(this, packet);
    };

    return () => {
      events.forEach(event => {
        socket.off(event);
      });
    };
  }, [socket, handleSocketEvent, user?.companyId]);

  // Recalcular contadores automaticamente quando tickets mudam
  useEffect(() => {
    const newCounts = {
      open: ticketsByStatus.open?.size || 0,
      pending: ticketsByStatus.pending?.size || 0,
      group: ticketsByStatus.group?.size || 0
    };
    
    setCounts(prev => {
      // Só atualizar se realmente mudou para evitar re-renders
      if (prev.open !== newCounts.open || prev.pending !== newCounts.pending || prev.group !== newCounts.group) {
        return newCounts;
      }
      return prev;
    });
  }, [ticketsByStatus]);

  // Memoizar tickets filtrados por status atual
  const filteredTickets = useMemo(() => {
    const statusTickets = ticketsByStatus[status] || new Set();
    return Array.from(statusTickets)
      .map(id => tickets.get(id))
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [tickets, ticketsByStatus, status]);

  // Função para busca local instantânea
  const searchTickets = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return filteredTickets;
    
    const term = searchTerm.toLowerCase();
    return filteredTickets.filter(ticket => 
      ticket.contact?.name?.toLowerCase().includes(term) ||
      ticket.lastMessage?.toLowerCase().includes(term) ||
      ticket.contact?.number?.includes(term)
    );
  }, [filteredTickets]);

  // Função para invalidar cache manualmente
  const invalidateCache = useCallback(() => {
    ticketsCache.clear();
    fetchTickets();
  }, [fetchTickets]);

  return {
    loading,
    error,
    tickets: searchParam ? searchTickets(searchParam) : filteredTickets,
    counts,
    hasMore,
    refetch: fetchTickets,
    invalidateCache
  };
};

// Utility function para throttle
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export default useOptimizedTickets;