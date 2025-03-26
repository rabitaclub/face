import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { EncryptionResult, EncryptedMessage } from '../utils/encryption';

export const useMessageEncryption = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  const encrypt = useCallback(async (
    message: string,
    keys: EncryptionResult
  ): Promise<EncryptedMessage | null> => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    if (!message.trim()) {
      setError('Message cannot be empty');
      return null;
    }

    if (!keys.publicKey) {
      setError('Invalid encryption keys');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.debug('Starting message encryption process...');
      
      // Call the encryption API endpoint
      const response = await fetch('/api/encryption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          publicKey: keys.publicKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to encrypt message');
      }

      const result = await response.json();
      
      console.debug('Message encryption completed successfully');
      
      return {
        encryptedMessage: result.encryptedMessage,
        publicKey: keys.publicKey,
        version: keys.version,
        nonce: keys.nonce,
        ephemeralKey: result.ephemeralKey
      };
    } catch (err) {
      console.error('Error encrypting message:', err);
      setError(err instanceof Error ? err.message : 'Failed to encrypt message');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return {
    encrypt,
    isLoading,
    error,
    isConnected: !!address
  };
}; 