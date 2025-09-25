import React, { useState, useRef, useEffect, memo } from 'react';
import { Box, Typography, IconButton, Slider } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Download,
  GraphicEq
} from '@mui/icons-material';
import { getBackendUrl } from '../../../config';
import api from '../../../services/api';

const AudioContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ theme, isSent }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  borderRadius: '8px',
  backgroundColor: isSent
    ? 'rgba(0, 195, 7, 0.15)'
    : 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
  maxWidth: '280px',
  width: '100%',
  position: 'relative',
  alignSelf: isSent ? 'flex-end' : 'flex-start',
}));

const PlayButton = styled(IconButton)(() => ({
  backgroundColor: 'var(--color-accent)',
  color: 'white',
  width: '40px',
  height: '40px',
  marginRight: '12px',
  '&:hover': {
    backgroundColor: 'var(--color-green-hover)',
  },
}));

const AudioInfo = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

const WaveformContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  height: '30px',
  marginBottom: '4px',
  position: 'relative',
}));

const WaveformBar = styled(Box, {
  shouldForwardProp: (prop) => !['height', 'isActive'].includes(prop)
})(({ height, isActive }) => ({
  width: '3px',
  backgroundColor: isActive ? 'var(--color-accent)' : 'var(--text-tertiary)',
  marginRight: '2px',
  borderRadius: '2px',
  transition: 'all 0.1s ease',
  height: `${height}%`,
  minHeight: '20%',
  maxHeight: '100%',
}));

const AudioControls = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '4px',
}));

const TimeDisplay = styled(Typography)(() => ({
  fontSize: '12px',
  color: 'var(--text-secondary)',
  minWidth: '35px',
}));

const VolumeContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flex: 1,
  marginLeft: '8px',
}));

const ProgressSlider = styled(Slider)(() => ({
  color: 'var(--color-accent)',
  height: 3,
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
  },
  '& .MuiSlider-track': {
    height: 3,
    borderRadius: 2,
  },
  '& .MuiSlider-rail': {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'var(--bg-tertiary)',
  },
}));

const VolumeSlider = styled(Slider)(() => ({
  color: 'var(--color-accent)',
  height: 2,
  width: '60px',
  '& .MuiSlider-thumb': {
    width: 8,
    height: 8,
  },
  '& .MuiSlider-track': {
    height: 2,
  },
  '& .MuiSlider-rail': {
    height: 2,
    backgroundColor: 'var(--bg-tertiary)',
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

const LoadingContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '8px',
  animation: 'pulse 1.5s ease-in-out infinite',

  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 },
  },
}));

/**
 * Gerar waveform mock baseado na duração
 */
const generateWaveform = (duration = 30) => {
  const bars = Math.min(40, Math.max(20, Math.floor(duration / 2)));
  return Array.from({ length: bars }, () => Math.random() * 80 + 20);
};

/**
 * Formatar tempo em MM:SS
 */
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * AudioMessage - Componente para renderizar mensagens de áudio
 */
const AudioMessage = ({
  message,
  isSent = false,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [waveform, setWaveform] = useState([]);

  const audioRef = useRef(null);

  const backendUrl = getBackendUrl();
  const { mediaUrl, body, duration: messageDuration } = message;

  const audioUrl = mediaUrl?.startsWith('http')
    ? mediaUrl
    : `${backendUrl}${mediaUrl}`;

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const handleLoadedData = () => {
        setIsLoading(false);
        setHasError(false);
        setDuration(audio.duration);
        setWaveform(generateWaveform(audio.duration));

        // Restaurar volume salvo
        const savedVolume = localStorage.getItem('audio-volume');
        if (savedVolume) {
          const vol = parseFloat(savedVolume);
          setVolume(vol);
          audio.volume = vol;
        } else {
          audio.volume = volume;
        }

        onLoad?.();
      };

      const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        onError?.();
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        audio.currentTime = 0;
      };

      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('error', handleError);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioUrl, volume, onLoad, onError]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (event, newValue) => {
    if (audioRef.current) {
      const newTime = (newValue / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (event, newValue) => {
    const newVolume = newValue / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    localStorage.setItem('audio-volume', newVolume.toString());
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audio-${message.id || Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar áudio:', error);
    }
  };

  if (hasError) {
    return (
      <ErrorContainer>
        <Typography variant="body2">
          ❌ Erro ao carregar áudio
        </Typography>
        {body && (
          <Caption isSent={isSent}>
            {body}
          </Caption>
        )}
      </ErrorContainer>
    );
  }

  if (isLoading) {
    return (
      <LoadingContainer>
        <GraphicEq sx={{ marginRight: 1, color: 'var(--text-secondary)' }} />
        <Typography variant="body2" color="inherit">
          Carregando áudio...
        </Typography>
      </LoadingContainer>
    );
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <Box>
      <AudioContainer isSent={isSent}>
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />

        <PlayButton onClick={togglePlay}>
          {isPlaying ? <Pause /> : <PlayArrow />}
        </PlayButton>

        <AudioInfo>
          {/* Waveform visual */}
          <WaveformContainer>
            {waveform.map((height, index) => {
              const progressIndex = Math.floor((progressPercent / 100) * waveform.length);
              return (
                <WaveformBar
                  key={index}
                  height={height}
                  isActive={index <= progressIndex}
                />
              );
            })}
          </WaveformContainer>

          {/* Controles de áudio */}
          <AudioControls>
            <TimeDisplay>
              {formatTime(currentTime)}
            </TimeDisplay>

            <ProgressSlider
              size="small"
              value={progressPercent}
              onChange={handleProgressChange}
              sx={{ flex: 1, mx: 1 }}
            />

            <TimeDisplay>
              {formatTime(duration)}
            </TimeDisplay>
          </AudioControls>

          {/* Volume e download */}
          <VolumeContainer>
            <IconButton
              size="small"
              onClick={toggleMute}
              sx={{ color: 'var(--text-secondary)' }}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>

            <VolumeSlider
              size="small"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolumeChange}
            />

            <IconButton
              size="small"
              onClick={handleDownload}
              sx={{ color: 'var(--text-secondary)' }}
            >
              <Download />
            </IconButton>
          </VolumeContainer>
        </AudioInfo>
      </AudioContainer>

      {body && (
        <Caption isSent={isSent}>
          {body}
        </Caption>
      )}
    </Box>
  );
};

export default memo(AudioMessage, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.mediaUrl === nextProps.message.mediaUrl &&
    prevProps.message.body === nextProps.message.body &&
    prevProps.isSent === nextProps.isSent
  );
});