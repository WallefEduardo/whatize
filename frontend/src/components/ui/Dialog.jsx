import React, { useState, useContext, createContext } from 'react';
import { 
  Dialog as MUIDialog,
  DialogTitle as MUIDialogTitle,
  DialogContent as MUIDialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { X } from 'lucide-react';

// Dialog Context
const DialogContext = createContext();

// Dialog Root
export const Dialog = ({ children, open, onClose, maxWidth = "sm" }) => {
  const [isOpen, setIsOpen] = useState(open || false);
  
  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };
  
  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <DialogContext.Provider value={{ isOpen, handleClose, handleOpen }}>
      <MUIDialog
        open={isOpen}
        onClose={handleClose}
        maxWidth={maxWidth}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-primary, #ffffff)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-primary, #e5e7eb)',
            minWidth: '400px',
            maxWidth: '600px'
          }
        }}
      >
        {children}
      </MUIDialog>
    </DialogContext.Provider>
  );
};

// Dialog Trigger
export const DialogTrigger = ({ children, asChild = false }) => {
  const { handleOpen } = useContext(DialogContext);
  
  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleOpen
    });
  }
  
  return (
    <Box onClick={handleOpen} sx={{ cursor: 'pointer' }}>
      {children}
    </Box>
  );
};

// Dialog Content
export const DialogContent = ({ children, ...props }) => {
  const { handleClose } = useContext(DialogContext);
  
  return (
    <>
      <MUIDialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingBottom: '16px',
        position: 'relative'
      }}>
        <Box />
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'var(--text-gray-medium, #6b7280)',
            '&:hover': {
              backgroundColor: 'var(--hover-bg-light, #f3f4f6)'
            }
          }}
        >
          <X size={20} />
        </IconButton>
      </MUIDialogTitle>
      
      <MUIDialogContent sx={{ paddingTop: 0, paddingX: 3 }}>
        {children}
      </MUIDialogContent>
    </>
  );
};

// Dialog Header
export const DialogHeader = ({ children, ...props }) => {
  return (
    <Box sx={{ mb: 2 }} {...props}>
      {children}
    </Box>
  );
};

// Dialog Title
export const DialogTitle = ({ children, ...props }) => {
  return (
    <Typography
      variant="h6"
      component="h2"
      sx={{ 
        fontSize: '1.125rem',
        fontWeight: 600,
        color: 'var(--text-primary, #1f2937)',
        lineHeight: 1.4
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

// Dialog Footer
export const DialogFooter = ({ children, ...props }) => {
  return (
    <DialogActions 
      sx={{ 
        padding: '16px 24px',
        borderTop: '1px solid var(--border-primary, #e5e7eb)',
        gap: 1,
        justifyContent: 'flex-end'
      }}
      {...props}
    >
      {children}
    </DialogActions>
  );
};

// Dialog Close
export const DialogClose = ({ children, asChild = false }) => {
  const { handleClose } = useContext(DialogContext);
  
  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleClose
    });
  }
  
  return (
    <Box onClick={handleClose} sx={{ cursor: 'pointer' }}>
      {children}
    </Box>
  );
};

export default Dialog;