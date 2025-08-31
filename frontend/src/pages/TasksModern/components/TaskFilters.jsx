import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Circle } from 'lucide-react';

const TaskFilters = ({ 
  statusFilter, 
  onStatusFilterChange, 
  priorityFilter, 
  onPriorityFilterChange 
}) => {
  const statusOptions = [
    { value: 'all', label: 'Todos', color: '#6b7280' },
    { value: 'todo', label: 'A Fazer', color: '#ff9800' },
    { value: 'inprogress', label: 'Em Andamento', color: '#2196f3' },
    { value: 'completed', label: 'Concluído', color: '#4caf50' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'Todas', color: '#6b7280' },
    { value: 'high', label: 'Alta', color: '#f44336' },
    { value: 'medium', label: 'Média', color: '#ff9800' },
    { value: 'low', label: 'Baixa', color: '#4caf50' }
  ];

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
        p: 3,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Filtro por Status */}
      <Box sx={{ flex: 1 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.5px'
          }}
        >
          Status
        </Typography>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(e, newValue) => newValue && onStatusFilterChange(newValue)}
          size="small"
          sx={{
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid var(--border-primary)',
              borderRadius: '6px !important',
              margin: 0,
              '&:not(:first-of-type)': {
                borderLeft: '1px solid var(--border-primary)',
              },
            },
            '& .MuiToggleButton-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-secondary)',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'var(--hover-bg-light)',
                color: 'var(--text-primary)',
              },
              '&.Mui-selected': {
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'var(--color-accent)',
                },
              },
            },
          }}
        >
          {statusOptions.map(option => (
            <ToggleButton key={option.value} value={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Circle 
                  size={8} 
                  fill={option.color}
                  color={option.color}
                />
                {option.label}
              </Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Filtro por Prioridade */}
      <Box sx={{ flex: 1 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.5px'
          }}
        >
          Prioridade
        </Typography>
        <ToggleButtonGroup
          value={priorityFilter}
          exclusive
          onChange={(e, newValue) => newValue && onPriorityFilterChange(newValue)}
          size="small"
          sx={{
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid var(--border-primary)',
              borderRadius: '6px !important',
              margin: 0,
              '&:not(:first-of-type)': {
                borderLeft: '1px solid var(--border-primary)',
              },
            },
            '& .MuiToggleButton-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-secondary)',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'var(--hover-bg-light)',
                color: 'var(--text-primary)',
              },
              '&.Mui-selected': {
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'var(--color-accent)',
                },
              },
            },
          }}
        >
          {priorityOptions.map(option => (
            <ToggleButton key={option.value} value={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Circle 
                  size={8} 
                  fill={option.color}
                  color={option.color}
                />
                {option.label}
              </Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};

export default TaskFilters;