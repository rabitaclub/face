import { KOLProfile } from '@/types/profile';

export type AvatarStyle = 'identicon' | 'bottts' | 'micah' | 'avataaars' | 'lorelei';

export interface Message {
    id: number;
    senderId: number;
    text: string;
    timestamp: Date;
    delivered?: boolean;
}

export interface MessagingContainerProps {
    initialKolAddress?: `0x${string}`;
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