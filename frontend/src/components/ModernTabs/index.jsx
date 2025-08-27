import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ModernTabs - Componente de abas moderno baseado no template
 * 
 * @param {Object} props
 * @param {Array} props.tabs - Array de abas com estrutura: 
 *   [{ id: string, label: string, icon?: ReactNode, content: ReactNode }]
 * @param {string} props.defaultTab - ID da aba padrão (opcional)
 * @param {Function} props.onTabChange - Callback quando aba muda (opcional)
 * @param {Object} props.sx - Estilos customizados (opcional)
 * 
 * @example
 * <ModernTabs
 *   tabs={[
 *     { 
 *       id: 'home', 
 *       label: 'Home', 
 *       icon: <Home size={18} />, 
 *       content: <div>Conteúdo da Home</div> 
 *     },
 *     { 
 *       id: 'profile', 
 *       label: 'Profile', 
 *       icon: <User size={18} />, 
 *       content: <div>Conteúdo do Profile</div> 
 *     }
 *   ]}
 *   defaultTab="home"
 *   onTabChange={(tabId) => console.log('Aba ativa:', tabId)}
 * />
 */
const ModernTabs = ({
  tabs = [],
  defaultTab = null,
  onTabChange = () => {},
  sx = {}
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onTabChange(tabId);
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content || null;

  if (!tabs.length) return null;

  return (
    <Box sx={{ mb: 5, ...sx }}>
      {/* Botões das abas */}
      <Box>
        <Box
          component="ul"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            mt: 3,
            mb: 5,
            listStyle: 'none',
            p: 0,
            m: 0,
            gap: 0
          }}
        >
          {tabs.map((tab) => (
            <Box
              component="li"
              key={tab.id}
            >
              <Box
                component="button"
                onClick={() => handleTabChange(tab.id)}
                sx={{
                  px: 3.5,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  backgroundColor: activeTab === tab.id 
                    ? 'var(--bg-secondary)' 
                    : 'var(--bg-primary)',
                  border: 'none',
                  borderTop: '2px solid',
                  borderTopColor: activeTab === tab.id 
                    ? 'var(--color-accent)' 
                    : 'transparent',
                  color: activeTab === tab.id 
                    ? 'var(--color-accent)' 
                    : 'var(--text-gray-medium)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.95rem',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  textDecoration: 'none',
                  outline: 'none',
                  minHeight: '52px',
                  '&:hover': {
                    backgroundColor: 'var(--bg-secondary)',
                    borderTopColor: 'var(--color-accent)',
                    color: 'var(--color-accent)',
                  },
                  '&:focus': {
                    outline: 'none',
                  }
                }}
              >
                {/* Ícone da aba */}
                {tab.icon && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'inherit',
                      '& svg': {
                        width: 18,
                        height: 18
                      }
                    }}
                  >
                    {tab.icon}
                  </Box>
                )}
                
                {/* Label da aba */}
                <Typography
                  variant="body2"
                  sx={{
                    color: 'inherit',
                    fontWeight: 'inherit',
                    fontSize: 'inherit',
                    textTransform: 'none',
                    letterSpacing: '0.5px'
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Conteúdo das abas */}
      <Box
        sx={{
          flex: 1,
          fontSize: '0.875rem',
          minHeight: '200px',
          position: 'relative'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              width: '100%',
              top: 0,
              left: 0
            }}
          >
            <Box
              sx={{
                color: 'var(--text-primary)',
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  color: 'var(--text-primary)',
                  fontWeight: 600
                },
                '& p': {
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  mb: 2
                }
              }}
            >
              {activeTabContent}
            </Box>
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default ModernTabs;