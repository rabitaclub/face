import { Message } from './types';

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