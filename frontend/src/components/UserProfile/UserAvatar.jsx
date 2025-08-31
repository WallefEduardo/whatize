import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { CardContent } from '../ui/Card';

const UserAvatar = ({ user, onUpdate }) => {
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
    <CardContent sx={{ 
      textAlign: 'center', 
      pb: 3,
      pt: 4,
      px: 3
    }}>
      {/* Avatar Centralizado */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        mb: 2,
        mt: 1
      }}>
        <Avatar
          src={user?.profileImage}
          sx={{
            width: 100,
            height: 100,
            fontSize: '40px',
            fontWeight: 600,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
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
          color: 'var(--text-gray-medium)',
          lineHeight: 1.2,
          mb: 0.5
        }}>
          {user?.name || 'Nome do Usuário'}
        </Typography>
        <Typography variant="body2" sx={{ 
          fontSize: '13px', 
          color: 'var(--text-gray-medium)',
          fontWeight: 500
        }}>
          {user?.cargo || 'Cargo'} {user?.departamento && ` • ${user.departamento}`}
        </Typography>
      </Box>
    </CardContent>
  );
};

export default UserAvatar;