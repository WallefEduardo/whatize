import React, { useState } from 'react';
import { Box, IconButton, Grid, Popover } from '@mui/material';
import { styled } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/Add';

import { i18n } from '../../../translate/i18n';

// Styled components adaptados para o design system do chat moderno
const PopoverContainer = styled(Box)(() => ({
  maxHeight: '300px',
  overflow: 'hidden',
  borderRadius: '20px',
}));

const MoreReactionsContainer = styled(Box)(() => ({
  maxHeight: '300px',
  overflowY: 'auto',
  borderRadius: '6px',

  // Custom scrollbar styling
  '&::-webkit-scrollbar': {
    width: '0.4em',
    height: '0.4em',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0,0,0,.1)',
    borderRadius: '50px',
  },
  '&::-webkit-scrollbar-track': {
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
    webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
  },
}));

const ReactionButton = styled(IconButton)(() => ({
  padding: '8px',
  borderRadius: '50%',
  fontSize: '22px', // Aumentado um pouco
  transition: 'all 0.2s ease',
  opacity: 1, // Garantir opacidade total
  color: 'inherit', // Manter cor original do emoji

  '& .MuiTouchRipple-root': {
    opacity: 0.3, // Apenas o efeito ripple com transparência
  },

  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)', // Hover sutil
    transform: 'scale(1.1)', // Menos zoom para não distorcer
    opacity: 1, // Manter opacidade total no hover
  },
}));

const ExpandButton = styled(IconButton)(() => ({
  padding: '8px',
  borderRadius: '50%',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',

  '&:hover': {
    backgroundColor: 'var(--hover-bg-light)',
    color: 'var(--text-primary)',
  },
}));

const MessageReactionsPopover = ({
  anchorEl,
  open,
  onClose,
  onReact,
  placement = 'bottom-end',
  disabled = false
}) => {
  const [moreReactionsAnchorEl, setMoreReactionsAnchorEl] = useState(null);

  // Garantir que o popover só abre com anchorEl válido
  if (open && !anchorEl) {
    console.warn('MessageReactionsPopover: tentando abrir sem anchorEl válido');
    return null;
  }

  // Array completo de emojis - mesmo do chat antigo
  const availableReactions = [
    '😀', '😂', '❤️', '👍', '🎉', '😢', '😮', '😡', '👏', '🔥',
    '🥳', '😎', '🤩', '😜', '🤔', '🙄', '😴', '😇', '🤯', '💩',
    '🤗', '🤫', '🤭', '🤓', '🤪', '🤥', '🤡', '🤠', '🤢', '🤧',
    '😷', '🤕', '🤒', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃',
    '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈',
    '🙉', '🙊', '🐵', '🐒', '🦍', '🐶', '🐕', '🐩', '🐺', '🦊',
    '🦝', '🐱', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄'
  ];

  const handleReactionClick = (reaction) => {
    if (disabled) return; // Previne clique se estiver processando
    onReact(reaction);
    onClose();
    setMoreReactionsAnchorEl(null);
  };

  const handleMoreReactionsOpen = (event) => {
    setMoreReactionsAnchorEl(event.currentTarget);
    onClose(); // Fecha o primeiro popover
  };

  const handleMoreReactionsClose = () => {
    setMoreReactionsAnchorEl(null);
  };

  return (
    <>
      {/* Popover principal com 6 reações mais comuns */}
      <Popover
        open={open && !!anchorEl}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPopover-paper': {
            marginTop: '-8px', // Pequeno offset para ficar mais próximo
            borderRadius: '20px',
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
          }
        }}
        PaperProps={{
          style: {
            width: 'auto',
            maxWidth: '380px',
            borderRadius: '20px',
            padding: '8px',
            boxShadow: 'var(--shadow-lg)',
            backgroundColor: '#ffffff', // Branco sólido para garantir contraste
            border: '1px solid rgba(0, 0, 0, 0.08)',
            zIndex: 9999,
            opacity: 1, // Garantir que o container não tenha transparência
          }
        }}
      >
        <PopoverContainer>
          <Grid container spacing={1} sx={{ justifyContent: 'center' }}>
            {availableReactions.slice(0, 6).map(reaction => (
              <Grid key={reaction}>
                <ReactionButton
                  onClick={() => handleReactionClick(reaction)}
                  size="small"
                  disabled={disabled}
                  style={{ opacity: disabled ? 0.5 : 1 }}
                  style={{
                    opacity: 1,
                    filter: 'none', // Remove qualquer filtro que possa estar aplicado
                    WebkitFontSmoothing: 'antialiased', // Melhora a renderização do emoji
                  }}
                >
                  <span style={{
                    opacity: 1,
                    display: 'inline-block',
                    fontSize: '22px',
                  }}>
                    {reaction}
                  </span>
                </ReactionButton>
              </Grid>
            ))}
            <Grid item>
              <ExpandButton
                onClick={handleMoreReactionsOpen}
                size="small"
              >
                <AddCircleOutlineIcon fontSize="small" />
              </ExpandButton>
            </Grid>
          </Grid>
        </PopoverContainer>
      </Popover>

      {/* Popover expandido com todas as reações */}
      <Popover
        open={Boolean(moreReactionsAnchorEl)}
        anchorEl={moreReactionsAnchorEl}
        onClose={handleMoreReactionsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          style: {
            width: 'auto',
            maxWidth: '400px',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: 'var(--shadow-lg)',
            backgroundColor: '#ffffff', // Branco sólido
            border: '1px solid rgba(0, 0, 0, 0.08)',
            zIndex: 10000,
            opacity: 1, // Garantir opacidade total
          }
        }}
      >
        <MoreReactionsContainer>
          <Grid container spacing={1} sx={{ justifyContent: 'center' }}>
            {availableReactions.map(reaction => (
              <Grid key={reaction}>
                <ReactionButton
                  onClick={() => handleReactionClick(reaction)}
                  size="small"
                  disabled={disabled}
                  style={{ opacity: disabled ? 0.5 : 1 }}
                  style={{
                    opacity: 1,
                    filter: 'none', // Remove qualquer filtro que possa estar aplicado
                    WebkitFontSmoothing: 'antialiased', // Melhora a renderização do emoji
                  }}
                >
                  <span style={{
                    opacity: 1,
                    display: 'inline-block',
                    fontSize: '22px',
                  }}>
                    {reaction}
                  </span>
                </ReactionButton>
              </Grid>
            ))}
          </Grid>
        </MoreReactionsContainer>
      </Popover>
    </>
  );
};

export default MessageReactionsPopover;