import React, { useState } from 'react';
import { Box, IconButton, Avatar, Typography } from '@mui/material';
import { Camera, Upload } from 'lucide-react';
import { Input } from '../ui/Input';

const CoverBanner = ({ user, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for cover
      alert('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setCoverUploading(true);
    
    try {
      // Simular upload - substitua pela lógica real
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (onUpdate) {
            onUpdate({...user, coverImage: e.target.result});
          }
          setCoverUploading(false);
        };
        reader.readAsDataURL(file);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao fazer upload da capa:', error);
      setCoverUploading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    setUploading(true);
    
    try {
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
    <Box sx={{ 
      position: 'relative', 
      width: '100%',
      marginBottom: '40px' // Reduced margin since avatar is higher now
    }}>
      {/* Cover Banner */}
      <Box sx={{ 
        width: '100%', 
        height: '250px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        backgroundImage: user?.coverImage 
          ? `url(${user.coverImage})` 
          : `url('/src/assets/capa-1200x250.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}>
        {/* Cover Upload Button */}
        <IconButton
          component="label"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            },
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
          disabled={coverUploading}
        >
          {coverUploading ? (
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
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
            <Camera size={20} />
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            style={{ display: 'none' }}
          />
        </IconButton>

        {/* Upload Text Helper - Moved to right side */}
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          px: 2,
          py: 1,
          borderRadius: '6px',
          backdropFilter: 'blur(10px)'
        }}>
          <Typography variant="caption" sx={{ fontSize: '11px' }}>
            Clique no ícone para alterar a capa
          </Typography>
        </Box>
      </Box>

      {/* Floating Avatar - Positioned absolutely relative to container, not cover */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: '30px', // Higher position to create more space below
        left: '32px',
        zIndex: 20, // Very high z-index to float above everything
        transform: 'none' // Remove transform to position exactly where we want
      }}>
        <Box 
          className="avatar-container"
          sx={{ 
            position: 'relative',
            '&:hover .avatar-upload': {
              opacity: 1,
            }
          }}
        >
          <Avatar
            src={user?.profileImage}
            sx={{
              width: 120,
              height: 120,
              fontSize: '42px',
              fontWeight: 600,
              backgroundColor: 'primary.main', // Using theme primary color
              color: 'primary.contrastText', // White text for dark primary
              border: '6px solid #ffffff',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)' // Strong shadow for floating effect
            }}
          >
            {getInitials(user?.name)}
          </Avatar>
          
          {/* Avatar Upload Button - Positioned over the avatar */}
          <IconButton
            component="label"
            className="avatar-upload"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              width: 40,
              height: 40,
              opacity: 0,
              transition: 'opacity 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                opacity: 1,
              },
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(6px)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
            disabled={uploading}
          >
            {uploading ? (
              <Box 
                sx={{ 
                  width: 20,
                  height: 20, 
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
              <Camera size={20} />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default CoverBanner;