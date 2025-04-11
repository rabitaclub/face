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
import { useQueryClient } from '@tanstack/react-query';
import { keccak256, toHex } from 'viem';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

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
            const firstMessage = currentMessages[0];
            const replyToMessageId = ( firstMessage?.receiverId?.toLowerCase() === message.senderId?.toLowerCase() ) ? firstMessage?.id : -1;

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
    const { checkExistingKeys, publicKey: userPGPKey } = useMessaging();
    const { address } = useActiveWallet();
    const queryClient = useQueryClient();
    
    // Add refs to track if operations have been initiated
    const ipfsUploadInitiatedRef = useRef(false);
    const contractCallInitiatedRef = useRef(false);

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
            
            // Invalidate relevant queries to trigger refetch after successful transaction
            if (address && message.kolProfile.wallet) {
                queryClient.invalidateQueries({
                    queryKey: ['userAddress', address]
                });
                
                queryClient.invalidateQueries({
                    queryKey: ['userAddress', address, 'otherParty', message.kolProfile.wallet]
                });
                
                queryClient.invalidateQueries({
                    queryKey: ['userConversations', address]
                });
            }
        }
        if (isError) {
            console.error('Transaction error:', error);
            setIsErrorInCall(true);
        }
    }, [isSuccess, isError, error, address, message.kolProfile.wallet, queryClient]);

    const handleIPFSUpload = useCallback(async () => {
        if (!message.kolProfile.pgpKey?.publicKey || !userPGPKey) {
            setChatStatus("Error: Missing encryption key");
            setIsErrorInCall(true);
            setIsLoading(false);
            return;
        }

        console.debug('handleIPFSUpload called at', Date.now());

        setChatStatus("Preparing message...");
        setIsLoading(true);
        setIsErrorInCall(false);
        
        try {
            let pgpPublicKey = message.kolProfile?.pgpKey?.publicKey !== "0x" ? message.kolProfile?.pgpKey?.publicKey : receiverPGPKey;
            console.debug('receiverPGPKey', pgpPublicKey, kolPGPNonce, message.kolProfile?.pgpKey?.publicKey, userPGPKey);
            if (!pgpPublicKey) {
                setChatStatus("Error: Missing encryption key");
                setIsErrorInCall(true);
                setIsLoading(false);
                return;
            }
            const encryptedMessage = await encryptMessage(message.text, pgpPublicKey);
            const userEncryptedMessage = await encryptMessage(message.text, userPGPKey);
            const jsonBody = {
                content: encryptedMessage,
                messageHash: uuidv5(new TextEncoder().encode(message.text+"["+message.senderId+"-"+message.receiverId+"]"), NAMESPACE_UUID),
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

            console.debug('handleIPFSUpload completed', data);

            if (data.gatewayUrl) {
                setIsIPFSUploaded(true);
                setIpfsHash(data.gatewayUrl);
                setIsErrorInCall(false);
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
        if (!isIPFSUploaded || isInTransaction || transactionHash) return;

        console.debug('handleContractCall called at', Date.now());
        
        setChatStatus("Awaiting confirmation...");
        setIsInTransaction(true);
        
        try {
            let isResponding = message.id > 0;
            console.debug('isResponding', isResponding, message.id, message.kolProfile?.pgpKey?.publicKey);
            let userPGPNonce = '1'

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
                value: !isResponding ? message.kolProfile.fee : BigInt(0)
            });
            
            setTransactionHash(tx);
            setChatStatus("Message sent");
            
            // Invalidate queries immediately after sending transaction
            if (address && message.kolProfile.wallet) {
                // Mark queries as stale to trigger re-fetch without waiting for transaction confirmation
                queryClient.invalidateQueries({
                    queryKey: ['userAddress', address]
                });
                
                queryClient.invalidateQueries({
                    queryKey: ['userAddress', address, 'otherParty', message.kolProfile.wallet]
                });
                
                queryClient.invalidateQueries({
                    queryKey: ['userConversations', address]
                });
            }
        } catch (error) {
            console.error('Contract call error:', error);
            setChatStatus("Error sending message");
            setIsErrorInCall(true);
        } finally {
            setIsLoading(false);
            setIsInTransaction(false);
        }
    }, [isIPFSUploaded, writeContractAsync, message, ipfsHash, receiverPGPKey, kolPGPNonce, address, queryClient, userPGPKey]);

    const retrySendMessage = useCallback(() => {
        setIsErrorInCall(false);
        setIsIPFSUploaded(false);
        setIsInTransaction(false);
        setIsLoading(false);
        setIsMessageSent(false);
        setTransactionHash(undefined);
        setChatStatus(undefined);
        // Reset the refs when retrying
        ipfsUploadInitiatedRef.current = false;
        contractCallInitiatedRef.current = false;
    }, []);

    useEffect(() => {
        abortControllerRef.current = new AbortController();
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    // Single useEffect to handle the message sending flow
    useEffect(() => {
        // Skip if we're already in a processing state
        if (isLoading || isInTransaction || isTxnLoading) return;
        
        // Skip if we've already processed this message
        if (message.isTransactionProcessed || message.delivered || isMessageSent) return;
        
        // Skip if we're waiting for PGP keys to load
        if (isLoadingPGPKeys) return;
        
        // Skip if there's an error
        if (isErrorInCall) return;
        
        // Handle IPFS upload if needed
        let pgpPublicKey = message.kolProfile?.pgpKey?.publicKey !== "0x" ? message.kolProfile?.pgpKey?.publicKey : receiverPGPKey;
        if (!isIPFSUploaded && !ipfsUploadInitiatedRef.current && pgpPublicKey) {
            console.debug('Initiating IPFS upload');
            ipfsUploadInitiatedRef.current = true;
            handleIPFSUpload();
            return;
        }
        
        // Handle contract call if IPFS upload is complete
        if (isIPFSUploaded && !contractCallInitiatedRef.current && !transactionHash) {
            console.debug('Initiating contract call');
            contractCallInitiatedRef.current = true;
            handleContractCall();
        }
    }, [
        receiverPGPKey,
        isIPFSUploaded, 
        isInTransaction,
        isTxnLoading, 
        isMessageSent, 
        message, 
        isErrorInCall, 
        isLoading, 
        isLoadingPGPKeys,
        transactionHash,
        handleIPFSUpload,
        handleContractCall
    ]);

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
    messagePayloads: {
        id: string;
        sender: string;
        receiver: string;
        content: string;
        kolProfile: MessageData['kolProfile'];
        blockTimestamp: number;
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
            refetchInterval: 60 * 1000,
            refetchOnMount: true,
            refetchOnWindowFocus: true
        }
    );

    useEffect(() => {
        if (!data) return;
        
        try {
            const allMessages: Message[] = [];
            data.messagePayloads.forEach(message => {
                allMessages.push({
                    id: parseInt(message.id),
                    senderId: message.sender,
                    receiverId: message.receiver,
                    text: message.content,
                    timestamp: new Date(message.blockTimestamp * 1000),
                    kolProfile: createKolProfileFromData(message.kolProfile),
                    delivered: true,
                    isTransactionProcessed: true
                });
            });
            
            // Use reverse to get chronological order (oldest at top, newest at bottom)
            setParsedMessages(allMessages.sort((a, b) => 
                a.timestamp.getTime() - b.timestamp.getTime()
            ));
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
