import React, { useEffect, useState, useContext } from "react";
import QRCode from "qrcode.react";
import toastError from "../../errors/toastError";
import { 
  Dialog, 
  DialogContent, 
  Typography, 
  Box, 
  IconButton,
  Fade,
  Backdrop,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from "@mui/material";
import { 
  X, 
  Smartphone, 
  QrCode as QrCodeIcon, 
  CheckCircle, 
  RefreshCw,
  Clock,
  Wifi,
  MoreHorizontal,
  Settings,
  Link,
  Camera,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import GradientButton from "../GradientButton";

import { AuthContext } from "../../context/Auth/AuthContext";

const ModernQrCodeModal = ({ open, onClose, whatsAppId }) => {
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isExpired, setIsExpired] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(''); // Default collapsed
  const { user, socket } = useContext(AuthContext);

  // Reset states when modal opens
  useEffect(() => {
    if (open) {
      setLoading(false); // Reset loading state
      setIsExpired(false);
      setTimeLeft(45);
    }
  }, [open]);

  // Timer para expiração do QR Code
  useEffect(() => {
    if (!open || !qrCode) return;
    
    setTimeLeft(45);
    setIsExpired(false);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrCode, open]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;

      setLoading(true);
      try {
        const { data } = await api.get(`/whatsapp/${whatsAppId}`);
        
        // Se não tem QR code e está DISCONNECTED, inicia a sessão
        if (!data.qrcode && data.status === 'DISCONNECTED') {
          await api.post(`/whatsappsession/${whatsAppId}`);
          // O QR code virá via socket, então não para o loading aqui
        } else {
          setQrCode(data.qrcode);
          setLoading(false);
        }
      } catch (err) {
        toastError(err);
        setLoading(false);
      }
    };
    
    if (open) {
      fetchSession();
    }
  }, [whatsAppId, open]);

  useEffect(() => {
    if (!whatsAppId || !user.companyId) return;
    
    const companyId = user.companyId;

    const onWhatsappData = (data) => {
      console.log('📡 Socket data received:', data);
      
      if (data.action === "update" && data.session.id === whatsAppId) {
        console.log('🔄 Updating QR code from socket, qrCode:', data.session.qrcode ? 'YES' : 'NO');
        setQrCode(data.session.qrcode);
        setLoading(false);
        
        // Se recebeu um novo QR code, reseta o timer
        if (data.session.qrcode) {
          console.log('⏰ Resetting timer to 45 seconds');
          setTimeLeft(45);
          setIsExpired(false);
        }
      }

      if (data.action === "update" && data.session.qrcode === "") {
        console.log('🚪 Closing modal - QR code is empty');
        onClose();
      }
    };
    
    if (socket && socket.on && typeof socket.on === 'function') {
      socket.on(`company-${companyId}-whatsappSession`, onWhatsappData);
    }

    return () => {
      if (socket && socket.off && typeof socket.off === 'function') {
        socket.off(`company-${companyId}-whatsappSession`, onWhatsappData);
      }
    };
  }, [whatsAppId, onClose, socket, user.companyId]);

  const handleRefreshQR = async () => {
    if (!whatsAppId) return;

    setLoading(true);
    setIsExpired(false);
    
    try {
      // MESMA LÓGICA que funciona quando modal abre
      const { data } = await api.get(`/whatsapp/${whatsAppId}`);
      
      // Se não tem QR code e está DISCONNECTED, inicia a sessão
      if (!data.qrcode && data.status === 'DISCONNECTED') {
        await api.post(`/whatsappsession/${whatsAppId}`);
        // O QR code virá via socket, então não para o loading aqui
      } else {
        setQrCode(data.qrcode);
        setTimeLeft(45);
        setLoading(false);
      }
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const androidSteps = [
    {
      label: "Abra o WhatsApp",
      description: "Abra o WhatsApp no seu celular Android",
      icon: <Smartphone size={20} />
    },
    {
      label: "Acesse o menu",
      description: "Toque nos três pontinhos no canto superior direito",
      icon: <MoreHorizontal size={20} />
    },
    {
      label: "Dispositivos conectados",
      description: "Selecione 'Dispositivos conectados'",
      icon: <Link size={20} />
    },
    {
      label: "Conectar dispositivo",
      description: "Toque em 'Conectar um dispositivo'",
      icon: <Wifi size={20} />
    },
    {
      label: "Escaneie o código",
      description: "Aponte a câmera para o código QR na tela",
      icon: <Camera size={20} />
    }
  ];

  const iosSteps = [
    {
      label: "Abra o WhatsApp",
      description: "Abra o WhatsApp no seu iPhone",
      icon: <Smartphone size={20} />
    },
    {
      label: "Configurações",
      description: "Toque em 'Configurações' no canto inferior direito",
      icon: <Settings size={20} />
    },
    {
      label: "Dispositivos conectados",
      description: "Selecione 'Dispositivos conectados'",
      icon: <Link size={20} />
    },
    {
      label: "Conectar dispositivo",
      description: "Toque em 'Conectar um aparelho'",
      icon: <Wifi size={20} />
    },
    {
      label: "Autenticação",
      description: "Insira sua senha ou use biometria se solicitado",
      icon: <CheckCircle size={20} />
    },
    {
      label: "Escaneie o código",
      description: "Aponte a câmera para o código QR na tela",
      icon: <Camera size={20} />
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 300,
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          overflow: 'hidden',
          maxHeight: '90vh',
          height: 'auto',
          maxWidth: { xs: '95vw', sm: '90vw', md: 900 }
        }
      }}
    >
      <Fade in={open} timeout={300}>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ 
            position: 'relative',
            p: 3,
            pb: 2,
            background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-success) 100%)',
            color: 'white'
          }}>
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                backgroundColor: 'var(--text-gray-medium)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                width: 36,
                height: 36,
                '&:hover': {
                  backgroundColor: 'var(--text-gray-medium)',
                  opacity: 0.8,
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <X size={18} />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'var(--text-gray-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <QrCodeIcon size={28} style={{ color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  fontSize: '1.8rem',
                  mb: 0.5,
                  color: 'var(--text-gray-medium)'
                }}>
                  Conectar WhatsApp
                </Typography>
                <Typography variant="body1" sx={{ 
                  opacity: 0.9,
                  fontSize: '1rem',
                  color: 'var(--text-gray-medium)'
                }}>
                  Escaneie o código QR para conectar sua conta
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ 
            p: 3, 
            maxHeight: 'calc(90vh - 120px)', 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: 6
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'var(--bg-secondary)'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'var(--border-primary)',
              borderRadius: 3,
              '&:hover': {
                backgroundColor: 'var(--text-secondary)'
              }
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 3,
              flexDirection: { xs: 'column', md: 'row' }
            }}>
              {/* QR Code Section */}
              <Box sx={{ 
                flex: { xs: 'none', md: 1 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: { xs: '100%', md: 'auto' }
              }}>
                {/* Timer e Status */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 3,
                  width: '100%',
                  justifyContent: 'center'
                }}>
                  {!isExpired && qrCode && (
                    <Chip 
                      icon={<Clock size={16} />}
                      label={`${timeLeft}s restantes`}
                      color="primary"
                      variant="outlined"
                      sx={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: timeLeft > 15 ? 'var(--color-success)' : 'var(--color-warning)'
                      }}
                    />
                  )}
                  {isExpired && (
                    <Chip 
                      icon={<RefreshCw size={16} />}
                      label="Código expirado"
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* QR Code Display */}
                <Box sx={{
                  position: 'relative',
                  p: 3,
                  backgroundColor: 'white',
                  borderRadius: 3,
                  border: '3px solid var(--border-primary)',
                  boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  {loading ? (
                    <Box sx={{ 
                      width: { xs: 240, sm: 280 }, 
                      height: { xs: 240, sm: 280 }, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ color: 'var(--text-gray-medium)' }}>
                        Gerando código QR...
                      </Typography>
                    </Box>
                  ) : qrCode ? (
                    <Box sx={{
                      filter: isExpired ? 'grayscale(1) opacity(0.5)' : 'none',
                      transition: 'filter 0.3s ease'
                    }}>
                      <QRCode 
                        value={qrCode} 
                        size={window.innerWidth < 600 ? 240 : 280}
                        level="M"
                        includeMargin={true}
                        renderAs="svg"
                      />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      width: { xs: 240, sm: 280 }, 
                      height: { xs: 240, sm: 280 }, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Typography variant="body2" sx={{ color: 'var(--text-gray-medium)' }}>
                        Aguardando código QR...
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Refresh Button */}
                {(isExpired || !qrCode) && (
                  <Box sx={{ mt: 3 }}>
                    <GradientButton
                      onClick={handleRefreshQR}
                      disabled={loading}
                      startIcon={<RefreshCw size={18} />}
                      sx={{ minWidth: 160 }}
                    >
                      {loading ? 'Gerando...' : 'Gerar Novo Código'}
                    </GradientButton>
                  </Box>
                )}
              </Box>

              {/* Instructions Section */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ 
                  color: 'var(--text-gray-medium)',
                  fontWeight: 600,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Smartphone size={20} style={{ color: 'var(--text-gray-medium)' }} />
                  Como conectar seu WhatsApp
                </Typography>

                {/* Android Instructions */}
                <Accordion 
                  expanded={expandedAccordion === 'android'}
                  onChange={() => setExpandedAccordion(expandedAccordion === 'android' ? '' : 'android')}
                  sx={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px !important',
                    mb: 2,
                    '&:before': { display: 'none' },
                    boxShadow: 'none'
                  }}
                >
                  <AccordionSummary 
                    expandIcon={expandedAccordion === 'android' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    sx={{
                      minHeight: 56,
                      '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 }
                    }}
                  >
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      backgroundColor: '#34d399', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <Smartphone size={18} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
                      Para Android
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                    <Stepper orientation="vertical" sx={{ 
                      '& .MuiStepLabel-root': { 
                        alignItems: 'flex-start',
                        py: 1
                      },
                      '& .MuiStepContent-root': {
                        borderLeft: '2px solid var(--border-primary)',
                        ml: 2,
                        pl: 2,
                        py: 0.5
                      },
                      '& .MuiStepConnector-root': {
                        ml: 2,
                        '& .MuiStepConnector-line': {
                          borderLeftWidth: 2,
                          borderLeftColor: 'var(--border-primary)',
                          minHeight: 8
                        }
                      }
                    }}>
                      {androidSteps.map((step, index) => (
                        <Step key={index} active={true}>
                          <StepLabel
                            StepIconComponent={() => (
                              <Box sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}>
                                {index + 1}
                              </Box>
                            )}
                            sx={{
                              '& .MuiStepLabel-label': {
                                color: 'var(--text-gray-medium)',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                ml: 1
                              }
                            }}
                          >
                            {step.label}
                          </StepLabel>
                          <StepContent>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'var(--text-gray-medium)',
                                lineHeight: 1.4,
                                mb: 0.5,
                                fontSize: '0.8rem'
                              }}
                            >
                              {step.description}
                            </Typography>
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>
                  </AccordionDetails>
                </Accordion>

                {/* iOS Instructions */}
                <Accordion 
                  expanded={expandedAccordion === 'ios'}
                  onChange={() => setExpandedAccordion(expandedAccordion === 'ios' ? '' : 'ios')}
                  sx={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px !important',
                    mb: 2,
                    '&:before': { display: 'none' },
                    boxShadow: 'none'
                  }}
                >
                  <AccordionSummary 
                    expandIcon={expandedAccordion === 'ios' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    sx={{
                      minHeight: 56,
                      '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 }
                    }}
                  >
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      backgroundColor: '#3b82f6', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <Smartphone size={18} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
                      Para iPhone (iOS)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                    <Stepper orientation="vertical" sx={{ 
                      '& .MuiStepLabel-root': { 
                        alignItems: 'flex-start',
                        py: 1
                      },
                      '& .MuiStepContent-root': {
                        borderLeft: '2px solid var(--border-primary)',
                        ml: 2,
                        pl: 2,
                        py: 0.5
                      },
                      '& .MuiStepConnector-root': {
                        ml: 2,
                        '& .MuiStepConnector-line': {
                          borderLeftWidth: 2,
                          borderLeftColor: 'var(--border-primary)',
                          minHeight: 8
                        }
                      }
                    }}>
                      {iosSteps.map((step, index) => (
                        <Step key={index} active={true}>
                          <StepLabel
                            StepIconComponent={() => (
                              <Box sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}>
                                {index + 1}
                              </Box>
                            )}
                            sx={{
                              '& .MuiStepLabel-label': {
                                color: 'var(--text-gray-medium)',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                ml: 1
                              }
                            }}
                          >
                            {step.label}
                          </StepLabel>
                          <StepContent>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'var(--text-gray-medium)',
                                lineHeight: 1.4,
                                mb: 0.5,
                                fontSize: '0.8rem'
                              }}
                            >
                              {step.description}
                            </Typography>
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>
                  </AccordionDetails>
                </Accordion>

                {/* Important Notes */}
                <Alert 
                  severity="info" 
                  icon={<Info size={20} />}
                  sx={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      color: 'var(--color-info)'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Dicas importantes:
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ fontSize: '0.875rem' }}>
                    • Mantenha seu celular conectado à internet<br/>
                    • Não compartilhe este código com outras pessoas<br/>
                    • O código expira em 45 segundos por segurança<br/>
                    • Você pode gerar um novo código a qualquer momento
                  </Typography>
                </Alert>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Fade>
    </Dialog>
  );
};

export default React.memo(ModernQrCodeModal);