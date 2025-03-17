"use client";

import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import Image from 'next/image';

export interface Message {
    id: number;
    senderId: number;
    text: string;
    timestamp: Date;
    read?: boolean;
    delivered?: boolean;
}

interface MessageProps {
    message: Message;
    isMine: boolean;
    senderAvatar?: string;
}

// Helper to check if URL is external
const isExternalUrl = (url: string | undefined): boolean => {
    return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')));
};

export const ChatMessage: React.FC<MessageProps> = ({ message, isMine, senderAvatar }) => {
    const timeString = format(new Date(message.timestamp), 'HH:mm');
    
    // Render avatar image based on URL source
    const renderAvatar = () => {
        if (!senderAvatar) return null;
        
        if (isExternalUrl(senderAvatar)) {
            return (
                <img 
                    src={senderAvatar} 
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                />
            );
        } else {
            return (
                <Image 
                    src={senderAvatar} 
                    alt="avatar" 
                    width={32} 
                    height={32} 
                    className="rounded-full"
                />
            );
        }
    };
    
    return (
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
            {!isMine && senderAvatar && (
                <div className="mr-2 flex-shrink-0">
                    {renderAvatar()}
                </div>
            )}
            <div className={`max-w-[70%] ${isMine ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-2xl px-4 py-2`}>
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                <div className={`text-xs mt-1 flex items-center justify-end ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span>{timeString}</span>
                    {isMine && (
                        <span className="ml-1">
                            {message.read ? (
                                <CheckCheck size={14} />
                            ) : message.delivered ? (
                                <Check size={14} />
                            ) : null}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}; 