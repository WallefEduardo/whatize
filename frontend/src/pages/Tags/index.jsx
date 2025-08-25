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
  Search,
  Trash2,
  Edit3,
  PlusCircle,
  MoreHorizontal,
  Tags as TagsIcon,
  BarChart3,
} from "lucide-react";

import PageLayout from "../../components/PageLayout";
import BaseTable, { ActionButton, ActionGroup } from "../../components/BaseTable";
import ModernModal from "../../components/ModernModal";
import TagForm from "../../components/TagForm";
import ConfirmationModal from "../../components/ConfirmationModal";
import ContactTagListModal from "../../components/ContactTagListModal";
import StatusBadge from "../../components/StatusBadge";
import SearchInput from "../../components/SearchInput";
import GradientButton from "../../components/GradientButton";

import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_TAGS":
      // Garantir que action.payload seja um array válido
      const tags = Array.isArray(action.payload) ? action.payload : [];
      // Se for a primeira página, substituir tudo
      if (action.isFirstPage) {
        return tags;
      }
      // Senão, adicionar ao que já existe (paginação)
      return [...state, ...tags];
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
          payload: data.tags || [],
          isFirstPage: pageNumber === 1
        });
        setHasMore(data.hasMore);
        setLoading(false);
      } catch (err) {
        toast.error("Erro ao carregar as tags. Verifique sua conexão e tente novamente.", { 
          title: "Erro de Carregamento!" 
        });
        console.error("Erro ao carregar tags:", err);
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
    // Recarregar tags após fechar o modal
    setSearchParam("");
    setPageNumber(1);
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
      toast.success("Tag excluída com sucesso!", { 
        title: "Operação Concluída!" 
      });
      
      // Atualizar lista local imediatamente
      dispatch({ type: "DELETE_TAGS", payload: tagId });
    } catch (err) {
      toast.error("Erro ao excluir a tag. Tente novamente.", { 
        title: "Erro na Operação!" 
      });
      console.error("Erro ao excluir tag:", err);
    }
    setDeletingTag(null);
    setConfirmModalOpen(false);
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
      icon={<TagsIcon size={24} style={{ color: 'var(--color-accent)' }} />}
      breadcrumbs={[
        { label: "Dashboard", href: "/", icon: <BarChart3 size={16} /> },
        { label: "Tags", icon: <TagsIcon size={16} /> }
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

      <ModernModal
        open={tagModalOpen}
        onClose={handleCloseTagModal}
        title={selectedTag ? "Editar Tag" : "Nova Tag"}
        size="lg"
        showCloseButton={true}
        actions={[
          {
            type: 'cancel',
            label: 'Cancelar',
            onClick: handleCloseTagModal
          },
          {
            type: 'save',
            label: selectedTag ? 'Salvar' : 'Adicionar',
            onClick: () => {
              // Vamos trigger o submit do form
              const submitButton = document.querySelector('#tag-form-submit');
              if (submitButton) submitButton.click();
            }
          }
        ]}
      >
        <TagForm
          tagId={selectedTag && selectedTag.id}
          kanban={0}
          onSave={(tag) => {
            // Atualizar lista local após salvar
            dispatch({ type: "UPDATE_TAGS", payload: tag });
            handleCloseTagModal();
          }}
          onCancel={handleCloseTagModal}
          hideButtons={true}
        />
      </ModernModal>

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
            <SearchInput
              placeholder={i18n.t("contacts.searchPlaceholder")}
              value={searchParam}
              onChange={handleSearch}
              onSearch={(searchValue) => {
                setSearchParam(searchValue.toLowerCase());
                setPageNumber(1);
                dispatch({ type: "RESET" });
              }}
              size="medium"
              fullWidth={false}
              sx={{
                flex: 1,
                maxWidth: "550px",
                minWidth: "350px",
              }}
            />

            <GradientButton
              onClick={handleOpenTagModal}
              icon={<PlusCircle size={20} />}
              variant="primary"
              size="medium"
            >
              {i18n.t("tags.buttons.add")}
            </GradientButton>
          </Box>

          {/* Seção da Tabela */}
          <BaseTable
              records={tags}
              loading={loading}
              noRecordsTitle="Nenhuma tag encontrada"
              noRecordsText="Crie sua primeira tag ou ajuste os filtros de busca"
              noRecordsIcon={<TagsIcon size={48} />}
              showPagination={false}
              minHeight={700}
              enableSorting={true}
              enableViewToggle={true}
              defaultView="table"
              initialSortBy="id"
              initialSortOrder="asc"
              renderCard={(tag, index) => (
                <Card sx={{ 
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 3,
                  width: '100%',
                  height: 280,
                  minHeight: 280,
                  maxHeight: 280,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: `
                    linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%),
                    var(--bg-primary)
                  `,
                  '&:hover': {
                    borderColor: tag.color || 'var(--color-accent)',
                    boxShadow: `
                      0 10px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04),
                      0 0 0 1px ${tag.color || 'var(--color-accent)'}33
                    `,
                    '&::before': {
                      opacity: 1,
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${tag.color || 'var(--color-accent)'}, ${tag.color || 'var(--color-accent)'}CC)`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    borderRadius: '12px 12px 0 0',
                  }
                }}>
                  <CardContent sx={{ 
                    p: 3, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative'
                  }}>
                    {/* Header com ID */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      mb: 2
                    }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          opacity: 0.6
                        }}
                      >
                        #{tag.id}
                      </Typography>
                      <Box sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: tag.color || 'var(--color-accent)',
                        boxShadow: `0 0 0 3px ${tag.color || 'var(--color-accent)'}22`
                      }} />
                    </Box>

                    {/* Nome da Tag */}
                    <Box sx={{ flex: 1, mb: 2 }}>
                      <StatusBadge
                        label={tag.name}
                        color={tag.color}
                        variant="filled"
                        size="medium"
                        sx={{ 
                          fontSize: '1rem',
                          fontWeight: 600,
                          px: 2,
                          py: 1
                        }}
                      />
                    </Box>

                    {/* Contatos */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoreHorizontal size={16} style={{ color: 'var(--text-secondary)' }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}
                        >
                          {tag.contacts?.length || 0} contatos
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Ações */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: 1.5, 
                      mt: 'auto',
                      pt: 2.5,
                      borderTop: '1px solid var(--border-primary)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '40px',
                        height: '1px',
                        background: tag.color || 'var(--color-accent)',
                        opacity: 0.3
                      }
                    }}>
                      <ActionButton
                        onClick={() => handleShowContacts(tag.contacts, tag)}
                        disabled={!tag.contacts?.length}
                        icon={MoreHorizontal}
                        tooltip="Ver contatos"
                        color="var(--text-secondary)"
                        hoverColor={tag.color || 'var(--color-accent)'}
                      />
                      <ActionButton
                        onClick={() => handleEditTag(tag)}
                        icon={Edit3}
                        tooltip="Editar tag"
                        color={tag.color || 'var(--color-accent)'}
                        hoverColor={tag.color || 'var(--color-accent)'}
                      />
                      <ActionButton
                        onClick={() => {
                          setConfirmModalOpen(true);
                          setDeletingTag(tag);
                        }}
                        icon={Trash2}
                        tooltip="Excluir tag"
                        color="#E57373"
                        hoverColor="#d32f2f"
                      />
                    </Box>
                    
                    {/* Elemento decorativo */}
                    <Box sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: tag.color || 'var(--color-accent)',
                      opacity: 0.05,
                      pointerEvents: 'none'
                    }} />
                  </CardContent>
                </Card>
              )}
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
                      color: 'var(--text-gray-medium)', 
                      fontWeight: 500,
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
                  <StatusBadge
                    label={name}
                    color={color}
                    variant="filled"
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
                    <ActionButton
                      onClick={() => handleShowContacts(contacts, tag)}
                      disabled={!contacts?.length}
                      icon={MoreHorizontal}
                      tooltip="Ver contatos"
                      color="var(--text-secondary)"
                      hoverColor="var(--color-accent)"
                    />
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
                  <ActionGroup>
                    <ActionButton
                      onClick={() => handleEditTag(tag)}
                      icon={Edit3}
                      tooltip="Editar tag"
                      color="var(--color-accent)"
                      hoverColor="var(--color-accent)"
                    />

                    <ActionButton
                      onClick={() => {
                        setConfirmModalOpen(true);
                        setDeletingTag(tag);
                      }}
                      icon={Trash2}
                      tooltip="Excluir tag"
                      color="#E57373"
                      hoverColor="#d32f2f"
                    />
                  </ActionGroup>
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