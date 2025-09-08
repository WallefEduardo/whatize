import { useState, useEffect, useReducer, useContext, useCallback } from 'react';
import { AuthContext } from '../context/Auth/AuthContext';
import api from '../services/api';
import toastError from '../errors/toastError';

// Reducer igual ao original para manter estado
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

/**
 * Hook CORRETO baseado no original
 */
const useTicketsCorrect = ({ status = 'pending' }) => {
  const { user, socket } = useContext(AuthContext);
  const [ticketsList, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [count, setCount] = useState(0);

  // Buscar tickets igual ao original
  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTickets = async () => {
        try {
          const { data } = await api.get("/tickets", {
            params: {
              status,
              showAll: false,
              queueIds: JSON.stringify(user?.queues?.map(q => q.id) || [])
            }
          });

          dispatch({ type: "LOAD_TICKETS", payload: data.tickets });
          setHasMore(data.hasMore);
          setCount(data.count);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchTickets();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [status, user?.queues]);

  // Socket listeners IGUAL ao original
  useEffect(() => {
    const companyId = user?.companyId;
    if (!socket || !companyId) return;

    const onCompanyTicket = (data) => {
      console.log('🎯 company-ticket:', data);
      
      if (data.action === "update" && data.ticket && data.ticket.status === status) {
        dispatch({ type: "UPDATE_TICKET", payload: data.ticket });
      }
      
      if (data.action === "delete") {
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }
    };

    const onCompanyAppMessage = (data) => {
      console.log('📱 company-appMessage:', data);
      
      if (data.action === "create" && data.ticket && data.ticket.status === status) {
        dispatch({ type: "UPDATE_TICKET_UNREAD_MESSAGES", payload: data.ticket });
      }
    };

    const onConnect = () => {
      console.log('🔌 Socket connected, joining:', status);
      socket.emit("joinTickets", status);
    };

    // Registrar eventos
    socket.on("connect", onConnect);
    socket.on(`company-${companyId}-ticket`, onCompanyTicket);
    socket.on(`company-${companyId}-appMessage`, onCompanyAppMessage);

    // Entrar na sala imediatamente se já conectado
    if (socket.connected) {
      socket.emit("joinTickets", status);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off(`company-${companyId}-ticket`, onCompanyTicket);
      socket.off(`company-${companyId}-appMessage`, onCompanyAppMessage);
      socket.emit("leaveTickets", status);
    };
  }, [socket, status, user?.companyId]);

  // Função para aceitar ticket
  const acceptTicket = useCallback(async (ticketId, queueId) => {
    try {
      const res = await api.put(`/tickets/${ticketId}`, {
        status: 'open',
        userId: user?.id,
        queueId: queueId
      });
      
      // Remover do estado atual
      dispatch({ type: "DELETE_TICKET", payload: ticketId });
      
      return res.data;
    } catch (err) {
      toastError(err);
      throw err;
    }
  }, [user?.id]);

  return {
    tickets: ticketsList,
    loading,
    hasMore,
    count,
    acceptTicket
  };
};

export default useTicketsCorrect;