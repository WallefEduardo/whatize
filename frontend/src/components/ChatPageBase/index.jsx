import React from "react";
import { Box, Typography, Link } from "@mui/material";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

/**
 * ChatPageBase - Layout específico para páginas de chat sem scroll
 * Baseado no PageLayout mas com altura fixa e sem scroll
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo da página
 * @param {string} props.title - Título da página
 * @param {React.ReactNode} props.icon - Ícone da página
 * @param {Array} props.breadcrumbs - Array de breadcrumbs [{label: string, href?: string}]
 * @param {React.ReactNode} props.headerActions - Ações no header (botões, etc)
 * @param {boolean} props.showBreadcrumb - Mostrar breadcrumb
 * @param {Object} props.containerSx - Estilos do container principal
 */
const ChatPageBase = ({
  children,
  title = "Chat",
  icon,
  breadcrumbs = [
    { href: "/", icon: <BarChart3 size={16} /> },
    { label: title }
  ],
  headerActions,
  showBreadcrumb = true,
  containerSx = {},
  ...props
}) => {
  return (
    <Box 
      sx={{
        height: 'calc(100vh - 78px)',
        maxHeight: 'calc(100vh - 78px)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-page)',
        px: { xs: 1, sm: 1.5 },
        py: 0,
        width: '100%',
        maxWidth: 'none !important',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        ...containerSx
      }}
      {...props}
    >
      {/* Header da Página */}
      {(showBreadcrumb || (title && title.trim() !== "") || headerActions) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '1rem', flexShrink: 0 }}
        >
          <Box sx={{ mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              gap: 2
            }}>
              {/* Título e Breadcrumb */}
              <Box sx={{ 
                flex: { xs: '1 1 100%', md: 1 },
                order: { xs: 2, md: 1 },
                minWidth: 0
              }}>
                {/* Breadcrumb */}
                {showBreadcrumb && breadcrumbs && breadcrumbs.length > 0 && (
                  <Box component="nav" sx={{ mb: 1 }}>
                    <Box component="ol" sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}>
                      {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && (
                            <Box
                              sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-accent)',
                                opacity: 0.6
                              }}
                            />
                          )}
                          
                          <Box component="li">
                            {crumb.href ? (
                              <Link 
                                href={crumb.href}
                                sx={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  px: 2,
                                  py: 1,
                                  backgroundColor: 'var(--bg-primary)',
                                  border: '1px solid var(--border-primary)',
                                  borderRadius: 2,
                                  color: 'var(--text-gray-medium)',
                                  textDecoration: 'none',
                                  fontSize: '0.875rem',
                                  fontWeight: 500,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                  transition: 'all 0.2s ease',
                                  
                                  '&:hover': {
                                    backgroundColor: 'var(--bg-secondary)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                  }
                                }}
                              >
                                {crumb.icon}
                                <span>{crumb.label || 'Home'}</span>
                              </Link>
                            ) : (
                              <Box sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 2,
                                py: 1,
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}>
                                {crumb.icon && crumb.icon}
                                <span>{crumb.label}</span>
                              </Box>
                            )}
                          </Box>
                        </React.Fragment>
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Título Principal */}
                {title && title.trim() !== "" && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {icon && (
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-accent)'
                      }}>
                        {icon}
                      </Box>
                    )}
                    <Typography 
                      variant="h4" 
                      component="h1"
                      sx={{ 
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontSize: { xs: '1.5rem', sm: '2rem' },
                        lineHeight: 1.2,
                        letterSpacing: '-0.025em'
                      }}
                    >
                      {title}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* Espaço vazio para manter layout */}
              <Box sx={{ 
                flex: { xs: '1 1 100%', md: 1 },
                order: { xs: 1, md: 2 }
              }}>
              </Box>
              
              {/* Ações do header */}
              <Box sx={{ 
                width: { xs: 0, md: 'auto' },
                order: { xs: 3, md: 3 },
                minWidth: { md: '150px' },
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                {headerActions}
              </Box>
            </Box>
          </Box>
        </motion.div>
      )}

      {/* Conteúdo da página */}
      <Box sx={{ 
        width: '100%', 
        maxWidth: 'none', 
        flex: 1, 
        overflow: 'hidden',
        minHeight: 0,
        height: '100%'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default ChatPageBase;