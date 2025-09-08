import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/Auth/AuthContext';
import api from '../services/api';

/**
 * Hook SIMPLES e DIRETO para tickets
 * Sem cache, sem otimização, só FUNCIONA
 */
const useTicketsSimple = () => {
  const { user, socket } = useContext(AuthContext);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [openTickets, setOpenTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buscar tickets - SIMPLES
  const loadTickets = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Loading tickets...');
      
      // Buscar PENDING
      const pendingRes = await api.get('/tickets', {
        params: {
          status: 'pending',
          showAll: false
        }
      });
      
      // Buscar OPEN
      const openRes = await api.get('/tickets', {
        params: {
          status: 'open',
          showAll: false
        }
      });
      
      setPendingTickets(pendingRes.data.tickets || []);
      setOpenTickets(openRes.data.tickets || []);
      
      console.log('✅ Tickets loaded:', {
        pending: pendingRes.data.tickets?.length || 0,
        open: openRes.data.tickets?.length || 0
      });
      
    } catch (err) {
      console.error('❌ Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Socket - INSTANTÂNEO
  useEffect(() => {
    if (!socket) return;
    
    // Handler IMEDIATO para novos tickets
    const handleNewTicket = (data) => {
      console.log('🚀 NEW TICKET EVENT:', data);
      
      // Se tem ticket no evento, adicionar IMEDIATAMENTE
      if (data?.ticket) {
        const ticket = data.ticket;
        if (ticket.status === 'pending') {
          setPendingTickets(prev => {
            // Evitar duplicatas
            if (prev.find(t => t.id === ticket.id)) return prev;
            return [ticket, ...prev];
          });
        } else if (ticket.status === 'open') {
          setOpenTickets(prev => {
            if (prev.find(t => t.id === ticket.id)) return prev;
            return [ticket, ...prev];
          });
        }
      }
      
      // Recarregar em 500ms para garantir
      setTimeout(loadTickets, 500);
    };
    
    // Escutar eventos ESPECÍFICOS
    socket.on(`company-${user?.companyId}-ticket`, handleNewTicket);
    socket.on(`company-${user?.companyId}-appMessage`, handleNewTicket);
    socket.on('ticket', handleNewTicket);
    socket.on('appMessage', handleNewTicket);
    
    // Capturar TODOS os eventos para debug
    const originalEmit = socket.onevent;
    socket.onevent = function (packet) {
      const args = packet.data || [];
      const eventName = args[0];
      const eventData = args[1];
      
      // Log para ver qual evento chega
      if (typeof eventName === 'string' && 
          (eventName.includes('ticket') || 
           eventName.includes('message') || 
           eventName.includes('app'))) {
        console.log('📡 Socket Event:', eventName, eventData);
        
        // Se tem action create, processar IMEDIATAMENTE
        if (eventData?.action === 'create' && eventData?.ticket) {
          handleNewTicket(eventData);
        }
      }
      
      originalEmit.call(this, packet);
    };
    
    return () => {
      socket.off(`company-${user?.companyId}-ticket`);
      socket.off(`company-${user?.companyId}-appMessage`);
      socket.off('ticket');
      socket.off('appMessage');
    };
  }, [socket, user?.companyId, loadTickets]);

  // Carregar inicial (SEM INTERVAL INFINITO)
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Aceitar ticket - DIRETO
  const acceptTicket = async (ticketId, queueId) => {
    try {
      console.log('✅ Accepting ticket:', ticketId);
      
      const res = await api.put(`/tickets/${ticketId}`, {
        status: 'open',
        userId: user?.id,
        queueId: queueId
      });
      
      // Recarregar IMEDIATAMENTE
      loadTickets();
      
      return res.data;
    } catch (err) {
      console.error('❌ Error accepting:', err);
      throw err;
    }
  };

  return {
    pendingTickets,
    openTickets,
    loading,
    acceptTicket,
    refresh: loadTickets,
    counts: {
      pending: pendingTickets.length,
      open: openTickets.length
    }
  };
};

export default useTicketsSimple;