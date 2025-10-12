import React, { useState } from 'react';
import { Box, IconButton, CircularProgress, Tooltip, Dialog } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Plus, Check, Download, X, ZoomIn } from 'lucide-react';
import api from '../../../services/api';
import { toast } from '../../../components/ui/ToastProvider';

// ============= STYLED COMPONENTS =============
const StickerContainer = styled(Box)(() => ({
  position: 'relative',
  width: '200px',
  height: '200px',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',

  '&:hover': {
    transform: 'scale(1.02)',
    '& .sticker-overlay': {
      opacity: 1,
    },
  },
}));

const StickerImage = styled('img')(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  userSelect: 'none',
  display: 'block',
}));

const AddStickerButton = styled(Box)(({ theme, saved }) => ({
  marginTop: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '20px',
  backgroundColor: saved ? '#00a884' : 'rgba(0, 0, 0, 0.6)',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 500,
  cursor: saved ? 'default' : 'pointer',
  transition: 'all 0.2s ease',
  userSelect: 'none',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${saved ? '#00a884' : 'rgba(255, 255, 255, 0.1)'}`,

  '&:hover': {
    backgroundColor: saved ? '#00a884' : 'rgba(0, 0, 0, 0.8)',
    transform: saved ? 'none' : 'scale(1.05)',
  },

  '&:active': {
    transform: saved ? 'none' : 'scale(0.98)',
  },

  '& svg': {
    width: '16px',
    height: '16px',
  }
}));

const LoadingOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  zIndex: 2,
}));

const StickerOverlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  borderRadius: '8px',
  cursor: 'pointer',
}));

// ============= MODAL COMPONENTS =============
const StyledDialog = styled(Dialog)(() => ({
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  '& .MuiDialog-paper': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    maxWidth: '100vw',
    maxHeight: '100vh',
    margin: 0,
    overflow: 'hidden',
  },
}));

const ModalWrapper = styled(Box)(() => ({
  position: 'relative',
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

const ModalHeader = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '64px',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: '0 20px',
  gap: '12px',
  zIndex: 10,
}));

const ModalFooter = styled(Box)(() => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '80px',
  background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 20px',
  zIndex: 10,
}));

const HeaderButton = styled(IconButton)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  width: '48px',
  height: '48px',

  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: 'scale(1.05)',
  },

  transition: 'all 0.2s ease',
}));

const StickerViewer = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '80px 20px 100px',

  '& img': {
    maxWidth: '500px',
    maxHeight: '500px',
    objectFit: 'contain',
  },
}));

const AddStickerButtonModal = styled(Box)(({ saved }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  borderRadius: '24px',
  backgroundColor: saved ? '#00a884' : 'rgba(255, 255, 255, 0.15)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: saved ? 'default' : 'pointer',
  transition: 'all 0.2s ease',
  userSelect: 'none',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${saved ? '#00a884' : 'rgba(255, 255, 255, 0.3)'}`,

  '&:hover': {
    backgroundColor: saved ? '#00a884' : 'rgba(255, 255, 255, 0.25)',
    transform: saved ? 'none' : 'scale(1.05)',
  },

  '&:active': {
    transform: saved ? 'none' : 'scale(0.98)',
  },

  '& svg': {
    width: '20px',
    height: '20px',
  }
}));

/**
 * StickerMessage - Componente para exibir stickers com opção de salvar
 * Apenas stickers recebidos (fromMe: false) mostram o botão de adicionar
 */
const StickerMessage = ({ message, isSent = false }) => {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debug logs removidos para produção

  // Abrir modal
  const handleStickerClick = () => {
    setIsModalOpen(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Download do sticker
  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(message.mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = message.fileName || `sticker-${Date.now()}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Sticker baixado!');
    } catch (error) {
      console.error('Erro ao baixar sticker:', error);
      toast.error('Erro ao baixar sticker');
    }
  };

  // Função para adicionar sticker à biblioteca
  const handleAddSticker = async () => {
    if (saved || loading) return;

    try {
      setLoading(true);

      // Determinar nome do arquivo
      const fileName = message.fileName || `sticker-${Date.now()}.webp`;

      // Salvar sticker no banco usando a URL já existente
      // Não precisa fazer upload novamente, apenas salvar a referência
      await api.post('/stickers', {
        name: message.body || 'Figurinha',
        mediaUrl: message.mediaUrl, // Usar URL já existente
        mediaType: 'sticker',
        fileName: fileName,
        fileSize: message.fileSize || 0,
        isFavorite: true,
      });

      setSaved(true);
      toast.success('Figurinha adicionada à biblioteca!');

    } catch (error) {
      console.error('Erro ao adicionar figurinha:', error);
      toast.error('Erro ao adicionar figurinha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StickerContainer onClick={handleStickerClick}>
        {/* Imagem do sticker */}
        <StickerImage
          src={message.mediaUrl}
          alt={message.body || 'Sticker'}
          loading="lazy"
        />

        {/* Hover overlay com ícone de zoom */}
        <StickerOverlay className="sticker-overlay">
          <ZoomIn size={32} color="#fff" />
        </StickerOverlay>

        {/* Loading overlay */}
        {loading && (
          <LoadingOverlay>
            <CircularProgress size={30} sx={{ color: '#fff' }} />
          </LoadingOverlay>
        )}
      </StickerContainer>

      {/* Modal de visualização com botão de adicionar */}
      <StyledDialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth={false}
        fullScreen
      >
        <ModalWrapper>
          {/* Header com botões de ação */}
          <ModalHeader>
            <HeaderButton
              onClick={handleDownload}
              title="Baixar sticker"
              aria-label="Baixar sticker"
            >
              <Download size={20} />
            </HeaderButton>

            <HeaderButton
              onClick={handleCloseModal}
              title="Fechar"
              aria-label="Fechar visualizador"
            >
              <X size={20} />
            </HeaderButton>
          </ModalHeader>

          {/* Visualizador do sticker */}
          <StickerViewer onClick={handleCloseModal}>
            <img
              src={message.mediaUrl}
              alt="Sticker em tamanho completo"
              onClick={(e) => e.stopPropagation()}
            />
          </StickerViewer>

          {/* Footer com botão de adicionar - APENAS para stickers recebidos */}
          {(!isSent && !message.fromMe) && (
            <ModalFooter>
              <AddStickerButtonModal
                saved={saved}
                onClick={loading ? null : handleAddSticker}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                    <span>Salvando...</span>
                  </>
                ) : saved ? (
                  <>
                    <Check />
                    <span>Figurinha adicionada à biblioteca!</span>
                  </>
                ) : (
                  <>
                    <Plus />
                    <span>Adicionar figurinha</span>
                  </>
                )}
              </AddStickerButtonModal>
            </ModalFooter>
          )}
        </ModalWrapper>
      </StyledDialog>
    </>
  );
};

export default StickerMessage;
