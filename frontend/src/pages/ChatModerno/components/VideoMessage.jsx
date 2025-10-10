import React, { useState, useRef, useEffect, memo } from 'react';
import { Box, Typography, IconButton, Dialog } from '@mui/material';
import { styled } from '@mui/material/styles';
import { PlayCircleOutline, Close, Download } from '@mui/icons-material';
import api from '../../../services/api';
import { sanitizeMediaUrl } from './mediaUtils';

// ============= PREVIEW COMPONENTS =============
const PreviewContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ isSent, theme }) => ({
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#000',
  cursor: 'pointer',
  width: '100%',
  alignSelf: isSent ? 'flex-end' : 'flex-start',
  transition: 'transform 0.2s ease',

  // Responsivo - diferentes tamanhos por tela
  maxWidth: '320px', // Mobile

  [theme.breakpoints.up('sm')]: {
    maxWidth: '380px', // Tablets pequenos
  },

  [theme.breakpoints.up('md')]: {
    maxWidth: '420px', // Tablets médios
  },

  [theme.breakpoints.up('lg')]: {
    maxWidth: '460px', // Desktop
  },

  [theme.breakpoints.up('xl')]: {
    maxWidth: '500px', // Telas grandes
  },

  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const VideoThumbnail = styled('video')(({ theme }) => ({
  width: '100%',
  height: 'auto',
  objectFit: 'cover',
  display: 'block',
  pointerEvents: 'none',

  // Altura responsiva
  maxHeight: '300px', // Mobile

  [theme.breakpoints.up('sm')]: {
    maxHeight: '340px', // Tablets pequenos
  },

  [theme.breakpoints.up('md')]: {
    maxHeight: '380px', // Tablets médios
  },

  [theme.breakpoints.up('lg')]: {
    maxHeight: '420px', // Desktop
  },

  [theme.breakpoints.up('xl')]: {
    maxHeight: '460px', // Telas grandes
  },
}));

const ThumbnailOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
}));

const PlayIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  color: '#000',

  // Tamanho responsivo do botão
  width: '56px',
  height: '56px',

  [theme.breakpoints.up('sm')]: {
    width: '64px',
    height: '64px',
  },

  [theme.breakpoints.up('md')]: {
    width: '72px',
    height: '72px',
  },

  [theme.breakpoints.up('lg')]: {
    width: '80px',
    height: '80px',
  },

  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    transform: 'scale(1.1)',
  },

  '& .MuiSvgIcon-root': {
    fontSize: '40px',

    [theme.breakpoints.up('sm')]: {
      fontSize: '48px',
    },

    [theme.breakpoints.up('md')]: {
      fontSize: '56px',
    },

    [theme.breakpoints.up('lg')]: {
      fontSize: '64px',
    },
  },

  transition: 'all 0.2s ease',
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

const ErrorContainer = styled(Box)(() => ({
  padding: '16px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '8px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
}));

const VideoDuration = styled(Box)(() => ({
  position: 'absolute',
  bottom: '8px',
  right: '8px',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
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

const VideoPlayer = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '80px 20px 20px',

  '& video': {
    maxWidth: '90vw',
    maxHeight: '85vh',
    objectFit: 'contain',
    borderRadius: '4px',
  },
}));

// Helper para formatar duração
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * VideoMessage Component - Renderiza mensagens de vídeo com preview thumbnail
 */
const VideoMessage = ({
  message,
  isSent = false,
  onLoad,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const thumbnailRef = useRef(null);
  const playerRef = useRef(null);

  const { mediaUrl, body } = message;

  // URL para exibição imediata (sanitizada ou blob)
  const displayUrl = blobUrl || (mediaUrl?.startsWith('blob:') ? mediaUrl : sanitizeMediaUrl(mediaUrl));

  // Carregar vídeo em background (sem bloquear renderização)
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
    const fetchVideo = async () => {
      try {
        const cleanUrl = sanitizeMediaUrl(mediaUrl);
        const { data, headers } = await api.get(cleanUrl, {
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(
          new Blob([data], { type: headers['content-type'] || 'video/mp4' })
        );

        setBlobUrl(url);
        onLoad?.();
      } catch (error) {
        console.error('Erro ao carregar vídeo:', error);
        // Não marcar erro - a URL direta pode funcionar
        onError?.();
      }
    };

    fetchVideo();

    // Cleanup
    return () => {
      if (blobUrl && !mediaUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [mediaUrl, onLoad, onError]);

  // Capturar duração quando thumbnail carregar
  const handleThumbnailLoad = () => {
    if (thumbnailRef.current) {
      console.log('✅ [VideoMessage] Thumbnail carregado, duração:', thumbnailRef.current.duration);
      setDuration(thumbnailRef.current.duration);
    }
  };

  // Handler de erro do elemento video
  const handleVideoError = (e) => {
    console.error('❌ [VideoMessage] Erro no elemento <video>:', {
      error: e,
      videoSrc: thumbnailRef.current?.src,
      networkState: thumbnailRef.current?.networkState,
      readyState: thumbnailRef.current?.readyState,
      errorCode: thumbnailRef.current?.error?.code,
      errorMessage: thumbnailRef.current?.error?.message
    });
    setHasError(true);
  };

  const handleOpenModal = () => {
    if (!hasError) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Pausar player quando fechar
    if (playerRef.current) {
      playerRef.current.pause();
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();

    try {
      if (blobUrl) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `video-${message.id || Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const cleanUrl = sanitizeMediaUrl(mediaUrl);
        const { data } = await api.get(cleanUrl, { responseType: 'blob' });
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `video-${message.id || Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao baixar vídeo:', error);
    }
  };

  // Estado de erro
  if (hasError) {
    return (
      <ErrorContainer>
        <Typography variant="body2">
          ❌ Erro ao carregar vídeo
        </Typography>
      </ErrorContainer>
    );
  }

  return (
    <>
      {/* Preview do vídeo */}
      <PreviewContainer isSent={isSent} onClick={handleOpenModal}>
        <VideoThumbnail
          ref={thumbnailRef}
          src={displayUrl}
          onLoadedMetadata={handleThumbnailLoad}
          onError={handleVideoError}
          muted
          playsInline
        />

        <ThumbnailOverlay>
          <PlayIconButton>
            <PlayCircleOutline />
          </PlayIconButton>
        </ThumbnailOverlay>

        {duration > 0 && (
          <VideoDuration>
            {formatDuration(duration)}
          </VideoDuration>
        )}
      </PreviewContainer>

      {/* Modal com player de vídeo */}
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
              title="Baixar vídeo"
              aria-label="Baixar vídeo"
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

          {/* Player de vídeo */}
          <VideoPlayer onClick={handleCloseModal}>
            <video
              ref={playerRef}
              src={displayUrl}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          </VideoPlayer>
        </ModalWrapper>
      </StyledDialog>
    </>
  );
};

// Otimização com React.memo
export default memo(VideoMessage, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.mediaUrl === nextProps.message.mediaUrl &&
    prevProps.message.body === nextProps.message.body &&
    prevProps.isSent === nextProps.isSent
  );
});
