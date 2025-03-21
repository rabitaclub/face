"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { createAvatar } from '@dicebear/core';
import { identicon, bottts, micah, avataaars, lorelei } from '@dicebear/collection';
import { Resizable } from 're-resizable';

// Import UI components
import { ContactList } from './ContactList';
import { ChatPanel } from './ChatPanel';
import { Contact } from './ContactItem';
import { Message } from './Message';
import { mockContacts, mockChatHistory } from './data';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { useRouter } from 'next/navigation';

// Avatar style options for generating new avatars
type AvatarStyle = 'identicon' | 'bottts' | 'micah' | 'avataaars' | 'lorelei';

export function MessagingContainer() {
    const { isConnected } = useActiveWallet()
    const router = useRouter()
    // States for the messaging UI
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [chatVisible, setChatVisible] = useState<boolean>(false);
    const [isPanelClosing, setIsPanelClosing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [newMessage, setNewMessage] = useState<string>('');
    const [chatMessages, setChatMessages] = useState(mockChatHistory);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [chatPanelWidth, setChatPanelWidth] = useState<number>(65); // Default percentage of container
    const [contacts, setContacts] = useState<Contact[]>(mockContacts);
    
    // Reference for the container to detect its width
    const containerRef = useRef<HTMLDivElement>(null);
    const { width: containerWidth } = useResizeDetector({ targetRef: containerRef });
    const actualContainerWidth = containerWidth || 1000; // Fallback value for calculations
    
    // Calculate pixel widths based on percentages and container size
    const chatPanelPixelWidth = chatVisible 
        ? isMobile 
            ? actualContainerWidth 
            : Math.round(actualContainerWidth * chatPanelWidth / 100)
        : 0;
        
    const contactListPixelWidth = isMobile 
        ? chatVisible ? 0 : actualContainerWidth
        : actualContainerWidth - chatPanelPixelWidth;
    
    // Effect to check if we're on mobile or desktop
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth < 768;
            setIsMobile(newIsMobile);
            
            // Reset chat panel width when switching between mobile and desktop
            if (newIsMobile && chatPanelWidth !== 100) {
                setChatPanelWidth(100);
            } else if (!newIsMobile && chatPanelWidth === 100) {
                setChatPanelWidth(65);
            }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [chatPanelWidth]);
    
    // Helper to format wallet address for display
    const formatWalletAddress = (address: string): string => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };
    
    // Generate avatar using DiceBear
    const generateAvatar = async (walletAddress: string, style: AvatarStyle = 'identicon'): Promise<string> => {
        let avatar;
        
        switch (style) {
            case 'identicon':
                avatar = createAvatar(identicon, {
                    seed: walletAddress,
                    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
                });
                break;
            case 'bottts':
                avatar = createAvatar(bottts, {
                    seed: walletAddress,
                    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
                });
                break;
            case 'micah':
                avatar = createAvatar(micah, {
                    seed: walletAddress,
                    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc'],
                });
                break;
            case 'avataaars':
                avatar = createAvatar(avataaars, {
                    seed: walletAddress,
                    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9'],
                });
                break;
            case 'lorelei':
                avatar = createAvatar(lorelei, {
                    seed: walletAddress
                });
                break;
            default:
                avatar = createAvatar(identicon, {
                    seed: walletAddress
                });
        }
        
        return avatar.toDataUri();
    };
    
    // Function to add a new contact with wallet address
    const addNewContact = async (walletAddress: string, style: AvatarStyle = 'identicon') => {
        // Simple validation for Ethereum address
        if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            console.error('Invalid wallet address');
            return;
        }
        
        const avatarUri = await generateAvatar(walletAddress, style);
        
        const newContact: Contact = {
            id: contacts.length + 1,
            name: formatWalletAddress(walletAddress),
            walletAddress: walletAddress,
            avatar: avatarUri,
            status: 'offline',
            lastMessage: 'New contact added',
            lastMessageTime: 'Just now'
        };
        
        setContacts(prevContacts => [...prevContacts, newContact]);
    };
    
    // Filter contacts based on search query
    const filteredContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        contact.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Handle contact selection
    const handleContactClick = useCallback((contact: Contact) => {
        setIsPanelClosing(false);
        setIsLoading(true);
        setSelectedContact(contact);
        setChatVisible(true);
        
        // Simulate network delay
        setTimeout(() => {
            setIsLoading(false);
        }, 300);
    }, []);
    
    // Close the chat panel with animation
    const closeChat = useCallback(() => {
        setIsPanelClosing(true);
        
        // Wait for the animation to complete before actually removing the component
        setTimeout(() => {
            setChatVisible(false);
            setIsPanelClosing(false);
        }, 250); // Slightly shorter duration for more responsive feel
    }, []);
    
    // Handle message sending
    const handleSendMessage = useCallback(() => {
        if (!newMessage.trim() || !selectedContact) return;
        
        // Create a new message
        const message: Message = {
            id: Date.now(),
            senderId: 0, // Current user
            text: newMessage,
            timestamp: new Date(),
            delivered: true
        };
        
        // Update the chat messages
        setChatMessages(prevMessages => {
            const contactId = selectedContact.id;
            const existingMessages = prevMessages[contactId] || [];
            
            return {
                ...prevMessages,
                [contactId]: [...existingMessages, message]
            };
        });
        
        // Simulate a reply after a short delay
        if (Math.random() > 0.3) {
            setTimeout(() => {
                const replies = [
                    "Thanks for your message! I'll get back to you soon.",
                    "I'll look into this and get back to you.",
                    "Got it, thanks for letting me know.",
                    "I appreciate the update. Let me check on this.",
                    "Thanks for the information. I'll process this right away."
                ];
                
                const reply: Message = {
                    id: Date.now() + 1,
                    senderId: selectedContact.id,
                    text: replies[Math.floor(Math.random() * replies.length)],
                    timestamp: new Date(Date.now() + 10000) // Add 10 seconds to simulate delay
                };
                
                setChatMessages(prevMessages => {
                    const contactId = selectedContact.id;
                    const existingMessages = prevMessages[contactId] || [];
                    
                    return {
                        ...prevMessages,
                        [contactId]: [...existingMessages, reply]
                    };
                });
            }, 1500);
        }
        
        setNewMessage('');
    }, [newMessage, selectedContact]);
    
    // Handle resize with direct calculations 
    const handleResizePanel = useCallback((size: { width: number, height: number }) => {
        if (isMobile) return; // No resize on mobile
        
        // Calculate percentage based on new width relative to container
        const newPercentage = Math.min(
            Math.max(
                (size.width / actualContainerWidth) * 100,
                40 // Minimum 40%
            ),
            80 // Maximum 80%
        );
        
        setChatPanelWidth(newPercentage);
    }, [actualContainerWidth, isMobile]);
    
    return (
        <>
            <div className=" shadow-sm py-4 px-6 mb-4 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-800">connections marketplace</h1>
                <p className="text-gray-500">connect with KOLs securely</p>
            </div>
            
            <div 
                ref={containerRef} 
                className="flex-1 flex rounded-lg overflow-hidden  shadow-sm relative"
                style={{ minHeight: '500px' }}
            >
                {/* Contact list container with dynamic width */}
                <div 
                    className="h-full"
                    style={{ 
                        width: `${contactListPixelWidth}px`,
                        transition: 'width 250ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
                        overflow: 'hidden'
                    }}
                >
                    <ContactList 
                        contacts={filteredContacts}
                        selectedContactId={selectedContact?.id}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onContactSelect={handleContactClick}
                        width="100%"
                    />
                </div>
                
                {/* Divider with resize handle - only visible when chat is open on desktop */}
                {chatVisible && !isMobile && (
                    <div 
                        className="w-1 h-full bg-gray-200 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors"
                        style={{ position: 'relative', zIndex: 10 }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            
                            // Initial position
                            const startX = e.clientX;
                            const startWidth = chatPanelPixelWidth;
                            
                            // Mouse move handler
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const newWidth = Math.max(
                                    Math.min(
                                        startWidth - deltaX, 
                                        actualContainerWidth * 0.8
                                    ), 
                                    actualContainerWidth * 0.4
                                );
                                
                                setChatPanelWidth((newWidth / actualContainerWidth) * 100);
                            };
                            
                            // Mouse up handler
                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            // Add event listeners
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    ></div>
                )}
                
                {/* Chat panel container with dynamic width */}
                {chatVisible && selectedContact && (
                    <div 
                        className={`h-full ${isMobile ? 'absolute top-0 right-0 left-0 bottom-0 z-10' : ''}`}
                        style={{ 
                            width: `${chatPanelPixelWidth}px`,
                            transition: 'width 250ms cubic-bezier(0.25, 0.1, 0.25, 1.0), opacity 250ms ease-in-out',
                            opacity: isPanelClosing ? 0 : 1
                        }}
                    >
                        <ChatPanel 
                            contact={selectedContact}
                            messages={chatMessages[selectedContact.id] || []}
                            newMessage={newMessage}
                            isLoading={isLoading}
                            isMobile={isMobile}
                            onClose={closeChat}
                            onMessageChange={setNewMessage}
                            onSendMessage={handleSendMessage}
                            width="100%" 
                        />
                    </div>
                )}
            </div>
        </>
    );
} 