import { useState, useMemo, useEffect } from 'react';
import { KOLProfile } from '@/types/profile';
import { useGraphQuery } from '@/hooks/useGraphQuery';
import { KOL_MESSAGES_QUERY } from '@/config/graph.queries';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { Message } from '../Message';
import { GraphQLResponse, MessageData } from '../types';

interface UseContactsReturn {
    contacts: ConversationSummary[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredContacts: ConversationSummary[];
}

export function useContacts(): UseContactsReturn {
    const [searchQuery, setSearchQuery] = useState('');
    const { contacts } = useContactList();

    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return contacts;

        const query = searchQuery.toLowerCase();
        return contacts.filter(contact => 
            contact.kolProfile?.name?.toLowerCase().includes(query) ||
            contact.kolProfile?.handle?.toLowerCase().includes(query) ||
            contact.participantAddress.toLowerCase().includes(query)
        );
    }, [contacts, searchQuery]);

    return {
        contacts,
        searchQuery,
        setSearchQuery,
        filteredContacts
    };
} 


export interface ConversationSummary {
    participantAddress: string;
    lastMessage: Message;
    kolProfile?: KOLProfile;
    conversationId?: string;
    messageCount?: number;
    isActive?: boolean;
}

interface GraphConversation {
    id: string;
    kol?: string;
    sender?: string;
    kolProfile?: {
        id: string;
        handle: string;
        platform: string;
        name: string;
    };
    lastMessageContent: string;
    lastMessageSender: string;
    lastMessageTimestamp: number;
    messageCount: number;
    isActive: boolean;
    updatedAt: number;
    messages: {
        id: string;
        messageIpfsHash: string;
        fee: string;
        blockTimestamp: number;
        message: {
            status: string;
            updatedAt: number;
        };
    }[];
}

function processConversationSummaries(data: { 
    senderConversations: GraphConversation[];
    kolConversations: GraphConversation[];
}, userAddress: string): ConversationSummary[] {
    try {
        const conversations = new Map<string, ConversationSummary>();
        
        // Process conversations where user is the sender
        for (const conversation of data.senderConversations || []) {
            const participantAddress = conversation.kol || '';
            if (!participantAddress) continue;
            
            const lastMsg = conversation.messages[0];
            if (!lastMsg) continue;

            const kolProfile: KOLProfile = conversation.kolProfile ? {
                wallet: conversation.kolProfile.id as `0x${string}`,
                handle: conversation.kolProfile.handle,
                platform: conversation.kolProfile.platform,
                name: conversation.kolProfile.name,
                fee: BigInt(0),
                profileIpfsHash: null,
                verified: false,
                exists: true
            } : {
                wallet: participantAddress as `0x${string}`,
                handle: '',
                platform: '',
                name: '',
                fee: BigInt(0),
                profileIpfsHash: null,
                verified: false,
                exists: true
            };

            conversations.set(participantAddress, {
                participantAddress,
                conversationId: conversation.id,
                messageCount: conversation.messageCount,
                isActive: conversation.isActive,
                lastMessage: {
                    id: parseInt(lastMsg.id),
                    timestamp: new Date(lastMsg.blockTimestamp * 1000),
                    text: lastMsg.messageIpfsHash,
                    senderId: userAddress,
                    receiverId: participantAddress,
                    kolProfile,
                    delivered: true,
                    isTransactionProcessed: true
                },
                kolProfile
            });
        }
        
        // Process conversations where user is the KOL
        for (const conversation of data.kolConversations || []) {
            const participantAddress = conversation.sender || '';
            if (!participantAddress) continue;
            
            const lastMsg = conversation.messages[0];
            if (!lastMsg) continue;

            // Only add if this is a newer conversation or we don't have it yet
            const existingConversation = conversations.get(participantAddress);
            const newTimestamp = lastMsg.blockTimestamp * 1000;
            
            if (!existingConversation || 
                newTimestamp > existingConversation.lastMessage.timestamp.getTime()) {
                
                // Create a minimal KOLProfile for the sender
                const kolProfile: KOLProfile = {
                    wallet: participantAddress as `0x${string}`,
                    handle: '',
                    platform: '',
                    name: '',
                    fee: BigInt(0),
                    profileIpfsHash: null,
                    verified: false,
                    exists: true
                };
                
                conversations.set(participantAddress, {
                    participantAddress,
                    conversationId: conversation.id,
                    messageCount: conversation.messageCount,
                    isActive: conversation.isActive,
                    lastMessage: {
                        id: Math.floor(Math.random() * 1000000),
                        timestamp: new Date(newTimestamp),
                        text: lastMsg.messageIpfsHash,
                        senderId: participantAddress,
                        receiverId: userAddress,
                        kolProfile,
                        delivered: true,
                        isTransactionProcessed: true
                    },
                    kolProfile
                });
            }
        }

        return Array.from(conversations.values())
            .sort((a, b) => {
                const timeA = new Date(a.lastMessage.timestamp).getTime();
                const timeB = new Date(b.lastMessage.timestamp).getTime();
                return timeB - timeA;
            });

    } catch (error) {
        console.error('Error processing conversation summaries:', error);
        return [];
    }
}

function createMessageObject(msg: MessageData): Message {
    return {
        id: parseInt(msg.messageId),
        timestamp: new Date(msg.blockTimestamp * 1000),
        text: msg.messageIpfsHash,
        senderId: msg.sender,
        receiverId: msg.kol,
        kolProfile: {
            wallet: msg.kolProfile?.id as `0x${string}`,
            ...msg.kolProfile
        } as KOLProfile,
        delivered: true,
        isTransactionProcessed: true
    };
}

export const useContactList = () => {
    const [contacts, setContacts] = useState<ConversationSummary[]>([]);
    const { address } = useActiveWallet();

    const { data: conversationData, isLoading: isFetchingMessages } = useGraphQuery<{
        senderConversations: GraphConversation[];
        kolConversations: GraphConversation[];
    }>(
        ['userConversations', address || ''],
        KOL_MESSAGES_QUERY,
        {
            variables: { userAddress: address || '' },
            staleTime: 60 * 1000,
            refetchInterval: 60 * 1000,
            refetchOnMount: true,
            refetchOnWindowFocus: true
        }
    );

    useEffect(() => {
        if (conversationData) {
            // console.debug("Conversation data", conversationData);
            const conversationSummaries = processConversationSummaries(conversationData, address || '');
            // console.debug("Conversation summaries", conversationSummaries);
            setContacts(conversationSummaries);
        }
    }, [conversationData, address, isFetchingMessages]);

    return useMemo(() => ({
        contacts,
        isLoading: isFetchingMessages
    }), [contacts, isFetchingMessages]);
}
