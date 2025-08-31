import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Card Components usando Material-UI
const StyledCard = styled(Box)(({ theme, variant = 'default' }) => ({
  borderRadius: '8px',
  border: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  
  ...(variant === 'elevated' && {
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }),
  
  ...(variant === 'outline' && {
    border: '2px solid var(--border-primary)',
    backgroundColor: 'transparent',
  }),
  
  ...(variant === 'filled' && {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-secondary)',
  }),
}));

const StyledCardHeader = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 24px 16px 24px',
  gap: '6px',
}));

const StyledCardContent = styled(Box)(() => ({
  padding: '0 24px 24px 24px',
}));

const StyledCardTitle = styled('h3')(() => ({
  fontSize: '18px',
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: '-0.025em',
  color: 'var(--text-primary)',
  margin: 0,
}));

const StyledCardDescription = styled('p')(() => ({
  fontSize: '14px',
  color: 'var(--text-secondary)',
  margin: 0,
  lineHeight: 1.5,
}));

// Card Root Component
export const Card = React.forwardRef(({ 
  variant = 'default',
  children,
  sx,
  ...props 
}, ref) => (
  <StyledCard
    ref={ref}
    variant={variant}
    sx={sx}
    {...props}
  >
    {children}
  </StyledCard>
));
Card.displayName = "Card";

// Card Header Component
export const CardHeader = React.forwardRef(({ 
  children,
  sx,
  ...props 
}, ref) => (
  <StyledCardHeader
    ref={ref}
    sx={sx}
    {...props}
  >
    {children}
  </StyledCardHeader>
));
CardHeader.displayName = "CardHeader";

// Card Content Component  
export const CardContent = React.forwardRef(({ 
  children,
  sx,
  ...props 
}, ref) => (
  <StyledCardContent
    ref={ref}
    sx={sx}
    {...props}
  >
    {children}
  </StyledCardContent>
));
CardContent.displayName = "CardContent";

// Card Title Component
export const CardTitle = React.forwardRef(({ 
  children,
  sx,
  ...props 
}, ref) => (
  <StyledCardTitle
    ref={ref}
    style={sx}
    {...props}
  >
    {children}
  </StyledCardTitle>
));
CardTitle.displayName = "CardTitle";

// Card Description Component
export const CardDescription = React.forwardRef(({ 
  children,
  sx,
  ...props 
}, ref) => (
  <StyledCardDescription
    ref={ref}
    style={sx}
    {...props}
  >
    {children}
  </StyledCardDescription>
));
CardDescription.displayName = "CardDescription";

export default Card;