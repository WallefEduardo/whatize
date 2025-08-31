import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';

const statuses = [
  { value: 'todo', label: 'A Fazer' },
  { value: 'inprogress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluído' },
];

const priorities = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
];

const EditTaskSimple = ({ open, onClose, onSave, task }) => {
  const [formData, setFormData] = useState({
    title: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    description: ''
  });

  // Update form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.date || '',
        description: task.description || ''
      });
    }
  }, [task]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title,
      status: formData.status,
      priority: formData.priority,
      date: formData.dueDate,
      description: formData.description,
      assign: task?.assign || [] // Keep existing assignments
    };

    onSave(taskData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      description: ''
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" fontWeight={600}>
          Editar Tarefa
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Task Title */}
          <TextField
            label="Título da Tarefa"
            placeholder="Digite o título da tarefa"
            value={formData.title}
            onChange={handleInputChange('title')}
            fullWidth
            variant="outlined"
            required
          />

          {/* Status */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={handleInputChange('status')}
              label="Status"
            >
              {statuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Priority */}
          <FormControl fullWidth>
            <InputLabel>Prioridade</InputLabel>
            <Select
              value={formData.priority}
              onChange={handleInputChange('priority')}
              label="Prioridade"
            >
              {priorities.map((priority) => (
                <MenuItem key={priority.value} value={priority.value}>
                  {priority.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Due Date */}
          <TextField
            label="Data Limite"
            type="date"
            value={formData.dueDate}
            onChange={handleInputChange('dueDate')}
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* Description */}
          <TextField
            label="Descrição"
            placeholder="Digite uma descrição para a tarefa"
            value={formData.description}
            onChange={handleInputChange('description')}
            multiline
            rows={4}
            fullWidth
            variant="outlined"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 2, 
        gap: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ flex: 1 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ flex: 1 }}
          disabled={!formData.title.trim()}
        >
          Salvar Alterações
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTaskSimple;