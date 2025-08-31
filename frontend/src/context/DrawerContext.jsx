import React, { createContext, useContext } from 'react';

const DrawerContext = createContext();

export const useDrawerControl = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawerControl deve ser usado dentro de DrawerProvider');
  }
  return context;
};

export const DrawerProvider = ({ children, drawerOpen, setDrawerOpen }) => {
  const value = {
    drawerOpen,
    setDrawerOpen,
    toggleDrawer: () => setDrawerOpen(!drawerOpen),
    collapseDrawer: () => setDrawerOpen(false),
    expandDrawer: () => setDrawerOpen(true)
  };

  return (
    <DrawerContext.Provider value={value}>
      {children}
    </DrawerContext.Provider>
  );
};