import React, { useState, useRef, useEffect, memo } from 'react';
import { Box, Typography, IconButton, Backdrop, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Close, Download, ZoomIn } from '@mui/icons-material';
import { getBackendUrl } from '../../../config';
import api from '../../../services/api';
import { sanitizeMediaUrl } from './mediaUtils';

const ImageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: 'var(--bg-secondary)',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  maxWidth: '250px', // Reduzido de 300px para 250px
  width: '100%',

  '&:hover': {
    transform: 'scale(1.02)',
    '& .image-overlay': {
      opacity: 1,
    }
  },

  // Diferente alinhamento baseado em quem enviou
  alignSelf: isSent ? 'flex-end' : 'flex-start',
}));

const StyledImage = styled('img')(() => ({
  width: '100%',
  height: 'auto',
  maxHeight: '300px', // Reduzido de 400px para 300px
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
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
    '100%': {
      opacity: 1,
    },
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

const ModalContainer = styled(Backdrop)(() => ({
  zIndex: 1300,
  color: '#fff',
}));

const ModalContent = styled(Paper)(() => ({
  position: 'relative',
  maxWidth: '70vw', // Reduzido de 90vw para 70vw
  maxHeight: '70vh', // Reduzido de 90vh para 70vh
  outline: 'none',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: 'transparent',
  boxShadow: 'none',
}));

const ModalImage = styled('img')(() => ({
  width: '100%',
  height: 'auto',
  maxWidth: '70vw', // Reduzido de 90vw para 70vw
  maxHeight: '70vh', // Reduzido de 90vh para 70vh
  objectFit: 'contain',
  borderRadius: '8px',
}));

const ModalActions = styled(Box)(() => ({
  position: 'absolute',
  top: '16px',
  right: '16px',
  display: 'flex',
  gap: '8px',
}));

const ActionButton = styled(IconButton)(() => ({
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
}));

const Caption = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  padding: '8px 12px',
  fontSize: '14px',
  lineHeight: 1.4,
  color: 'var(--text-primary)',
  backgroundColor: isSent
    ? 'rgba(0, 195, 7, 0.15)'
    : 'var(--bg-secondary)',
  borderRadius: '0 0 8px 8px',
  wordBreak: 'break-word',
}));

const ErrorContainer = styled(Box)(() => ({
  padding: '16px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '8px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
}));

/**
 * ImageMessage - Componente para renderizar mensagens de imagem
 *
 * Props:
 * - message: objeto da mensagem com mediaUrl, body (legenda)
 * - isSent: boolean se a mensagem foi enviada pelo usuário
 * - onLoad: callback quando imagem carrega
 * - onError: callback quando imagem falha
 */
const ImageMessage = ({
  message,
  isSent = false,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState('');
  const imageRef = useRef(null);

  const { mediaUrl, body } = message;

  useEffect(() => {
    // Usar API para carregar imagem (mesmo padrão do sistema original)
    if (!mediaUrl) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const fetchImage = async () => {
      try {
        // 🔧 Se é uma URL blob (otimistic), usar diretamente
        if (mediaUrl.startsWith('blob:')) {
          setBlobUrl(mediaUrl);
          setIsLoading(false);
          setHasError(false);
          onLoad?.();
          return;
        }

        // 🔧 Sanitizar URL para remover porta duplicada
        const cleanUrl = sanitizeMediaUrl(mediaUrl);

        const { data, headers } = await api.get(cleanUrl, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(
          new Blob([data], { type: headers['content-type'] })
        );
        setBlobUrl(url);
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
      } catch (error) {
        console.error('ImageMessage: Erro ao carregar imagem:', error);
        setIsLoading(false);
        setHasError(true);
        onError?.();
      }
    };

    fetchImage();

    // Cleanup blob URL apenas se criamos um novo (não para URLs blob otimistas)
    return () => {
      if (blobUrl && !mediaUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [mediaUrl, onLoad, onError]);

  const handleImageClick = () => {
    if (!hasError && !isLoading) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      // Usar blobUrl se disponível, senão buscar da API
      if (blobUrl) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `image-${message.id || Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Sanitizar URL para download também
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
        {body && (
          <Caption isSent={isSent}>
            {body}
          </Caption>
        )}
      </ErrorContainer>
    );
  }

  return (
    <>
      <ImageContainer isSent={isSent} onClick={handleImageClick}>
        {isLoading ? (
          <LoadingPlaceholder>
            <Typography variant="body2" color="inherit">
              Carregando...
            </Typography>
          </LoadingPlaceholder>
        ) : (
          <>
            <StyledImage
              ref={imageRef}
              src={blobUrl || mediaUrl}
              alt="Imagem da mensagem"
              loading="lazy"
            />
            <ImageOverlay className="image-overlay">
              <ZoomIn sx={{ fontSize: 32 }} />
            </ImageOverlay>
          </>
        )}

        {/* Legenda da imagem - comentado para não mostrar nome do arquivo */}
        {/* {body && (
          <Caption isSent={isSent}>
            {body}
          </Caption>
        )} */}
      </ImageContainer>

      {/* Modal de visualização em tamanho completo */}
      <ModalContainer
        open={isModalOpen}
        onClick={handleCloseModal}
      >
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalImage
            src={blobUrl || mediaUrl}
            alt="Imagem da mensagem"
          />
          <ModalActions>
            <ActionButton
              onClick={handleDownload}
              title="Baixar imagem"
            >
              <Download />
            </ActionButton>
            <ActionButton
              onClick={handleCloseModal}
              title="Fechar"
            >
              <Close />
            </ActionButton>
          </ModalActions>
        </ModalContent>
      </ModalContainer>
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