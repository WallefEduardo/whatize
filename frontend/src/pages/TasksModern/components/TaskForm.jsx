import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, FormLabel } from '@mui/material';
import { Save, X } from 'lucide-react';
import GradientButton from '../../../components/GradientButton';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { DatePicker } from '../../../components/ui/DatePicker';
import useUsers from '../../../hooks/useUsers';

const TaskForm = ({ task, onSave, onCancel }) => {
  const { users, loading: usersLoading } = useUsers();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: [],
    dueDate: ''
  });

  const [errors, setErrors] = useState({});

  // Opções dos selects
  const statusOptions = [
    { value: 'todo', label: 'A Fazer' },
    { value: 'inprogress', label: 'Em Andamento' },
    { value: 'completed', label: 'Concluído' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Média' },
    { value: 'low', label: 'Baixa' }
  ];

  // Opções de usuários vindos da API
  const userOptions = users || [];

  // Carregar dados da tarefa se estivermos editando
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo || [],
        dueDate: task.dueDate || ''
      });
    }
  }, [task]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleAssignedToChange = (event) => {
    const value = typeof event.target.value === 'string' 
      ? event.target.value.split(',') 
      : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      assignedTo: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Primeira linha: Nome da Tarefa (maior) + Data Limite (maior) */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 2 }}>
            <FormLabel
              sx={{ 
                color: 'var(--text-secondary)', 
                fontWeight: 500,
                fontSize: '14px',
                display: 'block',
                mb: 1
              }}
            >
              Nome da Tarefa *
            </FormLabel>
            <Input
              value={formData.title}
              onChange={handleInputChange('title')}
              placeholder="Digite o nome da tarefa..."
              removeWrapper
            />
            {errors.title && (
              <Typography 
                variant="caption" 
                sx={{ color: '#ef4444', fontSize: '12px', mt: 0.5, display: 'block' }}
              >
                {errors.title}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ flex: 1.5, minWidth: '320px' }}>
            <FormLabel
              sx={{ 
                color: 'var(--text-secondary)', 
                fontWeight: 500,
                fontSize: '14px',
                display: 'block',
                mb: 1
              }}
            >
              Data Limite
            </FormLabel>
            <DatePicker
              value={formData.dueDate}
              onChange={(date) => {
                setFormData(prev => ({ ...prev, dueDate: date }));
              }}
            />
          </Box>
        </Box>

        {/* Segunda linha: Status + Prioridade + Responsáveis (responsáveis maior) */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <FormLabel
              sx={{ 
                color: 'var(--text-secondary)', 
                fontWeight: 500,
                fontSize: '14px',
                display: 'block',
                mb: 1
              }}
            >
              Status
            </FormLabel>
            <Select
              value={formData.status}
              onChange={handleInputChange('status')}
              removeWrapper
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <FormLabel
              sx={{ 
                color: 'var(--text-secondary)', 
                fontWeight: 500,
                fontSize: '14px',
                display: 'block',
                mb: 1
              }}
            >
              Prioridade
            </FormLabel>
            <Select
              value={formData.priority}
              onChange={handleInputChange('priority')}
              removeWrapper
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Box>
          
          <Box sx={{ flex: 1.5 }}>
            <FormLabel
              sx={{ 
                color: 'var(--text-secondary)', 
                fontWeight: 500,
                fontSize: '14px',
                display: 'block',
                mb: 1
              }}
            >
              Responsáveis
            </FormLabel>
            <Select
              value={formData.assignedTo[0] || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value ? [e.target.value] : [] }))}
              removeWrapper
              disabled={usersLoading}
            >
              <option value="">
                {usersLoading ? "Carregando usuários..." : "Selecione um responsável"}
              </option>
              {userOptions.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </Box>
        </Box>

        {/* Terceira linha: Descrição (largura total) */}
        <Box>
          <FormLabel
            sx={{ 
              color: 'var(--text-secondary)', 
              fontWeight: 500,
              fontSize: '14px',
              display: 'block',
              mb: 1
            }}
          >
            Descrição *
          </FormLabel>
          <Textarea
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder="Descreva detalhadamente a tarefa..."
            rows={4}
            removeWrapper
          />
          {errors.description && (
            <Typography 
              variant="caption" 
              sx={{ color: '#ef4444', fontSize: '12px', mt: 0.5, display: 'block' }}
            >
              {errors.description}
            </Typography>
          )}
        </Box>

        {/* Botões no canto direito */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'flex-end',
            pt: 2,
            borderTop: '1px solid var(--border-primary)',
            mt: 1
          }}
        >
          <GradientButton
            variant="secondary"
            onClick={onCancel}
            icon={<X size={18} />}
            sx={{
              background: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
              }
            }}
          >
            Cancelar
          </GradientButton>
          
          <GradientButton
            type="submit"
            variant="primary"
            icon={<Save size={18} />}
          >
            {task ? 'Atualizar Tarefa' : 'Criar Tarefa'}
          </GradientButton>
        </Box>
      </Box>
    </Box>
  );
};

export default TaskForm;