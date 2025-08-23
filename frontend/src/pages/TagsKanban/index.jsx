import React, {
  useState,
  useEffect,
  useReducer,
  useCallback,
  useContext,
} from "react";
import { toast } from "../../components/ui/ToastProvider";
import { useHistory } from "react-router-dom";
import { Paper } from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import {
  Search as SearchIcon,
  Delete as DeleteOutlineIcon,
  Edit as EditIcon,
  AddCircleOutline,
  ArrowBack,
  PlaylistAdd
} from "@mui/icons-material";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = () => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    overflowY: "scroll",
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  searchInput: {
    width: "300px",
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
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
  actionButtons: {
    backgroundColor: "#00C307",
    color: "white",
    "&:hover": {
      backgroundColor: "#029907",
    },
  },
  backButton: {
    backgroundColor: "#00C307",
    color: "white",
    "&:hover": {
      backgroundColor: "#029907",
    },
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    marginLeft: 8,
    "&.edit": {
      color: "#00C307",
    },
    "&.delete": {
      color: "#E57373",
    },
  },
  tagChip: {
    textShadow: "1px 1px 1px rgba(0, 0, 0, 0.5)",
    fontWeight: "bold",
    padding: "5px 10px",
    borderRadius: "4px",
  },
  countBadge: {
    backgroundColor: "#f5f5f5",
    color: "#333",
    padding: "4px 8px",
    borderRadius: "12px",
    fontWeight: "bold",
  },
});

const reducer = (state, action) => {
  if (action.type === "LOAD_TAGS") {
    const tags = action.payload;
    const newTags = [];

    tags.forEach((tag) => {
      const tagIndex = state.findIndex((s) => s.id === tag.id);
      if (tagIndex !== -1) {
        state[tagIndex] = tag;
      } else {
        newTags.push(tag);
      }
    });

    return [...state, ...newTags];
  }

  if (action.type === "UPDATE_TAGS") {
    const tag = action.payload;
    const tagIndex = state.findIndex((s) => s.id === tag.id);

    if (tagIndex !== -1) {
      state[tagIndex] = tag;
      return [...state];
    } else {
      return [tag, ...state];
    }
  }

  if (action.type === "DELETE_TAGS") {
    const tagId = action.payload;
    const tagIndex = state.findIndex((s) => s.id === tagId);
    if (tagIndex !== -1) {
      state.splice(tagIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const Tags = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [tags, dispatch] = useReducer(reducer, []);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [funnelModalOpen, setFunnelModalOpen] = useState(false);
  const [funnelName, setFunnelName] = useState("");
  const [funnels, setFunnels] = useState([]);
  const [loadingFunnels, setLoadingFunnels] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState(null);
  const [deletingFunnel, setDeletingFunnel] = useState(null);
  const [confirmDeleteFunnelOpen, setConfirmDeleteFunnelOpen] = useState(false);
  const [savingFunnel, setSavingFunnel] = useState(false);
  const [selectedFunnelFilter, setSelectedFunnelFilter] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTags = async () => {
        try {
          const { data } = await api.get("/tags/", {
            params: { 
              searchParam, 
              pageNumber, 
              kanban: 1,
              funilId: selectedFunnelFilter 
            },
          });
          dispatch({ type: "LOAD_TAGS", payload: data.tags });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchTags();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, selectedFunnelFilter]);

  // Função para buscar funis
  const fetchFunnels = useCallback(async () => {
    try {
      setLoadingFunnels(true);
      const { data } = await api.get("/funilkanban");
      // Ordenar funis por ID para garantir ordem consistente
      const sortedFunnels = (data.funilKanbans || []).sort((a, b) => a.id - b.id);
      setFunnels(sortedFunnels);
      setLoadingFunnels(false);
    } catch (err) {
      toastError(err);
      setLoadingFunnels(false);
    }
  }, []);

  useEffect(() => {
    fetchFunnels();
  }, [fetchFunnels]);

  useEffect(() => {
    // Buscar usuários apenas se o usuário for admin
    if (user.profile === 'admin') {
      const fetchUsers = async () => {
        try {
          const { data } = await api.get("/users/list");
          setUsers(data || []);
        } catch (err) {
          toastError(err);
        }
      };
      fetchUsers();
    }
  }, [user.profile]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam, selectedFunnelFilter]);

  useEffect(() => {
    const onTagsEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_TAGS", payload: data.tag });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_TAGS", payload: +data.tagId });
      }
    };
    socket.on(`company${user.companyId}-tag`, onTagsEvent);

    const onFunnelEvent = (data) => {
      if (data.action === "create") {
        setFunnels(prev => {
          const newFunnels = [...prev, data.funilKanban];
          // Ordenar por ID após adicionar
          return newFunnels.sort((a, b) => a.id - b.id);
        });
      }
      if (data.action === "update") {
        setFunnels(prev => {
          const updatedFunnels = prev.map(funnel => 
            funnel.id === data.funilKanban.id ? data.funilKanban : funnel
          );
          // Manter ordenação por ID
          return updatedFunnels.sort((a, b) => a.id - b.id);
        });
      }
      if (data.action === "delete") {
        setFunnels(prev => prev.filter(funnel => funnel.id !== +data.funilKanbanId));
      }
    };
    socket.on(`company-${user.companyId}-funilKanban`, onFunnelEvent);

    return () => {
      socket.off(`company${user.companyId}-tag`, onTagsEvent);
      socket.off(`company-${user.companyId}-funilKanban`, onFunnelEvent);
    };
  }, [socket, user.companyId]);

  const handleOpenTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(true);
  };

  const handleCloseTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditTag = (tag) => {
    setSelectedTag(tag);
    setTagModalOpen(true);
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await api.delete(`/tags/${tagId}`);
      toast.success(i18n.t("tags.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingTag(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const handleReturnToKanban = () => {
    history.push("/kanban");
  };

  const handleOpenFunnelModal = () => {
    setFunnelModalOpen(true);
    setFunnelName("");
    setSelectedFunnel(null);
    setSelectedUsers([]);
  };

  const handleCloseFunnelModal = () => {
    setFunnelModalOpen(false);
    setFunnelName("");
    setSelectedFunnel(null);
    setSelectedUsers([]);
  };

  const handleAddFunnel = async () => {
    if (funnelName.trim() === "") return;
    
    try {
      setSavingFunnel(true);
      const { data } = await api.post("/funilkanban", {
        name: funnelName,
        userIds: selectedUsers.map(user => user.id)
      });
      
      // Recarregar lista completa para garantir que todos os funis sejam exibidos
      await fetchFunnels();
      setFunnelName("");
      setSelectedUsers([]);
      toast.success("Funil criado com sucesso!");
    } catch (err) {
      toastError(err);
    } finally {
      setSavingFunnel(false);
    }
  };

  const handleEditFunnel = (funnel) => {
    setSelectedFunnel(funnel);
    setFunnelName(funnel.name);
    setSelectedUsers(funnel.users || []);
  };

  const handleUpdateFunnel = async () => {
    if (!selectedFunnel || funnelName.trim() === "") return;
    
    try {
      setSavingFunnel(true);
      const { data } = await api.put(`/funilkanban/${selectedFunnel.id}`, {
        name: funnelName,
        userIds: selectedUsers.map(user => user.id)
      });
      
      // Recarregar lista completa para garantir que todos os funis sejam exibidos
      await fetchFunnels();
      
      setFunnelName("");
      setSelectedFunnel(null);
      setSelectedUsers([]);
      toast.success("Funil atualizado com sucesso!");
    } catch (err) {
      toastError(err);
    } finally {
      setSavingFunnel(false);
    }
  };

  const handleCheckFunnelUsage = async (funnel) => {
    try {
      // Verificar se existem tags associadas a este funil
      const { data } = await api.get("/tags/", {
        params: { 
          kanban: 1,
          funilId: funnel.id 
        },
      });
      
      if (data.tags && data.tags.length > 0) {
        toast.error(`Não é possível excluir este funil pois existem ${data.tags.length} seção(ões) associada(s) a ele. Remova ou altere as seções antes de excluir o funil.`);
        return false;
      }
      
      setDeletingFunnel(funnel);
      setConfirmDeleteFunnelOpen(true);
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  };

  const handleDeleteFunnel = async () => {
    if (!deletingFunnel) return;
    
    try {
      await api.delete(`/funilkanban/${deletingFunnel.id}`);
      
      // Recarregar lista completa para garantir que todos os funis sejam exibidos
      await fetchFunnels();
      
      toast.success("Funil excluído com sucesso!");
      setConfirmDeleteFunnelOpen(false);
      setDeletingFunnel(null);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toastError(err);
      }
      setConfirmDeleteFunnelOpen(false);
    }
  };

  const handleSaveFunnel = () => {
    if (selectedFunnel) {
      handleUpdateFunnel();
    } else {
      handleAddFunnel();
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={deletingTag && `${i18n.t("tagsKanban.confirmationModal.deleteTitle")}`}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteTag(deletingTag.id)}
      >
        {i18n.t("tagsKanban.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <ConfirmationModal
        title="Excluir Funil"
        open={confirmDeleteFunnelOpen}
        onClose={() => setConfirmDeleteFunnelOpen(false)}
        onConfirm={handleDeleteFunnel}
      >
        Tem certeza que deseja excluir este funil? Esta ação não pode ser desfeita.
      </ConfirmationModal>

      {tagModalOpen && (
        <TagModal
          open={tagModalOpen}
          onClose={handleCloseTagModal}
          aria-labelledby="form-dialog-title"
          tagId={selectedTag && selectedTag.id}
          kanban={1}
        />
      )}

      <div className={classes.searchContainer}>
        <div style={{
          display: "flex",
          gap: "16px",
          alignItems: "center"
        }}>
          <Typography variant="h6" style={{ color: '#333' }}>
            {i18n.t("tagsKanban.title")} ({tags.length})
          </Typography>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <TextField
            className={classes.searchInput}
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "#00C307" }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl variant="outlined" size="small" style={{ minWidth: 200 }}>
            <InputLabel>Filtrar por Funil</InputLabel>
            <Select
              value={selectedFunnelFilter || ''}
              onChange={(e) => setSelectedFunnelFilter(e.target.value || null)}
              label="Filtrar por Funil"
            >
              <MenuItem value="">Todos os Funis</MenuItem>
              {funnels.map(funnel => (
                <MenuItem key={funnel.id} value={funnel.id}>{funnel.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            className={classes.actionButtons}
            onClick={handleOpenTagModal}
            startIcon={<AddCircleOutline />}
          >
            {i18n.t("tagsKanban.buttons.add")}
          </Button>

          <Button
            variant="contained"
            className={classes.actionButtons}
            onClick={handleOpenFunnelModal}
            startIcon={<PlaylistAdd />}
          >
            Novo Funil
          </Button>

          <Button
            variant="contained"
            className={classes.backButton}
            onClick={handleReturnToKanban}
            startIcon={<ArrowBack />}
          >
            {'Voltar para o Kanban'}
          </Button>
        </div>
      </div>

      <Paper className={classes.mainPaper} onScroll={handleScroll}>
        <div className={classes.tableContainer}>
          <Table size="small" className={classes.customTable}>
            <TableHead>
              <TableRow>
                <TableCell align="center">Kanban Id</TableCell>
                <TableCell align="center">{i18n.t("tagsKanban.table.name")}</TableCell>
                <TableCell align="center">Funil</TableCell>
                <TableCell align="center">{i18n.t("tagsKanban.table.tickets")}</TableCell>
                <TableCell align="center">{i18n.t("tagsKanban.table.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell align="center">{tag.id}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={tag.name}
                      style={{
                        backgroundColor: tag.color,
                        color: "white",
                      }}
                      className={classes.tagChip}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {funnels.find(funnel => funnel.id === tag.funilId)?.name || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <span className={classes.countBadge}>
                      {tag?.ticketTags ? tag?.ticketTags?.length : 0}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTag(tag)}
                        className={`${classes.iconButton} edit`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => {
                          setConfirmModalOpen(true);
                          setDeletingTag(tag);
                        }}
                        className={`${classes.iconButton} delete`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={3} />}
            </TableBody>
          </Table>
        </div>
      </Paper>

      <Dialog open={funnelModalOpen} onClose={handleCloseFunnelModal} maxWidth="md" fullWidth>
        <DialogTitle style={{ fontWeight: 600, fontSize: 22, padding: '32px 32px 0 32px' }}>{selectedFunnel ? "Editar Funil" : "Novo Funil"}</DialogTitle>
        <DialogContent style={{ padding: 32, paddingTop: 16 }}>
          <form autoComplete="off" style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <TextField
                label="Nome"
                value={funnelName}
                onChange={e => setFunnelName(e.target.value)}
                variant="outlined"
                size="medium"
                fullWidth
                helperText="O nome do funil não pode conter mais de 20 caracteres"
                error={funnelName.length > 20}
                disabled={savingFunnel}
                InputLabelProps={{ shrink: true }}
              />
              
              {user.profile === 'admin' && (
                <Autocomplete
                  multiple
                  options={users}
                  value={selectedUsers}
                  onChange={(event, newValue) => {
                    setSelectedUsers(newValue);
                  }}
                  getOptionLabel={(option) => option.name}
                  disabled={savingFunnel}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option.name}
                        {...getTagProps({ index })}
                        size="small"
                        style={{
                          backgroundColor: "#f5f5f5",
                          color: "#333",
                          fontSize: "0.75rem",
                          height: "24px"
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Usuários com Acesso"
                      placeholder="Selecione os usuários que terão acesso a este funil"
                      helperText="Apenas usuários selecionados poderão ver este funil no Kanban. Deixe vazio para permitir acesso a todos."
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  PaperComponent={({ children, ...other }) => (
                    <div
                      {...other}
                      style={{
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        maxHeight: "200px",
                        overflow: "auto"
                      }}
                    >
                      {children}
                    </div>
                  )}
                />
              )}
            </div>
          </form>
          <Table size="small" style={{ marginTop: 32 }}>
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>Id</TableCell>
                <TableCell style={{ fontWeight: 600 }}>Nome</TableCell>
                <TableCell align="right" style={{ fontWeight: 600 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingFunnels ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">Carregando funis...</TableCell>
                </TableRow>
              ) : funnels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">Nenhum funil cadastrado</TableCell>
                </TableRow>
              ) : (
                funnels.map(funnel => (
                  <TableRow key={funnel.id}>
                    <TableCell>{funnel.id}</TableCell>
                    <TableCell>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{funnel.name}</div>
                        {funnel.users && funnel.users.length > 0 ? (
                          <div style={{ fontSize: '0.75rem', color: '#666', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {funnel.users.map((user, index) => (
                              <Chip
                                key={user.id}
                                label={user.name}
                                size="small"
                                style={{
                                  backgroundColor: "#e3f2fd",
                                  color: "#1976d2",
                                  fontSize: "0.65rem",
                                  height: "18px",
                                  fontWeight: 500
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                            Acesso livre (todos os usuários)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditFunnel(funnel)}
                        className={`${classes.iconButton} edit`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          handleCheckFunnelUsage(funnel);
                        }}
                        className={`${classes.iconButton} delete`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions style={{ padding: '24px 32px' }}>
          <Button onClick={handleCloseFunnelModal} color="default" style={{ fontWeight: 600, fontSize: 16, marginRight: 16 }}>Cancelar</Button>
          <Button
            onClick={handleSaveFunnel}
            color="primary"
            variant="contained"
            style={{ fontWeight: 600, fontSize: 16, minWidth: 140 }}
            disabled={funnelName.trim() === "" || funnelName.length > 20 || savingFunnel}
          >
            {savingFunnel ? "Salvando..." : selectedFunnel ? "Atualizar" : "Adicionar"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default Tags;