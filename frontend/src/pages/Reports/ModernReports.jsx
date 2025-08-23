import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import {
  Container,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Tooltip,
  Typography,
  Box,
  Pagination,
  Autocomplete,
  TextField,
  CircularProgress,
  IconButton
} from "@mui/material";
import {
  FilterList as FilterIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  OpenInNew as OpenIcon,
  Facebook,
  Instagram,
  WhatsApp,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import { createFilterOptions } from "@mui/material/Autocomplete";
import moment from "moment";

// Componentes do Design System
import {
  FilterCard,
  ModernButton,
  SearchInput,
  DataTable,
  PageHeader,
  FiltersSkeleton,
  TableSkeleton
} from "../../components/ui";

// Hooks e utils
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import useDashboard from "../../hooks/useDashboard";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { cn } from "../../utils/cn";

// Componentes específicos
import { UsersFilter } from "../../components/UsersFilter";
import { WhatsappsFilter } from "../../components/WhatsappsFilter";
import { StatusFilter } from "../../components/StatusFilter";
import ShowTicketLogModal from "../../components/ShowTicketLogModal";

const ModernReports = () => {
  const history = useHistory();
  const { getReport } = useDashboard();
  const { user } = useContext(AuthContext);

  // Estados
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

  // Ícones dos canais
  const IconChannel = (channel) => {
    switch (channel) {
      case "facebook":
        return <Facebook className="text-blue-600 w-4 h-4" />;
      case "instagram":
        return <Instagram className="text-pink-600 w-4 h-4" />;
      case "whatsapp":
        return <WhatsApp className="text-green-600 w-4 h-4" />;
      default:
        return null;
    }
  };

  // Renderizar opções do autocomplete
  const renderOption = (props, option) => (
    <li {...props} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50">
      {IconChannel(option.channel)}
      <span className="text-sm">
        {option.number ? `${option.name} - ${option.number}` : `${i18n.t("newTicketModal.add")} ${option.name}`}
      </span>
    </li>
  );

  // Colunas da tabela
  const tableColumns = [
    { key: 'id', label: i18n.t("reports.table.id"), align: 'center', minWidth: 80 },
    { 
      key: 'whatsappName', 
      label: i18n.t("reports.table.whatsapp"), 
      align: 'left',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {IconChannel(row.channel)}
          <span>{value}</span>
        </div>
      )
    },
    { key: 'contactName', label: i18n.t("reports.table.contact"), align: 'left' },
    { key: 'userName', label: i18n.t("reports.table.user"), align: 'left' },
    { key: 'queueName', label: i18n.t("reports.table.queue"), align: 'left' },
    { 
      key: 'status', 
      label: i18n.t("reports.table.status"), 
      align: 'center',
      render: (value) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          value === 'open' && "bg-green-100 text-green-800",
          value === 'pending' && "bg-yellow-100 text-yellow-800",
          value === 'closed' && "bg-gray-100 text-gray-800"
        )}>
          {value}
        </span>
      )
    },
    { key: 'lastMessage', label: i18n.t("reports.table.lastMessage"), align: 'left' },
    { key: 'createdAt', label: i18n.t("reports.table.dateOpen"), align: 'center' },
    { key: 'closedAt', label: i18n.t("reports.table.dateClose"), align: 'center' },
    { key: 'supportTime', label: i18n.t("reports.table.supportTime"), align: 'center' },
    { key: 'NPS', label: i18n.t("reports.table.NPS"), align: 'center' },
    {
      key: 'actions',
      label: i18n.t("reports.table.actions"),
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center space-x-2">
          <Tooltip title="Logs do Ticket">
            <IconButton
              size="small"
              onClick={() => {
                setOpenTicketMessageDialog(true);
                setTicketOpen(row);
              }}
              className="text-blue-600 hover:bg-blue-50"
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Acessar Ticket">
            <IconButton
              size="small"
              onClick={() => history.push(`/tickets/${row.uuid}`)}
              className="text-green-600 hover:bg-green-50"
            >
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      )
    },
  ];

  const filter = createFilterOptions({ trim: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Container maxWidth="xl" className="py-8">
        {/* Modal de logs do ticket */}
        <AnimatePresence>
          {openTicketMessageDialog && (
            <ShowTicketLogModal
              isOpen={openTicketMessageDialog}
              handleClose={() => setOpenTicketMessageDialog(false)}
              ticketId={ticketOpen?.id}
            />
          )}
        </AnimatePresence>

        {/* Page Header */}
        <PageHeader
          title={i18n.t("reports.title")}
          subtitle="Visualize e exporte relatórios detalhados de atendimentos"
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Relatórios", href: "/reports" }
          ]}
          actions={
            <div className="flex items-center space-x-3">
              <ModernButton
                variant="secondary"
                size="medium"
                onClick={exportarGridParaExcel}
                disabled={loading}
                startIcon={<DownloadIcon />}
              >
                Exportar Excel
              </ModernButton>
            </div>
          }
        />

        <div className="space-y-8">
          {/* Filtros */}
          <FilterCard>
            <div className="space-y-6">
              <Typography variant="h6" className="font-semibold text-gray-900">
                Filtros de Pesquisa
              </Typography>

              <Grid container spacing={3}>
                {/* Linha 1 - Filtros principais */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={i18n.t("newTicketModal.fieldLabel")}
                        variant="outlined"
                        onChange={(e) => setSearchParam(e.target.value)}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <WhatsappsFilter onFiltered={handleSelectedWhatsapps} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatusFilter onFiltered={handleSelectedStatus} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <UsersFilter onFiltered={handleSelectedUsers} />
                </Grid>

                {/* Linha 2 - Filtros secundários */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl variant="outlined" fullWidth size="small">
                    <InputLabel>Filas</InputLabel>
                    <Select
                      multiple
                      value={queueIds}
                      onChange={(e) => setQueueIds(e.target.value)}
                      label="Filas"
                      renderValue={(selected) => `${selected.length} selecionada(s)`}
                    >
                      {user?.queues?.map((queue) => (
                        <MenuItem key={queue.id} value={queue.id}>
                          {queue.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Data Inicial"
                    type="date"
                    value={dateFrom}
                    variant="outlined"
                    fullWidth
                    size="small"
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Data Final"
                    type="date"
                    value={dateTo}
                    variant="outlined"
                    fullWidth
                    size="small"
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <div className="flex items-center justify-between h-10">
                    <Tooltip title={i18n.t("reports.buttons.onlyRated")}>
                      <div className="flex items-center space-x-2">
                        <Switch
                          color="primary"
                          checked={onlyRated}
                          onChange={() => setOnlyRated(!onlyRated)}
                          size="medium"
                        />
                        <Typography variant="body2" className="text-gray-700">
                          Apenas avaliados
                        </Typography>
                      </div>
                    </Tooltip>
                  </div>
                </Grid>
              </Grid>

              {/* Ações */}
              <div className="flex justify-end">
                <ModernButton
                  variant="primary"
                  onClick={() => handleFilter(1)}
                  disabled={loading}
                  startIcon={<FilterIcon />}
                  size="medium"
                >
                  {loading ? 'Filtrando...' : i18n.t("reports.buttons.filter")}
                </ModernButton>
              </div>
            </div>
          </FilterCard>

          {/* Tabela de Resultados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <DataTable
              columns={tableColumns}
              data={tickets}
              loading={loading}
              className="shadow-xl"
            />
          </motion.div>

          {/* Paginação */}
          {totalTickets > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <Typography variant="body2" className="text-gray-600">
                    Total: {totalTickets} registros
                  </Typography>
                  
                  <FormControl size="small" variant="outlined">
                    <InputLabel>{i18n.t("tickets.search.ticketsPerPage")}</InputLabel>
                    <Select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value)}
                      label={i18n.t("tickets.search.ticketsPerPage")}
                      className="min-w-[120px]"
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <Pagination
                  count={Math.ceil(totalTickets / pageSize)}
                  page={pageNumber}
                  onChange={(event, value) => handleFilter(value)}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </div>
            </motion.div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default ModernReports;