import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Hook para virtualização de lista com performance otimizada
 * Renderiza apenas os itens visíveis + buffer
 */
const useVirtualizedList = ({
  items = [],
  itemHeight = 80,
  containerHeight = 400,
  buffer = 5 // Itens extras para renderizar fora da tela
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);

  // Calcular índices visíveis
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, buffer]);

  // Itens visíveis para renderização
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      virtualIndex: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        width: '100%',
        height: itemHeight
      }
    }));
  }, [items, visibleRange, itemHeight]);

  // Handler de scroll otimizado
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // Scroll para item específico
  const scrollToItem = useCallback((index) => {
    if (scrollElementRef.current) {
      const targetScrollTop = index * itemHeight;
      scrollElementRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [itemHeight]);

  // Scroll para o topo
  const scrollToTop = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  return {
    visibleItems,
    visibleRange,
    totalHeight: items.length * itemHeight,
    scrollElementRef,
    handleScroll,
    scrollToItem,
    scrollToTop,
    isAtTop: scrollTop < itemHeight,
    isAtBottom: scrollTop + containerHeight >= items.length * itemHeight - itemHeight
  };
};

export default useVirtualizedList;