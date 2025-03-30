import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSignTypedData } from 'wagmi';
import { generateAsymmetricKeys, encryptMessage, decryptMessage } from '@/utils/encryption';
import { storePrivateKey, retrievePrivateKey, removePrivateKey } from '@/utils/secureStorage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MessagingContextType {
  privateKey: string | null;
  publicKey: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  isGeneratingKeys: boolean;
  isEncrypting: boolean;
  isDecrypting: boolean;
  error: string | null;
  generateKeys: () => Promise<{ privateKey: string, publicKey: string }>;
  encryptMessage: (message: string, recipientPublicKey: string) => Promise<string>;
  decryptMessage: (encryptedMessage: string) => Promise<string>;
  clearKeys: () => void;
  checkExistingKeys: () => Promise<boolean>;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

const MESSAGING_KEYS_QUERY_KEY = ['messaging', 'keys'];

export function MessagingProvider({ children }: { children: ReactNode }) {
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const queryClient = useQueryClient();

  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  // Query for checking existing keys
  const { isLoading: isCheckingKeys } = useQuery({
    queryKey: [...MESSAGING_KEYS_QUERY_KEY, address],
    queryFn: async () => {
      if (!address) return false;

      try {
        const _storedPrivateKey = await retrievePrivateKey(address);
        if (!_storedPrivateKey) {
          return false;
        }

        const keys = await generateAsymmetricKeys(_storedPrivateKey);
        setPrivateKey(keys.privateKey);
        setPublicKey(keys.publicKey);
        setIsInitialized(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check existing keys');
        return false;
      }
    },
    enabled: !!address,
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes
    staleTime: 60 * 1000, // Consider data stale after 1 minute
    retry: 3, // Retry 3 times on failure
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Clear keys when address changes
  useEffect(() => {
    if (isInitialized) {
      clearKeys();
    }
  }, [address]);

  const generateKeys = useCallback(async (): Promise<{ privateKey: string, publicKey: string }> => {
    if (!address) {
      setError('Wallet not connected');
      return { privateKey: '', publicKey: '' };
    }

    try {
      setIsGeneratingKeys(true);
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
      
      setPrivateKey(keys.privateKey);
      setPublicKey(keys.publicKey);
      setIsInitialized(true);

      // Invalidate the keys query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: MESSAGING_KEYS_QUERY_KEY });

      return { privateKey: keys.privateKey, publicKey: keys.publicKey };
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate keys');
      return { privateKey: '', publicKey: '' };
    } finally {
      setIsGeneratingKeys(false);
    }
  }, [address, signTypedDataAsync, queryClient]);

  const encryptMessageFn = useCallback(async (message: string, recipientPublicKey: string): Promise<string> => {
    if (!isInitialized) {
      throw new Error('Messaging system not initialized');
    }

    try {
      setIsEncrypting(true);
      return await encryptMessage(message, recipientPublicKey);
    } finally {
      setIsEncrypting(false);
    }
  }, [isInitialized]);

  const decryptMessageFn = useCallback(async (encryptedMessage: string): Promise<string> => {
    if (!isInitialized || !privateKey) {
      throw new Error('Messaging system not initialized or private key not available');
    }

    try {
      setIsDecrypting(true);
      return await decryptMessage(encryptedMessage, privateKey);
    } finally {
      setIsDecrypting(false);
    }
  }, [isInitialized, privateKey]);

  const clearKeys = useCallback(() => {
    removePrivateKey();
    setPrivateKey(null);
    setPublicKey(null);
    setIsInitialized(false);
    // Invalidate the keys query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: MESSAGING_KEYS_QUERY_KEY });
  }, [queryClient]);

  const checkExistingKeys = useCallback(async (): Promise<boolean> => {
    // This will trigger a refetch of the keys query
    await queryClient.refetchQueries({ 
      queryKey: MESSAGING_KEYS_QUERY_KEY,
      exact: true
    });
    // Get the current data from the cache
    const data = queryClient.getQueryData<boolean>(MESSAGING_KEYS_QUERY_KEY);
    return data ?? false;
  }, [queryClient]);

  const value = {
    privateKey,
    publicKey,
    isInitialized,
    isLoading: isCheckingKeys || isGeneratingKeys || isEncrypting || isDecrypting,
    isGeneratingKeys,
    isEncrypting,
    isDecrypting,
    error,
    generateKeys,
    encryptMessage: encryptMessageFn,
    decryptMessage: decryptMessageFn,
    clearKeys,
    checkExistingKeys,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
} 