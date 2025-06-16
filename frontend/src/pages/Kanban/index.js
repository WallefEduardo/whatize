import React, { useState, useEffect, useContext, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from 'react-trello';
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { useHistory } from 'react-router-dom';
import { Facebook, Instagram, WhatsApp, Add, Send, LocalOffer, Person } from "@material-ui/icons";
import { Tooltip, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Box, IconButton, Badge } from "@material-ui/core";
import { format, isSameDay, parseISO } from "date-fns";
import { Can } from "../../components/Can";
import Swal from "sweetalert2";

const useStyles = makeStyles(theme => ({
  '@global': {
    '.dOlrNy': {
      overflowY: 'auto !important',
    },
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    },
    // Remove tooltips do react-trello
    '.react-trello-lane-header, .react-trello-lane, [data-react-trello-lane-id]': {
      '& *[title]': {
        '&::before, &::after': {
          display: 'none !important',
        },
      },
    },
    // Remove tooltip nativo do browser de forma mais abrangente
    '.react-trello-board *[title], .react-trello-board *[data-title]': {
      '&:hover::before, &:hover::after': {
        display: 'none !important',
      },
      '&::before, &::after': {
        display: 'none !important',
      },
    },
    // Força remoção de tooltips em elementos específicos
    '.react-trello-lane-header, .react-trello-lane-header *, .react-trello-lane, .react-trello-lane *': {
      '&[title]': {
        '&:hover': {
          '&::before, &::after': {
            content: 'none !important',
            display: 'none !important',
          },
        },
      },
    },

  },
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100vh",
    width: "100%",
    padding: theme.spacing(2),
    boxSizing: "border-box",
    backgroundColor: "#f5f5f5",
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
  },
  kanbanContainer: {
    width: "100%",
    height: "calc(100vh - 80px)",
    overflowX: "auto",
    overflowY: "auto",
    padding: theme.spacing(1),
    boxSizing: "border-box",
    WebkitOverflowScrolling: "touch",
    '&::-webkit-scrollbar': {
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#555',
    },
  },
  controlsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "16px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    marginBottom: theme.spacing(2),
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    flexWrap: "wrap",
    gap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      flexDirection: "column",
      padding: theme.spacing(1),
    },
  },
  dateContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    flexWrap: "wrap",
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      gap: theme.spacing(1),
    },
  },
  dateInput: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      backgroundColor: "#ffffff",
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
  },
  selectDropdown: {
    "& .MuiSelect-root": {
      backgroundColor: "#ffffff",
    },
    "& .MuiPaper-root": {
      backgroundColor: "#ffffff",
      marginTop: "4px",
    },
  },

  searchButton: {
    backgroundColor: "#00C307",
    color: "#FFFFFF",
    borderRadius: "12px",
    padding: theme.spacing(1, 3),
    "&:hover": {
      backgroundColor: "029907",
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
  },
  addButton: {
    backgroundColor: "#00C307",
    color: "#FFFFFF",
    borderRadius: "12px",
    padding: theme.spacing(1, 3),
    "&:hover": {
      backgroundColor: "#029907",
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    border: "1px solid rgba(0, 0, 0, 0.1)",
    transition: "background-color 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "#f8f9fa",
    },
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    border: "none !important"
  },
  contactInfo: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    justifyContent: "flex-start",
    minWidth: 0,
  },
  contactName: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  ticketInfo: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
  },
  ticketInfoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: theme.spacing(1),
  },
  ticketNumber: {
    fontSize: "0.75rem",
    color: "#00C307",
    fontWeight: "600",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "scale(1.05)",
    },
  },
  contactNumber: {
    fontSize: "0.75rem",
    color: "#666",
    fontWeight: "500",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "scale(1.05)",
    },
  },
  timeInfo: {
    fontSize: "0.85rem",
    color: "#666",
    whiteSpace: "nowrap",
  },
  messageContent: {
    fontSize: "0.9rem",
    color: "#444",
    marginTop: "6px",
    marginBottom: theme.spacing(1),
    paddingTop: "6px",
    borderTop: "1px solid rgba(0, 0, 0, 0.08)",
    wordBreak: "break-word",
  },


  connectionTag: {
    backgroundColor: "#343a40",
    color: "#FFFFFF",
    padding: theme.spacing(0.5, 1),
    borderRadius: "4px",
    fontSize: "0.5rem",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  iconChannel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "24px",
  },
  sendMessageButton: {
    backgroundColor: "transparent",
    color: "#00C307",
    border: "1px solid #00C307",
    borderRadius: "4px",
    width: "26px",
    height: "20px",
    minWidth: "26px",
    padding: "3px",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(0, 195, 7, 0.1)",
      transform: "scale(1.1)",
    },
    "& .MuiSvgIcon-root": {
      fontSize: "12px",
    },
  },
  tagButton: {
    backgroundColor: "transparent",
    border: "1px solid",
    borderRadius: "4px",
    width: "26px",
    height: "20px",
    minWidth: "26px",
    padding: "3px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "default",
    "& .MuiSvgIcon-root": {
      fontSize: "12px",
    },
  },
  userBadge: {
    backgroundColor: "transparent",
    color: "#000000",
    border: "1px solid #000000",
    borderRadius: "4px",
    padding: "3px 8px",
    fontSize: "0.7rem",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    height: "20px",
    "& .MuiSvgIcon-root": {
      fontSize: "12px",
    },
  },
  cardBottomActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "4px",
    marginTop: "6px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(0, 0, 0, 0.08)",
  },
}));

const IconChannel = (channel) => {
  switch (channel) {
    case "facebook":
      return <Facebook style={{ color: "#3b5998", fontSize: "24px" }} />;
    case "instagram":
      return <Instagram style={{ color: "#e1306c", fontSize: "24px" }} />;
    case "whatsapp":
      return <WhatsApp style={{ color: "#25d366", fontSize: "24px" }} />;
    default:
      return null;
  }
};

const Kanban = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const [tags, setTags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [file, setFile] = useState({ lanes: [] });
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [moreMessage, setMoreMessage] = useState(null);
  const [funnels, setFunnels] = useState([]);
  const [selectedFunnel, setSelectedFunnel] = useState(null);
  
  // Novos estados para os filtros
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [lastFilterState, setLastFilterState] = useState(null);
  const [socketDebounceTimer, setSocketDebounceTimer] = useState(null);
  
  const jsonString = user?.queues?.map(queue => queue.UserQueue.queueId) || [];
  
  // Paleta de cores para os badges dos funis
  const funnelColors = [
    '#FFB300', // amarelo
    '#1E88E5', // azul
    '#43A047', // verde
    '#E53935', // vermelho
    '#8E24AA', // roxo
    '#F4511E', // laranja
    '#00ACC1', // ciano
    '#3949AB', // azul escuro
    '#6D4C41', // marrom
    '#757575', // cinza
  ];

  useEffect(() => {
    if (user) {
      const initializeData = async () => {
        try {
          await Promise.all([
            fetchFunnels(),
            fetchAllTags(),
            user.profile === 'admin' ? fetchAllUsers() : Promise.resolve()
          ]);
          
          // Carregar preferências salvas do usuário
          loadUserPreferences();
        } catch (error) {
          console.error('Erro ao inicializar dados:', error);
        }
      };
      
      initializeData();
    }
  }, [user]);

  // Função para carregar preferências salvas do usuário
  const loadUserPreferences = () => {
    if (user) {
      // Carregar funil selecionado
      if (user.kanbanSelectedFunnel) {
        setSelectedFunnel(user.kanbanSelectedFunnel);
      }
    }
  };

  // Efeito para carregar tags selecionadas quando allTags for carregado
  useEffect(() => {
    if (user && user.kanbanSelectedTags && user.kanbanSelectedTags.length > 0 && allTags.length > 0 && selectedTags.length === 0) {
      const savedTags = allTags.filter(tag => 
        user.kanbanSelectedTags.includes(tag.id)
      );
      setSelectedTags(savedTags);
    }
  }, [allTags, user]);

  // Efeito para carregar usuários selecionados quando allUsers for carregado
  useEffect(() => {
    if (user && user.profile === 'admin' && user.kanbanSelectedUsers && user.kanbanSelectedUsers.length > 0 && allUsers.length > 0 && selectedUsers.length === 0) {
      const savedUsers = allUsers.filter(u => 
        user.kanbanSelectedUsers.includes(u.id)
      );
      setSelectedUsers(savedUsers);
    }
  }, [allUsers, user]);

  // Função para salvar filtros do usuário
  const saveKanbanFilters = async (funnel, tags, users) => {
    try {
      await api.put(`/users/${user.id}/kanban-filters`, {
        kanbanSelectedFunnel: funnel,
        kanbanSelectedTags: tags?.map(tag => tag.id) || null,
        kanbanSelectedUsers: users?.map(user => user.id) || null
      });
    } catch (error) {
      console.error('Erro ao salvar filtros do Kanban:', error);
    }
  };

  // Efeito para atualizar dados quando filtros mudarem
  useEffect(() => {
    if (user && initialLoadComplete) {
      const currentFilterState = JSON.stringify({
        funnel: selectedFunnel,
        tags: selectedTags.map(t => t.id).sort(),
        users: selectedUsers.map(u => u.id).sort(),
        startDate,
        endDate
      });
      
      console.log('🔍 useEffect filtros:', {
        lastFilterState,
        currentFilterState,
        isEqual: lastFilterState === currentFilterState
      });
      
      // Só atualiza se realmente houve mudança
      if (lastFilterState === currentFilterState) {
        console.log('⏭️ Pulando atualização - sem mudanças');
        return;
      }
      
      console.log('✅ Agendando atualização dos filtros');
      const timeoutId = setTimeout(() => {
        setLastFilterState(currentFilterState);
        fetchTags();
      }, 800);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedFunnel, selectedTags, selectedUsers, startDate, endDate, user, initialLoadComplete]);

  // Efeito separado para salvar filtros (evita loops infinitos)
  useEffect(() => {
    if (user && initialLoadComplete && (selectedFunnel !== null || selectedTags.length > 0 || selectedUsers.length > 0)) {
      const timeoutId = setTimeout(() => {
        saveKanbanFilters(selectedFunnel, selectedTags, selectedUsers);
      }, 2000); // Delay maior para evitar muitas chamadas
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedFunnel, selectedTags, selectedUsers, initialLoadComplete]);

  const fetchAllTags = async () => {
    try {
      const response = await api.get("/tags/list");
      setAllTags(response.data || []);
      return response.data || [];
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get("/users/list");
      setAllUsers(response.data || []);
      return response.data || [];
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const fetchTags = async () => {
    try {
      console.log('🔄 fetchTags chamado:', new Date().toLocaleTimeString());
      if (initialLoadComplete) {
        setIsFilterLoading(true);
      }
      const response = await api.get("/tag/kanban/", {
        params: {
          funilId: selectedFunnel
        }
      });
      const fetchedTags = response.data.lista || [];
      setTags(fetchedTags);
      await fetchTickets();
    } catch (error) {
      console.log(error);
    } finally {
      if (initialLoadComplete) {
        // Pequeno delay para mostrar que algo aconteceu
        setTimeout(() => {
          setIsFilterLoading(false);
        }, 200);
      }
    }
  };

  const fetchFunnels = async () => {
    try {
      const { data } = await api.get("/funilkanban");
      setFunnels(data.funilKanbans || []);
      return data.funilKanbans || [];
    } catch (err) {
      // erro silencioso
      return [];
    }
  };

  const fetchTickets = async () => {
    try {
      const params = {
        queueIds: JSON.stringify(jsonString),
        startDate,
        endDate
      };

      // Só adiciona os parâmetros se houver valores válidos
      if (selectedFunnel) {
        params.funilId = selectedFunnel;
      }
      
      if (selectedTags.length > 0) {
        params.tags = JSON.stringify(selectedTags.map(tag => tag.id));
      }
      
      if (selectedUsers.length > 0) {
        params.users = JSON.stringify(selectedUsers.map(user => user.id));
      }
      
      const { data } = await api.get("/ticket/kanban", { params });
      setTickets(data.tickets);
    } catch (err) {
      console.error('❌ Erro ao buscar tickets:', err);
      setTickets([]);
    }
  };

  useEffect(() => {
    if (user?.companyId && socket && initialLoadComplete) {
      const companyId = user.companyId;
      
      const onAppMessage = (data) => {
        if (data.action === "create" || data.action === "update" || data.action === "delete") {
          // Debounce robusto para evitar muitas atualizações
          if (socketDebounceTimer) {
            clearTimeout(socketDebounceTimer);
          }
          
          const newTimer = setTimeout(() => {
            fetchTags();
            setSocketDebounceTimer(null);
          }, 2000);
          
          setSocketDebounceTimer(newTimer);
        }
      };

      socket.on(`company-${companyId}-ticket`, onAppMessage);
      socket.on(`company-${companyId}-appMessage`, onAppMessage);

      return () => {
        socket.off(`company-${companyId}-ticket`, onAppMessage);
        socket.off(`company-${companyId}-appMessage`, onAppMessage);
      };
    }
  }, [socket, user, initialLoadComplete]);

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const handleFunnelChange = (event) => {
    setSelectedFunnel(event.target.value === "" ? null : event.target.value);
  };



  const handleCardClick = (uuid) => {
    history.push('/tickets/' + uuid);
  };

  const handleAddConnectionClick = () => {
    history.push('/tagsKanban');
  };

  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {      
      const result = await Swal.fire({
        title: 'Mover Ticket?',
        text: "Esta ação enviará uma mensagem automática para o cliente informando a mudança para a próxima coluna",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, mover!',
        cancelButtonText: 'Cancelar'
      });
  
      if (result.isConfirmed) {
        await api.delete(`/ticket-tags/${targetLaneId}`);
        toast.success('Removido com sucesso');
        await api.put(`/ticket-tags/${targetLaneId}/${sourceLaneId}`);
        toast.success('Adicionado com sucesso');
        await fetchTickets();
        popularCards();
      } else {
        await fetchTickets();
        popularCards();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao mover ticket');
      await fetchTickets();
      popularCards();
    }
  };

  // Função para formatar telefone brasileiro
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove o código do país (55) se existir
    let cleanNumber = phoneNumber.replace(/^\+?55/, '');
    
    // Remove caracteres não numéricos
    cleanNumber = cleanNumber.replace(/\D/g, '');
    
    // Adiciona o 9 na frente se for celular e não tiver
    if (cleanNumber.length === 10 && ['6', '7', '8', '9'].includes(cleanNumber[2])) {
      cleanNumber = cleanNumber.slice(0, 2) + '9' + cleanNumber.slice(2);
    }
    
    // Formata no padrão (99) 99999-9999
    if (cleanNumber.length === 11) {
      return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 7)}-${cleanNumber.slice(7)}`;
    }
    
    // Se não conseguir formatar, retorna o número original
    return phoneNumber;
  };

  // Função para copiar texto para clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Número copiado!');
    } catch (err) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Número copiado!');
    }
  };

  // Função para obter todas as tags normais (não kanban) do ticket
  const getNormalTags = (ticket) => {
    let normalTags = [];
    
    // Verifica primeiro nas tags do contato
    if (ticket.contact && ticket.contact.tags) {
      const contactNormalTags = ticket.contact.tags.filter(tag => tag.kanban === 0);
      normalTags = [...normalTags, ...contactNormalTags];
    }
    
    // Se não encontrou, verifica nas tags diretas do ticket
    if (ticket.tags) {
      const ticketNormalTags = ticket.tags.filter(tag => tag.kanban === 0);
      normalTags = [...normalTags, ...ticketNormalTags];
    }
    
    // Remove duplicatas baseado no ID
    const uniqueTags = normalTags.filter((tag, index, self) => 
      index === self.findIndex(t => t.id === tag.id)
    );
    
    return uniqueTags;
  };

  const popularCards = () => {
    if (!initialLoadComplete) return;
    
    const filteredTickets = tickets.filter(ticket => ticket.tags.length === 0);
    


    const createCardContent = (ticket) => ({
      id: ticket.id.toString(),
      title: ' ',
      description: (
        <div className={classes.card}>
          <div className={classes.cardHeader}>
            <div className={classes.contactInfo}>
              <div className={classes.iconChannel}>
                <Tooltip title={ticket.whatsapp?.name || ''}>
                  {IconChannel(ticket.channel)}
                </Tooltip>
              </div>
              <Typography className={classes.contactName}>
                {ticket.contact.name}
              </Typography>
            </div>
            <Typography className={classes.timeInfo}>
              {isSameDay(parseISO(ticket.updatedAt), new Date())
                ? format(parseISO(ticket.updatedAt), "HH:mm")
                : format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}
            </Typography>
          </div>

          <div className={classes.ticketInfo}>
            <div className={classes.ticketInfoContainer}>
              <Typography 
                className={classes.ticketNumber}
                onClick={() => copyToClipboard(ticket.id.toString())}
                title="Clique para copiar o número do ticket"
              >
                Ticket nº {ticket.id}
              </Typography>
              <Typography 
                className={classes.contactNumber}
                onClick={() => copyToClipboard(ticket.contact.number.replace(/\D/g, ''))}
                title="Clique para copiar o número"
              >
                {formatPhoneNumber(ticket.contact.number)}
              </Typography>
            </div>
          </div>
          <div className={classes.messageContent}>
            {moreMessage === ticket.id ? (
              <Typography variant="body2">
                {ticket.lastMessage}
              </Typography>
            ) : (
              <Typography variant="body2">
                {ticket.lastMessage?.length > 70
                  ? `${ticket.lastMessage.substring(0, 70)}...`
                  : ticket.lastMessage}
              </Typography>
            )}
          </div>

          <div className={classes.cardBottomActions}>
            {/* Botão de enviar mensagem */}
            <Tooltip title="Abrir conversa">
              <IconButton
                className={classes.sendMessageButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(ticket.uuid);
                }}
                size="small"
              >
                <Send />
              </IconButton>
            </Tooltip>

            {/* Botão da tag (se existir) */}
            {getNormalTags(ticket).length > 0 && (
              <Tooltip title={getNormalTags(ticket)[0].name}>
                <div 
                  className={classes.tagButton}
                  style={{ 
                    borderColor: getNormalTags(ticket)[0].color,
                    color: getNormalTags(ticket)[0].color 
                  }}
                >
                  <LocalOffer />
                </div>
              </Tooltip>
            )}

            {/* Badge do usuário responsável */}
            {ticket?.user && (
              <div className={classes.userBadge}>
                <Person />
                <span>{ticket.user.name.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      ),
      draggable: true,
      href: "/tickets/" + ticket.uuid,
    });

    const lanes = [
      {
        id: "lane0",
        title: i18n.t("tagsKanban.laneDefault"),
        label: filteredTickets.length.toString(),
        cards: filteredTickets.map(ticket => createCardContent(ticket)),
        style: {
          backgroundColor: "#ffffff",
          color: "#444",
        }
      },
      ...tags.map(tag => {
        const tagTickets = tickets.filter(ticket =>
          ticket.tags.some(ticketTag => ticketTag.id === tag.id)
        );
        

        
        const funilIndex = funnels.findIndex(f => f.id === tag.funilId);
        const funilName = funnels[funilIndex]?.name;
        const funilColor = funilIndex >= 0 ? funnelColors[funilIndex % funnelColors.length] : '#e0e0e0';
        return {
          id: tag.id.toString(),
          title: tag.name,
          funilName: funilName || null,
          funilColor,
          label: tagTickets.length.toString(),
          style: {
            backgroundColor: "#ffffff",
            color: "#444",
            borderTop: `3px solid ${tag.color}`
          },
          cards: tagTickets.map(ticket => createCardContent(ticket)),
        };
      }),
    ];

    setFile({ lanes });
  };

  useEffect(() => {
    if ((tickets.length > 0 || tags.length > 0) && initialLoadComplete) {
      popularCards();
    }
  }, [tickets, tags, initialLoadComplete]);

  // Remove tooltips do react-trello após renderização
  useEffect(() => {
    const removeTooltips = () => {
      // Remove atributo title de todos os elementos que podem ter tooltip
      const selectors = [
        '.react-trello-lane-header',
        '.react-trello-lane-header *',
        '[data-react-trello-lane-id]',
        '[data-react-trello-lane-id] *',
        '.react-trello-lane',
        '.react-trello-lane *'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.hasAttribute('title')) {
            el.removeAttribute('title');
          }
          // Remove também data-title se existir
          if (el.hasAttribute('data-title')) {
            el.removeAttribute('data-title');
          }
        });
      });
    };

    // Executa múltiplas vezes para garantir que pegue todos os elementos
    const timeouts = [
      setTimeout(removeTooltips, 50),
      setTimeout(removeTooltips, 200),
      setTimeout(removeTooltips, 500),
    ];
    
    // Observer para detectar mudanças no DOM
    const observer = new MutationObserver(() => {
      removeTooltips();
    });
    
    // Observa mudanças no container do kanban
    const kanbanContainer = document.querySelector('.react-trello-board');
    if (kanbanContainer) {
      observer.observe(kanbanContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['title', 'data-title']
      });
    }
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      observer.disconnect();
    };
  }, [file]); // Executa sempre que o file (dados do kanban) mudar

  return (
    <div className={classes.root}>
      <div className={classes.controlsContainer}>
        <div className={classes.dateContainer}>
          <TextField
            label="Data de início"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            className={classes.dateInput}
            size="small"
          />
          <TextField
            label="Data de fim"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            className={classes.dateInput}
            size="small"
          />
          <FormControl 
            variant="outlined" 
            size="small" 
            className={`${classes.dateInput} ${classes.selectDropdown}`} 
            style={{ minWidth: 200 }}
          >
            <InputLabel>Filtrar por Funil</InputLabel>
            <Select
              value={selectedFunnel || ""}
              onChange={handleFunnelChange}
              label="Filtrar por Funil"
              MenuProps={{
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "left"
                },
                transformOrigin: {
                  vertical: "top",
                  horizontal: "left"
                },
                getContentAnchorEl: null,
                PaperProps: {
                  style: {
                    backgroundColor: "#ffffff",
                    marginTop: "4px",
                  }
                }
              }}
            >
              <MenuItem value="">Todos os Funis</MenuItem>
              {funnels.map(funnel => (
                <MenuItem key={funnel.id} value={funnel.id}>{funnel.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Filtro de Tags */}
          <FormControl 
            variant="outlined" 
            size="small" 
            className={`${classes.dateInput} ${classes.selectDropdown}`} 
            style={{ minWidth: 250 }}
          >
            <InputLabel>Filtrar por Tags</InputLabel>
            <Select
              multiple
              value={selectedTags.map(tag => tag.id)}
              onChange={(event) => {
                const selectedIds = event.target.value;
                const selectedTagsArray = allTags.filter(tag => selectedIds.includes(tag.id));
                setSelectedTags(selectedTagsArray);
              }}
              label="Filtrar por Tags"
              renderValue={(selected) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selected.map((tagId) => {
                    const tag = allTags.find(t => t.id === tagId);
                    return tag ? (
                      <Chip
                        key={tagId}
                        label={tag.name}
                        size="small"
                        style={{
                          backgroundColor: tag.color || "#eee",
                          color: "white",
                          fontSize: "0.75rem",
                          height: "24px"
                        }}
                      />
                    ) : null;
                  })}
                </div>
              )}
              MenuProps={{
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "left"
                },
                transformOrigin: {
                  vertical: "top",
                  horizontal: "left"
                },
                getContentAnchorEl: null,
                PaperProps: {
                  style: {
                    backgroundColor: "#ffffff",
                    marginTop: "4px",
                    maxHeight: "200px"
                  }
                }
              }}
            >
              {allTags.map(tag => (
                <MenuItem key={tag.id} value={tag.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div 
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: tag.color || "#eee"
                      }}
                    />
                    {tag.name}
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Filtro de Usuários - apenas para admin */}
          {user?.profile === 'admin' && (
            <FormControl 
              variant="outlined" 
              size="small" 
              className={`${classes.dateInput} ${classes.selectDropdown}`} 
              style={{ minWidth: 250 }}
            >
              <InputLabel>Filtrar por Usuário</InputLabel>
              <Select
                multiple
                value={selectedUsers.map(user => user.id)}
                onChange={(event) => {
                  const selectedIds = event.target.value;
                  const selectedUsersArray = allUsers.filter(user => selectedIds.includes(user.id));
                  setSelectedUsers(selectedUsersArray);
                }}
                label="Filtrar por Usuário"
                renderValue={(selected) => (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {selected.map((userId) => {
                      const user = allUsers.find(u => u.id === userId);
                      return user ? (
                        <Chip
                          key={userId}
                          label={user.name}
                          size="small"
                          style={{
                            backgroundColor: "#f5f5f5",
                            color: "#333",
                            fontSize: "0.75rem",
                            height: "24px"
                          }}
                        />
                      ) : null;
                    })}
                  </div>
                )}
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left"
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left"
                  },
                  getContentAnchorEl: null,
                  PaperProps: {
                    style: {
                      backgroundColor: "#ffffff",
                      marginTop: "4px",
                      maxHeight: "200px"
                    }
                  }
                }}
              >
                {allUsers.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Person style={{ fontSize: 16, color: '#666' }} />
                      {user.name}
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </div>
        <Can role={user?.profile} perform="dashboard:view" yes={() => (
          <Button
            variant="contained"
            className={classes.addButton}
            onClick={handleAddConnectionClick}
            startIcon={<Add />}
            size="medium"
          >
            Gerenciar Funis
          </Button>
        )} />
      </div>
      <div className={classes.kanbanContainer}>
        <div style={{ position: 'relative' }}>
          {isFilterLoading && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 195, 7, 0.1)',
              padding: '6px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(0, 195, 7, 0.2)',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(0, 195, 7, 0.3)',
                borderTop: '2px solid #00C307',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <Typography style={{ color: '#00C307', fontSize: '11px', fontWeight: 500 }}>
                Atualizando
              </Typography>
            </div>
          )}
          <Board
            data={file}
            onCardMoveAcrossLanes={handleCardMove}
            style={{
              backgroundColor: 'transparent',
              height: '100%',
              borderBottom: 'none !important'
            }}
            laneStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '12px',
              marginRight: '12px',
              minWidth: window.innerWidth <= 600 ? '260px' : '260px',
              maxWidth: window.innerWidth <= 600 ? '280px' : '280px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              borderBottom: 'none !important',
            }}
            cardStyle={{
              padding: 0,
              marginBottom: '6px',
              border: 'none',
              boxShadow: 'none',
              backgroundColor: 'transparent',
              borderTop: 'none',
              '& > div': {
                borderTop: 'none !important'
              }
            }}
            hideCardDeleteIcon
            tagStyle={{ display: 'none' }}
            cardDraggable={true}
            laneDraggable={false}
            handleDragStart={null}
            handleDragEnd={null}
            components={{
              LaneHeader: ({ title, label, funilName, funilColor }) => (
                <div 
                  style={{
                    padding: '0',
                    marginBottom: '0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: 'none !important'
                  }}
                  title="" // Remove tooltip
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Typography 
                      style={{
                        fontWeight: 600,
                        color: '#444',
                        fontSize: window.innerWidth <= 600 ? '1rem' : '1.1rem'
                      }}
                      title="" // Remove tooltip
                    >{title}</Typography>
                    {funilName && (
                      <span style={{
                        background: funilColor,
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '2px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginLeft: 4
                      }}>{funilName}</span>
                    )}
                  </div>
                  <Typography style={{
                    backgroundColor: '#f5f5f5',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: window.innerWidth <= 600 ? '0.75rem' : '0.875rem',
                    color: '#666'
                  }}>{label}</Typography>
                </div>
              )
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Função debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default Kanban;
