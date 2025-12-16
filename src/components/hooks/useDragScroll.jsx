import { useRef, useEffect } from 'react';

/**
 * Custom hook to enable drag-to-scroll functionality
 * Usage: const scrollRef = useDragScroll();
 * Then: <div ref={scrollRef}>...</div>
 */
export function useDragScroll() {
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleMouseDown = (e) => {
      // Ignore if clicking on interactive elements
      if (
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'A' ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('input') ||
        e.target.closest('textarea')
      ) {
        return;
      }

      isDraggingRef.current = true;
      startXRef.current = e.pageX - element.offsetLeft;
      startYRef.current = e.pageY - element.offsetTop;
      scrollLeftRef.current = element.scrollLeft;
      scrollTopRef.current = element.scrollTop;
      
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      
      e.preventDefault();
      
      const x = e.pageX - element.offsetLeft;
      const y = e.pageY - element.offsetTop;
      const walkX = (x - startXRef.current) * 2;
      const walkY = (y - startYRef.current) * 2;
      
      element.scrollLeft = scrollLeftRef.current - walkX;
      element.scrollTop = scrollTopRef.current - walkY;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
    };

    const handleMouseLeave = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        element.style.cursor = 'grab';
        element.style.userSelect = '';
      }
    };

    // Touch events for mobile
    const handleTouchStart = (e) => {
      if (
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'A' ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('input') ||
        e.target.closest('textarea')
      ) {
        return;
      }

      const touch = e.touches[0];
      isDraggingRef.current = true;
      startXRef.current = touch.pageX - element.offsetLeft;
      startYRef.current = touch.pageY - element.offsetTop;
      scrollLeftRef.current = element.scrollLeft;
      scrollTopRef.current = element.scrollTop;
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current) return;
      
      const touch = e.touches[0];
      const x = touch.pageX - element.offsetLeft;
      const y = touch.pageY - element.offsetTop;
      const walkX = (x - startXRef.current) * 2;
      const walkY = (y - startYRef.current) * 2;
      
      element.scrollLeft = scrollLeftRef.current - walkX;
      element.scrollTop = scrollTopRef.current - walkY;
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    element.style.cursor = 'grab';

    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return scrollRef;
}