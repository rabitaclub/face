import React from 'react';
import { Message } from './types';
import { useAccount } from 'wagmi';
import moment from 'moment';
import { useChatMessage } from './hooks/useChat';
import { useDecryptedMessage } from '@/hooks/useMessaging';
import { Loader2 } from 'lucide-react';
import { FiRefreshCcw } from 'react-icons/fi';

interface ChatMessageProps {
    message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const { address } = useAccount();

    const { chatStatus, isMessageSent, isTxnLoading, error, retrySendMessage } = useChatMessage(message);

    const formatDate = (date: Date) => {
        const messageDate = moment(date);
        const today = moment().startOf('day');
        
        if (messageDate.isSame(today, 'day')) {
            return messageDate.format('h:mm A');
        } else {
            return messageDate.format('MMM D, h:mm A');
        }
    }

    const { decryptedMessage, isLoading: isDecryptedMessageLoading } = useDecryptedMessage(message);

    return (
        <div className={`flex flex-col mb-4 ${message.senderId.toLowerCase() === address?.toLowerCase() ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${
                message.senderId.toLowerCase() === address?.toLowerCase()
                    ? 'bg-primary text-dark rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}>
                {message.isTransactionProcessed && (isDecryptedMessageLoading || !decryptedMessage)
                ?
                <Loader2 className="w-4 h-4 animate-spin" />
                :
                message.isTransactionProcessed ? <p>{decryptedMessage}</p> : <p>{message.text}</p>
                }
            </div>
            <span className={`text-[10px] mt-1 px-1 text-gray-500`}>
                {formatDate(message.timestamp)}
            </span>
            {message.senderId.toLowerCase() === address?.toLowerCase() && !isMessageSent && !message.isTransactionProcessed && (
                <div className={`flex items-center mt-1 px-1`}>
                    {(isTxnLoading && !error) && (
                        <div className="w-3 h-3 mr-2 rounded-full border-2 border-gray-300 border-t-primary animate-spin"></div>
                    )}
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        {chatStatus || 'Processing message...'}
                        {error && (
                            <button onClick={retrySendMessage} className="text-dark">
                                <FiRefreshCcw />
                            </button>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
}; 