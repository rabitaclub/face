'use client';

import React, { useState, useEffect } from 'react';
import { ContactList } from '@/ui/messaging/ContactList';
import { ChatWindow } from '@/ui/messaging/ChatWindow';
import { Contact } from '@/ui/messaging/ContactItem';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function MessagingPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Use our custom hook for responsive design
    const isMobileView = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        setIsMobile(isMobileView);
    }, [isMobileView]);

    // Handle contact selection
    const handleContactSelect = (contact: Contact) => {
        setSelectedContact(contact);
        if (isMobile) {
            setShowChat(true);
        }
    };

    // Handle back button in mobile view
    const handleBack = () => {
        setShowChat(false);
    };

    // Filter contacts based on search query
    const filteredContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.handle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-4rem)] flex">
            {/* Contact List - Hidden on mobile when chat is shown */}
            <div className={`${isMobile && showChat ? 'hidden' : 'block'} flex-1 md:flex-none md:w-80`}>
                <ContactList
                    contacts={filteredContacts}
                    selectedContactId={selectedContact?.id}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onContactSelect={handleContactSelect}
                    width={isMobile ? '100%' : '320px'}
                />
            </div>

            {/* Chat Window - Full width on mobile when shown */}
            <div className={`${isMobile && !showChat ? 'hidden' : 'block'} flex-1`}>
                {selectedContact ? (
                    <ChatWindow
                        contact={selectedContact}
                        onBack={isMobile ? handleBack : undefined}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Select a contact to start messaging
                    </div>
                )}
            </div>
        </div>
    );
} 