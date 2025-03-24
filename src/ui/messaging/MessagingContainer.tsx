"use client";

import { useEffect, useCallback } from 'react';
import { ContactList } from './ContactList';
import { ChatPanel } from './ChatPanel';
import { ResizeHandle } from './components/ResizeHandle';
import { useContacts } from './hooks/useContacts';
import { useChat } from './hooks/useChat';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { useKOLProfileData } from '@/hooks/useContractData';
import { mockChatHistory } from './data';
import { KOLProfile } from '@/types/profile';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessagingSkeleton } from './components/MessagingSkeleton';
import { useIsClient } from '@/hooks/useIsClient';

interface MessagingContainerProps {
    initialKolAddress?: `0x${string}`;
}

const DefaultChatView = () => (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <div className="flex flex-col items-center space-y-4 p-8 max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <MessageSquare size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700">
                Start a Conversation
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
                Select a KOL from the list or use the search bar to find someone specific. 
                Connect with thought leaders and start meaningful conversations.
            </p>
            <div className="text-xs text-gray-400 mt-4">
                Your messages are end-to-end encrypted
            </div>
        </div>
    </div>
);

export function MessagingContainer({ initialKolAddress }: MessagingContainerProps) {
    const [isRouteChanging, setIsRouteChanging] = useState(false);
    const [hasHistory, setHasHistory] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isChatMaximized, setIsChatMaximized] = useState(false);
    const isClient = useIsClient();
    const router = useRouter();

    const {
        searchQuery,
        setSearchQuery,
        filteredContacts
    } = useContacts();

    const {
        chatMessages,
        newMessage,
        setNewMessage,
        isLoading,
        selectedContact,
        isPanelClosing,
        handleContactClick: originalHandleContactClick,
        closeChat,
        handleSendMessage,
        shareConversationLink
    } = useChat({ initialMessages: mockChatHistory });

    const { profile: kolProfile, isLoading: isKolLoading } = useKOLProfileData(initialKolAddress);

    const {
        isMobile,
        containerRef,
        handleResizePanel,
        calculateWidths,
        initializeLayout,
        handlePanelClose,
        layoutMetrics,
        isClient: isLayoutClient
    } = useResponsiveLayout({
        initialChatPanelWidth: 60,
        minChatWidth: 35,
        maxChatWidth: 75,
        defaultMobileBreakpoint: 768
    });

    // Handle initialization
    useEffect(() => {
        if (!isClient) return;
        
        // Add a small delay to ensure smooth transition from skeleton
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [isClient]);

    const handleContactClick = useCallback((contact: KOLProfile) => {
        if (!isClient) return;
        setIsRouteChanging(true);
        setHasHistory(true);
        router.push(`/messages/${contact.wallet}`, { scroll: false });
    }, [router, isClient]);

    const handleCloseChat = useCallback(() => {
        if (!isClient) return;
        setIsRouteChanging(true);
        setIsChatMaximized(false);
        closeChat();
        setTimeout(() => {
            if (hasHistory) {
                router.back();
            } else {
                router.replace('/messages', { scroll: false });
            }
            
            setTimeout(() => {
                setIsRouteChanging(false);
            }, 50);
        }, 300);
    }, [router, hasHistory, closeChat, isClient]);

    useEffect(() => {
        if (initialKolAddress && kolProfile?.exists && isClient) {
            originalHandleContactClick(kolProfile);
            setIsRouteChanging(false);
            setHasHistory(false);
        }
    }, [initialKolAddress, kolProfile, originalHandleContactClick, isClient]);

    useEffect(() => {
        if (!isClient) return;
        const hasNavigationHistory = window.history.length > 1 && document.referrer.includes(window.location.host);
        setHasHistory(hasNavigationHistory);
    }, [isClient]);

    useEffect(() => {
        if (!isClient) return;
        let timeoutId: NodeJS.Timeout;
        if (isRouteChanging) {
            timeoutId = setTimeout(() => {
                setIsRouteChanging(false);
            }, 300);
        }
        return () => clearTimeout(timeoutId);
    }, [isRouteChanging, isClient]);

    useEffect(() => {
        if (isClient && isLayoutClient) {
            initializeLayout();
        }
    }, [initializeLayout, isClient, isLayoutClient]);

    const { chatPanelPixelWidth, contactListPixelWidth } = calculateWidths();

    const handleResize = useCallback((newWidth: number) => {
        if (!isClient) return;
        handleResizePanel({ width: newWidth, height: 0 });
    }, [handleResizePanel, isClient]);

    // Show skeleton during initialization or SSR
    if (!isClient || isInitializing) {
        return (
            <div className="h-screen flex flex-col">
                <div className="shadow-sm py-4 px-6">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse" />
                </div>
                <MessagingSkeleton className="flex-1" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            <div className="shadow-sm py-4 px-6">
                <h1 className="text-2xl font-bold text-gray-800">connections marketplace</h1>
                <p className="text-gray-500">connect with KOLs securely</p>
            </div>
            
            <div 
                ref={containerRef} 
                className={cn(
                    "flex-1 flex rounded-lg overflow-hidden shadow-sm relative bg-white",
                    layoutMetrics.isResizing && "select-none",
                    isChatMaximized && "fixed inset-0 z-40"
                )}
            >
                {/* Contact list container */}
                <div 
                    className={cn(
                        "h-full border-r border-gray-200",
                        isMobile && "w-full",
                        layoutMetrics.isResizing && "pointer-events-none",
                        isChatMaximized && "hidden"
                    )}
                    style={{ 
                        width: isMobile ? '100%' : `${contactListPixelWidth}px`,
                        display: isMobile && selectedContact ? 'none' : 'block'
                    }}
                >
                    <ContactList 
                        contacts={filteredContacts}
                        selectedContactId={selectedContact?.wallet}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onContactSelect={handleContactClick}
                        width="100%"
                    />
                </div>
                
                {/* Resize handle - only visible in desktop view */}
                {!isMobile && !layoutMetrics.isPanelClosing && !isChatMaximized && (
                    <ResizeHandle 
                        containerWidth={chatPanelPixelWidth}
                        onResize={handleResize}
                        minWidth={layoutMetrics.availableWidth * 0.35}
                        maxWidth={layoutMetrics.availableWidth * 0.75}
                        className={cn(
                            "hover:bg-primary/20 active:bg-primary/40",
                            layoutMetrics.isResizing && "bg-primary/40"
                        )}
                    />
                )}
                
                {/* Chat panel */}
                <div 
                    className={cn(
                        "h-full bg-gray-50",
                        isMobile && "fixed inset-0 z-50",
                        layoutMetrics.isResizing && "pointer-events-none",
                        isChatMaximized && "fixed inset-0 z-50"
                    )}
                    style={{ 
                        width: isMobile ? '100%' : `${chatPanelPixelWidth}px`,
                        display: isMobile && !selectedContact ? 'none' : 'block',
                        position: isChatMaximized ? 'fixed' : 'relative',
                        top: isChatMaximized ? 0 : 'auto',
                        left: isChatMaximized ? 0 : 'auto',
                        right: isChatMaximized ? 0 : 'auto',
                        bottom: isChatMaximized ? 0 : 'auto'
                    }}
                >
                    {selectedContact ? (
                        <ChatPanel 
                            contact={selectedContact}
                            messages={chatMessages[selectedContact.wallet] || []}
                            newMessage={newMessage}
                            isLoading={isLoading || isKolLoading}
                            isMobile={isMobile}
                            onClose={handleCloseChat}
                            onMessageChange={setNewMessage}
                            onSendMessage={handleSendMessage}
                            onShare={() => shareConversationLink(selectedContact)}
                            width="100%" 
                        />
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="flex-none p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
                                    <div className="w-8 h-8" /> {/* Spacer for alignment */}
                                </div>
                            </div>
                            <DefaultChatView />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}