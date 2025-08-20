import React from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { logger } from './logger';

// Helper para converter makeStyles para sx prop
export const convertMakeStylesToSx = (classes: Record<string, any>): SxProps<Theme> => {
  // Converter estilos antigos para novo formato
  const sxStyles: SxProps<Theme> = {};
  
  Object.keys(classes).forEach(key => {
    // Lógica de conversão preservando estilos
    // Implementar conforme necessário durante migração
  });
  
  return sxStyles;
};

// HOC para migração gradual de componentes
export const withMuiV6Compat = <P extends object>(
  Component: React.ComponentType<P>,
  legacyStyles?: any
) => {
  return React.forwardRef<any, P>((props, ref) => {
    // Log da migração
    React.useEffect(() => {
      logger.development.component(`${Component.name || 'Unknown'}`, 'MUI-V6-COMPAT-RENDERED');
    }, []);
    
    return <Component {...props} ref={ref} />;
  });
};

// Wrapper para preservar funcionalidade durante migração
export const preserveComponentBehavior = <T extends React.ComponentType<any>>(
  NewComponent: T,
  OldComponent: T,
  componentName: string
): T => {
  const PreservedComponent = (props: any) => {
    try {
      // Tentar usar novo componente
      return React.createElement(NewComponent, props);
    } catch (error) {
      // Fallback para componente antigo se houver erro
      console.warn(`[PRESERVATION] Fallback para componente antigo: ${componentName}`, error);
      logger.development.error(`Fallback usado em ${componentName}`, error as Error);
      return React.createElement(OldComponent, props);
    }
  };
  
  return PreservedComponent as T;
};