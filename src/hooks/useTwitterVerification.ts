'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useActiveWallet } from './useActiveWallet';
import { ethers } from 'ethers';

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

export function useTwitterVerification() {
  const { data: session, status } = useSession();
  const { address } = useActiveWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTwitterVerified = !!session?.user?.isTwitterVerified;
  
  const connectTwitter = useCallback(() => {
    signIn('twitter', { callbackUrl: '/profile' });
  }, []);

  const disconnectTwitter = useCallback(() => {
    signOut({ callbackUrl: '/profile' });
  }, []);

  const generateSignature = useCallback(async () => {
    setError(null);
    
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    if (!ethers.isAddress(address)) {
      setError('Invalid wallet address format');
      return null;
    }

    if (!isTwitterVerified || !session?.user?.twitterId || !session?.user?.twitterUsername) {
      setError('X account not verified, need verified X account to generate signature');
      return null;
    }

    try {
      setIsVerifying(true);

      const response = await fetch('/api/profile/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress: address
        }),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate signature');
      }

      const data = await response.json();
      
      const requiredPublicFields = ['signature', 'twitterUsername', 
        'walletAddress', 'platform', 'expiresAt'];
      
      for (const field of requiredPublicFields) {
        if (!data[field]) {
          throw new Error(`Signature data missing required field: ${field}`);
        }
      }
      
      if (!data._cryptoMetadata) {
        throw new Error('Signature data missing cryptographic metadata');
      }
      
      const requiredCryptoFields = ['salt', 'nonce', 'timestamp', 'domain'];
      
      for (const field of requiredCryptoFields) {
        if (!data._cryptoMetadata[field]) {
          throw new Error(`Signature data missing required cryptographic field: ${field}`);
        }
      }
      
      if (data.walletAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Signature wallet address mismatch');
      }
      
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
      
      setSignatureData(normalizedData);
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
    if (signatureData) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime > signatureData.expiresAt || !isTwitterVerified || status !== 'authenticated') {
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
    expiresAt: signatureData?.expiresAt || null,
    isExpired: signatureData ? (Math.floor(Date.now() / 1000) > signatureData.expiresAt) : false,
  }), [
    status,
    session,
    isTwitterVerified,
    connectTwitter,
    disconnectTwitter,
    generateSignature,
    isVerifying,
    signatureData,
    error
  ]);
} 