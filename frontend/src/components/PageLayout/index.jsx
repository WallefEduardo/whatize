import React from "react";
import { Box, Typography, Link } from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
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
    { label: "Dashboard", href: "/" },
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
            {/* Breadcrumb no lado esquerdo */}
            {showBreadcrumb && (
              <Box 
                component="ol" 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  listStyle: 'none',
                  m: 0,
                  p: 0,
                  color: 'var(--text-gray-medium)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  order: { xs: 2, md: 1 }
                }}
              >
                <Box component="li" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Link 
                    href="/"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-gray-medium)',
                      textDecoration: 'none',
                      '&:hover': { color: 'var(--color-accent)' }
                    }}
                  >
                    <HomeIcon sx={{ fontSize: 16 }} />
                  </Link>
                </Box>
                
                {breadcrumbs.map((crumb, index) => (
                  <Box 
                    key={index}
                    component="li" 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      '&:before': {
                        content: '"/"',
                        px: 1.5,
                        color: 'var(--text-gray-medium)'
                      }
                    }}
                  >
                    {crumb.href ? (
                      <Link 
                        href={crumb.href}
                        sx={{ 
                          color: 'var(--text-gray-medium)',
                          textDecoration: 'none',
                          '&:hover': { color: 'var(--color-accent)' }
                        }}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <Typography 
                        sx={{ 
                          color: 'var(--text-gray-medium)',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}
                      >
                        {crumb.label}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            
            {/* Título centralizado com ícone */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              flex: { xs: '1 1 100%', md: 1 },
              order: { xs: 1, md: 2 }
            }}>
              {icon && React.cloneElement(icon, {
                sx: { 
                  mr: 2, 
                  color: 'var(--color-accent)', 
                  fontSize: 32,
                  filter: 'drop-shadow(0 2px 4px rgba(0,195,7,0.2))',
                  ...icon.props?.sx
                } 
              })}
              <Typography
                variant="h5"
                sx={{ 
                  fontWeight: 700,
                  color: 'var(--text-gray-medium)',
                  mb: 0,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  textAlign: 'center'
                }}
              >
                {title}
              </Typography>
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