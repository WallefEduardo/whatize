import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { AuthContext } from '../context/Auth/AuthContext';
import api from '../services/api';
import toastError from '../errors/toastError';

/**
 * Hook robusto para gerenciamento de tickets
 * Foca em simplicidade e confiabilidade
 */
const useTicketsRobust = () => {
  const { user, socket } = useContext(AuthContext);
  const [tickets, setTickets] = useState({
    pending: [],
    open: [],
    group: []
  });
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    pending: 0,
    open: 0,
    group: 0
  });
  
  // Ref para evitar calls duplicadas
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

  // Função principal para buscar tickets
  const fetchTickets = useCallback(async (status = null) => {
    // Evitar calls simultâneas
    if (fetchingRef.current) return;
    
    // Evitar calls muito próximas (debounce de 500ms)
    const now = Date.now();
    if (now - lastFetchRef.current < 500) return;
    
    try {
      fetchingRef.current = true;
      lastFetchRef.current = now;
      setLoading(true);
      
      console.log('🔄 Fetching tickets...', { status });
      
      const userQueueIds = user?.queues?.map(q => q.id) || [];
      
      // Buscar todos os status se não especificado
      const statusesToFetch = status ? [status] : ['pending', 'open', 'group'];
      
      const requests = statusesToFetch.map(s => 
        api.get('/tickets', {
          params: {
            status: s,
            queueIds: JSON.stringify(userQueueIds),
            pageNumber: 1,
            pageSize: 50,
            showAll: false
          }
        })
      );
      
      const responses = await Promise.all(requests);
      
      const newTickets = { ...tickets };
      const newCounts = { ...counts };
      
      statusesToFetch.forEach((s, index) => {
        const data = responses[index].data;
        newTickets[s] = data.tickets || [];
        newCounts[s] = data.count || data.tickets?.length || 0;
      });
      
      setTickets(newTickets);
      setCounts(newCounts);
      
      console.log('✅ Tickets fetched:', newCounts);
      
    } catch (err) {
      console.error('❌ Error fetching tickets:', err);
      toastError(err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.queues]);

  // Função para aceitar ticket
  const acceptTicket = useCallback(async (ticketId, queueId) => {
    try {
      console.log('🎯 Accepting ticket:', ticketId, 'to queue:', queueId);
      
      const response = await api.put(`/tickets/${ticketId}`, {
        status: 'open',
        userId: user?.id,
        queueId: queueId
      });
      
      console.log('✅ Ticket accepted:', response.data);
      
      // Atualizar local state imediatamente
      setTickets(prev => {
        const updated = { ...prev };
        
        // Remover da pending
        updated.pending = prev.pending.filter(t => t.id !== ticketId);
        
        // Adicionar na open
        const acceptedTicket = { ...response.data, status: 'open' };
        updated.open = [acceptedTicket, ...prev.open];
        
        return updated;
      });
      
      // Atualizar counts
      setCounts(prev => ({
        ...prev,
        pending: prev.pending - 1,
        open: prev.open + 1
      }));
      
      return response.data;
      
    } catch (err) {
      console.error('❌ Error accepting ticket:', err);
      throw err;
    }
  }, [user?.id]);

  // Socket listener para atualizações em tempo real
  useEffect(() => {
    if (!socket || !user?.companyId) return;
    
    const companyId = user.companyId;
    
    // Debug: Monitorar TODOS os eventos socket
    const originalEmit = socket.onevent;
    socket.onevent = function (packet) {
      const args = packet.data || [];
      const eventName = args[0];
      const eventData = args[1];
      
      console.log('🌐 Socket event captured:', eventName, eventData);
      
      originalEmit.call(this, packet);
    };
    
    const handleTicketUpdate = (data) => {
      console.log('📡 Socket ticket update:', data);
      
      if (data.action === 'update' && data.ticket) {
        const ticket = data.ticket;
        
        setTickets(prev => {
          const updated = { ...prev };
          
          // Remover ticket de todos os status primeiro
          Object.keys(updated).forEach(status => {
            updated[status] = prev[status].filter(t => t.id !== ticket.id);
          });
          
          // Adicionar no status correto
          if (ticket.status && updated[ticket.status]) {
            updated[ticket.status] = [ticket, ...updated[ticket.status]];
          }
          
          return updated;
        });
        
        // Recalcular counts
        setCounts(prev => {
          const newCounts = { ...prev };
          Object.keys(newCounts).forEach(status => {
            newCounts[status] = tickets[status]?.length || 0;
          });
          return newCounts;
        });
      }
      
      if (data.action === 'create' && data.ticket) {
        const ticket = data.ticket;
        
        setTickets(prev => ({
          ...prev,
          [ticket.status]: [ticket, ...prev[ticket.status] || []]
        }));
        
        setCounts(prev => ({
          ...prev,
          [ticket.status]: (prev[ticket.status] || 0) + 1
        }));
      }
      
      if (data.action === 'delete' && data.ticketId) {
        const ticketId = data.ticketId;
        
        setTickets(prev => {
          const updated = { ...prev };
          let removedFrom = null;
          
          Object.keys(updated).forEach(status => {
            const filtered = prev[status].filter(t => t.id !== ticketId);
            if (filtered.length < prev[status].length) {
              removedFrom = status;
            }
            updated[status] = filtered;
          });
          
          return updated;
        });
        
        // Buscar dados atualizados após delete
        setTimeout(() => fetchTickets(), 100);
      }
    };
    
    const handleAppMessage = (data) => {
      console.log('📱 Socket app message:', data);
      
      // Se é uma nova mensagem, pode ter criado um ticket novo
      if (data.action === 'create') {
        // Se há dados do ticket direto no evento
        if (data.ticket) {
          const ticket = data.ticket;
          console.log('🎯 New ticket from message:', ticket);
          
          setTickets(prev => ({
            ...prev,
            [ticket.status]: [ticket, ...prev[ticket.status] || []]
          }));
          
          setCounts(prev => ({
            ...prev,
            [ticket.status]: (prev[ticket.status] || 0) + 1
          }));
        } else {
          // Buscar dados atualizados se não há ticket no evento
          console.log('🔄 Fetching pending tickets after new message');
          fetchTickets('pending');
        }
      }
    };
    
    // Handler genérico para qualquer evento que possa afetar tickets
    const handleGenericEvent = (eventName, data) => {
      if (eventName.includes('ticket') || eventName.includes('message') || eventName.includes('appMessage')) {
        console.log('🔍 Generic event handler:', eventName, data);
        
        // Se é criação de ticket/mensagem, recarregar pending
        if (data?.action === 'create' || eventName.includes('create')) {
          setTimeout(() => fetchTickets('pending'), 100);
        }
      }
    };
    
    // Registrar listeners específicos
    socket.on(`company-${companyId}-ticket`, handleTicketUpdate);
    socket.on(`company-${companyId}-appMessage`, handleAppMessage);
    
    // Listeners adicionais para capturar outros eventos
    socket.on('ticket', handleTicketUpdate);
    socket.on('ticketList', () => fetchTickets());
    socket.on('appMessage', handleAppMessage);
    
    // Listener genérico como fallback
    const events = ['ticket:create', 'ticket:update', 'message:create'];
    events.forEach(event => {
      socket.on(event, (data) => handleGenericEvent(event, data));
    });
    
    return () => {
      socket.off(`company-${companyId}-ticket`, handleTicketUpdate);
      socket.off(`company-${companyId}-appMessage`, handleAppMessage);
      socket.off('ticket', handleTicketUpdate);
      socket.off('ticketList');
      socket.off('appMessage', handleAppMessage);
      events.forEach(event => socket.off(event));
    };
  }, [socket, user?.companyId, fetchTickets]);

  // Fetch inicial
  useEffect(() => {
    if (user?.queues) {
      fetchTickets();
    }
  }, [user?.queues, fetchTickets]);

  // Função para refresh manual
  const refresh = useCallback(() => {
    console.log('🔄 Manual refresh requested');
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    counts,
    loading,
    acceptTicket,
    refresh
  };
};

export default useTicketsRobust;