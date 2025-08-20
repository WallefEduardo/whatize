import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Store de migração para tracking do progresso da modernização
export const useMigrationStore = create(
  subscribeWithSelector((set, get) => ({
    // Estado da migração
    phase: 4,
    currentTask: 'Zustand v5 migration',
    tasksCompleted: {
      phase1: true,
      phase2: true, 
      phase3: true,
      reactQuery: true,
      forms: true,
      zustand: false,
    },
    
    // Logs de performance
    performanceMetrics: {
      buildTime: 49.84,
      bundleSize: '6,254.51 kB',
      viteTransformTime: '21499 modules',
    },
    
    // Actions
    updatePhase: (newPhase) => set({ phase: newPhase }),
    updateTask: (task) => set({ currentTask: task }),
    completeTask: (taskName) => set((state) => ({
      tasksCompleted: {
        ...state.tasksCompleted,
        [taskName]: true,
      }
    })),
    
    // Performance tracking
    updateMetrics: (metrics) => set((state) => ({
      performanceMetrics: {
        ...state.performanceMetrics,
        ...metrics,
      }
    })),
    
    // Relatório final
    getReport: () => {
      const state = get();
      return {
        phase: state.phase,
        completed: Object.values(state.tasksCompleted).filter(Boolean).length,
        total: Object.keys(state.tasksCompleted).length,
        performance: state.performanceMetrics,
      };
    },
  }))
);

// Store para cache inteligente (Task 10)
export const useCacheStore = create((set, get) => ({
  // Cache para API responses
  apiCache: new Map(),
  cacheTimestamps: new Map(),
  maxCacheSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  
  // Actions
  setCache: (key, data, ttl) => {
    const state = get();
    const cache = new Map(state.apiCache);
    const timestamps = new Map(state.cacheTimestamps);
    
    // Remover items expirados se cache cheio
    if (cache.size >= state.maxCacheSize) {
      const now = Date.now();
      for (const [cacheKey, timestamp] of timestamps) {
        if (now - timestamp > (ttl || state.defaultTTL)) {
          cache.delete(cacheKey);
          timestamps.delete(cacheKey);
        }
      }
    }
    
    cache.set(key, data);
    timestamps.set(key, Date.now());
    
    set({ 
      apiCache: cache, 
      cacheTimestamps: timestamps 
    });
  },
  
  getCache: (key) => {
    const state = get();
    const timestamp = state.cacheTimestamps.get(key);
    
    if (!timestamp) return null;
    
    const now = Date.now();
    if (now - timestamp > state.defaultTTL) {
      // Cache expirado
      const cache = new Map(state.apiCache);
      const timestamps = new Map(state.cacheTimestamps);
      cache.delete(key);
      timestamps.delete(key);
      
      set({ 
        apiCache: cache, 
        cacheTimestamps: timestamps 
      });
      return null;
    }
    
    return state.apiCache.get(key);
  },
  
  clearCache: () => set({ 
    apiCache: new Map(), 
    cacheTimestamps: new Map() 
  }),
  
  // Estatísticas do cache
  getCacheStats: () => {
    const state = get();
    return {
      size: state.apiCache.size,
      maxSize: state.maxCacheSize,
      keys: Array.from(state.apiCache.keys()),
    };
  },
}));

// Store otimizado para WhatsApp/Tickets (exemplo migração)
export const useTicketStore = create((set, get) => ({
  tickets: [],
  selectedTicket: null,
  loading: false,
  error: null,
  
  // Actions otimizadas
  setTickets: (tickets) => set({ tickets, loading: false }),
  selectTicket: (ticket) => set({ selectedTicket: ticket }),
  updateTicket: (ticketId, updates) => set((state) => ({
    tickets: state.tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, ...updates }
        : ticket
    ),
    selectedTicket: state.selectedTicket?.id === ticketId 
      ? { ...state.selectedTicket, ...updates }
      : state.selectedTicket,
  })),
  
  addTicket: (ticket) => set((state) => ({
    tickets: [ticket, ...state.tickets]
  })),
  
  removeTicket: (ticketId) => set((state) => ({
    tickets: state.tickets.filter(t => t.id !== ticketId),
    selectedTicket: state.selectedTicket?.id === ticketId 
      ? null 
      : state.selectedTicket,
  })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Seletores otimizados
  getTicketById: (id) => get().tickets.find(t => t.id === id),
  getTicketsByStatus: (status) => get().tickets.filter(t => t.status === status),
  getTicketsCount: () => get().tickets.length,
}));

export default { useMigrationStore, useCacheStore, useTicketStore };