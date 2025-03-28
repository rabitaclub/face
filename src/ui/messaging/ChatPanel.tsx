"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Copy, X, Share2, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { KOLProfile } from '@/types/profile';
import SecureImage from '@/components/SecureImage';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { useMessaging } from '@/hooks/useMessaging';
import TextareaAutosize from 'react-textarea-autosize';
import { useKOLProfileData } from '@/hooks/useContractData';
import { useConversation } from './hooks/useChat';
import { Message } from './Message';

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
    const [isMaximized, setIsMaximized] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const MAX_MESSAGE_SIZE = 2000; // Maximum message size in characters
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { profile: kolProfile, isKOL } = useKOLProfileData(contact.wallet)

    const {
        publicKey,
        generateKeys,
        isInitialized,
        isLoading: isKeysLoading,
        checkExistingKeys
    } = useMessaging()

    useEffect(() => {
        checkExistingKeys();
    }, [checkExistingKeys]);
    
    // Add new state for scroll visibility
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Enhanced scroll handling
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const bottomThreshold = scrollHeight - clientHeight - 100; // Show button when 100px from bottom
        setShowScrollBottom(scrollTop < bottomThreshold);
    }, []);

    // Improved scroll to bottom function
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    }, []);

    // Add scroll event listener
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            const container = messagesContainerRef.current;
            if (!container) return;

            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

            if (isNearBottom) {
                scrollToBottom('smooth');
            }
        }
    }, [messages, isLoading, scrollToBottom]);
    
    // Handle key presses
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            setCharCount(0);
            onSendMessage();
        }
    };
    
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setCharCount(newValue.length);
        onMessageChange(newValue);
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

    const toggleMaximize = useCallback(() => {
        setIsTransitioning(true);
        setIsMaximized(prev => !prev);
        
        // Handle body scroll lock
        if (!isMaximized) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Reset transition state after animation
        setTimeout(() => {
            setIsTransitioning(false);
        }, 300);
    }, [isMaximized]);

    // Cleanup body scroll lock on unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
        };
    }, []);
    
    return (
        <div
            className={cn(
                "h-full bg-white flex flex-col transition-all duration-300 ease-in-out",
                isMobile ? 'z-10' : 'relative',
                isMaximized && "fixed inset-0 z-50",
                isTransitioning && "pointer-events-none"
            )}
            style={{ 
                width: isMaximized ? '100vw' : width,
                height: isMaximized ? '100vh' : '100%',
                transform: isMaximized ? 'translate(0, 0)' : 'none',
                opacity: isTransitioning ? 0.8 : 1
            }}
        >
            {/* Chat header */}
            <div className="flex-none flex flex-col border-b border-gray-200">
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
                        <button
                            onClick={toggleMaximize}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200 relative group ml-2"
                            aria-label={isMaximized ? "Minimize chat" : "Maximize chat"}
                        >
                            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            <span className="absolute whitespace-nowrap right-0 top-full mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                {isMaximized ? "Minimize chat" : "Maximize chat"}
                            </span>
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
                
                <div className="p-3 flex items-center text-xs text-gray-500 bg-gray-50">
                    <div className="flex-1 truncate font-mono flex items-center">
                        {contact.wallet.slice(0, 6)}...{contact.wallet.slice(-6)}
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
                    <div className="flex ml-2">
                        { isKOL && <span className="mr-2 p-1">
                                Connect: <span className="font-bold">{contact.formattedFee}</span>
                            </span>
                        }
                    </div>
                </div>
            </div>
            
            {/* Updated messages container */}
            <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 relative scroll-smooth"
            >
                {messages?.map(message => (
                    <ChatMessage
                        key={message.id}
                        message={message}
                    />
                ))}
                <div ref={messagesEndRef} />

                {/* Floating scroll to bottom button */}
                {showScrollBottom && (
                    <div className="sticky bottom-4 right-0 flex justify-end pointer-events-none">
                        <button
                            onClick={() => scrollToBottom('smooth')}
                            className={cn(
                                "pointer-events-auto",
                                "p-2.5 rounded-full",
                                "bg-white/90 backdrop-blur-sm",
                                "shadow-lg hover:shadow-xl",
                                "text-gray-600 hover:text-gray-900",
                                "transition-all duration-200",
                                "transform hover:scale-105 active:scale-95",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                                "border border-gray-200/50"
                            )}
                            aria-label="Scroll to bottom"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M7 13l5 5 5-5" />
                                <path d="M7 6l5 5 5-5" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            
            {/* Message input */}
            <div className="flex-none p-4 border-t border-gray-200">
                { isInitialized && (publicKey !== null || publicKey !== "") && !isKeysLoading && <div className="flex flex-col gap-2">
                    <div className="relative">
                        <div className="flex-1 flex flex-col">
                            <div className="relative">
                                <TextareaAutosize
                                    ref={textareaRef}
                                    value={newMessage}
                                    onChange={handleMessageChange}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="w-full resize-none rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    minRows={1}
                                    maxRows={5}
                                    maxLength={MAX_MESSAGE_SIZE}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => {
                                onSendMessage();
                                setCharCount(0);
                            }}
                            disabled={!newMessage.trim() || isLoading || charCount > MAX_MESSAGE_SIZE}
                            className={cn(
                                "w-full p-2 rounded-lg transition-all duration-200",
                                "bg-primary text-dark hover:bg-primary/80",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "transform hover:scale-[1.02] active:scale-[0.98]",
                                "shadow-sm hover:shadow-md",
                                "flex items-center justify-center gap-2",
                                "font-medium text-sm"
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    <span>Send Message</span>
                                </>
                            )}
                        </button>
                        <div className="text-xs text-gray-500 text-right">
                            {charCount}/{MAX_MESSAGE_SIZE} characters
                            {charCount > MAX_MESSAGE_SIZE * 0.8 && charCount < MAX_MESSAGE_SIZE && " (Warning: Approaching limit)"}
                            {charCount >= MAX_MESSAGE_SIZE && " (Limit reached)"}
                        </div>
                    </div>
                </div>
                }
                { !isInitialized && <div className="flex items-center">
                    <button
                        onClick={generateKeys}
                        disabled={isKeysLoading}
                        className="ml-2 w-full rounded-full bg-primary p-2 text-dark hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {
                            isKeysLoading ? <Loader2 className="animate-spin mx-auto" /> : "Generate PGP Keys"
                        }
                    </button>
                </div>
                }
            </div>
        </div>
    );
};