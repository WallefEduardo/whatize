import React, { useState, useEffect, useReducer, useContext, useRef } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { CSVLink } from "react-csv";
import { makeStyles } from "@material-ui/core/styles";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  InputAdornment,
  Typography,
  Menu,
  MenuItem,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  LinearProgress
} from "@material-ui/core";

import {
  AddCircleOutline,
  Search,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowDropDown,
  Backup,
  ContactPhone,
  Facebook,
  Instagram,
  WhatsApp,
  CloudDownload,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon
} from "@material-ui/icons";

import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { i18n } from "../../translate/i18n";
import { Can } from "../../components/Can";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import NewTicketModal from "../../components/NewTicketModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import ContactImportWpModal from "../../components/ContactImportWpModal";
import { TagsFilter } from "../../components/TagsFilter";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import formatSerializedId from "../../utils/formatSerializedId";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import useContactSelection from "../../hooks/useContactSelection";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach((contact) => {
      const contactIndex = state.findIndex((c) => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};
const useStyles = makeStyles(theme => ({
  // ... outros estilos
  filterSelect: {
    "& .MuiSelect-select": {
      minWidth: "250px",  // Aumentando a largura
      width: "250px"      // Forçando a largura fixa
    },
    "& .MuiOutlinedInput-root": {
      width: "250px"      // Garantindo que o input também tenha a largura
    },
    "& .MuiPopover-paper": {
      width: "250px"      // Ajustando o menu dropdown também
    }
  },
  mainPaper: {
    flex: 1,
    padding: 0,
    overflowY: "scroll",
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
    ...theme.scrollbarStyles,
  },
  searchContainer: {
    backgroundColor: "white",
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    flexWrap: "wrap",
  },
  actionButtons: {
    display: "flex",
    gap: theme.spacing(1),
    "& > *": {
      backgroundColor: "#00C307",
      color: "white",
      "&:hover": {
        backgroundColor: "#029907",
      },
    },
  },
  searchInput: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
    width: "300px",
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  customTable: {
    "& .MuiTableCell-head": {
      fontWeight: 600,
      color: "#333",
      borderBottom: "2px solid #f5f5f5",
    },
    "& .MuiTableCell-body": {
      borderBottom: "1px solid #f5f5f5",
    },
    "& .MuiTableRow-root:hover": {
      backgroundColor: "#f9f9f9",
    },
  },
  avatarCell: {
    width: 50,
    "& .MuiAvatar-root": {
      width: 40,
      height: 40,
    },
  },
  actionCell: {
    width: 150,
    textAlign: "center",
  },
  selectionCell: {
    width: 50,
    padding: theme.spacing(1),
  },
  bulkActionsContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(1),
    backgroundColor: "#e8f5e8",
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
    animation: "slideDown 0.3s ease-in-out",
  },
  selectedChip: {
    backgroundColor: "#00C307",
    color: "white",
    fontWeight: 600,
    "& .MuiChip-label": {
      color: "white",
    },
  },
  "@keyframes slideDown": {
    from: { opacity: 0, transform: "translateY(-10px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  bulkDeleteButton: {
    backgroundColor: "#f44336",
    color: "white",
    "&:hover": {
      backgroundColor: "#d32f2f",
    },
    "&:disabled": {
      backgroundColor: "#ffcdd2",
      color: "#e57373",
    },
  },
  clearSelectionButton: {
    color: "#666",
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
  },
  selectedChip: {
    backgroundColor: "#2196f3",
    color: "white",
    fontWeight: "bold",
  },
  iconButton: {
    padding: theme.spacing(0),
    "&.new-ticket": {
      color: "#00C307",
    },
    "&.edit": {
      color: "#00C307",
    },
    "&.block": {
      color: "#E57373",
    },
    "&.delete": {
      color: "#E57373",
    },
  },
  importButton: {
    backgroundColor: "#00C307",
    color: "white",
    "&:hover": {
      backgroundColor: "#029907",
    },
  },
  menu: {
    "& .MuiMenuItem-root": {
      minHeight: 48,
    },
  },
  menuIcon: {
    marginRight: theme.spacing(1),
    color: "#00C307",
  },
  statusIcon: {
    "&.active": {
      color: "#4CAF50",
    },
    "&.inactive": {
      color: "#E57373",
    },
  },
  tagsContainer: {
    display: "flex",
    gap: theme.spacing(1),
    flexWrap: "wrap",
  },
  csvbtn: {
    textDecoration: "none",
    color: "#333",
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "6px 16px",
  },
}));

const Contacts = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { getAll: getAllSettings } = useCompanySettings();
  // States
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [importContactModalOpen, setImportContactModalOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [ImportContacts, setImportContacts] = useState(null);
  const [blockingContact, setBlockingContact] = useState(null);
  const [unBlockingContact, setUnBlockingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportContact, setExportContact] = useState(false);
  const [confirmChatsOpen, setConfirmChatsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [hideNum, setHideNum] = useState(false);
  const [enableLGPD, setEnableLGPD] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkProgressOpen, setBulkProgressOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkProgressText, setBulkProgressText] = useState("");
  const fileUploadRef = useRef(null);

  // Hook para seleção de contatos
  const {
    selectedContacts,
    selectAll,
    toggleContact,
    toggleSelectAll,
    clearSelection,
    isSelected,
    getSelectedCount,
    getSelectedIds
  } = useContactSelection();

  // Effects
  useEffect(() => {
    async function fetchData() {
      const settingList = await getAllSettings(user.companyId);
      for (const [key, value] of Object.entries(settingList)) {
        if (key === "enableLGPD") setEnableLGPD(value === "enabled");
        if (key === "lgpdHideNumber") setHideNum(value === "enabled");
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam, selectedTags]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/contacts/", {
            params: {
              searchParam,
              pageNumber,
              contactTag: JSON.stringify(selectedTags),
            },
          });
          dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, selectedTags]);

  useEffect(() => {
    const companyId = user.companyId;
    const onContactEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
      }
    };

    socket.on(`company-${companyId}-contact`, onContactEvent);
    return () => {
      socket.off(`company-${companyId}-contact`, onContactEvent);
    };
  }, [socket, user]);

  // Handlers
  const handleSelectedTags = (selecteds) => {
    const tags = selecteds.map((t) => t.id);
    setSelectedTags(tags);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const hadleEditContact = (contactId) => {
    setSelectedContactId(contactId);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await api.delete(`/contacts/${contactId}`);
      toast.success(i18n.t("contacts.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const handleBlockContact = async (contactId) => {
    try {
      await api.put(`/contacts/block/${contactId}`, { active: false });
      toast.success("Contato bloqueado");
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
    setBlockingContact(null);
  };

  const handleUnBlockContact = async (contactId) => {
    try {
      await api.put(`/contacts/block/${contactId}`, { active: true });
      toast.success("Contato desbloqueado");
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
    setUnBlockingContact(null);
  };

  const handleimportContact = async () => {
    try {
      await api.post("/contacts/import");
      history.go(0);
      setImportContacts(false);
    } catch (err) {
      toastError(err);
      setImportContacts(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    setBulkConfirmOpen(false);
    setBulkProgressOpen(true);
    setBulkProgress(0);
    setBulkProgressText("Iniciando exclusão em massa...");
    
    try {
      const contactIds = getSelectedIds();
      const totalContacts = contactIds.length;
      
      // Simular progresso gradual mais realista
      const simulateProgress = () => {
        return new Promise((resolve) => {
          let currentProgress = 0;
          const increment = Math.random() * 3 + 1; // Incremento aleatório entre 1-4%
          
          const progressInterval = setInterval(() => {
            currentProgress += increment;
            
            if (currentProgress <= 20) {
              setBulkProgressText("Validando contatos selecionados...");
            } else if (currentProgress <= 40) {
              setBulkProgressText("Verificando tickets abertos...");
            } else if (currentProgress <= 60) {
              setBulkProgressText(`Processando ${totalContacts} contato(s)...`);
            } else if (currentProgress <= 80) {
              setBulkProgressText("Executando exclusões...");
            } else if (currentProgress <= 95) {
              setBulkProgressText("Finalizando operação...");
            }
            
            setBulkProgress(Math.min(currentProgress, 95));
            
            if (currentProgress >= 95) {
              clearInterval(progressInterval);
              resolve();
            }
          }, Math.random() * 200 + 100); // Intervalo aleatório entre 100-300ms
        });
      };
      
      // Executar progresso gradual e requisição em paralelo
      const [, response] = await Promise.all([
        simulateProgress(),
        api.post("/contacts/bulk-delete", { contactIds })
      ]);
      
      const { data } = response;
      const { deleted, skipped, errors } = data.results;
      
      setBulkProgress(100);
      setBulkProgressText("Concluído!");
      
      // Aguardar um pouco para mostrar o progresso completo
      setTimeout(() => {
        setBulkProgressOpen(false);
        
        let message = "";
        if (deleted.length > 0) {
          message += `${deleted.length} contato(s) excluído(s) com sucesso. `;
        }
        if (skipped.length > 0) {
          message += `${skipped.length} contato(s) pulado(s) (possuem tickets abertos). `;
        }
        if (errors.length > 0) {
          message += `${errors.length} erro(s) durante a exclusão.`;
        }
        
        toast.success(message);
        clearSelection();
        setSearchParam("");
        setPageNumber(1);
      }, 1500);
      
    } catch (err) {
      setBulkProgressOpen(false);
      toastError(err);
    }
    setBulkDeleteLoading(false);
  };

  const handleOpenBulkDelete = () => {
    if (getSelectedCount() === 0) {
      toast.warning("Selecione pelo menos um contato para excluir");
      return;
    }
    setBulkConfirmOpen(true);
  };

  const handleImportExcel = async () => {
    try {
      const formData = new FormData();
      formData.append("file", fileUploadRef.current.files[0]);
      await api.request({
        url: `/contacts/upload`,
        method: "POST",
        data: formData,
      });
      history.go(0);
    } catch (err) {
      toastError(err);
    }
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const checkContactStatus = async (contact) => {
    try {
      const { data } = await api.get(`/contacts/${contact.id}/status`);
      if (data === "inQueue") {
        setWarningMessage("Este contato já está sendo atendido por outro usuário.");
        setWarningOpen(true);
      } else if (data.includes("beingAttendedBy:")) {
        setWarningMessage(`Este contato está sendo atendido por ${data.split(":")[1]}`);
        setWarningOpen(true);
      } else {
        setContactTicket(contact);
        setNewTicketModalOpen(true);
      }
    } catch (err) {
      toastError(err);
    }
  };

  const handleSelectTicket = (ticket) => {
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code: uuid });
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      handleSelectTicket(ticket);
      history.push(`/tickets/${ticket.uuid}`);
    }
  };
  return (
    <MainContainer>
      {/* Modais */}
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={handleCloseOrOpenTicket}
      />

      <ContactModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        contactId={selectedContactId}
      />

      <ContactImportWpModal
        isOpen={importContactModalOpen}
        handleClose={() => setImportContactModalOpen(false)}
        selectedTags={selectedTags}
        hideNum={hideNum}
        userProfile={user.profile}
      />

      <ConfirmationModal
        title={
          deletingContact
            ? `${i18n.t("contacts.confirmationModal.deleteTitle")} ${deletingContact.name}?`
            : blockingContact
              ? `Bloquear Contato ${blockingContact.name}?`
              : unBlockingContact
                ? `Desbloquear Contato ${unBlockingContact.name}?`
                : ImportContacts
                  ? `${i18n.t("contacts.confirmationModal.importTitlte")}`
                  : `${i18n.t("contactListItems.confirmationModal.importTitlte")}`
        }
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          deletingContact
            ? handleDeleteContact(deletingContact.id)
            : blockingContact
              ? handleBlockContact(blockingContact.id)
              : unBlockingContact
                ? handleUnBlockContact(unBlockingContact.id)
                : ImportContacts
                  ? handleimportContact()
                  : handleImportExcel()
        }
      >
        {exportContact
          ? `${i18n.t("contacts.confirmationModal.exportContact")}`
          : deletingContact
            ? `${i18n.t("contacts.confirmationModal.deleteMessage")}`
            : blockingContact
              ? `${i18n.t("contacts.confirmationModal.blockContact")}`
              : unBlockingContact
                ? `${i18n.t("contacts.confirmationModal.unblockContact")}`
                : ImportContacts
                  ? `${i18n.t("contacts.confirmationModal.importMessage")}`
                  : `${i18n.t("contactListItems.confirmationModal.importMessage")}`}
      </ConfirmationModal>

      <Dialog open={warningOpen} onClose={() => setWarningOpen(false)}>
        <DialogTitle>Aviso</DialogTitle>
        <DialogContent>{warningMessage}</DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningOpen(false)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmação para exclusão em massa */}
      <ConfirmationModal
        title={`Excluir ${getSelectedCount()} contato(s) selecionado(s)?`}
        open={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={handleBulkDelete}
      >
        <div>
          <Typography variant="body1" style={{ marginBottom: 16 }}>
            Esta ação irá excluir permanentemente os contatos selecionados.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Importante:</strong> Contatos com tickets abertos não serão excluídos.
          </Typography>
        </div>
      </ConfirmationModal>

      {/* Modal de progresso para exclusão em massa */}
      <Dialog
        open={bulkProgressOpen}
        disableBackdropClick
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle style={{ textAlign: "center", paddingBottom: 8 }}>
          <DeleteOutlineIcon style={{ fontSize: 48, color: "#f44336", marginBottom: 8 }} />
          <Typography variant="h6">Excluindo Contatos</Typography>
        </DialogTitle>
        <DialogContent style={{ paddingTop: 0 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Typography variant="body1" style={{ marginBottom: 16 }}>
              {bulkProgressText}
            </Typography>
            
            <div style={{ position: "relative", display: "inline-flex", marginBottom: 16 }}>
              <CircularProgress
                variant="determinate"
                value={bulkProgress}
                size={80}
                thickness={4}
                style={{ color: bulkProgress === 100 ? "#4caf50" : "#2196f3" }}
              />
              <div
                style={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="h6" component="div" color="textSecondary">
                  {`${Math.round(bulkProgress)}%`}
                </Typography>
              </div>
            </div>
            
            <LinearProgress
              variant="determinate"
              value={bulkProgress}
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "#e0e0e0",
              }}
              classes={{
                bar: {
                  backgroundColor: bulkProgress === 100 ? "#4caf50" : "#2196f3",
                  borderRadius: 4,
                }
              }}
            />
          </div>
          
          {bulkProgress === 100 && (
            <div style={{ textAlign: "center" }}>
              <CheckCircleIcon style={{ fontSize: 32, color: "#4caf50", marginBottom: 8 }} />
              <Typography variant="body2" color="textSecondary">
                Operação concluída com sucesso!
              </Typography>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conteúdo Principal */}
      <div className={classes.searchContainer}>
        <div style={{
          display: "flex",
          gap: "16px",
          flex: 1,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <TextField
            className={classes.searchInput}
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            variant="outlined"
            size="small"
            style={{ maxWidth: "300px" }} // Limitando o tamanho do campo de pesquisa
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search style={{ color: "#00C307" }} />
                </InputAdornment>
              ),
            }}
          />
          <Box className={classes.filterSelect}>
            <TagsFilter
              onFiltered={handleSelectedTags}
            />
          </Box>
        </div>

        <div className={classes.actionButtons}>
          <PopupState variant="popover" popupId="import-menu">
            {(popupState) => (
              <React.Fragment>
                <Button
                  variant="contained"
                  {...bindTrigger(popupState)}
                  className={classes.importButton}
                  startIcon={<ArrowDropDown />}
                >
                  Importar / Exportar
                </Button>
                <Menu
                  {...bindMenu(popupState)}
                  className={classes.menu}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setConfirmOpen(true);
                      setImportContacts(true);
                      popupState.close();
                    }}
                  >
                    <ContactPhone className={classes.menuIcon} />
                    {i18n.t("contacts.menu.importYourPhone")}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setImportContactModalOpen(true);
                      popupState.close();
                    }}
                  >
                    <Backup className={classes.menuIcon} />
                    {i18n.t("contacts.menu.importToExcel")}
                  </MenuItem>
                </Menu>
              </React.Fragment>
            )}
          </PopupState>

          <Button
            variant="contained"
            onClick={handleOpenContactModal}
            startIcon={<AddCircleOutline />}
            style={{ backgroundColor: "#00C307" }}
          >
            {i18n.t("contacts.buttons.add")}
          </Button>
        </div>
      </div>

      <Paper className={classes.mainPaper} onScroll={handleScroll}>
        {/* Barra de ações em massa */}
        {getSelectedCount() > 0 && (
          <div className={classes.bulkActionsContainer}>
            <Chip 
              label={`${getSelectedCount()} contato(s) selecionado(s)`}
              className={classes.selectedChip}
              size="small"
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<DeleteOutlineIcon />}
              className={classes.bulkDeleteButton}
              onClick={handleOpenBulkDelete}
              disabled={bulkDeleteLoading}
            >
              {bulkDeleteLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                "Excluir Selecionados"
              )}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              className={classes.clearSelectionButton}
              onClick={clearSelection}
            >
              Limpar Seleção
            </Button>
          </div>
        )}

        <div className={classes.tableContainer}>
          <Table size="small" className={classes.customTable}>
            <TableHead>
              <TableRow>
                <TableCell className={classes.selectionCell}>
                  <Checkbox
                    checked={selectAll}
                    onChange={() => toggleSelectAll(contacts)}
                    color="primary"
                    size="small"
                    title="Selecionar todos"
                  />
                </TableCell>
                <TableCell className={classes.avatarCell}></TableCell>
                <TableCell>{i18n.t("contacts.table.name")}</TableCell>
                <TableCell>{i18n.t("contacts.table.whatsapp")}</TableCell>
                <TableCell>{i18n.t("contacts.table.email")}</TableCell>
                <TableCell align="center">{i18n.t("contacts.table.whatsapp")}</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell className={classes.actionCell}>
                  {i18n.t("contacts.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} hover>
                  <TableCell className={classes.selectionCell}>
                    <Checkbox
                      checked={isSelected(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell className={classes.avatarCell}>
                    <Avatar
                      src={contact?.urlPicture}
                      alt={contact.name}
                      style={{
                        width: 42,
                        height: 42,
                        border: '2px solid #f5f5f5'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" style={{ fontWeight: 500, color: '#333' }}>
                      {contact.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {enableLGPD && hideNum && user.profile === "user"
                        ? contact.isGroup
                          ? contact.number
                          : formatSerializedId(contact?.number) === null
                            ? contact.number.slice(0, -6) + "**-**" + contact?.number.slice(-2)
                            : formatSerializedId(contact?.number)?.slice(0, -6) + "**-**" + contact?.number?.slice(-2)
                        : contact.isGroup
                          ? contact.number
                          : formatSerializedId(contact?.number)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{contact.email}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{contact?.whatsapp?.name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {contact.active ? (
                      <CheckCircleIcon className={`${classes.statusIcon} active`} style={{ fontSize: 20 }} />
                    ) : (
                      <CancelIcon className={`${classes.statusIcon} inactive`} style={{ fontSize: 20 }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        disabled={!contact.active}
                        onClick={() => checkContactStatus(contact)}
                        className={classes.iconButton}
                        style={{ backgroundColor: contact.active ? '#f5f5f5' : 'transparent' }}
                      >
                        {contact.channel === "whatsapp" && (
                          <WhatsApp style={{ color: "#25d366" }} fontSize="small" />
                        )}
                        {contact.channel === "instagram" && (
                          <Instagram style={{ color: "#e1306c" }} fontSize="small" />
                        )}
                        {contact.channel === "facebook" && (
                          <Facebook style={{ color: "#3b5998" }} fontSize="small" />
                        )}
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => hadleEditContact(contact.id)}
                        className={`${classes.iconButton} edit`}
                        style={{ backgroundColor: '#f5f5f5' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={contact.active
                          ? () => {
                            setConfirmOpen(true);
                            setBlockingContact(contact);
                          }
                          : () => {
                            setConfirmOpen(true);
                            setUnBlockingContact(contact);
                          }
                        }
                        className={`${classes.iconButton} block`}
                        style={{ backgroundColor: '#f5f5f5' }}
                      >
                        {contact.active ? (
                          <BlockIcon fontSize="small" />
                        ) : (
                          <CheckCircleIcon fontSize="small" />
                        )}
                      </IconButton>

                      <Can
                        role={user.profile}
                        perform="contacts-page:deleteContact"
                        yes={() => (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setConfirmOpen(true);
                              setDeletingContact(contact);
                            }}
                            className={`${classes.iconButton} delete`}
                            style={{ backgroundColor: '#f5f5f5' }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton avatar columns={8} />}
            </TableBody>
          </Table>
        </div>

        <input
          style={{ display: "none" }}
          id="upload"
          type="file"
          accept=".xls,.xlsx"
          onChange={() => setConfirmOpen(true)}
          ref={fileUploadRef}
        />
      </Paper>
    </MainContainer>
  );
};

export default Contacts;