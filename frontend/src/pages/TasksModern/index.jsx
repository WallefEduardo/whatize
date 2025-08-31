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

const TasksModern = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.down('xl'));

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mock data
  useEffect(() => {
    const mockTasks = [
      {
        id: 1,
        title: 'Implementar autenticação',
        status: 'todo',
        priority: 'high',
        assign: [
          { id: 1, name: 'João Silva', image: { src: '/avatar1.jpg' } },
          { id: 2, name: 'Maria Santos', image: { src: '/avatar2.jpg' } }
        ],
        date: '2024-01-15',
        image: { src: '/task1.jpg' },
        description: 'Implementar sistema completo de autenticação com JWT',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 2,
        title: 'Criar dashboard de relatórios',
        status: 'inprogress',
        priority: 'medium',
        assign: [
          { id: 3, name: 'Carlos Oliveira', image: { src: '/avatar3.jpg' } }
        ],
        date: '2024-01-20',
        image: { src: '/task2.jpg' },
        description: 'Desenvolver dashboard interativo com gráficos',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-05')
      },
      {
        id: 3,
        title: 'Otimizar performance do chat',
        status: 'completed',
        priority: 'low',
        assign: [
          { id: 4, name: 'Ana Costa', image: { src: '/avatar4.jpg' } }
        ],
        date: '2024-01-10',
        image: { src: '/task3.jpg' },
        description: 'Melhorar velocidade de carregamento das mensagens',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-08')
      },
      {
        id: 4,
        title: 'Configurar CI/CD Pipeline',
        status: 'todo',
        priority: 'high',
        assign: [
          { id: 5, name: 'Roberto Silva', image: { src: '/avatar5.jpg' } },
          { id: 6, name: 'Fernanda Lima', image: { src: '/avatar6.jpg' } }
        ],
        date: '2024-01-25',
        image: { src: '/task4.jpg' },
        description: 'Configurar pipeline de integração e deploy contínuo',
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04')
      },
      {
        id: 5,
        title: 'Revisar documentação da API',
        status: 'inprogress',
        priority: 'medium',
        assign: [
          { id: 7, name: 'Patricia Santos', image: { src: '/avatar7.jpg' } }
        ],
        date: '2024-01-18',
        image: { src: '/task5.jpg' },
        description: 'Atualizar e revisar toda documentação da API',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-06')
      }
    ];

    setTasks(mockTasks);
    setFilteredTasks(mockTasks);
  }, []);

  // Filtrar tarefas baseado na busca
  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
    setPageNumber(1);
  }, [tasks, searchTerm]);

  // Definir colunas da tabela
  const columns = [
    {
      accessor: 'title',
      title: 'Nome da Tarefa',
      sortable: true,
      render: (record) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {record.title}
        </Typography>
      )
    },
    {
      accessor: 'status',
      title: 'Status',
      sortable: true,
      textAlignment: 'center',
      render: (record) => {
        const statusConfig = {
          todo: { color: '#ff9800', bg: 'rgba(255, 152, 0, 0.1)', label: 'A Fazer' },
          inprogress: { color: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)', label: 'Em Andamento' },
          completed: { color: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)', label: 'Concluído' }
        };
        const config = statusConfig[record.status] || statusConfig.todo;
        
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: config.color,
              backgroundColor: config.bg,
              textTransform: 'capitalize'
            }}
          >
            {config.label}
          </Box>
        );
      }
    },
    {
      accessor: 'assign',
      title: 'Atribuído',
      render: (record) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {record.assign && record.assign.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {record.assign.slice(0, 3).map((user, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '2px solid white',
                    marginLeft: idx > 0 ? '-8px' : 0
                  }}
                  title={user.name}
                >
                  {user.name.charAt(0)}
                </Box>
              ))}
              {record.assign.length > 3 && (
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '2px solid white',
                    marginLeft: '-8px'
                  }}
                >
                  +{record.assign.length - 3}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )
    },
    {
      accessor: 'priority',
      title: 'Prioridade',
      sortable: true,
      textAlignment: 'center',
      render: (record) => {
        const priorityConfig = {
          high: { color: '#f44336', bg: 'rgba(244, 67, 54, 0.1)', label: 'Alta' },
          medium: { color: '#ff9800', bg: 'rgba(255, 152, 0, 0.1)', label: 'Média' },
          low: { color: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)', label: 'Baixa' }
        };
        const config = priorityConfig[record.priority] || priorityConfig.medium;
        
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.3,
              borderRadius: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: config.color,
              backgroundColor: config.bg,
              textTransform: 'capitalize'
            }}
          >
            {config.label}
          </Box>
        );
      }
    },
    {
      accessor: 'date',
      title: 'Data Limite',
      sortable: true,
      render: (record) => (
        <Typography variant="body2" sx={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {record.date ? new Date(record.date).toLocaleDateString('pt-BR') : 'N/A'}
        </Typography>
      )
    },
    {
      accessor: 'actions',
      title: 'Ações',
      textAlignment: 'center',
      render: (record) => (
        <ActionGroup>
          <ActionButton
            icon={Edit3}
            tooltip="Editar tarefa"
            onClick={() => handleEditTask(record)}
            color="var(--color-accent)"
            hoverColor="var(--color-accent)"
            size={16}
          />
          <ActionButton
            icon={Trash2}
            tooltip="Excluir tarefa"
            onClick={() => handleDeleteTask(record.id)}
            color="#dc2626"
            hoverColor="#b91c1c"
            size={16}
          />
        </ActionGroup>
      )
    }
  ];

  // Handlers
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleCreateTask = () => {
    setOpenCreateModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setOpenEditModal(true);
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const handleSaveTask = (taskData) => {
    if (selectedTask) {
      // Editar tarefa existente
      setTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { ...task, ...taskData, updatedAt: new Date() }
          : task
      ));
    } else {
      // Criar nova tarefa
      const newTask = {
        ...taskData,
        id: Date.now(),
        assign: taskData.assignedTo ? taskData.assignedTo.map((name, idx) => ({
          id: Date.now() + idx,
          name: name,
          image: { src: `/avatar${idx + 1}.jpg` }
        })) : [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const appHeight = {
    height: 'calc(100vh - 140px)',
    display: 'flex',
    gap: theme.spacing(3),
    position: 'relative',
    overflow: 'hidden'
  };

  const breadcrumbs = [
    { href: "/", label: "Dashboard" },
    { label: "Tarefas" }
  ];

  return (
    <PageLayout
      title="Tarefas"
      icon={<CheckSquare size={24} />}
      breadcrumbs={breadcrumbs}
    >
      {/* Main Content */}
      <Box sx={appHeight}>
        {/* Mobile Overlay */}
        {isDesktop && showSidebar && (
          <Box
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              position: 'absolute',
              width: '100%',
              height: '100%',
              inset: 0,
              zIndex: 99,
              borderRadius: 1
            }}
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <Box
          sx={{
            transition: 'all 0.15s ease',
            flexShrink: 0,
            ...(isDesktop ? {
              position: 'absolute',
              height: '100%',
              top: 0,
              width: { xs: 200, md: 260 },
              zIndex: 999,
              left: showSidebar ? 0 : '-100%'
            } : {
              flexShrink: 0,
              minWidth: 260
            })
          }}
        >
          <Card sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CardHeader 
              sx={{ 
                position: 'sticky', 
                top: 0, 
                mb: 0, 
                bgcolor: 'background.paper', 
                zIndex: 50,
                p: 2
              }}
              title={
                <GradientButton
                  onClick={handleCreateTask}
                  icon={<Plus size={18} />}
                  sx={{ width: '100%' }}
                >
                  + Adicionar Tarefa
                </GradientButton>
              }
            />
            <CardContent sx={{ flex: 1, p: { xs: 1, md: 3 }, overflow: 'auto' }}>
              <TaskSidebar contacts={[]} />
            </CardContent>
          </Card>
        </Box>

        {/* Main Table */}
        <Card sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Search Header */}
          <Box sx={{ 
            p: { xs: 2, sm: 3 }, 
            display: 'flex', 
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
            justifyContent: 'flex-end'
          }}>
            <Box sx={{ width: { xs: '100%', md: 300 } }}>
              <SearchInput
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={handleSearch}
                size="medium"
                fullWidth={false}
              />
            </Box>
          </Box>

          {/* Table - ocupa toda altura disponível */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <BaseTable
              records={filteredTasks}
              columns={columns}
              loading={loading}
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalRecords={filteredTasks.length}
              onPageChange={setPageNumber}
              onPageSizeChange={setPageSize}
              noRecordsTitle="Nenhuma tarefa encontrada"
              noRecordsText="Crie sua primeira tarefa ou ajuste a busca"
              noRecordsIcon={<CheckSquare size={48} />}
              initialSortBy="date"
              initialSortOrder="asc"
              minHeight="calc(100vh - 300px)"
              enableViewToggle={false}
              showPagination={false}
            />
          </Box>
          
          {/* Custom Pagination */}
          <CustomPagination
            currentPage={pageNumber}
            totalPages={Math.ceil(filteredTasks.length / pageSize)}
            totalRecords={filteredTasks.length}
            recordsPerPage={pageSize}
            onPageChange={setPageNumber}
            selectedRows={0}
          />
        </Card>
      </Box>

      {/* Modals */}
      <ModernModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Criar Tarefa"
        size="lg"
      >
        <TaskForm
          onSave={(data) => {
            handleSaveTask(data);
            setOpenCreateModal(false);
          }}
          onCancel={() => setOpenCreateModal(false)}
        />
      </ModernModal>

      <ModernModal
        open={openEditModal}
        onClose={() => {
          setOpenEditModal(false);
          setSelectedTask(null);
        }}
        title="Editar Tarefa"
        size="lg"
      >
        <TaskForm
          task={selectedTask}
          onSave={(data) => {
            handleSaveTask(data);
            setOpenEditModal(false);
            setSelectedTask(null);
          }}
          onCancel={() => {
            setOpenEditModal(false);
            setSelectedTask(null);
          }}
        />
      </ModernModal>
    </PageLayout>
  );
};

export default TasksModern;