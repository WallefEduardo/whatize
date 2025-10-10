import React, { useState, useRef, useEffect, memo } from 'react';
import { Box, Typography, IconButton, Backdrop, Dialog } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Close, Download, ZoomIn } from '@mui/icons-material';
import api from '../../../services/api';
import { sanitizeMediaUrl } from './mediaUtils';

// ============= PREVIEW COMPONENTS =============
const PreviewImageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ isSent }) => ({
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: 'var(--bg-secondary)',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  maxWidth: '250px',
  width: '100%',
  alignSelf: isSent ? 'flex-end' : 'flex-start',

  '&:hover': {
    transform: 'scale(1.02)',
    '& .image-overlay': {
      opacity: 1,
    }
  },
}));

const StyledImage = styled('img')(() => ({
  width: '100%',
  height: 'auto',
  maxHeight: '300px',
  objectFit: 'cover',
  display: 'block',
  borderRadius: 'inherit',
}));

const LoadingPlaceholder = styled(Box)(() => ({
  width: '100%',
  height: '200px',
  backgroundColor: 'var(--bg-tertiary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  animation: 'pulse 1.5s ease-in-out infinite',

  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
}));

const ImageOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  borderRadius: 'inherit',
}));

const ErrorContainer = styled(Box)(() => ({
  padding: '16px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '8px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
}));

// ============= MODAL COMPONENTS =============
const StyledDialog = styled(Dialog)(() => ({
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  '& .MuiDialog-paper': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    maxWidth: '100vw',
    maxHeight: '100vh',
    margin: 0,
    overflow: 'hidden',
  },
}));

const ModalWrapper = styled(Box)(() => ({
  position: 'relative',
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

const ModalHeader = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '64px',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: '0 20px',
  gap: '12px',
  zIndex: 10,
}));

const HeaderButton = styled(IconButton)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  width: '48px',
  height: '48px',

  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: 'scale(1.05)',
  },

  transition: 'all 0.2s ease',
}));

const ImageViewer = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '80px 20px 20px',

  '& img': {
    maxWidth: '90vw',
    maxHeight: '85vh',
    objectFit: 'contain',
    borderRadius: '4px',
  },
}));

/**
 * ImageMessage Component - Renderiza mensagens de imagem com preview e modal
 */
const ImageMessage = ({
  message,
  isSent = false,
  onLoad,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState('');
  const imageRef = useRef(null);

  const { mediaUrl, body } = message;

  // URL para exibição imediata (sanitizada ou blob)
  const displayUrl = blobUrl || (mediaUrl?.startsWith('blob:') ? mediaUrl : sanitizeMediaUrl(mediaUrl));

  // Carregar imagem em background (sem bloquear renderização)
  useEffect(() => {
    if (!mediaUrl) {
      setHasError(true);
      return;
    }

    // Se já é blob, não precisa buscar
    if (mediaUrl.startsWith('blob:')) {
      setBlobUrl(mediaUrl);
      onLoad?.();
      return;
    }

    // Buscar blob em background para melhor qualidade
    const fetchImage = async () => {
      try {
        const cleanUrl = sanitizeMediaUrl(mediaUrl);
        const { data, headers } = await api.get(cleanUrl, {
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(
          new Blob([data], { type: headers['content-type'] })
        );

        setBlobUrl(url);
        onLoad?.();
      } catch (error) {
        console.error('Erro ao carregar imagem:', error);
        // Não marcar erro - a URL direta pode funcionar
        onError?.();
      }
    };

    fetchImage();

    // Cleanup
    return () => {
      if (blobUrl && !mediaUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [mediaUrl, onLoad, onError]);

  const handleImageClick = () => {
    if (!hasError) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();

    try {
      if (blobUrl) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `image-${message.id || Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const cleanUrl = sanitizeMediaUrl(mediaUrl);
        const { data } = await api.get(cleanUrl, { responseType: 'blob' });
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `image-${message.id || Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
    }
  };

  // Estado de erro
  if (hasError) {
    return (
      <ErrorContainer>
        <Typography variant="body2">
          ❌ Erro ao carregar imagem
        </Typography>
      </ErrorContainer>
    );
  }

  return (
    <>
      {/* Preview da imagem */}
      <PreviewImageContainer isSent={isSent} onClick={handleImageClick}>
        <StyledImage
          ref={imageRef}
          src={displayUrl}
          alt="Imagem da mensagem"
          loading="lazy"
        />
        <ImageOverlay className="image-overlay">
          <ZoomIn sx={{ fontSize: 32 }} />
        </ImageOverlay>
      </PreviewImageContainer>

      {/* Modal de visualização */}
      <StyledDialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth={false}
        fullScreen
      >
        <ModalWrapper>
          {/* Header com botões */}
          <ModalHeader>
            <HeaderButton
              onClick={handleDownload}
              title="Baixar imagem"
              aria-label="Baixar imagem"
            >
              <Download />
            </HeaderButton>

            <HeaderButton
              onClick={handleCloseModal}
              title="Fechar"
              aria-label="Fechar visualizador"
            >
              <Close />
            </HeaderButton>
          </ModalHeader>

          {/* Visualizador da imagem */}
          <ImageViewer onClick={handleCloseModal}>
            <img
              src={blobUrl || sanitizeMediaUrl(mediaUrl)}
              alt="Imagem em tamanho completo"
              onClick={(e) => e.stopPropagation()}
            />
          </ImageViewer>
        </ModalWrapper>
      </StyledDialog>
    </>
  );
};

// Otimização com React.memo
export default memo(ImageMessage, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.mediaUrl === nextProps.message.mediaUrl &&
    prevProps.message.body === nextProps.message.body &&
    prevProps.isSent === nextProps.isSent
  );
});
