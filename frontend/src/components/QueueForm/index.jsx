import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Paper
} from "@mui/material";
import { 
  ArrowLeft, 
  Save,
  Users,
  Headphones,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Settings,
  Star,
  Heart,
  Shield,
  Zap,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  UserCheck,
  UserPlus,
  X,
  RotateCcw
} from "lucide-react";

// Componentes
import { Input } from "../ui/Input";
import TwitterColorPicker from "../TwitterColorPicker";
import FormButtons from "../ui/FormButtons";

/**
 * QueueForm - Formulário integrado para criação/edição de filas
 * 
 * @param {Object} props
 * @param {Function} props.onBack - Callback para voltar à listagem
 * @param {Function} props.onSave - Callback para salvar fila
 * @param {Object} props.initialData - Dados iniciais para edição
 */
const QueueForm = ({ 
  onBack, 
  onSave,
  initialData = null
}) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    color: initialData?.color || "#00C307",
    closeTicket: initialData?.closeTicket || false,
    ativarRoteador: initialData?.ativarRoteador || false,
    icon: initialData?.icon || "Users",
    tempoRoteador: initialData?.tempoRoteador || 0,
    ...initialData
  });

  const [loading, setLoading] = useState(false);

  // Ícones disponíveis para filas
  const availableIcons = [
    { name: "Users", icon: Users, label: "Usuários" },
    { name: "Headphones", icon: Headphones, label: "Suporte" },
    { name: "MessageCircle", icon: MessageCircle, label: "Chat" },
    { name: "Phone", icon: Phone, label: "Telefone" },
    { name: "Mail", icon: Mail, label: "Email" },
    { name: "Clock", icon: Clock, label: "Tempo" },
    { name: "Settings", icon: Settings, label: "Configurações" },
    { name: "Star", icon: Star, label: "VIP" },
    { name: "Heart", icon: Heart, label: "Cuidados" },
    { name: "Shield", icon: Shield, label: "Segurança" },
    { name: "Zap", icon: Zap, label: "Rápido" },
    { name: "Target", icon: Target, label: "Foco" },
    { name: "Award", icon: Award, label: "Prêmio" },
    { name: "CheckCircle", icon: CheckCircle, label: "Aprovação" },
    { name: "AlertCircle", icon: AlertCircle, label: "Urgente" },
    { name: "Info", icon: Info, label: "Informações" },
    { name: "HelpCircle", icon: HelpCircle, label: "Ajuda" },
    { name: "UserCheck", icon: UserCheck, label: "Validação" },
    { name: "UserPlus", icon: UserPlus, label: "Cadastro" }
  ];

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar fila:', error);
    } finally {
      setLoading(false);
    }
  };

  // Encontrar o ícone selecionado
  const selectedIcon = availableIcons.find(icon => icon.name === formData.icon) || availableIcons[0];
  const SelectedIconComponent = selectedIcon.icon;

  return (
    <Box sx={{ width: '100%', maxWidth: 'none' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        pb: 2,
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <IconButton 
          onClick={onBack}
          sx={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            mr: 2,
            '&:hover': {
              backgroundColor: 'var(--hover-bg-light)'
            }
          }}
        >
          <ArrowLeft size={20} />
        </IconButton>
        
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {initialData ? 'Editar Fila' : 'Nova Fila'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Configure uma nova fila de atendimento
          </Typography>
        </Box>
      </Box>

      <Card sx={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 3,
        p: 4
      }}>
        {/* LINHA 1 - Nome da Fila */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            Nome da Fila
          </Typography>
          <Input
            placeholder="Ex: Suporte Técnico"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            size="lg"
            variant="bordered"
            color="default"
          />
        </Box>

        {/* LINHA 2 - Container Cores + Container Ícones */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Container de Cores */}
          <Box sx={{ 
            flex: 1,
            p: 3,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'var(--text-primary)' }}>
              Escolher Cor
            </Typography>
            <TwitterColorPicker
              color={formData.color}
              onChange={(color) => handleInputChange('color', color.hex)}
              width="100%"
            />
          </Box>

          {/* Container de Ícones */}
          <Box sx={{ 
            flex: 1,
            p: 3,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'var(--text-primary)' }}>
              Ícone da Fila
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {availableIcons.map((iconData) => {
                const IconComponent = iconData.icon;
                const isSelected = formData.icon === iconData.name;
                
                return (
                  <Tooltip title={iconData.label} key={iconData.name}>
                    <IconButton
                      onClick={() => handleInputChange('icon', iconData.name)}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: isSelected ? formData.color : 'var(--bg-primary)',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${isSelected ? formData.color : 'var(--border-primary)'}`,
                        borderRadius: 1.5,
                        '&:hover': {
                          backgroundColor: isSelected ? formData.color : 'var(--hover-bg-light)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <IconComponent size={16} />
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* LINHA 3 - Switches lado a lado */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ 
            flex: 1,
            p: 3, 
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 2,
            border: '1px solid var(--border-primary)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: formData.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <X size={18} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Fechar Ticket
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Fecha automaticamente quando transferido
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.closeTicket}
                  onChange={(e) => handleInputChange('closeTicket', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: formData.color,
                      '& + .MuiSwitch-track': {
                        backgroundColor: formData.color,
                      },
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                  {formData.closeTicket ? 'Ativado' : 'Desativado'}
                </Typography>
              }
            />
          </Box>

          <Box sx={{ 
            flex: 1,
            p: 3, 
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 2,
            border: '1px solid var(--border-primary)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: formData.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <RotateCcw size={18} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Ativar Rodízio
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Distribui tickets entre atendentes
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.ativarRoteador}
                  onChange={(e) => handleInputChange('ativarRoteador', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: formData.color,
                      '& + .MuiSwitch-track': {
                        backgroundColor: formData.color,
                      },
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                  {formData.ativarRoteador ? 'Ativado' : 'Desativado'}
                </Typography>
              }
            />
          </Box>
        </Box>

        {/* Botões do Formulário */}
        <FormButtons
          showSave={true}
          showCancel={true}
          showBack={false}
          saveText={initialData ? 'Salvar Alterações' : 'Criar Fila'}
          cancelText="Cancelar"
          onSave={handleSubmit}
          onCancel={onBack}
          saveDisabled={!formData.name.trim()}
          saveLoading={loading}
        />
      </Card>
    </Box>
  );
};

export default QueueForm;