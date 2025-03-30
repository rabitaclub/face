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
import { RABITA_CONVERSATION_QUERY } from '@/config/graph.queries';
import { useGraphQuery } from '@/hooks/useGraphQuery';
import { GraphQLResponse } from '../types';
import { usePGPKeys } from './usePGPKeys';

const RABITA_MESSAGING_ADDRESS = env.RABITA_MESSAGING_ADDRESS as Address;
const PANEL_CLOSE_DELAY = 250;

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
    const { messages: fetchedMessages, isFetchingMessages, error } = useConversation(selectedContact);
    const [replyToMessageId, setReplyToMessageId] = useState<number | null>(null);

    useEffect(() => {
        if (fetchedMessages && !isFetchingMessages && !error) {
            setChatMessages(prev => ({
                ...prev,
                [selectedContact?.wallet || '']: fetchedMessages
            }));
        }
    }, [fetchedMessages, selectedContact, setChatMessages, isFetchingMessages, error]);

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
            id: -1,
            senderId: address,
            receiverId: selectedContact.wallet,
            text: newMessage.trim(),
            timestamp: new Date(),
            kolProfile: selectedContact,
            delivered: false,
            isTransactionProcessed: false
        };

        setChatMessages(prev => {
            const currentMessages = prev[selectedContact.wallet] || [];
            const lastMessage = currentMessages[currentMessages.length - 1];
            const replyToMessageId = lastMessage?.id ?? -1;

            const newMessage = {
                ...message,
                id: replyToMessageId
            };

            return {
                ...prev,
                [selectedContact.wallet]: [...currentMessages, newMessage]
            };
        });

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
    retrySendMessage: () => void;
}

export const useChatMessage = (message: Message): UseChatMessageReturn => {
    const [isMessageSent, setIsMessageSent] = useState(false);
    const [isIPFSUploaded, setIsIPFSUploaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ipfsHash, setIpfsHash] = useState('');
    const [isErrorInCall, setIsErrorInCall] = useState(false);
    const { writeContractAsync } = useWriteContract();
    const [isInTransaction, setIsInTransaction] = useState(false);
    const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>(undefined);
    const [chatStatus, setChatStatus] = useState<string | undefined>(undefined);
    const abortControllerRef = useRef<AbortController | undefined>(undefined);
    const { checkExistingKeys, publicKey: userPGPKey } = useMessaging()

    const { publicKey: receiverPGPKey, pgpNonce: kolPGPNonce, isLoadingPGPKeys } = usePGPKeys(message.kolProfile.wallet);

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
            setIsErrorInCall(true);
        }
    }, [isSuccess, isError, error]);

    const handleIPFSUpload = useCallback(async () => {
        if (!message.kolProfile.pgpKey?.publicKey || !userPGPKey) {
            setChatStatus("Error: Missing encryption key");
            setIsErrorInCall(true);
            return;
        }

        setChatStatus("Preparing message...");
        setIsLoading(true);
        
        try {
            let pgpPublicKey = message.kolProfile?.pgpKey?.publicKey !== "0x" ? message.kolProfile?.pgpKey?.publicKey : receiverPGPKey;
            // console.debug('receiverPGPKey', receiverPGPKey, kolPGPNonce, message.kolProfile?.pgpKey?.publicKey);
            if (!pgpPublicKey) {
                setChatStatus("Error: Missing encryption key");
                setIsErrorInCall(true);
                return;
            }
            const encryptedMessage = await encryptMessage(message.text, pgpPublicKey);
            const userEncryptedMessage = await encryptMessage(message.text, userPGPKey);
            const jsonBody = {
                content: encryptedMessage,
                userContent: userEncryptedMessage,
                metadata: {
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    kolProfile: pgpPublicKey
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
    }, [message, userPGPKey, receiverPGPKey, kolPGPNonce]);

    const handleContractCall = useCallback(async () => {
        if (!isIPFSUploaded) return;

        setChatStatus("Sending message...");
        setIsInTransaction(true);
        
        try {
            let isResponding = message.id > 0 && message.kolProfile?.pgpKey?.publicKey === "0x";

            let userPGPNonce = '1'

            // console.debug('handleContractCall', isResponding, message.id, ipfsHash, message.senderId, message.receiverId, pgpPublicKey, pgpNonce);
            // return;
            const tx = await writeContractAsync({
                address: RABITA_MESSAGING_ADDRESS,
                abi: RABITA_MESSAGING_ABI,
                functionName: isResponding ? 'respondToEncryptedMessage' : 'sendEncryptedMessage',
                args: isResponding ? [
                    message.id,
                    ipfsHash
                ] :[
                    message.kolProfile.wallet,
                    userPGPKey,
                    userPGPNonce,
                    ipfsHash
                ],
                value: message.kolProfile.fee
            });
            
            setTransactionHash(tx);
            setChatStatus("Message sent");
        } catch (error) {
            console.error('Contract call error:', error);
            setChatStatus("Error sending message");
            setIsErrorInCall(true);
        } finally {
            setIsLoading(false);
            setIsInTransaction(false);
            setIsErrorInCall(true);
        }
    }, [isIPFSUploaded, writeContractAsync, message, ipfsHash, receiverPGPKey, kolPGPNonce]);

    const retrySendMessage = useCallback(() => {
        setIsErrorInCall(false);
        setIsIPFSUploaded(false);
        setIsInTransaction(false);
        setIsLoading(false);
        setIsMessageSent(false);
        setTransactionHash(undefined);
        setChatStatus(undefined);
    }, []);

    useEffect(() => {
        abortControllerRef.current = new AbortController();
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!isIPFSUploaded && !message.isTransactionProcessed && !message.delivered && !isLoadingPGPKeys && !isErrorInCall) {
            handleIPFSUpload();
        }
    }, [handleIPFSUpload, isIPFSUploaded, message, isLoadingPGPKeys, isErrorInCall]);

    useEffect(() => {
        if (isIPFSUploaded && !isInTransaction && !isTxnLoading && !isMessageSent && !message.isTransactionProcessed && !message.delivered && !isErrorInCall) {
            handleContractCall();
        }
    }, [isIPFSUploaded, handleContractCall, isInTransaction, isTxnLoading, isMessageSent, message, isErrorInCall]);

    return useMemo(() => ({
        chatStatus,
        isMessageSent,
        isTxnLoading: isTxnLoading || isIPFSUploaded || isLoading || isInTransaction,
        status,
        error: chatStatus?.toLowerCase().includes('error') ? new Error(chatStatus) : null,
        retrySendMessage
    }), [chatStatus, isMessageSent, isTxnLoading, status, error, isIPFSUploaded, isLoading, isInTransaction, retrySendMessage]);
};

export const useConversation = (contact: KOLProfile | null) => {
    const { address } = useActiveWallet();
    const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
    const { data: messages, isLoading: isFetchingMessages, error } = useGraphQuery<GraphQLResponse>(
        ['userAddress', address || '', 'otherParty', contact?.wallet || ''],
        RABITA_CONVERSATION_QUERY,
        {
            variables: { userAddress: address || '', otherParty: contact?.wallet || '' },
            enabled: !!address && !!contact,
            staleTime: 10 * 1000,
            refetchInterval: 10 * 1000,
            refetchOnMount: true,
            refetchOnWindowFocus: true
        }
    );

    useEffect(() => {
        if (messages) {
            const parsedMessages: Message[] = messages.conversation.map((message: any) => ({
                id: parseInt(message.messageId),
                senderId: message.sender,
                receiverId: message.kol,
                text: message.messageIpfsHash,
                timestamp: new Date(message.blockTimestamp * 1000),
                kolProfile: message.kolProfile as unknown as KOLProfile,
                isTransactionProcessed: true,
                delivered: true
            }));
            const respondedMessages = messages.conversation.filter((message: any) => message.message.status === "RESPONDED").map((message: any) => ({
                id: parseInt(message.messageId)+9999,
                senderId: message.kol,
                receiverId: message.sender,
                text: message.message.responses[0].responseIpfsHash,
                timestamp: new Date(message.message.responses[0].responseTimestamp * 1000),
                kolProfile: message.kolProfile as unknown as KOLProfile,
                isTransactionProcessed: true,
                delivered: true
            }));

            console.debug("respondedMessages",respondedMessages)

            let allMessages = [...parsedMessages, ...respondedMessages];
            allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            setParsedMessages(allMessages);
            // for (const message of messages.conversation) {
            //     console.debug('message', message);
            //     console.debug(message.messageId, message.sender, message.kol, message.messageIpfsHash, message.blockTimestamp, message.kolProfile, message.kolProfile?.id)
            // }
        }
    }, [messages]);

    return { messages: parsedMessages, isFetchingMessages, error };
}
