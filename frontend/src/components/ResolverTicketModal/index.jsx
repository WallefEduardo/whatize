import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import ModernModal from '../ModernModal';
import GradientButton from '../GradientButton';
import { XCircle, MessageCircle, CheckCircle2 } from 'lucide-react';

const ResolverTicketModal = ({ 
  isVisible, 
  onClose, 
  onResolverSemMensagem, 
  onResolverComMensagem,
  contactName = 'contato' 
}) => {
  
  // Hook para detectar dimensões da janela
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Chama uma vez para setar o valor inicial
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detecta se deve usar layout compacto para resoluções problemáticas
  const isCompactLayout = (
    (windowSize.width >= 1200 && windowSize.width <= 1400 && windowSize.height <= 800) || // 1268x768
    (windowSize.width >= 1500 && windowSize.width <= 1700 && windowSize.height <= 950)    // 1600x900
  );
  

  const handleResolverSem = () => {
    onResolverSemMensagem();
    onClose();
  };

  const handleResolverCom = () => {
    onResolverComMensagem();
    onClose();
  };

  return (
    <ModernModal
      open={isVisible}
      onClose={onClose}
      title="Resolver"
      size={isCompactLayout ? "lg" : "sm"}
      sx={isCompactLayout ? {
        '& .MuiDialog-paper': {
          minWidth: '700px',
          maxWidth: '800px'
        }
      } : {}}
    >
      <Box sx={{ p: isCompactLayout ? 3 : { xs: 2, sm: 3 } }}>
        {/* Header - compacto para resoluções específicas */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isCompactLayout ? 'row' : {
            xs: 'row', // horizontal em mobile
            sm: 'row', // horizontal em tablet pequeno (768px+)
            md: 'column', // vertical em desktop médio (900px+)
            lg: 'column' // vertical em desktop grande
          },
          alignItems: 'center',
          gap: isCompactLayout ? 2 : { xs: 2, md: 0 },
          mb: isCompactLayout ? 4 : { xs: 2, sm: 3, md: 4 }
        }}>
          <Box sx={{
            width: isCompactLayout ? '48px' : { 
              xs: '40px', // mobile
              sm: '48px', // tablet pequeno  
              md: '64px', // desktop médio+
            },
            height: isCompactLayout ? '48px' : { 
              xs: '40px', 
              sm: '48px', 
              md: '64px' 
            },
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
            flexShrink: 0,
            mb: isCompactLayout ? 0 : { xs: 0, md: 2 }
          }}>
            <CheckCircle2 size={32} color="white" />
          </Box>
          
          <Box sx={{ 
            flex: isCompactLayout ? 1 : { xs: 1, md: 'initial' },
            textAlign: isCompactLayout ? 'left' : { xs: 'left', md: 'center' }
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: isCompactLayout ? 0.5 : { xs: 0.5, md: 1 },
                color: 'var(--text-primary)',
                fontSize: isCompactLayout ? '16px' : { xs: '16px', sm: '18px', md: '20px' },
                fontWeight: 600,
                lineHeight: isCompactLayout ? 1.2 : { xs: 1.2, md: 1.3 }
              }}
            >
              Resolver Conversa
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'var(--text-secondary)',
                fontSize: isCompactLayout ? '13px' : { xs: '13px', sm: '14px' },
                lineHeight: isCompactLayout ? 1.3 : { xs: 1.3, md: 1.4 }
              }}
            >
              Como você gostaria de finalizar esta conversa?
            </Typography>
          </Box>
        </Box>

        {/* Botões modernos */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: isCompactLayout ? 2 : { xs: 1, sm: 1.5, md: 2 },
            flexDirection: 'column', // sempre vertical para manter layout original
            mb: isCompactLayout ? 3 : 0 // espaço extra antes da dica
          }}
        >
          <GradientButton
            variant="primary"
            size="large"
            onClick={handleResolverCom}
            startIcon={<MessageCircle size={18} />}
            sx={{ 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              padding: isCompactLayout ? '8px 16px' : { 
                xs: '8px 12px', // mobile - compacto
                sm: '10px 16px', // tablet pequeno - compacto  
                md: '12px 24px', // desktop médio+ - normal
                lg: '14px 28px' // desktop grande - maior
              },
              borderRadius: isCompactLayout ? '6px' : { xs: '6px', sm: '8px', md: '12px' },
              fontWeight: 600,
              fontSize: isCompactLayout ? '12px' : { xs: '12px', sm: '13px', md: '14px' },
              textTransform: 'none',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              minHeight: isCompactLayout ? '36px' : { xs: '38px', sm: '42px', md: '48px' },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 25px rgba(16, 185, 129, 0.4)',
                background: 'linear-gradient(135deg, #0F9B70 0%, #047857 100%)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Resolver com Mensagem de Despedida
          </GradientButton>

          <GradientButton
            variant="secondary"
            size="large"
            onClick={handleResolverSem}
            startIcon={<XCircle size={18} />}
            sx={{ 
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: 'white',
              padding: isCompactLayout ? '8px 16px' : { 
                xs: '8px 12px', // mobile - compacto
                sm: '10px 16px', // tablet pequeno - compacto
                md: '12px 24px', // desktop médio+ - normal  
                lg: '14px 28px' // desktop grande - maior
              },
              borderRadius: isCompactLayout ? '6px' : { xs: '6px', sm: '8px', md: '12px' },
              fontWeight: 600,
              fontSize: isCompactLayout ? '12px' : { xs: '12px', sm: '13px', md: '14px' },
              textTransform: 'none',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
              minHeight: isCompactLayout ? '36px' : { xs: '38px', sm: '42px', md: '48px' },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 25px rgba(245, 158, 11, 0.4)',
                background: 'linear-gradient(135deg, #E5890A 0%, #C2620C 100%)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Resolver sem Mensagem de Despedida
          </GradientButton>
        </Box>

        {/* Nota informativa */}
        <Box sx={{
          mt: isCompactLayout ? 2 : { xs: 1.5, sm: 2, md: 3 },
          p: isCompactLayout ? 1 : { xs: 1, sm: 1.5, md: 2 },
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderRadius: isCompactLayout ? '4px' : { xs: '4px', sm: '6px', md: '8px' },
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'var(--text-secondary)',
              fontSize: isCompactLayout ? '10px' : { xs: '10px', sm: '11px', md: '12px' },
              lineHeight: 1.4,
              display: 'block'
            }}
          >
            💡 <strong>Dica:</strong> {isCompactLayout ? 'Mensagens de despedida mantêm uma comunicação profissional.' : 'Mensagens de despedida ajudam a manter uma comunicação profissional e cordial com seus clientes.'}
          </Typography>
        </Box>
      </Box>
    </ModernModal>
  );
};

export default ResolverTicketModal;