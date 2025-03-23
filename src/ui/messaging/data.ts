import { Message } from './types';
import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';
import { bottts } from '@dicebear/collection';
import { micah } from '@dicebear/collection';
import { avataaars } from '@dicebear/collection';
import { lorelei } from '@dicebear/collection';

// Helper to format wallet address display
const formatWalletAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Generate avatar SVG data URI from wallet address
const generateAvatar = (walletAddress: string, style: 'identicon' | 'bottts' | 'micah' | 'avataaars' | 'lorelei'): string => {
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

// Prepare avatars for mock data
const avatar1 = generateAvatar("0x71C7656EC7ab88b098defB751B7401B5f6d8976F", 'bottts');
const avatar2 = generateAvatar("0x3243Ed9fdCDE2345890DDEAf6b083CA4cF0F68f2", 'identicon');
const avatar3 = generateAvatar("0x8e5afc37Bab8C2fC0F1c984204C81786D5a9bcE3", 'micah');
const avatar4 = generateAvatar("0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF", 'avataaars');
const avatar5 = generateAvatar("0x6d4E05BEd83C7F3925DAf5FeD3Aef8BE7CFdb79B", 'lorelei');

// Mock contacts data with crypto wallet addresses
export const mockContacts: Contact[] = [
    // {
    //     id: 1,
    //     name: formatWalletAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F"),
    //     walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    //     avatar: avatar1,
    //     status: "online",
    //     lastMessage: "Just sent you 0.5 ETH",
    //     lastMessageTime: "10:23",
    //     unreadCount: 2
    // },
    // {
    //     id: 2,
    //     name: formatWalletAddress("0x3243Ed9fdCDE2345890DDEAf6b083CA4cF0F68f2"),
    //     walletAddress: "0x3243Ed9fdCDE2345890DDEAf6b083CA4cF0F68f2",
    //     avatar: avatar2,
    //     status: "offline",
    //     lastMessage: "Let's schedule the token swap",
    //     lastMessageTime: "Yesterday"
    // },
    // {
    //     id: 3,
    //     name: formatWalletAddress("0x8e5afc37Bab8C2fC0F1c984204C81786D5a9bcE3"),
    //     walletAddress: "0x8e5afc37Bab8C2fC0F1c984204C81786D5a9bcE3",
    //     avatar: avatar3,
    //     status: "away",
    //     lastMessage: "Mint was successful",
    //     lastMessageTime: "Yesterday"
    // },
    // {
    //     id: 4,
    //     name: formatWalletAddress("0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF"),
    //     walletAddress: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
    //     avatar: avatar4,
    //     status: "online",
    //     lastMessage: "DAO meeting at 5pm",
    //     lastMessageTime: "Monday",
    //     unreadCount: 1
    // },
    // {
    //     id: 5,
    //     name: formatWalletAddress("0x6d4E05BEd83C7F3925DAf5FeD3Aef8BE7CFdb79B"),
    //     walletAddress: "0x6d4E05BEd83C7F3925DAf5FeD3Aef8BE7CFdb79B",
    //     avatar: avatar5,
    //     status: "offline",
    //     lastMessage: "Will check the smart contract",
    //     lastMessageTime: "Monday"
    // }
];

// Mock chat history with wallet addresses as keys
export const mockChatHistory: Record<string, Message[]> = {
    "0x71C7656EC7ab88b098defB751B7401B5f6d8976F": [
        {
            id: 1,
            senderId: 1,
            text: "Hello! I'm interested in your services.",
            timestamp: new Date(),
            delivered: true
        }
    ]
}; 