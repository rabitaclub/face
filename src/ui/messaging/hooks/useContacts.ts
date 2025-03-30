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
    kolProfile?: {
        handle: string;
        platform: string;
        name: string;
        wallet: string;
    };
}



function processConversationSummaries(data: GraphQLResponse, userAddress: string): ConversationSummary[] {
    try {
        const conversations = new Map<string, ConversationSummary>();
        
        for (const msg of data.sentMessages ?? []) {
            const isUserKol = msg.kol === userAddress;
            const participantAddress = isUserKol ? msg.sender : msg.kol;
            if (conversations.has(participantAddress)) continue;

            conversations.set(participantAddress, {
                participantAddress,
                lastMessage: {
                    ...createMessageObject(msg),
                    senderId: userAddress
                },
                kolProfile: {
                    wallet: msg.kolProfile?.id as `0x${string}`,
                    ...msg.kolProfile
                } as KOLProfile
            });
        }
        
        for (const msg of data.receivedMessages ?? []) {
            const participantAddress = msg.sender;
            const existingConversation = conversations.get(participantAddress);
            
            if (!existingConversation || msg.blockTimestamp > existingConversation.lastMessage.timestamp.getTime()) {
                let tempMessage = msg;
                
                if (msg.message.status === "RESPONDED") {
                    const responseMessage = msg.message.responses[0];
                    if (responseMessage) {
                        tempMessage = {
                            ...msg,
                            messageIpfsHash: responseMessage.responseIpfsHash,
                            blockTimestamp: responseMessage.responseTimestamp
                        };
                    }
                }
                conversations.set(participantAddress, {
                    participantAddress,
                    lastMessage: {
                        ...createMessageObject(tempMessage),
                        receiverId: userAddress
                    },
                    kolProfile: {
                        wallet: msg.kolProfile?.id as `0x${string}`,
                        ...msg.kolProfile
                    } as KOLProfile
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

    const { data: messages, isLoading: isFetchingMessages } = useGraphQuery<GraphQLResponse>(
        ['userAddress', address || ''],
        KOL_MESSAGES_QUERY,
        {
            variables: { userAddress: address || '' },
            staleTime: 10 * 1000,
            refetchInterval: 10 * 1000,
            refetchOnMount: true,
            refetchOnWindowFocus: true
        }
    );

    useEffect(() => {
        if (messages) {
            console.debug("messages",messages)
            const conversationSummaries = processConversationSummaries(messages, address || '');
            // console.debug("conversationSummaries",conversationSummaries)
            setContacts(conversationSummaries);
        }
    }, [messages, address, isFetchingMessages]);

    return useMemo(() => ({
        contacts,
        isLoading: isFetchingMessages
    }), [contacts, isFetchingMessages]);
}
