import React, { useState, useRef, useEffect, useContext } from 'react';
import { Box, Typography, IconButton, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cn } from '../../../utils/cn';

// Nossos componentes UI
import ModernButton from '../../../components/ui/ModernButton';
import Popover, { PopoverTrigger, PopoverContent } from '../../../components/ui/Popover';
import Dropdown, { DropdownTrigger, DropdownContent, DropdownItem } from '../../../components/ui/Dropdown';
import Tooltip from '../../../components/ui/Tooltip';

// API e utils
import api from '../../../services/api';
import { toast } from '../../../components/ui/ToastProvider';
import toastError from '../../../errors/toastError';

// Hooks
import useAudioRecorder from '../../../hooks/useAudioRecorder';

// Icons
import {
  Send,
  Smile,
  Plus,
  Paperclip,
  Mic,
  X,
  Pause,
  Play,
  Trash2
} from 'lucide-react';

// Heroicons para ícones mais bonitos
import {
  PhotoIcon,
  GifIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// SVGs customizados do projeto
import AdicionarIcon from '../../../assets/iconeswhatize/adicionar.svg';

// Context API do sistema original
import { ReplyMessageContext } from '../../../context/ReplyingMessage/ReplyingMessageContext';
import { ForwardMessageContext } from '../../../context/ForwarMessage/ForwardMessageContext';
import { EditMessageContext } from '../../../context/EditingMessage/EditingMessageContext';
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

const AudioButton = styled(IconButton)(() => ({
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
  onSendAudio, // Callback para envio otimista de áudio
  disabled = false,
  placeholder = "Digite sua mensagem...",
  ticketId // Adicionar ticketId para envio de áudio
}) => {
  const [message, setMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Hook de gravação de áudio com MediaRecorder API
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    resetRecorder,
    formatTime,
  } = useAudioRecorder();

  // Context API - igual ao chat antigo
  const { setReplyingMessage, replyingMessage } = useContext(ReplyMessageContext);

  // Context API para forward - modo de seleção
  const {
    showSelectMessageCheckbox,
    setShowSelectMessageCheckbox,
    selectedMessages,
    setSelectedMessages,
    setForwardMessageModalOpen
  } = useContext(ForwardMessageContext);

  // Context API para edit - igual ao chat antigo
  const { setEditingMessage, editingMessage } = useContext(EditMessageContext);

  // useEffect para preencher o input quando estiver editando
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.body || '');
      // Focar no input
      if (textareaRef.current) {
        const textarea = textareaRef.current.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }
    }
  }, [editingMessage]);

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

  // Send message or edit message
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || disabled) {
      return;
    }

    // Se estamos editando uma mensagem
    if (editingMessage) {
      try {
        // 🎯 FEEDBACK OTIMISTA: Atualizar UI imediatamente
        const optimisticUpdate = { ...editingMessage, body: message.trim() };

        // Limpar estado de edição imediatamente para feedback visual
        setEditingMessage(null);
        setMessage('');

        // Enviar para o servidor em background
        await api.post(`/messages/edit/${editingMessage.id}`, {
          body: message.trim()
        });

        // Sucesso - a atualização via Socket.IO vai sincronizar com o servidor

      } catch (err) {
        // 🎯 ROLLBACK: Se falhar, restaurar estado de edição
        setEditingMessage(editingMessage);
        setMessage(message.trim());
        toastError(err);
      }
    } else {
      // Enviar nova mensagem
      onSendMessage(message.trim());
      setMessage('');
      setReplyingMessage(null); // Limpar reply após enviar
    }

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

  // Funções para modo de seleção de mensagens
  const handleCancelSelection = () => {
    setShowSelectMessageCheckbox(false);
    setSelectedMessages([]);
  };

  const handleForwardSelected = () => {
    setForwardMessageModalOpen(true);
  };

  // ===== FUNÇÕES DE GRAVAÇÃO DE ÁUDIO =====

  // Inicia a gravação de áudio
  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      toast.error(error.message || 'Erro ao iniciar gravação');
    }
  };

  // Pausa/Retoma a gravação
  const handleTogglePauseRecording = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  // Para a gravação e prepara para enviar
  const handleStopRecording = () => {
    stopRecording();
  };

  // Cancela a gravação
  const handleCancelRecording = () => {
    cancelRecording();
  };

  // Envia o áudio gravado
  const handleSendAudio = async () => {
    if (!audioBlob) {
      toast.error('Nenhum áudio gravado');
      return;
    }

    // Se houver callback onSendAudio (chat moderno com envio otimista)
    if (onSendAudio) {
      // Passar blob + duration para envio otimista
      onSendAudio(audioBlob, recordingTime);
      resetRecorder();
      return;
    }

    // Fallback para envio direto (chat antigo)
    if (!ticketId) {
      toast.error('Nenhum ticket selecionado');
      return;
    }

    try {
      // Cria um arquivo do blob
      const filename = `audio-${Date.now()}.webm`;
      const audioFile = new File(
        [audioBlob],
        filename,
        { type: 'audio/webm' }
      );

      // Cria FormData seguindo o padrão do chat antigo
      const formData = new FormData();
      formData.append('medias', audioFile);
      formData.append('body', filename);
      formData.append('fromMe', true);

      // Envia para o backend - mesma rota que o chat antigo usa
      await api.post(`/messages/${ticketId}`, formData);

      // Reseta o recorder
      resetRecorder();

    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      toastError(error);
    }
  };

  // useEffect para enviar áudio automaticamente quando stopRecording() criar o blob
  useEffect(() => {
    if (audioBlob && !isRecording) {
      // Áudio foi gravado e parado, agora envia
      handleSendAudio();
    }
  }, [audioBlob, isRecording]);

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

  // Render edit preview - similar ao reply mas com cor diferente
  const renderEditingMessage = (message) => {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#fff3cd', // Amarelo claro para edição
        borderLeft: '4px solid #ffc107', // Amarelo para edição
        marginBottom: '8px'
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#f57c00' }}>
            Editando mensagem
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
          onClick={() => {
            setEditingMessage(null);
            setMessage('');
          }}
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

      {/* Edit Preview */}
      {editingMessage && renderEditingMessage(editingMessage)}

      {/* Input Row - Modo normal ou modo de seleção */}
      <InputRow>
        {showSelectMessageCheckbox ? (
          // Modo de seleção - Interface estilo WhatsApp
          <>
            {/* Botão X para cancelar seleção */}
            <IconButton
              onClick={handleCancelSelection}
              sx={{
                p: 1,
                color: 'var(--text-secondary)',
                '&:hover': { 
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-secondary)'
                }
              }}
            >
              <X size={20} />
            </IconButton>

            {/* Contador de mensagens selecionadas */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              paddingLeft: '12px'
            }}>
              <Typography variant="body1" sx={{ 
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                {selectedMessages.length} selecionada{selectedMessages.length !== 1 ? 's' : ''}
              </Typography>
            </Box>

            {/* Botão de encaminhar */}
            <IconButton
              onClick={handleForwardSelected}
              disabled={selectedMessages.length === 0}
              sx={{
                p: 1.5,
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                '&:hover': { 
                  backgroundColor: 'var(--color-green-hover)'
                },
                '&.Mui-disabled': {
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-disabled)'
                }
              }}
            >
              <ArrowTopRightOnSquareIcon style={{ width: '20px', height: '20px' }} />
            </IconButton>
          </>
        ) : (
          // Modo normal - Interface de chat normal
          <>
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
                placeholder={placeholder}
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

            {/* Audio or Send Button - WhatsApp Style */}
            {!isRecording && (message.trim() || editingMessage) ? (
              // Mostrar botão de enviar quando há texto ou está editando
              <SendButton
                onClick={handleSubmit}
                disabled={!message.trim() || disabled}
                title={editingMessage ? "Salvar edição" : "Enviar"}
              >
                {editingMessage ? (
                  <CheckIcon style={{
                    width: '18px',
                    height: '18px',
                    color: 'white'
                  }} />
                ) : (
                  <img
                    src={MandarIcon}
                    alt="Enviar"
                    style={{
                      width: '18px',
                      height: '18px',
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                )}
              </SendButton>
            ) : isRecording ? (
              // Interface de gravação com pause/resume
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Botão de cancelar */}
                <Tooltip title="Cancelar gravação">
                  <IconButton
                    onClick={handleCancelRecording}
                    sx={{
                      color: '#ef4444',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                      }
                    }}
                  >
                    <Trash2 size={20} />
                  </IconButton>
                </Tooltip>

                {/* Timer de gravação */}
                <Typography
                  sx={{
                    color: isPaused ? '#f59e0b' : '#ef4444',
                    fontWeight: 600,
                    fontSize: '14px',
                    minWidth: '45px'
                  }}
                >
                  {formatTime(recordingTime)}
                </Typography>

                {/* Botão de pause/resume */}
                <Tooltip title={isPaused ? "Retomar gravação" : "Pausar gravação"}>
                  <IconButton
                    onClick={handleTogglePauseRecording}
                    sx={{
                      color: 'var(--color-accent)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 195, 7, 0.1)'
                      }
                    }}
                  >
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                  </IconButton>
                </Tooltip>

                {/* Botão de enviar áudio */}
                <Tooltip title="Enviar áudio">
                  <AudioButton
                    onClick={handleStopRecording}
                  >
                    <Send size={18} color="white" />
                  </AudioButton>
                </Tooltip>
              </Box>
            ) : (
              // Mostrar botão de áudio quando o campo está vazio
              <Tooltip title="Gravar áudio">
                <AudioButton
                  onClick={handleStartRecording}
                  disabled={disabled}
                >
                  <Mic size={18} color="white" />
                </AudioButton>
              </Tooltip>
            )}
          </>
        )}
      </InputRow>
    </InputContainer>
  );
};

export default MessageInput;