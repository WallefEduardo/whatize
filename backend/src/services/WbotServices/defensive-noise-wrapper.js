// 🛡️ WRAPPER DEFENSIVO: Intercepta frames XML malformados para evitar crashes
const originalNoiseHandler = require('baileys/lib/Utils/noise-handler').default;

module.exports = function createDefensiveNoiseHandler(...args) {
  const originalHandler = originalNoiseHandler(...args);
  
  return {
    ...originalHandler,
    processFrame: function(data, onFrame) {
      const originalOnFrame = onFrame;
      
      // 🛡️ Wrapper defensivo para capturar frames malformados
      const safeOnFrame = (frame) => {
        try {
          console.log('🔍 [DEFENSIVE] Frame recebido:', {
            tag: frame?.tag,
            attrs: frame?.attrs,
            hasContent: !!frame?.content,
            timestamp: new Date().toISOString()
          });
          
          // Validar se o frame tem estrutura válida
          if (!frame || typeof frame.tag !== 'string') {
            console.error('❌ [DEFENSIVE] Frame inválido detectado:', frame);
            return; // Ignora frame inválido
          }
          
          originalOnFrame(frame);
          
        } catch (error) {
          console.error('❌ [DEFENSIVE] Erro ao processar frame:', {
            error: error.message,
            stack: error.stack,
            frame: frame
          });
          
          // Não propaga o erro - continua funcionando
          console.log('🛡️ [DEFENSIVE] Frame problemático ignorado, continuando operação...');
        }
      };
      
      return originalHandler.processFrame(data, safeOnFrame);
    }
  };
};