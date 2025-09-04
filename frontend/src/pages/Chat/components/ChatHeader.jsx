import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';

// Nossos componentes UI
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import Tooltip from '../../../components/ui/Tooltip';

// Icons
import { 
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  Bars3Icon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
  minHeight: '72px',
}));

const ContactInfo = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
  minWidth: 0,
}));

const ContactDetails = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  gap: '2px',
}));

const ContactName = styled(Typography)(() => ({
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ContactStatus = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isOnline',
})(({ isOnline }) => ({
  fontSize: '13px',
  color: isOnline ? 'var(--color-accent)' : 'var(--text-secondary)',
  fontWeight: isOnline ? 500 : 400,
}));

const ActionButtons = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  
  '& .MuiIconButton-root': {
    padding: '8px',
    borderRadius: '50%',
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
    
    '&:hover': {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--color-accent)',
    },
  },
}));

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  display: 'none',
  marginRight: '8px',
  
  [theme.breakpoints.down('md')]: {
    display: 'flex',
  },
}));

const ChatHeader = ({ 
  contact, 
  showInfo, 
  handleShowInfo, 
  profile,
  mobileMenuHandler,
  onSearch 
}) => {
  if (!contact) {
    return (
      <HeaderContainer>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MobileMenuButton onClick={mobileMenuHandler}>
            <Bars3Icon style={{ width: '20px', height: '20px' }} />
          </MobileMenuButton>
          <Typography variant="h6" color="textSecondary">
            Selecione uma conversa
          </Typography>
        </Box>
      </HeaderContainer>
    );
  }

  const { name, avatar, status, lastSeen } = contact;
  
  // Status display logic
  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online agora';
      case 'busy': return 'Ocupado';
      case 'away': return 'Ausente';
      case 'offline': return 'Visto por último às ' + new Date(lastSeen).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      default: return 'Offline';
    }
  };
  
  // Status indicator variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'online': return 'online';
      case 'busy': return 'busy';
      case 'away': return 'away';
      case 'offline': return 'offline';
      default: return 'offline';
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';
  };

  return (
    <HeaderContainer>
      {/* Contact Info */}
      <ContactInfo>
        <MobileMenuButton onClick={mobileMenuHandler}>
          <Bars3Icon style={{ width: '20px', height: '20px' }} />
        </MobileMenuButton>
        
        {/* Avatar with Status */}
        <Box sx={{ position: 'relative' }}>
          <Avatar size="lg">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          
          {/* Status Badge */}
          <Box sx={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            zIndex: 1,
          }}>
            <Badge variant={getStatusVariant(status)} />
          </Box>
        </Box>

        {/* Contact Details */}
        <ContactDetails>
          <ContactName variant="h6">
            {name}
          </ContactName>
          <ContactStatus isOnline={status === 'online'}>
            {getStatusText(status)}
          </ContactStatus>
        </ContactDetails>
      </ContactInfo>

      {/* Action Buttons */}
      <ActionButtons>
        {/* Search Button */}
        <Tooltip title="Buscar mensagens">
          <IconButton onClick={onSearch}>
            <MagnifyingGlassIcon style={{ width: '20px', height: '20px' }} />
          </IconButton>
        </Tooltip>

        {/* Voice Call Button */}
        <Tooltip title="Iniciar chamada de voz">
          <IconButton>
            <PhoneIcon style={{ width: '20px', height: '20px' }} />
          </IconButton>
        </Tooltip>

        {/* Video Call Button */}
        <Tooltip title="Iniciar videochamada">
          <IconButton>
            <VideoCameraIcon style={{ width: '20px', height: '20px' }} />
          </IconButton>
        </Tooltip>

        {/* Info Button */}
        <Tooltip title="Informações da conversa">
          <IconButton 
            onClick={handleShowInfo}
            sx={{
              color: showInfo ? 'var(--color-accent)' : 'inherit',
            }}
          >
            <InformationCircleIcon 
              style={{ 
                width: '20px', 
                height: '20px',
                fill: showInfo ? 'var(--color-accent)' : 'none',
              }} 
            />
          </IconButton>
        </Tooltip>
      </ActionButtons>
    </HeaderContainer>
  );
};

export default ChatHeader;