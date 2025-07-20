import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Box,
  CircularProgress
} from '@material-ui/core';
import { MoreVert, LocalOffer } from '@material-ui/icons';
import { toast } from 'react-toastify';
import api from '../../services/api';

const KanbanCardActions = ({ ticket, onTagsUpdated, renderTagsOnly = false, renderMenuOnly = false }) => {
  // Debug: verificar tags do ticket
  console.log('KanbanCardActions - ticket.tags:', ticket?.tags);
  console.log('KanbanCardActions - ticket completo:', ticket);

  // Estados
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmRemoveModalOpen, setConfirmRemoveModalOpen] = useState(false);
  const [tagToRemove, setTagToRemove] = useState(null);
  const [manageTagsModalOpen, setManageTagsModalOpen] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);

  // Efeito para carregar tags quando modal abre
  useEffect(() => {
    if (manageTagsModalOpen) {
      fetchAllTags();
    }
  }, [manageTagsModalOpen]);

  // Função para buscar todas as tags disponíveis
  const fetchAllTags = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tags');
      // Verificar se response.data é um array ou tem uma propriedade que contém as tags
      const tagsData = Array.isArray(response.data) ? response.data : response.data.tags || [];
      const availableTags = tagsData.filter(tag => tag.kanban === 0); // Só tags normais, não kanban
      setAllTags(availableTags);
      
      // Definir tags já vinculadas
      const currentTagIds = ticket.tags?.map(tag => tag.id) || [];
      setSelectedTags(currentTagIds);
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      toast.error('Erro ao carregar tags');
      setAllTags([]); // Define array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Função para remover tag do ticket
  const handleRemoveTag = async (tag) => {
    try {
      await api.delete(`/ticket-tags/${ticket.id}/${tag.id}`);
      toast.success('Tag removida com sucesso!');
      onTagsUpdated && onTagsUpdated(); // Callback para atualizar o card
      setConfirmRemoveModalOpen(false);
      setTagToRemove(null);
    } catch (error) {
      console.error('Erro ao remover tag:', error);
      toast.error('Erro ao remover tag');
    }
  };

  // Função para confirmar remoção de tag
  const confirmRemoveTag = (tag) => {
    setTagToRemove(tag);
    setConfirmRemoveModalOpen(true);
  };

  // Função para salvar tags vinculadas
  const handleSaveTags = async () => {
    setLoading(true);
    try {
      // Obter tags atuais e novas
      const currentTagIds = ticket.tags?.map(tag => tag.id) || [];
      const tagsToAdd = selectedTags.filter(tagId => !currentTagIds.includes(tagId));
      const tagsToRemove = currentTagIds.filter(tagId => !selectedTags.includes(tagId));

      // Remover tags desmarcadas
      for (const tagId of tagsToRemove) {
        await api.delete(`/ticket-tags/${ticket.id}/${tagId}`);
      }

      // Adicionar novas tags
      for (const tagId of tagsToAdd) {
        await api.post(`/ticket-tags`, {
          ticketId: ticket.id,
          tagId: tagId
        });
      }

      toast.success('Tags atualizadas com sucesso!');
      setManageTagsModalOpen(false);
      onTagsUpdated && onTagsUpdated(); // Callback para atualizar o card
    } catch (error) {
      console.error('Erro ao atualizar tags:', error);
      toast.error('Erro ao atualizar tags');
    } finally {
      setLoading(false);
    }
  };

  // Função para toggle de tag
  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Renderizar tag com duplo clique para remover
  const renderTagWithRemove = (tag, index) => {
    const isVeryLong = tag.name.length > 35;
    const truncatedName = isVeryLong ? `${tag.name.substring(0, 32)}...` : tag.name;
    
    const chipElement = (
      <Chip
        key={`${tag.id}-${index}`}
        label={truncatedName}
        size="small"
        onDoubleClick={() => confirmRemoveTag(tag)}
        style={{
          backgroundColor: `${tag.color}1A` || '#e3f2fd1A',
          color: tag.color || '#1976d2',
          fontSize: '0.65rem',
          height: '20px',
          flexShrink: 0,
          flexGrow: 0,
          minWidth: 'auto',
          maxWidth: isVeryLong ? '200px' : 'fit-content',
          paddingLeft: tag.name.length <= 6 ? '6px' : '8px',
          paddingRight: tag.name.length <= 6 ? '6px' : '8px',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
          },
        }}
        icon={<LocalOffer style={{ fontSize: '12px', color: tag.color || '#1976d2' }} />}
      />
    );

    // Se a tag foi truncada, envolve com Tooltip
    return isVeryLong ? (
      <Tooltip key={`${tag.id}-${index}`} title={`${tag.name} (duplo clique para remover)`} placement="top">
        {chipElement}
      </Tooltip>
    ) : (
      <Tooltip key={`${tag.id}-${index}`} title="Duplo clique para remover" placement="top">
        {chipElement}
      </Tooltip>
    );
  };

  // Renderizar menu de ações
  const renderActionsMenu = () => (
    <>
      <Tooltip title="Ações do ticket">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          style={{ marginLeft: '4px', padding: '2px' }}
        >
          <MoreVert style={{ fontSize: '16px' }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          style: {
            minWidth: '100px',
            maxWidth: '120px',
            fontSize: '0.8rem',
          },
        }}
      >
        <MenuItem 
          onClick={() => {
            setManageTagsModalOpen(true);
            setAnchorEl(null);
          }}
          style={{ fontSize: '0.8rem', padding: '6px 8px', minHeight: 'auto' }}
        >
          <LocalOffer style={{ fontSize: '14px', marginRight: '6px' }} />
          Vincular Tags
        </MenuItem>
      </Menu>
    </>
  );

  // Algoritmo otimizado para maximizar aproveitamento do espaço
  const organizeTagsOptimized = (tags) => {
    // Classificar tags por tamanho mais refinado
    const tiny = tags.filter(t => t.name.length <= 4);       // Muito pequenas
    const small = tags.filter(t => t.name.length > 4 && t.name.length <= 8);  // Pequenas
    const medium = tags.filter(t => t.name.length > 8 && t.name.length <= 15); // Médias  
    const large = tags.filter(t => t.name.length > 15);      // Grandes
    
    // Estratégia inteligente: priorizar combinações que cabem juntas
    const result = [];
    
    // Primeiro, adiciona todas as tiny + small (que cabem várias por linha)
    let tinyIndex = 0, smallIndex = 0, mediumIndex = 0, largeIndex = 0;
    
    // Combinar tiny e small primeiro (até 3 por vez)
    while (tinyIndex < tiny.length || smallIndex < small.length) {
      let lineLength = 0;
      
      // Adiciona até 3 tiny/small que cabem na linha
      for (let i = 0; i < 3; i++) {
        if (tinyIndex < tiny.length && lineLength + tiny[tinyIndex].name.length <= 25) {
          result.push(tiny[tinyIndex]);
          lineLength += tiny[tinyIndex].name.length;
          tinyIndex++;
        } else if (smallIndex < small.length && lineLength + small[smallIndex].name.length <= 25) {
          result.push(small[smallIndex]);
          lineLength += small[smallIndex].name.length;
          smallIndex++;
        } else {
          break;
        }
      }
      
      // Se não conseguiu adicionar nada, para o loop
      if (lineLength === 0) break;
    }
    
    // Depois adiciona medium e large normalmente
    while (mediumIndex < medium.length || largeIndex < large.length) {
      if (mediumIndex < medium.length) {
        result.push(medium[mediumIndex++]);
      }
      if (largeIndex < large.length) {
        result.push(large[largeIndex++]);
      }
    }
    
    return result;
  };

  // Renderização condicional
  if (renderTagsOnly) {
    return (
      <>
        {/* Apenas tags com função de remoção */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="card-tags">
            {organizeTagsOptimized(ticket.tags).map((tag, index) => renderTagWithRemove(tag, index))}
          </div>
        )}
      </>
    );
  }

  if (renderMenuOnly) {
    return (
      <>
        {/* Apenas menu de ações */}
        {renderActionsMenu()}
      </>
    );
  }

  return (
    <>
      {/* Tags com função de remoção - organizadas inteligentemente */}
      {ticket.tags && ticket.tags.length > 0 && (
        <div className="card-tags">
          {organizeTagsOptimized(ticket.tags).map((tag, index) => renderTagWithRemove(tag, index))}
        </div>
      )}

      {/* Menu de ações para o footer */}
      {renderActionsMenu()}

      {/* Modal de confirmação para remover tag */}
      <Dialog
        open={confirmRemoveModalOpen}
        onClose={() => setConfirmRemoveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Remoção</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover a tag "{tagToRemove?.name}" deste ticket?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmRemoveModalOpen(false)}
            color="default"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => handleRemoveTag(tagToRemove)}
            color="secondary"
            variant="contained"
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para gerenciar tags */}
      <Dialog
        open={manageTagsModalOpen}
        onClose={() => setManageTagsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Gerenciar Tags do Ticket #{ticket.id}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" padding="20px">
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: '16px' }}>
                Selecione as tags que deseja vincular a este ticket:
              </Typography>
              
              {allTags.length === 0 ? (
                <Typography>Nenhuma tag disponível</Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap="8px">
                  {allTags.map(tag => (
                    <FormControlLabel
                      key={tag.id}
                      control={
                        <Checkbox
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => handleTagToggle(tag.id)}
                          color="primary"
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap="8px">
                          <Chip
                            label={tag.name}
                            size="small"
                            style={{
                              backgroundColor: `${tag.color}1A` || '#e3f2fd1A',
                              color: tag.color || '#1976d2',
                              fontSize: '0.7rem',
                            }}
                            icon={<LocalOffer style={{ fontSize: '12px', color: tag.color || '#1976d2' }} />}
                          />
                        </Box>
                      }
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setManageTagsModalOpen(false)}
            color="default"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveTags}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default KanbanCardActions; 