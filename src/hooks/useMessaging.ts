import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSignTypedData } from 'wagmi';
import { generateAsymmetricKeys, encryptMessage, decryptMessage } from '@/utils/encryption';
import { storePrivateKey, retrievePrivateKey, removePrivateKey } from '@/utils/secureStorage';
import { useQuery } from '@tanstack/react-query';

interface UseMessagingReturn {
  privateKey: string | null;
  publicKey: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  generateKeys: () => Promise<{ privateKey: string, publicKey: string }>;
  encryptMessage: (message: string, recipientPublicKey: string) => Promise<string>;
  decryptMessage: (encryptedMessage: string) => Promise<string>;
  clearKeys: () => void;
  checkExistingKeys: () => Promise<boolean>;
}

export function useMessaging(): UseMessagingReturn {
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  // Clear keys when address changes
  useEffect(() => {
    if (isInitialized) {
      clearKeys();
    }
  }, [address]);

  const checkExistingKeys = useCallback(async (): Promise<boolean> => {
    if (!address) return false;

    try {
      setIsLoading(true);
      const _storedPrivateKey = await retrievePrivateKey(address)
      if (!_storedPrivateKey) {
        return false;
      }

      const keys = await generateAsymmetricKeys(_storedPrivateKey)
      setPrivateKey(keys.privateKey)
      setPublicKey(keys.publicKey)
      setIsInitialized(true)

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check existing keys');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, signTypedDataAsync]);

  const generateKeys = useCallback(async (): Promise<{ privateKey: string, publicKey: string }> => {
    if (!address) {
      setError('Wallet not connected');
      return { privateKey: '', publicKey: '' };
    }

    try {
      setIsLoading(true);
      setError(null);

      const signature = await signTypedDataAsync({
        domain: {
          name: 'Rabita',
          version: '1',
        },
        types: {
          GeneratePGPKeys: [
            { name: 'app', type: 'string' },
            { name: 'message', type: 'string' },
            { name: 'publicKey', type: 'string' },
            { name: 'nonce', type: 'string' },
            { name: 'version', type: 'string' },
          ],
        },
        primaryType: 'GeneratePGPKeys',
        message: {
          app: 'Rabita',
          message: "Rabita protocol deterministic PGP keys generation",
          publicKey: address,
          nonce: '1',
          version: '1',
        },
      });

      const keys = await generateAsymmetricKeys(signature);
      await storePrivateKey(signature, address);

      console.log(keys)
      
      setPrivateKey(keys.privateKey);
      setPublicKey(keys.publicKey);
      setIsInitialized(true);

      return { privateKey: keys.privateKey, publicKey: keys.publicKey };
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to generate keys');
      return { privateKey: '', publicKey: '' };
    } finally {
      setIsLoading(false);
    }
  }, [address, signTypedDataAsync]);

  const encryptMessageFn = useCallback(async (message: string, recipientPublicKey: string): Promise<string> => {
    if (!isInitialized) {
      throw new Error('Messaging system not initialized');
    }
    return encryptMessage(message, recipientPublicKey);
  }, [isInitialized]);

  const decryptMessageFn = useCallback(async (encryptedMessage: string): Promise<string> => {
    if (!isInitialized || !privateKey) {
      throw new Error('Messaging system not initialized or private key not available');
    }
    return decryptMessage(encryptedMessage, privateKey);
  }, [isInitialized, privateKey]);

  const clearKeys = useCallback(() => {
    removePrivateKey();
    setPrivateKey(null);
    setPublicKey(null);
    setIsInitialized(false);
  }, []);

  return {
    privateKey,
    publicKey,
    isInitialized,
    isLoading,
    error,
    generateKeys,
    encryptMessage: encryptMessageFn,
    decryptMessage: decryptMessageFn,
    clearKeys,
    checkExistingKeys,
  };
}

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
  const { privateKey, checkExistingKeys, isInitialized } = useMessaging();
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
