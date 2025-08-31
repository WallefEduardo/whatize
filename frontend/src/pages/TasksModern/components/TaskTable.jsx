import React, { useState } from 'react';
import {
  Box,
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
  Menu,
  MenuItem,
  Avatar,
  AvatarGroup,
  Chip,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ChevronDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as GripIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { i18n } from "../../../translate/i18n";

// Status and priority color mappings
const statusColors = {
  todo: { color: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' },
  inprogress: { color: '#2196f3', backgroundColor: 'rgba(33, 150, 243, 0.1)' },
  completed: { color: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
};

const priorityColors = {
  high: { color: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' },
  medium: { color: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' },
  low: { color: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
};

const TaskTable = ({ data, onEditTask, onDeleteTask, handleSidebar, isDesktop }) => {
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(data.map((task) => task.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const filteredData = data.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: i18n.t('status.todo') || 'A Fazer',
      inprogress: i18n.t('status.inprogress') || 'Em Andamento',
      completed: i18n.t('status.completed') || 'Concluída'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: i18n.t('priority.high') || 'Alta',
      medium: i18n.t('priority.medium') || 'Média',
      low: i18n.t('priority.low') || 'Baixa'
    };
    return labels[priority] || priority;
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        display: 'flex', 
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {isDesktop && (
            <IconButton
              onClick={handleSidebar}
              sx={{ color: 'text.secondary' }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Button
            variant="outlined"
            endIcon={<ChevronDownIcon />}
            onClick={(e) => setSortAnchorEl(e.currentTarget)}
            sx={{ 
              borderColor: 'divider', 
              color: 'text.secondary',
              textTransform: 'none'
            }}
          >
            {i18n.t('table.sort') || 'Ordenar'}
          </Button>
          
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={() => setSortAnchorEl(null)}
          >
            <MenuItem onClick={() => setSortAnchorEl(null)}>
              {i18n.t('table.asc') || 'Crescente'}
            </MenuItem>
            <MenuItem onClick={() => setSortAnchorEl(null)}>
              {i18n.t('table.desc') || 'Decrescente'}
            </MenuItem>
          </Menu>

          <Button
            variant="outlined"
            endIcon={<ChevronDownIcon />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            sx={{ 
              borderColor: 'divider', 
              color: 'text.secondary',
              textTransform: 'none'
            }}
          >
            {i18n.t('table.allTasks') || 'Todas as Tarefas'}
          </Button>
          
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
          >
            <MenuItem onClick={() => setFilterAnchorEl(null)}>
              {i18n.t('table.task1') || 'Tarefa 1'}
            </MenuItem>
            <MenuItem onClick={() => setFilterAnchorEl(null)}>
              {i18n.t('table.task2') || 'Tarefa 2'}
            </MenuItem>
            <MenuItem onClick={() => setFilterAnchorEl(null)}>
              {i18n.t('table.task3') || 'Tarefa 3'}
            </MenuItem>
          </Menu>
        </Box>

        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
          <TextField
            placeholder={i18n.t('table.searchTasks') || 'Buscar Tarefas'}
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
        </Box>
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ pl: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Checkbox
                    checked={selected.length === data.length}
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    onChange={handleSelectAll}
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {i18n.t('table.taskName') || 'Nome da Tarefa'}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {i18n.t('table.status') || 'Status'}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {i18n.t('table.assigned') || 'Responsável'}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {i18n.t('table.priority') || 'Prioridade'}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {i18n.t('table.dueDate') || 'Data Limite'}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                {i18n.t('table.actions') || 'Ações'}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((task) => {
              const isItemSelected = isSelected(task.id);
              return (
                <TableRow
                  key={task.id}
                  hover
                  selected={isItemSelected}
                  sx={{ '&:last-child td': { border: 0 } }}
                >
                  <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IconButton
                        size="small"
                        sx={{ 
                          bgcolor: 'action.hover',
                          '&:hover': { bgcolor: 'action.selected' }
                        }}
                      >
                        <GripIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      </IconButton>
                      <Checkbox
                        checked={isItemSelected}
                        onChange={() => handleSelectOne(task.id)}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={task.image?.src}
                          sx={{ width: 32, height: 32, borderRadius: 0.5 }}
                        >
                          {task.title.charAt(0)}
                        </Avatar>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textTransform: 'capitalize'
                          }}
                        >
                          {task.title}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider' }}>
                    <Chip
                      label={getStatusLabel(task.status)}
                      size="small"
                      sx={{
                        color: statusColors[task.status]?.color,
                        backgroundColor: statusColors[task.status]?.backgroundColor,
                        textTransform: 'capitalize',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider' }}>
                    {task.assign && task.assign.length > 0 && (
                      <AvatarGroup max={3} total={task.assign.length}>
                        {task.assign.map((user, index) => (
                          <Tooltip key={`assigned-user-${index}`} title={user.name}>
                            <Avatar
                              src={user.image?.src}
                              sx={{ 
                                width: 28, 
                                height: 28,
                                border: '2px solid white'
                              }}
                            >
                              {user.name.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                    )}
                  </TableCell>

                  <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider' }}>
                    <Chip
                      label={getPriorityLabel(task.priority)}
                      size="small"
                      sx={{
                        color: priorityColors[task.priority]?.color,
                        backgroundColor: priorityColors[task.priority]?.backgroundColor,
                        textTransform: 'capitalize',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                      {task.date}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => onEditTask(task)}
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          width: 28,
                          height: 28
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDeleteTask(task.id)}
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          width: 28,
                          height: 28,
                          color: 'error.main'
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer with Pagination */}
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="body2" color="text.secondary">
          {selected.length} de {filteredData.length} linha(s) selecionada(s).
        </Typography>

        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage={i18n.t('table.rowsPerPage') || 'Linhas por página:'}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Box>
    </Box>
  );
};

export default TaskTable;