import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, FormControl, MenuItem, Chip } from '@mui/material';
import { Settings, Save, Clock, Monitor, MessageSquare } from 'lucide-react';
import { CardContent } from '../ui/Card';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { TimePicker } from '../ui/TimePicker';
import FormButtons from '../ui/FormButtons';
import { toast } from '../ui/ToastProvider';
import api from '../../services/api';
import { AuthContext } from '../../context/Auth/AuthContext';
import useWhatsApps from '../../hooks/useWhatsApps';
import { Select as MuiSelect, styled } from '@mui/material';

// Select customizado que segue nosso design system
const StyledQueueSelect = styled(MuiSelect)(({ theme }) => ({
  width: '100%',
  height: '36px',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '4px',
  color: 'var(--text-secondary)',
  transition: 'all 0.2s ease-in-out',
  
  '& .MuiSelect-select': {
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    minHeight: '34px !important',
  },
  
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  
  '&:hover': {
    borderColor: 'var(--color-accent)',
  },
  
  '&.Mui-focused': {
    borderColor: 'var(--color-accent)',
    boxShadow: '0 0 0 2px rgba(0, 195, 7, 0.2)',
  },
  
  '& .MuiChip-root': {
    height: '24px',
    margin: '2px',
    fontSize: '12px',
  },
}));

const UserSettings = ({ user, onUpdate, onCancel }) => {
  const { user: loggedInUser } = useContext(AuthContext);
  const { loading, whatsApps } = useWhatsApps();
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [queues, setQueues] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    horarioInicio: '08:00',
    horarioFim: '18:00',
    tema: 'light',
    menuPadrao: 'open',
    conexao: '',
    perfil: 'user',
    mensagemDespedida: '',
  });

  // Carregar filas disponíveis
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const { data } = await api.get("/queue");
        setQueues(data);
      } catch (error) {
        console.error('Erro ao carregar filas:', error);
      }
    };

    fetchQueues();
  }, []);

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        horarioInicio: user.startWork || '08:00',
        horarioFim: user.endWork || '18:00',
        tema: user.defaultTheme || 'light',
        menuPadrao: user.defaultMenu || 'open',
        conexao: user.whatsappId || '',
        perfil: user.profile || 'user',
        mensagemDespedida: user.farewellMessage || '',
      });

      // Carregar filas selecionadas do usuário
      if (user.queues && Array.isArray(user.queues)) {
        setSelectedQueueIds(user.queues.map(queue => queue.id));
      }
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Validações
      if (formData.horarioInicio === '00:00' && formData.horarioFim === '00:00') {
        toast.error('Início e fim de trabalho não podem ser ambos 00:00');
        return;
      }
      
      if (!formData.perfil) {
        toast.error('Perfil é obrigatório');
        return;
      }

      // Mapear dados para o formato do backend
      const settingsData = {
        startWork: formData.horarioInicio,
        endWork: formData.horarioFim,
        defaultTheme: formData.tema,
        defaultMenu: formData.menuPadrao,
        whatsappId: formData.conexao || null,
        profile: formData.perfil,
        farewellMessage: formData.mensagemDespedida,
        queueIds: selectedQueueIds,
      };

      const response = await api.put(`/users/${user.id}`, settingsData);
      
      if (onUpdate) {
        onUpdate({ ...user, ...settingsData });
      }
      
      toast.success('Configurações atualizadas com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(); // Chama função para voltar à listagem de usuários
    } else {
      // Reset para valores originais do usuário
      if (user) {
        setFormData({
          horarioInicio: user.startWork || '08:00',
          horarioFim: user.endWork || '18:00',
          tema: user.defaultTheme || 'light',
          menuPadrao: user.defaultMenu || 'open',
          conexao: user.whatsappId || '',
          perfil: user.profile || 'user',
          mensagemDespedida: user.farewellMessage || '',
        });

        if (user.queues && Array.isArray(user.queues)) {
          setSelectedQueueIds(user.queues.map(queue => queue.id));
        }
      }
    }
  };

  return (
    <CardContent className="rounded-t-none pt-6">
      <Box sx={{ width: '100%' }}>
        
        {/* Título */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Settings size={24} color="var(--text-gray-medium)" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
              Configurações do Sistema
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              Gerencie as configurações e preferências do usuário
            </Typography>
          </Box>
        </Box>

        {/* Horários de Trabalho */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Clock size={20} color="var(--text-gray-medium)" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
              Horários de Trabalho
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Horário de Início
              </Typography>
              <TimePicker
                value={formData.horarioInicio}
                onChange={(e) => handleInputChange('horarioInicio', e.target.value)}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Horário de Fim
              </Typography>
              <TimePicker
                value={formData.horarioFim}
                onChange={(e) => handleInputChange('horarioFim', e.target.value)}
              />
            </Box>
          </Box>
        </Box>

        {/* Preferências do Sistema */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Monitor size={20} color="var(--text-gray-medium)" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
              Preferências do Sistema
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3,
            mb: 3
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Tema Padrão
              </Typography>
              <Select
                value={formData.tema}
                onChange={(value) => handleInputChange('tema', value)}
                options={[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Escuro' },
                  { value: 'auto', label: 'Automático' }
                ]}
                displayKey="label"
                valueKey="value"
                placeholder="Selecione um tema"
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Menu Padrão
              </Typography>
              <Select
                value={formData.menuPadrao}
                onChange={(value) => handleInputChange('menuPadrao', value)}
                options={[
                  { value: 'open', label: 'Aberto' },
                  { value: 'closed', label: 'Fechado' }
                ]}
                displayKey="label"
                valueKey="value"
                placeholder="Selecione uma opção"
              />
            </Box>
          </Box>
        </Box>

        {/* Configurações de Atendimento */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <MessageSquare size={20} color="var(--text-gray-medium)" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
              Configurações de Atendimento
            </Typography>
          </Box>

          {/* Filas */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
              Filas
            </Typography>
            <FormControl fullWidth>
              <StyledQueueSelect
                multiple
                value={selectedQueueIds}
                onChange={(e) => setSelectedQueueIds(e.target.value)}
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>Selecione as filas</span>;
                  }
                  
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const queue = queues.find(q => q.id === id);
                        return queue ? (
                          <Chip
                            key={id}
                            label={queue.name}
                            size="small"
                            sx={{
                              backgroundColor: queue.color || 'var(--color-accent)',
                              color: 'white',
                              fontSize: '11px',
                              height: '22px',
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  );
                }}
              >
                {queues.map((queue) => (
                  <MenuItem key={queue.id} value={queue.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: queue.color || '#ccc',
                        }}
                      />
                      {queue.name}
                    </Box>
                  </MenuItem>
                ))}
              </StyledQueueSelect>
            </FormControl>
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3,
            mb: 3
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Conexão WhatsApp
              </Typography>
              <Select
                value={formData.conexao}
                onChange={(value) => handleInputChange('conexao', value)}
                options={[
                  { id: '', name: 'Nenhuma conexão' },
                  ...whatsApps
                ]}
                displayKey="name"
                valueKey="id"
                placeholder="Selecione uma conexão"
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Perfil
              </Typography>
              <Select
                value={formData.perfil}
                onChange={(value) => handleInputChange('perfil', value)}
                options={[
                  { value: 'admin', label: 'Administrador' },
                  { value: 'user', label: 'Usuário' }
                ]}
                displayKey="label"
                valueKey="value"
                placeholder="Selecione um perfil"
              />
            </Box>
          </Box>

          {/* Mensagem de Despedida */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
              Mensagem de Despedida 
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> (Opcional)</span>
            </Typography>
            <Textarea
              rows={3}
              value={formData.mensagemDespedida}
              onChange={(e) => handleInputChange('mensagemDespedida', e.target.value)}
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <FormButtons
          showSave={true}
          showCancel={true}
          showBack={false}
          saveText="Salvar Configurações"
          cancelText="Cancelar"
          onSave={handleSave}
          onCancel={handleCancel}
          saveLoading={isSaving}
          saveIcon={<Save size={16} />}
          justifyContent="flex-end"
          gap={2}
        />

        {/* Dica de Segurança */}
        <Box sx={{ 
          mt: 4, 
          p: 3, 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '8px',
          border: '1px solid var(--border-primary)' 
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'var(--text-primary)' }}>
            💡 Dica:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            As configurações de horário de trabalho afetam a disponibilidade para atendimento automático. 
            A mensagem de despedida será enviada automaticamente quando um atendimento for finalizado.
          </Typography>
        </Box>
      </Box>
    </CardContent>
  );
};

export default UserSettings;