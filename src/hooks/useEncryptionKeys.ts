import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { EncryptionParams, EncryptionResult } from '../utils/encryption';
import { generateAsymmetricKeys } from '../utils/encryption';

export const useEncryptionKeys = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<EncryptionResult | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const generateKeys = useCallback(async (params: EncryptionParams): Promise<EncryptionResult | null> => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.debug('Starting key generation process...');
      
      // Get signature from user
      const formattedMessage = `I confirm that I want to use this message for encryption purposes.
Version: ${params.version}
Nonce: ${params.nonce}
Platform: ${params.platform}

Message: ${params.message}`;
      
      const sig = await signMessageAsync({
        message: formattedMessage,
      });
      setSignature(sig);
      
      // Generate asymmetric keys from signature
      const generatedKeys = await generateAsymmetricKeys(sig);
      setKeys(generatedKeys);
      
      console.debug('Key generation completed successfully');
      return generatedKeys;
    } catch (err) {
      console.error('Error generating keys:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate keys');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, signMessageAsync]);

  return {
    generateKeys,
    isLoading,
    error,
    isConnected: !!address,
    publicKey: keys?.publicKey || null,
    privateKey: keys?.privateKey || null,
    signature
  };
}; 