import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Button } from "@mui/material";
import { X } from "lucide-react";

/**
 * ModernModal - Componente de modal moderno com animação ZoomInUp
 * 
 * @param {Object} props
 * @param {boolean} props.open - Estado do modal (aberto/fechado)
 * @param {Function} props.onClose - Callback para fechar o modal
 * @param {string} props.title - Título do modal
 * @param {React.ReactNode} props.children - Conteúdo do modal
 * @param {string} props.size - Tamanho do modal ('sm', 'md', 'lg', 'xl')
 * @param {boolean} props.showCloseButton - Mostrar botão X no header
 * @param {Array} props.actions - Array de botões de ação com tipos padronizados
 *   - action.type: 'save'|'confirm'|'primary' (verde), 'cancel'|'delete'|'danger' (vermelho), outros (cinza)
 *   - action.label: Texto do botão
 *   - action.onClick: Callback do clique
 *   - action.disabled: Estado disabled
 * @param {Object} props.sx - Estilos customizados
 * 
 * @example
 * <ModernModal 
 *   open={open} 
 *   onClose={onClose} 
 *   title="Confirmar ação"
 *   size="sm"
 *   actions={[
 *     { type: 'cancel', label: 'Cancelar', onClick: onCancel },
 *     { type: 'save', label: 'Salvar', onClick: onSave }
 *   ]}
 * >
 *   Conteúdo do modal
 * </ModernModal>
 */
const ModernModal = ({
  open = false,
  onClose = () => {},
  title = "Modal Title",
  children,
  size = "md",
  showCloseButton = true,
  actions = [],
  sx = {},
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Configurações de tamanho
  const sizeConfig = {
    sm: { maxWidth: '600px', minWidth: '500px', minHeight: '400px' },
    md: { maxWidth: '750px', minWidth: '650px', minHeight: '500px' },
    lg: { maxWidth: '900px', minWidth: '800px', minHeight: '600px' },
    xl: { maxWidth: '1200px', minWidth: '1000px', minHeight: '700px' }
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  // Controlar visibilidade e animação
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 150); // Tempo para animação de saída
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        opacity: isAnimating ? 1 : 0,
        transition: 'opacity 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`animate__animated ${isAnimating ? 'animate__zoomInUp' : 'animate__zoomOut'}`}
        style={{
          width: '100%',
          ...currentSize,
          animationDuration: '0.3s'
        }}
      >
        <Box
          sx={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-primary)',
            ...sx
          }}
          {...props}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              py: 2,
              backgroundColor: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-primary)'
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.125rem',
                color: 'var(--text-primary)'
              }}
            >
              {title}
            </Typography>
            
            {showCloseButton && (
              <IconButton
                onClick={onClose}
                sx={{
                  color: 'var(--text-secondary)',
                  padding: 1,
                  '&:hover': {
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--hover-bg-light)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={20} />
              </IconButton>
            )}
          </Box>

          {/* Content */}
          <Box
            sx={{
              p: 3,
              color: 'var(--text-primary)'
            }}
          >
            {children}
          </Box>

          {/* Actions */}
          {actions.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 2,
                borderTop: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              {actions.map((action, index) => {
                // Definir estilos baseados no tipo
                const getButtonStyles = (type) => {
                  const baseStyles = {
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    minWidth: 100,
                    variant: 'outlined',
                    backgroundColor: 'transparent',
                    borderRadius: '4px !important'
                  };

                  switch (type) {
                    case 'save':
                    case 'confirm':
                    case 'primary':
                      return {
                        ...baseStyles,
                        color: 'var(--color-accent) !important',
                        borderColor: 'var(--color-accent) !important',
                        '&:hover': {
                          borderColor: 'var(--color-green-dark) !important',
                          color: 'var(--color-green-dark) !important',
                          backgroundColor: 'rgba(0, 195, 7, 0.04) !important',
                        }
                      };
                    case 'cancel':
                    case 'delete':
                    case 'danger':
                      return {
                        ...baseStyles,
                        color: '#dc2626 !important',
                        borderColor: '#dc2626 !important',
                        '&:hover': {
                          borderColor: '#b91c1c !important',
                          color: '#b91c1c !important',
                          backgroundColor: 'rgba(220, 38, 38, 0.04) !important',
                        }
                      };
                    default:
                      return {
                        ...baseStyles,
                        color: '#6b7280 !important',
                        borderColor: '#6b7280 !important',
                        '&:hover': {
                          borderColor: '#4b5563 !important',
                          color: '#4b5563 !important',
                          backgroundColor: 'rgba(107, 114, 128, 0.04) !important',
                        }
                      };
                  }
                };

                const buttonStyles = getButtonStyles(action.type);
                
                return (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    variant="outlined"
                    disabled={action.disabled || false}
                    sx={{
                      ...buttonStyles,
                      '&:disabled': {
                        color: 'rgba(0,0,0,0.26) !important',
                        borderColor: 'rgba(0,0,0,0.12) !important',
                        backgroundColor: 'transparent !important'
                      },
                      ...action.sx
                    }}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>
      </div>
    </div>
  );
};

export default ModernModal;