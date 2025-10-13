import React from 'react';
import { Box, Checkbox, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';

// ============= STYLED COMPONENTS =============

const ItemContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected'
})(({ selected }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  cursor: 'pointer',
  borderRadius: '8px',
  marginBottom: '4px',
  backgroundColor: selected ? 'var(--bg-tertiary)' : 'transparent',
  transition: 'all 0.2s ease',

  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
  }
}));

const ContactInfo = styled(Box)(() => ({
  flex: 1,
  marginLeft: '12px',
  overflow: 'hidden',
}));

const ContactName = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: '15px',
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ContactNumber = styled(Typography)(() => ({
  fontSize: '13px',
  color: 'var(--text-secondary)',
  marginTop: '2px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const StyledCheckbox = styled(Checkbox)(() => ({
  padding: '8px',
  color: 'var(--text-secondary)',

  '&.Mui-checked': {
    color: '#00a884', // Verde WhatsApp
  },

  '& .MuiSvgIcon-root': {
    fontSize: '22px',
  }
}));

/**
 * ContactItem - Item da lista de contatos com checkbox
 * Design baseado no WhatsApp oficial
 */
const ContactItem = ({ contact, selected, onToggle }) => {
  return (
    <ItemContainer
      selected={selected}
      onClick={() => onToggle(contact)}
    >
      {/* Checkbox */}
      <StyledCheckbox
        checked={selected}
        onChange={() => onToggle(contact)}
        onClick={(e) => e.stopPropagation()} // Evitar duplo toggle
      />

      {/* Avatar com foto real */}
      <Avatar
        src={contact?.urlPicture}
        alt={contact?.name || contact?.number}
        sx={{
          width: 40,
          height: 40,
          backgroundColor: '#E5F3E5',
          color: 'var(--color-accent)',
          fontWeight: 600,
          fontSize: '16px',
          flexShrink: 0,
        }}
      >
        {!contact?.urlPicture && (contact?.name || contact?.number)?.charAt(0)?.toUpperCase()}
      </Avatar>

      {/* Informações do contato */}
      <ContactInfo>
        <ContactName>{contact.name}</ContactName>
        <ContactNumber>{contact.number}</ContactNumber>
      </ContactInfo>
    </ItemContainer>
  );
};

export default ContactItem;
