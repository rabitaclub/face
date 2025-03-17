"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Paperclip, MoreVertical, Copy, ExternalLink, X } from 'lucide-react';
import { Contact } from './ContactItem';
import { Message, ChatMessage } from './Message';
import Image from 'next/image';

interface ChatPanelProps {
    contact: Contact;
    messages: Message[];
    newMessage: string;
    isLoading: boolean;
    isMobile: boolean;
    width: string;
    onClose: () => void;
    onMessageChange: (message: string) => void;
    onSendMessage: () => void;
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
}) => {
    // Refs for scrolling to the bottom when messages change
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [copyTooltip, setCopyTooltip] = useState<string>('Copy Address');
    
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
    
    // Render avatar image based on URL source
    const renderAvatar = () => {
        if (isExternalUrl(contact.avatar)) {
            return (
                <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                />
            );
        } else {
            return (
                <Image
                    src={contact.avatar}
                    alt={contact.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                />
            );
        }
    };
    
    // Copy wallet address to clipboard
    const copyWalletAddress = () => {
        navigator.clipboard.writeText(contact.walletAddress);
        setCopyTooltip('Copied!');
        setTimeout(() => setCopyTooltip('Copy Address'), 2000);
    };
    
    // View wallet on blockchain explorer
    const viewOnExplorer = () => {
        window.open(`https://etherscan.io/address/${contact.walletAddress}`, '_blank');
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
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                    contact.status === 'online' ? 'bg-green-500' : 
                                    contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`}></div>
                            </div>
                            <div className="ml-3">
                                <h2 className="font-semibold text-gray-900">{contact.name}</h2>
                                <span className="text-xs text-gray-500 capitalize">{contact.status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex">
                        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200">
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
                    <div className="flex-1 truncate font-mono">{contact.walletAddress}</div>
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
                        <button 
                            className="p-1 hover:text-blue-500 ml-1 relative group transition-colors duration-200"
                            onClick={viewOnExplorer}
                        >
                            <ExternalLink size={14} />
                            <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                View on Explorer
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Chat messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : messages.length > 0 ? (
                    messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            isMine={message.senderId === 0}
                            senderAvatar={message.senderId !== 0 ? contact.avatar : undefined}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p>No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-end">
                    <textarea
                        value={newMessage}
                        onChange={(e) => onMessageChange(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className={`flex-1 resize-none border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors duration-200 ${
                            isLoading ? 'bg-gray-100' : ''
                        }`}
                        disabled={isLoading}
                        rows={1}
                    ></textarea>
                    <button
                        onClick={onSendMessage}
                        disabled={!newMessage.trim() || isLoading}
                        className={`ml-2 p-3 rounded-full focus:outline-none transition-colors duration-200 ${
                            newMessage.trim() && !isLoading
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}; 