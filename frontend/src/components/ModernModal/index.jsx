import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

  // Sistema de detecção de resolução inteligente
  const getScreenSize = () => {
    if (typeof window === 'undefined') return 'lg';
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Detectar resoluções específicas
    if (width >= 1920) return 'fullhd';     // Full HD+ (manter original)
    if (width >= 1366) return 'laptop';     // 1366x768 (~60% largura)
    if (width >= 1280) return 'hd';         // 1280x720 (~55% largura)
    if (width >= 1024) return 'tablet';     // 1024x768 (~70% largura)
    return 'mobile';                        // Mobile responsivo
  };

  // Configurações de tamanho por resolução específica
  const getResponsiveConfig = (baseSize) => {
    const screenType = getScreenSize();
    const baseSizes = {
      sm: { width: 600, height: 400 },
      md: { width: 750, height: 500 },
      lg: { width: 900, height: 600 },
      xl: { width: 1200, height: 700 }
    };
    
    const currentBase = baseSizes[baseSize] || baseSizes.md;
    
    switch (screenType) {
      case 'fullhd':
        // Full HD+ - tamanhos originais (não mexer!)
        return {
          width: `${currentBase.width}px`,
          minHeight: `${currentBase.height}px`
        };
      
      case 'laptop':
        // 1366x768 - ~60% da largura original
        return {
          width: `${Math.round(currentBase.width * 0.6)}px`,
          minHeight: `${Math.round(currentBase.height * 0.85)}px`
        };
      
      case 'hd':
        // 1280x720 - ~55% da largura original  
        return {
          width: `${Math.round(currentBase.width * 0.55)}px`,
          minHeight: `${Math.round(currentBase.height * 0.8)}px`
        };
      
      case 'tablet':
        // 1024x768 - ~70% da largura original
        return {
          width: `${Math.round(currentBase.width * 0.7)}px`,
          minHeight: `${Math.round(currentBase.height * 0.85)}px`
        };
      
      case 'mobile':
      default:
        // Mobile - responsivo inteligente
        return {
          width: '90vw',
          maxWidth: '500px',
          minHeight: '300px'
        };
    }
  };

  const currentSize = getResponsiveConfig(size);

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

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 99999,
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: getScreenSize() === 'mobile' ? '10px' : '20px',
        opacity: isAnimating ? 1 : 0,
        transition: 'all 0.15s ease-out'
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`animate__animated ${isAnimating ? 'animate__zoomInUp' : 'animate__zoomOut'}`}
        style={{
          animationDuration: '0.3s',
          width: '100%',
          maxWidth: '100%'
        }}
      >
        <Box
          sx={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-primary)',
            width: currentSize.width,
            maxWidth: currentSize.maxWidth || 'none',
            minHeight: currentSize.minHeight,
            maxHeight: getScreenSize() === 'mobile' ? '90vh' : 'none',
            display: 'flex',
            flexDirection: 'column',
            mx: 'auto',
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
              px: { xs: 2, sm: 3 },
              py: { xs: 1.5, sm: 2 },
              backgroundColor: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-primary)',
              flexShrink: 0
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.125rem' },
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                pr: 1
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
              p: { xs: 2, sm: 3 },
              color: 'var(--text-primary)',
              flex: 1,
              overflow: 'auto',
              maxHeight: '100%'
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
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, sm: 2 },
                borderTop: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-secondary)',
                flexShrink: 0
              }}
            >
              {actions.map((action, index) => {
                // Definir estilos baseados no tipo
                const getButtonStyles = (type) => {
                  const baseStyles = {
                    textTransform: 'none',
                    fontWeight: 600,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 0.8, sm: 1 },
                    minWidth: { xs: 80, sm: 100 },
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
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

  return createPortal(modalContent, document.body);
};

export default ModernModal;