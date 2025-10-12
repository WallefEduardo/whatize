import React, { useState, useCallback, memo } from 'react';
import { Box, BottomNavigation, BottomNavigationAction, TextField, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { InsertEmoticon, StickyNote2, Search, Close } from '@mui/icons-material';
import EmojiPicker from '../EmojiPicker';
import StickerPicker from '../StickerPicker';

// ============= STYLED COMPONENTS =============
const Container = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '420px',
  height: '450px',
  backgroundColor: '#1f2c33',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
}));

const PickerHeader = styled(Box)(() => ({
  padding: '16px',
  borderBottom: '1px solid #2a3942',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#1f2c33',
}));

const SearchContainer = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#2a3942',
  borderRadius: '8px',
  padding: '8px 12px',
  gap: '8px',
}));

const SearchInput = styled(TextField)(() => ({
  flex: 1,
  '& .MuiInputBase-root': {
    color: '#e9edef',
    fontSize: '14px',
    padding: 0,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& input::placeholder': {
    color: '#8696a0',
    opacity: 1,
  },
}));

const CloseButton = styled(IconButton)(() => ({
  color: '#8696a0',
  padding: '4px',
  marginLeft: '8px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
}));

const ContentArea = styled(Box)(() => ({
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

const StyledBottomNavigation = styled(BottomNavigation)(() => ({
  backgroundColor: '#1f2c33',
  borderTop: '1px solid #2a3942',
  height: '56px',
  '& .MuiBottomNavigationAction-root': {
    color: '#8696a0',
    minWidth: '80px',
    padding: '6px 12px',
    '&.Mui-selected': {
      color: '#00a884',
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
  '& .MuiBottomNavigationAction-label': {
    fontSize: '12px',
    fontWeight: 500,
    marginTop: '4px',
    '&.Mui-selected': {
      fontSize: '12px',
    },
  },
}));

/**
 * EmojiStickerPicker - Componente unificado com navegação entre Emojis e Stickers
 * Idêntico ao WhatsApp oficial
 */
const EmojiStickerPicker = ({
  onSelectEmoji,
  onSelectSticker,
  onAddSticker,
  onClose,
  defaultTab = 'emojis' // 'emojis' ou 'stickers'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm(''); // Limpar busca ao trocar de aba
  }, []);

  return (
    <Container>
      {/* Header com busca e botão de fechar */}
      <PickerHeader>
        <SearchContainer>
          <Search sx={{ color: '#8696a0', fontSize: '20px' }} />
          <SearchInput
            placeholder={activeTab === 'emojis' ? 'Pesquisar emojis' : 'Pesquisar figurinhas'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
          />
        </SearchContainer>
        <CloseButton onClick={onClose}>
          <Close fontSize="small" />
        </CloseButton>
      </PickerHeader>

      {/* Área de conteúdo (Emoji ou Sticker Picker em modo embedded) */}
      <ContentArea>
        {activeTab === 'emojis' ? (
          <EmojiPicker
            onSelectEmoji={onSelectEmoji}
            onClose={onClose}
            embedded={true}
            externalSearch={searchTerm}
          />
        ) : (
          <StickerPicker
            onSelectSticker={onSelectSticker}
            onAddSticker={onAddSticker}
            onClose={onClose}
            embedded={true}
            externalSearch={searchTerm}
          />
        )}
      </ContentArea>

      {/* Navegação inferior (igual WhatsApp) */}
      <StyledBottomNavigation
        value={activeTab}
        onChange={handleTabChange}
        showLabels
      >
        <BottomNavigationAction
          value="emojis"
          label="Emojis"
          icon={<InsertEmoticon />}
        />
        <BottomNavigationAction
          value="stickers"
          label="Figurinhas"
          icon={<StickyNote2 />}
        />
      </StyledBottomNavigation>
    </Container>
  );
};

export default memo(EmojiStickerPicker);
