import React, { useState, useRef, useEffect, useContext } from 'react';
import { Box, Typography, IconButton, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';

// Nossos componentes UI
import ModernButton from '../../../components/ui/ModernButton';
import Popover, { PopoverTrigger, PopoverContent } from '../../../components/ui/Popover';
import Dropdown, { DropdownTrigger, DropdownContent, DropdownItem } from '../../../components/ui/Dropdown';
import Tooltip from '../../../components/ui/Tooltip';

// Icons
import { 
  Send,
  Smile,
  Plus,
  Paperclip,
  Mic,
  X
} from 'lucide-react';

// Heroicons para ícones mais bonitos
import {
  PhotoIcon,
  GifIcon
} from '@heroicons/react/24/outline';

// SVGs customizados do projeto
import AdicionarIcon from '../../../assets/iconeswhatize/adicionar.svg';

// Context API do sistema original
import { ReplyMessageContext } from '../../../context/ReplyingMessage/ReplyingMessageContext';
import NovoArquivoIcon from '../../../assets/iconeswhatize/novo-arquivo.svg';
import GaleriaImagensIcon from '../../../assets/iconeswhatize/galeria-de-imagens.svg';
import MandarIcon from '../../../assets/iconeswhatize/mandar.svg';

const InputContainer = styled(Box)(({ theme }) => ({
  padding: '12px 16px',
  backgroundColor: 'white',
  borderRadius: '0 0 12px 12px',
}));

const ReplyContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: '#e1f5e1', // Verde claro como WhatsApp
  borderRadius: '8px 8px 0 0',
  marginBottom: '8px',
  borderLeft: '4px solid #25d366', // Verde WhatsApp
  cursor: 'pointer', // Cursor de ponteiro para indicar clicabilidade
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: '#d4f1d4', // Escurece um pouco no hover
  },
}));

const ReplyContent = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

const ReplyTitle = styled(Typography)(() => ({
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '2px',
}));

const ReplyMessage = styled(Typography)(() => ({
  fontSize: '13px',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const InputRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
}));

const ActionsContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}));

const MessageTextArea = styled(TextField)(({ theme }) => ({
  flex: 1,
  width: '100%',
  alignSelf: 'center',
  
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#F8F9FA',
    border: '1px solid #E2E8F0',
    height: '40px',
    minHeight: '40px',
    maxHeight: '40px',
    paddingLeft: '16px',
    paddingRight: '50px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    
    '& .MuiInputBase-inputMultiline': {
      overflow: 'hidden',
      resize: 'none',
    },
    
    '& fieldset': {
      border: 'none',
    },
    
    '&:hover': {
      backgroundColor: '#F1F3F4',
      borderColor: '#D1D5DB',
    },
    
    '&.Mui-focused': {
      backgroundColor: 'white',
      borderColor: 'var(--color-accent)',
      boxShadow: '0 0 0 3px rgba(0, 195, 7, 0.1)',
      
      '& fieldset': {
        border: 'none',
      },
    },
    
    '& textarea': {
      color: 'var(--text-primary)',
      padding: '10px 0',
      lineHeight: 1.5,
      resize: 'none',
      
      '&::placeholder': {
        color: 'var(--text-secondary)',
        opacity: 1,
      },
    },
  },
}));

const EmojiButton = styled(IconButton)(() => ({
  position: 'absolute',
  right: '8px',
  top: '50%',
  transform: 'translateY(-50%)',
  padding: '6px',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  
  '&:hover': {
    color: 'var(--color-accent)',
    backgroundColor: 'transparent',
  },
}));

const SendButton = styled(IconButton)(() => ({
  minWidth: '44px',
  width: '44px', 
  height: '44px',
  borderRadius: '50%',
  padding: 0,
  backgroundColor: 'var(--color-accent) !important',
  boxShadow: '0 2px 8px rgba(0, 195, 7, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  
  '&:hover': {
    backgroundColor: 'var(--color-green-hover) !important',
    boxShadow: '0 4px 12px rgba(0, 195, 7, 0.4)',
    transform: 'translateY(-1px)',
  },
  
  '&:disabled': {
    backgroundColor: '#E2E8F0 !important',
    color: '#94A3B8',
    boxShadow: 'none',
    transform: 'none',
  },
}));

// Mock emoji data - In real app, you'd use a proper emoji library
const mockEmojis = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
  '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
  '👍', '👎', '👌', '🤝', '👏', '🙌', '👋', '🤙', '💪', '🦾',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
];

const MessageInput = ({ 
  onSendMessage, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Context API - igual ao chat antigo
  const { setReplyingMessage, replyingMessage } = useContext(ReplyMessageContext);

  // Auto-resize textarea
  const handleTextChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Auto-resize logic
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Send message
  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('🚀 MessageInput handleSubmit:', { message: message.trim(), disabled });
    
    if (!message.trim() || disabled) {
      console.log('❌ Envio bloqueado - mensagem vazia ou desabilitado');
      return;
    }
    
    console.log('✅ Enviando mensagem:', message.trim());
    onSendMessage(message.trim());
    setMessage('');
    setReplyingMessage(null); // Limpar reply após enviar
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current?.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = message;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setMessage(newText);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        textarea.focus();
      }, 0);
    }
    setIsEmojiOpen(false);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle file attachment
  const handleFileAttach = () => {
    fileInputRef.current?.click();
    setIsAttachOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd handle file upload here
      console.log('File selected:', file.name);
    }
  };


  // Render reply preview igual ao chat antigo
  const renderReplyingMessage = (message) => {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#e1f5e1',
        borderLeft: '4px solid #25d366',
        marginBottom: '8px'
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#25d366' }}>
            Respondendo a {message.fromMe ? 'você' : (message.contact?.name || 'Contato')}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px'
          }}>
            {message.body || 'Mensagem'}
          </Typography>
        </Box>
        <IconButton 
          size="small" 
          onClick={() => setReplyingMessage(null)}
          sx={{ 
            ml: 1,
            color: 'var(--text-secondary)'
          }}
        >
          <X size={16} />
        </IconButton>
      </Box>
    );
  };

  return (
    <InputContainer>
      {/* Reply Preview */}
      {replyingMessage && renderReplyingMessage(replyingMessage)}

      {/* Input Row */}
      <InputRow>
        {/* Actions */}
        <ActionsContainer>
          {/* Attachment Dropdown */}
          <Dropdown open={isAttachOpen} onOpenChange={setIsAttachOpen}>
            <DropdownTrigger asChild>
              <Tooltip title="Anexar arquivo">
                <IconButton
                  sx={{
                    p: 1,
                    color: 'var(--color-accent)',
                    '&:hover': { 
                      color: 'var(--color-green-hover)',
                      backgroundColor: 'rgba(0, 195, 7, 0.1)'
                    }
                  }}
                >
                  <img 
                    src={AdicionarIcon} 
                    alt="Adicionar" 
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      filter: 'brightness(0) saturate(100%) invert(49%) sepia(91%) saturate(3524%) hue-rotate(88deg) brightness(98%) contrast(101%)'
                    }} 
                  />
                </IconButton>
              </Tooltip>
            </DropdownTrigger>
            
            <DropdownContent align="start" side="top">
              <DropdownItem 
                onClick={handleFileAttach}
                icon={<img 
                  src={GaleriaImagensIcon} 
                  alt="Foto" 
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    filter: 'brightness(0) saturate(100%) invert(49%) sepia(91%) saturate(3524%) hue-rotate(88deg) brightness(98%) contrast(101%)'
                  }} 
                />}
              >
                Foto ou Vídeo
              </DropdownItem>
              <DropdownItem 
                onClick={handleFileAttach}
                icon={<img 
                  src={NovoArquivoIcon} 
                  alt="Documento" 
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    filter: 'brightness(0) saturate(100%) invert(49%) sepia(91%) saturate(3524%) hue-rotate(88deg) brightness(98%) contrast(101%)'
                  }} 
                />}
              >
                Documento
              </DropdownItem>
              <DropdownItem 
                icon={<Mic size={16} />}
              >
                Áudio
              </DropdownItem>
              <DropdownItem 
                icon={<GifIcon style={{ width: '16px', height: '16px' }} />}
              >
                GIF
              </DropdownItem>
            </DropdownContent>
          </Dropdown>

          {/* Photo/Gallery Icon */}
          <Tooltip title="Enviar foto">
            <IconButton
              onClick={handleFileAttach}
              sx={{
                p: 1,
                color: 'var(--color-accent)',
                '&:hover': { 
                  color: 'var(--color-green-hover)',
                  backgroundColor: 'rgba(0, 195, 7, 0.1)'
                }
              }}
            >
              <img 
                src={GaleriaImagensIcon} 
                alt="Galeria" 
                style={{ 
                  width: '20px', 
                  height: '20px',
                  filter: 'brightness(0) saturate(100%) invert(49%) sepia(91%) saturate(3524%) hue-rotate(88deg) brightness(98%) contrast(101%)'
                }} 
              />
            </IconButton>
          </Tooltip>

          {/* Document Icon */}
          <Tooltip title="Enviar documento">
            <IconButton
              onClick={handleFileAttach}
              sx={{
                p: 1,
                color: 'var(--color-accent)',
                '&:hover': { 
                  color: 'var(--color-green-hover)',
                  backgroundColor: 'rgba(0, 195, 7, 0.1)'
                }
              }}
            >
              <img 
                src={NovoArquivoIcon} 
                alt="Documento" 
                style={{ 
                  width: '20px', 
                  height: '20px',
                  filter: 'brightness(0) saturate(100%) invert(49%) sepia(91%) saturate(3524%) hue-rotate(88deg) brightness(98%) contrast(101%)'
                }} 
              />
            </IconButton>
          </Tooltip>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
        </ActionsContainer>

        {/* Message Input */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <MessageTextArea
            ref={textareaRef}
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                  <PopoverTrigger asChild>
                    <EmojiButton>
                      <Smile size={20} />
                    </EmojiButton>
                  </PopoverTrigger>
                  
                  <PopoverContent 
                    align="end" 
                    side="top"
                    size="auto"
                  >
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(10, 1fr)',
                      gap: '4px',
                      p: 1,
                      maxWidth: '280px'
                    }}>
                      {mockEmojis.map((emoji, index) => (
                        <Box
                          key={index}
                          onClick={() => handleEmojiSelect(emoji)}
                          sx={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            fontSize: '16px',
                            '&:hover': {
                              backgroundColor: 'var(--bg-secondary)',
                            },
                          }}
                        >
                          {emoji}
                        </Box>
                      ))}
                    </Box>
                  </PopoverContent>
                </Popover>
              )
            }}
          />
        </Box>

        {/* Send Button */}
        <SendButton
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
        >
          <img 
            src={MandarIcon} 
            alt="Enviar" 
            style={{ 
              width: '18px', 
              height: '18px',
              filter: 'brightness(0) invert(1)'
            }} 
          />
        </SendButton>
      </InputRow>
    </InputContainer>
  );
};

export default MessageInput;