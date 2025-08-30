import React from 'react';
import { Box, Card, CardContent, Typography, Avatar, Chip, Grid } from '@mui/material';
import { User, Mail, Phone, Building, Calendar, Settings, Shield } from 'lucide-react';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
  
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-2px)',
  }
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  backgroundColor: 'var(--color-accent)',
  fontSize: '32px',
  fontWeight: 600,
  border: '3px solid var(--bg-primary)',
  boxShadow: '0 4px 12px rgba(0, 195, 7, 0.3)',
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 0',
  borderBottom: '1px solid var(--border-secondary)',
  
  '&:last-child': {
    borderBottom: 'none',
  },
  
  '& .icon': {
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  
  '& .content': {
    flex: 1,
    minWidth: 0,
  },
  
  '& .label': {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  
  '& .value': {
    fontSize: '14px',
    fontWeight: 400,
    color: 'var(--text-primary)',
    wordBreak: 'break-word',
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontSize: '12px',
  fontWeight: 500,
  height: '24px',
  backgroundColor: status === 'active' ? 'rgba(0, 195, 7, 0.1)' : 'rgba(239, 68, 68, 0.1)',
  color: status === 'active' ? 'var(--color-accent)' : '#ef4444',
  border: `1px solid ${status === 'active' ? 'var(--color-accent)' : '#ef4444'}`,
  
  '& .MuiChip-label': {
    padding: '0 8px',
  }
}));

const PermissionChip = styled(Chip)(({ theme }) => ({
  fontSize: '11px',
  fontWeight: 400,
  height: '20px',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-primary)',
  margin: '2px',
  
  '& .MuiChip-label': {
    padding: '0 6px',
  }
}));

const UserProfile = ({ user, onEdit, onClose }) => {
  // Dados de exemplo se não tiver user
  const userData = user || {
    id: '001',
    nome: 'João Silva Santos',
    email: 'joao.silva@empresa.com',
    telefone: '(11) 99999-9999',
    cargo: 'Gerente de Vendas',
    departamento: 'Comercial',
    dataAdmissao: '2023-01-15',
    status: 'active',
    avatar: null,
    permissoes: {
      criarContatos: true,
      editarContatos: true,
      excluirContatos: false,
      verTodosContatos: true,
      criarTickets: true,
      editarTickets: true,
      excluirTickets: false,
      verRelatorios: true,
    },
    horarioInicio: '08:00',
    horarioFim: '18:00',
    tema: 'light',
    menuPadrao: 'dashboard'
  };

  const getInitials = (nome) => {
    if (!nome) return 'U';
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getActivePermissions = () => {
    const permissions = userData.permissoes || {};
    return Object.entries(permissions)
      .filter(([key, value]) => value === true)
      .map(([key]) => {
        const permissionLabels = {
          criarContatos: 'Criar Contatos',
          editarContatos: 'Editar Contatos', 
          excluirContatos: 'Excluir Contatos',
          verTodosContatos: 'Ver Todos Contatos',
          criarTickets: 'Criar Tickets',
          editarTickets: 'Editar Tickets',
          excluirTickets: 'Excluir Tickets',
          verRelatorios: 'Ver Relatórios',
        };
        return permissionLabels[key] || key;
      });
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh',
      p: 3
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3 
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 600, 
          color: 'var(--text-primary)',
          fontSize: '24px' 
        }}>
          Perfil do Usuário
        </Typography>
        <StatusChip 
          status={userData.status}
          label={userData.status === 'active' ? 'Ativo' : 'Inativo'}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Coluna Principal */}
        <Grid item xs={12} md={8}>
          {/* Card Principal */}
          <StyledCard sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Header do Card */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 3, 
                mb: 3,
                pb: 3,
                borderBottom: '1px solid var(--border-primary)' 
              }}>
                <StyledAvatar src={userData.avatar}>
                  {getInitials(userData.nome)}
                </StyledAvatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: 'var(--text-primary)',
                    fontSize: '20px',
                    mb: 1 
                  }}>
                    {userData.nome}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    mb: 2
                  }}>
                    {userData.cargo} • {userData.departamento}
                  </Typography>
                </Box>
              </Box>

              {/* Informações Básicas */}
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                fontSize: '16px',
                mb: 2 
              }}>
                Informações Básicas
              </Typography>

              <InfoItem>
                <Mail size={20} className="icon" />
                <Box className="content">
                  <Typography className="label">Email</Typography>
                  <Typography className="value">{userData.email}</Typography>
                </Box>
              </InfoItem>

              <InfoItem>
                <Phone size={20} className="icon" />
                <Box className="content">
                  <Typography className="label">Telefone</Typography>
                  <Typography className="value">{userData.telefone}</Typography>
                </Box>
              </InfoItem>

              <InfoItem>
                <Building size={20} className="icon" />
                <Box className="content">
                  <Typography className="label">Departamento</Typography>
                  <Typography className="value">{userData.departamento}</Typography>
                </Box>
              </InfoItem>

              <InfoItem>
                <Calendar size={20} className="icon" />
                <Box className="content">
                  <Typography className="label">Data de Admissão</Typography>
                  <Typography className="value">{formatDate(userData.dataAdmissao)}</Typography>
                </Box>
              </InfoItem>
            </CardContent>
          </StyledCard>

          {/* Card Configurações */}
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3 
              }}>
                <Settings size={20} style={{ color: 'var(--text-secondary)' }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  fontSize: '16px' 
                }}>
                  Configurações
                </Typography>
              </Box>

              <InfoItem>
                <Box className="content">
                  <Typography className="label">Horário de Trabalho</Typography>
                  <Typography className="value">
                    {userData.horarioInicio} às {userData.horarioFim}
                  </Typography>
                </Box>
              </InfoItem>

              <InfoItem>
                <Box className="content">
                  <Typography className="label">Tema</Typography>
                  <Typography className="value">
                    {userData.tema === 'light' ? 'Claro' : 'Escuro'}
                  </Typography>
                </Box>
              </InfoItem>

              <InfoItem>
                <Box className="content">
                  <Typography className="label">Menu Padrão</Typography>
                  <Typography className="value">
                    {userData.menuPadrao === 'dashboard' ? 'Dashboard' : userData.menuPadrao}
                  </Typography>
                </Box>
              </InfoItem>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Coluna Lateral */}
        <Grid item xs={12} md={4}>
          {/* Card Permissões */}
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3 
              }}>
                <Shield size={20} style={{ color: 'var(--text-secondary)' }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  fontSize: '16px' 
                }}>
                  Permissões Ativas
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1 
              }}>
                {getActivePermissions().map((permission, index) => (
                  <PermissionChip
                    key={index}
                    label={permission}
                    size="small"
                  />
                ))}
              </Box>

              {getActivePermissions().length === 0 && (
                <Typography sx={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  textAlign: 'center',
                  py: 2
                }}>
                  Nenhuma permissão ativa
                </Typography>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile;