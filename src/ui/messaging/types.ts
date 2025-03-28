import { KOLProfile } from '@/types/profile';
import { Message } from './Message';
export type { Message } from './Message';

export type AvatarStyle = 'identicon' | 'bottts' | 'micah' | 'avataaars' | 'lorelei';
export interface MessagingContainerProps {
    initialKolAddress?: `0x${string}`;
}

export interface MessageData {
    messageId: string;
    kol: string;
    sender: string;
    blockTimestamp: number;
    messageIpfsHash: string;
    kolProfile?: {
        id: string;
        handle: string;
        platform: string;
        name: string;
        wallet: string;
    };
}

export interface GraphQLResponse {
    sentMessages: MessageData[];
    receivedMessages: MessageData[];
    conversation: MessageData[];
}

export interface ChatPanelProps {
    contact: KOLProfile;
    messages: Message[];
    newMessage: string;
    isLoading: boolean;
    isMobile: boolean;
    onClose: () => void;
    onMessageChange: (message: string) => void;
    onSendMessage: () => void;
    onShare: () => void;
    width: string;
}

export interface ContactListProps {
    contacts: KOLProfile[];
    selectedContactId?: string;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onContactSelect: (contact: KOLProfile) => void;
    width: string;
} 