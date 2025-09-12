import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { X, Trash2, UserX, Users } from 'lucide-react';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '12px',
    padding: '0',
    maxWidth: '400px',
    width: '100%',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '18px',
  fontWeight: 600,
  borderBottom: '1px solid var(--border-primary)',
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: '24px',
  backgroundColor: 'var(--bg-primary)',
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: '16px 24px',
  backgroundColor: 'var(--bg-primary)',
  borderTop: '1px solid var(--border-primary)',
  gap: '8px',
}));

const OptionButton = styled(Button)(({ theme, variant }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 20px',
  borderRadius: '8px',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  width: '100%',
  justifyContent: 'flex-start',
  transition: 'all 0.2s ease',
  border: '1px solid var(--border-primary)',
  
  ...(variant === 'delete-all' && {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: 'rgba(244, 67, 54, 0.3)',
    color: '#f44336',
    '&:hover': {
      backgroundColor: 'rgba(244, 67, 54, 0.2)',
      borderColor: '#f44336',
    },
  }),
  
  ...(variant === 'delete-me' && {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
    color: '#ff9800',
    '&:hover': {
      backgroundColor: 'rgba(255, 193, 7, 0.2)',
      borderColor: '#ff9800',
    },
  }),
  
  ...(variant === 'cancel' && {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border-primary)',
    color: 'var(--text-primary)',
    '&:hover': {
      backgroundColor: 'var(--bg-tertiary)',
      borderColor: 'var(--border-secondary)',
    },
  }),
}));

const DeleteMessageModal = ({ open, onClose, onDeleteForAll, messageText }) => {
  const handleDeleteForAll = () => {
    onDeleteForAll();
    onClose();
  };

  const truncatedText = messageText && messageText.length > 50 
    ? `${messageText.substring(0, 50)}...` 
    : messageText;

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm">
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Trash2 size={20} color="var(--text-primary)" />
          Apagar mensagem
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ 
            color: 'var(--text-secondary)',
            '&:hover': { color: 'var(--text-primary)' }
          }}
        >
          <X size={18} />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <OptionButton variant="delete-all" onClick={handleDeleteForAll} sx={{ marginTop: '20px' }}>
            <Users size={18} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Apagar para todos
            </Typography>
          </OptionButton>
        </Box>
      </StyledDialogContent>

      <StyledDialogActions>
        <OptionButton variant="cancel" onClick={onClose} sx={{ margin: 0 }}>
          <X size={18} />
          Cancelar
        </OptionButton>
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default DeleteMessageModal;