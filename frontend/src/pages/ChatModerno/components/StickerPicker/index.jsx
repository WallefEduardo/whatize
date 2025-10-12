import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search, Add, Close } from '@mui/icons-material';
import api from '../../../../services/api';
import { toast } from '../../../../components/ui/ToastProvider';

// ============= CACHE CONFIG =============
const STICKERS_CACHE_KEY = 'stickers_library_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// ============= STYLED COMPONENTS =============
const PickerContainer = styled(Box)(({ theme }) => ({
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

const StickersGrid = styled(Box)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '12px',
  alignContent: 'start',

  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#1f2c33',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#374248',
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: '#4a5c66',
    },
  },
}));

const StickerItem = styled(Box)(() => ({
  aspectRatio: '1',
  borderRadius: '8px',
  overflow: 'visible', // Mudado para 'visible' para que o botão apareça fora do container
  cursor: 'pointer',
  backgroundColor: '#2a3942',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  position: 'relative',

  '&:hover': {
    transform: 'scale(1.08)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },

  '&:hover .delete-button': {
    opacity: 1,
  },

  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px', // Adicionado borderRadius na imagem já que o container não tem overflow hidden
  },
}));

const DeleteButton = styled(IconButton)(() => ({
  position: 'absolute',
  top: '4px',
  right: '4px',
  padding: '4px',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: '#fff',
  opacity: 0,
  transition: 'opacity 0.2s ease, background-color 0.2s ease',
  zIndex: 2,

  '&:hover': {
    backgroundColor: '#e74c3c',
    transform: 'scale(1.1)',
  },

  '& .MuiSvgIcon-root': {
    fontSize: '16px',
  },
}));

const AddStickerButton = styled(Box)(() => ({
  aspectRatio: '1',
  borderRadius: '8px',
  border: '2px dashed #8696a0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  gap: '4px',

  '&:hover': {
    borderColor: '#00a884',
    backgroundColor: 'rgba(0, 168, 132, 0.1)',
    transform: 'scale(1.05)',
  },

  '& .MuiSvgIcon-root': {
    fontSize: '28px',
    color: '#8696a0',
  },

  '&:hover .MuiSvgIcon-root': {
    color: '#00a884',
  },
}));

const AddStickerText = styled(Typography)(() => ({
  fontSize: '10px',
  color: '#8696a0',
  fontWeight: 500,
}));

const EmptyState = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#8696a0',
  padding: '20px',
  textAlign: 'center',
}));

const LoadingState = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
}));

const SkeletonItem = styled(Skeleton)(() => ({
  aspectRatio: '1',
  borderRadius: '8px',
  backgroundColor: '#2a3942',
}));

// ============= DIALOG COMPONENTS =============
const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    backgroundColor: '#1f2c33',
    borderRadius: '12px',
    minWidth: '400px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(() => ({
  color: '#e9edef',
  fontSize: '18px',
  fontWeight: 600,
  padding: '20px 24px 12px',
  borderBottom: '1px solid #2a3942',
}));

const StyledDialogContent = styled(DialogContent)(() => ({
  color: '#8696a0',
  fontSize: '14px',
  padding: '20px 24px',
  lineHeight: '1.5',
}));

const StyledDialogActions = styled(DialogActions)(() => ({
  padding: '12px 24px 20px',
  gap: '12px',
  justifyContent: 'flex-end',
}));

const CancelButton = styled(Button)(() => ({
  color: '#8696a0',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '8px 20px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: 'rgba(134, 150, 160, 0.1)',
  },
}));

const DeleteConfirmButton = styled(Button)(() => ({
  backgroundColor: '#e74c3c',
  color: '#fff',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '8px 20px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: '#c0392b',
  },
}));

// ============= MEMOIZED STICKER ITEM =============
const MemoizedStickerItem = memo(({ sticker, onStickerClick, onDeleteClick }) => (
  <StickerItem
    onClick={() => onStickerClick(sticker)}
    title={sticker.name || sticker.fileName}
  >
    <img
      src={sticker.mediaUrl}
      alt={sticker.name || 'Figurinha'}
      loading="lazy"
    />
    <DeleteButton
      className="delete-button"
      onClick={(e) => onDeleteClick(e, sticker)}
      title="Deletar figurinha"
    >
      <Close />
    </DeleteButton>
  </StickerItem>
), (prevProps, nextProps) => {
  // Só re-renderizar se o sticker mudou
  return prevProps.sticker.id === nextProps.sticker.id &&
         prevProps.sticker.mediaUrl === nextProps.sticker.mediaUrl;
});

MemoizedStickerItem.displayName = 'MemoizedStickerItem';

// ============= CACHE HELPERS =============
const getCachedStickers = () => {
  try {
    const cached = sessionStorage.getItem(STICKERS_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Verificar se o cache ainda é válido (5 minutos)
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expirado
    sessionStorage.removeItem(STICKERS_CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Erro ao ler cache de stickers:', error);
    return null;
  }
};

const setCachedStickers = (data) => {
  try {
    sessionStorage.setItem(STICKERS_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Erro ao salvar cache de stickers:', error);
  }
};

const clearStickersCache = () => {
  try {
    sessionStorage.removeItem(STICKERS_CACHE_KEY);
  } catch (error) {
    console.error('Erro ao limpar cache de stickers:', error);
  }
};

/**
 * StickerPicker - Painel de seleção de figurinhas (stickers)
 * Otimizado com cache, memoization e lazy loading
 */
const StickerPicker = ({ onSelectSticker, onClose, onAddSticker }) => {
  const [stickers, setStickers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stickerToDelete, setStickerToDelete] = useState(null);

  // ✅ OTIMIZAÇÃO: Carregar figurinhas com cache
  useEffect(() => {
    const fetchStickers = async () => {
      try {
        // Tentar carregar do cache primeiro
        const cachedData = getCachedStickers();

        if (cachedData) {
          // Cache hit! Exibir dados instantaneamente
          setStickers(cachedData);
          setLoading(false);
          return;
        }

        // Cache miss - buscar do backend
        setLoading(true);
        const { data } = await api.get('/stickers');
        setStickers(data);

        // Salvar no cache para próximas aberturas
        setCachedStickers(data);
      } catch (error) {
        console.error('Erro ao carregar figurinhas:', error);
        toast.error('Erro ao carregar figurinhas');
      } finally {
        setLoading(false);
      }
    };

    fetchStickers();
  }, []);

  // ✅ OTIMIZAÇÃO: Memoizar filtro de busca (evita recalcular toda vez)
  const filteredStickers = useMemo(() => {
    if (searchTerm.trim() === '') {
      return stickers;
    }

    const searchLower = searchTerm.toLowerCase();
    return stickers.filter(sticker =>
      sticker.name?.toLowerCase().includes(searchLower) ||
      sticker.fileName?.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, stickers]);

  // ✅ OTIMIZAÇÃO: Memoizar callbacks (evita re-renders)
  const handleStickerClick = useCallback((sticker) => {
    onSelectSticker(sticker);
    onClose();
  }, [onSelectSticker, onClose]);

  const handleAddClick = useCallback(() => {
    onAddSticker();
  }, [onAddSticker]);

  const handleDeleteClick = useCallback((e, sticker) => {
    e.stopPropagation();
    setStickerToDelete(sticker);
    setDeleteDialogOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setStickerToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!stickerToDelete) return;

    try {
      await api.delete(`/stickers/${stickerToDelete.id}`);

      // Atualizar estado local e cache
      const updatedStickers = stickers.filter(s => s.id !== stickerToDelete.id);
      setStickers(updatedStickers);
      setCachedStickers(updatedStickers); // ✅ Atualizar cache

      toast.success('Figurinha deletada com sucesso!');
      setDeleteDialogOpen(false);
      setStickerToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar figurinha:', error);
      toast.error('Erro ao deletar figurinha');
      setDeleteDialogOpen(false);
      setStickerToDelete(null);
    }
  }, [stickerToDelete, stickers]);

  return (
    <PickerContainer>
      {/* Header com busca */}
      <PickerHeader>
        <SearchContainer>
          <Search sx={{ color: '#8696a0', fontSize: '20px' }} />
          <SearchInput
            placeholder="Pesquisar na loja de figurinhas do WhatsApp"
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

      {/* Grid de figurinhas */}
      <StickersGrid>
        {loading ? (
          // ✅ Skeleton loading para melhor UX
          <>
            {[...Array(12)].map((_, index) => (
              <SkeletonItem key={`skeleton-${index}`} variant="rectangular" animation="wave" />
            ))}
          </>
        ) : (
          <>
          {/* Botão de adicionar figurinha */}
          <AddStickerButton onClick={handleAddClick}>
            <Add />
            <AddStickerText>Criar</AddStickerText>
          </AddStickerButton>

          {/* Figurinhas do usuário */}
          {filteredStickers.map((sticker) => (
            <MemoizedStickerItem
              key={sticker.id}
              sticker={sticker}
              onStickerClick={handleStickerClick}
              onDeleteClick={handleDeleteClick}
            />
          ))}

          {/* Empty state */}
          {!loading && filteredStickers.length === 0 && searchTerm === '' && (
            <EmptyState sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Nenhuma figurinha salva ainda
              </Typography>
              <Typography variant="caption" sx={{ color: '#667781' }}>
                Clique no botão "+" para adicionar suas primeiras figurinhas
              </Typography>
            </EmptyState>
          )}

          {/* No results */}
          {!loading && filteredStickers.length === 0 && searchTerm !== '' && (
            <EmptyState sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="body2">
                Nenhuma figurinha encontrada
              </Typography>
            </EmptyState>
          )}
          </>
        )}
      </StickersGrid>

      {/* Dialog de confirmação de exclusão */}
      <StyledDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <StyledDialogTitle>
          Deletar figurinha
        </StyledDialogTitle>
        <StyledDialogContent>
          <Typography variant="body2" sx={{ color: '#8696a0' }}>
            Deseja realmente deletar a figurinha <strong style={{ color: '#e9edef' }}>"{stickerToDelete?.name || stickerToDelete?.fileName || 'esta figurinha'}"</strong> da sua biblioteca?
          </Typography>
          <Typography variant="caption" sx={{ color: '#667781', mt: 2, display: 'block' }}>
            Esta ação não poderá ser desfeita.
          </Typography>
        </StyledDialogContent>
        <StyledDialogActions>
          <CancelButton onClick={handleCancelDelete}>
            Cancelar
          </CancelButton>
          <DeleteConfirmButton onClick={handleConfirmDelete}>
            Deletar
          </DeleteConfirmButton>
        </StyledDialogActions>
      </StyledDialog>
    </PickerContainer>
  );
};

// ✅ Exportar com React.memo para otimização
export default memo(StickerPicker);

// Exportar função para limpar cache (útil ao adicionar novos stickers)
export { clearStickersCache };
