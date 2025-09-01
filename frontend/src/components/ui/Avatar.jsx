import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Avatar usando Material-UI (padrão do sistema)
const StyledAvatar = styled(Box)(({ theme, size = "lg", variant = "default" }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  color: 'var(--text-primary)',
  userSelect: 'none',
  transition: 'all 0.2s ease',
  borderRadius: '50%',
  overflow: 'hidden',
  border: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-secondary)',
  flexShrink: 0,
  
  // Sizes
  ...(size === 'sm' && {
    width: '24px',
    height: '24px',
    fontSize: '12px',
  }),
  ...(size === 'md' && {
    width: '32px',
    height: '32px',
    fontSize: '14px',
  }),
  ...(size === 'lg' && {
    width: '40px',
    height: '40px',
    fontSize: '14px',
  }),
  ...(size === 'xl' && {
    width: '48px',
    height: '48px',
    fontSize: '16px',
  }),
  ...(size === 'xxl' && {
    width: '64px',
    height: '64px',
    fontSize: '18px',
  }),
  
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center center', // ✅ Centraliza perfeitamente
    borderRadius: 'inherit',
    display: 'block' // Remove espaços em branco
  }
}));

// Avatar Root Component
export const Avatar = React.forwardRef(({ 
  size = "lg",
  variant = "default", 
  children,
  className,
  sx,
  ...props 
}, ref) => (
  <StyledAvatar
    ref={ref}
    size={size}
    variant={variant}
    className={className}
    sx={sx}
    {...props}
  >
    {children}
  </StyledAvatar>
));
Avatar.displayName = "Avatar";

// Avatar Image Component
export const AvatarImage = React.forwardRef(({ 
  src,
  alt = "",
  className,
  onError,
  ...props 
}, ref) => {
  const [hasError, setHasError] = React.useState(false);
  
  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  if (hasError || !src) {
    return null;
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center center',
        display: 'block',
        borderRadius: 'inherit',
        ...props.style
      }}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

// Avatar Fallback Component
export const AvatarFallback = React.forwardRef(({ 
  children,
  className,
  ...props 
}, ref) => (
  <Box
    ref={ref}
    component="span"
    className={className}
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      textTransform: 'uppercase',
    }}
    {...props}
  >
    {children}
  </Box>
));
AvatarFallback.displayName = "AvatarFallback";

// Avatar Group Component para múltiplos avatars
export const AvatarGroup = React.forwardRef(({ 
  max = 3,
  children,
  className,
  spacing = -8,
  sx,
  ...props 
}, ref) => {
  const avatars = React.Children.toArray(children);
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <Box
      ref={ref}
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        '& > *:not(:first-of-type)': {
          marginLeft: `${spacing}px`,
        },
        ...sx
      }}
      {...props}
    >
      {visibleAvatars.map((avatar, index) => (
        <Box
          key={index}
          sx={{
            zIndex: max - index,
            border: '2px solid white',
            borderRadius: 'inherit'
          }}
        >
          {avatar}
        </Box>
      ))}
      {remainingCount > 0 && (
        <Avatar
          size="lg"
          variant="default"
          sx={{ 
            zIndex: 0,
            border: '2px solid white',
            bgcolor: 'var(--bg-secondary)',
            color: 'var(--text-primary)'
          }}
        >
          <AvatarFallback>+{remainingCount}</AvatarFallback>
        </Avatar>
      )}
    </Box>
  );
});
AvatarGroup.displayName = "AvatarGroup";

export default Avatar;