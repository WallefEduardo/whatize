import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MessageCircle, Users } from 'lucide-react';
import api from '../../../services/api';
import { getBackendUrl } from '../../../config';
import ViewAllContactsModal from '../../../components/ViewAllContactsModal';

const ContactCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSent'
})(({ isSent }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  backgroundColor: isSent ? 'rgba(0, 195, 7, 0.15)' : 'var(--bg-secondary)',
  borderRadius: '8px',
  border: `1px solid ${isSent ? 'rgba(0, 195, 7, 0.2)' : 'var(--border-primary)'}`,
  minWidth: '280px',
  maxWidth: '280px',
  transition: 'all 0.2s ease',

  '&:hover': {
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
  }
}));

const ContactHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px',
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

const ChatButton = styled(Button)(() => ({
  width: '100%',
  padding: '10px 16px',
  backgroundColor: 'var(--color-accent)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all 0.2s ease',

  '&:hover': {
    backgroundColor: 'var(--color-accent-hover, #06cf9c)',
    transform: 'scale(1.02)',
  }
}));

/**
 * Parseia string vCard para extrair nome e número
 * Suporta múltiplos vCards separados por BEGIN:VCARD
 */
const parseVCard = (vCardString) => {
  if (!vCardString) return null;

  // Verificar se tem múltiplos vCards
  const vCardBlocks = vCardString.split('BEGIN:VCARD').filter(block => block.trim());

  if (vCardBlocks.length === 0) return null;

  // Se tem múltiplos vCards, retornar array
  if (vCardBlocks.length > 1) {
    return vCardBlocks.map(block => {
      const lines = ('BEGIN:VCARD' + block).split('\n');
      let name = '';
      let number = '';

      for (const line of lines) {
        if (line.startsWith('FN:')) {
          name = line.substring(3).trim();
        } else if (line.startsWith('TEL')) {
          const telMatch = line.match(/:([\d+]+)/);
          if (telMatch) {
            number = telMatch[1];
          }
        }
      }

      return { name, number };
    });
  }

  // Um único vCard
  const lines = vCardString.split('\n');
  let name = '';
  let number = '';

  for (const line of lines) {
    if (line.startsWith('FN:')) {
      name = line.substring(3).trim();
    } else if (line.startsWith('TEL')) {
      const telMatch = line.match(/:([\d+]+)/);
      if (telMatch) {
        number = telMatch[1];
      }
    }
  }

  return { name, number };
};

/**
 * ContactMessage - Renderiza mensagem de contato estilo WhatsApp
 */
const ContactMessage = ({ message, isSent = false, onStartChat }) => {
  const backendUrl = getBackendUrl();
  const [contactPhoto, setContactPhoto] = useState(null);
  const [fullContact, setFullContact] = useState(null);
  const [fullContacts, setFullContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllContactsModal, setShowAllContactsModal] = useState(false);

  // 🔄 Verificar se tem grupo de contatos (múltiplas mensagens agrupadas)
  const hasContactGroup = message.contactGroup && Array.isArray(message.contactGroup);

  let contactData = null;
  let isMultipleContacts = false;

  if (hasContactGroup) {
    // Grupo de contatos - extrair dados de cada mensagem
    isMultipleContacts = true;
    contactData = message.contactGroup.map(msg => {
      const vCard = msg.vcard || msg.vCard;

      if (vCard && typeof vCard === 'object') {
        return {
          name: vCard.name || vCard.FN || '',
          number: vCard.number || vCard.tel || vCard.TEL || ''
        };
      }

      if (msg.body && msg.body.includes('BEGIN:VCARD')) {
        const parsed = parseVCard(msg.body);
        // Se parseVCard retornou array, pegar primeiro item
        return Array.isArray(parsed) ? parsed[0] : parsed;
      }

      return null;
    }).filter(c => c && (c.name || c.number));

  } else {
    // Mensagem única - lógica original
    const vCard = message.vcard || message.vCard;

    if (vCard && typeof vCard === 'object') {
      contactData = {
        name: vCard.name || vCard.FN || '',
        number: vCard.number || vCard.tel || vCard.TEL || ''
      };
    } else if (message.body && message.body.includes('BEGIN:VCARD')) {
      contactData = parseVCard(message.body);

      if (Array.isArray(contactData)) {
        isMultipleContacts = true;
      }
    }
  }

  // Se não conseguiu extrair dados, não renderizar
  if (!contactData || (Array.isArray(contactData) && contactData.length === 0)) {
    return null;
  }

  // Se é array mas tem apenas 1, tratar como único
  if (Array.isArray(contactData) && contactData.length === 1) {
    contactData = contactData[0];
    isMultipleContacts = false;
  }

  // Buscar foto e dados completos do contato no backend
  useEffect(() => {
    const fetchContactData = async () => {
      // Múltiplos contatos
      if (isMultipleContacts && Array.isArray(contactData)) {
        try {
          const fetchedContacts = [];

          for (const contact of contactData) {
            if (!contact.number) continue;

            const cleanNumber = contact.number.replace(/[+\s-]/g, '');

            try {
              const { data } = await api.get('/contacts', {
                params: {
                  searchParam: cleanNumber,
                  pageNumber: 1,
                }
              });

              const matchedContact = data.contacts?.find(c =>
                c.number?.replace(/[+\s-]/g, '').includes(cleanNumber) ||
                cleanNumber.includes(c.number?.replace(/[+\s-]/g, ''))
              );

              if (matchedContact) {
                fetchedContacts.push(matchedContact);
              } else {
                // Se não encontrou no banco, usar dados do vCard
                fetchedContacts.push(contact);
              }
            } catch (err) {
              console.error('Erro ao buscar contato:', err);
              fetchedContacts.push(contact);
            }
          }

          setFullContacts(fetchedContacts);
        } catch (error) {
          console.error('Erro ao buscar dados dos contatos:', error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Contato único
      if (!contactData.number) {
        setLoading(false);
        return;
      }

      try {
        const cleanNumber = contactData.number.replace(/[+\s-]/g, '');

        const { data } = await api.get('/contacts', {
          params: {
            searchParam: cleanNumber,
            pageNumber: 1,
          }
        });

        const matchedContact = data.contacts?.find(c =>
          c.number?.replace(/[+\s-]/g, '').includes(cleanNumber) ||
          cleanNumber.includes(c.number?.replace(/[+\s-]/g, ''))
        );

        if (matchedContact) {
          setFullContact(matchedContact);
          if (matchedContact.urlPicture) {
            setContactPhoto(matchedContact.urlPicture);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do contato:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactData();
  }, [isMultipleContacts, JSON.stringify(contactData)]);

  const handleChatClick = () => {
    // Múltiplos contatos - abrir modal de visualização
    if (isMultipleContacts) {
      setShowAllContactsModal(true);
      return;
    }

    // Contato único - abrir NewConversationModal diretamente
    if (fullContact && onStartChat) {
      onStartChat(fullContact);
    }
  };

  // Se múltiplos contatos, mostrar primeiro contato e contador
  const displayContact = isMultipleContacts ? contactData[0] : contactData;
  const displayPhoto = isMultipleContacts ? fullContacts[0]?.urlPicture : contactPhoto;

  return (
    <>
      <ContactCard isSent={isSent}>
        <ContactHeader>
          {/* Avatar com foto real do contato */}
          <Avatar
            src={displayPhoto}
            alt={displayContact.name || displayContact.number}
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
            {!displayPhoto && (displayContact.name || displayContact.number)?.charAt(0)?.toUpperCase()}
          </Avatar>

          <ContactInfo>
            <ContactName>
              {isMultipleContacts
                ? `${contactData.length} Contatos`
                : (displayContact.name || displayContact.number)
              }
            </ContactName>
            {!isMultipleContacts && displayContact.name && displayContact.number && (
              <ContactNumber>{displayContact.number}</ContactNumber>
            )}
          </ContactInfo>
        </ContactHeader>

        {/* Botão Conversar ou Ver Todos */}
        <ChatButton onClick={handleChatClick}>
          {isMultipleContacts ? (
            <>
              <Users size={18} />
              Ver todos ({contactData.length})
            </>
          ) : (
            <>
              <MessageCircle size={18} />
              Conversar
            </>
          )}
        </ChatButton>
      </ContactCard>

      {/* Modal para visualizar todos os contatos */}
      {isMultipleContacts && (
        <ViewAllContactsModal
          isOpen={showAllContactsModal}
          onClose={() => setShowAllContactsModal(false)}
          contacts={fullContacts}
          onStartChat={onStartChat}
        />
      )}
    </>
  );
};

export default ContactMessage;
