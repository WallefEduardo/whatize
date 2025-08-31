import React, { useState, useRef, useEffect } from 'react';
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
  X,
  Image as ImageIcon,
  FileImage,
  FileText,
  AudioLines
} from 'lucide-react';

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
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '8px 8px 0 0',
  marginBottom: '8px',
  borderLeft: '3px solid var(--color-accent)',
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
  alignItems: 'flex-end',
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
  
  '&:hover': {
    color: 'var(--color-accent)',
    backgroundColor: 'transparent',
  },
}));

const SendButton = styled(ModernButton)(() => ({
  minWidth: '44px',
  width: '44px', 
  height: '44px',
  borderRadius: '50%',
  padding: 0,
  backgroundColor: 'var(--color-accent)',
  boxShadow: '0 2px 8px rgba(0, 195, 7, 0.3)',
  
  '&:hover': {
    backgroundColor: 'var(--color-green-hover)',
    boxShadow: '0 4px 12px rgba(0, 195, 7, 0.4)',
    transform: 'translateY(-1px)',
  },
  
  '&:disabled': {
    backgroundColor: '#E2E8F0',
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
  reply, 
  setReply, 
  replyData,
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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
    
    if (!message.trim() || disabled) return;
    
    onSendMessage(message.trim());
    setMessage('');
    setReply(false);
    
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

  // Cancel reply
  const handleCancelReply = () => {
    setReply(false);
  };

  return (
    <InputContainer>
      {/* Reply Preview */}
      {reply && replyData && (
        <ReplyContainer>
          <ReplyContent>
            <ReplyTitle>
              Respondendo a {replyData?.contact?.name}
            </ReplyTitle>
            <ReplyMessage>
              {replyData?.message}
            </ReplyMessage>
          </ReplyContent>
          
          <Tooltip title="Cancelar resposta">
            <IconButton 
              size="small" 
              onClick={handleCancelReply}
              sx={{ ml: 1, p: 0.5 }}
            >
              <X size={16} />
            </IconButton>
          </Tooltip>
        </ReplyContainer>
      )}

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
                    p: 0.5,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    color: 'var(--color-accent)',
                    backgroundColor: '#E5F3E5',
                    border: '1px solid var(--color-accent)',
                    '&:hover': { 
                      color: 'white',
                      backgroundColor: 'var(--color-accent)',
                      borderColor: 'var(--color-accent)'
                    }
                  }}
                >
                  <Plus size={18} />
                </IconButton>
              </Tooltip>
            </DropdownTrigger>
            
            <DropdownContent align="start" side="top">
              <DropdownItem 
                onClick={handleFileAttach}
                icon={<ImageIcon size={16} />}
              >
                Foto ou Vídeo
              </DropdownItem>
              <DropdownItem 
                onClick={handleFileAttach}
                icon={<Paperclip size={16} />}
              >
                Documento
              </DropdownItem>
              <DropdownItem 
                icon={<Mic size={16} />}
              >
                Áudio
              </DropdownItem>
              <DropdownItem 
                icon={<FileImage size={16} />}
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
                p: 0.5,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                color: 'var(--color-accent)',
                backgroundColor: '#E5F3E5',
                border: '1px solid var(--color-accent)',
                '&:hover': { 
                  color: 'white',
                  backgroundColor: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)'
                }
              }}
            >
              <ImageIcon size={18} />
            </IconButton>
          </Tooltip>

          {/* GIF Icon */}
          <Tooltip title="Enviar GIF">
            <IconButton
              sx={{
                p: 0.5,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                color: 'var(--color-accent)',
                backgroundColor: '#E5F3E5',
                border: '1px solid var(--color-accent)',
                '&:hover': { 
                  color: 'white',
                  backgroundColor: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)'
                }
              }}
            >
              <FileImage size={18} />
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
          variant={message.trim() ? 'filled' : 'outline'}
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
        >
          <Send size={18} />
        </SendButton>
      </InputRow>
    </InputContainer>
  );
};

export default MessageInput;