import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../ui/Card';

const UserMeta = ({ user, onUpdate }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Não informado';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <CardContent sx={{ 
        textAlign: 'center', 
        pb: 3,
        pt: 4, // Mais espaço no topo
        px: 3,
        minHeight: '380px' // Aumenta altura do container
      }}>
        {/* Avatar Centralizado */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          mb: 4, // Mais espaço após o avatar
          mt: 1 // Margem top para afastar da borda
        }}>
          <Avatar
            src={user?.profileImage}
            sx={{
              width: 80,
              height: 80,
              fontSize: '32px',
              fontWeight: 600,
              backgroundColor: 'primary.main', // Using theme primary color
              color: 'primary.contrastText', // White text for dark primary
              border: '4px solid #ffffff',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
              mb: 2
            }}
          >
            {getInitials(user?.name)}
          </Avatar>
          
          {/* Nome e Cargo */}
          <Typography variant="h6" sx={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#1e293b',
            lineHeight: 1.2,
            mb: 0.5
          }}>
            {user?.name || 'Nome do Usuário'}
          </Typography>
          <Typography variant="body2" sx={{ 
            fontSize: '13px', 
            color: '#64748b',
            fontWeight: 500
          }}>
            {user?.cargo || 'Cargo'} {user?.departamento && ` • ${user.departamento}`}
          </Typography>
        </Box>

        {/* Título da Seção */}
        <Typography sx={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#374151',
          mb: 3,
          textAlign: 'center'
        }}>
          Informações de Contato
        </Typography>

        {/* Container Centralizado para o Grid */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }}>
          {/* Grid 3x2 dos Contatos - Centralizado */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', // 3 colunas
            gridTemplateRows: 'repeat(2, 1fr)', // 2 linhas
            gap: 3, // Mais espaçamento
            textAlign: 'left',
            width: '100%',
            maxWidth: '350px' // Mais largura para acomodar 3 colunas
          }}>
          {/* Primeira linha: Email, Telefone, Localização */}
          
          {/* Email */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: '100px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: '#f0f9ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Mail size={12} color="#0369a1" />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '9px', fontWeight: 600 }}>
                EMAIL
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: '#1e293b', 
              fontSize: '11px',
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
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Phone size={12} color="#166534" />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '9px', fontWeight: 600 }}>
                TELEFONE
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: '#1e293b', 
              fontSize: '11px', 
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
                backgroundColor: '#fef7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MapPin size={12} color="#a21caf" />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '9px', fontWeight: 600 }}>
                LOCAL
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: '#1e293b', 
              fontSize: '11px', 
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
            gridColumn: '1 / 3' // Ocupa 2 colunas da primeira à segunda
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: '#fefce8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Calendar size={12} color="#a16207" />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '9px', fontWeight: 600 }}>
                DATA DE ADMISSÃO
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: '#1e293b', 
              fontSize: '11px', 
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
            gridColumn: '3 / 4' // Ocupa a terceira coluna
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: '#fff1f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Briefcase size={12} color="#be123c" />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '9px', fontWeight: 600 }}>
                DEPARTAMENTO
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: '#1e293b', 
              fontSize: '11px', 
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

export default UserMeta;