// Polyfill para garantir compatibilidade do MicRecorder com Vite
// Este arquivo deve ser importado antes do MicRecorder

// Garantir que webrtc-adapter está carregado
import 'webrtc-adapter';

// EXECUÇÃO IMEDIATA: Definir todos os componentes assim que o módulo carrega
(function() {
  console.log('🎯 Iniciando polyfill lamejs...');
  // Definir Lame globalmente para mic-recorder-to-mp3
  if (typeof window !== 'undefined') {
  // Definir TODOS os componentes IMEDIATAMENTE para evitar erros
  window.Presets = {
    STANDARD: { bitrate: 128 },
    EXTREME: { bitrate: 320 },
    MEDIUM: { bitrate: 160 }
  };
  
  // Definir Lame mock básico imediatamente
  window.Lame = class MockLame {
    constructor() {}
    encode() { return new Int8Array(); }
    flush() { return new Int8Array(); }
  };
  
  // Definir GainAnalysis mock
  window.GainAnalysis = class MockGainAnalysis {
    constructor() {}
    init_gain_analysis() {}
    analyze_samples() {}
  };
  
  // Definir outros componentes que podem ser necessários
  window.PsychoAcousticModel = class MockPsychoAcousticModel {
    constructor() {}
  };
  
  window.BitStream = class MockBitStream {
    constructor() {}
    write() {}
  };
  
  window.Quantize = class MockQuantize {
    constructor() {}
  };
  
  window.QuantizePVT = class MockQuantizePVT {
    constructor() {}
  };
  
  window.Takehiro = class MockTakehiro {
    constructor() {}
  };
  
  window.Encoder = class MockEncoder {
    constructor() {}
  };
  
  window.L3Side = class MockL3Side {
    constructor() {}
  };
  
  window.III_side_info_t = class MockIII_side_info_t {
    constructor() {}
  };
  
  // Componentes adicionais do LAME que podem ser necessários
  const lameComponents = [
    'VBR', 'Reservoir', 'FFT', 'PSYMODEL', 'NewMDCT', 'Util',
    'VersionInfo', 'GetAudio', 'Parse', 'Preprocess', 'Tables',
    'Layer3', 'MPEGMode', 'VbrMode', 'Common', 'RootTakehiro',
    'QuantizePVT', 'Quantize', 'VbrTag', 'BitReservoir', 'Layer3Side'
  ];
  
  lameComponents.forEach(componentName => {
    window[componentName] = class {
      constructor() {}
    };
  });
  
  console.log('✅ Todos os componentes lamejs foram definidos:', Object.keys(window).filter(key => 
    ['Lame', 'Presets', 'GainAnalysis', 'QuantizePVT', 'Takehiro', 'Encoder', 'L3Side', 'III_side_info_t'].includes(key) ||
    lameComponents.includes(key)
  ).length, 'componentes');

  // Tentar importar lamejs dinamicamente (depois)
  try {
    import('lamejs').then(lamejs => {
      const lameModule = lamejs.default || lamejs;
      window.Lame = lameModule;
      window.lamejs = lameModule;
      
      // Definir Presets que também é necessário para mic-recorder-to-mp3
      if (lameModule.Presets) {
        window.Presets = lameModule.Presets;
      } else {
        // Mock básico dos Presets
        window.Presets = {
          STANDARD: { bitrate: 128 },
          EXTREME: { bitrate: 320 },
          MEDIUM: { bitrate: 160 }
        };
      }
      
      console.log('Lame definido globalmente:', typeof window.Lame);
      console.log('Presets definido globalmente:', typeof window.Presets);
    }).catch(() => {
      // Fallback: criar mock básico
      window.Lame = class MockLame {
        constructor() {}
        encode() { return new Int8Array(); }
        flush() { return new Int8Array(); }
      };
      window.Presets = {
        STANDARD: { bitrate: 128 },
        EXTREME: { bitrate: 320 },
        MEDIUM: { bitrate: 160 }
      };
      console.warn('Usando mock do Lame e Presets');
    });
  } catch (e) {
    // Fallback imediato
    window.Lame = class MockLame {
      constructor() {}
      encode() { return new Int8Array(); }
      flush() { return new Int8Array(); }
    };
    window.Presets = {
      STANDARD: { bitrate: 128 },
      EXTREME: { bitrate: 320 },
      MEDIUM: { bitrate: 160 }
    };
    console.warn('Lame e Presets mock definidos por erro:', e);
  }
  }
})(); // Fim da execução imediata

// Certificar que o window existe e tem as propriedades necessárias
if (typeof window !== 'undefined') {
  // Garantir compatibilidade com AudioContext
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  
  // Garantir que MediaDevices existe
  if (!navigator.mediaDevices && navigator.getUserMedia) {
    navigator.mediaDevices = {};
    navigator.mediaDevices.getUserMedia = function(constraints) {
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.getUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
  
  // Polyfill para Promise (caso necessário)
  if (!window.Promise) {
    console.warn('Promise polyfill pode ser necessário para navegadores antigos');
  }
  
  // Definir globals que podem ser necessários para o mic-recorder-to-mp3
  if (!window.global) {
    window.global = window;
  }
  
  // Garantir que process está definido para compatibilidade
  if (!window.process) {
    window.process = {
      browser: true,
      env: { NODE_ENV: 'development' }
    };
  }
}

export const initializeMicRecorderPolyfill = () => {
  console.log('MicRecorder polyfill inicializado');
  return true;
};