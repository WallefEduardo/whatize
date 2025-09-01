import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, FormLabel } from '@mui/material';
import { Save, X } from 'lucide-react';
import GradientButton from '../../../components/GradientButton';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { DatePicker } from '../../../components/ui/DatePicker';
import useUsers from '../../../hooks/useUsers';

const TaskForm = ({ initialData, onSubmit, onCancel }) => {
  const { users, loading: usersLoading } = useUsers();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedToId: '',
    dueDate: null
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
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'todo',
        priority: initialData.priority || 'medium',
        assignedToId: initialData.assignedToId || initialData.assignedTo?.id || '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate) : null
      });
    }
  }, [initialData]);

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
    const value = event.target.value;
    
    setFormData(prev => ({
      ...prev,
      assignedToId: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    console.log('TaskForm handleSubmit chamado!');
    e.preventDefault();
    
    if (validateForm()) {
      console.log('TaskForm validation passed, formData:', formData);
      // Preparar dados para envio
      const submitData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        status: formData.status,
        priority: formData.priority,
        assignedToId: formData.assignedToId || null,
        dueDate: formData.dueDate || null
      };
      
      console.log('TaskForm submitData:', submitData);
      onSubmit(submitData);
    } else {
      console.log('TaskForm validation failed, errors:', errors);
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
              value={formData.assignedToId}
              onChange={handleAssignedToChange}
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
            variant="primary"
            icon={<Save size={18} />}
            onClick={(e) => {
              console.log('Botão Criar Tarefa clicado diretamente!');
              e.preventDefault();
              handleSubmit(e);
            }}
          >
            {initialData ? 'Atualizar Tarefa' : 'Criar Tarefa'}
          </GradientButton>
        </Box>
      </Box>
    </Box>
  );
};

export default TaskForm;