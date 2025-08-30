import React from 'react';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Save, X, ArrowLeft } from 'lucide-react';

// Botão base com estilos comuns
const BaseButton = styled(Button)(({ theme }) => ({
  height: '36px',
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: 'Inter, sans-serif',
  borderRadius: '4px !important',
  textTransform: 'none',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '0 16px',
  minWidth: '80px',
  
  '&:focus': {
    outline: 'none',
  },
  
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
}));

// Botão Salvar (Verde - Accent)
const SaveButton = styled(BaseButton)(({ theme }) => ({
  backgroundColor: 'var(--color-accent)',
  color: '#ffffff',
  border: '1px solid var(--color-accent)',
  
  '&:hover': {
    backgroundColor: 'var(--color-green-hover, #00e608)',
    borderColor: 'var(--color-green-hover, #00e608)',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 195, 7, 0.2)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
    backgroundColor: 'var(--color-green-dark, #00a006)',
  },
}));

// Botão Cancelar (Vermelho)
const CancelButton = styled(BaseButton)(({ theme }) => ({
  backgroundColor: 'var(--bg-primary)',
  color: '#ef4444',
  border: '1px solid #ef4444',
  
  '&:hover': {
    backgroundColor: 'var(--bg-secondary, #fef2f2)',
    borderColor: '#dc2626',
    color: '#dc2626',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
    backgroundColor: 'var(--bg-secondary, #fee2e2)',
  },
}));

// Botão Voltar (Verde outline)
const BackButton = styled(BaseButton)(({ theme }) => ({
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--color-accent)',
  border: '1px solid var(--color-accent)',
  
  '&:hover': {
    backgroundColor: 'rgba(0, 195, 7, 0.05)',
    borderColor: 'var(--color-green-hover, #00e608)',
    color: 'var(--color-green-hover, #00e608)',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 195, 7, 0.15)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
    backgroundColor: 'rgba(0, 195, 7, 0.1)',
  },
}));

const FormButtons = ({
  // Configuração dos botões
  showSave = true,
  showCancel = true,
  showBack = false,
  
  // Textos personalizados
  saveText = "Salvar",
  cancelText = "Cancelar", 
  backText = "Voltar",
  
  // Handlers
  onSave,
  onCancel,
  onBack,
  
  // Estados
  saveDisabled = false,
  cancelDisabled = false,
  backDisabled = false,
  
  // Loading
  saveLoading = false,
  
  // Ícones (opcional, usa padrão se não informado)
  saveIcon = null,
  cancelIcon = null,
  backIcon = null,
  
  // Layout
  justifyContent = 'flex-end',
  gap = 2,
  
  // Props extras
  ...props
}) => {
  const getSaveIcon = () => {
    if (saveIcon === false) return null;
    return saveIcon || <Save size={16} />;
  };

  const getCancelIcon = () => {
    if (cancelIcon === false) return null;
    return cancelIcon || <X size={16} />;
  };

  const getBackIcon = () => {
    if (backIcon === false) return null;
    return backIcon || <ArrowLeft size={16} />;
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: justifyContent,
        alignItems: 'center',
        gap: gap,
        mt: 2,
        pt: 2,
        borderTop: '1px solid var(--border-primary)',
      }}
      {...props}
    >
      {/* Botão Voltar */}
      {showBack && (
        <BackButton
          onClick={onBack}
          disabled={backDisabled}
          startIcon={getBackIcon()}
        >
          {backText}
        </BackButton>
      )}

      {/* Botão Cancelar */}
      {showCancel && (
        <CancelButton
          onClick={onCancel}
          disabled={cancelDisabled}
          startIcon={getCancelIcon()}
        >
          {cancelText}
        </CancelButton>
      )}

      {/* Botão Salvar */}
      {showSave && (
        <SaveButton
          onClick={onSave}
          disabled={saveDisabled || saveLoading}
          startIcon={saveLoading ? null : getSaveIcon()}
        >
          {saveLoading ? 'Salvando...' : saveText}
        </SaveButton>
      )}
    </Box>
  );
};

// Componentes individuais para casos específicos
export const SaveButtonComponent = ({ children, loading, ...props }) => (
  <SaveButton 
    disabled={loading}
    startIcon={loading ? null : <Save size={16} />}
    {...props}
  >
    {loading ? 'Salvando...' : (children || 'Salvar')}
  </SaveButton>
);

export const CancelButtonComponent = ({ children, ...props }) => (
  <CancelButton 
    startIcon={<X size={16} />}
    {...props}
  >
    {children || 'Cancelar'}
  </CancelButton>
);

export const BackButtonComponent = ({ children, ...props }) => (
  <BackButton 
    startIcon={<ArrowLeft size={16} />}
    {...props}
  >
    {children || 'Voltar'}
  </BackButton>
);

export default FormButtons;