import React, { useState, useRef, useEffect, memo } from 'react';
import { Box, Typography, IconButton, Backdrop, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  Close,
  Download,
  PlayCircleOutline
} from '@mui/icons-material';
import { getBackendUrl } from '../../../config';
import api from '../../../services/api';

const VideoContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#000',
  maxWidth: '350px',
  width: '100%',
  alignSelf: isSent ? 'flex-end' : 'flex-start',
}));

const VideoElement = styled('video')(() => ({
  width: '100%',
  height: 'auto',
  maxHeight: '300px',
  objectFit: 'cover',
  display: 'block',
  cursor: 'pointer',
}));

const VideoOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  cursor: 'pointer',

  '&.show': {
    opacity: 1,
  },
}));

const PlayButton = styled(IconButton)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  color: '#000',
  fontSize: '48px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
}));

const VideoControls = styled(Box)(() => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '8px',
  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  opacity: 0,
  transition: 'opacity 0.2s ease',

  '&.show': {
    opacity: 1,
  },
}));

const ProgressBar = styled('input')(() => ({
  flex: 1,
  height: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  border: 'none',
  borderRadius: '2px',
  outline: 'none',
  cursor: 'pointer',

  '&::-webkit-slider-thumb': {
    appearance: 'none',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },

  '&::-moz-range-thumb': {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    cursor: 'pointer',
    border: 'none',
  },
}));

const TimeDisplay = styled(Typography)(() => ({
  color: '#fff',
  fontSize: '12px',
  minWidth: '40px',
}));

const LoadingContainer = styled(Box)(() => ({
  width: '100%',
  height: '200px',
  backgroundColor: 'var(--bg-tertiary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  animation: 'pulse 1.5s ease-in-out infinite',

  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 },
  },
}));

const ErrorContainer = styled(Box)(() => ({
  padding: '16px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '8px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
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

const ModalContainer = styled(Backdrop)(() => ({
  zIndex: 1300,
}));

const ModalContent = styled(Paper)(() => ({
  position: 'relative',
  maxWidth: '90vw',
  maxHeight: '90vh',
  outline: 'none',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#000',
}));

const ModalVideo = styled('video')(() => ({
  width: '100%',
  height: 'auto',
  maxWidth: '90vw',
  maxHeight: '90vh',
  objectFit: 'contain',
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

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * VideoMessage - Componente para renderizar mensagens de vídeo
 */
const VideoMessage = ({
  message,
  isSent = false,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const videoRef = useRef(null);
  const modalVideoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const backendUrl = getBackendUrl();
  const { mediaUrl, body } = message;

  const videoUrl = mediaUrl?.startsWith('http')
    ? mediaUrl
    : `${backendUrl}${mediaUrl}`;

  // Load handlers
  const handleLoadedData = () => {
    setIsLoading(false);
    setHasError(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // Recuperar volume salvo
      const savedVolume = localStorage.getItem('video-volume');
      if (savedVolume) {
        videoRef.current.volume = parseFloat(savedVolume);
      }
    }
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Play/Pause handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Time update handler
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Progress bar handler
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Volume handler
  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = volume;
      localStorage.setItem('video-volume', volume.toString());
      setIsMuted(volume === 0);
    }
  };

  // Controls visibility
  const showControlsTemporarily = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  // Modal handlers
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
  };

  // Download handler
  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video-${message.id || Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar vídeo:', error);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  if (hasError) {
    return (
      <ErrorContainer>
        <Typography variant="body2">
          ❌ Erro ao carregar vídeo
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
      <VideoContainer
        isSent={isSent}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        {isLoading ? (
          <LoadingContainer>
            <Typography variant="body2" color="inherit">
              Carregando vídeo...
            </Typography>
          </LoadingContainer>
        ) : (
          <>
            <VideoElement
              ref={videoRef}
              src={videoUrl}
              onLoadedData={handleLoadedData}
              onError={handleError}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
              muted={isMuted}
              playsInline
            />

            {/* Overlay com botão de play */}
            <VideoOverlay
              className={!isPlaying || showControls ? 'show' : ''}
              onClick={togglePlay}
            >
              {!isPlaying && (
                <PlayButton>
                  <PlayCircleOutline sx={{ fontSize: 'inherit' }} />
                </PlayButton>
              )}
            </VideoOverlay>

            {/* Controles de vídeo */}
            <VideoControls className={showControls ? 'show' : ''}>
              <IconButton
                size="small"
                onClick={togglePlay}
                sx={{ color: '#fff' }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>

              <TimeDisplay>
                {formatTime(currentTime)}
              </TimeDisplay>

              <ProgressBar
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleProgressChange}
              />

              <TimeDisplay>
                {formatTime(duration)}
              </TimeDisplay>

              <IconButton
                size="small"
                onClick={toggleMute}
                sx={{ color: '#fff' }}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>

              <IconButton
                size="small"
                onClick={openModal}
                sx={{ color: '#fff' }}
              >
                <Fullscreen />
              </IconButton>
            </VideoControls>
          </>
        )}

        {body && (
          <Caption isSent={isSent}>
            {body}
          </Caption>
        )}
      </VideoContainer>

      {/* Modal fullscreen */}
      <ModalContainer
        open={isModalOpen}
        onClick={closeModal}
      >
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalVideo
            ref={modalVideoRef}
            src={videoUrl}
            controls
            autoPlay
          />
          <ModalActions>
            <ActionButton
              onClick={handleDownload}
              title="Baixar vídeo"
            >
              <Download />
            </ActionButton>
            <ActionButton
              onClick={closeModal}
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

export default memo(VideoMessage, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.mediaUrl === nextProps.message.mediaUrl &&
    prevProps.message.body === nextProps.message.body &&
    prevProps.isSent === nextProps.isSent
  );
});