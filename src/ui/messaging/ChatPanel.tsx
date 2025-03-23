"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Paperclip, MoreVertical, Copy, ExternalLink, X, Share2 } from 'lucide-react';
import { KOLProfile } from '@/types/profile';
import { Message } from './types';
import SecureImage from '@/components/SecureImage';

interface ChatPanelProps {
    contact: KOLProfile;
    messages: Message[];
    newMessage: string;
    isLoading: boolean;
    isMobile: boolean;
    width: string;
    onClose: () => void;
    onMessageChange: (message: string) => void;
    onSendMessage: () => void;
    onShare: () => void;
}

// Helper to check if URL is external
const isExternalUrl = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
    contact,
    messages,
    newMessage,
    isLoading,
    isMobile,
    width,
    onClose,
    onMessageChange,
    onSendMessage,
    onShare,
}) => {
    // Refs for scrolling to the bottom when messages change
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [copyTooltip, setCopyTooltip] = useState<string>('Copy');
    
    // Scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);
    
    useEffect(() => {
        if (!isLoading) {
            scrollToBottom();
        }
    }, [messages, isLoading, scrollToBottom]);
    
    // Handle key presses
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };
    
    const renderAvatar = () => {
        return (
            <SecureImage
                encryptedData={contact.profileIpfsHash || ''}
                alt={contact.name}
                className="w-10 h-10 rounded-full object-cover"
                width={40}
                height={40}
            />
        );
    };
    
    const copyWalletAddress = () => {
        navigator.clipboard.writeText(contact.wallet);
        setCopyTooltip('Copied!');
        setTimeout(() => setCopyTooltip('Copy Address'), 2000);
    };
    
    return (
        <div
            className={`h-full bg-white flex flex-col ${
                isMobile ? 'z-10' : 'relative'
            }`}
            style={{ width }}
        >
            {/* Chat header */}
            <div className="flex flex-col border-b border-gray-200">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                        {isMobile && (
                            <button
                                onClick={onClose}
                                className="mr-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="flex items-center">
                            <div className="relative">
                                {renderAvatar()}
                                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-gray-400"></div>
                            </div>
                            <div className="ml-3">
                                <h2 className="font-semibold text-gray-900">{contact.name}</h2>
                                <span className="text-xs text-gray-500">{contact.handle}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button 
                            onClick={onShare}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200 relative group"
                        >
                            <Share2 size={18} />
                            <span className="absolute whitespace-nowrap right-0 top-full mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                Share conversation
                            </span>
                        </button>
                        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full ml-1 transition-colors duration-200">
                            <Paperclip size={18} />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full ml-1 transition-colors duration-200">
                            <MoreVertical size={18} />
                        </button>
                        {!isMobile && (
                            <button 
                                onClick={onClose}
                                className="p-2 text-gray-500 hover:text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 rounded-full ml-2 transition-colors duration-200 relative group"
                                aria-label="Close chat"
                            >
                                <X size={18} strokeWidth={2.5} />
                                <span className="absolute whitespace-nowrap right-0 top-full mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    Close chat
                                </span>
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Wallet address information */}
                <div className="px-4 pb-3 flex items-center text-xs text-gray-500 bg-gray-50">
                    <div className="flex-1 truncate font-mono">{contact.wallet.slice(0, 6)}...{contact.wallet.slice(-6)}</div>
                    <div className="flex ml-2">
                        <button 
                            className="p-1 hover:text-blue-500 relative group transition-colors duration-200" 
                            onClick={copyWalletAddress}
                        >
                            <Copy size={14} />
                            <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                {copyTooltip}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`mb-4 flex ${
                            message.senderId === 1 ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                                message.senderId === 1
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                            <p className="text-sm">{message.text}</p>
                            <span className="text-xs opacity-75 mt-1 block">
                                {message.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
                <div className="flex items-center">
                    <textarea
                        value={newMessage}
                        onChange={(e) => onMessageChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 resize-none rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={1}
                    />
                    <button
                        onClick={onSendMessage}
                        disabled={!newMessage.trim() || isLoading}
                        className="ml-2 rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}; 