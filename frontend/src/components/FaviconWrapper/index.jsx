import { useEffect } from 'react';

// Implementação nativa de Favicon sem dependências externas
const FaviconWrapper = ({ animated = true, url = '/favicon.ico', alertCount = 0, iconSize = 32 }) => {
  useEffect(() => {
    // Encontrar ou criar o elemento favicon
    let favicon = document.querySelector('link[rel="icon"]') || 
                  document.querySelector('link[rel="shortcut icon"]');
    
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/x-icon';
      document.head.appendChild(favicon);
    }

    // Se tem alertCount e animated, criar favicon com badge
    if (animated && alertCount > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = iconSize;
      canvas.height = iconSize;
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Desenhar ícone original
          ctx.drawImage(img, 0, 0, iconSize, iconSize);
          
          // Desenhar badge
          const badgeSize = Math.max(10, iconSize * 0.4);
          const badgeX = iconSize - badgeSize;
          const badgeY = 0;
          
          // Círculo vermelho
          ctx.fillStyle = '#f44336';
          ctx.beginPath();
          ctx.arc(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, 0, 2 * Math.PI);
          ctx.fill();
          
          // Texto
          ctx.fillStyle = 'white';
          ctx.font = `bold ${Math.max(8, badgeSize * 0.6)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const countText = alertCount > 99 ? '99+' : alertCount.toString();
          ctx.fillText(countText, badgeX + badgeSize/2, badgeY + badgeSize/2);
          
          favicon.href = canvas.toDataURL('image/png');
        } catch (error) {
          favicon.href = url;
        }
      };
      
      img.onerror = () => favicon.href = url;
      img.src = url;
    } else {
      favicon.href = url;
    }
  }, [animated, url, alertCount, iconSize]);

  return null; // Não renderiza nada
};

export default FaviconWrapper;