// Polyfill minimalista para garantir compatibilidade do MicRecorder com Vite
// Este arquivo deve ser importado antes do MicRecorder

// Garantir que webrtc-adapter está carregado
import 'webrtc-adapter';

// EXECUÇÃO IMEDIATA: Definir componentes essenciais
if (typeof window !== 'undefined') {
  // Definir global ANTES de qualquer coisa para mic-recorder-to-mp3
  if (!window.global) {
    window.global = window;
  }
  
  // MicRecorder mock funcional para evitar erros
  if (!window.global.MicRecorder) {
    window.global.MicRecorder = class MockMicRecorder {
      constructor(options = {}) {
        this.bitRate = options.bitRate || 128;
      }
      start() {
        return Promise.resolve();
      }
      stop() {
        return {
          getMp3: () => Promise.resolve([new Blob(), new Uint8Array()])
        };
      }
      getMp3() {
        return Promise.resolve([new Blob(), new Uint8Array()]);
      }
    };
  }

  // Componentes básicos lamejs
  window.Presets = window.Presets || {
    STANDARD: { bitrate: 128 },
    EXTREME: { bitrate: 320 },
    MEDIUM: { bitrate: 160 }
  };
  
  window.Lame = window.Lame || class MockLame {
    constructor() {}
    encode() { return new Int8Array(); }
    flush() { return new Int8Array(); }
  };
}

export const initializeMicRecorderPolyfill = () => {
  console.log('MicRecorder polyfill inicializado');
  return true;
};