import React, { useState } from 'react';
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
  MenuItem,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { i18n } from '../../../translate/i18n';

// Mock users data - replace with real data from your API
const users = [
  { id: 1, name: 'João Silva', avatar: '/avatar1.jpg' },
  { id: 2, name: 'Maria Santos', avatar: '/avatar2.jpg' },
  { id: 3, name: 'Carlos Oliveira', avatar: '/avatar3.jpg' },
  { id: 4, name: 'Ana Costa', avatar: '/avatar4.jpg' },
];

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

const CreateTaskSheet = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: [],
    status: 'todo',
    priority: 'medium',
    dueDate: null,
    description: ''
  });

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAssignedToChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: newValue
    }));
  };

  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      dueDate: newDate
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title,
      status: formData.status,
      priority: formData.priority,
      assign: formData.assignedTo.map(user => ({
        id: user.id,
        name: user.name,
        image: { src: user.avatar }
      })),
      date: formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : '',
      description: formData.description
    };

    onSave(taskData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      assignedTo: [],
      status: 'todo',
      priority: 'medium',
      dueDate: null,
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
          borderRadius: 2,
          minHeight: '60vh'
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
          {i18n.t('createTask.title') || 'Criar Tarefa'}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Task Title */}
          <TextField
            label={i18n.t('createTask.taskTitle') || 'Título da Tarefa'}
            placeholder={i18n.t('createTask.taskTitlePlaceholder') || 'Digite o título da tarefa'}
            value={formData.title}
            onChange={handleInputChange('title')}
            fullWidth
            variant="outlined"
            required
          />

          {/* Assigned To */}
          <Autocomplete
            multiple
            options={users}
            getOptionLabel={(option) => option.name}
            value={formData.assignedTo}
            onChange={handleAssignedToChange}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={i18n.t('createTask.assignedTo') || 'Atribuído para'}
                placeholder={i18n.t('createTask.selectUsers') || 'Selecionar usuários'}
              />
            )}
          />

          {/* Status */}
          <FormControl fullWidth>
            <InputLabel>{i18n.t('createTask.status') || 'Status'}</InputLabel>
            <Select
              value={formData.status}
              onChange={handleInputChange('status')}
              label={i18n.t('createTask.status') || 'Status'}
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
            <InputLabel>{i18n.t('createTask.priority') || 'Prioridade'}</InputLabel>
            <Select
              value={formData.priority}
              onChange={handleInputChange('priority')}
              label={i18n.t('createTask.priority') || 'Prioridade'}
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
            label={i18n.t('createTask.dueDate') || 'Data Limite'}
            type="date"
            value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateChange(e.target.value ? new Date(e.target.value) : null)}
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              endAdornment: (
                <CalendarIcon sx={{ color: 'text.disabled', mr: 1 }} />
              ),
            }}
          />

          {/* Description */}
          <TextField
            label={i18n.t('createTask.description') || 'Descrição'}
            placeholder={i18n.t('createTask.descriptionPlaceholder') || 'Digite uma descrição para a tarefa'}
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
          {i18n.t('createTask.cancel') || 'Cancelar'}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ flex: 1 }}
          disabled={!formData.title.trim()}
        >
          {i18n.t('createTask.create') || 'Criar Tarefa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskSheet;