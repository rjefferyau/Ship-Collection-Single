import { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

/**
 * Wrapper component for Droppable to make it work with React 18's Strict Mode
 * This is needed because react-beautiful-dnd has issues with React 18's double rendering in strict mode
 */
export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // This timeout is needed to avoid the "Unable to find draggable with id" error
    // that occurs when using react-beautiful-dnd with React 18's Strict Mode
    const animation = requestAnimationFrame(() => setEnabled(true));
    
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
}; 