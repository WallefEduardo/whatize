import React, { memo, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import useVirtualizedList from '../../../hooks/useVirtualizedList';
import OptimizedContactList from './OptimizedContactList';

const VirtualContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  overflow: 'auto',
  position: 'relative',
  // Scroll suave no webkit
  WebkitOverflowScrolling: 'touch',
  // Performance otimizada
  willChange: 'scroll-position',
  containIntrinsicSize: 'auto',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '3px',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.3)',
    }
  }
}));

const VirtualContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%'
}));

// Constantes de configuração
const ITEM_HEIGHT = 88; // Altura de cada item de contato
const BUFFER_SIZE = 3;  // Itens extras para renderizar

const VirtualizedContactList = memo(({
  tickets = [],
  selectedChatId,
  onContactSelect,
  containerHeight = 400
}) => {
  const containerRef = useRef(null);
  
  // Hook de virtualização
  const {
    visibleItems,
    totalHeight,
    scrollElementRef,
    handleScroll,
    scrollToItem,
    scrollToTop
  } = useVirtualizedList({
    items: tickets,
    itemHeight: ITEM_HEIGHT,
    containerHeight,
    buffer: BUFFER_SIZE
  });

  // Auto-scroll para item selecionado quando muda
  useEffect(() => {
    const selectedIndex = tickets.findIndex(ticket => ticket.uuid === selectedChatId);
    if (selectedIndex !== -1) {
      scrollToItem(selectedIndex);
    }
  }, [selectedChatId, tickets, scrollToItem]);

  // Ref interno para scroll
  useEffect(() => {
    if (containerRef.current) {
      scrollElementRef.current = containerRef.current;
    }
  }, [scrollElementRef]);

  // Handler de scroll com throttling
  const throttledHandleScroll = React.useCallback(
    throttle(handleScroll, 16), // ~60fps
    [handleScroll]
  );

  return (
    <VirtualContainer
      ref={containerRef}
      onScroll={throttledHandleScroll}
      style={{ height: containerHeight }}
    >
      <VirtualContent style={{ height: totalHeight }}>
        {visibleItems.map((ticket) => (
          <Box
            key={`${ticket.uuid}-${ticket.virtualIndex}`}
            style={ticket.style}
          >
            <OptimizedContactList
              ticket={ticket}
              selectedChatId={selectedChatId}
              onContactSelect={onContactSelect}
            />
          </Box>
        ))}
      </VirtualContent>
    </VirtualContainer>
  );
});

// Função de throttle para performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

VirtualizedContactList.displayName = 'VirtualizedContactList';

export default VirtualizedContactList;