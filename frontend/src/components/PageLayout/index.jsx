import React from "react";
import { Box, Typography, Link } from "@mui/material";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

/**
 * PageLayout - Componente de layout padrão para páginas baseado no design do Reports
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
const PageLayout = ({
  children,
  title = "Página",
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
        minHeight: '100vh',
        backgroundColor: 'var(--bg-content)', // Fundo adaptável ao tema
        px: { xs: 1.5, sm: 2 }, // 15px nas extremidades
        py: 3,
        width: '100%',
        maxWidth: 'none !important',
        margin: 0,
        ...containerSx
      }}
      {...props}
    >
      {/* Header da Página */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '2rem' }}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            flexWrap: 'wrap',
            gap: 2
          }}>
            {/* Breadcrumb moderno no lado esquerdo */}
            {showBreadcrumb && (
              <Box 
                component="ol" 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  listStyle: 'none',
                  m: 0,
                  p: 0,
                  gap: 1,
                  order: { xs: 2, md: 1 }
                }}
              >
                {breadcrumbs.map((crumb, index) => {
                  const isLastCrumb = index === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={index}>
                      {/* Separador circular - apenas entre itens */}
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
                                color: 'var(--color-accent)',
                                borderColor: 'var(--color-accent)',
                                transform: 'translateY(-1px)'
                              }
                            }}
                          >
                            {crumb.icon && React.cloneElement(crumb.icon, { size: 16 })}
                            {crumb.label}
                          </Link>
                        ) : (
                          <Box
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              px: 2,
                              py: 1,
                              backgroundColor: isLastCrumb ? 'var(--bg-primary)' : 'var(--bg-primary)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: 2,
                              color: isLastCrumb ? 'var(--color-accent)' : 'var(--text-gray-medium)',
                              fontSize: '0.875rem',
                              fontWeight: isLastCrumb ? 600 : 500,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              borderColor: isLastCrumb ? 'var(--color-accent)' : 'var(--border-primary)',
                            }}
                          >
                            {crumb.icon && React.cloneElement(crumb.icon, { 
                              size: 16, 
                              color: isLastCrumb ? 'var(--color-accent)' : 'var(--text-gray-medium)' 
                            })}
                            {crumb.label}
                          </Box>
                        )}
                      </Box>
                    </React.Fragment>
                  );
                })}
              </Box>
            )}
            
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

      {/* Conteúdo da página */}
      <Box sx={{ width: '100%', maxWidth: 'none', flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;