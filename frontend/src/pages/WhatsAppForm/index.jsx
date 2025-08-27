import React, { useState, useEffect, useContext } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Box, Typography, Card, Switch, FormControlLabel, Grid, Paper, Chip, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import { Network, Wifi, BarChart3, Settings, MessageCircle, Bot, Star, Workflow, Clock, Zap, Users, Import, Globe, Share2, Timer, HelpCircle, RefreshCw, Copy, Key, Wand2, Heart, Moon, Trash2 } from "lucide-react";
import { toast } from "../../components/ui/ToastProvider";
import { useHistory } from "react-router-dom";
import moment from "moment";

import PageLayout from "../../components/PageLayout";
import ModernTabs from "../../components/ModernTabs";
import ModernFormGrid from "../../components/ModernFormGrid";
import GradientButton from "../../components/GradientButton";
import QueueSelect from "../../components/QueueSelect";
import SchedulesForm from "../../components/SchedulesForm";
import CustomTooltip from "../../components/CustomTooltip";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import useCompanySettings from "../../hooks/useSettings/companySettings";

// Schema de validação
const WhatsAppSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Nome muito curto!")
    .max(50, "Nome muito longo!")
    .required("Nome é obrigatório"),
  greetingMessage: Yup.string(),
  farewellMessage: Yup.string(),
  outOfHoursMessage: Yup.string(),
});

const WhatsAppForm = ({ onClose, selectedWhatsApp }) => {
  const { user } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();
  const { get: getSettings } = useCompanySettings();
  const history = useHistory();
  
  // Estados
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(false);
  const [queues, setQueues] = useState([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [flowBuilders, setFlowBuilders] = useState([]);
  const [planConfig, setPlanConfig] = useState({ plan: {} });
  const [schedulesEnabled, setSchedulesEnabled] = useState(false);
  
  // Estados para aba Geral
  const [enableImportMessage, setEnableImportMessage] = useState(false);
  const [importOldMessagesGroups, setImportOldMessagesGroups] = useState(false);
  const [closedTicketsPostImported, setClosedTicketsPostImported] = useState(false);
  const [importOldMessages, setImportOldMessages] = useState(moment().add(-1, "days").format("YYYY-MM-DDTHH:mm"));
  const [importRecentMessages, setImportRecentMessages] = useState(moment().add(-1, "minutes").format("YYYY-MM-DDTHH:mm"));
  const [groupAsTicket, setGroupAsTicket] = useState(false);
  const [importRecentMessageNumber, setImportRecentMessageNumber] = useState(100);
  const [timeSendQueue, setTimeSendQueue] = useState(0);
  const [sendIdQueue, setSendIdQueue] = useState(null);
  const [autoToken, setAutoToken] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);
  
  // Valores iniciais do formulário
  const initialValues = selectedWhatsApp ? {
    // Modo edição - preencher com dados existentes
    name: selectedWhatsApp.name || "",
    isDefault: selectedWhatsApp.isDefault || false,
    allowGroup: selectedWhatsApp.allowGroup || false,
    isMultidevice: selectedWhatsApp.isMultidevice !== false, // padrão true
    channel: selectedWhatsApp.channel || "whatsapp",
    queueIdImportMessages: selectedWhatsApp.queueIdImportMessages || null,
    greetingMessage: selectedWhatsApp.greetingMessage || "",
    farewellMessage: selectedWhatsApp.farewellMessage || "",
    outOfHoursMessage: selectedWhatsApp.outOfHoursMessage || "",
    collectiveVacationMessage: selectedWhatsApp.collectiveVacationMessage || "",
    collectiveVacationStart: selectedWhatsApp.collectiveVacationStart || "",
    collectiveVacationEnd: selectedWhatsApp.collectiveVacationEnd || "",
    maxUseBotQueues: selectedWhatsApp.maxUseBotQueues || 3,
    timeUseBotQueues: selectedWhatsApp.timeUseBotQueues || 0,
    expiresTicket: selectedWhatsApp.expiresTicket || 0,
    expiresInactiveMessage: selectedWhatsApp.expiresInactiveMessage || "",
    timeInactiveMessage: selectedWhatsApp.timeInactiveMessage || "",
    inactiveMessage: selectedWhatsApp.inactiveMessage || "",
    timeCreateNewTicket: selectedWhatsApp.timeCreateNewTicket || 0,
    whenExpiresTicket: selectedWhatsApp.whenExpiresTicket || "0",
    timeSendQueue: selectedWhatsApp.timeSendQueue || 0,
    sendIdQueue: selectedWhatsApp.sendIdQueue || null,
    ratingMessage: selectedWhatsApp.ratingMessage || "",
    maxUseBotQueuesNPS: selectedWhatsApp.maxUseBotQueuesNPS || 0,
    expiresTicketNPS: selectedWhatsApp.expiresTicketNPS || 0,
    flowIdWelcome: selectedWhatsApp.flowIdWelcome || null,
    flowIdNotPhrase: selectedWhatsApp.flowIdNotPhrase || null,
  } : {
    // Modo criação - valores padrão
    name: "",
    isDefault: false,
    allowGroup: false,
    isMultidevice: true,
    channel: "whatsapp",
    queueIdImportMessages: null,
    greetingMessage: "",
    farewellMessage: "",
    outOfHoursMessage: "",
    collectiveVacationMessage: "",
    collectiveVacationStart: "",
    collectiveVacationEnd: "",
    maxUseBotQueues: 3,
    timeUseBotQueues: 0,
    expiresTicket: 0,
    expiresInactiveMessage: "",
    timeInactiveMessage: "",
    inactiveMessage: "",
    timeCreateNewTicket: 0,
    whenExpiresTicket: "0",
    timeSendQueue: 0,
    sendIdQueue: null,
    timeCreateNewTicket: 10,
    ratingMessage: "",
    maxUseBotQueuesNPS: 0,
    expiresTicketNPS: 0,
    whenExpiresTicket: "enabled",
    flowIdWelcome: null,
    flowIdNotPhrase: null,
  };

  // Funções relacionadas ao token
  function generateRandomCode(length) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyvz0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      code += charset.charAt(randomIndex);
    }
    return code;
  }

  const handleRefreshToken = () => {
    const newToken = generateRandomCode(30);
    setAutoToken(newToken);
    setTokenCopied(false);
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(autoToken);
      setTokenCopied(true);
      toast.success("Token copiado para área de transferência!");
      setTimeout(() => setTokenCopied(false), 3000);
    } catch (err) {
      toast.error("Erro ao copiar token");
    }
  };

  // UseEffect para gerar token inicial
  useEffect(() => {
    if (!autoToken) {
      setAutoToken(generateRandomCode(30));
    }
  }, []);

  // Mensagens predefinidas para cada campo
  const predefinedMessages = {
    greetingMessage: [
      "👋 Olá! Seja muito bem-vindo(a) ao nosso atendimento! Como posso ajudá-lo(a) hoje?",
      "🌟 Oi! É um prazer tê-lo(a) aqui conosco! Em que posso ser útil?",
      "😊 Olá! Bem-vindo(a)! Nossa equipe está pronta para atendê-lo(a). Como posso ajudar?",
      "🎉 Seja bem-vindo(a)! Estamos aqui para oferecer o melhor atendimento. No que posso auxiliá-lo(a)?",
      "💬 Olá! Muito prazer em atendê-lo(a)! Digite sua dúvida que já vamos ajudar!"
    ],
    farewellMessage: [
      "😊 Foi um prazer atendê-lo(a)! Obrigado por escolher nossos serviços. Até a próxima!",
      "🌟 Muito obrigado pelo contato! Esperamos ter ajudado. Conte sempre conosco!",
      "💙 Agradecemos pela preferência! Se precisar de mais alguma coisa, estaremos aqui.",
      "🎯 Atendimento finalizado com sucesso! Obrigado pela confiança. Volte sempre!",
      "✨ Obrigado por nos escolher! Sua satisfação é nossa prioridade. Até logo!"
    ],
    outOfHoursMessage: [
      "🌙 Oi! No momento estamos fora do horário comercial. Nosso atendimento funciona de Segunda a Sexta, das 8h às 18h. Deixe sua mensagem que retornaremos assim que possível!",
      "⏰ Olá! Você nos procurou fora do nosso horário de funcionamento. Atendemos de Segunda a Sexta, das 9h às 17h. Em breve retornaremos seu contato!",
      "🕐 Oi! Estamos fora do horário de atendimento no momento. Funcionamos de Segunda a Sexta, das 8h às 17h. Sua mensagem é importante para nós, responderemos em breve!",
      "🌅 Olá! Você entrou em contato fora do nosso expediente. Horário de funcionamento: Segunda a Sexta, das 8h30 às 17h30. Aguarde nosso retorno!",
      "💤 Oi! Nosso atendimento está pausado agora. Funcionamos de Segunda a Sexta, das 9h às 18h. Deixe sua mensagem que logo te respondemos!"
    ],
    inactiveMessage: [
      "⏰ Olá! Notamos que você está há um tempo sem responder. Se precisar de ajuda, estaremos aqui para atendê-lo!",
      "🕐 Oi! Percebemos que você ficou um tempo sem interagir. Ainda está aí? Podemos ajudar em algo?",
      "⌚ Devido ao tempo de inatividade, este chat pode ser encerrado em breve. Responda se ainda precisar de atendimento!",
      "🔔 Notamos que você não respondeu por um tempo. Se ainda precisar de ajuda, é só enviar uma mensagem!",
      "💬 Oi! Você está aí? Ficou um tempo sem responder. Se precisar de algo, estaremos prontos para ajudar!"
    ],
    expiresInactiveMessage: [
      "⏰ Devido ao tempo de inatividade, este atendimento será finalizado. Obrigado pelo contato!",
      "🕐 Por inatividade, encerramos este chat. Foi um prazer atendê-lo! Volte sempre que precisar.",
      "⌚ Chat finalizado por falta de resposta. Agradecemos o contato e estaremos aqui quando precisar!",
      "🔔 Atendimento encerrado devido à inatividade. Obrigado pela preferência! Até a próxima.",
      "💤 Por questão de organização, este chat foi finalizado por inatividade. Conte conosco sempre!"
    ]
  };

  // Função para gerar mensagem automática
  const generateAutoMessage = (field, setFieldValue) => {
    const messages = predefinedMessages[field];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setFieldValue(field, randomMessage);
  };

  // Função para gerar mensagens NPS
  const generateNPSMessages = (fieldName, setFieldValue) => {
    const npsMessages = [
      "⭐ Como você avalia nosso atendimento? De 0 a 10, o quanto você nos recomendaria para um amigo?",
      "🌟 Que tal avaliar nossa conversa? Numa escala de 0 a 10, qual nota você daria para nosso atendimento?",
      "💫 Sua opinião é muito importante! De 0 a 10, o quanto você recomendaria nossos serviços?",
      "✨ Gostaríamos de saber sua experiência! Numa escala de 0 a 10, como foi nosso atendimento?",
      "🎯 Ajude-nos a melhorar! De 0 a 10, qual sua nota para o atendimento que recebeu?"
    ];
    
    const randomMessage = npsMessages[Math.floor(Math.random() * npsMessages.length)];
    setFieldValue(fieldName, randomMessage);
  };

  // Função para gerar mensagens de férias
  const generateVacationMessage = (fieldName, setFieldValue) => {
    const vacationMessages = [
      "🏝️ Estamos em férias coletivas! Retornaremos em breve para atendê-lo com todo carinho e dedicação!",
      "🌴 Nossa equipe está em recesso! Voltaremos revigorados para oferecer o melhor atendimento. Aguarde nosso retorno!",
      "☀️ Período de férias coletivas! Estaremos de volta em breve com energia renovada para cuidar de você!",
      "🏖️ Momentaneamente em férias! Retornaremos com ainda mais disposição para atendê-lo da melhor forma!",
      "🌺 Férias coletivas em andamento! Em breve estaremos de volta para continuar cuidando de você com excelência!"
    ];
    
    const randomMessage = vacationMessages[Math.floor(Math.random() * vacationMessages.length)];
    setFieldValue(fieldName, randomMessage);
  };

  // Função para gerar mensagens de inatividade
  const generateInactivityMessage = (fieldName, setFieldValue) => {
    const inactivityMessages = [
      "⏰ Olá! Notamos que você está há um tempo sem responder. Se precisar de ajuda, estaremos aqui para atendê-lo!",
      "🕐 Oi! Percebemos que você ficou um tempo sem interagir. Ainda está aí? Podemos ajudar em algo?",
      "⌚ Devido ao tempo de inatividade, este chat pode ser encerrado em breve. Responda se ainda precisar de atendimento!",
      "🔔 Notamos que você não respondeu por um tempo. Se ainda precisar de ajuda, é só enviar uma mensagem!",
      "⏳ Olá! Como não houve resposta por um período, este atendimento pode ser finalizado. Ainda precisa de ajuda?"
    ];
    
    const randomMessage = inactivityMessages[Math.floor(Math.random() * inactivityMessages.length)];
    setFieldValue(fieldName, randomMessage);
  };

  // Definir abas com ícones (com condicionais)
  const getFilteredTabs = () => {
    const baseTabs = [
      { 
        id: 'geral', 
        label: 'Geral', 
        icon: <Settings size={18} />
      },
      { 
        id: 'integracoes', 
        label: 'Integrações', 
        icon: <Zap size={18} />
      },
      { 
        id: 'mensagens', 
        label: 'Mensagens', 
        icon: <MessageCircle size={18} />
      },
      { 
        id: 'chatbot', 
        label: 'ChatBot', 
        icon: <Bot size={18} />
      },
      { 
        id: 'nps', 
        label: 'NPS', 
        icon: <Star size={18} />
      },
      { 
        id: 'fluxo', 
        label: 'Fluxo Padrão', 
        icon: <Workflow size={18} />
      }
    ];

    // Adicionar tab Horários somente se estiver habilitada
    if (schedulesEnabled) {
      baseTabs.push({
        id: 'horarios', 
        label: 'Horários', 
        icon: <Clock size={18} />
      });
    }

    return baseTabs;
  };

  const tabs = getFilteredTabs();

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar filas
        const { data: queuesData } = await api.get("/queue");
        setQueues(queuesData);

        // Verificar configuração de horários
        const settingSchedules = await getSettings({
          column: "scheduleType"
        });
        setSchedulesEnabled(settingSchedules.scheduleType === "connection");

        // Carregar plano da empresa
        const planData = await getPlanCompany(undefined, user.companyId);
        setPlanConfig(planData);

        // Carregar flowbuilders se disponível
        if (planData?.plan?.useIntegrations) {
          const { data: flowsData } = await api.get("/flowbuilder");
          setFlowBuilders(flowsData?.records || []);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData();
  }, []);

  // Função para enviar formulário
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      
      console.log('=== SUBMITTING WHATSAPP FORM ===');
      console.log('selectedWhatsApp:', selectedWhatsApp);
      console.log('form values:', values);
      
      const whatsappData = {
        ...values,
        companyId: user.companyId,
        queueIds: selectedQueueIds,
        importOldMessages: enableImportMessage ? importOldMessages : null,
        importRecentMessages: enableImportMessage ? importRecentMessages : null,
        importOldMessagesGroups: importOldMessagesGroups,
        closedTicketsPostImported: closedTicketsPostImported,
        token: autoToken,
        schedules,
      };

      console.log('whatsappData to send:', whatsappData);
      
      if (selectedWhatsApp) {
        // Modo edição - usar PUT
        console.log(`PUT /whatsapp/${selectedWhatsApp.id}`);
        const response = await api.put(`/whatsapp/${selectedWhatsApp.id}`, whatsappData);
        console.log('PUT response:', response);
        toast.success("Conexão WhatsApp atualizada com sucesso!");
      } else {
        // Modo criação - usar POST
        console.log('POST /whatsapp');
        const response = await api.post("/whatsapp", whatsappData);
        console.log('POST response:', response);
        toast.success("Conexão WhatsApp criada com sucesso!");
      }
      
      // Fechar o formulário - adicionar delay para garantir que o backend processou
      setTimeout(() => {
        onClose?.();
      }, 100);
      
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Função para lidar com importação de mensagens
  const handleEnableImportMessage = (event) => {
    setEnableImportMessage(event.target.checked);
  };

  // Componente de Switch moderno
  const ModernSwitch = ({ checked, onChange, label, description, color = "var(--color-accent)", icon }) => {
    const handleChange = (event) => {
      event.stopPropagation();
      onChange(event);
    };

    const getColorRgba = (colorHex) => {
      if (color === "var(--color-accent)") return "0,195,7";
      if (colorHex === "#6366F1") return "99,102,241";
      if (colorHex === "#8B5CF6") return "139,92,246";
      if (colorHex === "#EF4444") return "239,68,68";
      if (colorHex === "#10B981") return "16,185,129";
      if (colorHex === "#F59E0B") return "245,158,11";
      return "0,195,7";
    };

    const rgbaColor = getColorRgba(color);

    return (
      <Paper sx={{
        p: 2.5,
        backgroundColor: checked ? `rgba(${rgbaColor}, 0.08)` : 'var(--bg-primary)',
        border: `2px solid ${checked ? color : 'var(--border-primary)'}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        height: '110px !important',
        width: '100% !important',
        minHeight: '110px !important',
        maxHeight: '110px !important',
        minWidth: '100% !important',
        maxWidth: '100% !important',
        display: 'flex !important',
        flexDirection: 'column !important',
        boxSizing: 'border-box !important',
        '&:hover': {
          backgroundColor: checked ? `rgba(${rgbaColor}, 0.12)` : 'var(--bg-secondary)',
          borderColor: color,
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 20px rgba(${rgbaColor}, 0.15)`
        }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          width: '100%', 
          height: '100%' 
        }}>
          <Switch
            checked={checked}
            onChange={handleChange}
            onClick={(e) => e.stopPropagation()}
            sx={{
              mt: -0.5,
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: color,
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: color,
              },
            }}
          />
          <Box sx={{ 
            ml: 1, 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between'
          }} onClick={handleChange}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              {icon && <Box sx={{ mr: 1, color: checked ? color : 'var(--text-gray-medium)' }}>{icon}</Box>}
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600,
                color: checked ? color : 'var(--text-gray-medium)',
                fontSize: '0.85rem',
                flex: 1
              }}>
                {label}
              </Typography>
              {checked && (
                <Chip 
                  label="Ativo" 
                  size="small" 
                  sx={{ 
                    backgroundColor: color,
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 18
                  }} 
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ 
              color: 'var(--text-gray-medium)',
              fontSize: '0.75rem',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              height: '30px',
              mt: 'auto'
            }}>
              {description}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  // Renderizar campos para cada aba
  const renderTabContent = (tabId, values, errors, touched, setFieldValue) => {
    switch (tabId) {
      case 'geral':
        return (
          <Box>
            {/* Campo Nome da Conexão */}
            <Box sx={{ mb: 3 }}>
              <TextField
                name="name"
                label="Nome da Conexão"
                type="text"
                required
                placeholder="Ex: WhatsApp Principal"
                value={values.name || ''}
                onChange={(e) => setFieldValue('name', e.target.value)}
                error={touched.name && !!errors.name}
                helperText={touched.name && errors.name}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    '& fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--color-accent)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--color-accent)',
                      borderWidth: '2px'
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    '&.Mui-focused': {
                      color: 'var(--color-accent)',
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'var(--text-gray-medium)',
                    fontSize: '0.875rem',
                    '&::placeholder': {
                      color: 'var(--text-gray-medium)',
                      opacity: 1
                    }
                  }
                }}
              />
            </Box>

            {/* Seção de Switches Coloridos */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ 
                color: 'var(--text-gray-medium)',
                fontWeight: 600,
                mb: 3,
                display: 'flex',
                alignItems: 'center'
              }}>
                <Settings size={20} style={{ marginRight: 8 }} />
                Configurações de Conexão
              </Typography>
              
              <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    height: '110px',
                    width: '100%',
                    display: 'flex'
                  }}>
                    <ModernSwitch
                      checked={values.isDefault || false}
                      onChange={(e) => setFieldValue('isDefault', e.target.checked)}
                      label="Conexão Padrão"
                      description="Conexão principal para novos atendimentos"
                      color="var(--color-accent)"
                      icon={<Star size={16} />}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    height: '110px',
                    width: '100%',
                    display: 'flex'
                  }}>
                    <ModernSwitch
                      checked={values.allowGroup || false}
                      onChange={(e) => setFieldValue('allowGroup', e.target.checked)}
                      label="Permitir Grupos"
                      description="Receber mensagens de grupos"
                      color="#6366F1"
                      icon={<Users size={16} />}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    height: '110px',
                    width: '100%',
                    display: 'flex'
                  }}>
                    <ModernSwitch
                      checked={groupAsTicket}
                      onChange={(e) => setGroupAsTicket(e.target.checked)}
                      label="Tratar Grupos como Tickets"
                      description="Criar tickets para cada grupo"
                      color="#8B5CF6"
                      icon={<Globe size={16} />}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    height: '110px',
                    width: '100%',
                    display: 'flex'
                  }}>
                    <ModernSwitch
                      checked={enableImportMessage}
                      onChange={handleEnableImportMessage}
                      label="Importar Mensagens"
                      description="Importar histórico de mensagens"
                      color="#EF4444"
                      icon={<Import size={16} />}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Seção de Importação de Mensagens - Condicional */}
            {enableImportMessage && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ 
                  color: 'var(--text-gray-medium)',
                  fontWeight: 600,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Import size={20} style={{ marginRight: 8 }} />
                  Configurações de Importação
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ height: '100%' }}>
                      <ModernSwitch
                        checked={importOldMessagesGroups}
                        onChange={(e) => setImportOldMessagesGroups(e.target.checked)}
                        label="Importar de Grupos"
                        description="Incluir mensagens de grupos do WhatsApp na importação"
                        color="#10B981"
                        icon={<Users size={16} />}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ height: '100%' }}>
                      <ModernSwitch
                        checked={closedTicketsPostImported}
                        onChange={(e) => setClosedTicketsPostImported(e.target.checked)}
                        label="Fechar Tickets Automaticamente"
                        description="Fechar tickets após importação ser concluída"
                        color="#F59E0B"
                        icon={<Settings size={16} />}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <ModernFormGrid
                    fields={[
                      {
                        name: 'importOldMessages',
                        label: 'Data Inicial para Importação',
                        type: 'datetime-local',
                        value: importOldMessages,
                        onChange: (e) => setImportOldMessages(e.target.value),
                        description: 'Data a partir da qual importar mensagens antigas',
                        span: 1,
                        inputProps: {
                          max: moment().add(0, "minutes").format("YYYY-MM-DDTHH:mm"),
                          min: moment().add(-2, "years").format("YYYY-MM-DDTHH:mm")
                        }
                      },
                      {
                        name: 'importRecentMessages',
                        label: 'Data Final para Importação',
                        type: 'datetime-local',
                        value: importRecentMessages,
                        onChange: (e) => setImportRecentMessages(e.target.value),
                        description: 'Data até a qual importar mensagens',
                        span: 1,
                        inputProps: {
                          max: moment().add(0, "minutes").format("YYYY-MM-DDTHH:mm"),
                          min: moment(importOldMessages).format("YYYY-MM-DDTHH:mm")
                        }
                      },
                      {
                        name: 'queueIdImportMessages',
                        label: 'Fila para Mensagens Importadas',
                        type: 'select',
                        options: [
                          { value: '', label: 'Selecionar fila...' },
                          ...queues.map(queue => ({
                            value: queue.id,
                            label: queue.name
                          }))
                        ],
                        description: 'Fila onde serão criados os tickets das mensagens importadas',
                        span: 2,
                        required: enableImportMessage
                      }
                    ]}
                    values={values}
                    errors={errors}
                    touched={touched}
                    showSubmitButton={false}
                  />
                </Box>
              </Box>
            )}

            {/* Seção de Redirecionamento de Fila */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ 
                  color: 'var(--text-gray-medium)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  mr: 1
                }}>
                  <Share2 size={20} style={{ marginRight: 8 }} />
                  Redirecionamento de Fila
                </Typography>
                <CustomTooltip 
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Como funciona o Redirecionamento de Fila:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • <strong>Tempo para Redirecionamento:</strong> Define quantos minutos aguardar antes de redirecionar automaticamente um ticket para outra fila.
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • <strong>Fila de Destino:</strong> Seleciona para qual fila o ticket será redirecionado quando o tempo limite for atingido.
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • <strong>Funcionamento:</strong> Quando um ticket fica sem atendimento pelo tempo definido, ele é automaticamente movido para a fila selecionada.
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#FFA726' }}>
                        💡 Deixe o tempo como "0" para desabilitar esta funcionalidade.
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                  sx={{
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: 'rgba(30, 32, 38, 0.95)',
                      color: 'var(--text-gray-medium)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                      maxWidth: 400,
                      fontSize: '0.875rem'
                    },
                    '& .MuiTooltip-arrow': {
                      color: 'rgba(30, 32, 38, 0.95)',
                      '&::before': {
                        border: '1px solid var(--border-primary)'
                      }
                    }
                  }}
                >
                  <IconButton 
                    size="small"
                    sx={{ 
                      color: 'var(--color-accent)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-bg-light)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <HelpCircle size={18} />
                  </IconButton>
                </CustomTooltip>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="timeSendQueue"
                    label="Tempo para Redirecionamento (minutos)"
                    type="number"
                    value={timeSendQueue}
                    onChange={(e) => setTimeSendQueue(e.target.value)}
                    placeholder="0"
                    helperText="Tempo limite antes de redirecionar para outra fila (0 = desabilitado)"
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          borderColor: 'var(--border-primary)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'var(--color-accent)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--color-accent)',
                          borderWidth: '2px'
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        '&.Mui-focused': {
                          color: 'var(--color-accent)',
                        }
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'var(--text-gray-medium)',
                        fontSize: '0.75rem'
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl 
                    fullWidth 
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          borderColor: 'var(--border-primary)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'var(--color-accent)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--color-accent)',
                          borderWidth: '2px'
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        '&.Mui-focused': {
                          color: 'var(--color-accent)',
                        }
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'var(--text-gray-medium)',
                        fontSize: '0.75rem'
                      }
                    }}>
                    <InputLabel>Fila de Destino</InputLabel>
                    <Select
                      value={sendIdQueue || ''}
                      onChange={(e) => setSendIdQueue(e.target.value)}
                      label="Fila de Destino"
                    >
                      <MenuItem value="">Selecionar fila...</MenuItem>
                      {queues.map(queue => (
                        <MenuItem key={queue.id} value={queue.id}>
                          {queue.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" sx={{ 
                    color: 'var(--text-gray-medium)', 
                    fontSize: '0.75rem',
                    mt: 1,
                    display: 'block'
                  }}>
                    Fila para onde redirecionar os tickets
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Seção de Token para Integrações */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ 
                  color: 'var(--text-gray-medium)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  mr: 1
                }}>
                  <Key size={20} style={{ marginRight: 8 }} />
                  Token para Integrações
                </Typography>
                <CustomTooltip 
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Token de Integração Externa:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • <strong>Função:</strong> Token único para identificar esta conexão em integrações externas via API.
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • <strong>Uso:</strong> Utilize este token em webhooks, APIs externas ou sistemas de terceiros.
                      </Typography>
                      <Typography variant="body2">
                        • <strong>Segurança:</strong> Mantenha este token seguro e renove-o periodicamente.
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                  sx={{
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: 'rgba(30, 32, 38, 0.95)',
                      color: 'var(--text-gray-medium)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                      maxWidth: 400,
                      fontSize: '0.875rem'
                    },
                    '& .MuiTooltip-arrow': {
                      color: 'rgba(30, 32, 38, 0.95)',
                      '&::before': {
                        border: '1px solid var(--border-primary)'
                      }
                    }
                  }}
                >
                  <IconButton 
                    size="small"
                    sx={{ 
                      color: 'var(--color-accent)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-bg-light)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <HelpCircle size={18} />
                  </IconButton>
                </CustomTooltip>
              </Box>
              
              <Box sx={{ 
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 3,
                p: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Token de Integração"
                    value={autoToken}
                    fullWidth
                    disabled
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-secondary)',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        '& fieldset': {
                          borderColor: 'var(--border-primary)',
                        },
                        '&.Mui-disabled fieldset': {
                          borderColor: 'var(--border-primary)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        '&.Mui-disabled': {
                          color: 'var(--text-secondary)',
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'var(--text-gray-medium)',
                        '&.Mui-disabled': {
                          color: 'var(--text-gray-medium)',
                          WebkitTextFillColor: 'var(--text-primary)',
                        }
                      }
                    }}
                  />
                  
                  <CustomTooltip title="Gerar novo token">
                    <IconButton 
                      onClick={handleRefreshToken}
                      sx={{ 
                        color: 'var(--color-success)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          borderColor: 'var(--color-success)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <RefreshCw size={20} />
                    </IconButton>
                  </CustomTooltip>
                  
                  <CustomTooltip title={tokenCopied ? "Token copiado!" : "Copiar token"}>
                    <IconButton 
                      onClick={handleCopyToken}
                      sx={{ 
                        color: tokenCopied ? 'var(--color-primary)' : 'var(--color-accent)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          borderColor: tokenCopied ? 'var(--color-primary)' : 'var(--color-accent)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Copy size={20} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                
                <Typography variant="caption" sx={{ 
                  color: 'var(--text-gray-medium)', 
                  fontSize: '0.75rem',
                  mt: 2,
                  display: 'block'
                }}>
                  Use este token para autenticar integrações externas com esta conexão WhatsApp
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      case 'integracoes':
        return (
          <Box sx={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 3,
            p: 3
          }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6" sx={{ 
                color: 'var(--text-gray-medium)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                flex: 1
              }}>
                <Zap size={20} style={{ marginRight: 8 }} />
                Filas de Atendimento
              </Typography>
              <CustomTooltip 
                title={
                  <Box sx={{ p: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Configuração de Filas de Atendimento:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>Função:</strong> Define quais filas de atendimento esta conexão WhatsApp poderá usar para distribuir os tickets.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>Como funciona:</strong> Quando um cliente envia uma mensagem, o sistema criará um ticket e o distribuirá entre as filas selecionadas.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>Distribuição:</strong> Os tickets são distribuídos automaticamente entre atendentes das filas conforme disponibilidade.
                    </Typography>
                    <Typography variant="body2">
                      • <strong>Recomendação:</strong> Selecione pelo menos uma fila. Múltiplas filas permitem melhor distribuição de carga.
                    </Typography>
                  </Box>
                }
              >
                <IconButton 
                  size="small"
                  sx={{ 
                    color: 'var(--color-accent)',
                    '&:hover': {
                      backgroundColor: 'var(--hover-bg-light)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <HelpCircle size={18} />
                </IconButton>
              </CustomTooltip>
            </Box>
            <QueueSelect
              selectedQueueIds={selectedQueueIds}
              onChange={setSelectedQueueIds}
            />
          </Box>
        );

      case 'mensagens':
        return (
          <Box sx={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 3,
            p: 3
          }}>
            <Typography variant="h6" sx={{ 
              color: 'var(--text-gray-medium)',
              mb: 4,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center'
            }}>
              <MessageCircle size={20} style={{ marginRight: 8 }} />
              Configuração de Mensagens Automáticas
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
              {/* Primeira linha - dois campos lado a lado */}
              <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
                {/* Campo 1 - Boas-vindas */}
                <Box sx={{ width: '50%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ 
                      color: 'var(--text-gray-medium)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1
                    }}>
                      <Heart size={18} style={{ marginRight: 8, color: '#10B981' }} />
                      Mensagem de Boas-vindas
                    </Typography>
                    <CustomTooltip title="Gerar mensagem automática">
                      <IconButton
                        onClick={() => generateAutoMessage('greetingMessage', setFieldValue)}
                        sx={{
                          color: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Wand2 size={18} />
                      </IconButton>
                    </CustomTooltip>
                  </Box>
                  <TextField
                    name="greetingMessage"
                    value={values.greetingMessage || ''}
                    onChange={(e) => setFieldValue('greetingMessage', e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="👋 Olá! Seja muito bem-vindo(a) ao nosso atendimento! Como posso ajudá-lo(a) hoje?"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-secondary)',
                        border: '2px solid #10B981',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover': {
                          borderColor: '#059669',
                          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
                        },
                        '&.Mui-focused': {
                          borderColor: '#059669',
                          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'var(--text-gray-medium)',
                        fontSize: '0.875rem',
                        '&::placeholder': {
                          color: 'var(--text-gray-medium)',
                          opacity: 0.7
                        }
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    color: 'var(--text-gray-medium)', 
                    fontSize: '0.75rem',
                    mt: 1,
                    display: 'block'
                  }}>
                    Mensagem enviada quando um novo contato inicia conversa
                  </Typography>
                </Box>

                {/* Campo 2 - Despedida */}
                <Box sx={{ width: '50%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ 
                      color: 'var(--text-gray-medium)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1
                    }}>
                      <Star size={18} style={{ marginRight: 8, color: '#F59E0B' }} />
                      Mensagem de Despedida
                    </Typography>
                    <CustomTooltip title="Gerar mensagem automática">
                      <IconButton
                        onClick={() => generateAutoMessage('farewellMessage', setFieldValue)}
                        sx={{
                          color: '#F59E0B',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Wand2 size={18} />
                      </IconButton>
                    </CustomTooltip>
                  </Box>
                  <TextField
                    name="farewellMessage"
                    value={values.farewellMessage || ''}
                    onChange={(e) => setFieldValue('farewellMessage', e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="😊 Foi um prazer atendê-lo(a)! Obrigado por escolher nossos serviços. Até a próxima!"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-secondary)',
                        border: '2px solid #F59E0B',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover': {
                          borderColor: '#D97706',
                          boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.1)'
                        },
                        '&.Mui-focused': {
                          borderColor: '#D97706',
                          boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.2)'
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'var(--text-gray-medium)',
                        fontSize: '0.875rem',
                        '&::placeholder': {
                          color: 'var(--text-gray-medium)',
                          opacity: 0.7
                        }
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    color: 'var(--text-gray-medium)', 
                    fontSize: '0.75rem',
                    mt: 1,
                    display: 'block'
                  }}>
                    Mensagem enviada quando o atendimento é finalizado
                  </Typography>
                </Box>
              </Box>

              {/* Segunda linha - campo de fora do horário */}
              <Box sx={{ width: '50%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1
                  }}>
                    <Moon size={18} style={{ marginRight: 8, color: '#6366F1' }} />
                    Mensagem Fora do Horário
                  </Typography>
                  <CustomTooltip title="Gerar mensagem automática">
                    <IconButton
                      onClick={() => generateAutoMessage('outOfHoursMessage', setFieldValue)}
                      sx={{
                        color: '#6366F1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        '&:hover': {
                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Wand2 size={18} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <TextField
                  name="outOfHoursMessage"
                  value={values.outOfHoursMessage || ''}
                  onChange={(e) => setFieldValue('outOfHoursMessage', e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="🌙 Oi! No momento estamos fora do horário comercial. Deixe sua mensagem que retornaremos assim que possível!"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-secondary)',
                      border: '2px solid #6366F1',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover': {
                        borderColor: '#4F46E5',
                        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                      },
                      '&.Mui-focused': {
                        borderColor: '#4F46E5',
                        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)'
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.875rem',
                      '&::placeholder': {
                        color: 'var(--text-gray-medium)',
                        opacity: 0.7
                      }
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: 'var(--text-gray-medium)', 
                  fontSize: '0.75rem',
                  mt: 1,
                  display: 'block'
                }}>
                  Mensagem enviada fora do horário comercial
                </Typography>
              </Box>

              {/* Seção de Férias Coletivas */}
              <Box sx={{ mt: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  mb: 2
                }}>
                  <Heart size={18} color="#E91E63" />
                  <Typography variant="h6" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}>
                    Mensagem de Férias Coletivas
                  </Typography>
                  <CustomTooltip title="Gerar mensagem automática">
                    <IconButton
                      onClick={() => generateVacationMessage('collectiveVacationMessage', setFieldValue)}
                      sx={{
                        color: '#E91E63',
                        backgroundColor: 'rgba(233, 30, 99, 0.1)',
                        border: '1px solid rgba(233, 30, 99, 0.3)',
                        '&:hover': {
                          backgroundColor: 'rgba(233, 30, 99, 0.2)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Wand2 size={18} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <TextField
                  name="collectiveVacationMessage"
                  value={values.collectiveVacationMessage || ''}
                  onChange={(e) => setFieldValue('collectiveVacationMessage', e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="🏝️ Estamos em férias coletivas! Retornaremos em breve para atendê-lo com todo carinho!"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-secondary)',
                      border: '2px solid #E91E63',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover': {
                        borderColor: '#C2185B',
                        boxShadow: '0 0 0 3px rgba(233, 30, 99, 0.1)'
                      },
                      '&.Mui-focused': {
                        borderColor: '#C2185B',
                        boxShadow: '0 0 0 3px rgba(233, 30, 99, 0.2)'
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.875rem',
                      '&::placeholder': {
                        color: 'var(--text-gray-medium)',
                        opacity: 0.7
                      }
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: 'var(--text-gray-medium)', 
                  fontSize: '0.75rem',
                  mt: 1,
                  display: 'block'
                }}>
                  Mensagem enviada durante o período de férias coletivas
                </Typography>

                {/* Campos de Data das Férias */}
                <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ 
                      color: 'var(--text-gray-medium)',
                      fontWeight: 600,
                      mb: 1,
                      fontSize: '0.875rem'
                    }}>
                      Data Inicial das Férias
                    </Typography>
                    <TextField
                      name="collectiveVacationStart"
                      type="date"
                      value={values.collectiveVacationStart || ''}
                      onChange={(e) => setFieldValue('collectiveVacationStart', e.target.value)}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: 2,
                          border: '2px solid rgba(233, 30, 99, 0.3)',
                          fontSize: '0.875rem',
                          '& fieldset': {
                            border: 'none',
                          },
                          '&:hover': {
                            borderColor: 'rgba(233, 30, 99, 0.5)',
                            backgroundColor: 'rgba(233, 30, 99, 0.05)',
                          },
                          '&.Mui-focused': {
                            borderColor: '#E91E63',
                            backgroundColor: 'rgba(233, 30, 99, 0.05)',
                            boxShadow: '0 0 0 3px rgba(233, 30, 99, 0.1)',
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'var(--text-gray-medium)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ 
                      color: 'var(--text-gray-medium)',
                      fontWeight: 600,
                      mb: 1,
                      fontSize: '0.875rem'
                    }}>
                      Data Final das Férias
                    </Typography>
                    <TextField
                      name="collectiveVacationEnd"
                      type="date"
                      value={values.collectiveVacationEnd || ''}
                      onChange={(e) => setFieldValue('collectiveVacationEnd', e.target.value)}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: 2,
                          border: '2px solid rgba(233, 30, 99, 0.3)',
                          fontSize: '0.875rem',
                          '& fieldset': {
                            border: 'none',
                          },
                          '&:hover': {
                            borderColor: 'rgba(233, 30, 99, 0.5)',
                            backgroundColor: 'rgba(233, 30, 99, 0.05)',
                          },
                          '&.Mui-focused': {
                            borderColor: '#E91E63',
                            backgroundColor: 'rgba(233, 30, 99, 0.05)',
                            boxShadow: '0 0 0 3px rgba(233, 30, 99, 0.1)',
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'var(--text-gray-medium)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        );

      case 'chatbot':
        return (
          <Box sx={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 3,
            p: 3
          }}>
            <Typography variant="h6" sx={{ 
              color: 'var(--text-gray-medium)',
              mb: 4,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Bot size={20} style={{ marginRight: 8 }} />
              Configurações do ChatBot
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Primeira linha */}
              <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
                {/* Máximo de Uso do Bot */}
                <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    flex: 1
                  }}>
                    Enviar Bot X Vezes
                  </Typography>
                  <CustomTooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Controle de Interações do Bot:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Função:</strong> Define quantas vezes o chatbot pode interagir com o mesmo cliente antes de transferir para um atendente humano.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Exemplo:</strong> Se configurado como "3", após 3 mensagens automáticas, o chat será transferido para um atendente.
                        </Typography>
                        <Typography variant="body2">
                          • <strong>Recomendação:</strong> Use entre 3-5 para evitar loops infinitos de respostas automáticas.
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                    sx={{
                      '& .MuiTooltip-tooltip': {
                        backgroundColor: 'rgba(30, 32, 38, 0.95)',
                        color: 'var(--text-gray-medium)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        maxWidth: 400,
                        fontSize: '0.875rem'
                      },
                      '& .MuiTooltip-arrow': {
                        color: 'rgba(30, 32, 38, 0.95)',
                        '&::before': {
                          border: '1px solid var(--border-primary)'
                        }
                      }
                    }}
                  >
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'var(--color-accent)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HelpCircle size={18} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <TextField
                  name="maxUseBotQueues"
                  value={values.maxUseBotQueues || ''}
                  onChange={(e) => setFieldValue('maxUseBotQueues', e.target.value)}
                  type="number"
                  placeholder="3"
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      '& fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--color-accent)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--color-accent)',
                        borderWidth: '2px'
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: 'var(--color-accent)',
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.875rem',
                      '&::placeholder': {
                        color: 'var(--text-gray-medium)',
                        opacity: 1
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.75rem'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: 'var(--text-gray-medium)', 
                  fontSize: '0.75rem',
                  mt: 1,
                  display: 'block'
                }}>
                  Número máximo de interações do bot antes de transferir para atendente
                </Typography>
                </Box>

                {/* Tempo de Uso do Bot */}
                <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    flex: 1
                  }}>
                    Enviar Bot em X Minutos
                  </Typography>
                  <CustomTooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Tempo para Ativação do Bot:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Função:</strong> Define quanto tempo aguardar antes de enviar uma resposta automática do bot.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Exemplo:</strong> Se configurado como "2", o bot aguardará 2 minutos após a última mensagem do cliente para responder.
                        </Typography>
                        <Typography variant="body2">
                          • <strong>0 = Imediato:</strong> Bot responde instantaneamente. Use com cuidado para não parecer spam.
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                    sx={{
                      '& .MuiTooltip-tooltip': {
                        backgroundColor: 'rgba(30, 32, 38, 0.95)',
                        color: 'var(--text-gray-medium)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        maxWidth: 400,
                        fontSize: '0.875rem'
                      },
                      '& .MuiTooltip-arrow': {
                        color: 'rgba(30, 32, 38, 0.95)',
                        '&::before': {
                          border: '1px solid var(--border-primary)'
                        }
                      }
                    }}
                  >
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'var(--color-accent)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HelpCircle size={18} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <TextField
                  name="timeUseBotQueues"
                  value={values.timeUseBotQueues || ''}
                  onChange={(e) => setFieldValue('timeUseBotQueues', e.target.value)}
                  type="number"
                  placeholder="0"
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      '& fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--color-accent)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--color-accent)',
                        borderWidth: '2px'
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: 'var(--color-accent)',
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.875rem',
                      '&::placeholder': {
                        color: 'var(--text-gray-medium)',
                        opacity: 1
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.75rem'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: 'var(--text-gray-medium)', 
                  fontSize: '0.75rem',
                  mt: 1,
                  display: 'block'
                }}>
                  Tempo de espera em minutos antes do bot responder (0 = imediato)
                </Typography>
                </Box>
              </Box>

              {/* Segunda linha */}
              <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
                {/* Tempo para Novo Ticket */}
                <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    flex: 1
                  }}>
                    Criar Novo Ticket em X Minutos
                  </Typography>
                  <CustomTooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Controle de Criação de Tickets:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Função:</strong> Define quanto tempo aguardar após inatividade para criar um novo ticket quando o cliente retornar.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Exemplo:</strong> Se configurado como "60", após 1 hora de inatividade, uma nova mensagem do cliente criará um novo ticket.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Benefício:</strong> Evita tickets muito antigos sendo reabertos e mantém o histórico organizado.
                        </Typography>
                        <Typography variant="body2">
                          • <strong>Recomendação:</strong> Use entre 60-1440 minutos (1 hora a 24 horas).
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                    sx={{
                      '& .MuiTooltip-tooltip': {
                        backgroundColor: 'rgba(30, 32, 38, 0.95)',
                        color: 'var(--text-gray-medium)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        maxWidth: 400,
                        fontSize: '0.875rem'
                      },
                      '& .MuiTooltip-arrow': {
                        color: 'rgba(30, 32, 38, 0.95)',
                        '&::before': {
                          border: '1px solid var(--border-primary)'
                        }
                      }
                    }}
                  >
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'var(--color-accent)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HelpCircle size={18} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <TextField
                  name="timeCreateNewTicket"
                  value={values.timeCreateNewTicket || ''}
                  onChange={(e) => setFieldValue('timeCreateNewTicket', e.target.value)}
                  type="number"
                  placeholder="10"
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      '& fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--color-accent)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--color-accent)',
                        borderWidth: '2px'
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: 'var(--color-accent)',
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.875rem',
                      '&::placeholder': {
                        color: 'var(--text-gray-medium)',
                        opacity: 1
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.75rem'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: 'var(--text-gray-medium)', 
                  fontSize: '0.75rem',
                  mt: 1,
                  display: 'block'
                }}>
                  Tempo de inatividade em minutos após o qual um novo ticket será criado
                </Typography>
                </Box>

                {/* Tempo para Fechamento do Ticket */}
                <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    flex: 1
                  }}>
                    Expirar Ticket em X Horas
                  </Typography>
                  <CustomTooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Fechamento Automático de Tickets:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Função:</strong> Define quando um ticket deve ser fechado automaticamente por inatividade.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Exemplo:</strong> Se configurado como "24", tickets sem atividade por 24 horas serão fechados automaticamente.
                        </Typography>
                        <Typography variant="body2">
                          • <strong>0 = Desabilitado:</strong> Tickets nunca fecham automaticamente por tempo.
                        </Typography>
                      </Box>
                    }
                  >
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'var(--color-accent)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HelpCircle size={18} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <TextField
                  name="expiresTicket"
                  value={values.expiresTicket || ''}
                  onChange={(e) => setFieldValue('expiresTicket', e.target.value)}
                  type="number"
                  placeholder="0"
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      '& fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--color-accent)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--color-accent)',
                        borderWidth: '2px'
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: 'var(--color-accent)',
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.875rem',
                      '&::placeholder': {
                        color: 'var(--text-gray-medium)',
                        opacity: 1
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-gray-medium)',
                      fontSize: '0.75rem'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: 'var(--text-gray-medium)', 
                  fontSize: '0.75rem',
                  mt: 1,
                  display: 'block'
                }}>
                  Horas de inatividade para fechamento automático (0 = desabilitado)
                </Typography>
                </Box>
              </Box>
            </Box>

            {/* Seção de Configurações de Fechamento */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ 
                  color: 'var(--text-gray-medium)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  mr: 1
                }}>
                  <Clock size={20} style={{ marginRight: 8 }} />
                  Configurações de Fechamento e Inatividade
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                width: '100%'
              }}>
                {/* Tempo para Aviso de Inatividade */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: 'var(--text-gray-medium)',
                      fontWeight: 600,
                      flex: 1
                    }}>
                      Tempo em Minutos para do Aviso de Inatividade
                    </Typography>
                    <CustomTooltip 
                      title={
                        <Box sx={{ p: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Tempo para Aviso de Inatividade:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            • <strong>Função:</strong> Define após quantos minutos de inatividade será enviado o aviso de que o chat será fechado.
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            • <strong>Exemplo:</strong> Se configurado como "30", após 30 minutos sem resposta, o sistema enviará o aviso.
                          </Typography>
                          <Typography variant="body2">
                            • <strong>0 = Desabilitado:</strong> Não enviará avisos de inatividade.
                          </Typography>
                        </Box>
                      }
                    >
                      <IconButton 
                        size="small"
                        sx={{ 
                          color: 'var(--color-accent)',
                          '&:hover': {
                            backgroundColor: 'var(--hover-bg-light)',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <HelpCircle size={18} />
                      </IconButton>
                    </CustomTooltip>
                  </Box>
                  <TextField
                    name="timeInactiveMessage"
                    value={values.timeInactiveMessage || ''}
                    onChange={(e) => setFieldValue('timeInactiveMessage', e.target.value)}
                    type="number"
                    placeholder="0"
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          borderColor: 'var(--border-primary)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'var(--color-accent)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--color-accent)',
                          borderWidth: '2px'
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        '&.Mui-focused': {
                          color: 'var(--color-accent)',
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'var(--text-gray-medium)',
                        fontSize: '0.875rem',
                        '&::placeholder': {
                          color: 'var(--text-gray-medium)',
                          opacity: 1
                        }
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'var(--text-gray-medium)',
                        fontSize: '0.75rem'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    color: 'var(--text-gray-medium)', 
                    fontSize: '0.75rem',
                    mt: 1,
                    display: 'block'
                  }}>
                    Tempo em minutos para enviar aviso de inatividade (0 = desabilitado)
                  </Typography>
                </Box>

                {/* Encerrar Chats Aberto Quando */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: 'var(--text-gray-medium)',
                      fontWeight: 600,
                      flex: 1
                    }}>
                      Encerrar Chats Aberto Quando
                    </Typography>
                    <CustomTooltip 
                      title={
                        <Box sx={{ p: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Condição de Fechamento:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            • <strong>Última mensagem de atendente:</strong> Fecha quando a última mensagem foi enviada pelo atendente.
                          </Typography>
                          <Typography variant="body2">
                            • <strong>Última mensagem de cliente:</strong> Fecha quando a última mensagem foi enviada pelo cliente.
                          </Typography>
                        </Box>
                      }
                    >
                      <IconButton 
                        size="small"
                        sx={{ 
                          color: 'var(--color-accent)',
                          '&:hover': {
                            backgroundColor: 'var(--hover-bg-light)',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <HelpCircle size={18} />
                      </IconButton>
                    </CustomTooltip>
                  </Box>
                  <FormControl fullWidth variant="outlined">
                    <Select
                      name="whenExpiresTicket"
                      value={values.whenExpiresTicket || "0"}
                      onChange={(e) => setFieldValue('whenExpiresTicket', e.target.value)}
                      sx={{
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'var(--border-primary)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'var(--color-accent)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'var(--color-accent)',
                          borderWidth: '2px'
                        },
                        '& .MuiSelect-select': {
                          color: 'var(--text-gray-medium)',
                          fontSize: '0.875rem'
                        }
                      }}
                    >
                      <MenuItem value="0">Última mensagem de atendente</MenuItem>
                      <MenuItem value="1">Última mensagem de cliente</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" sx={{ 
                    color: 'var(--text-gray-medium)', 
                    fontSize: '0.75rem',
                    mt: 1,
                    display: 'block'
                  }}>
                    Condição para encerramento automático do chat
                  </Typography>
                </Box>
              </Box>

              {/* Seção de Mensagens */}
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                mt: 2,
                width: '100%'
              }}>
                {/* Mensagem de Inatividade */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    mb: 3
                  }}>
                    <Typography variant="subtitle1" sx={{
                      color: 'var(--text-gray-medium)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1
                    }}>
                      <Timer size={18} style={{ marginRight: 8, color: '#F59E0B' }} />
                      Mensagem de Inatividade
                    </Typography>
                    <CustomTooltip title="Gerar mensagem automática">
                      <IconButton
                        onClick={() => generateAutoMessage('inactiveMessage', setFieldValue)}
                        sx={{
                          color: '#F59E0B',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Wand2 size={18} />
                      </IconButton>
                    </CustomTooltip>
                  </Box>
                  <TextField
                    name="inactiveMessage"
                    value={values.inactiveMessage || ''}
                    onChange={(e) => setFieldValue('inactiveMessage', e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="⏰ Olá! Notamos que você está há um tempo sem responder. Se precisar de ajuda, estaremos aqui para atendê-lo!"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-secondary)',
                        border: '2px solid #F59E0B',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover': {
                          borderColor: '#D97706',
                          boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.1)'
                        },
                        '&.Mui-focused': {
                          borderColor: '#D97706',
                          boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.2)'
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'var(--text-gray-medium)',
                        fontSize: '0.875rem',
                        '&::placeholder': {
                          color: 'var(--text-gray-medium)',
                          opacity: 0.8
                        }
                      }
                    }}
                  />
                </Box>

                {/* Mensagem de Encerramento por Inatividade */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    mb: 3
                  }}>
                    <Typography variant="subtitle1" sx={{
                      color: 'var(--text-gray-medium)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1
                    }}>
                      <Clock size={18} style={{ marginRight: 8, color: '#EF4444' }} />
                      Mensagem de Encerramento por Inatividade
                    </Typography>
                    <CustomTooltip title="Gerar mensagem automática">
                      <IconButton
                        onClick={() => generateAutoMessage('expiresInactiveMessage', setFieldValue)}
                        sx={{
                          color: '#EF4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Wand2 size={18} />
                      </IconButton>
                    </CustomTooltip>
                  </Box>
                  <TextField
                    name="expiresInactiveMessage"
                    value={values.expiresInactiveMessage || ''}
                    onChange={(e) => setFieldValue('expiresInactiveMessage', e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="⏰ Devido ao tempo de inatividade, este atendimento será finalizado. Obrigado pelo contato!"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-secondary)',
                        border: '2px solid #EF4444',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover': {
                          borderColor: '#DC2626',
                          boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
                        },
                        '&.Mui-focused': {
                          borderColor: '#DC2626',
                          boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)'
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'var(--text-gray-medium)',
                        fontSize: '0.875rem',
                        '&::placeholder': {
                          color: 'var(--text-gray-medium)',
                          opacity: 0.8
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        );

      case 'nps':
        return (
          <Box sx={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 3,
            p: 3
          }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" sx={{ 
                color: 'var(--text-gray-medium)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                mr: 1
              }}>
                <Star size={20} style={{ marginRight: 8 }} />
                Configuração de NPS
              </Typography>
            </Box>

            {/* Campo Mensagem de Avaliação - Largura Total */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 2
              }}>
                <Star size={18} color="var(--color-success)" />
                <Typography variant="h6" sx={{ 
                  color: 'var(--text-gray-medium)',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>
                  Mensagem de Avaliação NPS
                </Typography>
                <CustomTooltip 
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Mensagem de Solicitação de Avaliação:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • <strong>Função:</strong> Texto enviado automaticamente ao cliente para solicitar uma avaliação do atendimento.
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • <strong>Quando é enviada:</strong> Após o fechamento do ticket, se o NPS estiver configurado.
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • <strong>Personalização:</strong> Você pode personalizar a mensagem para se adequar ao seu negócio.
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#4FC3F7' }}>
                        💡 Exemplo: "Como você avalia nosso atendimento? De 0 a 10, o quanto você nos recomendaria?"
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton 
                    size="small"
                    sx={{ 
                      color: 'var(--color-accent)',
                      '&:hover': {
                        backgroundColor: 'var(--hover-bg-light)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <HelpCircle size={16} />
                  </IconButton>
                </CustomTooltip>
                <IconButton
                  onClick={() => generateNPSMessages('ratingMessage', setFieldValue)}
                  size="small"
                  sx={{ 
                    color: 'var(--color-success)',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease',
                    ml: 1
                  }}
                >
                  <Wand2 size={16} />
                </IconButton>
              </Box>
              
              <TextField
                name="ratingMessage"
                value={values.ratingMessage || ''}
                onChange={(e) => setFieldValue('ratingMessage', e.target.value)}
                placeholder="Como você avalia nosso atendimento? De 0 a 10, o quanto você nos recomendaria?"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(76, 175, 80, 0.05)',
                    borderRadius: 3,
                    border: '2px solid rgba(76, 175, 80, 0.3)',
                    fontSize: '0.875rem',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      borderColor: 'rgba(76, 175, 80, 0.5)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      borderColor: 'var(--color-success)',
                      boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.1)',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    '&::placeholder': {
                      color: 'rgba(76, 175, 80, 0.7)',
                      opacity: 1
                    }
                  }
                }}
              />
            </Box>

            {/* Campos lado a lado - Largura Total */}
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography variant="body2" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    mr: 1
                  }}>
                    Máximo de Tentativas NPS
                  </Typography>
                  <CustomTooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Controle de Tentativas de NPS:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Função:</strong> Define quantas vezes o sistema pode solicitar uma avaliação NPS para o mesmo cliente.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Evita spam:</strong> Impede que o cliente receba múltiplas solicitações de avaliação.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Valor 0:</strong> Desabilita o limite, permitindo envios ilimitados.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#FFB74D' }}>
                          ⚠️ Recomendação: Use valores entre 1-3 para evitar incomodar o cliente.
                        </Typography>
                      </Box>
                    }
                  >
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'var(--color-accent)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HelpCircle size={16} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <TextField
                  name="maxUseBotQueuesNPS"
                  value={values.maxUseBotQueuesNPS || ''}
                  onChange={(e) => setFieldValue('maxUseBotQueuesNPS', e.target.value)}
                  placeholder="0"
                  type="number"
                  fullWidth
                  variant="outlined"
                  helperText="0 = ilimitado, recomendado: 1-3 tentativas"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      '& fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--color-accent)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--color-accent)',
                        borderWidth: '2px'
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      '&::placeholder': {
                        color: 'var(--text-disabled)',
                        opacity: 1
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-disabled)',
                      fontSize: '0.75rem',
                      mt: 1
                    }
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography variant="body2" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    mr: 1
                  }}>
                    Tempo para Expirar Ticket NPS (horas)
                  </Typography>
                  <CustomTooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Expiração do Ticket de NPS:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Função:</strong> Define por quanto tempo um ticket permanece aberto aguardando a resposta do NPS.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Após expirar:</strong> O ticket é automaticamente fechado e não aguarda mais a avaliação.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Valor 0:</strong> O ticket nunca expira automaticamente.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#81C784' }}>
                          ✅ Recomendação: 24-72 horas para dar tempo ao cliente responder.
                        </Typography>
                      </Box>
                    }
                  >
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'var(--color-accent)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HelpCircle size={16} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <TextField
                  name="expiresTicketNPS"
                  value={values.expiresTicketNPS || ''}
                  onChange={(e) => setFieldValue('expiresTicketNPS', e.target.value)}
                  placeholder="0"
                  type="number"
                  fullWidth
                  variant="outlined"
                  helperText="0 = nunca expira, recomendado: 24-72 horas"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      '& fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--color-accent)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--color-accent)',
                        borderWidth: '2px'
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      '&::placeholder': {
                        color: 'var(--text-disabled)',
                        opacity: 1
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'var(--text-disabled)',
                      fontSize: '0.75rem',
                      mt: 1
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'fluxo':
        return (
          <Box sx={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 3,
            p: 3
          }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" sx={{ 
                color: 'var(--text-gray-medium)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                mr: 1
              }}>
                <Workflow size={20} style={{ marginRight: 8 }} />
                Configuração de Fluxo Padrão
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography variant="body2" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    mr: 1
                  }}>
                    Fluxo de Boas-vindas
                  </Typography>
                  <CustomTooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Fluxo de Boas-vindas:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Função:</strong> Define qual fluxo de chatbot será executado automaticamente quando um novo contato iniciar uma conversa.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Quando é ativado:</strong> No primeiro contato do cliente com o WhatsApp da empresa.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Uso típico:</strong> Mensagens de apresentação da empresa, menu de opções, coleta de dados iniciais.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#81C784' }}>
                          ✅ Exemplo: "Olá! Seja bem-vindo à [Empresa]. Como posso ajudá-lo hoje?"
                        </Typography>
                      </Box>
                    }
                  >
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'var(--color-accent)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HelpCircle size={16} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Selecionar fluxo...</InputLabel>
                  <Select
                    name="flowIdWelcome"
                    value={values.flowIdWelcome || ''}
                    onChange={(e) => setFieldValue('flowIdWelcome', e.target.value)}
                    label="Selecionar fluxo..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          borderColor: 'var(--border-primary)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'var(--color-accent)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--color-accent)',
                          borderWidth: '2px'
                        },
                      },
                      '& .MuiSelect-select': {
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      },
                      '& .MuiInputLabel-root': {
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        '&.Mui-focused': {
                          color: 'var(--color-accent)',
                        }
                      }
                    }}
                  >
                    <MenuItem value="">
                      <Typography sx={{ color: 'var(--text-disabled)', fontStyle: 'italic' }}>
                        Nenhum fluxo selecionado
                      </Typography>
                    </MenuItem>
                    {flowBuilders.map(flow => (
                      <MenuItem 
                        key={flow.id} 
                        value={flow.id}
                        sx={{
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                          '&:hover': {
                            backgroundColor: 'var(--hover-bg-light)'
                          }
                        }}
                      >
                        {flow.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography variant="body2" sx={{ 
                    color: 'var(--text-gray-medium)',
                    fontWeight: 600,
                    mr: 1
                  }}>
                    Fluxo Não Compreendido
                  </Typography>
                  <CustomTooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Fluxo Não Compreendido:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Função:</strong> Define qual fluxo será executado quando o chatbot não conseguir entender ou processar a mensagem do cliente.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Quando é ativado:</strong> Quando o cliente envia uma mensagem que não corresponde a nenhuma palavra-chave ou opção configurada.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          • <strong>Uso típico:</strong> Mensagens de esclarecimento, redirecionamento para atendimento humano, menu de opções alternativas.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#FFB74D' }}>
                          ⚠️ Exemplo: "Não entendi sua mensagem. Você pode escolher uma das opções abaixo?"
                        </Typography>
                      </Box>
                    }
                  >
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: 'var(--color-accent)',
                        '&:hover': {
                          backgroundColor: 'var(--hover-bg-light)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HelpCircle size={16} />
                    </IconButton>
                  </CustomTooltip>
                </Box>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Selecionar fluxo...</InputLabel>
                  <Select
                    name="flowIdNotPhrase"
                    value={values.flowIdNotPhrase || ''}
                    onChange={(e) => setFieldValue('flowIdNotPhrase', e.target.value)}
                    label="Selecionar fluxo..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          borderColor: 'var(--border-primary)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'var(--color-accent)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--color-accent)',
                          borderWidth: '2px'
                        },
                      },
                      '& .MuiSelect-select': {
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      },
                      '& .MuiInputLabel-root': {
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        '&.Mui-focused': {
                          color: 'var(--color-accent)',
                        }
                      }
                    }}
                  >
                    <MenuItem value="">
                      <Typography sx={{ color: 'var(--text-disabled)', fontStyle: 'italic' }}>
                        Nenhum fluxo selecionado
                      </Typography>
                    </MenuItem>
                    {flowBuilders.map(flow => (
                      <MenuItem 
                        key={flow.id} 
                        value={flow.id}
                        sx={{
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                          '&:hover': {
                            backgroundColor: 'var(--hover-bg-light)'
                          }
                        }}
                      >
                        {flow.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        );

      case 'horarios':
        return (
          <Box sx={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 3,
            p: 3
          }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" sx={{ 
                color: 'var(--text-gray-medium)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                mr: 1
              }}>
                <Clock size={20} style={{ marginRight: 8 }} />
                Horários de Funcionamento
              </Typography>
            </Box>

            {/* Sistema de Horários Moderno */}
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {[
                { id: 'monday', label: 'Segunda-feira', color: '#1976D2' },
                { id: 'tuesday', label: 'Terça-feira', color: '#2E7D32' },
                { id: 'wednesday', label: 'Quarta-feira', color: '#ED6C02' },
                { id: 'thursday', label: 'Quinta-feira', color: '#9C27B0' },
                { id: 'friday', label: 'Sexta-feira', color: '#D32F2F' },
                { id: 'saturday', label: 'Sábado', color: '#795548' },
                { id: 'sunday', label: 'Domingo', color: '#0288D1' }
              ].map((day) => (
                <Box 
                  key={day.id}
                  sx={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 3,
                    p: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: day.color,
                      boxShadow: `0 2px 8px ${day.color}20`,
                    }
                  }}
                >
                  {/* Header do dia */}
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box 
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: day.color
                        }}
                      />
                      <Typography variant="h6" sx={{ 
                        color: 'var(--text-gray-medium)',
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}>
                        {day.label}
                      </Typography>
                    </Box>
                    
                    {/* Toggle Ativo/Inativo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ 
                        color: 'var(--text-gray-medium)',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        {values[`${day.id}_active`] ? 'Funcionando' : 'Fechado'}
                      </Typography>
                      <Box
                        onClick={() => setFieldValue(`${day.id}_active`, !values[`${day.id}_active`])}
                        sx={{
                          width: 52,
                          height: 28,
                          backgroundColor: values[`${day.id}_active`] ? day.color : 'var(--border-primary)',
                          borderRadius: '50px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          }
                        }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: '#fff',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: 2,
                            left: values[`${day.id}_active`] ? 26 : 2,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Campos de horário - só aparecem se ativo */}
                  {values[`${day.id}_active`] && (
                    <Box sx={{ 
                      display: 'flex',
                      gap: 3,
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <Box sx={{ flex: 1, minWidth: 140 }}>
                        <Typography variant="body2" sx={{ 
                          color: 'var(--text-gray-medium)',
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '0.875rem'
                        }}>
                          Abertura
                        </Typography>
                        <TextField
                          type="time"
                          value={values[`${day.id}_start`] || '09:00'}
                          onChange={(e) => setFieldValue(`${day.id}_start`, e.target.value)}
                          fullWidth
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'var(--bg-primary)',
                              borderRadius: 2,
                              border: `2px solid ${day.color}30`,
                              fontSize: '0.875rem',
                              '& fieldset': {
                                border: 'none',
                              },
                              '&:hover': {
                                borderColor: `${day.color}50`,
                                backgroundColor: `${day.color}08`,
                              },
                              '&.Mui-focused': {
                                borderColor: day.color,
                                backgroundColor: `${day.color}08`,
                                boxShadow: `0 0 0 3px ${day.color}20`,
                              },
                            },
                            '& .MuiOutlinedInput-input': {
                              color: 'var(--text-gray-medium)',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        mt: 3
                      }}>
                        <Box 
                          sx={{
                            width: 20,
                            height: 2,
                            backgroundColor: day.color,
                            borderRadius: 1
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 140 }}>
                        <Typography variant="body2" sx={{ 
                          color: 'var(--text-gray-medium)',
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '0.875rem'
                        }}>
                          Fechamento
                        </Typography>
                        <TextField
                          type="time"
                          value={values[`${day.id}_end`] || '18:00'}
                          onChange={(e) => setFieldValue(`${day.id}_end`, e.target.value)}
                          fullWidth
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'var(--bg-primary)',
                              borderRadius: 2,
                              border: `2px solid ${day.color}30`,
                              fontSize: '0.875rem',
                              '& fieldset': {
                                border: 'none',
                              },
                              '&:hover': {
                                borderColor: `${day.color}50`,
                                backgroundColor: `${day.color}08`,
                              },
                              '&.Mui-focused': {
                                borderColor: day.color,
                                backgroundColor: `${day.color}08`,
                                boxShadow: `0 0 0 3px ${day.color}20`,
                              },
                            },
                            '& .MuiOutlinedInput-input': {
                              color: 'var(--text-gray-medium)',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }
                          }}
                        />
                      </Box>

                      {/* Badge de status */}
                      <Box sx={{
                        backgroundColor: `${day.color}15`,
                        border: `1px solid ${day.color}30`,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        minWidth: 100,
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" sx={{ 
                          color: 'var(--text-gray-medium)',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}>
                          {values[`${day.id}_start`] && values[`${day.id}_end`] ? 
                            `${values[`${day.id}_start`]} - ${values[`${day.id}_end`]}` : 
                            'Configure os horários'
                          }
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  // Componente de conteúdo principal
  const formContent = (
      <Box sx={{
        width: '100%',
        height: '100%',
        p: { xs: 2, sm: 3 }
      }}>

        {/* Formulário */}
        <Formik
          initialValues={initialValues}
          validationSchema={WhatsAppSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, isSubmitting, setFieldValue, submitForm }) => (
            <Box>
              <Card sx={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                {/* Tabs */}
                <Box sx={{ 
                  px: 3,
                  pt: 3,
                  pb: 1,
                  borderBottom: '1px solid var(--border-primary)',
                  width: '100%'
                }}>
                  <Box sx={{
                    '& > div': {
                      mb: 0
                    },
                    '& ul': {
                      width: '100%',
                      display: 'flex',
                      mt: 0,
                      mb: 0
                    },
                    '& li': {
                      flex: 1
                    },
                    '& button': {
                      width: '100%',
                      justifyContent: 'center',
                      // Responsividade específica para resoluções menores
                      px: { xs: 1, sm: 2, md: 3.5 },
                      py: { xs: 1, sm: 1.5 },
                      fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.95rem' },
                      minHeight: { xs: '40px', sm: '48px', md: '52px' },
                      '& svg': {
                        width: { xs: 14, sm: 16, md: 18 },
                        height: { xs: 14, sm: 16, md: 18 }
                      }
                    },
                    '& > div > div:last-child': {
                      display: 'none'
                    },
                    // Breakpoints customizados para as resoluções específicas
                    '@media (max-width: 1400px)': {
                      '& button': {
                        px: 2,
                        fontSize: '0.85rem',
                        minHeight: '44px'
                      }
                    },
                    '@media (max-width: 1200px)': {
                      '& button': {
                        px: 1.5,
                        fontSize: '0.8rem',
                        minHeight: '40px'
                      }
                    }
                  }}>
                    <ModernTabs
                      tabs={tabs}
                      defaultTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                  </Box>
                </Box>

                {/* Conteúdo das Tabs */}
                <Box sx={{ px: 3, pt: 2, pb: 3 }}>
                  {renderTabContent(activeTab, values, errors, touched, setFieldValue)}
                </Box>

                {/* Actions */}
                <Box sx={{
                  p: 3,
                  borderTop: '1px solid var(--border-primary)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <GradientButton
                    variant="outlined"
                    onClick={() => onClose?.()}
                    disabled={loading}
                    sx={{
                      backgroundColor: 'transparent !important',
                      background: 'transparent !important',
                      color: '#EF4444 !important',
                      border: '2px solid #EF4444 !important',
                      borderColor: '#EF4444 !important',
                      boxShadow: 'none !important',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1) !important',
                        background: 'rgba(239, 68, 68, 0.1) !important',
                        borderColor: '#DC2626 !important',
                        color: '#DC2626 !important',
                        boxShadow: 'none !important'
                      },
                      '&:focus': {
                        backgroundColor: 'transparent !important',
                        background: 'transparent !important',
                        boxShadow: 'none !important'
                      }
                    }}
                  >
                    Cancelar
                  </GradientButton>

                  <GradientButton
                    onClick={submitForm}
                    loading={loading || isSubmitting}
                    disabled={loading || isSubmitting}
                    sx={{
                      minWidth: 140
                    }}
                  >
                    {selectedWhatsApp ? 'Atualizar Conexão' : 'Salvar Conexão'}
                  </GradientButton>
                </Box>
              </Card>
            </Box>
          )}
        </Formik>
      </Box>
  );

  // Se onClose é fornecido, renderizar como componente integrado (tela completa)
  if (onClose) {
    return formContent;
  }

  // Renderizar como página completa se não há onClose
  const pageTitle = selectedWhatsApp ? "Editar Conexão WhatsApp" : "Nova Conexão WhatsApp";
  const breadcrumbLabel = selectedWhatsApp ? "Editar Conexão" : "Nova Conexão WhatsApp";

  return (
    <PageLayout
      title={pageTitle}
      icon={<Network />}
      breadcrumbs={[
        { href: "/", icon: <BarChart3 size={16} /> },
        { href: "/connections", label: "Conexões", icon: <Wifi size={16} /> },
        { label: breadcrumbLabel, icon: <Network size={16} /> }
      ]}
    >
      {formContent}
    </PageLayout>
  );
};

export default WhatsAppForm;