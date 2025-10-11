import React, { memo, Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

// Lazy loading dos componentes de mídia para otimização
const ImageMessage = lazy(() => import('./ImageMessage'));
const VideoMessage = lazy(() => import('./VideoMessage'));
const AudioMessage = lazy(() => import('./AudioMessage'));
const DocumentMessage = lazy(() => import('./DocumentMessage'));

const MediaContainer = styled(Box)(() => ({
  width: '100%',
  maxWidth: '350px',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '4px',
  position: 'relative',
}));

const LoadingContainer = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '8px',
}));

/**
 * Utilitário para detectar tipo de mídia baseado em mediaType e URL
 */
const detectMediaType = (message) => {
  const { mediaType, mediaUrl } = message;

  if (!mediaType && !mediaUrl) {
    return null;
  }

  // Priorizar mediaType se disponível
  if (mediaType) {
    // Sistema usa strings simples: "image", "video", "audio", "application"
    if (mediaType === 'image' || mediaType.startsWith('image/')) {
      return 'image';
    }
    if (mediaType === 'video' || mediaType.startsWith('video/')) {
      return 'video';
    }
    if (mediaType === 'audio' || mediaType.startsWith('audio/')) {
      return 'audio';
    }
    if (mediaType === 'application' || mediaType.startsWith('application/')) {
      return 'document';
    }
  }

  // Fallback: detectar por extensão da URL
  if (mediaUrl) {
    const url = mediaUrl.toLowerCase();

    // Imagens
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') ||
        url.includes('.gif') || url.includes('.webp') || url.includes('.bmp')) {
      return 'image';
    }

    // Vídeos
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ||
        url.includes('.avi') || url.includes('.mkv')) {
      return 'video';
    }

    // Áudios
    if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') ||
        url.includes('.m4a') || url.includes('.aac')) {
      return 'audio';
    }

    // Documentos
    if (url.includes('.pdf') || url.includes('.doc') || url.includes('.docx') ||
        url.includes('.txt') || url.includes('.xls') || url.includes('.xlsx') ||
        url.includes('.zip') || url.includes('.rar')) {
      return 'document';
    }
  }

  return null;
};

/**
 * MediaRenderer - Componente principal que detecta e renderiza mídia
 *
 * Props:
 * - message: objeto da mensagem com mediaType, mediaUrl, body
 * - isSent: boolean se a mensagem foi enviada pelo usuário
 * - allMediaMessages: array com todas as mensagens de mídia da conversa (opcional)
 * - onMediaLoad: callback quando mídia carrega (opcional)
 * - onMediaError: callback quando mídia falha (opcional)
 */
const MediaRenderer = ({
  message,
  isSent = false,
  contact,
  allMediaMessages = [],
  onMediaLoad,
  onMediaError,
  ...props
}) => {
  const mediaType = detectMediaType(message);

  // Se não há mídia, não renderizar nada
  if (!mediaType) {
    return null;
  }

  // Loading fallback para lazy loading
  const LoadingFallback = () => (
    <LoadingContainer>
      <CircularProgress size={24} sx={{ color: 'var(--color-accent)' }} />
    </LoadingContainer>
  );

  // Props comuns para todos os componentes de mídia
  const commonProps = {
    message,
    isSent,
    contact,
    allMediaMessages,
    onLoad: onMediaLoad,
    onError: onMediaError,
    ...props
  };

  return (
    <MediaContainer>
      <Suspense fallback={<LoadingFallback />}>
        {mediaType === 'image' && <ImageMessage {...commonProps} />}
        {mediaType === 'video' && <VideoMessage {...commonProps} />}
        {mediaType === 'audio' && <AudioMessage {...commonProps} />}
        {mediaType === 'document' && <DocumentMessage {...commonProps} />}
      </Suspense>
    </MediaContainer>
  );
};

// Otimização com React.memo - só re-renderizar se props essenciais mudaram
export default memo(MediaRenderer, (prevProps, nextProps) => {
  const prevMessage = prevProps.message;
  const nextMessage = nextProps.message;

  return (
    prevMessage.id === nextMessage.id &&
    prevMessage.mediaType === nextMessage.mediaType &&
    prevMessage.mediaUrl === nextMessage.mediaUrl &&
    prevMessage.body === nextMessage.body &&
    prevProps.isSent === nextProps.isSent
  );
});

// Exportar utilitário para uso em outros componentes
export { detectMediaType };