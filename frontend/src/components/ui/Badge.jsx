import React from 'react';
import { Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBadge = styled(Box)(({ theme, variant = 'default', size = 'default', removable = false }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '9999px',
  border: '1px solid transparent',
  fontSize: '12px',
  fontWeight: 600,
  transition: 'all 0.2s ease',
  
  '&:focus': {
    outline: 'none',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
  },
  
  // Size variants
  ...(size === 'default' && {
    padding: '2px 10px',
    fontSize: '12px',
  }),
  ...(size === 'sm' && {
    padding: '2px 8px',
    fontSize: '12px',
  }),
  ...(size === 'lg' && {
    padding: '4px 12px',
    fontSize: '14px',
  }),
  
  // Removable adjustment
  ...(removable && {
    paddingRight: '4px',
  }),
  
  // Variant styles
  ...(variant === 'default' && {
    backgroundColor: 'var(--color-accent)',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: 'var(--color-green-hover)',
    },
  }),
  ...(variant === 'secondary' && {
    backgroundColor: 'var(--text-secondary)',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: 'var(--text-primary)',
    },
  }),
  ...(variant === 'destructive' && {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
    },
  }),
  ...(variant === 'outline' && {
    backgroundColor: 'transparent',
    borderColor: 'var(--border-primary)',
    color: 'var(--text-primary)',
    '&:hover': {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
    },
  }),
  ...(variant === 'success' && {
    backgroundColor: '#dcfce7',
    color: '#166534',
  }),
  ...(variant === 'warning' && {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  }),
  ...(variant === 'info' && {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  }),
  ...(variant === 'muted' && {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    '&:hover': {
      backgroundColor: 'var(--bg-primary)',
    },
  }),
}));

export const Badge = React.forwardRef(({ 
  variant, 
  size,
  removable,
  onRemove,
  children,
  sx,
  ...props 
}, ref) => (
  <StyledBadge
    ref={ref}
    variant={variant}
    size={size}
    removable={removable}
    sx={sx}
    {...props}
  >
    <Box sx={{ flex: 1 }}>{children}</Box>
    {removable && onRemove && (
      <IconButton
        size="small"
        onClick={onRemove}
        sx={{
          marginLeft: '4px',
          width: '16px',
          height: '16px',
          padding: 0,
          borderRadius: '50%',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          },
          '&:focus': {
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <svg
          width="12"
          height="12"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </IconButton>
    )}
  </StyledBadge>
));
Badge.displayName = "Badge";

export default Badge;