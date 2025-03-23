import { useResizeHandler } from '../hooks/useResizeHandler';

interface ResizeHandleProps {
    containerWidth: number;
    onResize: (width: number) => void;
    minWidth: number;
    maxWidth: number;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ 
    containerWidth, 
    onResize,
    minWidth,
    maxWidth
}) => {
    const handleMouseDown = useResizeHandler({
        containerWidth,
        onResize,
        minWidth,
        maxWidth
    });

    return (
        <div 
            className="w-1 h-full bg-gray-200 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors"
            style={{ position: 'relative', zIndex: 10 }}
            onMouseDown={handleMouseDown}
        />
    );
};
