import React, { useState } from "react";
import {
  makeStyles,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Paper,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Avatar
} from "@material-ui/core";
import { 
  Category, 
  VideoLibrary, 
  Menu as MenuIcon,
  // Ícones predefinidos
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
} from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
  sidebar: {
    width: 280,
    height: "100%",
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    overflow: "auto",
    [theme.breakpoints.down('md')]: {
      display: 'none'
    }
  },
  mobileSidebar: {
    width: 280,
  },
  sidebarHeader: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryItem: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    "&:hover": {
      backgroundColor: theme.palette.action.hover
    }
  },
  selectedCategory: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    "& .MuiListItemText-primary": {
      color: theme.palette.primary.contrastText,
      fontWeight: "bold"
    },
    "& .MuiListItemIcon-root": {
      color: theme.palette.primary.contrastText
    },
    "&:hover": {
      backgroundColor: theme.palette.primary.main
    }
  },
  categoryIcon: {
    minWidth: 40
  },
  categoryCount: {
    marginLeft: "auto",
    backgroundColor: "#02C208",
    color: "#FFFFFF",
    fontSize: "0.75rem",
    height: 20,
    minWidth: 20
  },
  categoryText: {
    // Add any necessary styles for the category text
  }
}));

// Lista de ícones predefinidos (mesma do CategoryModal)
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
const renderCategoryIcon = (iconName, size = 24, color = '#666') => {
  const iconData = predefinedIcons.find(icon => icon.name === iconName);
  if (iconData) {
    const IconComponent = iconData.icon;
    return <IconComponent style={{ fontSize: size, color }} />;
  }
  // Ícone padrão se não encontrar
  return <Help style={{ fontSize: size, color: '#666' }} />;
};

const HelpsSidebar = ({ 
  categories, 
  selectedCategory, 
  onCategorySelect, 
  totalVideos, 
  mobileMenuOpen, 
  onMobileMenuToggle 
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Debug logs
  console.log('🎯 HelpsSidebar - Props recebidas:', {
    categories: categories,
    categoriesLength: categories?.length || 0,
    selectedCategory,
    totalVideos
  });

  const handleCategoryClick = (category) => {
    onCategorySelect(category);
  };

  const sidebarContent = (
    <>
      <div className={classes.sidebarHeader}>
        <Typography variant="h6">
          Central de Treinamento
        </Typography>
        {isMobile && (
          <IconButton onClick={onMobileMenuToggle} color="inherit">
            <MenuIcon />
          </IconButton>
        )}
      </div>
      
      <List>
        {/* Todos os vídeos */}
        <ListItem 
          button 
          className={`${classes.categoryItem} ${!selectedCategory ? classes.selectedCategory : ''}`}
          onClick={() => handleCategoryClick(null)}
        >
          <ListItemIcon className={classes.categoryIcon}>
            <VideoLibrary />
          </ListItemIcon>
          <ListItemText 
            primary="Todos os vídeos"
            primaryTypographyProps={{ 
              variant: "body2",
              style: { fontWeight: !selectedCategory ? "bold" : "normal" }
            }}
          />
          <Chip 
            label={totalVideos} 
            size="small" 
            className={classes.categoryCount}
          />
        </ListItem>

        {/* Categorias */}
        {categories && categories.length > 0 ? (
          categories.map((category) => {
            return (
              <ListItem 
                key={category.category}
                button 
                className={`${classes.categoryItem} ${selectedCategory === category.category ? classes.selectedCategory : ''}`}
                onClick={() => handleCategoryClick(category.category)}
              >
                <ListItemIcon className={classes.categoryIcon}>
                  {renderCategoryIcon(category.categoryIcon)}
                </ListItemIcon>
                <ListItemText 
                  primary={category.category}
                  className={classes.categoryText}
                />
                <Chip 
                  label={category.count} 
                  size="small" 
                  className={classes.categoryCount}
                />
              </ListItem>
            );
          })
        ) : (
          <ListItem>
            <ListItemText 
              primary="Nenhuma categoria encontrada"
              style={{ fontStyle: 'italic', color: '#999' }}
            />
          </ListItem>
        )}
      </List>
    </>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <Paper className={classes.sidebar} elevation={0}>
        {sidebarContent}
      </Paper>

      {/* Drawer móvel */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileMenuOpen}
        onClose={onMobileMenuToggle}
        classes={{
          paper: classes.mobileSidebar,
        }}
        ModalProps={{
          keepMounted: true, // Melhor performance em mobile
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default HelpsSidebar; 