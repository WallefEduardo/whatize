import React, { useState, useEffect, useContext, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from 'react-trello';
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { useHistory } from 'react-router-dom';
import { Facebook, Instagram, WhatsApp, Add, Send, Person, LocalOffer } from "@material-ui/icons";
import { Tooltip, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, IconButton, Badge, Avatar } from "@material-ui/core";
import { format, isSameDay, parseISO, subMonths } from "date-fns";
import { Can } from "../../components/Can";
import Swal from "sweetalert2";

const useStyles = makeStyles(theme => ({
  '@global': {
    // Força barras de rolagem sempre visíveis
    '.react-trello-board': {
      overflowX: 'auto !important',
      overflowY: 'hidden !important',
      scrollbarWidth: 'auto !important',
      scrollbarColor: '#888 #f1f1f1 !important',
      height: '100% !important', // Altura fixa sem scroll vertical
      display: 'flex !important',
      flexWrap: 'nowrap !important',
      width: '100% !important',
      padding: '0 !important',
      '&::-webkit-scrollbar': {
        height: '12px !important',
        width: '12px !important',
        display: 'block !important',
        visibility: 'visible !important',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1 !important',
        borderRadius: '6px !important',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888 !important',
        borderRadius: '6px !important',
        '&:hover': {
          background: '#555 !important',
        },
      },
      '&::-webkit-scrollbar-corner': {
        background: '#f1f1f1 !important',
      },
    },
    // Colunas com altura dinâmica e fundo transparente
    '.react-trello-lane': {
      minWidth: '180px !important',
      maxWidth: '200px !important', 
      width: '190px !important',
      minHeight: '100px !important', // Altura mínima reduzida
      maxHeight: '400px !important', // Altura máxima fixa em pixels
      margin: '0 6px !important',
      flex: '0 0 auto !important',
      display: 'flex !important',
      flexDirection: 'column !important',
      backgroundColor: 'rgba(0, 0, 0, 0.2) !important', // Fundo preto com 20% de transparência
      borderRadius: '8px !important',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1) !important',
      border: '1px solid rgba(0, 0, 0, 0.3) !important',
              '& .react-trello-lane-header': {
          minHeight: '35px !important',
          padding: '6px 10px !important',
          whiteSpace: 'nowrap !important',
          overflow: 'hidden !important',
          textOverflow: 'ellipsis !important',
          width: '100% !important',
          backgroundColor: 'rgba(255, 255, 255, 0.95) !important', // Header com fundo branco mais opaco
        '& h3': {
          whiteSpace: 'nowrap !important',
          overflow: 'hidden !important',
          textOverflow: 'ellipsis !important',
          margin: '0 !important',
          fontSize: '0.9rem !important',
          fontWeight: '600 !important',
        },
      },
              '& .smooth-dnd-container': {
          minHeight: '50px !important', // Altura mínima pequena
          maxHeight: 'calc(400px - 80px) !important', // Altura máxima considerando header (320px)
          overflowY: 'auto !important',
          overflowX: 'hidden !important',
          flex: '1 1 auto !important',
        // Scrollbar customizada para as colunas
        scrollbarWidth: 'thin !important',
        scrollbarColor: '#888 #f1f1f1 !important',
        '&::-webkit-scrollbar': {
          width: '6px !important',
          display: 'block !important',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1 !important',
          borderRadius: '3px !important',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888 !important',
          borderRadius: '3px !important',
          '&:hover': {
            background: '#555 !important',
          },
        },
      },
    },
    // Remove estilos desnecessários
    '.react-trello-lane > div:last-child': {
      flex: '1 1 auto !important',
      overflowY: 'auto !important',
      minHeight: '50px !important',
    },
    '.dOlrNy': {
      overflowY: 'auto !important',
    },
    // Força scrollbar em todos os containers de cards
    '.react-trello-lane .smooth-dnd-container': {
      overflowY: 'auto !important',
      scrollbarWidth: 'thin !important',
      scrollbarColor: '#888 #f1f1f1 !important',
      '&::-webkit-scrollbar': {
        width: '6px !important',
        display: 'block !important',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1 !important',
        borderRadius: '3px !important',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888 !important',
        borderRadius: '3px !important',
      },
    },
    // Otimização para monitores menores
    '@media (max-width: 1600px)': {
      '.react-trello-lane': {
        minWidth: '160px !important',
        maxWidth: '180px !important',
        width: '170px !important',
        margin: '0 4px !important',
      },
    },
    '@media (max-width: 1200px)': {
      '.react-trello-lane': {
        minWidth: '140px !important',
        maxWidth: '160px !important',
        width: '150px !important',
        margin: '0 3px !important',
      },
    },
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    '@keyframes slideInFromRight': {
      '0%': {
        transform: 'translateX(100%)',
        opacity: 0,
      },
      '100%': {
        transform: 'translateX(0)',
        opacity: 1,
      },
    },
    '@keyframes pulse': {
      '0%': {
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
      },
      '50%': {
        boxShadow: '0 6px 16px rgba(76, 175, 80, 0.5)',
      },
      '100%': {
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
      },
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
    // Habilita drag das lanes
    '.react-trello-lane': {
      cursor: 'grab !important',
      '&:active': {
        cursor: 'grabbing !important',
      },
    },
    // Garante que o header da lane seja arrastável
    '.react-trello-lane-header': {
      cursor: 'grab !important',
      userSelect: 'none !important',
      '&:active': {
        cursor: 'grabbing !important',
      },
    },
    // Força o drag das lanes
    '.react-trello-board .react-trello-lane': {
      '&[draggable="true"]': {
        cursor: 'grab !important',
      },
      '&:hover': {
        cursor: 'grab !important',
      },
    },
    // Garante que elementos filhos não interfiram
    '.react-trello-lane-header *': {
      pointerEvents: 'none !important',
    },
    // Classes de drag das lanes
    '.lane-dragging': {
      opacity: '0.5 !important',
      transform: 'rotate(5deg) !important',
      zIndex: '1000 !important',
    },
    '.lane-dropping': {
      opacity: '1 !important',
      transform: 'none !important',
    },
    // Garante visibilidade dos cards
    '.react-trello-card': {
      display: 'block !important',
      visibility: 'visible !important',
      opacity: '1 !important',
    },
    // Remove qualquer borderTop das lanes
    '.react-trello-lane': {
      borderTop: 'none !important',
      border: 'none !important',
    },
    // Estilos para melhorar o drag manual - APENAS para áreas de fundo
    '.react-trello-board': {
      cursor: 'grab !important',
      '&.dragging': {
        cursor: 'grabbing !important',
        userSelect: 'none !important',
      },
    },
    // Container horizontal principal (área de fundo)
    '.smooth-dnd-container.horizontal': {
      cursor: 'grab !important',
      '&:hover': {
        cursor: 'grab !important',
      },
    },
    // Headers de coluna mantêm cursor padrão para drag de colunas
    '.react-trello-lane-header': {
      cursor: 'grab !important',
      '&:active': {
        cursor: 'grabbing !important',
      },
    },
    // Cards mantêm cursor padrão para drag de cards
    '.react-trello-card': {
      cursor: 'grab !important',
      '&:active': {
        cursor: 'grabbing !important',
      },
    },
    // Estilos específicos para lanes do Kanban
    '.react-trello-lane': {
      // Removido duplicação - estilos movidos para a seção anterior
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
    overflow: 'hidden', // Remove scroll vertical da página
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
  },
  kanbanContainer: {
    width: "100%",
    height: "calc(100vh - 120px)", // Altura fixa deixando menos espaço para controles
    display: 'flex',
    flexDirection: 'column',
    cursor: 'grab',
    userSelect: 'none',
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden', // Container principal sem scroll
    // EFEITO ZOOM REMOVIDO - Agora ocupa toda a largura e altura normalmente
  },
  boardWrapper: {
    flex: 1,
    overflowX: 'auto !important', // Scroll horizontal apenas
    overflowY: 'hidden !important', // Sem scroll vertical
    height: '100%', // Usa toda a altura do container
    scrollbarWidth: "thin", // Firefox
    scrollbarColor: "#888 #f1f1f1", // Firefox
    cursor: 'grab',
    position: 'relative',
    scrollBehavior: 'auto',
    '&::-webkit-scrollbar': {
      height: '12px !important',
      display: 'block !important',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
      borderRadius: '6px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '6px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#666',
    },
  },
  dragBackgroundArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    cursor: 'grab',
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
    borderRadius: "10px",
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(0.5),
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.8),
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
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    minWidth: 0,
  },
  contactName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  contactDate: {
    fontSize: "0.7rem",
    color: "#666",
    whiteSpace: "nowrap",
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
    fontSize: "0.85rem",
    color: "#444",
    marginTop: "4px",
    marginBottom: theme.spacing(0.8),
    paddingTop: "4px",
    borderTop: "1px solid rgba(0, 0, 0, 0.08)",
    wordBreak: "break-word",
  },
  // NOVOS ESTILOS PARA AS TAGS RESPONSIVAS
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    paddingBottom: '8px',
  },
  
  tagChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '0.65rem',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    // Garante que a tag não ultrapasse o limite
    maxWidth: '100%',
    minWidth: 'fit-content',
    '& svg': {
      flexShrink: 0,
    },
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
    display: 'flex',
    alignItems: 'center',
    marginRight: '4px',
    '& svg': {
      width: 16,
      height: 16,
    },
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
    marginTop: "4px",
    paddingTop: "6px",
    borderTop: "1px solid rgba(0, 0, 0, 0.08)",
  },
  contactDetails: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
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
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), "yyyy-MM-dd"));
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
  const [columnOrder, setColumnOrder] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  
  // Estados para drag to scroll
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const kanbanContainerRef = React.useRef(null);
  const boardWrapperRef = React.useRef(null); // Ref para o container com a scrollbar
  
  // Refs para valores atuais (evita problema de closure)
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  
  // Estados para updates em tempo real
  const [newCards, setNewCards] = useState([]);
  const [updateQueue, setUpdateQueue] = useState([]);
  const updateQueueRef = React.useRef([]);
  const processingUpdates = React.useRef(false);
  
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
            user.profile === 'admin' ? fetchAllUsers() : Promise.resolve(),
            loadColumnOrder()
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

  // Função para carregar ordem das colunas do usuário
  const loadColumnOrder = async () => {
    try {
      const response = await api.get(`/users/${user.id}/kanban-column-order`);
      if (response.data && response.data.length > 0) {
        setColumnOrder(response.data);
      }
    } catch (error) {
      console.log('Nenhuma ordem personalizada encontrada, usando padrão');
    }
  };

  // Função para salvar ordem das colunas
  const saveColumnOrder = async (newOrder) => {
    try {
      await api.post(`/users/${user.id}/kanban-column-order`, {
        columnOrders: newOrder
      });
    } catch (error) {
      console.error('Erro ao salvar ordem das colunas:', error);
    }
  };

  // Função para aplicar ordem personalizada nas lanes
  const applyColumnOrder = (lanes) => {
    if (columnOrder.length === 0) {
      return lanes; // Retorna ordem padrão se não há personalização
    }

    const orderedLanes = [];
    const laneMap = new Map();
    
    // Mapeia lanes por ID
    lanes.forEach(lane => {
      laneMap.set(lane.id, lane);
    });

    // Aplica ordem personalizada
    columnOrder.forEach(orderItem => {
      const lane = laneMap.get(orderItem.columnId);
      if (lane) {
        orderedLanes.push(lane);
        laneMap.delete(orderItem.columnId);
      }
    });

    // Adiciona lanes não ordenadas no final (novas colunas)
    laneMap.forEach(lane => {
      orderedLanes.push(lane);
    });

    return orderedLanes;
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
          // Adicionar à fila de atualizações ao invés de recarregar tudo
          updateQueueRef.current.push({
            ...data,
            timestamp: Date.now()
          });
          
          // Processar fila com debounce menor (500ms)
          if (socketDebounceTimer) {
            clearTimeout(socketDebounceTimer);
          }
          
          const newTimer = setTimeout(() => {
            processUpdateQueue();
            setSocketDebounceTimer(null);
          }, 500);
          
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
        await api.put(`/ticket-tags/${targetLaneId}/${sourceLaneId}`);
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

  // Callback para drag das lanes (colunas)
  const handleLaneDragEnd = async (removedIndex, addedIndex, payload) => {
    if (removedIndex === addedIndex) return; // Não houve mudança

    setIsReordering(true);
    
    try {
      // Atualiza ordem local imediatamente para UX responsiva
      const currentLanes = file.lanes;
      const newLanes = [...currentLanes];
      const [movedLane] = newLanes.splice(removedIndex, 1);
      newLanes.splice(addedIndex, 0, movedLane);

      // Atualiza estado local
      setFile({ lanes: newLanes });

      // Cria nova ordem para salvar
      const newOrder = newLanes.map((lane, index) => ({
        columnId: lane.id,
        columnType: lane.id === 'lane0' ? 'default' : 'tag',
        position: index
      }));

      // Salva no backend com debounce
      setTimeout(() => {
        saveColumnOrder(newOrder);
        setColumnOrder(newOrder);
        setIsReordering(false);
      }, 500);

    } catch (error) {
      console.error('Erro ao reordenar colunas:', error);
      setIsReordering(false);
      // Recarrega dados em caso de erro
      fetchTags();
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

    // Funções para drag to scroll
  const handleMouseDown = e => {
    const target = e.target;
    const boardWrapper = boardWrapperRef.current;
    if (!boardWrapper) return;



    // 1. PRIMEIRA PRIORIDADE: Verifica se é clique na scrollbar
    const rect = boardWrapper.getBoundingClientRect();
    const scrollbarHeight = 15;
    const isScrollbarClick = (
      e.clientY >= rect.bottom - scrollbarHeight && 
      e.clientY <= rect.bottom &&
      e.clientX >= rect.left && 
      e.clientX <= rect.right
    );
    
    if (isScrollbarClick) {
      return; // Deixa o navegador lidar com a scrollbar
    }

    // 2. SEGUNDA PRIORIDADE: Elementos que têm suas próprias funcionalidades de drag
    const elementsWithOwnDrag = [
      '.react-trello-card', // Cards têm drag próprio
      '.react-trello-lane-header', // Headers de coluna têm drag próprio
      '.smooth-dnd-draggable-wrapper', // Wrappers de drag da biblioteca
      'button', 'input', 'select', 'textarea',
      '.MuiIconButton-root', '[role="button"]',
      'a', 'svg', 'path'
    ];
    
    const hasOwnDragFunctionality = elementsWithOwnDrag.some(selector => target.closest(selector));
    if (hasOwnDragFunctionality) {
      return; // Deixa a biblioteca lidar com o drag
    }

         // 3. TERCEIRA PRIORIDADE: Verifica se é uma área válida para drag manual
     // Aceita apenas cliques em áreas de fundo vazias
     
     // Verifica se clicou em uma área que NÃO deve ativar drag manual
     const isInForbiddenArea = (
       // Dentro de uma lane (coluna)
       target.closest('.react-trello-lane') ||
       // Dentro de um card
       target.closest('.react-trello-card') ||
       // Headers de lane
       target.closest('.react-trello-lane-header') ||
       // Wrappers de drag
       target.closest('.smooth-dnd-draggable-wrapper')
     );
     
         if (isInForbiddenArea) {
      return;
    }
     
         // Se não está em área proibida e está dentro do board, pode fazer drag manual
    const isInBoardArea = boardWrapper.contains(target);
    if (!isInBoardArea) {
      return;
    }

         // 4. Se chegou até aqui, é um clique válido para drag manual
     
     // Obter scroll atual do elemento correto (board filho se necessário)
     let currentScrollLeft = boardWrapper.scrollLeft;
     const boardElement = boardWrapper.querySelector('.react-trello-board');
     if (currentScrollLeft === 0 && boardElement && boardElement.scrollLeft > 0) {
       currentScrollLeft = boardElement.scrollLeft;
     }
     
     // Atualizar tanto o estado quanto as refs
     setIsDragging(true);
     setStartX(e.pageX);
     setScrollLeft(currentScrollLeft);
     
     isDraggingRef.current = true;
     startXRef.current = e.pageX;
     scrollLeftRef.current = currentScrollLeft;
     

     
     // Aplicar estilos visuais para indicar que está arrastando
     document.body.style.cursor = 'grabbing';
     document.body.style.userSelect = 'none';
     boardWrapper.style.cursor = 'grabbing';
     
     // Adicionar classe CSS para indicar estado de drag
     const boardForClass = boardWrapper.querySelector('.react-trello-board');
     if (boardForClass) {
       boardForClass.classList.add('dragging');
     }
     
     e.preventDefault(); // Previne seleção de texto e outros comportamentos
  };

  const handleMouseMove = e => {
    if (!isDraggingRef.current) {
      return;
    }
    
    const boardWrapper = boardWrapperRef.current;
    if (!boardWrapper) {
      console.log('❌ boardWrapper não encontrado no handleMouseMove');
      return;
    }

    const x = e.pageX;
    const walk = (x - startXRef.current) * 2; // Sensibilidade do scroll
    const newScrollLeft = Math.max(0, scrollLeftRef.current - walk); // Não permitir valores negativos



    // Aplicar o scroll
    boardWrapper.scrollLeft = newScrollLeft;
    
    // Verificar se foi aplicado
    const actualScrollLeft = boardWrapper.scrollLeft;
    
         // Se não funcionou, tentar no elemento filho (react-trello-board)
     if (actualScrollLeft === 0 && newScrollLeft >= 0) {
       const boardChild = boardWrapper.querySelector('.react-trello-board');
       if (boardChild) {
         boardChild.scrollLeft = newScrollLeft;
       }
     }
    
    
  };

         const handleMouseUp = e => {
    if (isDraggingRef.current) {
      
      // Atualizar tanto o estado quanto as refs
      setIsDragging(false);
      isDraggingRef.current = false;
      
      // Restaurar estilos
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
      
      const boardWrapper = boardWrapperRef.current;
      if (boardWrapper) {
        boardWrapper.style.cursor = 'grab';
        
        // Remover classe CSS de drag
        const boardForMouseUp = boardWrapper.querySelector('.react-trello-board');
        if (boardForMouseUp) {
          boardForMouseUp.classList.remove('dragging');
        }
      }
    }
  };

         const handleMouseLeave = e => {
    if (isDraggingRef.current) {
      
      // Atualizar tanto o estado quanto as refs
      setIsDragging(false);
      isDraggingRef.current = false;
      
      // Restaurar estilos
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
      
      const boardWrapper = boardWrapperRef.current;
      if (boardWrapper) {
        boardWrapper.style.cursor = 'grab';
        
        // Remover classe CSS de drag
        const boardForMouseLeave = boardWrapper.querySelector('.react-trello-board');
        if (boardForMouseLeave) {
          boardForMouseLeave.classList.remove('dragging');
        }
      }
    }
  };

  // Adicionar event listeners para drag to scroll
  React.useEffect(() => {
    const container = kanbanContainerRef.current;
    const boardWrapper = boardWrapperRef.current;
    
    if (container && boardWrapper) {
      
      // Configurar cursor inicial
      container.style.cursor = 'grab';
      boardWrapper.style.cursor = 'grab';
      
             // Funções locais para os event listeners
       const handleMouseDownLocal = (e) => {
         handleMouseDown(e);
       };
       
       const handleMouseMoveLocal = (e) => {
         handleMouseMove(e);
       };
       
       const handleMouseUpLocal = (e) => {
         handleMouseUp(e);
       };
       
       const handleMouseLeaveLocal = (e) => {
         handleMouseLeave(e);
       };
      
      // Adicionar eventos
      container.addEventListener('mousedown', handleMouseDownLocal, { passive: false });
      document.addEventListener('mousemove', handleMouseMoveLocal, { passive: false });
      document.addEventListener('mouseup', handleMouseUpLocal, { passive: false });
      container.addEventListener('mouseleave', handleMouseLeaveLocal, { passive: false });
      
      return () => {
        container.removeEventListener('mousedown', handleMouseDownLocal);
        document.removeEventListener('mousemove', handleMouseMoveLocal);
        document.removeEventListener('mouseup', handleMouseUpLocal);
        container.removeEventListener('mouseleave', handleMouseLeaveLocal);
      };
    }
  }, []); // Sem dependências - só executa uma vez

  // Função para processar fila de atualizações em tempo real
  const processUpdateQueue = async () => {
    if (processingUpdates.current || updateQueueRef.current.length === 0) {
      return;
    }

    processingUpdates.current = true;
    
    try {
      const updates = [...updateQueueRef.current];
      updateQueueRef.current = []; // Limpar fila
      
      // Agrupar updates por tipo
      const creates = updates.filter(u => u.action === 'create');
      const updatesData = updates.filter(u => u.action === 'update');
      const deletes = updates.filter(u => u.action === 'delete');
      
      // Processar apenas se há mudanças significativas
      if (creates.length > 0 || updatesData.length > 0 || deletes.length > 0) {
        console.log(`🔄 Processando updates: ${creates.length} creates, ${updatesData.length} updates, ${deletes.length} deletes`);
        
        // Para mudanças complexas, fazer refresh completo mas otimizado
        if (deletes.length > 0 || updatesData.length > 3) {
          await fetchTickets();
          popularCards();
        } else {
          // Para novos tickets, adicionar incrementalmente
          await handleIncrementalUpdates(creates, updatesData);
        }
      }
    } catch (error) {
      console.error('Erro ao processar updates:', error);
      // Fallback para refresh completo
      await fetchTickets();
      popularCards();
    } finally {
      processingUpdates.current = false;
    }
  };

  // Função para lidar com updates incrementais
  const handleIncrementalUpdates = async (creates, updates) => {
    if (creates.length === 0 && updates.length === 0) return;
    
    try {
      // Buscar apenas os tickets novos/atualizados
      const ticketIds = [...creates, ...updates].map(u => u.ticket?.id).filter(Boolean);
      
      if (ticketIds.length > 0) {
        // Fazer uma busca otimizada apenas dos tickets específicos
        const response = await api.get(`/tickets/kanban-incremental`, {
          params: {
            ticketIds: ticketIds.join(','),
            startDate,
            endDate,
            tags: selectedTags.map(tag => tag.id),
            users: selectedUsers.map(user => user.id),
            funnel: selectedFunnel
          }
        });
        
        const newTickets = response.data.tickets || [];
        
        if (newTickets.length > 0) {
          // Adicionar novos tickets ao estado existente
          setTickets(prevTickets => {
            const existingIds = new Set(prevTickets.map(t => t.id));
            const ticketsToAdd = newTickets.filter(t => !existingIds.has(t.id));
            
            if (ticketsToAdd.length > 0) {
              console.log(`✨ Adicionando ${ticketsToAdd.length} novos tickets`);
              // Adicionar animação suave para novos cards
              setNewCards(ticketsToAdd.map(t => t.id));
              setTimeout(() => setNewCards([]), 3000); // Remove animação após 3s
              
              return [...prevTickets, ...ticketsToAdd];
            }
            return prevTickets;
          });
          
          // Atualizar cards sem recarregar tudo
          setTimeout(() => popularCards(), 100);
        }
      }
    } catch (error) {
      console.error('Erro no update incremental:', error);
      // Fallback para refresh completo
      await fetchTickets();
      popularCards();
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

  // Função para calcular cor do texto baseada na cor de fundo
  const getTextColor = (backgroundColor) => {
    if (!backgroundColor) return '#333';
    
    // Remove # se existir
    const hex = backgroundColor.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcula luminância
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retorna cor do texto baseada na luminância
    return luminance > 0.5 ? '#333' : '#fff';
  };

  // Função para calcular distribuição inteligente das tags
  const calculateTagDistribution = (tags) => {
    const maxWidth = 270; // Largura máxima do container das tags (com margem de segurança)
    const tagPadding = 12; // Padding interno da tag (6px * 2)
    const tagMargin = 4; // Margem entre tags
    const iconWidth = 16; // Largura do ícone
    const iconMargin = 4; // Margem do ícone
    
    const rows = [];
    let currentRow = [];
    let currentRowWidth = 0;
    
    tags.forEach(tag => {
      // Calcula largura estimada da tag (mais conservadora)
      const textWidth = tag.name.length * 7; // Aproximação mais conservadora
      const tagWidth = tagPadding + iconWidth + iconMargin + textWidth;
      
      // Verifica se a tag cabe na linha atual
      const widthWithMargin = currentRowWidth + (currentRow.length > 0 ? tagMargin : 0) + tagWidth;
      
      if (widthWithMargin <= maxWidth && currentRow.length < 3) {
        // Cabe na linha atual
        currentRow.push(tag);
        currentRowWidth = widthWithMargin;
      } else {
        // Não cabe, inicia nova linha
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [tag];
        currentRowWidth = tagWidth;
      }
    });
    
    // Adiciona a última linha se não estiver vazia
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    return rows;
  };

  useEffect(() => {
    // Aplica a altura mínima diretamente no DOM após a renderização das lanes,
    // garantindo que a biblioteca não sobrescreva o estilo.
    const lanes = document.querySelectorAll('.react-trello-lane');
    lanes.forEach(lane => {
      // Força a altura mínima diretamente no style do elemento.
      if (lane instanceof HTMLElement) {
        lane.style.minHeight = '600px';
      }
    });
  }, [file]); // Executa sempre que os dados do board mudarem.

  const popularCards = () => {
    if (!initialLoadComplete) return;
    
    const filteredTickets = tickets.filter(ticket => ticket.tags.length === 0);
    console.log('🎫 Tickets filtrados (Em aberto):', filteredTickets.length);
    console.log('🏷️ Total de tags:', tags.length);
    


    const createCardContent = (ticket) => {
      const isNewCard = newCards.includes(ticket.id);
      
      return {
        id: ticket.id.toString(),
        title: "",
        description: (
          <div 
            className={classes.card}
            style={{
              animation: isNewCard ? 'slideInFromRight 0.5s ease-out' : 'none',
              border: isNewCard ? '2px solid #4CAF50' : 'none',
              boxShadow: isNewCard ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
          <div className={classes.cardHeader}>
            <div className={classes.contactInfo}>
            <Avatar 
              src={ticket.contact.urlPicture || undefined} 
              alt={ticket.contact.name} 
              style={{ marginRight: '8px', width: 40, height: 40 }} 
            />
              <div className={classes.iconChannel}>
                <Tooltip title={ticket.whatsapp?.name || ''}>
                  {IconChannel(ticket.channel)}
                </Tooltip>
              </div>
              <div className={classes.contactDetails}>
                <Typography className={classes.contactName}>
                  {ticket.contact.name}
                </Typography>
                <Typography className={classes.contactDate}>
                  {isSameDay(parseISO(ticket.updatedAt), new Date())
                    ? format(parseISO(ticket.updatedAt), "HH:mm")
                    : format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}
                </Typography>
              </div>
            </div>
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

          {/* Container das tags - abaixo do número do ticket */}
          {getNormalTags(ticket).length > 0 && (
            <div className={classes.tagsContainer}>
              {calculateTagDistribution(getNormalTags(ticket)).map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  width: '100%', 
                  marginBottom: rowIndex < calculateTagDistribution(getNormalTags(ticket)).length - 1 ? '4px' : '0',
                  justifyContent: 'flex-start',
                  alignItems: 'center'
                }}>
                  {row.map(tag => (
                    <span
                      key={tag.id}
                      className={classes.tagChip}
                      style={{
                        backgroundColor: tag.color || "#eee",
                        color: getTextColor(tag.color),
                        flex: row.length === 1 ? '1 1 auto' : '0 1 auto',
                        maxWidth: row.length === 1 ? '100%' : `${Math.floor(100 / row.length) - 2}%`,
                        minWidth: 'fit-content',
                      }}
                    >
                      <LocalOffer style={{ fontSize: '0.7rem', marginRight: '2px' }} />
                      {tag.name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}

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
    };
  };

    const lanes = [
      {
        id: "lane0",
        title: i18n.t("tagsKanban.laneDefault"),
        label: filteredTickets.length.toString(),
        cards: filteredTickets.map(ticket => createCardContent(ticket)),
        draggable: true,
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
          draggable: true,
          style: {
            backgroundColor: "#ffffff",
            color: "#444",
          },
          cards: tagTickets.map(ticket => createCardContent(ticket)),
        };
      }),
    ];

    // Aplica ordem personalizada se existir
    const orderedLanes = applyColumnOrder(lanes);
    console.log('📋 Lanes criadas:', orderedLanes.map(l => ({ title: l.title, cards: l.cards.length })));
    setFile({ lanes: orderedLanes });
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
                      <span
                        key={tagId}
                        style={{
                          backgroundColor: tag.color || "#eee",
                          color: getTextColor(tag.color),
                          fontSize: "0.75rem",
                          height: "24px",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          fontWeight: "500"
                        }}
                      >
                        {tag.name}
                      </span>
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
                        <span
                          key={userId}
                          style={{
                            backgroundColor: "#f5f5f5",
                            color: "#333",
                            fontSize: "0.75rem",
                            height: "24px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            fontWeight: "500"
                          }}
                        >
                          {user.name}
                        </span>
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
      <div
        className={classes.kanbanContainer}
        ref={kanbanContainerRef}
      >
        <div className={classes.boardWrapper} ref={boardWrapperRef}>

          {(isFilterLoading || isReordering) && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isReordering ? 'rgba(33, 150, 243, 0.1)' : 'rgba(0, 195, 7, 0.1)',
              padding: '6px 10px',
              borderRadius: '20px',
              border: isReordering ? '1px solid rgba(33, 150, 243, 0.2)' : '1px solid rgba(0, 195, 7, 0.2)',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: isReordering ? '2px solid rgba(33, 150, 243, 0.3)' : '2px solid rgba(0, 195, 7, 0.3)',
                borderTop: isReordering ? '2px solid #2196F3' : '2px solid #00C307',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <Typography style={{
                color: isReordering ? '#2196F3' : '#00C307',
                fontSize: '11px',
                fontWeight: 500
              }}>
                {isReordering ? 'Reordenando' : 'Atualizando'}
              </Typography>
            </div>
          )}
          <Board
            data={file}
            onCardMoveAcrossLanes={handleCardMove}
            draggable={true}
            cardDraggable={true}
            laneDraggable={true}
            handleLaneDragStart={(laneId) => {
              // Lane drag iniciado
            }}
            handleLaneDragEnd={handleLaneDragEnd}
            style={{
              backgroundColor: 'transparent',
              height: '100%', // Usa toda a altura do boardWrapper
              borderBottom: 'none !important',
              overflowX: 'auto !important',
              overflowY: 'hidden !important',
              width: '100%'
            }}
            laneStyle={{
              // Estilos essenciais com fundo transparente e altura dinâmica
              backgroundColor: 'rgba(0, 0, 0, 0.2)', // Fundo preto com 20% de transparência
              borderRadius: '8px',
              padding: '0',
              marginRight: '6px',
              minWidth: '180px',
              maxWidth: '200px',
              width: '190px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.3)',
              borderTop: 'none',
              display: 'flex',
              flexDirection: 'column',
              height: 'auto', // Altura automática
              minHeight: '100px', // Altura mínima reduzida
              maxHeight: '400px', // Altura máxima fixa em pixels
            }}
            cardStyle={{
              padding: 0,
              marginBottom: '6px',
              border: '1px solid #e0e0e0',
              borderTop: '1px solid #e0e0e0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#ffffff', // Fundo branco para contraste com coluna transparente
              borderRadius: '6px',
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              fontSize: '0.85rem'
            }}
            hideCardDeleteIcon
            tagStyle={{ display: 'none' }}
            laneDragClass="lane-dragging"
            laneDropClass="lane-dropping"
            components={{
              LaneHeader: ({ title, label, funilName, funilColor }) => (
                <div
                  style={{
                    padding: '0',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    paddingTop: '10px',
                    paddingBottom: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: `4px solid ${funilColor || '#ddd'}`,
                    borderTopLeftRadius: '6px',
                    borderTopRightRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Fundo branco mais opaco para contraste
                    cursor: 'grab',
                    userSelect: 'none',
                    position: 'relative',
                  }}
                  title="" // Remove tooltip
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    pointerEvents: 'none' // Importante: não interfere com o drag
                  }}>
                                         <Typography 
                       style={{
                         fontWeight: 600,
                         color: '#444',
                         fontSize: window.innerWidth <= 600 ? '0.75rem' : '0.85rem', // Fontes ajustadas para zoom 85%
                       }}
                       title="" // Remove tooltip
                     >{title}</Typography>
                    {funilName && (
                      <span style={{
                        background: funilColor,
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '1px 6px',
                        fontSize: '0.6rem', // Fonte ajustada para zoom 85%
                        fontWeight: 600,
                        marginLeft: 3,
                      }}>{funilName}</span>
                    )}
                  </div>
                                     <Typography style={{
                     backgroundColor: '#f5f5f5',
                     padding: '2px 8px',
                     borderRadius: '12px',
                     fontSize: window.innerWidth <= 600 ? '0.6rem' : '0.7rem', // Fontes ajustadas para zoom 85%
                     color: '#666',
                     pointerEvents: 'none' // Importante: não interfere com o drag
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
