import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Box } from '@mui/material';
import TagSelector from './TagSelector';

/**
 * TagSelectorWrapper - Componente que gerencia o posicionamento do TagSelector
 * Usa um botão invisível como referência para calcular a posição
 */
const TagSelectorWrapper = ({ 
  isOpen, 
  onClose,
  anchorEl,
  availableTags = [],
  selectedTags = [],
  onTagToggle,
  onCreateTag,
  entityType = 'Conversa'
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorEl) {
      const calculatePosition = () => {
        const rect = anchorEl.getBoundingClientRect();
        const dropdownWidth = 280;
        const dropdownHeight = 580;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 8;
        
        let top = rect.bottom + margin;
        let left = rect.left + (rect.width / 2) - (dropdownWidth / 2);
        
        // Verifica se há espaço abaixo
        if (top + dropdownHeight > viewportHeight - 20) {
          // Mostra acima se não houver espaço abaixo
          top = rect.top - dropdownHeight - margin;
        }
        
        // Ajusta horizontalmente se necessário
        if (left < 10) {
          left = 10;
        } else if (left + dropdownWidth > viewportWidth - 10) {
          left = viewportWidth - dropdownWidth - 10;
        }
        
        setPosition({ top, left });
      };
      
      calculatePosition();
      
      // Recalcula ao redimensionar
      const handleResize = () => calculatePosition();
      const handleScroll = () => calculatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, anchorEl]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Dropdown com posição fixa */}
      <Box
        sx={{
          position: 'fixed',
          top: position.top + 'px',
          left: position.left + 'px',
          zIndex: 10000,
        }}
      >
        <TagSelector
          isOpen={true}
          onClose={onClose}
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagToggle={onTagToggle}
          onCreateTag={onCreateTag}
          entityType={entityType}
          skipPortal={true} // Indica que não deve usar portal interno
        />
      </Box>
      
      {/* Overlay para fechar */}
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
    </>,
    document.body
  );
};

export default TagSelectorWrapper;