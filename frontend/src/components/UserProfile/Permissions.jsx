import React, { useState, useEffect } from 'react';
import { Box, Typography, Switch } from '@mui/material';
import { 
  Eye, MessageSquare, X, BarChart3, Users, User, Zap, Monitor, Shield
} from 'lucide-react';
import { CardContent } from '../ui/Card';
import FormButtons from '../ui/FormButtons';
import { toast } from '../ui/ToastProvider';
import api from '../../services/api';

const Permissions = ({ user }) => {
  const [permissions, setPermissions] = useState({
    visualizarChamadosSemFila: false,
    verConversasOutrasFilas: false,
    permitirFecharTicketsPendentes: false,
    verDashboard: false,
    permitirGrupos: false,
    verConversasOutrosUsuarios: false,
    acoesConexoes: false,
    verPainelAtendimentos: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Mapear as permissões do backend para o frontend
  useEffect(() => {
    if (user) {
      setPermissions({
        visualizarChamadosSemFila: user.allTicket === 'enable' || user.allTicket === 'enabled',
        verConversasOutrasFilas: user.allHistoric === 'enable' || user.allHistoric === 'enabled',
        permitirFecharTicketsPendentes: user.userClosePendingTicket === 'enable' || user.userClosePendingTicket === 'enabled',
        verDashboard: user.showDashboard === 'enable' || user.showDashboard === 'enabled',
        permitirGrupos: user.allowGroup === true || user.allowGroup === 'enabled',
        verConversasOutrosUsuarios: user.allUserChat === 'enable' || user.allUserChat === 'enabled',
        acoesConexoes: user.allowConnections === 'enable' || user.allowConnections === 'enabled',
        verPainelAtendimentos: user.allowRealTime === 'enable' || user.allowRealTime === 'enabled',
      });
    }
  }, [user]);

  const handlePermissionChange = (permission, checked) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Mapear permissões do frontend para o formato do backend
      const permissionsData = {
        allTicket: permissions.visualizarChamadosSemFila ? 'enable' : 'disable',
        allHistoric: permissions.verConversasOutrasFilas ? 'enabled' : 'disabled',
        userClosePendingTicket: permissions.permitirFecharTicketsPendentes ? 'enabled' : 'disabled',
        showDashboard: permissions.verDashboard ? 'enabled' : 'disabled',
        allowGroup: permissions.permitirGrupos,
        allUserChat: permissions.verConversasOutrosUsuarios ? 'enabled' : 'disabled',
        allowConnections: permissions.acoesConexoes ? 'enabled' : 'disabled',
        allowRealTime: permissions.verPainelAtendimentos ? 'enabled' : 'disabled',
      };

      await api.put(`/users/${user.id}`, permissionsData);
      
      toast.success('Permissões atualizadas com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset para valores originais do usuário
    if (user) {
      setPermissions({
        visualizarChamadosSemFila: user.allTicket === 'enable' || user.allTicket === 'enabled',
        verConversasOutrasFilas: user.allHistoric === 'enable' || user.allHistoric === 'enabled',
        permitirFecharTicketsPendentes: user.userClosePendingTicket === 'enable' || user.userClosePendingTicket === 'enabled',
        verDashboard: user.showDashboard === 'enable' || user.showDashboard === 'enabled',
        permitirGrupos: user.allowGroup === true || user.allowGroup === 'enabled',
        verConversasOutrosUsuarios: user.allUserChat === 'enable' || user.allUserChat === 'enabled',
        acoesConexoes: user.allowConnections === 'enable' || user.allowConnections === 'enabled',
        verPainelAtendimentos: user.allowRealTime === 'enable' || user.allowRealTime === 'enabled',
      });
    }
  };

  const permissionsList = [
    { 
      key: 'visualizarChamadosSemFila', 
      label: 'Visualizar Chamados sem Fila',
      description: 'Permite visualizar chamados que não possuem fila definida',
      icon: Eye,
      color: '#3b82f6'
    },
    { 
      key: 'verConversasOutrasFilas', 
      label: 'Ver Conversas de Outras Filas',
      description: 'Visualizar conversas de filas diferentes da sua',
      icon: MessageSquare,
      color: '#10b981'
    },
    { 
      key: 'permitirFecharTicketsPendentes', 
      label: 'Permitir Fechar Tickets Pendentes',
      description: 'Permite fechar tickets que estão com status pendente',
      icon: X,
      color: '#f59e0b'
    },
    { 
      key: 'verDashboard', 
      label: 'Ver Dashboard',
      description: 'Acesso ao painel principal com estatísticas e métricas',
      icon: BarChart3,
      color: '#8b5cf6'
    },
    { 
      key: 'permitirGrupos', 
      label: 'Permitir Grupos',
      description: 'Acesso para trabalhar com grupos do WhatsApp',
      icon: Users,
      color: '#06b6d4'
    },
    { 
      key: 'verConversasOutrosUsuarios', 
      label: 'Ver Conversas de Outros Usuários',
      description: 'Visualizar conversas de outros atendentes',
      icon: User,
      color: '#ec4899'
    },
    { 
      key: 'acoesConexoes', 
      label: 'Permitir Ações nas Conexões',
      description: 'Gerenciar e executar ações nas conexões do WhatsApp',
      icon: Zap,
      color: '#6366f1'
    },
    { 
      key: 'verPainelAtendimentos', 
      label: 'Ver Painel de Atendimentos',
      description: 'Acesso ao painel geral de atendimentos e métricas',
      icon: Monitor,
      color: '#14b8a6'
    }
  ];

  return (
    <CardContent className="rounded-t-none pt-6">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Shield size={20} color="var(--text-gray-medium)" />
          <Typography variant="body1" sx={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-gray-medium)' }}>
            Gerencie as permissões para este usuário:
          </Typography>
        </Box>

        {/* Grid de Permissões - 3 colunas */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 3, 
          mb: 4,
          width: '100%',
          '@media (max-width: 1024px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
          }
        }}>
          {permissionsList.map((permission) => {
            const Icon = permission.icon;
            const isChecked = permissions[permission.key];
            
            return (
              <Box
                key={permission.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 3,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${isChecked ? 'var(--color-accent)' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'var(--color-accent)',
                    backgroundColor: '#f8fafc',
                  }
                }}
                onClick={() => handlePermissionChange(permission.key, !isChecked)}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: isChecked ? 'var(--color-accent)' : `${permission.color}20`,
                  mr: 2,
                  transition: 'all 0.2s ease'
                }}>
                  <Icon 
                    size={20} 
                    color={isChecked ? 'white' : permission.color} 
                  />
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'var(--text-gray-medium)',
                      fontSize: '14px',
                      mb: 0.5
                    }}
                  >
                    {permission.label}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#64748b',
                      fontSize: '12px',
                      lineHeight: 1.3
                    }}
                  >
                    {permission.description}
                  </Typography>
                </Box>
                
                <Switch
                  checked={isChecked}
                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'var(--color-accent)',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'var(--color-accent)',
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>

        {/* Resumo das permissões selecionadas */}
        <Box sx={{ 
          mt: 3, 
          p: 3, 
          backgroundColor: '#f8fafc', 
          borderRadius: '8px', 
          border: '1px solid #e2e8f0' 
        }}>
          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500, color: '#374151', mb: 1 }}>
            Resumo das Permissões:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '12px', color: '#64748b' }}>
            {Object.values(permissions).filter(Boolean).length} de {permissionsList.length} permissões selecionadas
          </Typography>
        </Box>

        {/* Action Buttons */}
        <FormButtons
          showSave={true}
          showCancel={true}
          showBack={false}
          saveText="Salvar Permissões"
          cancelText="Cancelar"
          onSave={handleSave}
          onCancel={handleCancel}
          saveLoading={isSaving}
          justifyContent="flex-end"
          gap={2}
        />
      </Box>
    </CardContent>
  );
};

export default Permissions;