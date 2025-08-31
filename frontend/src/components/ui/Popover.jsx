import React from 'react';
import { 
  Box, 
  Paper,
  Popper,
  ClickAwayListener,
  Grow
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../utils/cn';

// Styled components
const StyledPopoverContent = styled(Paper)(({ theme, size = "md" }) => ({
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  maxHeight: '400px',
  overflowY: 'auto',
  zIndex: 1000,
  outline: 'none',
  
  // Sizes
  ...(size === 'sm' && {
    width: '192px',
    padding: '8px',
  }),
  ...(size === 'md' && {
    width: '288px',
    padding: '16px',
  }),
  ...(size === 'lg' && {
    width: '384px',
    padding: '24px',
  }),
  ...(size === 'auto' && {
    width: 'auto',
    padding: '16px',
  }),
  
  '&:focus': {
    outline: 'none',
  }
}));

// Context for Popover state
const PopoverContext = React.createContext({});

// Popover Root Component
export const Popover = ({ children, open: controlledOpen, onOpenChange }) => {
  const [open, setOpen] = React.useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  
  const handleOpenChange = React.useCallback((newOpen) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setOpen(newOpen);
    }
  }, [isControlled, onOpenChange]);

  const value = React.useMemo(() => ({
    open: isOpen,
    onOpenChange: handleOpenChange,
  }), [isOpen, handleOpenChange]);

  return (
    <PopoverContext.Provider value={value}>
      {children}
    </PopoverContext.Provider>
  );
};
Popover.displayName = "Popover";

// Popover Trigger Component
export const PopoverTrigger = React.forwardRef(({ 
  children,
  className,
  asChild = false,
  ...props 
}, ref) => {
  const { onOpenChange, open } = React.useContext(PopoverContext);
  
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onOpenChange?.(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ref,
      onClick: handleClick,
      'aria-expanded': open,
      'aria-haspopup': true,
    });
  }

  return (
    <Box
      ref={ref}
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
      aria-expanded={open}
      aria-haspopup={true}
      {...props}
    >
      {children}
    </Box>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

// Popover Content Component  
export const PopoverContent = React.forwardRef(({ 
  size,
  children,
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions = true,
  ...props 
}, ref) => {
  const { open, onOpenChange } = React.useContext(PopoverContext);
  const anchorRef = React.useRef(null);
  
  React.useEffect(() => {
    // Find the trigger element
    const trigger = document.querySelector('[aria-expanded="true"]');
    if (trigger) {
      anchorRef.current = trigger;
    }
  }, [open]);

  const handleClickAway = () => {
    onOpenChange?.(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onOpenChange?.(false);
    }
  };

  if (!open) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorRef.current}
      placement={`${side}-${align}`}
      transition
      style={{ zIndex: 1000 }}
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [alignOffset, sideOffset],
          },
        },
        avoidCollisions && {
          name: 'flip',
          options: {
            fallbackPlacements: ['top', 'right', 'left'],
          },
        },
        avoidCollisions && {
          name: 'preventOverflow',
          options: {
            padding: 8,
          },
        },
      ].filter(Boolean)}
    >
      {({ TransitionProps }) => (
        <Grow {...TransitionProps} timeout={200}>
          <div>
            <ClickAwayListener onClickAway={handleClickAway}>
              <StyledPopoverContent
                ref={ref}
                size={size}
                className={className}
                onKeyDown={handleKeyDown}
                tabIndex={-1}
                {...props}
              >
                {children}
              </StyledPopoverContent>
            </ClickAwayListener>
          </div>
        </Grow>
      )}
    </Popper>
  );
});
PopoverContent.displayName = "PopoverContent";

// Popover Arrow Component (opcional)
export const PopoverArrow = React.forwardRef(({ 
  className,
  ...props 
}, ref) => (
  <Box
    ref={ref}
    className={cn(
      "fill-popover stroke-border",
      className
    )}
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
PopoverArrow.displayName = "PopoverArrow";

// Popover Close Component
export const PopoverClose = React.forwardRef(({ 
  children,
  className,
  asChild = false,
  ...props 
}, ref) => {
  const { onOpenChange } = React.useContext(PopoverContext);
  
  const handleClick = () => {
    onOpenChange?.(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ref,
      onClick: handleClick,
    });
  }

  return (
    <Box
      ref={ref}
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </Box>
  );
});
PopoverClose.displayName = "PopoverClose";

export default Popover;