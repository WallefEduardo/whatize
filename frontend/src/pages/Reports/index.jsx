import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "../../components/ui/ToastProvider";
import { useHistory } from "react-router-dom";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import * as XLSX from 'xlsx';

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";


import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";

import { CircularProgress, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { UsersFilter } from "../../components/UsersFilter";
import { TagsFilter } from "../../components/TagsFilter";
import { WhatsappsFilter } from "../../components/WhatsappsFilter";
import { StatusFilter } from "../../components/StatusFilter";
import useDashboard from "../../hooks/useDashboard";


import moment from "moment";
import ShowTicketLogModal from "../../components/ShowTicketLogModal";

import { blue, green } from "@mui/material/colors";
import { Facebook, FilterList as FilterListIcon, Forward, History, Instagram, SaveAlt, Visibility, WhatsApp } from "@mui/icons-material";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { Field } from "formik";

const useStyles = () => ({
  mainContainer: {
    background: "#1976d2",
    maxWidth: "100%",
    padding: 8,
    "@media (max-width:600px)": {
      padding: 8,
    },
  },
  formControl: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPaper: {
    flex: 1,
    marginTop: 40,
    borderRadius: 20,
    border: '0px !important',
    marginBottom: 40,
    overflow: 'hidden'
  },
  mainPaperTable: {
    flex: 1,
    overflow: 'auto',
    height: '68vh',
    borderRadius: 16,
  },
  mainPaperFilter: {
    flex: 1,
    overflow: 'visible',
    padding: 24,
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    "@media (max-width:600px)": {
      padding: 12,
    },
  },
  mainHeaderBlock: {
    "@media (max-width:600px)": {
      display: 'flex',
      flexWrap: 'wrap'
    },
  },
  filterItem: {
    width: 200,
    "@media (max-width:600px)": {
      width: '45%'
    },
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 16,
    },
    '& .MuiFormControl-root': {
      width: '100%',
    },
  },
  dateField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 16,
    },
    '& .MuiFormControl-root': {
      width: '100%',
    },
  },

  actionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px', // Aumenta gap já que temos mais espaço
    height: '56px',
    flexWrap: 'nowrap', // Evita quebra
    minWidth: 0, // Permite compressão
    '& > *': {
      flexShrink: 0, // Evita compressão dos filhos
    },
    "@media (max-width:600px)": {
      flexDirection: 'column',
      gap: 8,
      height: 'auto',
    },
  },
  filterButton: {
    borderRadius: 8,
    textTransform: 'none',
    fontWeight: 600,
    padding: 8, // Aumentando padding horizontal
    height: '40px',
    minWidth: '140px', // Largura mínima para garantir que o texto caiba
    whiteSpace: 'nowrap', // IMPEDIR QUEBRA NO TEXTO
    overflow: 'hidden', // Evita vazamento
    textOverflow: 'ellipsis', // Adiciona ... se necessário
    boxSizing: 'border-box', // Garante que padding seja incluído no tamanho total
  },
  exportButton: {
    borderRadius: 8,
    backgroundColor: "#1976d2",
    color: '#fff',
    height: '40px',
    width: '40px',
    '&:hover': {
      backgroundColor: "#1976d2",
    },
  },
});


const Reports = () => {
  const classes = useStyles();
  const history = useHistory();
  const { getReport } = useDashboard();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Defina o tamanho da página

  const [searchParam, setSearchParam] = useState("");
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);

  // const [tagIds, setTagIds] = useState([]);
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
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("contacts", {
            params: { searchParam },
          });
          setOptions(data.contacts);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam]);

  // const handleSelectedTags = (selecteds) => {
  //   const tags = selecteds.map((t) => t.id);
  //   setTagIds(tags);
  // };

  const exportarGridParaExcel = async () => {
    setLoading(true); // Define o estado de loading como true durante o carregamento

    try {
      const data = await getReport({
        searchParam,
        contactId: selectedContactId,
        whatsappId: JSON.stringify(selectedWhatsapp),
        // tags: JSON.stringify(tagIds),
        users: JSON.stringify(userIds),
        queueIds: JSON.stringify(queueIds),
        status: JSON.stringify(selectedStatus),
        // tags: tagIds,
        dateFrom,
        dateTo,
        page: 1, // Passa o número da página para a API
        pageSize: 9999999, // Passa o tamanho da página para a API
        onlyRated: onlyRated ? "true" : "false"
      });


      const ticketsData = data.tickets.map(ticket => {
        // Convertendo o campo createdAt para um objeto Date
        const createdAt = new Date(ticket.createdAt);
        const closedAt = new Date(ticket.closedAt);

        const dataFechamento = closedAt.toLocaleDateString();
        const horaFechamento = closedAt.toLocaleTimeString();
        // Obtendo a data e a hora separadamente
        const dataCriacao = createdAt.toLocaleDateString(); // Obtém a data no formato 'dd/mm/aaaa'
        const horaCriacao = createdAt.toLocaleTimeString(); // Obtém a hora no formato 'hh:mm:ss'

        return {
          id: ticket.id,
          Conexão: ticket.whatsappName,
          Contato: ticket.contactName,
          Usuário: ticket.userName,
          Fila: ticket.queueName,
          Status: ticket.status,
          ÚltimaMensagem: ticket.lastMessage,
          DataAbertura: dataCriacao,
          HoraAbertura: horaCriacao,
          DataFechamento: ticket.closedAt === null ? "" : dataFechamento,
          HoraFechamento: ticket.closedAt === null ? "" : horaFechamento,
          TempoDeAtendimento: ticket.supportTime,
          nps: ticket.NPS,
        }
      });

      console.log(ticketsData)
      const ws = XLSX.utils.jsxon_to_sheet(ticketsData);
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, ws, 'RelatorioDeAtendimentos');
      XLSX.writeFile(wb, 'relatorio-de-atendimentos.xlsx');


      setPageNumber(pageNumber); // Atualiza o estado da página atual
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false); // Define o estado de loading como false após o carregamento
    }

  };


  const handleFilter = async (pageNumber) => {
    setLoading(true); // Define o estado de loading como true durante o carregamento
    console.log(onlyRated)
    try {
      const data = await getReport({
        searchParam,
        contactId: selectedContactId,
        whatsappId: JSON.stringify(selectedWhatsapp),
        // tags: JSON.stringify(tagIds),
        users: JSON.stringify(userIds),
        queueIds: JSON.stringify(queueIds),
        status: JSON.stringify(selectedStatus),
        // tags: tagIds,
        dateFrom,
        dateTo,
        page: pageNumber, // Passa o número da página para a API
        pageSize: pageSize, // Passa o tamanho da página para a API
        onlyRated: onlyRated ? "true" : "false"
      });

      setTotalTickets(data.totalTickets.total);

      // Verifica se há mais resultados para definir hasMore
      setHasMore(data.tickets.length === pageSize);

      setTickets(data.tickets); // Se for a primeira página, substitua os tickets

      setPageNumber(pageNumber); // Atualiza o estado da página atual
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false); // Define o estado de loading como false após o carregamento
    }
  }

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
  const IconChannel = (channel) => {
    switch (channel) {
      case "facebook":
        return <Facebook style={{ color: "#3b5998", verticalAlign: "middle" }} />;
      case "instagram":
        return <Instagram style={{ color: "#e1306c", verticalAlign: "middle" }} />;
      case "whatsapp":
        return <WhatsApp style={{ color: "#25d366", verticalAlign: "middle" }} />
      default:
        return "error";
    }
  };

  const renderOption = (option) => {
    if (option.number) {
      return <>
        {IconChannel(option.channel)}
        <Typography component="span" style={{ fontSize: 14, marginLeft: "10px", display: "inline-flex", alignItems: "center", lineHeight: "2" }}>
          {option.name} - {option.number}
        </Typography>
      </>
    } else {
      return `${i18n.t("newTicketModal.add")} ${option.name}`;
    }
  };

  const handleSelectOption = (e, newValue) => {
    setSelectedContactId(newValue.id);
    setSearchParam("");
  };

  const renderOptionLabel = option => {
    if (option.number) {
      return `${option.name} - ${option.number}`;
    } else {
      return `${option.name}`;
    }
  };
  const filter = createFilterOptions({
    trim: true,
  });

  const createAddContactOption = (filterOptions, params) => {
    const filtered = filter(filterOptions, params);
    if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
      filtered.push({
        name: `${params.inputValue}`,
      });
    }
    return filtered;
  };
  const renderContactAutocomplete = () => {
    return (
      <Grid xs={12} item>
        <Autocomplete
          fullWidth
          options={options}
          loading={loading}
          clearOnBlur
          autoHighlight
          freeSolo
          size="small"
          clearOnEscape
          getOptionLabel={renderOptionLabel}
          renderOption={renderOption}
          filterOptions={createAddContactOption}
          onChange={(e, newValue) => handleSelectOption(e, newValue)}
          renderInput={params => (
            <TextField
              {...params}
              label={i18n.t("newTicketModal.fieldLabel")}
              variant="outlined"
              autoFocus
              size="small"
              onChange={e => setSearchParam(e.target.value)}
              // onKeyPress={(e, newValue) => handleSelectOption(e, newValue)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
        />
      </Grid>
    )
  }

  return (
    <MainContainer className={classes.mainContainer}>
      {openTicketMessageDialog && (
        <ShowTicketLogModal
          isOpen={openTicketMessageDialog}
          handleClose={() => setOpenTicketMessageDialog(false)}
          ticketId={ticketOpen.id}
        />
      )}

      <MainHeader className={classes.mainHeaderFilter}>
        <Paper className={classes.mainPaperFilter}>
          <Title>{i18n.t("reports.title")}</Title>
          <Grid container spacing={2} className={classes.filterContainer}>
            {/* Primeira linha - 4 campos principais */}
            <Grid item xs={12} sm={6} md={3} className={classes.filterField}>
              {renderContactAutocomplete()}
            </Grid>
            <Grid item xs={12} sm={6} md={3} className={classes.filterField}>
              <WhatsappsFilter onFiltered={handleSelectedWhatsapps} />
            </Grid>
            <Grid item xs={12} sm={6} md={3} className={classes.filterField}>
              <StatusFilter onFiltered={handleSelectedStatus} />
            </Grid>
            <Grid item xs={12} sm={6} md={3} className={classes.filterField}>
              <UsersFilter onFiltered={handleSelectedUsers} />
            </Grid>

            {/* Segunda linha - 3 campos + ações */}
            <Grid item xs={12} sm={6} md={3} className={classes.dateField}>
              <FormControl variant="outlined" fullWidth size="small">
                <InputLabel>Filas</InputLabel>
                <Select
                  multiple
                  value={queueIds}
                  onChange={(e) => setQueueIds(e.target.value)}
                  label="Filas"
                  renderValue={(selected) => `${selected.length} selecionada(s)`}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                    getContentAnchorEl: null,
                  }}
                >
                  {user?.queues?.map((queue) => (
                    <MenuItem key={queue.id} value={queue.id}>
                      {queue.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3} className={classes.dateField}>
              <TextField
                label="Data Inicial"
                type="date"
                value={dateFrom}
                variant="outlined"
                fullWidth
                size="small"
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3} className={classes.dateField}>
              <TextField
                label="Data Final"
                type="date"
                value={dateTo}
                variant="outlined"
                fullWidth
                size="small"
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
            <div className={classes.actionContainer}>
  <Tooltip title={i18n.t("reports.buttons.onlyRated")} arrow placement="top">
    <Switch
      color="primary"
      checked={onlyRated}
      onChange={() => setOnlyRated(!onlyRated)}
      size="medium" 
    />
  </Tooltip>
  <IconButton 
    onClick={exportarGridParaExcel} 
    aria-label="Exportar para Excel"
    className={classes.exportButton}
  >
    <SaveAlt />
  </IconButton>
  <Button
    variant="contained"
    color="primary"
    onClick={() => handleFilter(pageNumber)}
    className={classes.filterButton}
    startIcon={<FilterListIcon />}
  >
    {i18n.t("reports.buttons.filter")}
  </Button>
</div>
            </Grid>
          </Grid>
        </Paper>
      </MainHeader>
      <Paper
        className={classes.mainPaperTable}
        variant="outlined"
      >
        <Table size="small" id="grid-attendants">
          <TableHead>
            <TableRow>
              {/* <TableCell padding="checkbox" /> */}
              <TableCell align="center">{i18n.t("reports.table.id")}</TableCell>
              <TableCell align="left">{i18n.t("reports.table.whatsapp")}</TableCell>
              <TableCell align="left">{i18n.t("reports.table.contact")}</TableCell>
              <TableCell align="left">{i18n.t("reports.table.user")}</TableCell>
              <TableCell align="left">{i18n.t("reports.table.queue")}</TableCell>
              <TableCell align="center">{i18n.t("reports.table.status")}</TableCell>
              <TableCell align="left">{i18n.t("reports.table.lastMessage")}</TableCell>
              <TableCell align="center">{i18n.t("reports.table.dateOpen")}</TableCell>
              <TableCell align="center">{i18n.t("reports.table.dateClose")}</TableCell>
              <TableCell align="center">{i18n.t("reports.table.supportTime")}</TableCell>
              <TableCell align="center">{i18n.t("reports.table.NPS")}</TableCell>
              <TableCell align="center">{i18n.t("reports.table.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell align="center">{ticket.id}</TableCell>
                  <TableCell align="left">{ticket?.whatsappName}</TableCell>
                  <TableCell align="left">{ticket?.contactName}</TableCell>
                  <TableCell align="left">{ticket?.userName}</TableCell>
                  <TableCell align="left">{ticket?.queueName}</TableCell>
                  <TableCell align="center">{ticket?.status}</TableCell>
                  <TableCell align="left">{ticket?.lastMessage}</TableCell>
                  <TableCell align="center">{ticket?.createdAt}</TableCell>
                  <TableCell align="center">{ticket?.closedAt}</TableCell>
                  <TableCell align="center">{ticket?.supportTime}</TableCell>
                  <TableCell align="center">{ticket?.NPS}</TableCell>
                  <TableCell align="center">
                    <Typography
                      noWrap
                      component="span"
                      variant="body2"
                      color="textPrimary"
                    >
                      <Tooltip title="Logs do Ticket">
                        <History
                          onClick={() => {
                            setOpenTicketMessageDialog(true)
                            setTicketOpen(ticket)
                          }}
                          fontSize="small"
                          style={{
                            color: blue[700],
                            cursor: "pointer",
                            marginLeft: 10,
                            verticalAlign: "middle"
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Acessar Ticket">
                        <Forward
                          onClick={() => { history.push(`/tickets/${ticket.uuid}`) }}
                          fontSize="small"
                          style={{
                            color: green[700],
                            cursor: "pointer",
                            marginLeft: 10,
                            verticalAlign: "middle"
                          }}
                        />
                      </Tooltip>
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton avatar columns={3} />}
            </>
          </TableBody>
        </Table>

      </Paper>

      <div>
        <Grid container>
          <Grid item xs={12} sm={10} md={10}>

            <Pagination
              count={Math.ceil(totalTickets / pageSize)} // Calcula o nmero total de páginas com base no nmero total de tickets e no tamanho da página
              page={pageNumber} // Define a página atual
              onChange={(event, value) => handleFilter(value)} // Função de callback para mudanças de página
            />
          </Grid>
          <Grid item xs={12} sm={2} md={2}>

            <FormControl
              margin="dense"
              variant="outlined"
              fullWidth
            >
              <InputLabel>
                {i18n.t("tickets.search.ticketsPerPage")}
              </InputLabel>
              <Select
                labelId="dialog-select-prompt-label"
                id="dialog-select-prompt"
                name="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value)
                }}
                label={i18n.t("tickets.search.ticketsPerPage")}
                fullWidth
                MenuProps={{
                  anchorOrigin: {
                    vertical: "center",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "center",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
              >
                <MenuItem value={5} >{"5"}</MenuItem>
                <MenuItem value={10} >{"10"}</MenuItem>
                <MenuItem value={20} >{"20"}</MenuItem>
                <MenuItem value={50} >{"50"}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </div>
    </MainContainer >
  );
};

export default Reports;
