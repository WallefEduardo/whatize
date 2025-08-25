import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Avatar } from '@mui/material';
import { WhatsApp, Facebook, Instagram, Check } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import ModernModal from '../ModernModal';
import GradientButton from '../GradientButton';

/**
 * ConnectionTypeModal - Modal moderno para seleção de tipo de conexão
 * 
 * @param {Object} props
 * @param {boolean} props.open - Estado do modal (aberto/fechado)
 * @param {Function} props.onClose - Callback para fechar o modal
 * @param {Function} props.onSelectWhatsApp - Callback para seleção do WhatsApp
 * @param {Function} props.onSelectFacebook - Callback para seleção do Facebook
 * @param {Function} props.onSelectInstagram - Callback para seleção do Instagram
 * @param {Object} props.planConfig - Configuração do plano da empresa
 */
const ConnectionTypeModal = ({
  open = false,
  onClose = () => {},
  onSelectWhatsApp = () => {},
  onSelectFacebook = () => {},
  onSelectInstagram = () => {},
  planConfig = null
}) => {
  const [selectedType, setSelectedType] = useState(null);

  // Configurações dos tipos de conexão
  const connectionTypes = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Conecte sua conta WhatsApp Business para atendimento automático',
      icon: WhatsApp,
      color: '#25D366',
      gradient: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      shadowColor: '25, 211, 102',
      enabled: planConfig?.plan ? planConfig.plan.useWhatsapp : true,
      onSelect: onSelectWhatsApp
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Integre com Facebook Pages para atendimento via Messenger',
      icon: Facebook,
      color: '#1877F2',
      gradient: 'linear-gradient(135deg, #1877F2 0%, #0C4A9A 100%)',
      shadowColor: '24, 119, 242',
      enabled: planConfig?.plan ? planConfig.plan.useFacebook : true,
      onSelect: onSelectFacebook
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Conecte seu Instagram Business para mensagens diretas',
      icon: Instagram,
      color: '#E4405F',
      gradient: 'linear-gradient(135deg, #E4405F 0%, #833AB4 50%, #F77737 100%)',
      shadowColor: '228, 64, 95',
      enabled: planConfig?.plan ? planConfig.plan.useInstagram : true,
      onSelect: onSelectInstagram
    }
  ];

  const handleSelectType = (type) => {
    if (!type.enabled) return;
    setSelectedType(type.id);
  };

  const handleConfirmSelection = () => {
    const selectedConnection = connectionTypes.find(type => type.id === selectedType);
    if (selectedConnection) {
      if (selectedType === 'whatsapp') {
        selectedConnection.onSelect();
        onClose();
      }
      // Para Facebook e Instagram, não fazemos nada aqui pois o FacebookLogin já lida com isso
    }
  };

  const handleCloseModal = () => {
    setSelectedType(null);
    onClose();
  };

  return (
    <ModernModal
      open={open}
      onClose={handleCloseModal}
      title="Selecionar Tipo de Conexão"
      size="sm"
      showCloseButton={true}
      sx={{
        // Ajustes específicos para cada resolução
        '@media (max-width: 1600px) and (min-width: 1367px)': {
          // 1600x900 - mais largo
          width: '700px !important',
          maxHeight: '75vh',
          minHeight: 'auto'
        },
        '@media (max-width: 1366px) and (min-width: 1281px)': {
          // 1368x768 - largura média-grande
          width: '650px !important',
          maxHeight: '80vh',
          minHeight: 'auto'
        },
        '@media (max-width: 1280px) and (min-width: 1025px)': {
          // 1280x720 - largura média
          width: '580px !important',
          maxHeight: '75vh',
          minHeight: 'auto'
        },
        '@media (max-height: 768px)': {
          maxHeight: '90vh',
          overflow: 'auto'
        },
        // Para resoluções muito pequenas
        '@media (max-width: 1024px)': {
          width: '90vw !important',
          maxWidth: '450px !important',
          maxHeight: '85vh'
        }
      }}
    >
      <Box sx={{ 
        py: { xs: 1, sm: 2 },
        // Reduzir padding em resoluções menores
        '@media (max-height: 768px)': {
          py: 1
        }
      }}>
        <Typography
          variant="body1"
          sx={{
            color: 'var(--text-secondary)',
            mb: { xs: 2, sm: 3 },
            textAlign: 'center',
            fontWeight: 400,
            lineHeight: 1.5,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            // Reduzir margin em resoluções menores
            '@media (max-height: 768px)': {
              mb: 2,
              fontSize: '0.875rem'
            }
          }}
        >
          Escolha o tipo de conexão que deseja configurar para sua empresa
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: { xs: 2, sm: 3 },
          // Reduzir gap em resoluções menores
          '@media (max-height: 768px)': {
            gap: 1.5
          }
        }}>
          <AnimatePresence>
            {connectionTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ scale: type.enabled ? 1.02 : 1 }}
                whileTap={{ scale: type.enabled ? 0.98 : 1 }}
              >
                <Card
                  onClick={() => handleSelectType(type)}
                  sx={{
                    position: 'relative',
                    cursor: type.enabled ? 'pointer' : 'not-allowed',
                    opacity: type.enabled ? 1 : 0.6,
                    border: selectedType === type.id ? `2px solid ${type.color}` : '1px solid var(--border-primary)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: selectedType === type.id 
                      ? `linear-gradient(135deg, ${type.color}08 0%, ${type.color}03 100%)` 
                      : 'var(--bg-primary)',
                    boxShadow: selectedType === type.id 
                      ? `0 8px 32px rgba(${type.shadowColor}, 0.25)` 
                      : '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': type.enabled ? {
                      boxShadow: `0 12px 40px rgba(${type.shadowColor}, 0.2)`,
                      transform: 'translateY(-2px)'
                    } : {},
                    '&::before': selectedType === type.id ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: type.gradient,
                      zIndex: 1
                    } : {}
                  }}
                >
                  <CardContent sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    position: 'relative',
                    // Reduzir padding em resoluções menores
                    '@media (max-height: 768px)': {
                      p: 2
                    }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 2, sm: 3 },
                      // Reduzir gap em resoluções menores
                      '@media (max-height: 768px)': {
                        gap: 2
                      }
                    }}>
                      {/* Ícone com avatar gradiente */}
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          sx={{
                            width: { xs: 56, sm: 64 },
                            height: { xs: 56, sm: 64 },
                            background: type.gradient,
                            boxShadow: `0 8px 24px rgba(${type.shadowColor}, 0.3)`,
                            // Reduzir tamanho em resoluções menores
                            '@media (max-height: 768px)': {
                              width: 52,
                              height: 52
                            }
                          }}
                        >
                          <type.icon sx={{ 
                            fontSize: { xs: 28, sm: 32 }, 
                            color: 'white',
                            '@media (max-height: 768px)': {
                              fontSize: 26
                            }
                          }} />
                        </Avatar>
                        
                        {/* Badge de seleção */}
                        {selectedType === type.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              background: type.color,
                              borderRadius: '50%',
                              padding: '4px',
                              boxShadow: `0 4px 12px rgba(${type.shadowColor}, 0.4)`
                            }}
                          >
                            <Check sx={{ fontSize: 16, color: 'white' }} />
                          </motion.div>
                        )}
                      </Box>

                      {/* Informações */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '1.125rem',
                            mb: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          {type.name}
                          {!type.enabled && (
                            <Box
                              component="span"
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                px: 1.5,
                                py: 0.3,
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                borderRadius: 1,
                                border: '1px solid #FCD34D'
                              }}
                            >
                              BLOQUEADO
                            </Box>
                          )}
                        </Typography>
                        
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            fontWeight: 400
                          }}
                        >
                          {type.description}
                        </Typography>

                        {!type.enabled && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#DC2626',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              mt: 1,
                              display: 'block'
                            }}
                          >
                            Não disponível no seu plano atual
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>

        {/* Botões de ação */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 2, 
          mt: { xs: 2, sm: 3 }, 
          pt: { xs: 2, sm: 3 }, 
          borderTop: '1px solid var(--border-primary)',
          // Reduzir espaçamento em resoluções menores
          '@media (max-height: 768px)': {
            mt: 2,
            pt: 2
          }
        }}>
          <GradientButton
            variant="outlined"
            onClick={handleCloseModal}
            sx={{
              minWidth: 100,
              color: '#DC2626 !important',
              border: '1px solid #DC2626 !important',
              borderColor: '#DC2626 !important',
              backgroundColor: 'transparent !important',
              background: 'none !important',
              backgroundImage: 'none !important',
              boxShadow: 'none !important',
              '&:hover': {
                color: '#B91C1C !important',
                border: '1px solid #B91C1C !important',
                borderColor: '#B91C1C !important',
                backgroundColor: 'transparent !important',
                background: 'none !important',
                backgroundImage: 'none !important',
                boxShadow: 'none !important',
              }
            }}
          >
            Cancelar
          </GradientButton>

          {selectedType === 'whatsapp' && (
            <GradientButton
              onClick={handleConfirmSelection}
              sx={{
                minWidth: 120,
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Selecionar
            </GradientButton>
          )}

          {selectedType === 'facebook' && (
            <FacebookLogin
              appId={process.env.REACT_APP_FACEBOOK_APP_ID}
              autoLoad={false}
              fields="name,email,picture"
              version="23.0"
              scope={process.env.REACT_APP_REQUIRE_BUSINESS_MANAGEMENT?.toUpperCase() === "TRUE" ?
                "public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
                : "public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement"}
              callback={onSelectFacebook}
              render={(renderProps) => (
                <GradientButton
                  onClick={renderProps.onClick}
                  sx={{
                    minWidth: 120,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Conectar
                </GradientButton>
              )}
            />
          )}

          {selectedType === 'instagram' && (
            <FacebookLogin
              appId={process.env.REACT_APP_FACEBOOK_APP_ID}
              autoLoad={false}
              fields="name,email,picture"
              version="23.0"
              scope={process.env.REACT_APP_REQUIRE_BUSINESS_MANAGEMENT?.toUpperCase() === "TRUE" ?
                "public_profile,instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
                : "public_profile,instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement"}
              callback={onSelectInstagram}
              render={(renderProps) => (
                <GradientButton
                  onClick={renderProps.onClick}
                  sx={{
                    minWidth: 120,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Conectar
                </GradientButton>
              )}
            />
          )}

          {!selectedType && (
            <GradientButton
              disabled
              sx={{
                minWidth: 120,
                opacity: 0.6,
              }}
            >
              Selecionar uma opção
            </GradientButton>
          )}
        </Box>
      </Box>
    </ModernModal>
  );
};

export default ConnectionTypeModal;