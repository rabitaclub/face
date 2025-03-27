import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { KOLProfile } from '@/types/profile';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import RABITA_MESSAGING_ABI from '@/config/messaging.abi.json';
import { env } from '@/config/env';
import { Address } from 'viem';
import { encryptMessage } from '@/utils/encryption';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { Message } from '../Message';
import { useMessaging } from '@/hooks/useMessaging';

const RABITA_MESSAGING_ADDRESS = env.RABITA_MESSAGING_ADDRESS as Address;
const PANEL_CLOSE_DELAY = 250;

interface UseChatProps {
    initialKolAddress?: `0x${string}`;
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

export function useChat(): UseChatReturn {
    const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState<KOLProfile | null>(null);
    const [chatVisible, setChatVisible] = useState(false);
    const [isPanelClosing, setIsPanelClosing] = useState(false);
    const { address } = useActiveWallet();
    const closeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleContactClick = useCallback((contact: KOLProfile): void => {
        setSelectedContact(contact);
        setChatVisible(true);
        setIsPanelClosing(false);
    }, []);

    const closeChat = useCallback((): void => {
        setIsPanelClosing(true);
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        closeTimeoutRef.current = setTimeout(() => {
            setSelectedContact(null);
            setChatVisible(false);
            setIsPanelClosing(false);
        }, PANEL_CLOSE_DELAY);
    }, []);

    const handleSendMessage = useCallback(() => {
        if (!newMessage.trim() || !selectedContact || !address) return;

        setIsLoading(true);
        const message: Message = {
            id: Date.now(),
            senderId: address,
            receiverId: selectedContact.wallet,
            text: newMessage.trim(),
            timestamp: new Date(),
            kolProfile: selectedContact,
            delivered: false,
            isTransactionProcessed: false
        };

        setChatMessages(prev => ({
            ...prev,
            [selectedContact.wallet]: [...(prev[selectedContact.wallet] || []), message]
        }));

        setNewMessage('');
        setIsLoading(false);
    }, [newMessage, selectedContact, address]);

    const shareConversationLink = useCallback((contact: KOLProfile) => {
        const url = `${window.location.origin}/messages/${contact.wallet}`;
        navigator.clipboard.writeText(url).catch(console.error);
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return useMemo(() => ({
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
    }), [
        chatMessages,
        newMessage,
        isLoading,
        selectedContact,
        chatVisible,
        isPanelClosing,
        handleContactClick,
        closeChat,
        handleSendMessage,
        shareConversationLink
    ]);
}

interface UseChatMessageReturn {
    chatStatus: string | undefined;
    isMessageSent: boolean;
    isTxnLoading: boolean;
    status: string | undefined;
    error: Error | null;
}

export const useChatMessage = (message: Message): UseChatMessageReturn => {
    const [isMessageSent, setIsMessageSent] = useState(false);
    const [isIPFSUploaded, setIsIPFSUploaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ipfsHash, setIpfsHash] = useState('');
    const { writeContractAsync } = useWriteContract();
    const [isInTransaction, setIsInTransaction] = useState(false);
    const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>(undefined);
    const [chatStatus, setChatStatus] = useState<string | undefined>(undefined);
    const abortControllerRef = useRef<AbortController | undefined>(undefined);
    const { checkExistingKeys, publicKey: userPGPKey } = useMessaging()

    useEffect(() => {
        checkExistingKeys()
    }, [checkExistingKeys])

    const { status, isSuccess, isError, error, isLoading: isTxnLoading } = useWaitForTransactionReceipt({
        hash: transactionHash
    });

    useEffect(() => {
        if (isSuccess) {
            setIsMessageSent(true);
        }
        if (isError) {
            console.error('Transaction error:', error);
        }
    }, [isSuccess, isError, error]);

    const handleIPFSUpload = useCallback(async () => {
        if (!message.kolProfile.pgpKey?.publicKey || !userPGPKey) {
            setChatStatus("Error: Missing encryption key");
            return;
        }

        setChatStatus("Preparing message...");
        setIsLoading(true);
        
        try {
            const encryptedMessage = await encryptMessage(message.text, message.kolProfile.pgpKey.publicKey);
            const userEncryptedMessage = await encryptMessage(message.text, userPGPKey);
            const jsonBody = {
                content: encryptedMessage,
                userContent: userEncryptedMessage,
                metadata: {
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    kolProfile: message.kolProfile.pgpKey.publicKey
                }
            };

            const response = await fetch('/api/ipfs/send', {
                method: 'POST',
                body: JSON.stringify(jsonBody),
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: abortControllerRef.current?.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as {
                success: boolean;
                messageId: string;
                gatewayUrl: string;
                timestamp: string;
            };

            if (data.gatewayUrl) {
                setIsIPFSUploaded(true);
                setIpfsHash(data.gatewayUrl);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Upload aborted');
                return;
            }
            console.error('IPFS upload error:', error);
            setChatStatus("Error preparing message");
        } finally {
            setIsLoading(false);
        }
    }, [message, userPGPKey]);

    const handleContractCall = useCallback(async () => {
        if (!isIPFSUploaded || !message.kolProfile.pgpKey?.publicKey || !message.kolProfile.pgpKey?.pgpNonce) return;

        setChatStatus("Sending message...");
        setIsInTransaction(true);
        
        try {
            const tx = await writeContractAsync({
                address: RABITA_MESSAGING_ADDRESS,
                abi: RABITA_MESSAGING_ABI,
                functionName: 'sendEncryptedMessage',
                args: [
                    message.kolProfile.wallet,
                    message.kolProfile.pgpKey.publicKey,
                    message.kolProfile.pgpKey.pgpNonce,
                    ipfsHash
                ],
                value: message.kolProfile.fee
            });
            
            setTransactionHash(tx);
            setChatStatus("Message sent");
        } catch (error) {
            console.error('Contract call error:', error);
            setChatStatus("Error sending message");
        } finally {
            setIsLoading(false);
            setIsInTransaction(false);
        }
    }, [isIPFSUploaded, writeContractAsync, message, ipfsHash]);

    useEffect(() => {
        abortControllerRef.current = new AbortController();
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!isIPFSUploaded) {
            handleIPFSUpload();
        }
    }, [handleIPFSUpload, isIPFSUploaded]);

    useEffect(() => {
        if (isIPFSUploaded && !isInTransaction && !isTxnLoading && !isMessageSent) {
            handleContractCall();
        }
    }, [isIPFSUploaded, handleContractCall, isInTransaction, isTxnLoading, isMessageSent]);

    return useMemo(() => ({
        chatStatus,
        isMessageSent,
        isTxnLoading: isTxnLoading || isIPFSUploaded || isLoading || isInTransaction,
        status,
        error
    }), [chatStatus, isMessageSent, isTxnLoading, status, error, isIPFSUploaded, isLoading, isInTransaction]);
};
