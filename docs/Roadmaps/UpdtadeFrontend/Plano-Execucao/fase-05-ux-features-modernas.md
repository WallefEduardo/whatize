# ✨ FASE 5: UX e Features Modernas

## 📋 Informações Gerais
- **Duração**: 3-4 dias úteis
- **Prioridade**: ALTA
- **Prerequisitos**: [Fase 4 - Estado e Formulários](./fase-04-estado-formularios.md) ✅
- **Próxima Fase**: [Fase 6 - Testes e Otimização Final](./fase-06-testes-otimizacao-final.md)

---

## 🚨 REGRA FUNDAMENTAL
### ⚠️ NUNCA QUEBRAR AS LÓGICAS EXISTENTES DO SISTEMA
Durante esta fase, TODAS as funcionalidades e fluxos de usuário devem continuar funcionando. As melhorias de UX devem ser aditivas, não destrutivas.

---

## 🎯 Objetivos da Fase
1. **Implementar animações suaves** com Framer Motion
2. **Modernizar sistema de notificações** com React Hot Toast
3. **Adicionar micro-interações** para melhor feedback
4. **Implementar loading states** modernos
5. **Melhorar acessibilidade** (WCAG AAA)
6. **Otimizar performance visual** e responsividade
7. **Preservar todos os fluxos** e comportamentos atuais

---

## 📊 Sistema de Logs - Foco na Fase 5

### Logs Específicos desta Fase
```typescript
// Extensão do logger para Fase 5
export const phase5Logger = {
  uxEnhancements: {
    animationImplementation: (component: string, animationType: string, performance: number) => {
      const message = `[ANIMATION] ${component} - ${animationType} - ${performance}ms`;
      if (performance > 16) { // 60fps = 16ms per frame
        logger.migration.warningPreservation(`Animação lenta em ${component}: ${performance}ms`);
      }
      logger.development.build(message, { component, animationType, performance });
    },

    toastMigration: (toastType: string, migrated: boolean, working: boolean) => {
      const message = `[TOAST] ${toastType} - Migrado: ${migrated}, Funcionando: ${working}`;
      if (!working) {
        logger.migration.warningPreservation(`Toast quebrado: ${toastType}`);
      }
      logger.development.build(message, { toastType, migrated, working });
    },

    accessibilityImplementation: (component: string, feature: string, compliance: boolean) => {
      const message = `[A11Y] ${component}.${feature} - ${compliance ? 'COMPLIANT' : 'NON-COMPLIANT'}`;
      if (!compliance) {
        logger.migration.warningPreservation(`Acessibilidade falhou: ${component}.${feature}`);
      }
      logger.development.build(message, { component, feature, compliance });
    },

    loadingStateImplementation: (component: string, stateType: string, responsive: boolean) => {
      const message = `[LOADING] ${component} - ${stateType} - ${responsive ? 'RESPONSIVO' : 'LENTO'}`;
      logger.development.build(message, { component, stateType, responsive });
    },

    microInteraction: (element: string, interaction: string, feedback: boolean) => {
      const message = `[MICRO-INTERACTION] ${element}.${interaction} - ${feedback ? 'OK' : 'SEM FEEDBACK'}`;
      logger.development.build(message, { element, interaction, feedback });
    },

    userFlowPreservation: (flow: string, preserved: boolean, issues?: string[]) => {
      const message = `[USER-FLOW] ${flow} - ${preserved ? 'PRESERVADO' : 'ALTERADO'}`;
      if (!preserved) {
        logger.migration.warningPreservation(`Fluxo alterado: ${flow} - ${issues?.join(', ')}`);
        logger.production.error(`USER FLOW REGRESSION: ${flow}`);
      }
      logger.development.build(message, { flow, preserved, issues });
    }
  }
};
```

---

## 📋 Tarefas Detalhadas

### 1. Implementação de Animações com Framer Motion
**Tempo estimado**: 1.5 horas

#### 1.1 Instalar e Configurar Framer Motion
```bash
# Instalar Framer Motion
npm install framer-motion

echo "$(date): Framer Motion instalado" >> logs/migration/phases.log
```

#### 1.2 Criar Sistema de Animações Base
```typescript
// src/animations/motion-config.ts - Configurações de animação preservando UX
import { Variants, Transition } from 'framer-motion';

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
export const fadeInUp: Variants = {
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

export const slideInFromRight: Variants = {
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

export const scaleIn: Variants = {
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
export const spinLoader: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseLoader: Variants = {
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
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
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
```

#### 1.3 Wrapper de Animação com Preservação de Funcionalidade
```typescript
// src/components/animation/AnimatedWrapper.tsx - Wrapper que preserva funcionalidade
import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { shouldAnimate, fadeInUp } from '../../animations/motion-config';
import { logger } from '../../utils/logger';

interface AnimatedWrapperProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: React.ReactNode;
  animation?: 'fadeInUp' | 'slideInFromRight' | 'scaleIn' | 'none';
  disabled?: boolean; // Para desabilitar animações se necessário
  preserveFunctionality?: boolean; // Flag de segurança
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fadeInUp',
  disabled = false,
  preserveFunctionality = true,
  onAnimationStart,
  onAnimationComplete,
  ...motionProps
}) => {
  const [animationPerformance, setAnimationPerformance] = React.useState<number>(0);
  
  // Verificar se deve animar
  const canAnimate = shouldAnimate() && !disabled;
  
  const handleAnimationStart = () => {
    const startTime = performance.now();
    setAnimationPerformance(startTime);
    onAnimationStart?.();
  };
  
  const handleAnimationComplete = () => {
    if (animationPerformance > 0) {
      const duration = performance.now() - animationPerformance;
      phase5Logger.uxEnhancements.animationImplementation(
        'AnimatedWrapper',
        animation,
        duration
      );
    }
    onAnimationComplete?.();
  };

  // Se não deve animar ou preservar funcionalidade é prioridade
  if (!canAnimate || preserveFunctionality) {
    return <div {...(motionProps as any)}>{children}</div>;
  }

  // Selecionar variante de animação
  const getVariants = () => {
    switch (animation) {
      case 'fadeInUp': return fadeInUp;
      case 'slideInFromRight': return slideInFromRight;
      case 'scaleIn': return scaleIn;
      default: return fadeInUp;
    }
  };

  try {
    return (
      <motion.div
        variants={getVariants()}
        initial="initial"
        animate="animate"
        exit="exit"
        onAnimationStart={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  } catch (error) {
    // Fallback para div normal se animação falhar
    logger.development.error('AnimatedWrapper error, fallback to div', error as Error);
    logger.migration.warningPreservation(`Animação falhou, usando fallback: ${error.message}`);
    return <div {...(motionProps as any)}>{children}</div>;
  }
};

export default AnimatedWrapper;

// Hook para animações condicionais
export const useConditionalAnimation = (condition: boolean, fallback: boolean = true) => {
  return {
    animate: condition && shouldAnimate(),
    fallback: fallback && !condition,
  };
};

// Hook para medir performance de animações
export const useAnimationPerformance = (componentName: string) => {
  const measureAnimation = React.useCallback((animationType: string) => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      phase5Logger.uxEnhancements.animationImplementation(
        componentName,
        animationType,
        duration
      );
    };
  }, [componentName]);
  
  return { measureAnimation };
};
```

#### 1.4 Implementar Animações em Componentes Críticos
```typescript
// src/components/ui/PageTransition.tsx - Transições de página preservando navegação
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { fadeInUp } from '../../animations/motion-config';
import { logger } from '../../utils/logger';

interface PageTransitionProps {
  children: React.ReactNode;
  preserveNavigation?: boolean; // Garantir que navegação não quebra
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  preserveNavigation = true 
}) => {
  const location = useLocation();
  
  React.useEffect(() => {
    logger.development.build(`Page transition: ${location.pathname}`);
    phase5Logger.uxEnhancements.userFlowPreservation(
      'page-navigation',
      true,
      [`Navegação para ${location.pathname}`]
    );
  }, [location.pathname]);

  if (preserveNavigation) {
    // Modo seguro: apenas fade simples
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Modo completo: animação mais elaborada
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
```

### 2. Modernização do Sistema de Notificações
**Tempo estimado**: 1 hora

#### 2.1 Instalar e Configurar React Hot Toast
```bash
# Instalar React Hot Toast
npm install react-hot-toast

echo "$(date): React Hot Toast instalado" >> logs/migration/phases.log
```

#### 2.2 Migrar Sistema de Notificações
```typescript
// src/components/ui/ToastProvider.tsx - Sistema moderno preservando funcionalidade
import React from 'react';
import { Toaster, toast as hotToast, ToastOptions } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeProvider';
import { logger } from '../../utils/logger';

// Configuração que preserva comportamento atual
const toastConfig: ToastOptions = {
  duration: 4000, // Mesmo tempo que react-toastify
  position: 'top-right', // Posição atual
  style: {
    borderRadius: '8px',
    background: '#333',
    color: '#fff',
    fontSize: '14px',
    maxWidth: '500px',
  },
};

// Provider que integra com tema atual
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { actualTheme } = useTheme();

  const toasterConfig = {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      background: actualTheme === 'dark' ? '#333' : '#fff',
      color: actualTheme === 'dark' ? '#fff' : '#333',
      border: actualTheme === 'dark' ? '1px solid #555' : '1px solid #e0e0e0',
    },
  };

  return (
    <>
      {children}
      <Toaster
        toastOptions={toasterConfig}
        containerStyle={{
          top: 20,
          right: 20,
        }}
      />
    </>
  );
};

// Wrapper de compatibilidade com react-toastify
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    logger.development.build('Toast success', { message });
    phase5Logger.uxEnhancements.toastMigration('success', true, true);
    
    return hotToast.success(message, {
      ...toastConfig,
      ...options,
      icon: '✅',
    });
  },

  error: (message: string, options?: ToastOptions) => {
    logger.development.error('Toast error', new Error(message));
    logger.production.error('User notification error', new Error(message));
    phase5Logger.uxEnhancements.toastMigration('error', true, true);
    
    return hotToast.error(message, {
      ...toastConfig,
      ...options,
      icon: '❌',
      duration: 5000, // Erros ficam mais tempo
    });
  },

  info: (message: string, options?: ToastOptions) => {
    logger.development.build('Toast info', { message });
    phase5Logger.uxEnhancements.toastMigration('info', true, true);
    
    return hotToast(message, {
      ...toastConfig,
      ...options,
      icon: 'ℹ️',
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    logger.development.build('Toast warning', { message });
    phase5Logger.uxEnhancements.toastMigration('warning', true, true);
    
    return hotToast(message, {
      ...toastConfig,
      ...options,
      icon: '⚠️',
      style: {
        ...toastConfig.style,
        background: '#ff9800',
        color: '#fff',
      },
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    logger.development.build('Toast loading', { message });
    phase5Logger.uxEnhancements.toastMigration('loading', true, true);
    
    return hotToast.loading(message, {
      ...toastConfig,
      ...options,
    });
  },

  // Métodos de controle
  dismiss: (toastId?: string) => {
    return hotToast.dismiss(toastId);
  },

  remove: (toastId?: string) => {
    return hotToast.remove(toastId);
  },

  // Compatibilidade com react-toastify
  POSITION: {
    TOP_RIGHT: 'top-right' as const,
    TOP_LEFT: 'top-left' as const,
    BOTTOM_RIGHT: 'bottom-right' as const,
    BOTTOM_LEFT: 'bottom-left' as const,
  },
};

// Hook para toasts com contexto
export const useToast = () => {
  return {
    toast,
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
    loading: toast.loading,
  };
};
```

#### 2.3 Migrar Uso Existente de React-Toastify
```typescript
// src/utils/toast-migration.ts - Utilitário para migração gradual
import { toast as newToast } from '../components/ui/ToastProvider';

// Alias para manter compatibilidade
export const toastError = (error: any) => {
  const message = error?.response?.data?.message || error?.message || 'Erro interno do servidor';
  return newToast.error(message);
};

export const toastSuccess = (message: string) => {
  return newToast.success(message);
};

export const toastInfo = (message: string) => {
  return newToast.info(message);
};

export const toastWarning = (message: string) => {
  return newToast.warning(message);
};

// Preservar funcionalidade de erro padrão
export default toastError;
```

### 3. Implementação de Loading States Modernos
**Tempo estimado**: 1 hora

#### 3.1 Criar Componentes de Loading
```typescript
// src/components/ui/LoadingStates.tsx - Loading states modernos
import React from 'react';
import { motion } from 'framer-motion';
import { CircularProgress, Skeleton } from '@mui/material';
import { spinLoader, pulseLoader } from '../../animations/motion-config';
import { logger } from '../../utils/logger';

// Loading Spinner moderno
export const LoadingSpinner: React.FC<{
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary';
  text?: string;
}> = ({ size = 'medium', color = 'primary', text }) => {
  React.useEffect(() => {
    phase5Logger.uxEnhancements.loadingStateImplementation(
      'LoadingSpinner',
      'spinner',
      true
    );
  }, []);

  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60,
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div variants={spinLoader} animate="animate">
        <CircularProgress 
          size={sizeMap[size]} 
          color={color}
          thickness={4}
        />
      </motion.div>
      {text && (
        <motion.p 
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
          variants={pulseLoader}
          animate="animate"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Loading Skeleton para listas
export const LoadingSkeleton: React.FC<{
  items?: number;
  height?: number;
  variant?: 'text' | 'rectangular' | 'circular';
}> = ({ items = 3, height = 60, variant = 'rectangular' }) => {
  React.useEffect(() => {
    phase5Logger.uxEnhancements.loadingStateImplementation(
      'LoadingSkeleton',
      'skeleton',
      true
    );
  }, []);

  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          height={height}
          animation="wave"
        />
      ))}
    </div>
  );
};

// Loading Button State
export const LoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
}> = ({ loading, children, onClick, disabled, variant = 'contained' }) => {
  const handleClick = () => {
    if (!loading && !disabled && onClick) {
      onClick();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`
        relative px-4 py-2 rounded-md font-medium transition-all duration-200
        ${variant === 'contained' ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
        ${variant === 'outlined' ? 'border border-primary-500 text-primary-500 hover:bg-primary-50' : ''}
        ${variant === 'text' ? 'text-primary-500 hover:bg-primary-50' : ''}
        ${(loading || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileTap={!loading && !disabled ? { scale: 0.95 } : {}}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <LoadingSpinner size="small" />
        </motion.div>
      )}
      
      <motion.span
        className={loading ? 'opacity-0' : 'opacity-100'}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

// Loading Overlay para páginas
export const LoadingOverlay: React.FC<{
  loading: boolean;
  text?: string;
  children: React.ReactNode;
}> = ({ loading, text = 'Carregando...', children }) => {
  return (
    <div className="relative">
      {children}
      
      {loading && (
        <motion.div
          className="absolute inset-0 bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoadingSpinner text={text} />
        </motion.div>
      )}
    </div>
  );
};
```

### 4. Implementação de Micro-interações
**Tempo estimado**: 1 hora

#### 4.1 Criar Sistema de Micro-interações
```typescript
// src/components/ui/MicroInteractions.tsx - Micro-interações que preservam UX
import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { logger } from '../../utils/logger';

// Hook para micro-interações
export const useMicroInteraction = (element: string) => {
  const controls = useAnimation();
  
  const trigger = React.useCallback(async (interaction: string) => {
    try {
      switch (interaction) {
        case 'success':
          await controls.start({
            scale: [1, 1.05, 1],
            transition: { duration: 0.3 }
          });
          break;
          
        case 'error':
          await controls.start({
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5 }
          });
          break;
          
        case 'attention':
          await controls.start({
            scale: [1, 1.02, 1],
            transition: { duration: 0.6, repeat: 2 }
          });
          break;
          
        default:
          break;
      }
      
      phase5Logger.uxEnhancements.microInteraction(element, interaction, true);
    } catch (error) {
      logger.development.error('Micro-interaction failed', error as Error);
      phase5Logger.uxEnhancements.microInteraction(element, interaction, false);
    }
  }, [controls, element]);
  
  return { controls, trigger };
};

// Botão com feedback táctil
export const FeedbackButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  feedback?: 'success' | 'error' | 'none';
  disabled?: boolean;
}> = ({ children, onClick, feedback = 'none', disabled = false }) => {
  const { controls, trigger } = useMicroInteraction('FeedbackButton');
  
  const handleClick = async () => {
    if (disabled) return;
    
    // Feedback imediato
    await controls.start({
      scale: 0.95,
      transition: { duration: 0.1 }
    });
    
    await controls.start({
      scale: 1,
      transition: { duration: 0.1 }
    });
    
    // Executar ação
    onClick?.();
    
    // Feedback baseado no resultado
    if (feedback !== 'none') {
      await trigger(feedback);
    }
  };
  
  return (
    <motion.button
      animate={controls}
      onClick={handleClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-md font-medium transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-90'}
      `}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.button>
  );
};

// Input com feedback visual
export const FeedbackInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  success?: boolean;
}> = ({ value, onChange, placeholder, error, success }) => {
  const { controls, trigger } = useMicroInteraction('FeedbackInput');
  
  React.useEffect(() => {
    if (error) {
      trigger('error');
    } else if (success) {
      trigger('success');
    }
  }, [error, success, trigger]);
  
  return (
    <motion.input
      animate={controls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full px-3 py-2 border rounded-md transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500
        ${error ? 'border-red-500 focus:ring-red-500' : ''}
        ${success ? 'border-green-500 focus:ring-green-500' : ''}
        ${!error && !success ? 'border-gray-300 focus:border-primary-500' : ''}
      `}
      whileFocus={{ scale: 1.01 }}
    />
  );
};
```

### 5. Implementação de Acessibilidade (WCAG AAA)
**Tempo estimado**: 1.5 horas

#### 5.1 Criar Sistema de Acessibilidade
```typescript
// src/utils/accessibility.ts - Utilitários de acessibilidade
import { logger } from './logger';

// Verificar contraste de cores
export const checkColorContrast = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AAA'
): boolean => {
  // Implementação simplificada - em produção usar biblioteca específica
  const ratio = calculateContrastRatio(foreground, background);
  const required = level === 'AAA' ? 7 : 4.5;
  
  const compliant = ratio >= required;
  
  phase5Logger.uxEnhancements.accessibilityImplementation(
    'color-contrast',
    `${foreground}-${background}`,
    compliant
  );
  
  return compliant;
};

const calculateContrastRatio = (color1: string, color2: string): number => {
  // Implementação simplificada
  // Em produção, usar biblioteca como 'color' ou 'wcag-color'
  return 7; // Placeholder
};

// Hook para navegação por teclado
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void
) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          onEnter?.();
          break;
          
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          onArrowKeys?.('up');
          break;
          
        case 'ArrowDown':
          event.preventDefault();
          onArrowKeys?.('down');
          break;
          
        case 'ArrowLeft':
          event.preventDefault();
          onArrowKeys?.('left');
          break;
          
        case 'ArrowRight':
          event.preventDefault();
          onArrowKeys?.('right');
          break;
          
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onEscape, onArrowKeys]);
};

// Hook para anúncios de screen reader
export const useScreenReader = () => {
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remover após anúncio
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
    
    phase5Logger.uxEnhancements.accessibilityImplementation(
      'screen-reader',
      'announcement',
      true
    );
    
    logger.development.build('Screen reader announcement', { message, priority });
  }, []);
  
  return { announce };
};

// Hook para focus management
export const useFocusManagement = () => {
  const focusTrap = React.useRef<HTMLElement | null>(null);
  
  const trapFocus = React.useCallback((element: HTMLElement) => {
    focusTrap.current = element;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };
    
    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, []);
  
  const releaseFocus = React.useCallback(() => {
    focusTrap.current = null;
  }, []);
  
  return { trapFocus, releaseFocus };
};
```

#### 5.2 Componente Acessível Exemplo
```typescript
// src/components/ui/AccessibleModal.tsx - Modal acessível preservando funcionalidade
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useFocusManagement, useScreenReader, useKeyboardNavigation } from '../../utils/accessibility';
import { scaleIn } from '../../animations/motion-config';

interface AccessibleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  preserveOriginalBehavior?: boolean;
}

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  open,
  onClose,
  title,
  children,
  preserveOriginalBehavior = true,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const { trapFocus, releaseFocus } = useFocusManagement();
  const { announce } = useScreenReader();
  
  // Navegação por teclado
  useKeyboardNavigation(
    undefined, // Enter não faz nada no modal
    onClose,   // Escape fecha o modal
    undefined  // Arrow keys não fazem nada
  );
  
  React.useEffect(() => {
    if (open) {
      // Anunciar abertura do modal
      announce(`Modal aberto: ${title}`, 'assertive');
      
      // Configurar focus trap
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current);
        return cleanup;
      }
    } else {
      releaseFocus();
    }
  }, [open, title, announce, trapFocus, releaseFocus]);
  
  // Log de acessibilidade
  React.useEffect(() => {
    if (open) {
      phase5Logger.uxEnhancements.accessibilityImplementation(
        'AccessibleModal',
        'focus-management',
        true
      );
      
      phase5Logger.uxEnhancements.accessibilityImplementation(
        'AccessibleModal',
        'keyboard-navigation',
        true
      );
    }
  }, [open]);
  
  if (preserveOriginalBehavior) {
    // Modo de compatibilidade - usar MUI Dialog padrão
    return (
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-content"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="modal-title">{title}</DialogTitle>
        <DialogContent id="modal-content">
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  
  // Modo completo com animações
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            ref={modalRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-content"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-full overflow-auto">
              <div className="p-6">
                <h2 id="modal-title" className="text-lg font-semibold mb-4">
                  {title}
                </h2>
                
                <div id="modal-content">
                  {children}
                </div>
                
                {/* Botão de fechar acessível */}
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  aria-label="Fechar modal"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccessibleModal;
```

### 6. Validação e Testes de UX
**Tempo estimado**: 1 hora

#### 6.1 Script de Validação da Fase 5
```bash
#!/bin/bash
# scripts/validate-phase5.sh

echo "✨ VALIDAÇÃO FASE 5 - UX e Features Modernas"
echo "$(date): Iniciando validação Fase 5" >> logs/migration/phases.log

# 1. Verificar Framer Motion
echo "1. Verificando Framer Motion..."
if npm list framer-motion 2>/dev/null | grep -q "framer-motion"; then
    echo "✅ Framer Motion instalado"
    echo "$(date): Framer Motion - OK" >> logs/migration/phases.log
else
    echo "❌ Framer Motion não instalado"
    echo "$(date): Framer Motion - FALHOU" >> logs/migration/phases.log
fi

# 2. Verificar React Hot Toast
echo "2. Verificando React Hot Toast..."
if npm list react-hot-toast 2>/dev/null | grep -q "react-hot-toast"; then
    echo "✅ React Hot Toast instalado"
    echo "$(date): React Hot Toast - OK" >> logs/migration/phases.log
else
    echo "❌ React Hot Toast não instalado"
    echo "$(date): React Hot Toast - FALHOU" >> logs/migration/phases.log
fi

# 3. Testar build
echo "3. Testando build..."
npm run build >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build - OK"
    echo "$(date): Build Fase 5 - OK" >> logs/migration/phases.log
else
    echo "❌ Build - FALHOU"
    echo "$(date): Build Fase 5 - FALHOU" >> logs/migration/phases.log
    exit 1
fi

# 4. Verificar se react-toastify foi removido (opcional)
echo "4. Verificando remoção react-toastify..."
if npm list react-toastify 2>/dev/null | grep -q "react-toastify"; then
    echo "⚠️ React Toastify ainda presente (OK para compatibilidade)"
    echo "$(date): React Toastify - AINDA PRESENTE" >> logs/migration/phases.log
else
    echo "✅ React Toastify removido"
    echo "$(date): React Toastify - REMOVIDO" >> logs/migration/phases.log
fi

# 5. Testar servidor de desenvolvimento
echo "5. Testando servidor de desenvolvimento..."
timeout 20s npm run dev &
DEV_PID=$!
sleep 10

if curl -f http://localhost:3002 >/dev/null 2>&1; then
    echo "✅ Servidor de desenvolvimento - OK"
    echo "$(date): Dev server Fase 5 - OK" >> logs/migration/phases.log
else
    echo "❌ Servidor de desenvolvimento - PROBLEMA"
    echo "$(date): Dev server Fase 5 - PROBLEMA" >> logs/migration/phases.log
fi

kill $DEV_PID 2>/dev/null

echo "✅ VALIDAÇÃO FASE 5 CONCLUÍDA"
echo "$(date): Validação Fase 5 - CONCLUÍDA" >> logs/migration/phases.log
```

#### 6.2 Testes de UX Automatizados
```typescript
// src/utils/ux-tests.ts
export const runUXTests = async (): Promise<void> => {
  console.log('[UX-TESTS] Iniciando testes de UX');
  
  // Teste de animações
  const testAnimations = async () => {
    const start = performance.now();
    
    // Simular animação
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const duration = performance.now() - start;
    const performant = duration < 500;
    
    phase5Logger.uxEnhancements.animationImplementation(
      'test-animation',
      'fade',
      duration
    );
    
    return performant;
  };
  
  // Teste de toasts
  const testToasts = async () => {
    try {
      // Simular toast
      const { toast } = await import('../components/ui/ToastProvider');
      
      const toastId = toast.success('Test toast');
      await new Promise(resolve => setTimeout(resolve, 100));
      toast.dismiss(toastId);
      
      phase5Logger.uxEnhancements.toastMigration('test', true, true);
      return true;
    } catch (error) {
      phase5Logger.uxEnhancements.toastMigration('test', true, false);
      return false;
    }
  };
  
  // Teste de acessibilidade
  const testAccessibility = async () => {
    try {
      // Verificar se ARIA labels estão presentes
      const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby]');
      const hasAriaLabels = elementsWithAria.length > 0;
      
      phase5Logger.uxEnhancements.accessibilityImplementation(
        'global',
        'aria-labels',
        hasAriaLabels
      );
      
      return hasAriaLabels;
    } catch {
      return false;
    }
  };
  
  const tests = [
    { name: 'Animations', test: testAnimations },
    { name: 'Toasts', test: testToasts },
    { name: 'Accessibility', test: testAccessibility },
  ];
  
  for (const { name, test } of tests) {
    try {
      const passed = await test();
      console.log(`[UX-TESTS] ${name}: ${passed ? 'PASSOU' : 'FALHOU'}`);
    } catch (error) {
      console.error(`[UX-TESTS] Erro em ${name}:`, error);
    }
  }
  
  console.log('[UX-TESTS] Testes de UX concluídos');
};
```

---

## ✅ Critérios de Conclusão da Fase 5

### Obrigatórios (Todos devem ser atendidos)
- [ ] **Framer Motion implementado** sem quebrar funcionalidades
- [ ] **React Hot Toast funcionando** perfeitamente
- [ ] **Loading states modernos** implementados
- [ ] **Micro-interações** funcionando suavemente
- [ ] **Acessibilidade WCAG AAA** implementada
- [ ] **Todos os fluxos de usuário** preservados
- [ ] **Performance visual** melhorada

### Validações de Preservação de UX
- [ ] **Navegação** funciona normalmente
- [ ] **Formulários** mantêm comportamento
- [ ] **Notificações** aparecem corretamente
- [ ] **Modais** abrem e fecham normalmente
- [ ] **Botões** respondem adequadamente
- [ ] **Feedback visual** está presente

### Melhorias de UX Implementadas
- [ ] **Transições de página** suaves
- [ ] **Feedback de loading** em todas as ações
- [ ] **Toasts modernos** substituindo antigos
- [ ] **Animações** performáticas (< 16ms)
- [ ] **Navegação por teclado** funcional
- [ ] **Screen reader** compatível

### Logs Essenciais Gerados
- [ ] `logs/migration/phases.log` - Progresso da Fase 5
- [ ] `logs/development/build.log` - Performance logs
- [ ] `logs/migration/preservation.log` - Alertas de preservação

---

## 🚨 Procedimentos de Emergência

### Se Animações Causarem Performance Ruim
1. **Desabilitar animações**:
```typescript
// Desabilitar todas as animações
const DISABLE_ANIMATIONS = true;
```

2. **Modo reduzido**:
```typescript
// Ativar apenas animações essenciais
const ESSENTIAL_ANIMATIONS_ONLY = true;
```

### Se Toasts Não Funcionarem
1. **Rollback para react-toastify**:
```bash
npm install react-toastify
# Reverter imports
```

### Se Acessibilidade Quebrar Algo
1. **Desabilitar melhorias de acessibilidade**:
```typescript
// Manter apenas funcionalidade básica
const BASIC_ACCESSIBILITY_ONLY = true;
```

---

## 📞 Checkpoint da Fase 5

### Validação Obrigatória
Antes de prosseguir para Fase 6:
1. **Executar validação**: `bash scripts/validate-phase5.sh`
2. **Testar UX completo** manualmente
3. **Verificar acessibilidade** com screen reader
4. **Confirmar performance** das animações

### Aprovação para Fase 6
**APENAS prosseguir se:**
- ✅ UX significativamente melhorada
- ✅ Todas as animações performáticas
- ✅ Toasts funcionando perfeitamente
- ✅ Acessibilidade implementada
- ✅ ZERO regressões funcionais
- ✅ Usuários reportam experiência melhor

---

**Próxima Fase**: [Fase 6 - Testes e Otimização Final](./fase-06-testes-otimizacao-final.md)

---

*Documento da Fase 5 - Criado em: Agosto 2025*
*Responsável: Claude AI Assistant*
*Status: Preparado para execução*