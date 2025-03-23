import { useCallback } from 'react';

interface ResizeHandlerProps {
    containerWidth: number;
    onResize: (width: number) => void;
    minWidth: number;
    maxWidth: number;
}

export const useResizeHandler = ({ containerWidth, onResize, minWidth, maxWidth }: ResizeHandlerProps) => {
    return useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        
        const startX = e.clientX;
        const startWidth = containerWidth;
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(
                Math.min(
                    startWidth - deltaX,
                    maxWidth
                ),
                minWidth
            );
            
            onResize(newWidth);
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [containerWidth, onResize, minWidth, maxWidth]);
}; 