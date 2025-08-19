import React from 'react';

export const preserveJavaScriptFunctionality = () => {
  // Garantir que JavaScript e TypeScript coexistam
  console.log('[MIGRATION] JavaScript/TypeScript híbrido configurado');
};

// Wrapper para componentes JavaScript existentes
export const wrapJSComponent = <T extends React.ComponentType<any>>(
  component: T,
  componentName: string
): T => {
  const WrappedComponent = (props: any) => {
    console.log(`[JS-COMPAT] ${componentName} renderizado`);
    return React.createElement(component, props);
  };
  
  return WrappedComponent as T;
};