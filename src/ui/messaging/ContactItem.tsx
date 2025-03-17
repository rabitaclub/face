"use client";

import React from 'react';
import Image from 'next/image';

export interface Contact {
    id: number;
    name: string;
    avatar: string;
    walletAddress: string;
    status: 'online' | 'offline' | 'away';
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
}

interface ContactItemProps {
    contact: Contact;
    active?: boolean;
    onClick: (contact: Contact) => void;
}

// Helper to check if URL is external
const isExternalUrl = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
};

export const ContactItem: React.FC<ContactItemProps> = ({ 
    contact, 
    active = false, 
    onClick 
}) => {
    const statusColorClass = {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        away: 'bg-yellow-500'
    }[contact.status];

    // Render avatar image based on URL source
    const renderAvatar = () => {
        if (isExternalUrl(contact.avatar)) {
            return (
                <img 
                    src={contact.avatar} 
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover"
                />
            );
        } else {
            return (
                <Image 
                    src={contact.avatar} 
                    alt={contact.name} 
                    width={48} 
                    height={48} 
                    className="rounded-full"
                />
            );
        }
    };

    return (
        <div 
            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center border-b border-gray-100 ${active ? 'bg-blue-50' : ''}`}
            onClick={() => onClick(contact)}
        >
            <div className="relative mr-4">
                {renderAvatar()}
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColorClass}`}></div>
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{contact.name}</h3>
                    {contact.lastMessageTime && (
                        <span className="text-xs text-gray-500">{contact.lastMessageTime}</span>
                    )}
                </div>
                {contact.lastMessage && (
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                        {contact.unreadCount && contact.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs ml-2">
                                {contact.unreadCount}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}; 