"use client";

import React from 'react';
import { KOLProfile } from '@/types/profile';
import SecureImage from '@/components/SecureImage';

interface ContactItemProps {
    contact: KOLProfile;
    active?: boolean;
    onClick: (contact: KOLProfile) => void;
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
    const statusColorClass = 'bg-gray-400';

    const renderAvatar = () => {
        return (
            <SecureImage
                encryptedData={contact.profileIpfsHash || ''}
                alt={contact.name}
                className="w-12 h-12 rounded-full object-cover"
            />
        );
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
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 truncate">{contact.handle}</p>
                </div>
            </div>
        </div>
    );
}; 