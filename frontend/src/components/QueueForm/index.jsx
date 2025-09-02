import React, { useState, useEffect } from "react";
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
  RotateCcw,
  Home,
  User,
  Building,
  Calendar,
  Database,
  FileText,
  Gift,
  Globe,
  Key,
  Lock,
  Monitor,
  Package,
  Printer,
  Search,
  Truck,
  Wifi,
  Download,
  Upload,
  Cloud,
  Server,
  Smartphone,
  Tablet,
  Laptop,
  Camera,
  Video,
  Music,
  Image,
  Book,
  Bookmark
} from "lucide-react";

// Componentes
import { Input } from "../ui/Input";
import TwitterColorPicker from "../TwitterColorPicker";
import FormButtons from "../ui/FormButtons";
import api from "../../services/api";
import toastError, { toastSuccess } from "../../errors/toastError";
import CustomTooltip from "../CustomTooltip";

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
    // Não incluir chatbots vazios que causam erro
    ...(initialData || {})
  });

  const [loading, setLoading] = useState(false);
  const [usedColors, setUsedColors] = useState([]);

  // Buscar cores já usadas
  useEffect(() => {
    const fetchUsedColors = async () => {
      try {
        const { data } = await api.get("/queue");
        const colors = data
          .filter(queue => initialData ? queue.id !== initialData.id : true)
          .map(queue => queue.color);
        setUsedColors(colors);
      } catch (error) {
        console.error('Erro ao buscar cores usadas:', error);
      }
    };
    
    fetchUsedColors();
  }, [initialData]);

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
    { name: "UserPlus", icon: UserPlus, label: "Cadastro" },
    { name: "Home", icon: Home, label: "Casa" },
    { name: "User", icon: User, label: "Usuário" },
    { name: "Building", icon: Building, label: "Empresa" },
    { name: "Calendar", icon: Calendar, label: "Agenda" },
    { name: "Database", icon: Database, label: "Dados" },
    { name: "FileText", icon: FileText, label: "Documento" },
    { name: "Gift", icon: Gift, label: "Presente" },
    { name: "Globe", icon: Globe, label: "Global" },
    { name: "Key", icon: Key, label: "Chave" },
    { name: "Lock", icon: Lock, label: "Seguro" },
    { name: "Monitor", icon: Monitor, label: "Monitor" },
    { name: "Package", icon: Package, label: "Pacote" },
    { name: "Printer", icon: Printer, label: "Impressora" },
    { name: "Search", icon: Search, label: "Busca" },
    { name: "Truck", icon: Truck, label: "Entrega" },
    { name: "Wifi", icon: Wifi, label: "WiFi" },
    { name: "Download", icon: Download, label: "Download" },
    { name: "Upload", icon: Upload, label: "Upload" },
    { name: "Cloud", icon: Cloud, label: "Nuvem" },
    { name: "Server", icon: Server, label: "Servidor" },
    { name: "Smartphone", icon: Smartphone, label: "Celular" },
    { name: "Tablet", icon: Tablet, label: "Tablet" },
    { name: "Laptop", icon: Laptop, label: "Notebook" },
    { name: "Camera", icon: Camera, label: "Câmera" },
    { name: "Video", icon: Video, label: "Vídeo" },
    { name: "Music", icon: Music, label: "Música" },
    { name: "Image", icon: Image, label: "Imagem" },
    { name: "Book", icon: Book, label: "Livro" },
    { name: "Bookmark", icon: Bookmark, label: "Favorito" }
  ];

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    console.log('🔄 handleSubmit chamado', formData);
    
    if (!formData.name.trim()) {
      toastError('Nome da fila é obrigatório!');
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Chamando onSave com dados:', formData);
      await onSave(formData);
      console.log('✅ onSave executado com sucesso');
      // Toast será mostrado na página pai (Queues)
    } catch (error) {
      console.error('❌ Erro ao salvar fila:', error);
      // Propagar erro para página pai tratar
      throw error;
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
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            size="lg"
            variant="bordered"
            color="default"
          />
        </Box>

        {/* LINHA 2 - Container Cores + Container Ícones */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3, alignItems: 'stretch' }}>
          {/* Container de Cores */}
          <Box sx={{ 
            flex: 1,
            p: 2,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'var(--text-primary)' }}>
              Escolher Cor
            </Typography>
            <TwitterColorPicker
              color={formData.color}
              onChange={(color) => handleInputChange('color', color.hex)}
              width="100%"
              usedColors={usedColors}
            />
          </Box>

          {/* Container de Ícones */}
          <Box sx={{ 
            flex: 1,
            p: 2,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'var(--text-primary)' }}>
              Ícone da Fila
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              justifyContent: 'center',
              flex: 1,
              alignContent: 'flex-start'
            }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Fechar Ticket
                  </Typography>
                  <CustomTooltip title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#fff' }}>
                        Como funciona:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#fff', lineHeight: 1.5 }}>
                        • Tickets são fechados automaticamente após transferência
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#fff', lineHeight: 1.5 }}>
                        • Ideal para filas de triagem e direcionamento
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.5 }}>
                        • Não há necessidade de acompanhamento posterior
                      </Typography>
                    </Box>
                  }>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                      <Info size={16} color="#00C307" />
                    </Box>
                  </CustomTooltip>
                </Box>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Ativar Rodízio
                  </Typography>
                  <CustomTooltip title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#fff' }}>
                        Sistema de Distribuição:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#fff', lineHeight: 1.5 }}>
                        • Distribui tickets automaticamente entre atendentes
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#fff', lineHeight: 1.5 }}>
                        • Garante carga equilibrada de trabalho
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#fff', lineHeight: 1.5 }}>
                        • Distribuição sequencial por ordem de disponibilidade
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.5 }}>
                        • Tempo define intervalo mínimo entre distribuições
                      </Typography>
                    </Box>
                  }>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                      <Info size={16} color="#00C307" />
                    </Box>
                  </CustomTooltip>
                </Box>
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