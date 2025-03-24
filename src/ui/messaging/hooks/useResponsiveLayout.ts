import { useState, useEffect, useCallback, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';

interface ResponsiveLayoutConfig {
    initialChatPanelWidth: number;
    minChatWidth: number;
    maxChatWidth: number;
    defaultMobileBreakpoint: number;
}

interface LayoutMetrics {
    availableWidth: number;
    chatPanelWidth: number;
    contactListWidth: number;
    isResizing: boolean;
    isPanelClosing: boolean;
}

const STORAGE_KEY = 'messaging_layout_state';

interface StoredLayoutState {
    chatPanelWidth: number;
    lastUpdated: number;
    version: string;
}

// Default values for SSR
const DEFAULT_CONTAINER_WIDTH = 1200;
const DEFAULT_CHAT_PANEL_WIDTH = 65;

export const useResponsiveLayout = (config: ResponsiveLayoutConfig = {
    initialChatPanelWidth: 65,
    minChatWidth: 40,
    maxChatWidth: 75,
    defaultMobileBreakpoint: 768
}) => {
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [chatPanelWidth, setChatPanelWidth] = useState<number>(DEFAULT_CHAT_PANEL_WIDTH);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [isPanelClosing, setIsPanelClosing] = useState<boolean>(false);
    const [isClient, setIsClient] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { width: containerWidth } = useResizeDetector({ targetRef: containerRef });
    const [selectedContact, setSelectedContact] = useState<boolean>(false);

    // Handle client-side initialization
    useEffect(() => {
        setIsClient(true);
        return () => setIsClient(false);
    }, []);

    // Calculate the actual container width with SSR support
    const calculateActualContainerWidth = useCallback(() => {
        if (!isClient) return DEFAULT_CONTAINER_WIDTH;

        if (containerWidth) return containerWidth;

        const parentElement = containerRef.current?.parentElement;
        if (parentElement) {
            const parentWidth = parentElement.getBoundingClientRect().width;
            return parentWidth - 48;
        }

        const viewportWidth = window.innerWidth;
        const padding = 48;
        const maxWidth = Math.min(viewportWidth - padding, viewportWidth * 0.95);
        
        return maxWidth;
    }, [containerWidth, isClient]);

    const actualContainerWidth = calculateActualContainerWidth();

    // Calculate layout metrics with SSR support
    const layoutMetrics: LayoutMetrics = {
        availableWidth: actualContainerWidth,
        chatPanelWidth: Math.round(actualContainerWidth * chatPanelWidth / 100),
        contactListWidth: actualContainerWidth - Math.round(actualContainerWidth * chatPanelWidth / 100),
        isResizing,
        isPanelClosing
    };

    // Load and validate stored layout state with SSR support
    const loadStoredLayout = useCallback((): number | null => {
        if (!isClient) return null;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;

            const state: StoredLayoutState = JSON.parse(stored);
            
            if (!state.chatPanelWidth || 
                !state.lastUpdated || 
                !state.version ||
                state.chatPanelWidth < config.minChatWidth || 
                state.chatPanelWidth > config.maxChatWidth) {
                return null;
            }

            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            if (state.lastUpdated < thirtyDaysAgo) {
                return null;
            }

            return state.chatPanelWidth;
        } catch (error) {
            console.warn('Failed to load stored layout state:', error);
            return null;
        }
    }, [config.minChatWidth, config.maxChatWidth, isClient]);

    // Save layout state with SSR support
    const saveLayoutState = useCallback((width: number) => {
        if (!isClient) return;

        try {
            const state: StoredLayoutState = {
                chatPanelWidth: width,
                lastUpdated: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save stored layout state:', error);
        }
    }, [isClient]);

    // Initialize layout with SSR support
    useEffect(() => {
        if (!isClient) return;

        const handleResize = () => {
            const newIsMobile = window.innerWidth < config.defaultMobileBreakpoint;
            setIsMobile(newIsMobile);
            
            if (newIsMobile) {
                // In mobile view, always start with contact list
                setChatPanelWidth(0);
            } else {
                const storedWidth = loadStoredLayout();
                if (storedWidth !== null) {
                    setChatPanelWidth(storedWidth);
                }
            }
        };
        
        handleResize();
        
        let resizeTimeout: NodeJS.Timeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 150);
        };
        
        window.addEventListener('resize', debouncedResize);
        return () => {
            window.removeEventListener('resize', debouncedResize);
            clearTimeout(resizeTimeout);
        };
    }, [config.defaultMobileBreakpoint, loadStoredLayout, isClient]);

    const handleResizePanel = useCallback((size: { width: number, height: number }) => {
        if (isMobile || !isClient) return;
        
        setIsResizing(true);
        const newPercentage = Math.min(
            Math.max(
                (size.width / actualContainerWidth) * 100,
                config.minChatWidth
            ),
            config.maxChatWidth
        );
        
        setChatPanelWidth(newPercentage);
        saveLayoutState(newPercentage);
        
        const timeoutId = setTimeout(() => {
            setIsResizing(false);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [actualContainerWidth, isMobile, config.minChatWidth, config.maxChatWidth, saveLayoutState, isClient]);

    const handlePanelClose = useCallback(() => {
        if (!isClient) return;
        
        setIsPanelClosing(true);
        const timeoutId = setTimeout(() => {
            setIsPanelClosing(false);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [isClient]);

    const calculateWidths = useCallback(() => {
        const currentWidth = actualContainerWidth;
        
        if (isMobile) {
            return {
                chatPanelPixelWidth: currentWidth,
                contactListPixelWidth: currentWidth,
                layoutMetrics
            };
        }

        const chatWidth = Math.round(currentWidth * chatPanelWidth / 100);
        const contactWidth = currentWidth - chatWidth;

        return {
            chatPanelPixelWidth: chatWidth,
            contactListPixelWidth: contactWidth,
            layoutMetrics
        };
    }, [layoutMetrics, isMobile, actualContainerWidth, chatPanelWidth]);

    const initializeLayout = useCallback(() => {
        if (!isClient) return;

        const newIsMobile = window.innerWidth < config.defaultMobileBreakpoint;
        setIsMobile(newIsMobile);
        
        if (!newIsMobile) {
            const storedWidth = loadStoredLayout();
            if (storedWidth !== null) {
                setChatPanelWidth(storedWidth);
            }
        } else {
            // In mobile view, always start with contact list
            setChatPanelWidth(0);
        }
        
        setIsPanelClosing(false);
    }, [config.defaultMobileBreakpoint, loadStoredLayout, isClient]);

    return {
        isMobile,
        chatPanelWidth,
        containerRef,
        handleResizePanel,
        calculateWidths,
        initializeLayout,
        handlePanelClose,
        layoutMetrics,
        isClient
    };
}; 