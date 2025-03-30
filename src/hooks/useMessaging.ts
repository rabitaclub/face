import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMessaging as useMessagingContext } from '@/contexts/MessagingContext';
import { decryptMessage } from '@/utils/encryption';

const getMessage = async (ipfsHash: string) => {
  const response = await fetch(ipfsHash);
  return await response.json();
};

export const useMessage = (ipfsHash: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['message', ipfsHash],
    queryFn: () => getMessage(ipfsHash),
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 5,
  });

  return {
    data,
    isLoading,
    error,
  };
};

export const useDecryptedMessage = (ipfsHash: string) => {
  const { privateKey, checkExistingKeys, isInitialized } = useMessagingContext();
  const { data, isLoading, error } = useMessage(ipfsHash);
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);

  useEffect(() => {
    checkExistingKeys();
  }, [checkExistingKeys]);

  useEffect(() => {
    if (data && privateKey && isInitialized) {
      decryptMessage(data.content, privateKey).then(setDecryptedMessage);
    }
  }, [data, privateKey, isInitialized]);

  return { decryptedMessage, isLoading, error };
};

// Re-export the context hook
export { useMessagingContext as useMessaging };
