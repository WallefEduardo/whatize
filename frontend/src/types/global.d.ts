// Declarações globais para evitar erros durante migração gradual
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.mp3';
declare module '*.ogg';

// Declarações para bibliotecas sem tipos
declare module 'react-modal-image';
declare module 'react-webcam';
declare module 'react-html5-camera-photo';
declare module 'mic-recorder-to-mp3';
declare module 'emoji-mart';
declare module 'react-trello';
declare module 'react-softphone';
declare module 'material-ui-color';
declare module 'material-ui-popup-state';
declare module 'qrcode.react';
declare module 'react-big-calendar';
declare module 'react-csv';
declare module 'react-facebook-login';
declare module 'react-favicon';
declare module 'react-flow-renderer';
declare module 'react-html5-camera-photo';
declare module 'react-input-mask';
declare module 'react-modal-image';
declare module 'react-number-format';
declare module 'react-onesignal';
declare module 'react-pdf';
declare module 'react-player';
declare module 'react-qr-code';
declare module 'react-youtube';
declare module 'use-debounce';
declare module 'use-sound';

// Manter compatibilidade com código JavaScript existente
declare global {
  interface Window {
    finishProgress?: () => void;
  }
}