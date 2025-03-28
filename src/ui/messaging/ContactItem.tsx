"use client";

import React, { useCallback, useEffect, useState } from 'react';
import SecureImage from '@/components/SecureImage';
import { useKOLProfileData } from '@/hooks/useContractData';
import { Message } from './Message';
import { useMessage, useMessaging } from '@/hooks/useMessaging';
import { decryptMessage } from '@/utils/encryption';
import { Loader2, User } from 'lucide-react';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { Address } from 'viem';
interface ContactItemProps {
    contact: Address;
    active?: boolean;
    lastMessage?: Message;
    onClick: (contact: Address) => void;
}

export const ContactItem: React.FC<ContactItemProps> = ({ 
    contact, 
    active = false, 
    lastMessage,
    onClick 
}) => {
    const { profile: {profileIpfsHash, name, handle, wallet} } = useKOLProfileData(contact);
    const { data: message, isLoading: isMessageLoading, error: messageError } = useMessage(lastMessage?.text || '');
    const [ decryptedMessage, setDecryptedMessage ] = useState<string | null>(null);
    const { privateKey, checkExistingKeys } = useMessaging()
    const { address } = useActiveWallet()

    useEffect(() => {
        checkExistingKeys()
    }, [checkExistingKeys])

    const handleDecryptMessage = useCallback(async () => {
        if (message && privateKey && address && lastMessage) {
            console.debug(lastMessage)
            if (lastMessage?.senderId.toLowerCase() === address.toLowerCase() && message.userContent) {
                const decryptedMessage = await decryptMessage(message.userContent, privateKey);
                setDecryptedMessage(decryptedMessage);
            } else {
                const decryptedMessage = await decryptMessage(message.content, privateKey);
                setDecryptedMessage(decryptedMessage);
            }
        }
    }, [message, privateKey, address, lastMessage])

    useEffect(() => {
        handleDecryptMessage()
    }, [handleDecryptMessage])

    const renderAvatar = () => {
        return (
            !profileIpfsHash?.startsWith("https") ?
            <SecureImage
                encryptedData={profileIpfsHash || ''}
                alt={name || wallet.slice(0, 6)}
                className="w-12 h-12 rounded-full object-cover"
                width={48}
                height={48}
            />
            : <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={24} className="text-gray-400" />
            </div>
        );
    };

    const formatTimestamp = (timestamp: Date) => {
        const now = new Date();
        const messageDate = new Date(timestamp);
        const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 168) { // 7 days
            return messageDate.toLocaleDateString([], { weekday: 'short' });
        } else {
            return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div 
            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center border-b border-gray-100 ${active ? 'bg-blue-50' : ''}`}
            onClick={() => onClick(contact)}
        >
            <div className="relative mr-4">
                {renderAvatar()}
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{name || `${wallet.slice(0, 6)}...${wallet.slice(-6)}`}</h3>
                    {lastMessage && (
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTimestamp(lastMessage.timestamp)}
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex-grow min-w-0">
                        <p className="text-xs text-gray-600 truncate mb-1">{handle}</p>
                        {decryptedMessage && (
                            <p className="text-sm text-gray-500 truncate mt-1">
                                {decryptedMessage}
                            </p>
                        )}
                        {
                            !decryptedMessage && isMessageLoading && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}; 