import React, { useState, useEffect, useReducer, useContext, useRef } from "react";
import { toast } from "../../components/ui/ToastProvider";
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  InputAdornment,
  Chip,
  Typography,
  Card,
  CardContent,
  Box
} from "@mui/material";

import {
  Search as SearchIcon,
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
  Add as AddIcon,
  MoreHoriz,
  LocalOffer as TagIcon,
} from "@mui/icons-material";

import PageLayout from "../../components/PageLayout";
import BaseTable from "../../components/BaseTable";
import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import ContactTagListModal from "../../components/ContactTagListModal";

import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_TAGS":
      // Garantir que action.payload seja um array válido
      const tags = Array.isArray(action.payload) ? action.payload : [];
      // Sempre substituir os dados para evitar acumulação incorreta
      return tags;
    case "UPDATE_TAGS":
      const tag = action.payload;
      if (!tag) return state;
      
      const tagIndex = state.findIndex((s) => s.id === tag.id);

      if (tagIndex !== -1) {
        state[tagIndex] = tag;
        return [...state];
      } else {
        return [tag, ...state];
      }
    case "DELETE_TAGS":
      const tagId = action.payload;
      return state.filter((tag) => tag.id !== tagId);
    case "RESET":
      return [];
    default:
      return state;
  }
};

const Tags = () => {
  const { user, socket } = useContext(AuthContext);

  const [selectedTagContacts, setSelectedTagContacts] = useState([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTagName, setSelectedTagName] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [tags, dispatch] = useReducer(reducer, []);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const pageNumberRef = useRef(1);

  useEffect(() => {
    const fetchMoreTags = async () => {
      try {
        const { data } = await api.get("/tags/", {
          params: { searchParam, pageNumber, kanban: 0 },
        });
        
        dispatch({ 
          type: "LOAD_TAGS", 
          payload: data.tags || []
        });
        setHasMore(data.hasMore);
        setLoading(false);
      } catch (err) {
        toastError(err);
        setLoading(false);
      }
    };

    if (pageNumber > 0) {
      setLoading(true);
      fetchMoreTags();
    }
  }, [searchParam, pageNumber]);

  useEffect(() => {
    if (!user?.companyId || !socket) {
      return;
    }

    const onCompanyTags = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_TAGS", payload: data.tag });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_TAGS", payload: +data.tagId });
      }
    };
    
    if (socket && socket.on && typeof socket.on === 'function') {
      socket.on(`company${user.companyId}-tag`, onCompanyTags);
    }

    return () => {
      if (socket && socket.off && typeof socket.off === 'function') {
        socket.off(`company${user.companyId}-tag`, onCompanyTags);
      }
    };
  }, [socket, user?.companyId]);
  const handleOpenTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(true);
  };

  const handleCloseTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(false);
  };

  const handleSearch = (event) => {
    const newSearchParam = event.target.value.toLowerCase();
    setSearchParam(newSearchParam);
    setPageNumber(1);
    dispatch({ type: "RESET" });
  };

  const handleEditTag = (tag) => {
    setSelectedTag(tag);
    setTagModalOpen(true);
  };

  const handleShowContacts = (contacts, tag) => {
    setSelectedTagContacts(contacts);
    setContactModalOpen(true);
    setSelectedTagName(tag);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setSelectedTagContacts([]);
    setSelectedTagName("");
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
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  return (
    <PageLayout
      title="Gerenciar Tags"
      icon={<TagIcon />}
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Tags" }
      ]}
    >
      {/* Modals */}
      {contactModalOpen && (
        <ContactTagListModal
          open={contactModalOpen}
          onClose={handleCloseContactModal}
          tag={selectedTagName}
        />
      )}

      <ConfirmationModal
        title={deletingTag && `${i18n.t("tags.confirmationModal.deleteTitle")}`}
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteTag(deletingTag.id)}
      >
        {i18n.t("tags.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <TagModal
        open={tagModalOpen}
        onClose={handleCloseTagModal}
        aria-labelledby="form-dialog-title"
        tagId={selectedTag && selectedTag.id}
        kanban={0}
      />

      {/* Container Único com Filtros e Tabela */}
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Seção de Filtros */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 3,
            pb: 3,
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <TextField
              placeholder={i18n.t("contacts.searchPlaceholder")}
              type="search"
              value={searchParam}
              onChange={handleSearch}
              variant="outlined"
              size="small"
              sx={{
                flex: 1,
                maxWidth: "400px",
                minWidth: "250px",
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
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'var(--color-accent)' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              onClick={handleOpenTagModal}
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                px: 3,
                py: 1,
                '&:hover': {
                  backgroundColor: '#00e608',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,195,7,0.3)'
              }}
            >
              {i18n.t("tags.buttons.add")}
            </Button>
          </Box>

          {/* Seção da Tabela */}
          {/* Sempre mostrar BaseTable - ele tem sua própria lógica de empty state */}
            <BaseTable
              records={tags}
              loading={loading}
              noRecordsTitle="Nenhuma tag encontrada"
              noRecordsText="Crie sua primeira tag ou ajuste os filtros de busca"
              noRecordsIcon={<TagIcon />}
              showPagination={false}
              minHeight={300}
            columns={[
              { 
                accessor: 'id', 
                title: i18n.t("tags.table.id"),
                textAlignment: 'center',
                width: 80,
                render: ({ id }) => (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'var(--color-accent)', 
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    #{id}
                  </Typography>
                )
              },
              { 
                accessor: 'name', 
                title: i18n.t("tags.table.name"),
                width: '40%',
                render: ({ name, color }) => (
                  <Chip
                    variant="outlined"
                    sx={{
                      borderRadius: "8px",
                      textShadow: "1px 1px 1px rgba(0, 0, 0, 0.3)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      border: 'none',
                    }}
                    style={{
                      backgroundColor: color,
                    }}
                    label={name}
                    size="small"
                  />
                )
              },
              { 
                accessor: 'contacts', 
                title: i18n.t("tags.table.contacts"),
                textAlignment: 'center',
                width: '25%',
                render: ({ contacts, ...tag }) => (
                  <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    justifyContent: "center"
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {contacts?.length || 0}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleShowContacts(contacts, tag)}
                      disabled={!contacts?.length}
                      sx={{
                        padding: 1,
                        color: "#666",
                        backgroundColor: "var(--bg-secondary)",
                        '&:hover': {
                          backgroundColor: "var(--hover-bg-light)",
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <MoreHoriz fontSize="small" />
                    </IconButton>
                  </Box>
                )
              },
              { 
                accessor: 'actions', 
                title: i18n.t("tags.table.actions"),
                textAlignment: 'center',
                width: 140,
                sortable: false,
                render: (tag) => (
                  <Box sx={{
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'center'
                  }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditTag(tag)}
                      sx={{
                        padding: 1,
                        color: "var(--color-accent)",
                        backgroundColor: "var(--bg-secondary)",
                        '&:hover': {
                          backgroundColor: "var(--hover-bg-light)",
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => {
                        setConfirmModalOpen(true);
                        setDeletingTag(tag);
                      }}
                      sx={{
                        padding: 1,
                        color: "#E57373",
                        backgroundColor: "var(--bg-secondary)",
                        '&:hover': {
                          backgroundColor: "var(--hover-bg-light)",
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )
              }
            ]}
            />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Tags;