import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Tooltip,
  Grid
} from "@mui/material";
import { 
  Close, 
  Edit, 
  Delete,
  // Ícones para seleção
  PlayCircleFilled,
  School,
  Help,
  Settings,
  People,
  PhoneInTalk,
  Computer,
  Security,
  Build,
  Dashboard,
  Assignment,
  QuestionAnswer,
  VideoLibrary,
  MenuBook,
  EmojiObjects,
  Code,
  Storage,
  CloudUpload,
  Extension,
  Widgets,
  Business,
  Chat,
  ContactPhone,
  Description,
  Forum,
  Group,
  Info,
  Language,
  LibraryBooks,
  Lock,
  Message,
  Notifications,
  Phone,
  Public,
  Report,
  Share,
  Work
} from "@mui/icons-material";
import { getBackendUrl } from "../../config";

const backendUrl = getBackendUrl();

const useStyles = () => ({
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    border: `2px dashed ${"#1976d2"}`,
    borderRadius: 8,
    marginBottom: 24
  },
  avatarPreview: {
    width: 64,
    height: 64,
    backgroundColor: "#1976d2"
  },
  uploadButton: {
    position: 'relative',
    overflow: 'hidden'
  },
  uploadInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer'
  },
  uploadText: {
    textAlign: 'center',
    color: "#1976d2"
  },
  tableContainer: {
    marginTop: 24,
    maxHeight: 300
  },
  tableHeader: {
    backgroundColor: "#1976d2",
    fontWeight: 'bold'
  },
  actionButton: {
    marginLeft: 8
  }
});

// Lista de ícones predefinidos
const predefinedIcons = [
  { icon: PlayCircleFilled, name: 'PlayCircleFilled', label: 'Vídeos/Tutoriais' },
  { icon: School, name: 'School', label: 'Treinamento' },
  { icon: Help, name: 'Help', label: 'Ajuda' },
  { icon: Settings, name: 'Settings', label: 'Configurações' },
  { icon: People, name: 'People', label: 'Usuários' },
  { icon: PhoneInTalk, name: 'PhoneInTalk', label: 'Atendimento' },
  { icon: Computer, name: 'Computer', label: 'Sistema' },
  { icon: Security, name: 'Security', label: 'Segurança' },
  { icon: Build, name: 'Build', label: 'Ferramentas' },
  { icon: Dashboard, name: 'Dashboard', label: 'Dashboard' },
  { icon: Assignment, name: 'Assignment', label: 'Relatórios' },
  { icon: QuestionAnswer, name: 'QuestionAnswer', label: 'Chat' },
  { icon: VideoLibrary, name: 'VideoLibrary', label: 'Biblioteca' },
  { icon: MenuBook, name: 'MenuBook', label: 'Documentação' },
  { icon: EmojiObjects, name: 'EmojiObjects', label: 'Dicas' },
  { icon: Code, name: 'Code', label: 'Desenvolvimento' },
  { icon: Storage, name: 'Storage', label: 'Banco de Dados' },
  { icon: CloudUpload, name: 'CloudUpload', label: 'Arquivos' },
  { icon: Extension, name: 'Extension', label: 'Integrações' },
  { icon: Widgets, name: 'Widgets', label: 'API' },
  { icon: Business, name: 'Business', label: 'Empresas' },
  { icon: Chat, name: 'Chat', label: 'Conversas' },
  { icon: ContactPhone, name: 'ContactPhone', label: 'Contatos' },
  { icon: Description, name: 'Description', label: 'Documentos' },
  { icon: Forum, name: 'Forum', label: 'Fórum' },
  { icon: Group, name: 'Group', label: 'Grupos' },
  { icon: Info, name: 'Info', label: 'Informações' },
  { icon: Language, name: 'Language', label: 'Idiomas' },
  { icon: LibraryBooks, name: 'LibraryBooks', label: 'Manuais' },
  { icon: Lock, name: 'Lock', label: 'Privacidade' },
  { icon: Message, name: 'Message', label: 'Mensagens' },
  { icon: Notifications, name: 'Notifications', label: 'Notificações' },
  { icon: Phone, name: 'Phone', label: 'Telefone' },
  { icon: Public, name: 'Public', label: 'Público' },
  { icon: Report, name: 'Report', label: 'Relatórios' },
  { icon: Share, name: 'Share', label: 'Compartilhar' },
  { icon: Work, name: 'Work', label: 'Trabalho' }
];

// Função helper para renderizar ícones
const renderCategoryIcon = (iconName, size = 20, color = '#666') => {
  const iconData = predefinedIcons.find(icon => icon.name === iconName);
  if (iconData) {
    const IconComponent = iconData.icon;
    return <IconComponent style={{ fontSize: size, color }} />;
  }
  // Ícone padrão se não encontrar
  return <Help style={{ fontSize: size, color: '#999' }} />;
};

const CategoryModal = ({ 
  open, 
  onClose, 
  onSave, 
  onUpdate,
  categories = [], 
  onEdit, 
  onDelete, 
  onRefresh,
  editingCategory = null 
}) => {
  const classes = useStyles();
  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Efeito para preencher campos quando está editando
  useEffect(() => {
    if (editingCategory) {
      setIsEditing(true);
      setEditingId(editingCategory.id);
      setCategoryName(editingCategory.name || "");
      
      // Encontrar o ícone selecionado baseado no nome
      const iconFound = predefinedIcons.find(icon => icon.name === editingCategory.icon);
      setSelectedIcon(iconFound || null);
    } else {
      setIsEditing(false);
      setEditingId(null);
      setCategoryName("");
      setSelectedIcon(null);
    }
  }, [editingCategory]);

  const handleIconSelect = (iconData) => {
    setSelectedIcon(iconData);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      alert('Por favor, informe o nome da categoria.');
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        name: categoryName.trim(),
        icon: selectedIcon ? selectedIcon.name : 'Help' // Ícone padrão se não selecionado
      };

      console.log('💾 Salvando categoria com dados:', categoryData);

      if (isEditing && editingId) {
        // Chamar função de atualização
        if (onUpdate) {
          await onUpdate(editingId, categoryData);
        }
      } else {
        // Chamar função de criação
        if (onSave) {
          await onSave(categoryData);
        }
      }
      
      handleClose();
      if (onRefresh) onRefresh(); // Atualizar lista de categorias
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    if (onEdit) {
      onEdit(category);
    }
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        if (onDelete) {
          await onDelete(categoryToDelete.id);
          if (onRefresh) onRefresh(); // Atualizar lista de categorias
        }
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        alert('Erro ao excluir categoria. Tente novamente.');
      }
    }
    setDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const handleClose = () => {
    setCategoryName("");
    setSelectedIcon(null);
    setIsEditing(false);
    setEditingId(null);
    onClose();
  };

  return (
    <>
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        {isEditing ? "Editar Categoria" : "Nova Categoria"}
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {/* Campo Nome da Categoria */}
        <TextField
          label="Nome da Categoria"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          required
          placeholder="Ex: Tutoriais, Configurações, etc."
        />

        {/* Seção de Seleção do Ícone */}
        <Box className={classes.uploadSection}>
          <Typography variant="h6" gutterBottom>
            Selecionar Ícone
          </Typography>
          
          {/* Preview do ícone selecionado */}
          <Avatar 
            className={classes.avatarPreview}
            style={{ backgroundColor: '#f5f5f5' }}
          >
            {selectedIcon ? (
              <selectedIcon.icon style={{ fontSize: 32, color: '#666' }} />
            ) : (
              <PlayCircleFilled style={{ fontSize: 32, color: '#999' }} />
            )}
          </Avatar>
          
          <Typography variant="body2" style={{ marginBottom: 16, color: '#666' }}>
            {selectedIcon ? selectedIcon.label : 'Nenhum ícone selecionado'}
          </Typography>
          
          {/* Grid de ícones para seleção */}
          <Box style={{ maxHeight: 200, overflowY: 'auto', width: '100%' }}>
            <Grid container spacing={1}>
              {predefinedIcons.map((iconData, index) => {
                const IconComponent = iconData.icon;
                const isSelected = selectedIcon && selectedIcon.name === iconData.name;
                
                return (
                  <Grid item key={index}>
                    <Tooltip title={iconData.label}>
                      <IconButton
                        onClick={() => handleIconSelect(iconData)}
                        style={{
                          backgroundColor: isSelected ? '#f0f0f0' : 'transparent',
                          border: isSelected ? '2px solid #666' : '1px solid #e0e0e0',
                          borderRadius: 8,
                          margin: 2,
                          width: 48,
                          height: 48
                        }}
                      >
                        <IconComponent 
                          style={{ 
                            fontSize: 24, 
                            color: '#666'
                          }} 
                        />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
          
          <Typography variant="caption" className={classes.uploadText}>
            Selecione um ícone que represente melhor sua categoria
          </Typography>
        </Box>

        {/* Tabela de Categorias Existentes */}
        {categories.length > 0 && (
          <>
            <Divider style={{ margin: '24px 0' }} />
            <Typography variant="h6" gutterBottom>
              Categorias Cadastradas
            </Typography>
            <TableContainer component={Paper} className={classes.tableContainer}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.tableHeader}>Ícone</TableCell>
                    <TableCell className={classes.tableHeader}>Nome</TableCell>
                    <TableCell className={classes.tableHeader} align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => {
                    console.log('Categoria no modal:', category); // Debug log
                    return (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Avatar style={{ 
                            width: 32, 
                            height: 32, 
                            backgroundColor: '#f0f0f0'
                          }}>
                            {renderCategoryIcon(category.icon || 'Help', 20, '#666')}
                          </Avatar>
                        </TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar categoria">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEdit(category)}
                              className={classes.actionButton}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir categoria">
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => handleDelete(category)}
                              className={classes.actionButton}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="default">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Modal de Confirmação de Exclusão */}
    <Dialog open={deleteConfirmOpen} onClose={cancelDelete} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Confirmar Exclusão</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography>
          Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"?
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
          Esta ação não pode ser desfeita.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelDelete} color="default">
          Cancelar
        </Button>
        <Button onClick={confirmDelete} color="secondary" variant="contained">
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default CategoryModal; 