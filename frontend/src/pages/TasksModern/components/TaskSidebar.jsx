import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Badge,
  Avatar
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Star as StarIcon,
  Check as CheckIcon,
  Delete as TrashIcon,
  Circle as CircleIcon,
  Chat as ChatIcon
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
  {
    icon: TrashIcon,
    labelKey: 'sidebar.trash',
    label: 'Lixeira',
    value: 'trash',
  },
];

const priorityFilters = [
  {
    label: 'Alta',
    value: 'high',
    color: '#f44336',
    total: '03',
  },
  {
    label: 'Média',
    value: 'medium',
    color: '#ff9800',
    total: '04',
  },
  {
    label: 'Baixa',
    value: 'low',
    color: '#4caf50',
    total: '03',
  },
];

const TaskSidebar = ({ contacts, show, onClose, stats }) => {

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
        {taskFilters.map((item, index) => (
          <ListItem
            key={`filter-key-${index}`}
            sx={{
              cursor: 'pointer',
              borderRadius: 1,
              mb: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                  color: 'primary.main'
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <item.icon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'text.secondary'
              }}
            />
          </ListItem>
        ))}
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
          {priorityFilters.map((item, index) => (
            <ListItem
              key={`priority-item-${index}`}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                cursor: 'pointer',
                py: 2,
                px: 0,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
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
                    fontWeight: 500,
                    color: 'text.secondary'
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'text.secondary'
                }}
              >
                {item.total}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ my: 3, borderStyle: 'dashed', borderColor: 'divider' }} />

      {/* Contacts Section */}
      <Box sx={{ px: 2 }}>
        <Typography
          variant="caption"
          sx={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'text.primary',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mb: 1.5,
            display: 'block'
          }}
        >
          Conversas
        </Typography>

        {contacts && contacts.length > 0 ? (
          <List sx={{ p: 0 }}>
            {contacts.map((contact) => (
              <ListItem
                key={contact.id}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar
                    src={contact.avatar}
                    sx={{ width: 32, height: 32, fontSize: '14px' }}
                  >
                    {contact.name?.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'text.primary',
                      truncate: true
                    }}
                  >
                    {contact.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '12px',
                      color: 'text.secondary',
                      truncate: true
                    }}
                  >
                    {contact.lastMessage}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            py: 4,
            color: 'text.secondary'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <ChatIcon sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                Nenhuma conversa
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
    </Box>
  );
};

export default TaskSidebar;