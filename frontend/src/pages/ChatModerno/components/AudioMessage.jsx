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
import { sanitizeMediaUrl } from './mediaUtils';
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
  minWidth: '280px',
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
  position: 'relative',
  cursor: 'pointer',
  flex: 1,
  gap: '2px',
}));

const WaveformBar = styled(Box, {
  shouldForwardProp: (prop) => !['height', 'isActive'].includes(prop)
})(({ height, isActive }) => ({
  width: '2px',
  backgroundColor: isActive ? 'var(--color-accent)' : 'var(--text-tertiary)',
  borderRadius: '1px',
  transition: 'all 0.1s ease',
  height: `${height}%`,
  minHeight: '20%',
  maxHeight: '100%',
}));

const AudioControls = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
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
 * Analisar áudio real e extrair waveform baseado em amplitude
 */
const analyzeAudioWaveform = async (audioElement) => {
  try {
    // Criar AudioContext para análise
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Criar source a partir do elemento audio
    const source = audioContext.createMediaElementSource(audioElement);

    // Fetch do áudio como ArrayBuffer para análise offline
    const response = await fetch(audioElement.src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Extrair dados do canal (mono ou usar primeiro canal)
    const rawData = audioBuffer.getChannelData(0);
    const samples = 60; // Número de barras que queremos
    const blockSize = Math.floor(rawData.length / samples);
    const amplitudes = [];

    // Calcular amplitude média para cada bloco
    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let sum = 0;

      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[start + j]);
      }

      const amplitude = sum / blockSize;
      // Normalizar para 0-100 com amplificação muito alta para detectar sons baixos
      const normalized = Math.min(100, amplitude * 2000);
      // Se amplitude muito baixa (< 0.3%), considerar silêncio, senão mínimo 20%
      amplitudes.push(normalized < 0.3 ? 0 : Math.max(20, normalized));
    }

    // Reconectar source (estava desconectado pela análise)
    source.connect(audioContext.destination);

    return amplitudes;
  } catch (error) {
    console.error('❌ [AudioMessage] Erro ao analisar waveform:', error);
    // Fallback: gerar mock se análise falhar
    const bars = 60;
    return Array.from({ length: bars }, () => Math.random() * 80 + 20);
  }
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
  onError,
  onDownload // Callback para download externo
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [waveform, setWaveform] = useState([]);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);

  const audioRef = useRef(null);

  const backendUrl = getBackendUrl();
  const { mediaUrl, body } = message;

  const rawUrl = mediaUrl?.startsWith('http')
    ? mediaUrl
    : `${backendUrl}${mediaUrl}`;
  const audioUrl = sanitizeMediaUrl(rawUrl);

  // Fetch áudio e converter para blob (solução CORS)
  useEffect(() => {
    console.log('🔍 [AudioMessage] audioUrl:', audioUrl);

    if (!audioUrl) {
      console.log('⚠️ [AudioMessage] audioUrl vazio, abortando');
      return;
    }

    let blobUrlToRevoke = null;

    const fetchAudioBlob = async () => {
      try {
        console.log('🔄 [AudioMessage] Iniciando fetch do áudio:', audioUrl);
        const response = await api.get(audioUrl, { responseType: 'blob' });
        console.log('✅ [AudioMessage] Fetch concluído, tamanho:', response.data.size);

        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        console.log('✅ [AudioMessage] Blob URL criado:', blobUrl);

        blobUrlToRevoke = blobUrl;
        setAudioBlobUrl(blobUrl);
        console.log('✅ [AudioMessage] audioBlobUrl setado');
      } catch (error) {
        console.error('❌ [AudioMessage] Erro ao buscar áudio:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    fetchAudioBlob();

    return () => {
      if (blobUrlToRevoke) {
        console.log('🧹 [AudioMessage] Limpando blob URL:', blobUrlToRevoke);
        URL.revokeObjectURL(blobUrlToRevoke);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    console.log('🎵 [AudioMessage] useEffect 2 - audioRef:', !!audioRef.current, 'audioBlobUrl:', audioBlobUrl);

    if (audioRef.current && audioBlobUrl) {
      const audio = audioRef.current;

      console.log('🎵 [AudioMessage] Adicionando event listeners, readyState:', audio.readyState);

      const handleLoadedData = async () => {
        console.log('✅ [AudioMessage] handleLoadedData disparado! duration:', audio.duration);
        setIsLoading(false);
        setHasError(false);
        setDuration(audio.duration);

        // Analisar áudio real para extrair waveform
        console.log('🎵 [AudioMessage] Analisando waveform do áudio...');
        const realWaveform = await analyzeAudioWaveform(audio);
        console.log('✅ [AudioMessage] Waveform analisado:', realWaveform);
        setWaveform(realWaveform);

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

      const handleError = (e) => {
        console.error('❌ [AudioMessage] handleError disparado:', e);
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

      // Se já está carregado (readyState >= 2), disparar manualmente
      if (audio.readyState >= 2) {
        console.log('⚡ [AudioMessage] Áudio já carregado, disparando handleLoadedData manualmente');
        handleLoadedData();
      }

      return () => {
        console.log('🧹 [AudioMessage] Removendo event listeners');
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioBlobUrl, volume, onLoad, onError]);

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

  // Handler para clicar no waveform e navegar no áudio
  const handleWaveformClick = (event) => {
    if (audioRef.current && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percent = clickX / rect.width;
      const newTime = percent * duration;
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
      if (audioBlobUrl) {
        const link = document.createElement('a');
        link.href = audioBlobUrl;
        link.download = `audio-${message.id || Date.now()}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Renderizar loading OU player (mas sempre com o elemento <audio> no DOM)
  if (isLoading || !audioBlobUrl) {
    return (
      <Box>
        {/* Elemento <audio> hidden para garantir que audioRef existe */}
        <audio
          ref={audioRef}
          src={audioBlobUrl || ''}
          preload="metadata"
          style={{ display: 'none' }}
        />
        <LoadingContainer>
          <GraphicEq sx={{ marginRight: 1, color: 'var(--text-secondary)' }} />
          <Typography variant="body2" color="inherit">
            Carregando áudio...
          </Typography>
        </LoadingContainer>
      </Box>
    );
  }

  return (
    <Box>
      <AudioContainer isSent={isSent}>
        <audio
          ref={audioRef}
          src={audioBlobUrl}
          preload="metadata"
        />

        <PlayButton onClick={togglePlay}>
          {isPlaying ? <Pause /> : <PlayArrow />}
        </PlayButton>

        <AudioInfo>
          {/* Waveform visual com tempo integrado - estilo WhatsApp */}
          <AudioControls>
            <WaveformContainer onClick={handleWaveformClick}>
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

            <TimeDisplay>
              {formatTime(duration - currentTime)}
            </TimeDisplay>
          </AudioControls>
        </AudioInfo>
      </AudioContainer>

      {body && body.trim() !== 'Áudio' && body.trim() !== 'Audio' && (
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
