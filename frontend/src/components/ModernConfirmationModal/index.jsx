import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Fade,
  Backdrop,
  Button
} from '@mui/material';
import { X, AlertTriangle, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import GradientButton from '../GradientButton';

const ModernConfirmationModal = ({
  open = false,
  onClose,
  onConfirm,
  title = "Confirmar ação",
  message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning", // "warning", "danger", "success", "info"
  loading = false,
  icon,
  ...props
}) => {
  // Configurações por tipo
  const getTypeConfig = (type) => {
    switch (type) {
      case "danger":
        return {
          color: '#ef4444',
          bgColor: '#fee2e2',
          icon: icon || Trash2,
          confirmButtonColor: '#ef4444',
          confirmButtonHoverColor: '#dc2626'
        };
      case "warning":
        return {
          color: '#f59e0b',
          bgColor: '#fef3c7',
          icon: icon || AlertTriangle,
          confirmButtonColor: '#f59e0b',
          confirmButtonHoverColor: '#d97706'
        };
      case "success":
        return {
          color: '#10b981',
          bgColor: '#d1fae5',
          icon: icon || CheckCircle,
          confirmButtonColor: '#10b981',
          confirmButtonHoverColor: '#059669'
        };
      case "info":
      default:
        return {
          color: '#3b82f6',
          bgColor: '#dbeafe',
          icon: icon || AlertCircle,
          confirmButtonColor: '#3b82f6',
          confirmButtonHoverColor: '#2563eb'
        };
    }
  };

  const config = getTypeConfig(type);
  const IconComponent = config.icon;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          overflow: 'visible'
        }
      }}
      {...props}
    >
      <Fade in={open} timeout={300}>
        <DialogContent sx={{ p: 0, overflow: 'visible' }}>
          {/* Header com ícone de fechar */}
          <Box sx={{ 
            position: 'relative',
            p: 3,
            pb: 2
          }}>
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                width: 36,
                height: 36,
                '&:hover': {
                  backgroundColor: 'var(--hover-bg-light)',
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <X size={18} />
            </IconButton>

            {/* Ícone principal */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              mb: 3
            }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: config.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${config.color}22, ${config.color}11)`,
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                },
                '@keyframes pulse': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                    opacity: 1
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                    opacity: 0.8
                  }
                }
              }}>
                <IconComponent size={32} style={{ color: config.color }} />
              </Box>
            </Box>

            {/* Título */}
            <Typography 
              variant="h5" 
              sx={{ 
                textAlign: 'center',
                color: 'var(--text-primary)',
                fontWeight: 700,
                mb: 2,
                fontSize: '1.5rem'
              }}
            >
              {title}
            </Typography>

            {/* Mensagem */}
            <Typography 
              variant="body1" 
              sx={{ 
                textAlign: 'center',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                fontSize: '1rem',
                maxWidth: 400,
                mx: 'auto'
              }}
            >
              {message}
            </Typography>
          </Box>

          {/* Footer com botões */}
          <Box sx={{ 
            p: 3,
            pt: 2,
            borderTop: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            display: 'flex',
            gap: 2,
            justifyContent: 'center'
          }}>
            {/* Botão Cancelar */}
            <Button
              onClick={onClose}
              disabled={loading}
              variant="outlined"
              sx={{
                minWidth: 120,
                height: 44,
                borderColor: '#ef4444',
                color: '#ef4444',
                backgroundColor: 'transparent',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  borderColor: '#dc2626',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626'
                },
                '&:disabled': {
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }
              }}
            >
              {cancelText}
            </Button>

            {/* Botão Confirmar */}
            <GradientButton
              onClick={onConfirm}
              disabled={loading}
              sx={{
                minWidth: 120,
                height: 44,
                backgroundColor: config.confirmButtonColor,
                color: 'white',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: config.confirmButtonHoverColor,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 8px 25px -8px ${config.confirmButtonColor}66`
                },
                '&:disabled': {
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  transform: 'none'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Processando...' : confirmText}
            </GradientButton>
          </Box>
        </DialogContent>
      </Fade>
    </Dialog>
  );
};

export default ModernConfirmationModal;