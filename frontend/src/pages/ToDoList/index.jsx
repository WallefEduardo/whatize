import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Typography,
  InputAdornment,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const useStyles = () => ({
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    flex: 1,
    height: 'calc(100vh - 78px)',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    maxWidth: '400px',
    '& .MuiOutlinedInput-root': {
      borderRadius: 8,
    },
  },
  addButton: {
    backgroundColor: '#00c307',
    color: '#FFFFFF',
    borderRadius: '8px',
    padding: '8px 24px',
    '&:hover': {
      backgroundColor: '#029907',
    },
  },
  listContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    overflowY: 'auto',
    flex: 1,
  },
  listItem: {
    borderRadius: 8,
    marginBottom: 8,
    '&:hover': {
      backgroundColor: '#f9f9f9',
    },
  },
  taskText: {
    '& .MuiTypography-root': {
      fontWeight: 500,
      color: '#333',
    },
    '& .MuiTypography-body2': {
      color: '#666',
      fontSize: '0.75rem',
    },
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    '&.edit': {
      color: '#00C307',
      backgroundColor: '#f5f5f5',
    },
    '&.delete': {
      color: '#E57373',
      backgroundColor: '#f5f5f5',
    },
  },
});

const ToDoList = () => {
  const classes = useStyles();
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editIndex, setEditIndex] = useState(-1);

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleTaskChange = (event) => {
    setTask(event.target.value);
  };

  const handleAddTask = () => {
    if (!task.trim()) return;

    const now = new Date();
    if (editIndex >= 0) {
      const newTasks = [...tasks];
      newTasks[editIndex] = {
        text: task,
        updatedAt: now,
        createdAt: newTasks[editIndex].createdAt
      };
      setTasks(newTasks);
      setTask('');
      setEditIndex(-1);
    } else {
      setTasks([...tasks, { text: task, createdAt: now, updatedAt: now }]);
      setTask('');
    }
  };

  const handleEditTask = (index) => {
    setTask(tasks[index].text);
    setEditIndex(index);
  };

  const handleDeleteTask = (index) => {
    const newTasks = [...tasks];
    newTasks.splice(index, 1);
    setTasks(newTasks);
  };

  return (
    <Paper className={classes.mainContainer}>
      <div className={classes.header}>
        <TextField
          className={classes.input}
          placeholder="Nova anotação"
          value={task}
          onChange={handleTaskChange}
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          className={classes.addButton}
          onClick={handleAddTask}
          startIcon={editIndex >= 0 ? <EditIcon /> : <AddIcon />}
        >
          {editIndex >= 0 ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>

      <div className={classes.listContainer}>
        <List>
          {tasks.map((task, index) => (
            <ListItem key={index} className={classes.listItem}>
              <ListItemText
                className={classes.taskText}
                primary={task.text}
                secondary={task.updatedAt.toLocaleString()}
              />
              <ListItemSecondaryAction>
                <IconButton
                  onClick={() => handleEditTask(index)}
                  className={`${classes.iconButton} edit`}
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteTask(index)}
                  className={`${classes.iconButton} delete`}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </div>
    </Paper>
  );
};

export default ToDoList;