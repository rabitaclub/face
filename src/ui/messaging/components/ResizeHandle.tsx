import { useResizeHandler } from '../hooks/useResizeHandler';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
    containerWidth: number;
    onResize: (width: number) => void;
    minWidth: number;
    maxWidth: number;
    className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ 
    containerWidth, 
    onResize,
    minWidth,
    maxWidth,
    className
}) => {
    const handleMouseDown = useResizeHandler({
        containerWidth,
        onResize,
        minWidth,
        maxWidth
    });

    return (
        <div 
            className={cn(
                "w-1 h-full bg-gray-200 cursor-col-resize transition-colors",
                "hover:w-1.5 active:w-1.5",
                "before:content-[''] before:absolute before:inset-y-0 before:-left-2 before:w-4",
                className
            )}
            style={{ position: 'relative', zIndex: 10 }}
            onMouseDown={handleMouseDown}
        />
    );
};
