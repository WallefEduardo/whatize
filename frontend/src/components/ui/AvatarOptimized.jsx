import React, { useState } from 'react';
import { Box, styled } from '@mui/material';

const PulseBox = styled(Box)({
  '@keyframes pulse': {
    '0%, 100%': { opacity: 0.6 },
    '50%': { opacity: 1 }
  },
  animation: 'pulse 1.5s ease-in-out infinite'
});

const AvatarOptimized = ({ 
  src, 
  alt = "Avatar", 
  size = "xl", 
  fallbackText = "",
  children 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Tamanhos em pixels
  const sizeMap = {
    sm: { width: 24, height: 24, fontSize: 10 },
    md: { width: 32, height: 32, fontSize: 12 },
    lg: { width: 40, height: 40, fontSize: 14 },
    xl: { width: 48, height: 48, fontSize: 16 },
    xxl: { width: 64, height: 64, fontSize: 18 }
  };

  const dimensions = sizeMap[size] || sizeMap.xl;

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Gera iniciais do nome para fallback
  const getInitials = (text) => {
    if (!text) return "?";
    return text
      .split(" ")
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: dimensions.fontSize,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        userSelect: 'none'
      }}
    >
      {/* Imagem principal */}
      {src && !imageError && (
        <img
          src={src}
          alt={alt}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block',
            zIndex: 1
          }}
        />
      )}

      {/* Loading placeholder enquanto carrega */}
      {src && !imageLoaded && !imageError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0
          }}
        >
          <PulseBox
            sx={{
              width: '60%',
              height: '60%',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary)'
            }}
          />
        </Box>
      )}

      {/* Fallback com iniciais */}
      {(!src || imageError) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            fontSize: dimensions.fontSize,
            fontWeight: 700,
            zIndex: 2
          }}
        >
          {children || getInitials(fallbackText)}
        </Box>
      )}

    </Box>
  );
};

// Componente wrapper para compatibilidade com sistema atual
const AvatarImage = ({ src, alt, ...props }) => (
  <AvatarOptimized src={src} alt={alt} {...props} />
);

const AvatarFallback = ({ children, ...props }) => (
  <AvatarOptimized {...props}>{children}</AvatarOptimized>
);

export { AvatarOptimized as Avatar, AvatarImage, AvatarFallback };
export default AvatarOptimized;