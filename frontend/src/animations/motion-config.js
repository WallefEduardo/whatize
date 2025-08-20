// Configurações de animação preservando UX existente

// Configurações base que respeitam preferências do usuário
export const motionConfig = {
  // Respeitar prefers-reduced-motion
  respectUserPreferences: true,
  
  // Durações padrão (suaves mas não lentas)
  durations: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
  },
  
  // Easing functions suaves
  easing: {
    smooth: [0.25, 0.46, 0.45, 0.94],
    snappy: [0.68, -0.55, 0.265, 1.55],
    gentle: [0.25, 0.1, 0.25, 1],
  },
};

// Verificar preferências do usuário
export const shouldAnimate = () => {
  if (!motionConfig.respectUserPreferences) return true;
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return !prefersReducedMotion;
};

// Variantes de animação comuns
export const fadeInUp = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionConfig.durations.normal,
      ease: motionConfig.easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: motionConfig.durations.fast,
    },
  },
};

export const slideInFromRight = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: motionConfig.durations.normal,
      ease: motionConfig.easing.smooth,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: motionConfig.durations.fast,
    },
  },
};

export const scaleIn = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: motionConfig.durations.fast,
      ease: motionConfig.easing.gentle,
    },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: {
      duration: motionConfig.durations.fast,
    },
  },
};

// Animações de loading
export const spinLoader = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseLoader = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Stagger para listas
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionConfig.durations.normal,
    },
  },
};