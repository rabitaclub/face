'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useActiveWallet } from './useActiveWallet';
import { ethers } from 'ethers';

// Define TypeScript interface for signature data
export interface SignatureData {
  signature: string;
  twitterUsername: string;
  walletAddress: string;
  platform: string;
  expiresAt: number;
  _cryptoMetadata: {
    salt: string;
    nonce: string;
    timestamp: number;
    domain: string;
  };
}

/**
 * Custom hook for handling Twitter/X profile verification
 * With enhanced security features and error handling
 */
export function useTwitterVerification() {
  const { data: session, status } = useSession();
  const { address } = useActiveWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if the user has verified their Twitter account
  const isTwitterVerified = !!session?.user?.isTwitterVerified;
  
  // Connect to Twitter
  const connectTwitter = useCallback(() => {
    signIn('twitter', { callbackUrl: '/profile' });
  }, []);

  // Disconnect from Twitter
  const disconnectTwitter = useCallback(() => {
    signOut({ callbackUrl: '/profile' });
  }, []);

  // Generate a verification signature
  const generateSignature = useCallback(async () => {
    // Reset states
    setError(null);
    
    // Validate wallet connection
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    // Validate wallet address format
    if (!ethers.utils.isAddress(address)) {
      setError('Invalid wallet address format');
      return null;
    }

    // Validate Twitter verification
    if (!isTwitterVerified || !session?.user?.twitterId || !session?.user?.twitterUsername) {
      setError('Twitter account not verified');
      return null;
    }

    try {
      setIsVerifying(true);

      // Call the API to generate a signature
      const response = await fetch('/api/profile/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress: address
        }),
        // Add credential inclusion for security
        credentials: 'same-origin'
      });

      // Handle non-OK responses
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate signature');
      }

      // Parse and validate the signature data
      const data = await response.json();
      
      // Validate expected public fields are present
      const requiredPublicFields = ['signature', 'twitterUsername', 
        'walletAddress', 'platform', 'expiresAt'];
      
      for (const field of requiredPublicFields) {
        if (!data[field]) {
          throw new Error(`Signature data missing required field: ${field}`);
        }
      }
      
      // Validate the crypto metadata fields are present
      if (!data._cryptoMetadata) {
        throw new Error('Signature data missing cryptographic metadata');
      }
      
      const requiredCryptoFields = ['salt', 'nonce', 'timestamp', 'domain'];
      
      for (const field of requiredCryptoFields) {
        if (!data._cryptoMetadata[field]) {
          throw new Error(`Signature data missing required cryptographic field: ${field}`);
        }
      }
      
      // Ensure wallet address matches
      if (data.walletAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Signature wallet address mismatch');
      }
      // Convert to our expected SignatureData format before storing
      const normalizedData: SignatureData = {
        signature: data.signature,
        twitterUsername: data.twitterUsername,
        walletAddress: data.walletAddress,
        platform: data.platform,
        expiresAt: data.expiresAt,
        _cryptoMetadata: {
          salt: data._cryptoMetadata.salt,
          nonce: data._cryptoMetadata.nonce,
          timestamp: data._cryptoMetadata.timestamp,
          domain: data._cryptoMetadata.domain
        }
      };
      
      // Store the validated signature data
      setSignatureData(normalizedData);
      // console.debug('normalizedData', normalizedData);
      return normalizedData;
    } catch (err) {
      console.error('Error generating signature:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, [address, isTwitterVerified, session]);

  useEffect(() => {
    // console.debug('signatureData', signatureData);
    if (signatureData) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime > signatureData.expiresAt || !isTwitterVerified || status !== 'authenticated') {
        // Clear expired signature
        setSignatureData(null);
        setError('Signature has expired. Please generate a new one.');
      }
    }
  }, [signatureData, isTwitterVerified, status]);

  return useMemo(() => ({
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isTwitterVerified,
    twitterUsername: session?.user?.twitterUsername,
    twitterName: session?.user?.twitterName,
    twitterImage: session?.user?.image,
    connectTwitter,
    disconnectTwitter,
    generateSignature,
    isVerifying,
    signatureData,
    signature: signatureData?.signature || null,
    error,
    // Add the expiration information
    expiresAt: signatureData?.expiresAt || null,
    isExpired: signatureData ? (Math.floor(Date.now() / 1000) > signatureData.expiresAt) : false,
  }), [status, session, address, isTwitterVerified, signatureData, generateSignature, connectTwitter, disconnectTwitter, isVerifying, signatureData, error]);
} 