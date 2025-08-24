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
  Breadcrumbs,
  Link,
  Autocomplete,
  TextField,
  CircularProgress,
  IconButton,
  Paper,
  Chip,
  Card,
  CardContent
} from "@mui/material";
import { DataTable } from 'mantine-datatable';
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
        backgroundColor: 'var(--bg-content)', // Fundo adaptável ao tema
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
            mb: 2,
            flexWrap: 'wrap',
            gap: 2
          }}>
            {/* Breadcrumb no lado esquerdo */}
            <Box 
              component="ol" 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                listStyle: 'none',
                m: 0,
                p: 0,
                color: 'var(--text-gray-medium)',
                fontWeight: 600,
                fontSize: '0.875rem',
                order: { xs: 2, md: 1 }
              }}
            >
              <Box component="li" sx={{ display: 'flex', alignItems: 'center' }}>
                <Link 
                  href="/"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-gray-medium)',
                    textDecoration: 'none',
                    '&:hover': { color: 'var(--color-accent)' }
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
                    color: 'var(--text-gray-medium)'
                  }
                }}
              >
                <Link 
                  href="/"
                  sx={{ 
                    color: 'var(--text-gray-medium)',
                    textDecoration: 'none',
                    '&:hover': { color: 'var(--color-accent)' }
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
                    color: 'var(--text-gray-medium)'
                  }
                }}
              >
                <Typography 
                  sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  Relatórios
                </Typography>
              </Box>
            </Box>
            
            {/* Título centralizado com ícone */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              flex: { xs: '1 1 100%', md: 1 },
              order: { xs: 1, md: 2 }
            }}>
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
                  color: 'var(--text-gray-medium)',
                  mb: 0,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  textAlign: 'center'
                }}
              >
                Relatórios de Atendimentos
              </Typography>
            </Box>
            
            {/* Espaço reservado para manter o layout equilibrado */}
            <Box sx={{ 
              width: { xs: 0, md: 'auto' },
              order: { xs: 3, md: 3 },
              minWidth: { md: '150px' }
            }} />
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
              background: 'var(--bg-primary)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-primary)',
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
                      color: 'var(--text-gray-medium)',
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
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-gray-medium)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
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
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-gray-medium)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
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
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
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
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                color: 'var(--text-gray-medium)',
                                backgroundColor: 'var(--bg-primary)',
                                '& fieldset': {
                                  borderColor: 'var(--border-primary)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'var(--color-accent)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'var(--color-accent)',
                                }
                              },
                              '& .MuiInputLabel-root': {
                                color: 'var(--text-gray-medium)',
                                '&.Mui-focused': {
                                  color: 'var(--color-accent)',
                                }
                              }
                            }}
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

                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <WhatsappsFilter onFiltered={handleSelectedWhatsapps} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <StatusFilter onFiltered={handleSelectedStatus} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <UsersFilter onFiltered={handleSelectedUsers} />
                    </Grid>
                  </Grid>

                  <Grid container spacing={3} sx={{ width: '100%', mx: 0 }}>
                    {/* Linha 2 - 3 campos */}
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                      <FormControl variant="outlined" fullWidth size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'var(--text-gray-medium)',
                            backgroundColor: 'var(--bg-primary)',
                            '& fieldset': {
                              borderColor: 'var(--border-primary)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'var(--color-accent)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'var(--color-accent)',
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: 'var(--text-gray-medium)',
                            '&.Mui-focused': {
                              color: 'var(--color-accent)',
                            }
                          }
                        }}
                      >
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

                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
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
                            color: 'var(--text-gray-medium)',
                            backgroundColor: 'var(--bg-primary)',
                            '& fieldset': {
                              borderColor: 'var(--border-primary)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'var(--color-accent)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'var(--color-accent)',
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: 'var(--text-gray-medium)',
                            '&.Mui-focused': {
                              color: 'var(--color-accent)',
                            }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} sx={{ width: 'auto', minWidth: 0, flex: '1 1 auto' }}>
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
                            color: 'var(--text-gray-medium)',
                            backgroundColor: 'var(--bg-primary)',
                            '& fieldset': {
                              borderColor: 'var(--border-primary)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'var(--color-accent)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'var(--color-accent)',
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: 'var(--text-gray-medium)',
                            '&.Mui-focused': {
                              color: 'var(--color-accent)',
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
                          color: 'var(--text-gray-medium)',
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
                  background: 'var(--gradient-green-button)',
                  borderRadius: 2,
                  p: 0.5,
                  boxShadow: 'var(--shadow-green-lg)'
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
              background: 'var(--bg-primary)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-primary)',
              overflow: 'hidden',
              width: '100%',
              maxWidth: 'none'
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box 
                sx={{ 
                  height: '500px',
                  width: '100%',
                  overflow: 'hidden',
                  '& .datatables': {
                    overflowX: 'auto',
                    '@media (max-width: 768px)': {
                      overflowX: 'auto'
                    }
                  },
                  '& .mantine-datatable-header': {
                    backgroundColor: 'var(--bg-secondary) !important',
                    color: 'var(--text-gray-medium) !important',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  },
                  '& .mantine-datatable-table': {
                    minWidth: '900px !important',
                    tableLayout: 'auto !important',
                    '@media (max-width: 768px)': {
                      minWidth: '1200px !important'
                    }
                  },
                  '& .mantine-datatable': {
                    width: '100% !important'
                  },
                  '& .mantine-datatable thead th': {
                    backgroundColor: 'var(--bg-secondary) !important',
                    color: 'var(--text-gray-medium) !important',
                    border: 'none !important',
                    borderRight: 'none !important',
                    padding: '12px 16px !important'
                  },
                  '& .mantine-datatable-header th': {
                    whiteSpace: 'nowrap !important'
                  },
                  '& .mantine-datatable-header th > div': {
                    display: 'flex !important',
                    alignItems: 'center !important',
                    gap: '6px !important',
                    flexDirection: 'row !important'
                  },
                  '& .mantine-datatable-header th button': {
                    display: 'flex !important',
                    alignItems: 'center !important',
                    gap: '6px !important',
                    flexDirection: 'row !important'
                  },
                  '& .mantine-datatable-header th [data-testid="mantine-datatable-column-header-sort-icon"]': {
                    position: 'static !important',
                    marginLeft: '6px !important',
                    marginTop: '0 !important',
                    display: 'inline !important'
                  },
                  '& .mantine-datatable tbody td': {
                    whiteSpace: 'nowrap !important',
                    color: 'var(--text-gray-medium) !important'
                  },
                  // Esconder SVG database órfão que aparece perdido na tabela
                  '& svg[stroke="currentColor"][fill="none"]': {
                    display: 'none !important'
                  },
                }}
                className="datatables"
              >
                <DataTable
                  noRecordsText={
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '60px 20px',
                      color: 'var(--text-secondary)'
                    }}>
                      <AssessmentIcon style={{ fontSize: 48, marginBottom: 16, color: 'var(--text-secondary)' }} />
                      <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: 8 }}>
                        Nenhum resultado encontrado
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Ajuste os filtros para visualizar os relatórios
                      </div>
                    </div>
                  }
                  highlightOnHover
                  className="whitespace-nowrap table-hover"
                  records={tickets}
                  fetching={loading}
                  minHeight={400}
                  columns={[
                    { 
                      accessor: 'id', 
                      title: i18n.t("reports.table.id"),
                      textAlignment: 'center',
                      sortable: true,
                      width: '8%',
                      render: ({ id }) => <strong style={{ color: 'var(--color-accent)' }}>#{id}</strong>
                    },
                    { 
                      accessor: 'whatsappName', 
                      title: i18n.t("reports.table.whatsapp"),
                      width: '15%',
                      render: ({ whatsappName, channel }) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {IconChannel(channel)}
                          <div style={{ fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--text-gray-medium)' }}>{whatsappName || '-'}</div>
                        </div>
                      )
                    },
                    { 
                      accessor: 'contactName', 
                      title: i18n.t("reports.table.contact"),
                      sortable: true,
                      width: '12%'
                    },
                    { 
                      accessor: 'userName', 
                      title: i18n.t("reports.table.user"),
                      sortable: true,
                      width: '12%'
                    },
                    { 
                      accessor: 'queueName', 
                      title: i18n.t("reports.table.queue"),
                      sortable: true,
                      width: '10%'
                    },
                    { 
                      accessor: 'status', 
                      title: i18n.t("reports.table.status"),
                      textAlignment: 'center',
                      width: '10%',
                      render: ({ status }) => (
                        <span 
                          className={`badge ${
                            status === 'open' ? 'badge-outline-success' :
                            status === 'pending' ? 'badge-outline-warning' :
                            'badge-outline-secondary'
                          }`}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {status}
                        </span>
                      )
                    },
                    { 
                      accessor: 'createdAt', 
                      title: i18n.t("reports.table.dateOpen"),
                      textAlignment: 'center',
                      sortable: true,
                      width: '15%',
                      render: ({ createdAt }) => {
                        const formatted = formatDate(createdAt);
                        return (
                          <div style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-gray-medium)' }}>
                              {formatted.date}
                            </div>
                            <div style={{ color: 'var(--text-gray-medium)', fontSize: '0.75rem', opacity: 0.8 }}>
                              {formatted.time}
                            </div>
                          </div>
                        );
                      }
                    },
                    { 
                      accessor: 'closedAt', 
                      title: i18n.t("reports.table.dateClose"),
                      textAlignment: 'center',
                      sortable: true,
                      width: '15%',
                      render: ({ closedAt }) => {
                        const formatted = formatDate(closedAt);
                        return (
                          <div style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-gray-medium)' }}>
                              {formatted.date}
                            </div>
                            <div style={{ color: 'var(--text-gray-medium)', fontSize: '0.75rem', opacity: 0.8 }}>
                              {formatted.time}
                            </div>
                          </div>
                        );
                      }
                    },
                    { 
                      accessor: 'supportTime', 
                      title: 'Tempo Atend.',
                      textAlignment: 'center',
                      sortable: true,
                      width: '13%'
                    },
                    { 
                      accessor: 'NPS', 
                      title: i18n.t("reports.table.NPS"),
                      textAlignment: 'center',
                      sortable: true,
                      width: '8%',
                      render: ({ NPS }) => {
                        if (NPS) {
                          return (
                            <span 
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'white',
                                backgroundColor: NPS >= 8 ? '#4CAF50' : NPS >= 6 ? '#FF9800' : '#F44336',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {NPS}
                            </span>
                          );
                        }
                        return <span style={{ color: 'var(--text-gray-medium)' }}>-</span>;
                      }
                    },
                    { 
                      accessor: 'actions', 
                      title: i18n.t("reports.table.actions"),
                      textAlignment: 'center',
                      sortable: false,
                      width: '10%',
                      render: (ticket) => (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                          <button
                            title="Logs do Ticket"
                            onClick={() => {
                              setOpenTicketMessageDialog(true);
                              setTicketOpen(ticket);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              color: '#2196F3',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <HistoryIcon fontSize="small" />
                          </button>
                          <button
                            title="Acessar Ticket"
                            onClick={() => history.push(`/tickets/${ticket.uuid}`)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              color: 'var(--color-accent)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <OpenIcon fontSize="small" />
                          </button>
                        </div>
                      )
                    }
                  ]}
                />
                
                {/* Linha divisória */}
                {totalTickets > 0 && (
                  <div style={{ 
                    borderTop: '1px solid var(--border-primary)', 
                    margin: '16px 0 0 0' 
                  }} />
                )}
                
                {/* Paginação customizada */}
                {totalTickets > 0 && (
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    gap: '12px',
                    flexWrap: 'wrap',
                    '@media (max-width: 768px)': {
                      flexDirection: 'column',
                      gap: '16px',
                      padding: '16px 12px'
                    }
                  }}>
                    {/* Info de registros */}
                    <Box sx={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)',
                      '@media (max-width: 768px)': {
                        order: 3,
                        textAlign: 'center',
                        fontSize: '13px'
                      }
                    }}>
                      Mostrando {((pageNumber - 1) * pageSize) + 1} a {Math.min(pageNumber * pageSize, totalTickets)} de {totalTickets} registros
                    </Box>
                    
                    {/* Seletor de registros por página */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      '@media (max-width: 768px)': {
                        order: 2,
                        fontSize: '13px'
                      }
                    }}>
                      <span style={{ fontSize: 'inherit', color: 'var(--text-secondary)' }}>Por página:</span>
                      <select 
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-primary)',
                          fontSize: 'inherit',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-gray-medium)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </Box>
                    
                    {/* Paginação com ícones */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      '@media (max-width: 768px)': {
                        order: 1,
                        gap: '2px',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                      },
                      '@media (max-width: 480px)': {
                        gap: '1px',
                        '& button': {
                          padding: '6px !important',
                          minWidth: '28px !important'
                        }
                      }
                    }}>
                      {/* Primeira página */}
                      <button
                        onClick={() => handleFilter(1)}
                        disabled={pageNumber === 1}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontWeight: 600,
                          padding: '8px',
                          borderRadius: '50%',
                          border: 'none',
                          cursor: pageNumber === 1 ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: pageNumber === 1 ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                          color: pageNumber === 1 ? '#ced4da' : 'var(--text-primary)',
                          opacity: pageNumber === 1 ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (pageNumber !== 1) {
                            e.target.style.backgroundColor = 'var(--color-accent)';
                            e.target.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (pageNumber !== 1) {
                            e.target.style.backgroundColor = 'var(--bg-secondary)';
                            e.target.style.color = 'var(--text-primary)';
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41z" fill="currentColor"/>
                          <path d="M6 6h2v12H6z" fill="currentColor"/>
                        </svg>
                      </button>
                      
                      {/* Página anterior */}
                      <button
                        onClick={() => handleFilter(pageNumber - 1)}
                        disabled={pageNumber === 1}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontWeight: 600,
                          padding: '8px',
                          borderRadius: '50%',
                          border: 'none',
                          cursor: pageNumber === 1 ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: pageNumber === 1 ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                          color: pageNumber === 1 ? '#ced4da' : 'var(--text-primary)',
                          opacity: pageNumber === 1 ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (pageNumber !== 1) {
                            e.target.style.backgroundColor = 'var(--color-accent)';
                            e.target.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (pageNumber !== 1) {
                            e.target.style.backgroundColor = 'var(--bg-secondary)';
                            e.target.style.color = 'var(--text-primary)';
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                        </svg>
                      </button>
                      
                      {/* Números das páginas */}
                      {(() => {
                        const totalPages = Math.ceil(totalTickets / pageSize);
                        const pages = [];
                        
                        // Lógica para mostrar páginas relevantes
                        let startPage = Math.max(1, pageNumber - 2);
                        let endPage = Math.min(totalPages, pageNumber + 2);
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handleFilter(i)}
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontWeight: 600,
                                padding: '8px 12px',
                                borderRadius: '50%',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: pageNumber === i ? 'var(--color-accent)' : 'var(--bg-secondary)',
                                color: pageNumber === i ? 'white' : 'var(--text-primary)',
                                minWidth: '36px'
                              }}
                              onMouseEnter={(e) => {
                                if (pageNumber !== i) {
                                  e.target.style.backgroundColor = 'var(--color-accent)';
                                  e.target.style.color = 'white';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (pageNumber !== i) {
                                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                                  e.target.style.color = 'var(--text-primary)';
                                }
                              }}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        return pages;
                      })()}
                      
                      {/* Próxima página */}
                      <button
                        onClick={() => handleFilter(pageNumber + 1)}
                        disabled={pageNumber >= Math.ceil(totalTickets / pageSize)}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontWeight: 600,
                          padding: '8px',
                          borderRadius: '50%',
                          border: 'none',
                          cursor: pageNumber >= Math.ceil(totalTickets / pageSize) ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: pageNumber >= Math.ceil(totalTickets / pageSize) ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                          color: pageNumber >= Math.ceil(totalTickets / pageSize) ? '#ced4da' : 'var(--text-primary)',
                          opacity: pageNumber >= Math.ceil(totalTickets / pageSize) ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (pageNumber < Math.ceil(totalTickets / pageSize)) {
                            e.target.style.backgroundColor = 'var(--color-accent)';
                            e.target.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (pageNumber < Math.ceil(totalTickets / pageSize)) {
                            e.target.style.backgroundColor = 'var(--bg-secondary)';
                            e.target.style.color = 'var(--text-primary)';
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                        </svg>
                      </button>
                      
                      {/* Última página */}
                      <button
                        onClick={() => handleFilter(Math.ceil(totalTickets / pageSize))}
                        disabled={pageNumber >= Math.ceil(totalTickets / pageSize)}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontWeight: 600,
                          padding: '8px',
                          borderRadius: '50%',
                          border: 'none',
                          cursor: pageNumber >= Math.ceil(totalTickets / pageSize) ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: pageNumber >= Math.ceil(totalTickets / pageSize) ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                          color: pageNumber >= Math.ceil(totalTickets / pageSize) ? '#ced4da' : 'var(--text-primary)',
                          opacity: pageNumber >= Math.ceil(totalTickets / pageSize) ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (pageNumber < Math.ceil(totalTickets / pageSize)) {
                            e.target.style.backgroundColor = 'var(--color-accent)';
                            e.target.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (pageNumber < Math.ceil(totalTickets / pageSize)) {
                            e.target.style.backgroundColor = 'var(--bg-secondary)';
                            e.target.style.color = 'var(--text-primary)';
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41z" fill="currentColor"/>
                          <path d="M16 6h2v12h-2z" fill="currentColor"/>
                        </svg>
                      </button>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>

      </Box>
    </Box>
  );
};

export default ModernReports;