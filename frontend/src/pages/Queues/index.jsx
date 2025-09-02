import React, { useEffect, useReducer, useState, useContext } from "react";
import { toast } from "../../components/ui/ToastProvider";
import {
  Box,
  Card,
  CardContent,
  Typography
} from "@mui/material";

import {
  Edit3,
  Trash2,
  PlusCircle,
  Settings,
  BarChart3,
  Users,
  Headphones,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Star,
  Heart,
  Shield,
  Zap,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  UserCheck,
  UserPlus
} from "lucide-react";

// Componentes modernos
import PageLayout from "../../components/PageLayout";
import BaseTable, { ActionButton, ActionGroup } from "../../components/BaseTable";
import SearchInput from "../../components/SearchInput";
import GradientButton from "../../components/GradientButton";
import QueueForm from "../../components/QueueForm";
import { i18n } from "../../translate/i18n";
import toastError, { toastSuccess } from "../../errors/toastError";
import api from "../../services/api";
import ConfirmationModal from "../../components/ConfirmationModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import ForbiddenPage from "../../components/ForbiddenPage";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../components/ui/Dialog";
import StatusBadge from "../../components/StatusBadge";


const reducer = (state, action) => {
  if (action.type === "LOAD_QUEUES") {
    const queues = action.payload;
    const newQueues = [];

    queues.forEach((queue) => {
      const queueIndex = state.findIndex((q) => q.id === queue.id);
      if (queueIndex !== -1) {
        state[queueIndex] = queue;
      } else {
        newQueues.push(queue);
      }
    });

    return [...state, ...newQueues];
  }

  if (action.type === "UPDATE_QUEUES") {
    const queue = action.payload;
    const queueIndex = state.findIndex((u) => u.id === queue.id);

    if (queueIndex !== -1) {
      state[queueIndex] = queue;
      return [...state];
    } else {
      return [queue, ...state];
    }
  }

  if (action.type === "DELETE_QUEUE") {
    const queueId = action.payload;
    const queueIndex = state.findIndex((q) => q.id === queueId);
    if (queueIndex !== -1) {
      state.splice(queueIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const Queues = () => {
  const [queues, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingQueue, setEditingQueue] = useState(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const { user, socket } = useContext(AuthContext);
  const companyId = user.companyId;

  // Mapeamento de ícones
  const getIconComponent = (iconName) => {
    const iconMap = {
      Users, Headphones, MessageCircle, Phone, Mail, Clock, Settings,
      Star, Heart, Shield, Zap, Target, Award, CheckCircle, 
      AlertCircle, Info, HelpCircle, UserCheck, UserPlus
    };
    return iconMap[iconName] || Users;
  };

  // Filtrar filas baseado na busca
  const filteredQueues = queues.filter(queue => 
    queue.name.toLowerCase().includes(searchParam.toLowerCase()) ||
    queue.greetingMessage?.toLowerCase().includes(searchParam.toLowerCase())
  );

  // Função para carregar as filas
  const fetchQueues = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/queue");
      dispatch({ type: "LOAD_QUEUES", payload: data });
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  useEffect(() => {
    const onQueueEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_QUEUES", payload: data.queue });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_QUEUE", payload: data.queueId });
      }
    };
    if (socket && socket.on && typeof socket.on === 'function') {

      socket.on(`company-${companyId}-queue`, onQueueEvent);

    }

    return () => {
      if (socket && socket.off && typeof socket.off === 'function') {

        socket.off(`company-${companyId}-queue`, onQueueEvent);

      }
    };
  }, [socket, companyId]);

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedQueue(null);
  };

  const handleDeleteQueue = async (queueId) => {
    try {
      await api.delete(`/queue/${queueId}`);
      toastSuccess("Fila excluída com sucesso!");
      await fetchQueues(); // Recarrega a lista após exclusão
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  const handleSearch = (event) => {
    const newSearchParam = event.target.value.toLowerCase();
    setSearchParam(newSearchParam);
  };

  const handleSearchSubmit = (searchValue) => {
    setSearchParam(searchValue.toLowerCase());
  };

  const handleNewQueue = () => {
    setEditingQueue(null);
    setShowForm(true);
  };

  const handleEditQueueForm = (queue) => {
    setEditingQueue(queue);
    setShowForm(true);
  };

  const handleBackToList = () => {
    setShowForm(false);
    setEditingQueue(null);
  };

  const handleSaveQueue = async (queueData) => {
    console.log('🏁 handleSaveQueue chamado com dados:', queueData);
    try {
      if (editingQueue) {
        console.log('📝 Editando fila:', editingQueue.id);
        await api.put(`/queue/${editingQueue.id}`, queueData);
        toastSuccess("Fila atualizada com sucesso!");
      } else {
        console.log('➕ Criando nova fila');
        await api.post("/queue", queueData);
        toastSuccess("Fila criada com sucesso!");
      }
      
      console.log('🔄 Redirecionando para lista e recarregando...');
      // Redirecionar para lista e recarregar dados
      setShowForm(false);
      setEditingQueue(null);
      await fetchQueues(); // Recarrega a lista de filas
      console.log('✅ Redirecionamento concluído!');
      
    } catch (err) {
      console.error('❌ Erro em handleSaveQueue:', err);
      toastError(err);
    }
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
  // Breadcrumbs dinâmicos baseados no estado
  const getBreadcrumbs = () => {
    const baseBreadcrumbs = [
      { label: "Dashboard", href: "/", icon: <BarChart3 size={16} /> },
      { label: "Filas", icon: <Settings size={16} /> }
    ];

    if (showForm) {
      baseBreadcrumbs.push({
        label: editingQueue ? "Edição" : "Cadastro",
        icon: editingQueue ? <Edit3 size={16} /> : <PlusCircle size={16} />
      });
    }

    return baseBreadcrumbs;
  };

  return (
    <PageLayout
      title={showForm ? (editingQueue ? "Editar Fila" : "Nova Fila") : "Gerenciar Filas"}
      icon={<Settings size={24} style={{ color: 'var(--color-accent)' }} />}
      breadcrumbs={getBreadcrumbs()}
    >
      {/* Modals */}
      <ConfirmationModal
        title={selectedQueue && `Excluir fila ${selectedQueue.name}?`}
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeleteQueue(selectedQueue.id)}
      >
        Tem certeza que deseja excluir esta fila? Esta ação não pode ser desfeita.
      </ConfirmationModal>

      {user.profile === "user" ? (
        <ForbiddenPage />
      ) : showForm ? (
        <QueueForm 
          onBack={handleBackToList}
          onSave={handleSaveQueue}
          initialData={editingQueue}
        />
      ) : (
        <>
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
                  placeholder="Buscar filas..."
                  value={searchParam}
                  onChange={handleSearch}
                  onSearch={handleSearchSubmit}
                  size="medium"
                  fullWidth={false}
                  sx={{
                    flex: 1,
                    maxWidth: "550px",
                    minWidth: "350px",
                  }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <GradientButton
                    onClick={handleNewQueue}
                    icon={<PlusCircle size={20} />}
                    variant="primary"
                    size="medium"
                  >
                    Nova Fila
                  </GradientButton>
                </Box>
              </Box>

              {/* Seção da Tabela */}
              <BaseTable
                records={filteredQueues}
                loading={loading}
                noRecordsTitle="Nenhuma fila encontrada"
                noRecordsText="Crie sua primeira fila ou ajuste os filtros de busca"
                noRecordsIcon={<Settings size={48} />}
                showPagination={false}
                minHeight={700}
                enableSorting={true}
                enableViewToggle={true}
                defaultView="table"
                initialSortBy="id"
                initialSortOrder="asc"
                renderCard={(queue, index) => (
                  <Card sx={{ 
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 3,
                    width: '100%',
                    height: 200,
                    minHeight: 200,
                    maxHeight: 200,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: `
                      linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%),
                      var(--bg-primary)
                    `,
                    '&:hover': {
                      borderColor: queue.color || 'var(--color-accent)',
                      boxShadow: `
                        0 10px 25px -5px rgba(0, 0, 0, 0.1),
                        0 10px 10px -5px rgba(0, 0, 0, 0.04),
                        0 0 0 1px ${queue.color || 'var(--color-accent)'}33
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
                      background: `linear-gradient(90deg, ${queue.color || 'var(--color-accent)'}, ${queue.color || 'var(--color-accent)'}CC)`,
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
                      {/* Header com ID e Ícone */}
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
                          #{queue.id}
                        </Typography>
                        <Box sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          backgroundColor: queue.color || 'var(--color-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: `0 2px 8px ${queue.color || 'var(--color-accent)'}44`
                        }}>
                          {(() => {
                            const IconComponent = getIconComponent(queue.icon);
                            return <IconComponent size={18} />;
                          })()}
                        </Box>
                      </Box>

                      {/* Nome da Fila */}
                      <Box sx={{ flex: 1, mb: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            mb: 1
                          }}
                        >
                          {queue.name}
                        </Typography>
                        
                        {/* Ordem */}
                        {queue.orderQueue && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'var(--text-secondary)',
                              fontSize: '0.875rem'
                            }}
                          >
                            Ordem: {queue.orderQueue}
                          </Typography>
                        )}
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
                          background: queue.color || 'var(--color-accent)',
                          opacity: 0.3
                        }
                      }}>
                        <ActionButton
                          onClick={() => handleEditQueueForm(queue)}
                          icon={Edit3}
                          tooltip="Editar fila"
                          color={queue.color || 'var(--color-accent)'}
                          hoverColor={queue.color || 'var(--color-accent)'}
                        />
                        <ActionButton
                          onClick={() => {
                            setConfirmModalOpen(true);
                            setSelectedQueue(queue);
                          }}
                          icon={Trash2}
                          tooltip="Excluir fila"
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
                        background: queue.color || 'var(--color-accent)',
                        opacity: 0.05,
                        pointerEvents: 'none'
                      }} />
                    </CardContent>
                  </Card>
                )}
                columns={[
                  { 
                    accessor: 'id', 
                    title: "ID",
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
                    title: "Nome",
                    width: '25%',
                    render: ({ name, icon, color }) => {
                      const IconComponent = getIconComponent(icon);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '6px',
                            backgroundColor: color || 'var(--color-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <IconComponent size={16} />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {name}
                          </Typography>
                        </Box>
                      );
                    }
                  },
                  { 
                    accessor: 'color', 
                    title: "Cor",
                    textAlignment: 'center',
                    width: '15%',
                    render: ({ color }) => (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <StatusBadge
                          label=""
                          color={color || '#ccc'}
                          variant="filled"
                          size="small"
                          sx={{
                            minWidth: '60px',
                            height: '20px',
                            backgroundColor: `${color || '#ccc'}BF` // 75% de opacidade
                          }}
                        />
                      </Box>
                    )
                  },
                  { 
                    accessor: 'actions', 
                    title: "Ações",
                    textAlignment: 'center',
                    width: 140,
                    sortable: false,
                    render: (queue) => (
                      <ActionGroup>
                        <ActionButton
                          onClick={() => handleEditQueueForm(queue)}
                          icon={Edit3}
                          tooltip="Editar fila"
                          color="var(--color-accent)"
                          hoverColor="var(--color-accent)"
                        />

                        <ActionButton
                          onClick={() => {
                            setConfirmModalOpen(true);
                            setSelectedQueue(queue);
                          }}
                          icon={Trash2}
                          tooltip="Excluir fila"
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
        </>
      )}
    </PageLayout>
  );
};

export default Queues;