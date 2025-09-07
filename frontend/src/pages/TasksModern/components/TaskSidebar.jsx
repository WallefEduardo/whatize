import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Star as StarIcon,
  Check as CheckIcon,
  Delete as TrashIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { i18n } from "../../../translate/i18n";

const taskFilters = [
  {
    icon: TaskIcon,
    labelKey: 'sidebar.myTasks',
    label: 'Minhas Tarefas',
    value: 'mytask',
  },
  {
    icon: StarIcon,
    labelKey: 'sidebar.working',
    label: 'Em Andamento',
    value: 'working',
  },
  {
    icon: CheckIcon,
    labelKey: 'sidebar.completed',
    label: 'Concluídas',
    value: 'completed',
  },
];

const priorityFilters = [
  {
    label: 'Alta',
    value: 'high',
    color: '#f44336',
  },
  {
    label: 'Média',
    value: 'medium',
    color: '#ff9800',
  },
  {
    label: 'Baixa',
    value: 'low',
    color: '#4caf50',
  },
];

const TaskSidebar = ({ contacts, show, onClose, stats, activeFilter, activePriority, onFilterChange, onPriorityChange }) => {

  return (
    <Box
      sx={{
        width: '280px',
        minWidth: '280px',
        height: '100%',
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflowY: 'auto',
        px: 3,
        py: 3,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box>
      {/* Task Filters */}
      <List sx={{ p: 0 }}>
        {taskFilters.map((item, index) => {
          const isActive = activeFilter === item.value;
          return (
            <ListItem
              key={`filter-key-${index}`}
              onClick={() => onFilterChange && onFilterChange(item.value)}
              sx={{
                cursor: 'pointer',
                borderRadius: 1,
                mb: 0.5,
                backgroundColor: isActive ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                    color: 'primary.main'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <item.icon sx={{ 
                  fontSize: 20, 
                  color: isActive ? 'primary.main' : 'text.secondary'
                }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isActive ? 'primary.main' : 'text.secondary'
                }}
              />
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 2, borderStyle: 'dashed', borderColor: 'divider' }} />

      {/* Priority Section */}
      <Box sx={{ px: 2 }}>
        <Typography
          variant="caption"
          sx={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'text.primary',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Prioridade
        </Typography>
        
        <List sx={{ mt: 1.5, p: 0 }}>
          {priorityFilters.map((item, index) => {
            const isActive = activePriority === item.value;
            return (
              <ListItem
                key={`priority-item-${index}`}
                onClick={() => onPriorityChange && onPriorityChange(item.value)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  py: 2,
                  px: 1,
                  borderRadius: 1,
                  backgroundColor: isActive ? `${item.color}20` : 'transparent',
                  '&:hover': {
                    backgroundColor: `${item.color}20`
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircleIcon
                    sx={{
                      fontSize: 8,
                      color: item.color
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? item.color : 'text.secondary'
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? item.color : 'text.secondary'
                  }}
                >
                  {stats?.[`${item.value}Priority`] || '0'}
                </Typography>
              </ListItem>
            );
          })}
        </List>
      </Box>

    </Box>
    </Box>
  );
};

export default TaskSidebar;