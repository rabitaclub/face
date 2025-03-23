"use client";

import { useEffect, useCallback } from 'react';
import { ContactList } from './ContactList';
import { ChatPanel } from './ChatPanel';
import { ResizeHandle } from './components/ResizeHandle';
import { useContacts } from './hooks/useContacts';
import { useChat } from './hooks/useChat';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { useUrlSync } from './hooks/useUrlSync';
import { useKOLProfileData } from '@/hooks/useContractData';
import { mockChatHistory } from './data';
import { KOLProfile } from '@/types/profile';

interface MessagingContainerProps {
    initialKolAddress?: `0x${string}`;
}

export function MessagingContainer({ initialKolAddress }: MessagingContainerProps) {
    const {
        contacts,
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
        chatVisible,
        isPanelClosing,
        handleContactClick: originalHandleContactClick,
        closeChat,
        handleSendMessage,
        shareConversationLink
    } = useChat({ initialMessages: mockChatHistory });

    const { updateUrl } = useUrlSync();
    const { profile: kolProfile, isLoading: isKolLoading } = useKOLProfileData(initialKolAddress);

    const {
        isMobile,
        containerRef,
        handleResizePanel,
        calculateWidths
    } = useResponsiveLayout();

    // Enhanced contact click handler with URL sync
    const handleContactClick = useCallback((contact: KOLProfile) => {
        originalHandleContactClick(contact);
        updateUrl(contact.wallet);
    }, [originalHandleContactClick, updateUrl]);

    // Enhanced close chat handler with URL sync
    const handleCloseChat = useCallback(() => {
        closeChat();
        updateUrl(null);
    }, [closeChat, updateUrl]);
    
    // Effect to handle initial KOL address
    useEffect(() => {
        if (initialKolAddress && kolProfile?.exists) {
            handleContactClick(kolProfile);
        }
    }, [initialKolAddress, kolProfile, handleContactClick]);

    const { chatPanelPixelWidth, contactListPixelWidth } = calculateWidths(chatVisible);

    const handleResize = useCallback((newWidth: number) => {
        handleResizePanel({ width: newWidth, height: 0 });
    }, [handleResizePanel]);

    const containerWidth = containerRef.current?.clientWidth || 1000;
    const minWidth = containerWidth * 0.4;
    const maxWidth = containerWidth * 0.8;

    return (
        <>
            <div className="shadow-sm py-4 px-6 mb-4 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-800">connections marketplace</h1>
                <p className="text-gray-500">connect with KOLs securely</p>
            </div>
            
            <div 
                ref={containerRef} 
                className="flex-1 flex rounded-lg overflow-hidden shadow-sm relative"
            >
                {/* Contact list container with dynamic width */}
                <div 
                    className="h-full"
                    style={{ 
                        width: `${contactListPixelWidth}px`,
                        transition: 'opacity 250ms ease-in-out',
                        overflow: 'hidden'
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
                
                {/* Divider with resize handle - only visible when chat is open on desktop */}
                {chatVisible && !isMobile && (
                    <ResizeHandle 
                        containerWidth={chatPanelPixelWidth}
                        onResize={handleResize}
                        minWidth={minWidth}
                        maxWidth={maxWidth}
                    />
                )}
                
                {/* Chat panel container with dynamic width */}
                {chatVisible && selectedContact && (
                    <div 
                        className={`h-full ${isMobile ? 'absolute top-0 right-0 left-0 bottom-0 z-10' : ''}`}
                        style={{ 
                            width: `${chatPanelPixelWidth}px`,
                            transition: 'opacity 250ms ease-in-out',
                            opacity: isPanelClosing ? 0 : 1
                        }}
                    >
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
                    </div>
                )}
            </div>
        </>
    );
}