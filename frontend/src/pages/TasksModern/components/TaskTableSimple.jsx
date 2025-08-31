import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Box,
  Avatar,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

const TaskTableSimple = ({ data = [], onEditTask, onDeleteTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const filteredData = data.filter((task) =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleEdit = () => {
    if (selectedTask && onEditTask) {
      onEditTask(selectedTask);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedTask && onDeleteTask) {
      onDeleteTask(selectedTask.id);
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: { color: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' },
      inprogress: { color: '#2196f3', backgroundColor: 'rgba(33, 150, 243, 0.1)' },
      completed: { color: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
    };
    return colors[status] || { color: '#757575', backgroundColor: 'rgba(117, 117, 117, 0.1)' };
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: { color: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' },
      medium: { color: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' },
      low: { color: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
    };
    return colors[priority] || { color: '#757575', backgroundColor: 'rgba(117, 117, 117, 0.1)' };
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: 'A Fazer',
      inprogress: 'Em Andamento',
      completed: 'Concluído'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa'
    };
    return labels[priority] || priority;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          placeholder="Buscar tarefas..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Tarefa</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Prioridade</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          fontSize: '12px',
                          bgcolor: 'primary.main' 
                        }}
                      >
                        {task.title?.charAt(0) || 'T'}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {task.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(task.status)}
                      size="small"
                      sx={{
                        ...getStatusColor(task.status),
                        fontWeight: 500,
                        minWidth: 80
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getPriorityLabel(task.priority)}
                      size="small"
                      sx={{
                        ...getPriorityColor(task.priority),
                        fontWeight: 500,
                        minWidth: 60
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {task.date || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, task)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Nenhuma tarefa encontrada
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Excluir
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskTableSimple;