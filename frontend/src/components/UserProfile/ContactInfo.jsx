import React from 'react';
import { Box, Typography } from '@mui/material';
import { Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../ui/Card';

const ContactInfo = ({ user, onUpdate }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Não informado';
    }
  };

  return (
    <>
      <CardHeader sx={{ pb: 2 }}>
        <CardTitle>Informações de Contato</CardTitle>
      </CardHeader>
      <CardContent sx={{ 
        pt: 0,
        pb: 4,
        px: 3,
        minHeight: '320px'
      }}>
        {/* Container Centralizado para o Grid */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }}>
          {/* Grid 3x2 dos Contatos - Centralizado */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 4,
            textAlign: 'left',
            width: '100%',
            maxWidth: '100%',
            px: 1
          }}>
          {/* Primeira linha: Email, Telefone, Localização */}
          
          {/* Email */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: '100px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Mail size={12} color="#0369a1" />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
                EMAIL
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: 'var(--text-primary)', 
              fontSize: '13px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.email || 'email@exemplo.com'}
            </Typography>
          </Box>

          {/* Telefone */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: '100px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Phone size={12} color="#166534" />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
                TELEFONE
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: 'var(--text-primary)', 
              fontSize: '13px', 
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}>
              {user?.telefone || '(11) 99999-9999'}
            </Typography>
          </Box>

          {/* Localização */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: '100px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MapPin size={12} color="#a21caf" />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
                LOCAL
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: 'var(--text-primary)', 
              fontSize: '13px', 
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.cidade ? `${user.cidade}, ${user.estado || 'BR'}` : 'São Paulo, SP'}
            </Typography>
          </Box>

          {/* Segunda linha: Data de Admissão, Departamento */}
          
          {/* Data de Admissão */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5, 
            minWidth: '100px',
            gridColumn: '1 / 3'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Calendar size={12} color="#a16207" />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
                DATA DE ADMISSÃO
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: 'var(--text-primary)', 
              fontSize: '13px', 
              fontWeight: 500
            }}>
              {formatDate(user?.dataAdmissao)}
            </Typography>
          </Box>

          {/* Departamento */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5, 
            minWidth: '100px',
            gridColumn: '3 / 4'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Briefcase size={12} color="#be123c" />
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
                DEPARTAMENTO
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: 'var(--text-primary)', 
              fontSize: '13px', 
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.departamento || 'Desenvolvimento'}
            </Typography>
          </Box>
        </Box>
        </Box>
      </CardContent>
    </>
  );
};

export default ContactInfo;