import React from 'react';

export interface Message {
    id: number;
    text: string;
    sent: boolean;
    timestamp: string;
}

interface ChatMessageProps {
    message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    return (
        <div className={`flex mb-4 ${message.sent ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
                message.sent 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}>
                <p>{message.text}</p>
                <p className={`text-xs mt-1 ${message.sent ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp}
                </p>
            </div>
        </div>
    );
}; 