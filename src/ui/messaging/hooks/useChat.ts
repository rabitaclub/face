import { useState, useCallback, useMemo } from 'react';
import { Message } from '../types';
import { KOLProfile } from '@/types/profile';
import toast from 'react-hot-toast';

interface UseChatProps {
    initialMessages: Record<string, Message[]>;
}

interface UseChatReturn {
    chatMessages: Record<string, Message[]>;
    newMessage: string;
    setNewMessage: (message: string) => void;
    isLoading: boolean;
    selectedContact: KOLProfile | null;
    chatVisible: boolean;
    isPanelClosing: boolean;
    handleContactClick: (contact: KOLProfile) => void;
    closeChat: () => void;
    handleSendMessage: () => void;
    shareConversationLink: (contact: KOLProfile) => void;
}

export function useChat({ initialMessages }: UseChatProps): UseChatReturn {
    const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState<KOLProfile | null>(null);
    const [chatVisible, setChatVisible] = useState(false);
    const [isPanelClosing, setIsPanelClosing] = useState(false);

    const handleContactClick = useCallback((contact: KOLProfile) => {
        setSelectedContact(contact);
        setChatVisible(true);
        setIsPanelClosing(false);
    }, []);

    const closeChat = useCallback(() => {
        setIsPanelClosing(true);
        setTimeout(() => {
            setSelectedContact(null);
            setChatVisible(false);
            setIsPanelClosing(false);
        }, 250);
    }, []);

    const handleSendMessage = useCallback(() => {
        if (!newMessage.trim() || !selectedContact) return;

        setIsLoading(true);
        const message: Message = {
            id: Date.now(),
            senderId: 1, // Current user ID
            text: newMessage.trim(),
            timestamp: new Date(),
            delivered: false
        };

        setChatMessages(prev => ({
            ...prev,
            [selectedContact.wallet]: [...(prev[selectedContact.wallet] || []), message]
        }));

        setNewMessage('');
        setIsLoading(false);
    }, [newMessage, selectedContact]);

    const shareConversationLink = useCallback((contact: KOLProfile) => {
        const url = `${window.location.origin}/messages/${contact.wallet}`;
        navigator.clipboard.writeText(url);
    }, []);

    return {
        chatMessages,
        newMessage,
        setNewMessage,
        isLoading,
        selectedContact,
        chatVisible,
        isPanelClosing,
        handleContactClick,
        closeChat,
        handleSendMessage,
        shareConversationLink
    };
} 