import React from "react";
import { Button, Typography, Box } from "@mui/material";
import ModernModal from "../ModernModal";
import { i18n } from "../../translate/i18n";

const ConfirmationModal = ({ title, children, open, onClose, onConfirm }) => {
  return (
    <ModernModal
      open={open}
      onClose={() => onClose(false)}
      title={title}
      size="sm"
      showCloseButton={true}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {children}
        </Typography>
      </Box>

      {/* Botões padronizados */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 2,
        mt: 2
      }}>
        <Button
          onClick={() => onClose(false)}
          variant="outlined"
          sx={{
            minWidth: 100,
            textTransform: 'none',
            borderRadius: '4px !important',
            color: '#6b7280 !important',
            borderColor: '#6b7280 !important',
            backgroundColor: 'transparent !important',
            '&:hover': {
              borderColor: '#4b5563 !important',
              color: '#4b5563 !important',
              backgroundColor: 'rgba(107, 114, 128, 0.04) !important',
            }
          }}
        >
          {i18n.t("confirmationModal.buttons.cancel")}
        </Button>
        <Button
          onClick={() => {
            onClose(false);
            onConfirm();
          }}
          variant="outlined"
          sx={{
            minWidth: 100,
            textTransform: 'none',
            borderRadius: '4px !important',
            color: '#dc2626 !important',
            borderColor: '#dc2626 !important',
            backgroundColor: 'transparent !important',
            '&:hover': {
              borderColor: '#b91c1c !important',
              color: '#b91c1c !important',
              backgroundColor: 'rgba(220, 38, 38, 0.04) !important',
            }
          }}
        >
          {i18n.t("confirmationModal.buttons.confirm")}
        </Button>
      </Box>
    </ModernModal>
  );
};

export default ConfirmationModal;