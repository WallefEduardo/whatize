import React, { useState } from 'react';
import { Box, Avatar, Typography, IconButton } from '@mui/material';
import { Camera, Upload } from 'lucide-react';
import { CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import ModernButton from '../ui/ModernButton';

const UserMeta = ({ user, onUpdate }) => {
  const [uploading, setUploading] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    setUploading(true);
    
    // Aqui você faria o upload real para o backend
    try {
      // Simular upload - substitua pela lógica real
      const formData = new FormData();
      formData.append('avatar', file);
      
      // const response = await api.post(`/users/${user.id}/avatar`, formData);
      // onUpdate({...user, profileImage: response.data.profileImage});
      
      // Por enquanto, apenas simular
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (onUpdate) {
            onUpdate({...user, profileImage: e.target.result});
          }
          setUploading(false);
        };
        reader.readAsDataURL(file);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setUploading(false);
    }
  };

  return (
    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
      {/* Avatar Container */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Avatar
          src={user?.profileImage}
          sx={{
            width: 124,
            height: 124,
            fontSize: '48px',
            fontWeight: 600,
            backgroundColor: '#3b82f6',
            border: '4px solid #ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          {getInitials(user?.name)}
        </Avatar>
        
        {/* Upload Button */}
        <IconButton
          component="label"
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: '#3b82f6',
            color: 'white',
            width: 32,
            height: 32,
            '&:hover': {
              backgroundColor: '#2563eb'
            },
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
          disabled={uploading}
        >
          {uploading ? (
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
          ) : (
            <Camera size={16} />
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
        </IconButton>
      </Box>

      {/* User Info */}
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600, 
          color: '#1e293b', 
          textAlign: 'center',
          mb: 1,
          fontSize: '20px'
        }}
      >
        {user?.name || 'Nome do Usuário'}
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#64748b', 
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 500
        }}
      >
        {user?.cargo || 'Cargo'} {user?.departamento && ` • ${user.departamento}`}
      </Typography>

      {/* Status Badge */}
      {user?.profile && (
        <Box
          sx={{
            mt: 2,
            px: 2,
            py: 0.5,
            backgroundColor: user.profile === 'admin' ? '#dcfce7' : '#e0f2fe',
            color: user.profile === 'admin' ? '#166534' : '#0c4a6e',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
            textTransform: 'capitalize'
          }}
        >
          {user.profile === 'admin' ? 'Administrador' : 'Usuário'}
        </Box>
      )}

      {/* Upload Text Helper */}
      <Typography 
        variant="caption" 
        sx={{ 
          color: '#94a3b8', 
          textAlign: 'center',
          mt: 2,
          fontSize: '11px'
        }}
      >
        Clique no ícone para alterar a foto
      </Typography>
    </CardContent>
  );
};

export default UserMeta;