import React from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

// Wrapper para garantir compatibilidade visual
export const CompatibilityWrapper: React.FC<{
  children: React.ReactNode;
  originalClassName?: string;
  preserveStyles?: boolean;
}> = ({ children, originalClassName, preserveStyles = true }) => {
  return (
    <div 
      className={cn(
        preserveStyles && originalClassName,
        "transition-all duration-200" // Transições suaves
      )}
    >
      {children}
    </div>
  );
};

// HOC para migração gradual de componentes antigos
export const withShadcnCompat = <P extends object>(
  ShadcnComponent: React.ComponentType<P>,
  originalProps?: Partial<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const mergedProps = { ...originalProps, ...props };
    
    React.useEffect(() => {
      logger.development.component('ShadcnComponent', 'RENDERED');
    }, []);
    
    try {
      return <ShadcnComponent {...mergedProps} ref={ref} />;
    } catch (error) {
      console.error('[SHADCN-COMPAT] Erro no componente:', error);
      logger.development.error('Erro em componente Shadcn', error as Error);
      // Fallback para div básica se componente falhar
      return <div {...(props as any)} ref={ref} />;
    }
  });
};