"use client";

import React from 'react';
import { ContactItem } from './ContactItem';
import { KOLProfile } from '@/types/profile';
import KolSearchBar from '@/components/KolSearch/KolSearchBar';

interface ContactListProps {
    contacts: KOLProfile[];
    selectedContactId?: string;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onContactSelect: (contact: KOLProfile) => void;
    width?: string;
}

export const ContactList: React.FC<ContactListProps> = ({
    contacts,
    selectedContactId,
    searchQuery,
    onSearchChange,
    onContactSelect,
    width = '100%'
}) => {
    return (
        <div 
            className="h-full flex flex-col overflow-hidden border-r border-gray-200"
            style={{ width, transition: 'width 0.3s ease-in-out' }}
        >
            <div className="p-4 border-b border-gray-100">
                <KolSearchBar 
                    className="w-full"
                    placeholderText="search KOLs..."
                    onProfileSelect={onContactSelect}
                />
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {contacts.length > 0 ? (
                    contacts.map(contact => (
                        <ContactItem 
                            key={contact.wallet} 
                            contact={contact} 
                            active={selectedContactId === contact.wallet}
                            onClick={onContactSelect}
                        />
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-500">
                        no connections found
                        <br />
                        search & connect with a KOL to start messaging
                    </div>
                )}
            </div>
        </div>
    );
}; 