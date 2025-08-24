import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Typography,
  Box,
  Pagination,
  Breadcrumbs,
  Link,
  Autocomplete,
  TextField,
  CircularProgress,
  IconButton,
  Paper,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {
  FilterList as FilterIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  OpenInNew as OpenIcon,
  Facebook,
  Instagram,
  WhatsApp,
  Search as SearchIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import { createFilterOptions } from "@mui/material/Autocomplete";
import moment from "moment";

// Hooks e utils
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import useDashboard from "../../hooks/useDashboard";
import api from "../../services/api";
import toastError from "../../errors/toastError";

// Componentes específicos
import { UsersFilter } from "../../components/UsersFilter";
import { WhatsappsFilter } from "../../components/WhatsappsFilter";
import { StatusFilter } from "../../components/StatusFilter";
import ShowTicketLogModal from "../../components/ShowTicketLogModal";

const ModernReports = () => {
  const history = useHistory();
  const { getReport } = useDashboard();
  const { user } = useContext(AuthContext);

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParam, setSearchParam] = useState("");
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [queueIds, setQueueIds] = useState([]);
  const [userIds, setUserIds] = useState([]);
  const [options, setOptions] = useState([]);
  const [dateFrom, setDateFrom] = useState(moment("1", "D").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [onlyRated, setOnlyRated] = useState(false);
  const [totalTickets, setTotalTickets] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(null);

  // Estados de UI
  const [hoveredRow, setHoveredRow] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Efeito para buscar contatos
  useEffect(() => {
    if (searchParam.length < 3) return;
    
    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get("contacts", {
          params: { searchParam },
        });
        setOptions(data.contacts || []);
      } catch (err) {
        console.error('Erro no fetchContacts:', err);
        if (err) {
          toastError(err);
        }
      } finally {
        setLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam]);

  // Handlers
  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map((t) => t.id);
    setUserIds(users);
  };

  const handleSelectedWhatsapps = (selecteds) => {
    const whatsapp = selecteds.map((t) => t.id);
    setSelectedWhatsapp(whatsapp);
  };

  const handleSelectedStatus = (selecteds) => {
    const statusFilter = selecteds.map((t) => t.status);
    setSelectedStatus(statusFilter);
  };

  const handleSelectOption = (e, newValue) => {
    if (newValue && newValue.id) {
      setSelectedContactId(newValue.id);
    }
    setSearchParam("");
  };

  // Função para aplicar filtros
  const handleFilter = async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await getReport({
        searchParam,
        contactId: selectedContactId,
        whatsappId: JSON.stringify(selectedWhatsapp),
        users: JSON.stringify(userIds),
        queueIds: JSON.stringify(queueIds),
        status: JSON.stringify(selectedStatus),
        dateFrom,
        dateTo,
        page: pageNum,
        pageSize: pageSize,
        onlyRated: onlyRated ? "true" : "false"
      });

      setTotalTickets(data.totalTickets.total);
      setTickets(data.tickets || []);
      setPageNumber(pageNum);
    } catch (error) {
      console.error('Erro no handleFilter:', error);
      if (error) {
        toastError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para exportar Excel
  const exportarGridParaExcel = async () => {
    setLoading(true);
    try {
      const data = await getReport({
        searchParam,
        contactId: selectedContactId,
        whatsappId: JSON.stringify(selectedWhatsapp),
        users: JSON.stringify(userIds),
        queueIds: JSON.stringify(queueIds),
        status: JSON.stringify(selectedStatus),
        dateFrom,
        dateTo,
        page: 1,
        pageSize: 9999999,
        onlyRated: onlyRated ? "true" : "false"
      });

      const ticketsData = data.tickets.map(ticket => {
        const createdAt = new Date(ticket.createdAt);
        const closedAt = new Date(ticket.closedAt);

        return {
          id: ticket.id,
          Conexão: ticket.whatsappName,
          Contato: ticket.contactName,
          Usuário: ticket.userName,
          Fila: ticket.queueName,
          Status: ticket.status,
          ÚltimaMensagem: ticket.lastMessage,
          DataAbertura: createdAt.toLocaleDateString(),
          HoraAbertura: createdAt.toLocaleTimeString(),
          DataFechamento: ticket.closedAt ? closedAt.toLocaleDateString() : "",
          HoraFechamento: ticket.closedAt ? closedAt.toLocaleTimeString() : "",
          TempoDeAtendimento: ticket.supportTime,
          nps: ticket.NPS,
        };
      });

      const ws = XLSX.utils.json_to_sheet(ticketsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RelatorioDeAtendimentos');
      XLSX.writeFile(wb, 'relatorio-de-atendimentos.xlsx');
    } catch (error) {
      console.error('Erro no exportarGridParaExcel:', error);
      if (error) {
        toastError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchParam("");
    setSelectedContactId(null);
    setSelectedWhatsapp([]);
    setSelectedStatus([]);
    setQueueIds([]);
    setUserIds([]);
    setDateFrom(moment("1", "D").format("YYYY-MM-DD"));
    setDateTo(moment().format("YYYY-MM-DD"));
    setOnlyRated(false);
    setTickets([]);
    setTotalTickets(0);
    setPageNumber(1);
  };

  // Ícones dos canais com animações
  const IconChannel = (channel) => {
    const iconProps = {
      style: { 
        width: 18, 
        height: 18,
        transition: 'all 0.2s ease'
      }
    };
    
    switch (channel) {
      case "facebook":
        return <Facebook {...iconProps} style={{...iconProps.style, color: '#1877F2'}} />;
      case "instagram":
        return <Instagram {...iconProps} style={{...iconProps.style, color: '#E4405F'}} />;
      case "whatsapp":
        return <WhatsApp {...iconProps} style={{...iconProps.style, color: '#25D366'}} />;
      default:
        return null;
    }
  };

  // Status com cores em CSS-in-JS
  const getStatusStyles = (status) => {
    switch (status) {
      case 'open':
        return {
          backgroundColor: '#E8F5E8',
          color: '#2E7D32',
          border: '1px solid #4CAF50'
        };
      case 'pending':
        return {
          backgroundColor: '#FFF8E1',
          color: '#F57C00',
          border: '1px solid #FF9800'
        };
      case 'closed':
        return {
          backgroundColor: '#F5F5F5',
          color: '#424242',
          border: '1px solid #9E9E9E'
        };
      default:
        return {
          backgroundColor: '#E3F2FD',
          color: '#1976D2',
          border: '1px solid #2196F3'
        };
    }
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return { date: '-', time: '-' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Função para truncar texto
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Renderizar opções do autocomplete com melhor UI
  const renderOption = (props, option) => (
    <Box
      component="li"
      {...props}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        '&:hover': {
          backgroundColor: 'rgba(0, 195, 7, 0.05)',
          transform: 'translateX(4px)',
          transition: 'all 0.2s ease'
        },
        transition: 'all 0.2s ease'
      }}
    >
      {IconChannel(option.channel)}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {option.name}
        </Typography>
        {option.number && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {option.number}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const filter = createFilterOptions({ trim: true });

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa', // Cinza bem clarinho
        px: { xs: 1.5, sm: 2 }, // 15px nas extremidades conforme solicitado
        py: 3,
        width: '100%',
        maxWidth: 'none !important',
        margin: 0
      }}
    >
      {/* Modal de logs do ticket */}
      <AnimatePresence>
        {openTicketMessageDialog && (
          <ShowTicketLogModal
            isOpen={openTicketMessageDialog}
            handleClose={() => setOpenTicketMessageDialog(false)}
            ticketId={ticketOpen && ticketOpen.id}
          />
        )}
      </AnimatePresence>

      {/* Header da Página */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '2rem' }}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2 
          }}>
            {/* Título com ícone */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon 
                sx={{ 
                  mr: 2, 
                  color: 'var(--color-accent)', 
                  fontSize: 32,
                  filter: 'drop-shadow(0 2px 4px rgba(0,195,7,0.2))'
                }} 
              />
              <Typography
                variant="h5"
                sx={{ 
                  fontWeight: 700,
                  color: '#656565',
                  mb: 0,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Relatórios de Atendimentos
              </Typography>
            </Box>
            
            {/* Breadcrumb customizado */}
            <Box 
              component="ol" 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                listStyle: 'none',
                m: 0,
                p: 0,
                color: '#656565',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              <Box component="li" sx={{ display: 'flex', alignItems: 'center' }}>
                <Link 
                  href="/"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#656565',
                    textDecoration: 'none',
                    '&:hover': { color: '#656565' }
                  }}
                >
                  <HomeIcon sx={{ fontSize: 16 }} />
                </Link>
              </Box>
              <Box 
                component="li" 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  '&:before': {
                    content: '"/"',
                    px: 1.5,
                    color: '#656565'
                  }
                }}
              >
                <Link 
                  href="/"
                  sx={{ 
                    color: '#656565',
                    textDecoration: 'none',
                    '&:hover': { color: '#656565' }
                  }}
                >
                  Dashboard
                </Link>
              </Box>
              <Box 
                component="li" 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  '&:before': {
                    content: '"/"',
                    px: 1.5,
                    color: '#656565'
                  }
                }}
              >
                <Typography 
                  sx={{ 
                    color: '#333',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  Relatórios
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>

      <Box sx={{ width: '100%', maxWidth: 'none', flex: 1 }}>
        {/* Card de Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card 
            elevation={1}
            sx={{
              mb: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              overflow: 'visible',
              width: '100%',
              maxWidth: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)' // Shadow mais suave
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 3,
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <FilterAltIcon sx={{ color: 'var(--color-accent)', fontSize: 24 }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Filtros de Pesquisa
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Tooltip title={filtersExpanded ? "Recolher Filtros" : "Expandir Filtros"}>
                    <IconButton
                      onClick={() => setFiltersExpanded(!filtersExpanded)}
                      sx={{
                        backgroundColor: '#f8f9fa',
                        '&:hover': {
                          backgroundColor: '#e9ecef',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Exportar para Excel">
                    <IconButton
                      onClick={exportarGridParaExcel}
                      disabled={loading}
                      sx={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#00e608',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0,195,7,0.3)'
                      }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Limpar Filtros">
                    <IconButton
                      onClick={clearFilters}
                      sx={{
                        backgroundColor: '#e9ecef',
                        '&:hover': {
                          backgroundColor: '#dee2e6',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Grid de Filtros */}
              {filtersExpanded && (
                <Box sx={{ mt: 3, width: '100%' }}>
                  <Grid container spacing={3} sx={{ mb: 3, width: '100%', mx: 0 }}>
                    {/* Linha 1 - 4 campos */}
                    <Grid item xs={12} sm={6} lg={3} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <Autocomplete
                        fullWidth
                        options={options || []}
                        loading={loading}
                        size="small"
                        getOptionLabel={(option) => 
                          option.number ? `${option.name} - ${option.number}` : option.name
                        }
                        renderOption={renderOption}
                        filterOptions={(options, params) => {
                          const filtered = filter(options, params);
                          if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
                            filtered.push({ name: params.inputValue });
                          }
                          return filtered;
                        }}
                        onChange={handleSelectOption}
                        sx={{
                          width: '100%',
                          minWidth: '200px'
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={i18n.t("newTicketModal.fieldLabel")}
                            variant="outlined"
                            fullWidth
                            onChange={(e) => setSearchParam(e.target.value)}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: <SearchIcon sx={{ color: 'var(--color-accent)', mr: 1 }} />,
                              endAdornment: (
                                <>
                                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                            sx={{
                              width: '100%',
                              '& .MuiOutlinedInput-root': {
                                width: '100%',
                                '&:hover fieldset': {
                                  borderColor: 'var(--color-accent)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'var(--color-accent)',
                                }
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} lg={3} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <WhatsappsFilter onFiltered={handleSelectedWhatsapps} />
                    </Grid>

                    <Grid item xs={12} sm={6} lg={3} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <StatusFilter onFiltered={handleSelectedStatus} />
                    </Grid>

                    <Grid item xs={12} sm={6} lg={3} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <UsersFilter onFiltered={handleSelectedUsers} />
                    </Grid>
                  </Grid>

                  <Grid container spacing={3} sx={{ width: '100%', mx: 0 }}>
                    {/* Linha 2 - 3 campos */}
                    <Grid item xs={12} sm={6} lg={4} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <FormControl variant="outlined" fullWidth size="small">
                        <InputLabel>Filas</InputLabel>
                        <Select
                          multiple
                          value={queueIds}
                          onChange={(e) => setQueueIds(e.target.value)}
                          label="Filas"
                          renderValue={(selected) => `${selected.length} selecionada(s)`}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'var(--border-primary)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'var(--color-accent)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'var(--color-accent)',
                            }
                          }}
                        >
                          {user && user.queues && user.queues.map((queue) => (
                            <MenuItem key={queue.id} value={queue.id}>
                              <Typography variant="body2">{queue.name}</Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} lg={4} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <TextField
                        label="Data Inicial"
                        type="date"
                        value={dateFrom}
                        variant="outlined"
                        fullWidth
                        size="small"
                        onChange={(e) => setDateFrom(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: <CalendarIcon sx={{ color: 'var(--color-accent)', mr: 1 }} />
                        }}
                        sx={{
                          width: '100%',
                          minWidth: '200px',
                          '& .MuiOutlinedInput-root': {
                            width: '100%',
                            '&:hover fieldset': {
                              borderColor: 'var(--color-accent)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'var(--color-accent)',
                            }
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} lg={4} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <TextField
                        label="Data Final"
                        type="date"
                        value={dateTo}
                        variant="outlined"
                        fullWidth
                        size="small"
                        onChange={(e) => setDateTo(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: <CalendarIcon sx={{ color: 'var(--color-accent)', mr: 1 }} />
                        }}
                        sx={{
                          width: '100%',
                          minWidth: '200px',
                          '& .MuiOutlinedInput-root': {
                            width: '100%',
                            '&:hover fieldset': {
                              borderColor: 'var(--color-accent)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'var(--color-accent)',
                            }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Botões de Ação */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                {/* Switch Apenas Avaliados */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'rgba(0,195,7,0.05)',
                  border: '1px solid rgba(0,195,7,0.2)',
                  borderRadius: 2,
                  px: 2,
                  height: '48px' // Mesma altura do botão Aplicar Filtro
                }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={onlyRated}
                        onChange={() => setOnlyRated(!onlyRated)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: 'var(--color-accent)',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: 'var(--color-accent)',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#656565',
                          fontWeight: 500
                        }}
                      >
                        Apenas avaliados
                      </Typography>
                    }
                  />
                </Box>
                
                {/* Botão Aplicar Filtros */}
                <Box sx={{ 
                  background: 'linear-gradient(135deg, var(--color-accent) 0%, #00e608 100%)',
                  borderRadius: 2,
                  p: 0.5,
                  boxShadow: '0 8px 25px rgba(0,195,7,0.25)'
                }}>
                  <IconButton
                    onClick={() => handleFilter(1)}
                    disabled={loading}
                    sx={{
                      backgroundColor: 'transparent',
                      color: 'white',
                      px: 3,
                      py: 1,
                      borderRadius: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease',
                      fontSize: '0.95rem'
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshIcon sx={{ mr: 1 }} />
                        Filtrando...
                      </>
                    ) : (
                      <>
                        <FilterIcon sx={{ mr: 1 }} />
                        {i18n.t("reports.buttons.filter")}
                      </>
                    )}
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabela de Resultados */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card
            elevation={6}
            sx={{
              mb: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              overflow: 'hidden',
              width: '100%',
              maxWidth: 'none'
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <TableContainer 
                sx={{ 
                  maxHeight: { xs: '60vh', md: '70vh' },
                  width: '100%',
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': {
                    width: 8,
                    height: 8
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f8f9fa'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: 4
                  }
                }}
              >
                <Table stickyHeader sx={{ minWidth: '100%', width: '100%' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 80
                        }}
                      >
                        {i18n.t("reports.table.id")}
                      </TableCell>
                      <TableCell 
                        align="left" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 150
                        }}
                      >
                        {i18n.t("reports.table.whatsapp")}
                      </TableCell>
                      <TableCell 
                        align="left" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 120
                        }}
                      >
                        {i18n.t("reports.table.contact")}
                      </TableCell>
                      <TableCell 
                        align="left" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 120
                        }}
                      >
                        {i18n.t("reports.table.user")}
                      </TableCell>
                      <TableCell 
                        align="left" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 100
                        }}
                      >
                        {i18n.t("reports.table.queue")}
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 100
                        }}
                      >
                        {i18n.t("reports.table.status")}
                      </TableCell>
                      <TableCell 
                        align="left" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 200
                        }}
                      >
                        {i18n.t("reports.table.lastMessage")}
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 130
                        }}
                      >
                        {i18n.t("reports.table.dateOpen")}
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 130
                        }}
                      >
                        {i18n.t("reports.table.dateClose")}
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 120
                        }}
                      >
                        {i18n.t("reports.table.supportTime")}
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 80
                        }}
                      >
                        {i18n.t("reports.table.NPS")}
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          minWidth: 120
                        }}
                      >
                        {i18n.t("reports.table.actions")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  
                  <TableBody>
                    <AnimatePresence>
                      {loading ? (
                        // Skeleton loading
                        [...Array(pageSize)].map((_, index) => (
                          <TableRow key={`skeleton-${index}`}>
                            {[...Array(12)].map((_, cellIndex) => (
                              <TableCell key={cellIndex}>
                                <Box
                                  sx={{
                                    height: 20,
                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                    borderRadius: 1
                                  }}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : tickets.length > 0 ? (
                        tickets.map((ticket, index) => {
                          const createdAtFormatted = formatDate(ticket.createdAt);
                          const closedAtFormatted = formatDate(ticket.closedAt);
                          const statusStyles = getStatusStyles(ticket.status);
                          
                          return (
                            <TableRow
                              key={ticket.id}
                              onMouseEnter={() => setHoveredRow(ticket.id)}
                              onMouseLeave={() => setHoveredRow(null)}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 195, 7, 0.05)',
                                  transform: 'scale(1.01)',
                                  boxShadow: '0 4px 12px rgba(0,195,7,0.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <TableCell align="center" sx={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                                #{ticket.id}
                              </TableCell>
                              
                              <TableCell align="left">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {IconChannel(ticket.channel)}
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {ticket.whatsappName || '-'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              
                              <TableCell align="left">
                                <Typography variant="body2">
                                  {ticket.contactName || '-'}
                                </Typography>
                              </TableCell>
                              
                              <TableCell align="left">
                                <Typography variant="body2">
                                  {ticket.userName || '-'}
                                </Typography>
                              </TableCell>
                              
                              <TableCell align="left">
                                <Typography variant="body2">
                                  {ticket.queueName || '-'}
                                </Typography>
                              </TableCell>
                              
                              <TableCell align="center">
                                <Chip
                                  label={ticket.status}
                                  size="small"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    ...statusStyles
                                  }}
                                />
                              </TableCell>
                              
                              <TableCell align="left">
                                <Tooltip title={ticket.lastMessage}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      maxWidth: 200,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {truncateText(ticket.lastMessage, 30)}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                              
                              <TableCell align="center">
                                <Box>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {createdAtFormatted.date}
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                    {createdAtFormatted.time}
                                  </Typography>
                                </Box>
                              </TableCell>
                              
                              <TableCell align="center">
                                <Box>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {closedAtFormatted.date}
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                    {closedAtFormatted.time}
                                  </Typography>
                                </Box>
                              </TableCell>
                              
                              <TableCell align="center">
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {ticket.supportTime || '-'}
                                </Typography>
                              </TableCell>
                              
                              <TableCell align="center">
                                {ticket.NPS ? (
                                  <Chip
                                    label={ticket.NPS}
                                    size="small"
                                    sx={{
                                      backgroundColor: ticket.NPS >= 8 ? '#4CAF50' : ticket.NPS >= 6 ? '#FF9800' : '#F44336',
                                      color: 'white',
                                      fontWeight: 600
                                    }}
                                  />
                                ) : (
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
                                )}
                              </TableCell>
                              
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                  <Tooltip title="Logs do Ticket">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setOpenTicketMessageDialog(true);
                                        setTicketOpen(ticket);
                                      }}
                                      sx={{
                                        color: '#2196F3',
                                        '&:hover': {
                                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                          transform: 'scale(1.1)'
                                        },
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      <HistoryIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Acessar Ticket">
                                    <IconButton
                                      size="small"
                                      onClick={() => history.push(`/tickets/${ticket.uuid}`)}
                                      sx={{
                                        color: 'var(--color-accent)',
                                        '&:hover': {
                                          backgroundColor: 'rgba(0, 195, 7, 0.05)',
                                          transform: 'scale(1.1)'
                                        },
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      <OpenIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                                Nenhum resultado encontrado
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Ajuste os filtros para visualizar os relatórios
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Paginação e Controles */}
        {totalTickets > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                backdropFilter: 'blur(10px)',
                width: '100%',
                maxWidth: 'none'
              }}
            >
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: 3
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                      }}
                    >
                      Total: <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{totalTickets}</span> registros
                    </Typography>
                    
                    <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
                      <InputLabel>Por página</InputLabel>
                      <Select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value)}
                        label="Por página"
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--border-primary)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--color-accent)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--color-accent)',
                          }
                        }}
                      >
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Pagination
                    count={Math.ceil(totalTickets / pageSize)}
                    page={pageNumber}
                    onChange={(event, value) => handleFilter(value)}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        '&.Mui-selected': {
                          backgroundColor: 'var(--color-accent)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#00e608',
                          }
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(0, 195, 7, 0.05)',
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Box>
    </Box>
  );
};

export default ModernReports;