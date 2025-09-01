import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { CheckSquare, Plus, Edit3, Trash2 } from 'lucide-react';

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
import { ListTasks, CreateTask, UpdateTask, DeleteTask, GetTaskStats } from '../../services/tasks';
import { toast } from 'react-toastify';

const TasksModern = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.down('xl'));

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  
  // Modal states
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  // Carregar tarefas
  const fetchTasks = async () => {
    try {
      console.log('Buscando tarefas...', { searchTerm, pageNumber, pageSize });
      setLoading(true);
      const params = {
        searchParam: searchTerm,
        pageNumber,
        limit: pageSize
      };
      
      const response = await ListTasks(params);
      console.log('Resposta da API:', response);
      console.log('Tasks array:', response.tasks);
      console.log('Tasks count:', response.tasks?.length);
      console.log('Primeira tarefa completa:', JSON.stringify(response.tasks?.[0], null, 2));
      setTasks(response.tasks || []);
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
  }, [pageNumber, pageSize]);

  useEffect(() => {
    fetchStats();
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
      render: (record) => (
        <ActionGroup>
          <ActionButton
            icon={<Edit3 size={16} />}
            onClick={() => handleEditTask(record)}
            color="primary"
          />
          <ActionButton
            icon={<Trash2 size={16} />}
            onClick={() => handleDeleteTask(record.id)}
            color="error"
          />
        </ActionGroup>
      )
    }
  ];

  const breadcrumbs = [
    { label: i18n.t("dashboard.breadcrumbs.root") },
    { label: "Tarefas", active: true }
  ];

  // Debug do estado do modal
  console.log('openCreateModal state:', openCreateModal);
  console.log('Tasks state for table:', tasks, 'length:', tasks.length);

  return (
    <PageLayout
      title="Tarefas"
      icon={<CheckSquare size={24} />}
      breadcrumbs={breadcrumbs}
    >
      <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
        {/* Sidebar */}
        <TaskSidebar 
          show={showSidebar} 
          onClose={() => setShowSidebar(false)}
          stats={stats}
        />

        {/* Conteúdo Principal */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          ml: isDesktop ? 0 : showSidebar ? '250px' : 0,
          transition: 'margin-left 0.3s ease'
        }}>
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
              onClick={() => {
                console.log('Botão clicado, abrindo modal...');
                setOpenCreateModal(true);
              }}
            >
              Nova Tarefa
            </GradientButton>
          </Box>

          {/* Tabela */}
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {console.log('Passando para BaseTable - data:', tasks, 'columns:', columns.length)}
            
            {/* Debug simples - mostrar dados brutos */}
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
              <Typography variant="h6">DEBUG - Dados recebidos:</Typography>
              <Typography variant="body2">Total de tarefas: {tasks.length}</Typography>
              {tasks.map(task => (
                <Box key={task.id} sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5' }}>
                  <Typography><strong>ID:</strong> {task.id}</Typography>
                  <Typography><strong>Título:</strong> {task.title}</Typography>
                  <Typography><strong>Status:</strong> {task.status}</Typography>
                  <Typography><strong>Responsável:</strong> {task.assignedTo?.name}</Typography>
                </Box>
              ))}
            </Box>
            
            <BaseTable
              data={tasks}
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
        onClose={() => {
          console.log('Modal fechando...');
          setOpenCreateModal(false);
        }}
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
    </PageLayout>
  );
};

export default TasksModern;