import { useState, useRef, useCallback } from 'react';

/**
 * Hook customizado para gravação de áudio usando MediaRecorder API
 * Suporta pause/resume e conversão para formato compatível
 */
const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Inicia o timer de gravação
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  // Para o timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Pausa o timer
  const pauseTimer = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

  // Retoma o timer
  const resumeTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  // Inicia a gravação
  const startRecording = useCallback(async () => {
    try {
      // Solicita permissão para acessar o microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Cria o MediaRecorder com formato WebM (será convertido pelo backend)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      // Coleta os chunks de áudio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Quando a gravação parar completamente
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);

        // Para o stream do microfone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Inicia a gravação
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      startTimer();

      return true;
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);

      // Mensagens de erro mais amigáveis
      if (error.name === 'NotAllowedError') {
        throw new Error('Permissão negada para acessar o microfone');
      } else if (error.name === 'NotFoundError') {
        throw new Error('Nenhum microfone encontrado');
      } else {
        throw new Error('Erro ao iniciar gravação de áudio');
      }
    }
  }, [startTimer]);

  // Pausa a gravação
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pauseTimer();
    }
  }, [pauseTimer]);

  // Retoma a gravação
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      resumeTimer();
    }
  }, [resumeTimer]);

  // Para a gravação
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  }, [stopTimer]);

  // Cancela a gravação
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Para o stream do microfone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setAudioBlob(null);
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    stopTimer();
  }, [stopTimer]);

  // Reseta o estado do recorder
  const resetRecorder = useCallback(() => {
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  }, []);

  // Formata o tempo de gravação (mm:ss)
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    resetRecorder,
    formatTime,
  };
};

export default useAudioRecorder;
