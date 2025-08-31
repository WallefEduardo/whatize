import React from 'react';
import { 
  Tooltip as MuiTooltip, 
  Box
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../utils/cn';

// Styled Tooltip usando Material-UI
const StyledTooltip = styled(MuiTooltip)(({ theme, variant = "default", size = "md" }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: 
      variant === 'dark' ? '#111827' :
      variant === 'light' ? '#ffffff' :
      variant === 'destructive' ? '#ef4444' :
      variant === 'success' ? '#16a34a' :
      variant === 'warning' ? '#d97706' :
      variant === 'info' ? '#2563eb' :
      'var(--color-accent)',
    color: 
      variant === 'light' ? '#111827' : '#ffffff',
    border: 
      variant === 'light' ? '1px solid #e5e7eb' : 'none',
    borderRadius: '6px',
    fontWeight: 500,
    maxWidth: '200px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    
    // Sizes
    ...(size === 'sm' && {
      fontSize: '10px',
      padding: '4px 8px',
    }),
    ...(size === 'md' && {
      fontSize: '12px',
      padding: '6px 12px',
    }),
    ...(size === 'lg' && {
      fontSize: '14px',
      padding: '8px 16px',
    }),
    
    '&[data-popper-placement*="bottom"] .MuiTooltip-arrow': {
      top: 0,
      left: '50%',
      marginTop: '-0.71em',
      width: '2em',
      height: '1em',
      '&::before': {
        borderWidth: '0 1em 1em 1em',
        borderColor: `transparent transparent ${
          variant === 'dark' ? '#111827' :
          variant === 'light' ? '#ffffff' :
          variant === 'destructive' ? '#ef4444' :
          variant === 'success' ? '#16a34a' :
          variant === 'warning' ? '#d97706' :
          variant === 'info' ? '#2563eb' :
          'var(--color-accent)'
        } transparent`,
      },
    },
    '&[data-popper-placement*="top"] .MuiTooltip-arrow': {
      bottom: 0,
      left: '50%',
      marginBottom: '-0.71em',
      width: '2em',
      height: '1em',
      '&::before': {
        borderWidth: '1em 1em 0 1em',
        borderColor: `${
          variant === 'dark' ? '#111827' :
          variant === 'light' ? '#ffffff' :
          variant === 'destructive' ? '#ef4444' :
          variant === 'success' ? '#16a34a' :
          variant === 'warning' ? '#d97706' :
          variant === 'info' ? '#2563eb' :
          'var(--color-accent)'
        } transparent transparent transparent`,
      },
    },
    '&[data-popper-placement*="right"] .MuiTooltip-arrow': {
      left: 0,
      marginLeft: '-0.71em',
      height: '2em',
      width: '1em',
      '&::before': {
        borderWidth: '1em 1em 1em 0',
        borderColor: `transparent ${
          variant === 'dark' ? '#111827' :
          variant === 'light' ? '#ffffff' :
          variant === 'destructive' ? '#ef4444' :
          variant === 'success' ? '#16a34a' :
          variant === 'warning' ? '#d97706' :
          variant === 'info' ? '#2563eb' :
          'var(--color-accent)'
        } transparent transparent`,
      },
    },
    '&[data-popper-placement*="left"] .MuiTooltip-arrow': {
      right: 0,
      marginRight: '-0.71em',
      height: '2em',
      width: '1em',
      '&::before': {
        borderWidth: '1em 0 1em 1em',
        borderColor: `transparent transparent transparent ${
          variant === 'dark' ? '#111827' :
          variant === 'light' ? '#ffffff' :
          variant === 'destructive' ? '#ef4444' :
          variant === 'success' ? '#16a34a' :
          variant === 'warning' ? '#d97706' :
          variant === 'info' ? '#2563eb' :
          'var(--color-accent)'
        }`,
      },
    },
  },
  '& .MuiTooltip-arrow': {
    fontSize: '1rem',
    width: '2em',
    height: '1em',
    '&::before': {
      content: '""',
      margin: 'auto',
      display: 'block',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    },
  },
}));

// Tooltip Root Component
export const Tooltip = React.forwardRef(({ 
  children,
  title,
  variant = "default",
  size = "md",
  placement = "top",
  arrow = true,
  delayDuration = 700,
  className,
  ...props 
}, ref) => {
  if (!title) {
    return children;
  }

  return (
    <StyledTooltip
      ref={ref}
      title={title}
      variant={variant}
      size={size}
      placement={placement}
      arrow={arrow}
      enterDelay={delayDuration}
      leaveDelay={0}
      className={className}
      {...props}
    >
      {children}
    </StyledTooltip>
  );
});
Tooltip.displayName = "Tooltip";

// TooltipProvider Component (para compatibilidade)
export const TooltipProvider = ({ children, delayDuration = 700, ...props }) => {
  return (
    <Box {...props}>
      {children}
    </Box>
  );
};
TooltipProvider.displayName = "TooltipProvider";

// TooltipTrigger Component (para compatibilidade com shadcn/ui pattern)
export const TooltipTrigger = React.forwardRef(({ 
  children,
  className,
  ...props 
}, ref) => (
  <Box
    ref={ref}
    className={className}
    {...props}
  >
    {children}
  </Box>
));
TooltipTrigger.displayName = "TooltipTrigger";

// TooltipContent Component (para compatibilidade com shadcn/ui pattern)
export const TooltipContent = React.forwardRef(({ 
  children,
  side = "top",
  align = "center",
  className,
  ...props 
}, ref) => (
  <Box
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  >
    {children}
  </Box>
));
TooltipContent.displayName = "TooltipContent";

// TooltipArrow Component (para compatibilidade com shadcn/ui pattern)
export const TooltipArrow = React.forwardRef(({ 
  className,
  ...props 
}, ref) => (
  <Box
    ref={ref}
    className={cn("fill-primary", className)}
    {...props}
  >
    <svg
      width="16"
      height="6"
      viewBox="0 0 16 6"
      className="absolute top-full z-10 h-[6px] w-4 -translate-x-1/2"
    >
      <path d="m0 6 8-6 8 6" />
    </svg>
  </Box>
));
TooltipArrow.displayName = "TooltipArrow";

export default Tooltip;