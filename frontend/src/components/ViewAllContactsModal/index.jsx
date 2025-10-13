import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { X, MessageCircle } from 'lucide-react';

// Modal Overlay
const ModalOverlay = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ isOpen }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: isOpen ? 1 : 0,
  visibility: isOpen ? 'visible' : 'hidden',
  transition: 'all 0.3s ease',
}));

// Modal Container
const ModalContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ isOpen }) => ({
  width: '90%',
  maxWidth: '500px',
  maxHeight: '80vh',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transform: isOpen ? 'scale(1)' : 'scale(0.9)',
  transition: 'transform 0.3s ease',
}));

// Header
const ModalHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px',
  borderBottom: '1px solid var(--border-primary)',
  backgroundColor: 'var(--bg-primary)',
}));

// Content
const ModalContent = styled(Box)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: '16px 0',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'var(--bg-secondary)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'var(--border-primary)',
    borderRadius: '3px',
  },
}));

// Contact Item
const ContactItem = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 24px',
  borderBottom: '1px solid var(--border-primary)',
  transition: 'background-color 0.2s ease',

  '&:last-child': {
    borderBottom: 'none',
  },

  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
  }
}));

const ContactInfo = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

const ContactName = styled(Typography)(() => ({
  fontSize: '16px',
  fontWeight: 500,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginBottom: '2px',
}));

const ContactNumber = styled(Typography)(() => ({
  fontSize: '14px',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ChatButton = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-accent)',
  color: '#ffffff',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  flexShrink: 0,

  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: '0 2px 8px rgba(0, 195, 7, 0.3)',
  }
}));

/**
 * ViewAllContactsModal - Modal para visualizar múltiplos contatos
 */
const ViewAllContactsModal = ({ isOpen, onClose, contacts = [], onStartChat }) => {
  const handleContactClick = (contact) => {
    if (onStartChat) {
      onStartChat(contact);
      onClose(); // Fechar este modal após abrir o NewConversationModal
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContainer
        isOpen={isOpen}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <ModalHeader>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {contacts.length} {contacts.length === 1 ? 'Contato' : 'Contatos'}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': {
                backgroundColor: 'var(--bg-secondary)',
              }
            }}
          >
            <X size={20} />
          </IconButton>
        </ModalHeader>

        {/* Content */}
        <ModalContent>
          {contacts.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Nenhum contato disponível
            </Box>
          ) : (
            contacts.map((contact, index) => (
              <ContactItem key={index}>
                {/* Avatar */}
                <Avatar
                  src={contact.urlPicture}
                  alt={contact.name || contact.number}
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  {!contact.urlPicture && (contact.name || contact.number)?.charAt(0)?.toUpperCase()}
                </Avatar>

                {/* Info */}
                <ContactInfo>
                  <ContactName>
                    {contact.name || contact.number}
                  </ContactName>
                  {contact.name && contact.number && (
                    <ContactNumber>{contact.number}</ContactNumber>
                  )}
                </ContactInfo>

                {/* Botão Conversar */}
                <ChatButton onClick={() => handleContactClick(contact)}>
                  <MessageCircle size={20} />
                </ChatButton>
              </ContactItem>
            ))
          )}
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ViewAllContactsModal;
