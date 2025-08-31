import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search, Plus, X } from 'lucide-react';
import StatusBadge from '../StatusBadge';

const SelectorContainer = styled(Box)(({ isOpen, showAbove }) => ({
  position: 'absolute',
  ...(showAbove ? {
    bottom: '100%',
    marginBottom: '10px',
  } : {
    top: '100%',
    marginTop: '10px',
  }),
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  zIndex: 9999,
  width: '280px',
  maxHeight: '400px',
  display: isOpen ? 'block' : 'none',
  overflow: 'hidden',
}));

const Header = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 16px 12px 16px',
  borderBottom: '1px solid var(--border-primary)',
}));

const CreateButton = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '6px',
  backgroundColor: 'var(--color-accent)',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  
  '&:hover': {
    backgroundColor: 'var(--color-accent)',
    opacity: 0.9,
    transform: 'scale(1.05)',
  }
}));

const SearchContainer = styled(Box)(() => ({
  padding: '8px 16px 12px 16px',
}));

const TagsList = styled(Box)(() => ({
  maxHeight: '200px',
  overflowY: 'auto',
  padding: '0 8px',
}));

const TagItem = styled(Box)(({ selected }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px',
  borderRadius: '6px',
  cursor: 'pointer',
  margin: '2px 0',
  backgroundColor: selected ? 'rgba(var(--color-accent-rgb), 0.1)' : 'transparent',
  
  '&:hover': {
    backgroundColor: selected ? 'rgba(var(--color-accent-rgb), 0.15)' : 'var(--bg-secondary)',
  }
}));

const Checkbox = styled(Box)(({ checked }) => ({
  width: '16px',
  height: '16px',
  borderRadius: '3px',
  border: '2px solid var(--border-primary)',
  backgroundColor: checked ? 'var(--color-accent)' : 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  
  '& svg': {
    width: '10px',
    height: '10px',
    color: 'white',
    display: checked ? 'block' : 'none',
  }
}));


/**
 * TagSelector - Componente reutilizável para seleção e criação de tags
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o dropdown está aberto
 * @param {Function} props.onClose - Callback para fechar o dropdown
 * @param {Array} props.availableTags - Tags disponíveis para seleção
 * @param {Array} props.selectedTags - Tags selecionadas atualmente
 * @param {Function} props.onTagToggle - Callback quando uma tag é selecionada/desmarcada
 * @param {Function} props.onCreateTag - Callback para criar nova tag
 * @param {string} props.entityType - Tipo da entidade (ex: 'Contato', 'Conversa')
 */
const TagSelector = ({
  isOpen = false,
  onClose,
  availableTags = [],
  selectedTags = [],
  onTagToggle,
  onCreateTag,
  entityType = 'Conversa'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAbove, setShowAbove] = useState(false);
  const containerRef = useRef(null);
  
  // Tags mockadas para demonstração
  const mockTags = [
    { id: 1, name: 'Teste', color: '#00BCD4' },
    { id: 2, name: 'etsad', color: '#9C27B0' },
    { id: 3, name: 'qeqweqw', color: '#2196F3' },
    { id: 4, name: 'qweqwe', color: '#F44336' },
    { id: 5, name: 'qweqweqw', color: '#E91E63' },
    { id: 6, name: 'asdasd', color: '#795548' },
    { id: 7, name: '123123', color: '#4CAF50' },
    { id: 8, name: '12312312', color: '#607D8B' },
  ];
  
  const tags = availableTags.length > 0 ? availableTags : mockTags;
  
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isTagSelected = (tagId) => {
    return selectedTags.some(tag => tag.id === tagId);
  };
  
  const handleTagToggle = (tag) => {
    if (onTagToggle) {
      onTagToggle(tag);
    }
  };
  
  const handleCreateNew = () => {
    if (onCreateTag) {
      onCreateTag();
    }
  };
  
  // Detecta se deve aparecer acima ou abaixo
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 400;
      const spaceBelow = viewportHeight - containerRect.bottom;
      
      // Se não há espaço embaixo, mostra em cima
      setShowAbove(spaceBelow < dropdownHeight + 20);
    }
  }, [isOpen]);
  
  return (
    <Box ref={containerRef} sx={{ position: 'relative', display: 'inline-block' }}>
      <SelectorContainer isOpen={isOpen} showAbove={showAbove}>
          {/* Header */}
          <Header>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Etiquetas
              </Typography>
              <CreateButton onClick={handleCreateNew}>
                <Plus size={14} />
              </CreateButton>
            </Box>
            <Box
              onClick={onClose}
              sx={{
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }
              }}
            >
              <X size={16} />
            </Box>
          </Header>
          
          {/* Search */}
          <SearchContainer>
            <TextField
              fullWidth
              placeholder="Search"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search size={16} style={{ marginRight: '8px', color: 'var(--text-secondary)' }} />
                ),
                sx: {
                  borderRadius: '20px',
                  '& fieldset': { 
                    border: '1px solid var(--border-primary)',
                    borderRadius: '20px',
                  },
                  '& input': {
                    fontSize: '13px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    '&::placeholder': {
                      color: 'var(--text-secondary)',
                      opacity: 1,
                    },
                  },
                }
              }}
            />
          </SearchContainer>
          
          {/* Tags List */}
          <TagsList>
            {filteredTags.map((tag) => (
              <TagItem 
                key={tag.id} 
                selected={isTagSelected(tag.id)}
                onClick={() => handleTagToggle(tag)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <StatusBadge
                    label={tag.name}
                    color={tag.color}
                    variant="filled"
                    size="small"
                    sx={{ fontSize: '12px' }}
                  />
                </Box>
                
                <Checkbox checked={isTagSelected(tag.id)}>
                  <Plus />
                </Checkbox>
              </TagItem>
            ))}
            
            {filteredTags.length === 0 && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  padding: '20px',
                  fontSize: '12px',
                  fontStyle: 'italic'
                }}
              >
                Nenhuma tag encontrada
              </Typography>
            )}
          </TagsList>
        </SelectorContainer>
        
      
      {/* Overlay para fechar */}
      {isOpen && (
        <Box
          onClick={onClose}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
          }}
        />
      )}
    </Box>
  );
};

export default TagSelector;