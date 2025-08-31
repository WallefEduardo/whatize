import React from 'react';
import { Box, Typography, IconButton, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

// UI Components
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import ScrollArea from '../../../components/ui/ScrollArea';

// Icons
import { 
  XMarkIcon,
  PhoneIcon,
  VideoCameraIcon,
  BellIcon,
  // PinIcon, // Icon não existe na versão atual
  TrashIcon,
  UserPlusIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const InfoContainer = styled(Box)(({ theme }) => ({
  width: '320px',
  height: 'calc(100vh - 108px)',
  backgroundColor: 'var(--bg-primary)',
  borderLeft: '1px solid var(--border-primary)',
  display: 'flex',
  flexDirection: 'column',
  
  [theme.breakpoints.down('md')]: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.1)',
  },
}));

const InfoHeader = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const ContactSection = styled(Box)(({ theme }) => ({
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  borderBottom: '1px solid var(--border-primary)',
}));

const ActionsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px',
  padding: '20px',
  borderBottom: '1px solid var(--border-primary)',
}));

const ActionButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  padding: '16px 8px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  color: 'var(--text-primary)',
  
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
  },
}));

const InfoSection = styled(Box)(({ theme }) => ({
  padding: '20px',
  borderBottom: '1px solid var(--border-primary)',
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 0',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'background-color 0.2s ease',
  
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
    padding: '12px 8px',
  },
}));

const ConversationInfo = ({ contact, onClose, showInfo }) => {
  if (!contact || !showInfo) {
    return null;
  }

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online agora';
      case 'busy': return 'Ocupado';
      case 'away': return 'Ausente'; 
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'online': return 'online';
      case 'busy': return 'busy';
      case 'away': return 'away';
      case 'offline': return 'offline';
      default: return 'offline';
    }
  };

  return (
    <InfoContainer>
      {/* Header */}
      <InfoHeader>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Informações da conversa
        </Typography>
        <IconButton onClick={onClose} size="small">
          <XMarkIcon style={{ width: '20px', height: '20px' }} />
        </IconButton>
      </InfoHeader>

      <ScrollArea size="full">
        {/* Contact Info */}
        <ContactSection>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar size="xxl">
              <AvatarImage src={contact.avatar} alt={contact.name} />
              <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            
            {/* Status Badge */}
            <Box sx={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              zIndex: 1,
            }}>
              <Badge variant={getStatusVariant(contact.status)} />
            </Box>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {contact.name}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            {getStatusText(contact.status)}
          </Typography>
          
          {contact.email && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {contact.email}
            </Typography>
          )}
        </ContactSection>

        {/* Actions */}
        <ActionsGrid>
          <ActionButton>
            <IconButton 
              sx={{ 
                backgroundColor: 'var(--bg-secondary)',
                '&:hover': { backgroundColor: 'var(--color-accent)', color: 'white' }
              }}
            >
              <PhoneIcon style={{ width: '20px', height: '20px' }} />
            </IconButton>
            <Typography variant="body2">Ligar</Typography>
          </ActionButton>

          <ActionButton>
            <IconButton 
              sx={{ 
                backgroundColor: 'var(--bg-secondary)',
                '&:hover': { backgroundColor: 'var(--color-accent)', color: 'white' }
              }}
            >
              <VideoCameraIcon style={{ width: '20px', height: '20px' }} />
            </IconButton>
            <Typography variant="body2">Vídeo</Typography>
          </ActionButton>

          <ActionButton>
            <IconButton 
              sx={{ 
                backgroundColor: 'var(--bg-secondary)',
                '&:hover': { backgroundColor: 'var(--color-accent)', color: 'white' }
              }}
            >
              <PhotoIcon style={{ width: '20px', height: '20px' }} />
            </IconButton>
            <Typography variant="body2">Mídia</Typography>
          </ActionButton>

          <ActionButton>
            <IconButton 
              sx={{ 
                backgroundColor: 'var(--bg-secondary)',
                '&:hover': { backgroundColor: 'var(--color-accent)', color: 'white' }
              }}
            >
              <UserPlusIcon style={{ width: '20px', height: '20px' }} />
            </IconButton>
            <Typography variant="body2">Adicionar</Typography>
          </ActionButton>
        </ActionsGrid>

        {/* Options */}
        <InfoSection>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Opções da conversa
          </Typography>

          <InfoItem>
            <BellIcon style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">Notificações</Typography>
              <Typography variant="caption" color="textSecondary">
                Ativadas
              </Typography>
            </Box>
          </InfoItem>

          <InfoItem>
            <PhoneIcon style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">Mensagens fixadas</Typography>
              <Typography variant="caption" color="textSecondary">
                3 mensagens
              </Typography>
            </Box>
          </InfoItem>

          <InfoItem>
            <PhotoIcon style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">Mídia compartilhada</Typography>
              <Typography variant="caption" color="textSecondary">
                12 arquivos
              </Typography>
            </Box>
          </InfoItem>
        </InfoSection>

        {/* Danger Zone */}
        <InfoSection>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Ações avançadas
          </Typography>

          <InfoItem sx={{ color: 'var(--color-error)' }}>
            <TrashIcon style={{ width: '20px', height: '20px' }} />
            <Typography variant="body2">Excluir conversa</Typography>
          </InfoItem>
        </InfoSection>
      </ScrollArea>
    </InfoContainer>
  );
};

export default ConversationInfo;