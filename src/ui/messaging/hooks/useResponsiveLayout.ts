import { useState, useEffect, useCallback, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';

export const useResponsiveLayout = (initialChatPanelWidth: number = 65) => {
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [chatPanelWidth, setChatPanelWidth] = useState<number>(initialChatPanelWidth);
    const containerRef = useRef<HTMLDivElement>(null);
    const { width: containerWidth } = useResizeDetector({ targetRef: containerRef });
    const actualContainerWidth = containerWidth || 1000;

    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth < 768;
            setIsMobile(newIsMobile);
            
            if (newIsMobile && chatPanelWidth !== 100) {
                setChatPanelWidth(100);
            } else if (!newIsMobile && chatPanelWidth === 100) {
                setChatPanelWidth(initialChatPanelWidth);
            }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [chatPanelWidth, initialChatPanelWidth]);

    const handleResizePanel = useCallback((size: { width: number, height: number }) => {
        if (isMobile) return;
        
        const newPercentage = Math.min(
            Math.max(
                (size.width / actualContainerWidth) * 100,
                40
            ),
            80
        );
        
        setChatPanelWidth(newPercentage);
    }, [actualContainerWidth, isMobile]);

    const calculateWidths = (chatVisible: boolean) => {
        const chatPanelPixelWidth = chatVisible 
            ? isMobile 
                ? actualContainerWidth 
                : Math.round(actualContainerWidth * chatPanelWidth / 100)
            : 0;
            
        const contactListPixelWidth = isMobile 
            ? chatVisible ? 0 : actualContainerWidth
            : actualContainerWidth - chatPanelPixelWidth;

        return {
            chatPanelPixelWidth,
            contactListPixelWidth
        };
    };

    return {
        isMobile,
        chatPanelWidth,
        containerRef,
        handleResizePanel,
        calculateWidths
    };
}; 