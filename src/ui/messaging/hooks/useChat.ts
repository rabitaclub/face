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
        if (fetchedMessages && !isFetchingMessages && selectedContact) {
            setChatMessages(prev => ({
                ...prev,
                [selectedContact.wallet || '']: fetchedMessages
            }));
        }
    }, [fetchedMessages, selectedContact, setChatMessages, isFetchingMessages]);

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

            console.debug('replyToMessageId', replyToMessageId, lastMessage, currentMessages);

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
            console.debug('isResponding', isResponding, message.id, message.kolProfile?.pgpKey?.publicKey);
            let userPGPNonce = '1'

            // console.debug('handleContractCall', isResponding, message.id, ipfsHash, message.senderId, message.receiverId, pgpPublicKey, pgpNonce);
            // return;
            const tx = await writeContractAsync({
                address: RABITA_MESSAGING_ADDRESS,
                abi: RABITA_MESSAGING_ABI,
                functionName: isResponding ? 'respondToMessage' : 'sendEncryptedMessage',
                args: isResponding ? [
                    message.receiverId,
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

interface ConversationGraphQLResponse {
    userAsSender: {
        id: string;
        lastMessageContent: string;
        lastMessageSender: string;
        lastMessageTimestamp: number;
        messageCount: number;
        isActive: boolean;
        messages: MessageData[];
    }[];
    userAsKol: {
        id: string;
        lastMessageContent: string;
        lastMessageSender: string;
        lastMessageTimestamp: number;
        messageCount: number;
        isActive: boolean;
        messages: MessageData[];
    }[];
}

interface MessageData {
    id: string;
    messageCount: string;
    messageId: string;
    sender: string;
    kol: string;
    messageIpfsHash: string;
    blockTimestamp: number;
    fee: string;
    deadline: number;
    senderPGPKey?: {
        pgpPublicKey: string;
        pgpNonce: string;
    };
    kolProfile?: {
        id: string;
        handle: string;
        platform: string;
        name: string;
        fee: string;
        pgpKey?: {
            publicKey: string;
            pgpNonce: string;
            isActive: boolean;
        };
    };
    message: {
        status: string;
        createdAt: number;
        updatedAt: number;
        responses?: {
            responseIpfsHash: string;
            responseTimestamp: number;
        }[];
    };
}

export const useConversation = (contact: KOLProfile | null) => {
    const { address } = useActiveWallet();
    const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
    
    const { data, isLoading: isFetchingMessages, error } = useGraphQuery<ConversationGraphQLResponse>(
        ['userAddress', address || '', 'otherParty', contact?.wallet || ''],
        RABITA_CONVERSATION_QUERY,
        {
            variables: { userAddress: address || '', otherParty: contact?.wallet || '' },
            enabled: !!address && !!contact,
            staleTime: 60 * 1000,
            refetchInterval: 2 * 60 * 1000,
            refetchOnMount: true,
            refetchOnWindowFocus: true
        }
    );

    useEffect(() => {
        if (!data) return;
        
        try {
            const allMessages: Message[] = [];
            
            // Process messages from userAsSender (user sent to contact)
            if (data.userAsSender?.length > 0 && data.userAsSender[0]?.messages?.length) {
                console.debug('userAsSender', data.userAsSender[0].messages);
                const userSentMessages = data.userAsSender[0].messages.map(message => ({
                    id: Math.floor(Math.random() * 1000000),
                    senderId: message.sender,
                    receiverId: message.kol,
                    text: message.messageIpfsHash,
                    timestamp: new Date(message.blockTimestamp * 1000),
                    kolProfile: createKolProfileFromData(message.kolProfile),
                    isTransactionProcessed: true,
                    delivered: true
                }));
                
                // Add responses to user's messages if they exist
                const responses = data.userAsSender[0].messages
                    .filter(message => message.message?.status === "RESPONDED")
                    .map(message => {
                        if (!message.message.responses?.[0]) return null;
                        
                        const response = message.message.responses[0];
                        return {
                            id: Math.floor(Math.random() * 1000000), // Use a different ID scheme for responses
                            senderId: message.kol,
                            receiverId: message.sender,
                            text: response.responseIpfsHash,
                            timestamp: new Date(response.responseTimestamp * 1000),
                            kolProfile: createKolProfileFromData(message.kolProfile),
                            isTransactionProcessed: true,
                            delivered: true
                        };
                    })
                    .filter(Boolean) as Message[];
                
                allMessages.push(...userSentMessages, ...responses);
            }
            
            // Process messages from userAsKol (contact sent to user)
            if (data.userAsKol?.length > 0 && data.userAsKol[0]?.messages?.length) {
                const messagesReceivedByUser = data.userAsKol[0].messages.map(message => ({
                    id: Math.floor(Math.random() * 1000000),
                    senderId: message.sender,
                    receiverId: message.kol,
                    text: message.messageIpfsHash,
                    timestamp: new Date(message.blockTimestamp * 1000),
                    kolProfile: createKolProfileFromData(message.kolProfile),
                    isTransactionProcessed: true,
                    delivered: true
                }));
                
                // Add responses to these messages if they exist
                const responses = data.userAsKol[0].messages
                    .filter(message => message.message?.status === "RESPONDED")
                    .map(message => {
                        if (!message.message.responses?.[0]) return null;
                        
                        const response = message.message.responses[0];
                        return {
                            id: Math.floor(Math.random() * 1000000),
                            senderId: message.kol,
                            receiverId: message.sender,
                            text: response.responseIpfsHash,
                            timestamp: new Date(response.responseTimestamp * 1000),
                            kolProfile: createKolProfileFromData(message.kolProfile),
                            isTransactionProcessed: true,
                            delivered: true
                        };
                    })
                    .filter(Boolean) as Message[];
                
                allMessages.push(...messagesReceivedByUser, ...responses);
            }
            
            // Sort all messages by timestamp
            allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            
            console.debug("Processed conversation messages:", allMessages.length);
            setParsedMessages(allMessages);
        } catch (error) {
            console.error("Error processing conversation messages:", error);
            setParsedMessages([]);
        }
    }, [data, contact]);

    // Helper function to create KOLProfile from GraphQL data
    function createKolProfileFromData(profileData?: MessageData['kolProfile']): KOLProfile {
        if (!profileData) {
            return {
                wallet: (contact?.wallet || '') as `0x${string}`,
                handle: contact?.handle || '',
                platform: contact?.platform || '',
                name: contact?.name || '',
                fee: BigInt(contact?.fee || 0),
                profileIpfsHash: null,
                verified: false,
                exists: true
            };
        }
        
        return {
            wallet: profileData.id as `0x${string}`,
            handle: profileData.handle,
            platform: profileData.platform,
            name: profileData.name,
            fee: BigInt(profileData.fee || 0),
            profileIpfsHash: null,
            verified: false,
            exists: true,
            pgpKey: profileData.pgpKey ? {
                publicKey: profileData.pgpKey.publicKey,
                pgpNonce: profileData.pgpKey.pgpNonce
            } : undefined
        };
    }

    return { messages: parsedMessages, isFetchingMessages, error };
};
