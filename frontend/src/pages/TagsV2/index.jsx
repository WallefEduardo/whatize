import React, { useState, useEffect, useContext, useCallback } from "react";
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
  Box,
  Container,
  CircularProgress
} from "@mui/material";

import {
  Search as SearchIcon,
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
  Add as AddIcon,
  LocalOffer as TagIcon,
} from "@mui/icons-material";

import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";

import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const TagsV2 = () => {
  console.log('🆕 [TAGSV2] Componente montando...');
  
  // Context - pegando tudo que precisamos
  const { user, socket, isAuth, loading: authLoading } = useContext(AuthContext);
  
  // Estados da página
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Função para buscar tags - useCallback para evitar recriações
  const fetchTags = useCallback(async () => {
    console.log('🔍 [TAGSV2] fetchTags chamado');
    
    // Validações antes de buscar
    if (!isAuth) {
      console.log('⚠️ [TAGSV2] Não autenticado, abortando fetchTags');
      return;
    }

    if (!user?.id || !user?.companyId) {
      console.log('⚠️ [TAGSV2] Dados do usuário incompletos', { userId: user?.id, companyId: user?.companyId });
      return;
    }

    setLoading(true);
    
    try {
      console.log('📡 [TAGSV2] Fazendo request para /tags/', { 
        searchParam, 
        userId: user.id,
        companyId: user.companyId 
      });
      
      const { data } = await api.get("/tags/", {
        params: { 
          searchParam, 
          pageNumber: 1, 
          kanban: 0 
        },
      });
      
      console.log('✅ [TAGSV2] Tags recebidas:', data.tags?.length || 0);
      setTags(data.tags || []);
      setHasLoaded(true);
    } catch (err) {
      console.error('❌ [TAGSV2] Erro ao carregar tags:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      // Se for 401, resetar estado de autenticação
      if (err.response?.status === 401) {
        console.log('🔒 [TAGSV2] Erro 401 detectado - problema de autenticação');
      }
      
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, [searchParam, isAuth, user]);

  // Effect principal - aguarda autenticação completa
  useEffect(() => {
    console.log('🔄 [TAGSV2] useEffect principal', {
      authLoading,
      isAuth,
      userId: user?.id,
      hasLoaded
    });

    // Se auth ainda está carregando, aguardar
    if (authLoading) {
      console.log('⏳ [TAGSV2] Aguardando autenticação...');
      return;
    }

    // Se não está autenticado após carregar, não fazer nada
    if (!authLoading && !isAuth) {
      console.log('🚫 [TAGSV2] Não autenticado após carregar');
      return;
    }

    // Se já carregou uma vez, não recarregar automaticamente
    if (hasLoaded && searchParam === "") {
      return;
    }

    // Tudo pronto, buscar tags
    if (isAuth && user?.id) {
      console.log('🚀 [TAGSV2] Condições atendidas, buscando tags');
      fetchTags();
    }
  }, [authLoading, isAuth, user, searchParam, fetchTags, hasLoaded]);

  // Effect para socket - separado para clareza
  useEffect(() => {
    if (!socket || !user?.companyId || !isAuth) {
      console.log('⚠️ [TAGSV2] Socket não está pronto', { 
        hasSocket: !!socket, 
        companyId: user?.companyId,
        isAuth 
      });
      return;
    }

    console.log('🔌 [TAGSV2] Configurando socket listener');
    
    const onCompanyTags = (data) => {
      console.log('📨 [TAGSV2] Evento socket recebido:', data.action);
      
      if (data.action === "create" || data.action === "update") {
        setTags(prevTags => {
          const index = prevTags.findIndex(t => t.id === data.tag.id);
          if (index !== -1) {
            const newTags = [...prevTags];
            newTags[index] = data.tag;
            return newTags;
          }
          return [data.tag, ...prevTags];
        });
      }

      if (data.action === "delete") {
        setTags(prevTags => prevTags.filter(t => t.id !== data.tagId));
      }
    };

    socket.on(`company${user.companyId}-tag`, onCompanyTags);

    return () => {
      console.log('🔌 [TAGSV2] Removendo socket listener');
      socket.off(`company${user.companyId}-tag`, onCompanyTags);
    };
  }, [socket, user?.companyId, isAuth]);

  // Handlers
  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(true);
  };

  const handleCloseTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(false);
  };

  const handleEditTag = (tag) => {
    setSelectedTag(tag);
    setTagModalOpen(true);
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await api.delete(`/tags/${tagId}`);
      toast.success(i18n.t("tags.toasts.deleted"));
      // Atualizar lista local
      setTags(prevTags => prevTags.filter(t => t.id !== tagId));
    } catch (err) {
      toastError(err);
    }
    setDeletingTag(null);
    setConfirmModalOpen(false);
  };

  // Renderização condicional para loading de auth
  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Carregando autenticação...</Typography>
        </Box>
      </Container>
    );
  }

  // Se não está autenticado após carregar
  if (!authLoading && !isAuth) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Você precisa estar autenticado para acessar esta página.</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TagIcon sx={{ mr: 2, color: 'var(--color-accent)' }} />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Tags V2 (Nova Estrutura)
        </Typography>
      </Box>

      {/* Modals */}
      <TagModal
        open={tagModalOpen}
        onClose={handleCloseTagModal}
        tagId={selectedTag?.id}
        kanban={0}
      />

      <ConfirmationModal
        title={deletingTag && `${i18n.t("tags.confirmationModal.deleteTitle")}`}
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteTag(deletingTag.id)}
      >
        {i18n.t("tags.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      {/* Main Card */}
      <Card elevation={2}>
        <CardContent>
          {/* Toolbar */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 3,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <TextField
              placeholder={i18n.t("contacts.searchPlaceholder")}
              value={searchParam}
              onChange={handleSearch}
              variant="outlined"
              size="small"
              sx={{ flex: 1, minWidth: 250, maxWidth: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenTagModal}
              sx={{
                backgroundColor: 'var(--color-accent)',
                '&:hover': {
                  backgroundColor: '#00e608',
                }
              }}
            >
              {i18n.t("tags.buttons.add")}
            </Button>

            <Button
              variant="outlined"
              onClick={fetchTags}
              disabled={loading}
            >
              Recarregar
            </Button>
          </Box>

          {/* Status Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Status: {loading ? 'Carregando...' : `${tags.length} tags encontradas`}
            </Typography>
            {user && (
              <Typography variant="caption" color="textSecondary">
                Usuário: {user.name} | Empresa: {user.companyId}
              </Typography>
            )}
          </Box>

          {/* Table */}
          <Paper variant="outlined">
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : tags.length === 0 ? (
              <Box textAlign="center" p={4}>
                <TagIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Nenhuma tag encontrada
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Crie sua primeira tag ou ajuste os filtros
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={80}>{i18n.t("tags.table.id")}</TableCell>
                    <TableCell>{i18n.t("tags.table.name")}</TableCell>
                    <TableCell width={150} align="center">Contatos</TableCell>
                    <TableCell width={120} align="center">{i18n.t("tags.table.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id} hover>
                      <TableCell>
                        <Typography variant="body2" color="primary">
                          #{tag.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tag.name}
                          size="small"
                          style={{ backgroundColor: tag.color, color: 'white' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {tag.contacts?.length || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEditTag(tag)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeletingTag(tag);
                            setConfirmModalOpen(true);
                          }}
                          color="error"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TagsV2;