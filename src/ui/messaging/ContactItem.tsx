"use client";

import React, { useCallback, useEffect, useState } from 'react';
import SecureImage from '@/components/SecureImage';
import { useKOLProfileData } from '@/hooks/useContractData';
import { Message } from './Message';
import { useDecryptedMessage, useMessage, useMessaging } from '@/hooks/useMessaging';
import { decryptMessage } from '@/utils/encryption';
import { Loader2, User, Clock } from 'lucide-react';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { Address } from 'viem';
import { format } from 'date-fns';
import { useIsClient } from '@/hooks/useIsClient';
import { CountBadge } from '@/components/ui/CountBadge';

interface ContactItemProps {
    contact: Address;
    active?: boolean;
    lastMessage?: Message;
    isActive?: boolean;    
    onClick: (contact: Address) => void;
}

export const ContactItem: React.FC<ContactItemProps> = ({ 
    contact, 
    active = false, 
    lastMessage,
    isActive,
    onClick 
}) => {
    const { profile: {profileIpfsHash, name, handle, wallet} } = useKOLProfileData(contact);
    const { decryptedMessage, isLoading: isDecryptedMessageLoading } = useDecryptedMessage(lastMessage);
    const isClient = useIsClient();
    const { address } = useActiveWallet();
    const [formattedTimestamp, setFormattedTimestamp] = useState<string>('');

    const isExpired = !isActive;

    const needsReply = lastMessage && 
                       address && 
                       lastMessage.senderId !== address &&
                       lastMessage.kolProfile?.wallet === address;

    const renderAvatar = () => {
        return (
            <SecureImage
                encryptedData={profileIpfsHash || ''}
                alt={name || wallet.slice(0, 6)}
                className="w-12 h-12 rounded-full object-cover"
                width={48}
                height={48}
            />
        );
    };

    const handleItemClick = () => {
        onClick(contact);
    };

    useEffect(() => {
        if (lastMessage?.timestamp && isClient) {
            const timestamp = new Date(lastMessage.timestamp);
            const now = new Date();
            
            // Format timestamp based on how recent it is
            if (timestamp.toDateString() === now.toDateString()) {
                // If today, show time only
                setFormattedTimestamp(format(timestamp, 'HH:mm'));
            } else if (
                timestamp.getFullYear() === now.getFullYear() &&
                timestamp.getMonth() === now.getMonth() &&
                timestamp.getDate() === now.getDate() - 1
            ) {
                // If yesterday
                setFormattedTimestamp('Yesterday');
            } else if (
                timestamp.getFullYear() === now.getFullYear() &&
                now.getTime() - timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
            ) {
                // If within the last 7 days
                setFormattedTimestamp(format(timestamp, 'EEE'));
            } else {
                // Otherwise show date
                setFormattedTimestamp(format(timestamp, 'dd/MM/yyyy'));
            }
        }
    }, [lastMessage, isClient]);

    return (
        <div 
            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center border-b border-gray-100 ${active ? 'bg-blue-50' : ''} ${isExpired ? 'opacity-50' : ''}`}
            onClick={handleItemClick}
        >
            <div className="relative mr-4">
                {renderAvatar()}
            </div>

            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{name || `${wallet.slice(0, 6)}...${wallet.slice(-6)}`}</h3>
                    {lastMessage && (
                        <div className="flex items-center gap-2">
                            {needsReply && (
                                <CountBadge 
                                    count={1} 
                                    variant="destructive" 
                                    size="xs"
                                    compact={true}
                                    pulse={true} 
                                />
                            )}
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                {formattedTimestamp}
                            </span>
                            {isExpired && (
                                <div className="bg-amber-100 border border-amber-300 text-amber-800 rounded-full px-2 py-0.5 text-xs flex items-center shadow-sm">
                                    <Clock size={12} className="mr-1" />
                                    <span>Expired</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex-grow min-w-0">
                        <p className="text-xs text-gray-600 truncate mb-1">{handle}</p>
                        {decryptedMessage && (
                            <p className="text-sm text-gray-500 truncate mt-1">
                               {lastMessage?.senderId === address ? 'You: ' : ''} {decryptedMessage}
                            </p>
                        )}
                        {
                            !decryptedMessage && isDecryptedMessageLoading && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}; 