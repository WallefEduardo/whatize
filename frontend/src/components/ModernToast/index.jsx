import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { 
  CheckCircle, 
  AlertCircle as ErrorIcon, 
  AlertTriangle as WarningIcon, 
  Info as InfoIcon,
  X as Close,
  Loader2 as Loading
} from 'lucide-react';

/**
 * ModernToast - Componente de toast moderno com estilo aprimorado
 * 
 * @param {Object} props
 * @param {string} props.type - Tipo do toast ('success', 'error', 'warning', 'info')
 * @param {string} props.title - Título do toast
 * @param {string} props.message - Mensagem do toast
 * @param {Function} props.onClose - Callback para fechar o toast
 * @param {boolean} props.visible - Se o toast está visível
 */
const ModernToast = ({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  visible = true,
  ...props 
}) => {
  // Configurações de estilo para cada tipo
  const getToastConfig = (toastType) => {
    const configs = {
      success: {
        icon: CheckCircle,
        iconColor: '#ffffff',
        borderColor: 'var(--color-accent, #00C307)',
        backgroundColor: '#ffffff',
        textColor: 'var(--color-accent, #00C307)',
        borderLeftColor: 'var(--color-accent, #00C307)',
        title: 'Sucesso!'
      },
      error: {
        icon: ErrorIcon,
        iconColor: '#ffffff',
        borderColor: '#dc2626',
        backgroundColor: '#ffffff',
        textColor: '#dc2626',
        borderLeftColor: '#dc2626',
        title: 'Erro!'
      },
      warning: {
        icon: WarningIcon,
        iconColor: '#ffffff',
        borderColor: '#f59e0b',
        backgroundColor: '#ffffff',
        textColor: '#f59e0b',
        borderLeftColor: '#f59e0b',
        title: 'Atenção!'
      },
      info: {
        icon: InfoIcon,
        iconColor: '#ffffff',
        borderColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#3b82f6',
        borderLeftColor: '#3b82f6',
        title: 'Informação!'
      }
    };

    return configs[toastType] || configs.info;
  };

  const config = getToastConfig(type);
  const IconComponent = config.icon;
  const displayTitle = title || config.title;

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        border: `1px solid ${config.borderColor}`,
        borderLeft: `64px solid ${config.borderLeftColor}`,
        padding: '14px',
        borderRadius: '8px',
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        minWidth: '450px',
        maxWidth: '650px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '-16px',
          marginTop: '-8px',
          marginLeft: 0,
          width: 0,
          height: 0,
          borderLeft: `8px solid ${config.borderLeftColor}`,
          borderRight: '8px solid transparent',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
        }
      }}
      {...props}
    >
      {/* Ícone na área colorida à esquerda */}
      <Box
        sx={{
          position: 'absolute',
          left: '-44px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <IconComponent 
          size={20} 
          color={config.iconColor}
          style={{ 
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' 
          }}
        />
      </Box>

      {/* Conteúdo do toast */}
      <Box sx={{ flex: 1, paddingRight: 1 }}>
        <Typography 
          component="span" 
          sx={{ 
            fontWeight: 700, 
            marginRight: 1,
            fontSize: '14px',
            color: config.textColor
          }}
        >
          {displayTitle}
        </Typography>
        <Typography 
          component="span" 
          sx={{ 
            fontSize: '14px',
            color: 'var(--text-primary)',
            lineHeight: 1.4
          }}
        >
          {message}
        </Typography>
      </Box>

      {/* Botão de fechar */}
      {onClose && (
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            marginLeft: 'auto',
            color: 'var(--text-secondary)',
            '&:hover': {
              color: 'var(--text-primary)',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <Close size={16} />
        </IconButton>
      )}
    </Box>
  );
};

export default ModernToast;