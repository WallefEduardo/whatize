// Mock data para desenvolvimento do chat

// Função para gerar datas relativas
const getPreviousDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const getTimeString = (daysAgo = 0, hoursAgo = 0, minutesAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
};

// Dados do perfil do usuário logado
export const profileUser = {
  id: 'user-1',
  name: 'João Silva',
  email: 'joao@whatize.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  status: 'online',
  bio: 'Desenvolvedor Full Stack na Whatize',
  lastSeen: new Date().toISOString()
};

// Lista de contatos
export const contacts = [
  {
    id: 'contact-1',
    name: 'Maria Santos',
    email: 'maria@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b6d4c4f7?w=150&h=150&fit=crop&crop=face',
    status: 'online',
    lastMessage: 'Oi! Como está o projeto?',
    lastSeen: getTimeString(0, 0, 5),
    unreadCount: 2,
    isTyping: false
  },
  {
    id: 'contact-2', 
    name: 'Pedro Oliveira',
    email: 'pedro@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    status: 'busy',
    lastMessage: 'Perfeito! Vou revisar hoje.',
    lastSeen: getTimeString(0, 1, 30),
    unreadCount: 0,
    isTyping: false
  },
  {
    id: 'contact-3',
    name: 'Ana Costa',
    email: 'ana@example.com', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    status: 'away',
    lastMessage: 'Obrigada pela ajuda!',
    lastSeen: getTimeString(0, 3, 0),
    unreadCount: 1,
    isTyping: false
  },
  {
    id: 'contact-4',
    name: 'Carlos Lima',
    email: 'carlos@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    status: 'offline',
    lastMessage: 'Até amanhã!',
    lastSeen: getTimeString(1, 0, 0),
    unreadCount: 0,
    isTyping: false
  },
  {
    id: 'contact-5',
    name: 'Lucia Ferreira',
    email: 'lucia@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    status: 'online',
    lastMessage: 'Vou enviar o relatório agora',
    lastSeen: getTimeString(0, 0, 15),
    unreadCount: 3,
    isTyping: true
  }
];

// Mensagens de cada conversa
export const chatMessages = {
  'contact-1': [
    {
      id: 'msg-1-1',
      senderId: 'contact-1',
      content: 'Oi João! Tudo bem?',
      timestamp: getTimeString(0, 2, 0),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-1-2', 
      senderId: 'user-1',
      content: 'Olá Maria! Tudo ótimo, e você?',
      timestamp: getTimeString(0, 1, 55),
      type: 'text',
      status: 'read',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-1-3',
      senderId: 'contact-1',
      content: 'Tudo bem também! Como está o projeto?',
      timestamp: getTimeString(0, 1, 50),
      type: 'text', 
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-1-4',
      senderId: 'user-1',
      content: 'Está indo muito bem! Já terminamos 80% das funcionalidades.',
      timestamp: getTimeString(0, 1, 45),
      type: 'text',
      status: 'read',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-1-5',
      senderId: 'contact-1',
      content: 'Que ótima notícia! 🎉 Posso ver alguma prévia?',
      timestamp: getTimeString(0, 0, 10),
      type: 'text',
      status: 'delivered',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-1-6',
      senderId: 'contact-1',
      content: 'Oi! Como está o projeto?',
      timestamp: getTimeString(0, 0, 5),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    }
  ],
  
  'contact-2': [
    {
      id: 'msg-2-1',
      senderId: 'user-1',
      content: 'Pedro, você pode revisar o pull request?',
      timestamp: getTimeString(0, 2, 0),
      type: 'text',
      status: 'read',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-2-2',
      senderId: 'contact-2',
      content: 'Claro! Vou dar uma olhada agora.',
      timestamp: getTimeString(0, 1, 55),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-2-3',
      senderId: 'contact-2',
      content: 'Perfeito! Vou revisar hoje.',
      timestamp: getTimeString(0, 1, 30),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: true
    }
  ],
  
  'contact-3': [
    {
      id: 'msg-3-1',
      senderId: 'contact-3',
      content: 'João, preciso de ajuda com a integração da API.',
      timestamp: getTimeString(0, 4, 0),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-3-2',
      senderId: 'user-1',
      content: 'Sem problemas! Qual é a dificuldade?',
      timestamp: getTimeString(0, 3, 55),
      type: 'text',
      status: 'read',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-3-3',
      senderId: 'user-1',
      content: 'Conseguiu resolver a autenticação?',
      timestamp: getTimeString(0, 3, 20),
      type: 'text',
      status: 'read',
      isReply: true,
      replyTo: 'msg-3-1',
      isPinned: false
    },
    {
      id: 'msg-3-4',
      senderId: 'contact-3',
      content: 'Obrigada pela ajuda!',
      timestamp: getTimeString(0, 3, 0),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    }
  ],
  
  'contact-4': [
    {
      id: 'msg-4-1',
      senderId: 'contact-4',
      content: 'João, reunião amanhã às 9h!',
      timestamp: getTimeString(1, 1, 0),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-4-2',
      senderId: 'user-1',
      content: 'Perfeito, estarei lá!',
      timestamp: getTimeString(1, 0, 55),
      type: 'text',
      status: 'read',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-4-3',
      senderId: 'contact-4',
      content: 'Até amanhã!',
      timestamp: getTimeString(1, 0, 0),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    }
  ],
  
  'contact-5': [
    {
      id: 'msg-5-1',
      senderId: 'user-1',
      content: 'Lucia, como está o relatório mensal?',
      timestamp: getTimeString(0, 1, 0),
      type: 'text',
      status: 'read',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-5-2',
      senderId: 'contact-5',
      content: 'Quase pronto! Só faltam os gráficos.',
      timestamp: getTimeString(0, 0, 30),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    },
    {
      id: 'msg-5-3',
      senderId: 'contact-5',
      content: 'Vou enviar o relatório agora',
      timestamp: getTimeString(0, 0, 15),
      type: 'text',
      status: 'sent',
      isReply: false,
      replyTo: null,
      isPinned: false
    }
  ]
};

// Mensagens fixadas
export const pinnedMessages = [
  {
    id: 'msg-2-3',
    chatId: 'contact-2',
    content: 'Perfeito! Vou revisar hoje.',
    timestamp: getTimeString(0, 1, 30),
    sender: contacts.find(c => c.id === 'contact-2')
  }
];

// Status de digitação
export const typingStatus = {
  'contact-5': {
    isTyping: true,
    startedAt: new Date().toISOString()
  }
};

// Função para buscar contatos
export const getContacts = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        contacts: contacts,
        profile: profileUser
      });
    }, 500);
  });
};

// Função para buscar mensagens de um chat
export const getMessages = (contactId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const contact = contacts.find(c => c.id === contactId);
      const messages = chatMessages[contactId] || [];
      
      resolve({
        contact: contact,
        chat: {
          chat: messages,
          unseenMsgs: contact?.unreadCount || 0
        }
      });
    }, 300);
  });
};

// Função para buscar perfil do usuário
export const getProfile = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(profileUser);
    }, 200);
  });
};

// Função para enviar mensagem
export const sendMessage = (messageData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { message, contact, replayMetadata } = messageData;
      
      const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'user-1',
        content: message,
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sent',
        isReply: !!replayMetadata,
        replyTo: replayMetadata ? 'previous-msg' : null,
        isPinned: false
      };
      
      // Adicionar mensagem aos dados mock
      if (!chatMessages[contact.id]) {
        chatMessages[contact.id] = [];
      }
      chatMessages[contact.id].push(newMessage);
      
      // Atualizar last message do contato
      const contactIndex = contacts.findIndex(c => c.id === contact.id);
      if (contactIndex >= 0) {
        contacts[contactIndex].lastMessage = message;
        contacts[contactIndex].lastSeen = new Date().toISOString();
        contacts[contactIndex].unreadCount = 0;
      }
      
      resolve(newMessage);
    }, 200);
  });
};

// Função para deletar mensagem
export const deleteMessage = ({ selectedChatId, index }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (chatMessages[selectedChatId] && chatMessages[selectedChatId][index]) {
        chatMessages[selectedChatId].splice(index, 1);
      }
      resolve({ success: true });
    }, 200);
  });
};

// Função para formatar tempo - apenas horário
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

// Função para verificar se objeto não está vazio
export const isObjectNotEmpty = (obj) => {
  return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
};

// Função para formatar data para separadores (como no WhatsApp)
export const formatDateSeparator = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Comparar apenas as datas (ignorando horário)
  const dateStr = date.toDateString();
  const nowStr = now.toDateString();
  const yesterdayStr = yesterday.toDateString();
  
  if (dateStr === nowStr) {
    return 'Hoje';
  } else if (dateStr === yesterdayStr) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
};

// Função para verificar se duas mensagens são do mesmo dia
export const isSameDay = (timestamp1, timestamp2) => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  
  return date1.toDateString() === date2.toDateString();
};

export default {
  profileUser,
  contacts,
  chatMessages,
  pinnedMessages,
  typingStatus,
  getContacts,
  getMessages,
  getProfile,
  sendMessage,
  deleteMessage,
  formatTime,
  isObjectNotEmpty
};