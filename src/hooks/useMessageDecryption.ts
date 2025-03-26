import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { EncryptionParams } from '../utils/encryption';
import { generateAsymmetricKeys } from '../utils/encryption';

export const useMessageDecryption = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const decrypt = useCallback(async (
    encryptedMessage: string,
    params: EncryptionParams
  ): Promise<string | null> => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.debug('Starting message decryption process...');
      
      // Get signature from user
      const formattedMessage = `I confirm that I want to use this message for decryption purposes.
Version: ${params.version}
Nonce: ${params.nonce}
Platform: ${params.platform}

Message: ${params.message}`;
      
      const signature = await signMessageAsync({
        message: formattedMessage,
      });
      
      // Generate asymmetric keys from signature
      const keys = await generateAsymmetricKeys(signature);
      
      // Call the decryption API endpoint
      const response = await fetch('/api/decryption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedData: encryptedMessage,
          privateKey: keys.privateKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to decrypt message');
      }

      const result = await response.json();
      
      console.debug('Message decryption completed successfully');
      return result.decryptedMessage;
    } catch (err) {
      console.error('Error decrypting message:', err);
      setError(err instanceof Error ? err.message : 'Failed to decrypt message');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, signMessageAsync]);

  return {
    decrypt,
    isLoading,
    error,
    isConnected: !!address
  };
}; 