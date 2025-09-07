import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { CheckSquare, Plus, Edit3, Trash2, Circle, Check, Flag, MoreVertical } from 'lucide-react';

// Componentes do sistema
import PageLayout from '../../components/PageLayout';
import BaseTable, { ActionButton, ActionGroup } from '../../components/BaseTable';
import SearchInput from '../../components/SearchInput';
import ModernModal from '../../components/ModernModal';
import GradientButton from '../../components/GradientButton';

// Componentes locais
import TaskSidebar from './components/TaskSidebar';
import TaskForm from './components/TaskForm';
import CustomPagination from './components/CustomPagination';
import { i18n } from "../../translate/i18n";

// API Services
import { 
  ListTasks, 
  CreateTask, 
  UpdateTask, 
  DeleteTask, 
  GetTaskStats,
  GetCompletedTasks,
  CompleteTask,
  RestoreTask 
} from '../../services/tasks';
import { toast } from 'react-toastify';

const TasksModern = () => {

  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  const [activeFilter, setActiveFilter] = useState('mytask');
  const [activePriority, setActivePriority] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estados para os menus dropdown
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [priorityMenuAnchor, setPriorityMenuAnchor] = useState(null);
  const [selectedTaskForMenu, setSelectedTaskForMenu] = useState(null);
  
  // Modal states
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  // Carregar tarefas (ativas ou concluídas)
  const fetchTasks = async () => {
    try {
      console.log('Buscando tarefas...', { searchTerm, pageNumber, pageSize, activeFilter, activePriority });
      setLoading(true);
      
      const params = {
        searchParam: searchTerm,
        pageNumber,
        limit: pageSize,
        priority: activePriority
      };
      
      let response;
      
      if (activeFilter === 'completed') {
        // Buscar tarefas concluídas
        response = await GetCompletedTasks(params);
        setCompletedTasks(response.tasks || []);
        setTasks([]); // Limpar tarefas ativas
      } else {
        // Buscar tarefas ativas
        params.filter = activeFilter;
        response = await ListTasks(params);
        setTasks(response.tasks || []);
        setCompletedTasks([]); // Limpar tarefas concluídas
      }
      
      console.log('Resposta da API:', response);
      console.log('Tasks array:', response.tasks);
      console.log('Tasks count:', response.tasks?.length);
      
      setTotalPages(response.totalPages || 0);
      setTotalTasks(response.count || 0);
      
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas
  const fetchStats = async () => {
    try {
      const response = await GetTaskStats();
      setStats(response.stats || {});
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [pageNumber, pageSize, activeFilter, activePriority]);

  useEffect(() => {
    fetchStats();
    // Carregar dados do usuário do localStorage ou contexto
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  // Debounce para busca
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setPageNumber(1);
      fetchTasks();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handlers para CRUD
  const handleCreateTask = async (taskData) => {
    try {
      await CreateTask(taskData);
      toast.success('Tarefa criada com sucesso!');
      fetchTasks();
      fetchStats(); // Atualizar estatísticas
      setOpenCreateModal(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await UpdateTask(selectedTask.id, taskData);
      toast.success('Tarefa atualizada com sucesso!');
      fetchTasks();
      fetchStats(); // Atualizar estatísticas
      setOpenEditModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await DeleteTask(taskId);
        toast.success('Tarefa excluída com sucesso!');
        fetchTasks();
        fetchStats(); // Atualizar estatísticas
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        toast.error('Erro ao excluir tarefa');
      }
    }
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setOpenEditModal(true);
  };

  // Handlers para filtros
  const handleFilterChange = (filterValue) => {
    setActiveFilter(filterValue);
    setPageNumber(1); // Reset para primeira página ao filtrar
  };

  const handlePriorityChange = (priorityValue) => {
    setActivePriority(activePriority === priorityValue ? null : priorityValue);
    setPageNumber(1); // Reset para primeira página ao filtrar
  };

  // Handlers para abrir menus
  const handleOpenStatusMenu = (event, task) => {
    setStatusMenuAnchor(event.currentTarget);
    setSelectedTaskForMenu(task);
  };

  const handleOpenPriorityMenu = (event, task) => {
    setPriorityMenuAnchor(event.currentTarget);
    setSelectedTaskForMenu(task);
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null);
    setSelectedTaskForMenu(null);
  };

  const handleClosePriorityMenu = () => {
    setPriorityMenuAnchor(null);
    setSelectedTaskForMenu(null);
  };

  // Handlers para mudança rápida de status/prioridade
  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      if (newStatus === 'completed') {
        // Usar novo serviço para concluir tarefa
        await CompleteTask(taskId);
        toast.success('Tarefa concluída com sucesso!');
      } else {
        // Atualizar status normalmente
        await UpdateTask(taskId, { status: newStatus });
        toast.success('Status atualizado com sucesso!');
      }
      fetchTasks();
      fetchStats(); // Atualizar estatísticas
      handleCloseStatusMenu();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleQuickPriorityChange = async (taskId, newPriority) => {
    try {
      await UpdateTask(taskId, { priority: newPriority });
      toast.success('Prioridade atualizada com sucesso!');
      fetchTasks();
      fetchStats(); // Atualizar estatísticas
      handleClosePriorityMenu();
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      toast.error('Erro ao atualizar prioridade');
    }
  };

  // Handler para restaurar tarefa concluída (Admin only)
  const handleRestoreTask = async (completedTaskId) => {
    try {
      await RestoreTask(completedTaskId);
      toast.success('Tarefa restaurada com sucesso!');
      fetchTasks();
      fetchStats(); // Atualizar estatísticas
    } catch (error) {
      console.error('Erro ao restaurar tarefa:', error);
      toast.error('Erro ao restaurar tarefa');
    }
  };

  // Verificar se é admin ou superadmin
  const isAdmin = currentUser?.profile === 'admin' || currentUser?.profile === 'superadmin';

  // Dados a serem exibidos (tarefas ativas ou concluídas)
  const displayTasks = activeFilter === 'completed' ? completedTasks : tasks;

  // Definir colunas da tabela
  const columns = [
    {
      accessor: 'title',
      title: 'Nome da Tarefa',
      sortable: true,
      render: (record) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle2" fontWeight="medium">
            {record.title}
          </Typography>
        </Box>
      )
    },
    {
      accessor: 'status',
      title: 'Status',
      render: (record) => {
        const getStatusColor = (status) => {
          switch (status) {
            case 'todo': return '#ff9800';
            case 'inprogress': return '#2196f3';
            case 'completed': return '#4caf50';
            default: return '#757575';
          }
        };

        const getStatusLabel = (status) => {
          switch (status) {
            case 'todo': return 'A Fazer';
            case 'inprogress': return 'Em Progresso';
            case 'completed': return 'Concluída';
            default: return status;
          }
        };

        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: getStatusColor(record.status) + '20',
              color: getStatusColor(record.status),
              fontWeight: 'medium',
              fontSize: '0.75rem'
            }}
          >
            {getStatusLabel(record.status)}
          </Box>
        );
      }
    },
    {
      accessor: 'priority',
      title: 'Prioridade',
      render: (record) => {
        const getPriorityColor = (priority) => {
          switch (priority) {
            case 'high': return '#f44336';
            case 'medium': return '#ff9800';
            case 'low': return '#4caf50';
            default: return '#757575';
          }
        };

        const getPriorityLabel = (priority) => {
          switch (priority) {
            case 'high': return 'Alta';
            case 'medium': return 'Média';
            case 'low': return 'Baixa';
            default: return priority;
          }
        };

        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: getPriorityColor(record.priority) + '20',
              color: getPriorityColor(record.priority),
              fontWeight: 'medium',
              fontSize: '0.75rem'
            }}
          >
            {getPriorityLabel(record.priority)}
          </Box>
        );
      }
    },
    {
      accessor: 'assignedTo',
      title: 'Responsável',
      render: (record) => (
        <Typography variant="body2">
          {record.assignedTo?.name || 'Não atribuído'}
        </Typography>
      )
    },
    {
      accessor: 'dueDate',
      title: 'Data de Vencimento',
      render: (record) => (
        <Typography variant="body2">
          {record.dueDate ? new Date(record.dueDate).toLocaleDateString('pt-BR') : '-'}
        </Typography>
      )
    },
    {
      accessor: 'actions',
      title: 'Ações',
      render: (record) => {
        // Se estiver visualizando tarefas concluídas
        if (activeFilter === 'completed') {
          return (
            <ActionGroup>
              {/* Botão para restaurar (apenas admin) */}
              {isAdmin && (
                <ActionButton
                  icon={Check}
                  onClick={() => handleRestoreTask(record.id)}
                  tooltip="Restaurar tarefa"
                  color="#4caf50"
                  hoverColor="#4caf50"
                />
              )}
            </ActionGroup>
          );
        }
        
        // Para tarefas ativas
        return (
          <ActionGroup>
            {/* Botão para alterar status */}
            <ActionButton
              icon={MoreVertical}
              onClick={(event) => handleOpenStatusMenu(event, record)}
              tooltip="Alterar status"
              color="#2196f3"
              hoverColor="#2196f3"
            />
            
            {/* Botão para alterar prioridade */}
            <ActionButton
              icon={Flag}
              onClick={(event) => handleOpenPriorityMenu(event, record)}
              tooltip="Alterar prioridade"
              color="#ff9800"
              hoverColor="#ff9800"
            />

            {/* Botão para editar */}
            <ActionButton
              icon={Edit3}
              onClick={() => handleEditTask(record)}
              tooltip="Editar tarefa"
              color="#4caf50"
              hoverColor="#4caf50"
            />
            
            {/* Botão para excluir */}
            <ActionButton
              icon={Trash2}
              onClick={() => handleDeleteTask(record.id)}
              tooltip="Excluir tarefa"
              color="#f44336"
              hoverColor="#f44336"
            />
          </ActionGroup>
        );
      }
    }
  ];

  const breadcrumbs = [
    { label: i18n.t("dashboard.breadcrumbs.root") },
    { label: "Tarefas", active: true }
  ];


  return (
    <PageLayout
      title="Tarefas"
      icon={<CheckSquare size={24} />}
      breadcrumbs={breadcrumbs}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header com busca e botão */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar tarefas..."
              style={{ width: 300 }}
            />
          </Box>
          <GradientButton
            startIcon={<Plus size={20} />}
            onClick={() => setOpenCreateModal(true)}
          >
            Nova Tarefa
          </GradientButton>
        </Box>

        {/* Container principal com sidebar e tabela */}
        <Box sx={{ display: 'flex', gap: 3, flex: 1 }}>
          {/* Sidebar */}
          <TaskSidebar 
            stats={stats}
            activeFilter={activeFilter}
            activePriority={activePriority}
            onFilterChange={handleFilterChange}
            onPriorityChange={handlePriorityChange}
          />

          {/* Tabela */}
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <BaseTable
              records={displayTasks}
              columns={columns}
              loading={loading}
              pagination={{
                page: pageNumber,
                limit: pageSize,
                total: totalTasks,
                onPageChange: setPageNumber,
                onLimitChange: setPageSize,
              }}
            />
          </Paper>
        </Box>
      </Box>

      {/* Modal de Criar Tarefa */}
      <ModernModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Nova Tarefa"
        maxWidth="md"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setOpenCreateModal(false)}
        />
      </ModernModal>

      {/* Modal de Editar Tarefa */}
      <ModernModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        title="Editar Tarefa"
        maxWidth="md"
      >
        <TaskForm
          initialData={selectedTask}
          onSubmit={handleUpdateTask}
          onCancel={() => setOpenEditModal(false)}
        />
      </ModernModal>

      {/* Menu de Status */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleCloseStatusMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 160,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }
        }}
      >
        <MenuItem onClick={() => handleQuickStatusChange(selectedTaskForMenu?.id, 'todo')}>
          <ListItemIcon>
            <Circle size={16} style={{ color: '#ff9800' }} />
          </ListItemIcon>
          <ListItemText primary="A Fazer" />
        </MenuItem>
        <MenuItem onClick={() => handleQuickStatusChange(selectedTaskForMenu?.id, 'inprogress')}>
          <ListItemIcon>
            <Circle size={16} style={{ color: '#2196f3' }} />
          </ListItemIcon>
          <ListItemText primary="Em Progresso" />
        </MenuItem>
        <MenuItem onClick={() => handleQuickStatusChange(selectedTaskForMenu?.id, 'completed')}>
          <ListItemIcon>
            <Check size={16} style={{ color: '#4caf50' }} />
          </ListItemIcon>
          <ListItemText primary="Concluída" />
        </MenuItem>
      </Menu>

      {/* Menu de Prioridade */}
      <Menu
        anchorEl={priorityMenuAnchor}
        open={Boolean(priorityMenuAnchor)}
        onClose={handleClosePriorityMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 160,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }
        }}
      >
        <MenuItem onClick={() => handleQuickPriorityChange(selectedTaskForMenu?.id, 'low')}>
          <ListItemIcon>
            <Flag size={16} style={{ color: '#4caf50' }} />
          </ListItemIcon>
          <ListItemText primary="Baixa" />
        </MenuItem>
        <MenuItem onClick={() => handleQuickPriorityChange(selectedTaskForMenu?.id, 'medium')}>
          <ListItemIcon>
            <Flag size={16} style={{ color: '#ff9800' }} />
          </ListItemIcon>
          <ListItemText primary="Média" />
        </MenuItem>
        <MenuItem onClick={() => handleQuickPriorityChange(selectedTaskForMenu?.id, 'high')}>
          <ListItemIcon>
            <Flag size={16} style={{ color: '#f44336' }} />
          </ListItemIcon>
          <ListItemText primary="Alta" />
        </MenuItem>
      </Menu>
    </PageLayout>
  );
};

export default TasksModern;