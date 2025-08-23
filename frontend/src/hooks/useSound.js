import { useRef, useState, useCallback } from 'react';

// Hook personalizado para som que não quebra a aplicação
const useSafeSound = (src, options = {}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  // Função de play segura
  const play = useCallback(() => {
    try {
      // Tentativa 1: usar use-sound se disponível
      if (window.useSound) {
        const [playFn] = window.useSound(src, options);
        playFn();
        return;
      }

      // Tentativa 2: usar HTML5 Audio API
      if (!audioRef.current) {
        audioRef.current = new Audio(src);
        audioRef.current.volume = options.volume || 1;
        audioRef.current.load();
      }

      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio played successfully');
            setIsReady(true);
            setError(null);
          })
          .catch(err => {
            console.warn('Audio play failed:', err);
            setError(err.message);
          });
      }
    } catch (err) {
      console.warn('Audio system not available:', err.message);
      setError(err.message);
    }
  }, [src, options.volume]);

  // Função de stop
  const stop = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (err) {
      console.warn('Audio stop failed:', err);
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return [play, { isReady, error, stop, cleanup }];
};

export default useSafeSound;