import React from 'react';
import { 
  Box, 
  MenuList, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Paper,
  Popper,
  ClickAwayListener,
  Grow
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../utils/cn';

// Styled components
const StyledDropdownContent = styled(Paper)(({ theme }) => ({
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  padding: '4px',
  minWidth: '128px',
  maxHeight: '300px',
  overflowY: 'auto',
  zIndex: 1000,
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  borderRadius: '4px',
  padding: '8px 12px',
  margin: '2px 0',
  fontSize: '14px',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  transition: 'all 0.2s ease',
  
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  },
  
  '&.Mui-selected': {
    backgroundColor: 'var(--color-accent)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'var(--color-green-hover)',
    },
  },
  
  '&.Mui-disabled': {
    color: 'var(--text-disabled)',
    cursor: 'not-allowed',
  }
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: '4px 0',
  borderColor: 'var(--border-primary)',
}));

// Context for Dropdown state
const DropdownContext = React.createContext({});

// Dropdown Root Component
export const Dropdown = ({ children, open: controlledOpen, onOpenChange }) => {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  
  const handleOpenChange = React.useCallback((newOpen, element = null) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setOpen(newOpen);
    }
    setAnchorEl(element);
  }, [isControlled, onOpenChange]);

  const value = React.useMemo(() => ({
    open: isOpen,
    onOpenChange: handleOpenChange,
    anchorEl,
  }), [isOpen, handleOpenChange, anchorEl]);

  return (
    <DropdownContext.Provider value={value}>
      {children}
    </DropdownContext.Provider>
  );
};
Dropdown.displayName = "Dropdown";

// Dropdown Trigger Component
export const DropdownTrigger = React.forwardRef(({ 
  children,
  className,
  asChild = false,
  ...props 
}, ref) => {
  const { onOpenChange, open } = React.useContext(DropdownContext);
  
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onOpenChange?.(!open, event.currentTarget);
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
DropdownTrigger.displayName = "DropdownTrigger";

// Dropdown Content Component  
export const DropdownContent = React.forwardRef(({ 
  size = "md",
  children,
  className,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  ...props 
}, ref) => {
  const { open, onOpenChange, anchorEl } = React.useContext(DropdownContext);

  const handleClickAway = () => {
    onOpenChange?.(false);
  };

  if (!open || !anchorEl) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement={`${side}-${align}`}
      transition
      style={{ zIndex: 1000 }}
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, sideOffset],
          },
        },
      ]}
    >
      {({ TransitionProps }) => (
        <Grow {...TransitionProps} timeout={200}>
          <div>
            <ClickAwayListener onClickAway={handleClickAway}>
              <StyledDropdownContent
                ref={ref}
                className={className}
                {...props}
              >
                {children}
              </StyledDropdownContent>
            </ClickAwayListener>
          </div>
        </Grow>
      )}
    </Popper>
  );
});
DropdownContent.displayName = "DropdownContent";

// Dropdown Item Component
export const DropdownItem = React.forwardRef(({ 
  children,
  className,
  onClick,
  disabled = false,
  destructive = false,
  icon,
  ...props 
}, ref) => {
  const { onOpenChange } = React.useContext(DropdownContext);
  
  const handleClick = (event) => {
    event.preventDefault();
    onClick?.(event);
    onOpenChange?.(false);
  };

  return (
    <StyledMenuItem
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        destructive && "text-red-600 focus:text-red-600 focus:bg-red-50",
        className
      )}
      {...props}
    >
      {icon && (
        <ListItemIcon sx={{ minWidth: '20px', color: 'inherit' }}>
          {icon}
        </ListItemIcon>
      )}
      <ListItemText primary={children} />
    </StyledMenuItem>
  );
});
DropdownItem.displayName = "DropdownItem";

// Dropdown Separator Component
export const DropdownSeparator = React.forwardRef(({ 
  className,
  ...props 
}, ref) => (
  <StyledDivider
    ref={ref}
    className={className}
    {...props}
  />
));
DropdownSeparator.displayName = "DropdownSeparator";

// Dropdown Label Component
export const DropdownLabel = React.forwardRef(({ 
  children,
  className,
  ...props 
}, ref) => (
  <Box
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </Box>
));
DropdownLabel.displayName = "DropdownLabel";

export default Dropdown;