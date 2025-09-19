import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "../../components/ui/ToastProvider";
import { styled } from "@mui/material/styles";
import {
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  Avatar,
  Box,
  Card,
  CardContent
} from "@mui/material";
import UserRegister from "../../components/UserRegister";
import UserProfile from "../../components/UserProfile";

import {
  Search as SearchIcon,
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
  AccountCircle,
  AddCircleOutline
} from "@mui/icons-material";


import PageLayout from "../../components/PageLayout";
import { Users as UsersIcon, Plus, BarChart3, Edit3, Trash2 } from "lucide-react";
import SearchInput from "../../components/SearchInput";
import GradientButton from "../../components/GradientButton";
import BaseTable, { ActionButton, ActionGroup } from "../../components/BaseTable";
import whatsappIcon from '../../assets/nopicture.png'
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import UserStatusIcon from "../../components/UserModal/statusIcon";
import { getBackendUrl } from "../../config";
import ForbiddenPage from "../../components/ForbiddenPage";

const backendUrl = getBackendUrl();

const reducer = (state, action) => {
  if (action.type === "LOAD_USERS") {
    const users = action.payload;
    const newUsers = [];

    users.forEach((user) => {
      const userIndex = state.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        state[userIndex] = user;
      } else {
        newUsers.push(user);
      }
    });

    return [...state, ...newUsers];
  }

  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const userIndex = state.findIndex((u) => u.id === user.id);

    if (userIndex !== -1) {
      state[userIndex] = user;
      return [...state];
    } else {
      return [user, ...state];
    }
  }

  if (action.type === "DELETE_USER") {
    const userId = action.payload;
    const userIndex = state.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      state.splice(userIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = () => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    overflowY: "scroll",
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  searchInput: {
    width: "300px",
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
  },
  actionButtons: {
    backgroundColor: "#00C307",
    color: "white",
    "&:hover": {
      backgroundColor: "#029907",
    },
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  customTable: {
    "& .MuiTableCell-head": {
      fontWeight: 600,
      color: "#333",
      borderBottom: "2px solid #f5f5f5",
    },
    "& .MuiTableCell-body": {
      borderBottom: "1px solid #f5f5f5",
    },
    "& .MuiTableRow-root:hover": {
      backgroundColor: "#f9f9f9",
    },
  },
  userAvatar: {
    width: 42,
    height: 42,
    border: "2px solid #f5f5f5",
  },
  avatarCell: {
    width: 50,
  },
  actionCell: {
    width: 100,
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    marginLeft: 8,
    "&.edit": {
      color: "#00C307",
    },
    "&.delete": {
      color: "#E57373",
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    "& > *": {
      color: "#00C307",
    },
  },
  loadingText: {
    marginLeft: 16,
    color: "#333",
  },
});

const Users = () => {
  const classes = useStyles();
  const { user: loggedInUser, socket } = useContext(AuthContext);
  const { profileImage } = loggedInUser;

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [users, dispatch] = useReducer(reducer, []);
  const [currentView, setCurrentView] = useState('users'); // 'users', 'register', 'profile'

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/users/", {
          params: { searchParam, pageNumber },
        });
        dispatch({ type: "LOAD_USERS", payload: data.users });
        setHasMore(data.hasMore);
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchUsers();
  }, [searchParam, pageNumber]);

  useEffect(() => {
    if (loggedInUser) {
      const companyId = loggedInUser.companyId;
      const onCompanyUser = (data) => {
        if (data.action === "update" || data.action === "create") {
          dispatch({ type: "UPDATE_USERS", payload: data.user });
        }
        if (data.action === "delete") {
          dispatch({ type: "DELETE_USER", payload: +data.userId });
        }
      };
      if (socket && socket.on && typeof socket.on === 'function') {

        socket.on(`company-${companyId}-user`, onCompanyUser);

      }
      return () => {
        if (socket && socket.off && typeof socket.off === 'function') {

          socket.off(`company-${companyId}-user`, onCompanyUser);

        }
      };
    }
  }, [socket, loggedInUser]);

  const handleOpenUserModal = () => {
    setSelectedUser(null);
    setCurrentView('register');
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setCurrentView('users');
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setCurrentView('profile');
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success(i18n.t("users.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingUser(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setLoadingMore(true);
    setPageNumber((prevPage) => prevPage + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  // Filtrar usuários baseado no termo de busca
  const filteredUsers = users.filter(user => {
    if (!searchParam) return true;
    
    const searchLower = searchParam.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.profile?.toLowerCase().includes(searchLower)
    );
  });

  // Definição das colunas para BaseTable
  const columns = [
    {
      accessor: 'id',
      title: i18n.t("users.table.ID"),
      textAlignment: 'center',
      width: '80px',
      render: (user) => (
        <Typography
          sx={{
            color: 'var(--text-gray-medium)',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}
        >
          {user.id}
        </Typography>
      )
    },
    {
      accessor: 'status',
      title: i18n.t("users.table.status"),
      textAlignment: 'center',
      width: '100px',
      render: (user) => <UserStatusIcon user={user} />
    },
    {
      accessor: 'avatar',
      title: 'Avatar',
      textAlignment: 'center',
      width: '80px',
      sortable: false,
      render: (user) => (
        <Avatar
          src={
            user.profileImage
              ? `${backendUrl}/public/company${user.companyId}/${user.profileImage}`
              : whatsappIcon
          }
          alt={user.name}
          sx={{
            width: 42,
            height: 42,
            border: '2px solid var(--border-primary)',
            margin: '0 auto'
          }}
        />
      )
    },
    {
      accessor: 'name',
      title: i18n.t("users.table.name"),
      textAlignment: 'center',
      sortable: true,
      render: (user) => (
        <Typography
          sx={{
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          {user.name}
        </Typography>
      )
    },
    {
      accessor: 'email',
      title: i18n.t("users.table.email"),
      textAlignment: 'center',
      sortable: true,
      render: (user) => (
        <Typography
          sx={{
            color: 'var(--text-gray-medium)',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}
        >
          {user.email}
        </Typography>
      )
    },
    {
      accessor: 'profile',
      title: i18n.t("users.table.profile"),
      textAlignment: 'center',
      sortable: true,
      render: (user) => (
        <Typography
          sx={{
            color: 'var(--text-gray-medium)',
            fontWeight: 500,
            fontSize: '0.875rem',
            textTransform: 'capitalize'
          }}
        >
          {user.profile}
        </Typography>
      )
    },
    {
      accessor: 'startWork',
      title: i18n.t("users.table.startWork"),
      textAlignment: 'center',
      sortable: true,
      render: (user) => (
        <Typography
          sx={{
            color: 'var(--text-gray-medium)',
            fontWeight: 500,
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}
        >
          {user.startWork}
        </Typography>
      )
    },
    {
      accessor: 'endWork',
      title: i18n.t("users.table.endWork"),
      textAlignment: 'center',
      sortable: true,
      render: (user) => (
        <Typography
          sx={{
            color: 'var(--text-gray-medium)',
            fontWeight: 500,
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}
        >
          {user.endWork}
        </Typography>
      )
    },
    {
      accessor: 'actions',
      title: i18n.t("users.table.actions"),
      textAlignment: 'center',
      sortable: false,
      render: (user) => (
        <ActionGroup>
          <ActionButton
            onClick={() => handleEditUser(user)}
            icon={Edit3}
            tooltip="Editar usuário"
            color="var(--color-accent)"
            hoverColor="var(--color-accent)"
          />
          <ActionButton
            onClick={() => {
              setConfirmModalOpen(true);
              setDeletingUser(user);
            }}
            icon={Trash2}
            tooltip="Excluir usuário"
            color="#E57373"
            hoverColor="#d32f2f"
          />
        </ActionGroup>
      )
    }
  ];

  // Função para renderizar cards personalizados
  const renderUserCard = (user) => {
    // Definir cor baseada no perfil/status
    const getProfileColor = (profile) => {
      switch (profile) {
        case "admin": return '#10b981'; // green
        case "user": return '#3b82f6'; // blue
        case "supervisor": return '#f59e0b'; // yellow
        default: return '#6366f1'; // indigo padrão
      }
    };

    const profileColor = getProfileColor(user.profile);

    return (
      <Card sx={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 3,
        width: '100%',
        minHeight: 320,
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: `
          linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%),
          var(--bg-primary)
        `,
        '&:hover': {
          borderColor: profileColor,
          boxShadow: `
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            0 0 0 1px ${profileColor}33
          `,
          '&::before': {
            opacity: 1,
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${profileColor}, ${profileColor}CC)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          borderRadius: '12px 12px 0 0',
        }
      }}>
        <CardContent sx={{ 
          p: 2, 
          pb: 3,
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          minHeight: '100%'
        }}>
          {/* Header com ID */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 1.5
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.7rem',
                opacity: 0.6
              }}
            >
              #{user.id}
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <UserStatusIcon user={user} />
              <Box sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: profileColor,
                boxShadow: `0 0 0 3px ${profileColor}22`
              }} />
            </Box>
          </Box>

          {/* Avatar e Nome */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={
                user.profileImage
                  ? `${backendUrl}/public/company${user.companyId}/${user.profileImage}`
                  : whatsappIcon
              }
              alt={user.name}
              sx={{
                width: 64,
                height: 64,
                border: `3px solid ${profileColor}`,
                mb: 1
              }}
            />
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '1rem',
                textAlign: 'center',
                mb: 0.5
              }}
            >
              {user.name}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}
            >
              {user.email}
            </Typography>
          </Box>

          {/* Informações do Usuário */}
          <Box sx={{ flex: 1, mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Perfil:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: profileColor,
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {user.profile}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Horário:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem'
                }}
              >
                {user.startWork} - {user.endWork}
              </Typography>
            </Box>
          </Box>
          
          {/* Ações principais */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 1.5, 
            pt: 2,
            pb: 1,
            mt: 'auto',
            borderTop: '1px solid var(--border-primary)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '1px',
              background: profileColor,
              opacity: 0.3
            }
          }}>
            <ActionButton
              onClick={() => handleEditUser(user)}
              icon={Edit3}
              tooltip="Editar usuário"
              color="var(--color-accent)"
              hoverColor="var(--color-accent)"
              size={14}
            />
            <ActionButton
              onClick={() => {
                setConfirmModalOpen(true);
                setDeletingUser(user);
              }}
              icon={Trash2}
              tooltip="Excluir usuário"
              color="#ef4444"
              hoverColor="#ef4444"
              size={14}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  // UserProfile precisa renderizar fora do PageLayout para funcionar o modo dark
  if (currentView === 'profile') {
    return (
      <UserProfile 
        user={selectedUser}
        onClose={() => {
          setCurrentView('users');
          setSelectedUser(null);
        }} 
      />
    );
  }

  return (
    <PageLayout
      title="Usuários"
      icon={<UsersIcon />}
      breadcrumbs={[
        { href: "/", icon: <BarChart3 size={16} /> },
        { label: "Usuários", icon: <UsersIcon size={16} /> }
      ]}
    >
      <ConfirmationModal
        title={deletingUser && `${i18n.t("users.confirmationModal.deleteTitle")} ${deletingUser.name}?`}
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteUser(deletingUser.id)}
      >
        {i18n.t("users.confirmationModal.deleteMessage")}
      </ConfirmationModal>


      {loggedInUser.profile === "user" ? (
        <ForbiddenPage />
      ) : (
        <>
          {currentView === 'register' && (
            <Box>
              <Button
                onClick={() => setCurrentView('users')}
                sx={{
                  mb: 2,
                  backgroundColor: '#6b7280',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#4b5563'
                  }
                }}
              >
                ← Voltar para Usuários
              </Button>
              <UserRegister onClose={handleCloseUserModal} />
            </Box>
          )}
          
          
          {currentView === 'users' && (
            <>
            <div 
            className={classes.searchContainer}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row",
              flexWrap: "nowrap",
              gap: "16px"
            }}
          >
            {/* SearchInput do lado esquerdo - Responsivo */}
            <Box sx={{
              flex: {
                xs: "0 0 280px",
                sm: "0 0 300px",
                md: "0 0 320px",
                lg: "0 0 350px",
                xl: "0 0 400px"
              },
              maxWidth: {
                xs: "280px",
                sm: "300px", 
                md: "320px",
                lg: "350px",
                xl: "400px"
              },
              minWidth: {
                xs: "250px",
                sm: "280px",
                md: "300px", 
                lg: "320px",
                xl: "350px"
              }
            }}>
              <SearchInput
                placeholder={i18n.t("contacts.searchPlaceholder")}
                value={searchParam}
                onChange={(e) => setSearchParam(e.target.value.toLowerCase())}
                onSearch={(value) => setSearchParam(value.toLowerCase())}
                size="small"
                fullWidth={true}
              />
            </Box>

            {/* Botões do lado direito - Responsivos */}
            <Box sx={{ 
              display: "flex", 
              gap: {
                xs: "6px",
                sm: "8px",
                md: "8px",
                lg: "10px",
                xl: "12px"
              }, 
              alignItems: "center",
              flexShrink: 0,
              marginLeft: "auto"
            }}>
              <GradientButton
                icon={<Plus size={16} />}
                size="small"
                variant="primary"
                onClick={handleOpenUserModal}
                sx={{
                  fontSize: {
                    xs: '0.75rem',
                    sm: '0.8rem',
                    md: '0.85rem',
                    lg: '0.9rem',
                    xl: '0.95rem'
                  },
                  px: {
                    xs: 1.5,
                    sm: 2,
                    md: 2.5,
                    lg: 2.5,
                    xl: 3
                  },
                  py: {
                    xs: 0.5,
                    sm: 0.75,
                    md: 0.75,
                    lg: 1,
                    xl: 1
                  },
                  minWidth: {
                    xs: 'auto',
                    sm: '100px',
                    md: '120px',
                    lg: '130px',
                    xl: '140px'
                  }
                }}
              >
                {i18n.t("Adicionar usuário")}
              </GradientButton>
            </Box>
          </div>

          <Box sx={{ mt: 3 }}>
            <BaseTable
              records={filteredUsers}
              columns={columns}
              loading={loading}
              noRecordsTitle="Nenhum usuário encontrado"
              noRecordsText="Crie um novo usuário para começar a usar o sistema"
              noRecordsIcon={<UsersIcon size={48} />}
              enableSorting={true}
              enableViewToggle={true}
              defaultView="table"
              renderCard={renderUserCard}
              initialSortBy="name"
              initialSortOrder="asc"
              showPagination={false}
              minHeight={500}
            />
          </Box>
            </>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default Users;