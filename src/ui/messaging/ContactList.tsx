"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { ContactItem, Contact } from './ContactItem';

interface ContactListProps {
    contacts: Contact[];
    selectedContactId?: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onContactSelect: (contact: Contact) => void;
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
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="search KOLs..." 
                        className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {contacts.length > 0 ? (
                    contacts.map(contact => (
                        <ContactItem 
                            key={contact.id} 
                            contact={contact} 
                            active={selectedContactId === contact.id}
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