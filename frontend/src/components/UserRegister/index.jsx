import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Switch, FormControlLabel } from '@mui/material';
import { 
  User, MapPin, Settings, Shield, CreditCard, ChevronLeft, ChevronRight, Save,
  Eye, MessageSquare, X, BarChart3, Users, Zap, Monitor
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { PasswordInput } from '../ui/PasswordInput';
import { DatePicker } from '../ui/DatePicker';
import { TimePicker } from '../ui/TimePicker';
import FormButtons from '../ui/FormButtons';

const UserRegister = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Dados Gerais
    nome: '',
    telefone: '',
    cargo: '',
    departamento: '',
    dataAdmissao: null,
    sobre: '',
    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    // Configurações
    horarioInicio: '',
    horarioFim: '',
    tema: '',
    menuPadrao: '',
    fila: '',
    conexao: '',
    perfil: '',
    mensagemDespedida: '',
    // Permissões
    permissoes: {
      visualizarChamadosSemFila: false,
      verConversasOutrasFilas: false,
      permitirFecharTicketsPendentes: false,
      verDashboard: false,
      permitirGrupos: false,
      verConversasOutrosUsuarios: false,
      acoesConexoes: false,
      verPainelAtendimentos: false,
    },
    // Dados da Conta
    email: '',
    senha: '',
    confirmarSenha: ''
  });

  const steps = [
    { label: 'Dados Gerais', icon: User },
    { label: 'Endereço', icon: MapPin },
    { label: 'Configurações', icon: Settings },
    { label: 'Permissões', icon: Shield },
    { label: 'Dados da Conta', icon: CreditCard }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission, checked) => {
    setFormData(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [permission]: checked
      }
    }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Dados do formulário:', formData);
    // Aqui você enviaria os dados para o backend
    alert('Usuário cadastrado com sucesso!');
    onClose();
  };

  // Step 1: Dados Gerais
  const renderDadosGerais = () => (
    <Box>
      {/* Linha 1: Nome e Telefone */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Nome Completo
          </Typography>
          <Input
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            placeholder="Digite o nome completo"
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Telefone
          </Typography>
          <Input
            value={formData.telefone}
            onChange={(e) => handleInputChange('telefone', e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </Box>
      </Box>

      {/* Linha 2: Cargo, Data de Admissão e Departamento */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: 3, 
        mb: 3,
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr',
          gap: 2,
        }
      }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Cargo
          </Typography>
          <Input
            value={formData.cargo}
            onChange={(e) => handleInputChange('cargo', e.target.value)}
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Data de Admissão
          </Typography>
          <DatePicker
            value={formData.dataAdmissao}
            onChange={(date) => handleInputChange('dataAdmissao', date)}
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Departamento
          </Typography>
          <Select
            value={formData.departamento}
            onChange={(e) => handleInputChange('departamento', e.target.value)}
          >
            <option value="">Selecione um departamento</option>
            <option value="ti">Tecnologia da Informação</option>
            <option value="rh">Recursos Humanos</option>
            <option value="vendas">Vendas</option>
            <option value="marketing">Marketing</option>
            <option value="financeiro">Financeiro</option>
          </Select>
        </Box>
      </Box>

      {/* Linha 3: Sobre */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Sobre
        </Typography>
        <Textarea
          rows={3}
          value={formData.sobre}
          onChange={(e) => handleInputChange('sobre', e.target.value)}
          placeholder="Informações adicionais sobre o usuário..."
        />
      </Box>
    </Box>
  );

  // Step 2: Endereço
  const renderEndereco = () => (
    <Box>
      {/* Linha 1: CEP e Endereço */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 3, mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            CEP
          </Typography>
          <Input
            value={formData.cep}
            onChange={(e) => handleInputChange('cep', e.target.value)}
            placeholder="00000-000"
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Endereço
          </Typography>
          <Input
            value={formData.endereco}
            onChange={(e) => handleInputChange('endereco', e.target.value)}
            placeholder="Rua, Avenida, etc."
          />
        </Box>
      </Box>

      {/* Linha 2: Número, Bairro e Complemento */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 3, mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Número
          </Typography>
          <Input
            value={formData.numero}
            onChange={(e) => handleInputChange('numero', e.target.value)}
            placeholder="123"
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Bairro
          </Typography>
          <Input
            value={formData.bairro}
            onChange={(e) => handleInputChange('bairro', e.target.value)}
            placeholder="Nome do bairro"
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Complemento
          </Typography>
          <Input
            value={formData.complemento}
            onChange={(e) => handleInputChange('complemento', e.target.value)}
            placeholder="Apto, Sala, etc."
          />
        </Box>
      </Box>

      {/* Linha 3: Cidade e Estado */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Cidade
          </Typography>
          <Input
            value={formData.cidade}
            onChange={(e) => handleInputChange('cidade', e.target.value)}
            placeholder="Nome da cidade"
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Estado
          </Typography>
          <Select
            value={formData.estado}
            onChange={(e) => handleInputChange('estado', e.target.value)}
          >
            <option value="">Selecione um estado</option>
            <option value="AC">Acre</option>
            <option value="AL">Alagoas</option>
            <option value="AP">Amapá</option>
            <option value="AM">Amazonas</option>
            <option value="BA">Bahia</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="ES">Espírito Santo</option>
            <option value="GO">Goiás</option>
            <option value="MA">Maranhão</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="MG">Minas Gerais</option>
            <option value="PA">Pará</option>
            <option value="PB">Paraíba</option>
            <option value="PR">Paraná</option>
            <option value="PE">Pernambuco</option>
            <option value="PI">Piauí</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="RO">Rondônia</option>
            <option value="RR">Roraima</option>
            <option value="SC">Santa Catarina</option>
            <option value="SP">São Paulo</option>
            <option value="SE">Sergipe</option>
            <option value="TO">Tocantins</option>
          </Select>
        </Box>
      </Box>
    </Box>
  );

  // Step 3: Configurações
  const renderConfiguracoes = () => (
    <Box>
      {/* Linha 1: Horários, Tema e Menu - 4 campos em uma linha */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr 1fr', 
        gap: 3, 
        mb: 3,
        '@media (max-width: 1024px)': {
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
        },
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr',
          gap: 2,
        }
      }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Horário de Início
          </Typography>
          <TimePicker
            value={formData.horarioInicio}
            onChange={(e) => handleInputChange('horarioInicio', e.target.value)}
            placeholder="Selecione o horário de início"
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Horário de Fim
          </Typography>
          <TimePicker
            value={formData.horarioFim}
            onChange={(e) => handleInputChange('horarioFim', e.target.value)}
            placeholder="Selecione o horário de fim"
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Tema
          </Typography>
          <Select
            value={formData.tema}
            onChange={(e) => handleInputChange('tema', e.target.value)}
          >
            <option value="">Selecione um tema</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
            <option value="auto">Automático</option>
          </Select>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Menu Padrão
          </Typography>
          <Select
            value={formData.menuPadrao}
            onChange={(e) => handleInputChange('menuPadrao', e.target.value)}
          >
            <option value="">Selecione uma página</option>
            <option value="dashboard">Dashboard</option>
            <option value="tickets">Tickets</option>
            <option value="contacts">Contatos</option>
            <option value="campaigns">Campanhas</option>
          </Select>
        </Box>
      </Box>

      {/* Linha 2: Fila, Conexão, Perfil - 3 campos em uma linha */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: 3, 
        mb: 3,
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr',
          gap: 2,
        }
      }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Fila
          </Typography>
          <Select
            value={formData.fila}
            onChange={(e) => handleInputChange('fila', e.target.value)}
          >
            <option value="">Selecione uma fila</option>
            <option value="atendimento">Atendimento</option>
            <option value="vendas">Vendas</option>
            <option value="suporte">Suporte</option>
            <option value="financeiro">Financeiro</option>
            <option value="comercial">Comercial</option>
          </Select>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Conexão
          </Typography>
          <Select
            value={formData.conexao}
            onChange={(e) => handleInputChange('conexao', e.target.value)}
          >
            <option value="">Selecione uma conexão</option>
            <option value="whatsapp1">WhatsApp 1</option>
            <option value="whatsapp2">WhatsApp 2</option>
            <option value="whatsapp3">WhatsApp 3</option>
            <option value="telegram">Telegram</option>
            <option value="messenger">Messenger</option>
          </Select>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Perfil
          </Typography>
          <Select
            value={formData.perfil}
            onChange={(e) => handleInputChange('perfil', e.target.value)}
          >
            <option value="">Selecione um perfil</option>
            <option value="admin">Administrador</option>
            <option value="supervisor">Supervisor</option>
            <option value="user">Usuário</option>
            <option value="atendente">Atendente</option>
          </Select>
        </Box>
      </Box>

      {/* Linha 3: Mensagem de Despedida */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Mensagem de Despedida <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(Opcional)</span>
        </Typography>
        <Textarea
          rows={3}
          value={formData.mensagemDespedida}
          onChange={(e) => handleInputChange('mensagemDespedida', e.target.value)}
          placeholder="Digite uma mensagem de despedida personalizada para quando o atendimento for finalizado..."
        />
      </Box>
    </Box>
  );

  // Step 4: Permissões
  const renderPermissoes = () => {
    const permissions = [
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
      <Box>
        <Typography variant="body1" sx={{ mb: 3, fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Selecione as permissões para este usuário:
        </Typography>

        {/* Grid de Permissões - 2 colunas */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 3, 
          mb: 4,
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
          }
        }}>
          {permissions.map((permission) => {
            const Icon = permission.icon;
            const isChecked = formData.permissoes[permission.key];
            
            return (
              <Box
                key={permission.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  backgroundColor: 'var(--bg-primary)',
                  border: `1px solid ${isChecked ? 'var(--color-accent)' : 'var(--border-primary)'}`,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'var(--color-accent)',
                    backgroundColor: 'var(--bg-secondary)',
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
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      mb: 0.5
                    }}
                  >
                    {permission.label}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'var(--text-secondary)',
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
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'var(--bg-secondary, #f9fafb)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', mb: 1 }}>
            Resumo das Permissões:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {Object.values(formData.permissoes).filter(Boolean).length} de {permissions.length} permissões selecionadas
          </Typography>
        </Box>
      </Box>
    );
  };

  // Step 5: Dados da Conta
  const renderDadosConta = () => (
    <Box>
      {/* Email */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Email
        </Typography>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
      </Box>

      {/* Senhas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 4 }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Senha
          </Typography>
          <PasswordInput
            value={formData.senha}
            onChange={(e) => handleInputChange('senha', e.target.value)}
          />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Confirmar Senha
          </Typography>
          <PasswordInput
            value={formData.confirmarSenha}
            onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
          />
        </Box>
      </Box>

      {/* Password Requirements */}
      <Box sx={{ mb: 4, p: 3, backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
        <Typography variant="body2" sx={{ mb: 2, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Requisitos da Senha:
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '13px', color: 'var(--text-secondary)', mb: 0.5 }}>
            • Mínimo de 8 caracteres - quanto mais, melhor.
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '13px', color: 'var(--text-secondary)', mb: 0.5 }}>
            • Pelo menos um caractere minúsculo.
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            • Pelo menos um número, símbolo ou espaço em branco.
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderDadosGerais();
      case 1:
        return renderEndereco();
      case 2:
        return renderConfiguracoes();
      case 3:
        return renderPermissoes();
      case 4:
        return renderDadosConta();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh'
    }}>
      <Box sx={{ padding: 3 }}>
        {/* Container Superior - Header do Cadastro */}
        <Card sx={{ 
          marginBottom: 3, 
          overflow: 'hidden',
          borderRadius: '16px'
        }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-green-hover, #00e608) 100%)',
            color: 'white',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 3
          }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <User size={32} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '28px', mb: 1 }}>
                Cadastrar Novo Usuário
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '16px' }}>
                Preencha os dados para criar um novo usuário - Passo {activeStep + 1} de {steps.length}
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Container Steps Indicator */}
        <Card sx={{ 
          marginBottom: 3,
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              overflow: 'auto',
              minWidth: '600px'
            }}>
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;
                
                return (
                  <React.Fragment key={index}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      opacity: isActive || isCompleted ? 1 : 0.4
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        minWidth: 40,
                        minHeight: 40,
                        maxWidth: 40,
                        maxHeight: 40,
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? 'var(--color-accent)' : isActive ? 'var(--color-accent)' : 'var(--border-primary)',
                        color: isCompleted || isActive ? 'white' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.3s ease'
                      }}>
                        <Icon size={18} />
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '13px'
                        }}
                      >
                        {step.label}
                      </Typography>
                    </Box>
                    {index < steps.length - 1 && (
                      <Box sx={{
                        flex: 1,
                        height: '2px',
                        backgroundColor: index < activeStep ? 'var(--color-accent)' : 'var(--border-primary)',
                        mx: 2,
                        transition: 'all 0.3s ease'
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Container Principal - Formulário */}
        <Card sx={{ 
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 4, fontWeight: 600, fontSize: '18px', color: 'var(--text-primary)' }}>
              {steps[activeStep].label}
            </Typography>

            {/* Conteúdo do Step */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <FormButtons
              // Layout - Todos os botões alinhados à direita
              justifyContent="flex-end"
              gap={2}
              
              // Botão Voltar (só aparece após primeiro step)
              showBack={activeStep > 0}
              onBack={handleBack}
              backText="Voltar"
              backIcon={<ChevronLeft size={16} />}
              
              // Botão Cancelar (sempre visível)
              showCancel={true}
              onCancel={onClose}
              cancelText="Cancelar"
              
              // Botão Próximo/Salvar (muda no último step)
              showSave={true}
              onSave={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              saveText={activeStep === steps.length - 1 ? "Cadastrar Usuário" : "Próximo"}
              saveIcon={activeStep === steps.length - 1 ? <Save size={16} /> : <ChevronRight size={16} />}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default UserRegister;