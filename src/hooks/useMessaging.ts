import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMessaging as useMessagingContext } from '@/contexts/MessagingContext';
import { decryptMessage } from '@/utils/encryption';
import { Message } from '@/ui/messaging/Message';
import { useActiveWallet } from './useActiveWallet';

const getMessage = async (ipfsHash: string) => {
  const response = await fetch(ipfsHash);
  return await response.json();
};

export const useMessage = (ipfsHash: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['message', ipfsHash],
    queryFn: () => getMessage(ipfsHash),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  return {
    data,
    isLoading,
    error,
  };
};

export const useDecryptedMessage = (message?: Message) => {
  const { address } = useActiveWallet();
  const { privateKey, checkExistingKeys, isInitialized } = useMessagingContext();
  const { data, isLoading, error } = useMessage(message?.text || '');
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);

  useEffect(() => {
    checkExistingKeys();
  }, [checkExistingKeys]);

  useEffect(() => {
    if (data && privateKey && isInitialized) {
      console.debug('decrypting message', message?.text);
      decryptMessage(data.metadata.senderId?.toLowerCase() === address?.toLowerCase() ? data.userContent : data.content, privateKey).then(setDecryptedMessage);
    }
  }, [data, privateKey, isInitialized, message]);

  return { decryptedMessage, isLoading, error };
};

export { useMessagingContext as useMessaging };
