'use client';

import { useState, useEffect, useRef } from 'react';
import { useTwitterVerification } from '@/hooks/useTwitterVerification';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { WalletConnectStatus } from './WalletConnectStatus';
import { TwitterVerificationStatus } from './TwitterVerificationStatus';
import SignatureVerification from './SignatureVerification';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

/**
 * Main container component for the profile page
 * Handles the main logic and composition of profile components
 */
export function ProfileContainer() {
  const { 
    isTwitterVerified, 
    twitterUsername, 
    twitterName,
    twitterImage,
    connectTwitter, 
    disconnectTwitter,
    generateSignature,
    isVerifying,
    signatureData,
    signature,
    error
  } = useTwitterVerification();
  
  const { address, isConnected } = useActiveWallet();
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const hasMounted = useRef(false);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const router = useRouter();

  // useEffect(() => {
  //   if (!isConnected) {
  //     router.push('/');
  //   }
  // }, [isConnected]);

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, []);

  // Generate signature when conditions are met, but only once after initial mount
  useEffect(() => {
    // Skip on first render to prevent immediate API calls
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    // Only attempt to generate a signature if all conditions are met and not on cooldown
    if (isConnected && isTwitterVerified && !signatureData && !isVerifying && !isOnCooldown && retryCount < 3) {
      const attemptSignatureGeneration = async () => {
        try {
          setIsOnCooldown(true); // Prevent multiple calls immediately
          await generateSignature();
          // Success - don't need further retries
          setRetryCount(0);
        } catch (err) {
          // Increment retry count to limit number of attempts
          setRetryCount(prev => prev + 1);
          
          // Set a longer cooldown period with each retry
          const cooldownTime = Math.min(60000 * (retryCount + 1), 300000); // Up to 5 minutes
          
          console.log(`Signature generation failed. Cooling down for ${cooldownTime/1000} seconds.`);
          
          // Schedule cooldown removal after the timeout
          requestTimeoutRef.current = setTimeout(() => {
            setIsOnCooldown(false);
          }, cooldownTime);
        }
      };

      attemptSignatureGeneration();
    }
  }, [isConnected, isTwitterVerified, signatureData, isVerifying, isOnCooldown, generateSignature, retryCount]);

  // Manual retry handler with progressive backoff
  const handleManualRetry = () => {
    if (isVerifying || isOnCooldown) return;
    
    // Reset cooldown and attempt to generate signature
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }
    
    setIsOnCooldown(true);
    
    generateSignature()
      .then(() => {
        // Success - reset states
        setRetryCount(0);
        setIsOnCooldown(false);
      })
      .catch(() => {
        // Implement exponential backoff for manual retries too
        const cooldownTime = Math.min(30000 * (retryCount + 1), 120000); // Up to 2 minutes
        
        console.log(`Manual retry failed. Cooling down for ${cooldownTime/1000} seconds.`);
        
        requestTimeoutRef.current = setTimeout(() => {
          setIsOnCooldown(false);
        }, cooldownTime);
        
        setRetryCount(prev => Math.min(prev + 1, 5)); // Cap retries at 5
      });
  };

  // Calculate cooldown remaining time
  const getCooldownText = () => {
    if (!isOnCooldown) return "Try Again";
    
    // Calculate increasing wait times based on retry count
    const baseTime = retryCount === 0 ? 30 : Math.min(30 * (retryCount + 1), 120);
    return `Please wait (${baseTime}s)`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-background-light rounded-xl p-6 shadow-elevation">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          profile verification
        </h1>

        {/* Profile Info */}
        {isTwitterVerified && twitterUsername && (
          <div className="mb-6 flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            {twitterImage && (
              <div className="mr-4 relative overflow-hidden rounded-full border-2 border-blue-300">
                <Image 
                  src={twitterImage} 
                  alt={`${twitterUsername}'s profile`}
                  width={60} 
                  height={60}
                  className="rounded-full"
                />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-lg text-gray-800">
                {twitterName || twitterUsername}
              </h2>
              <p className="text-blue-600">@{twitterUsername}</p>
              <div className="mt-1 text-xs text-gray-500">
                Verified X Account
              </div>
            </div>
          </div>
        )}

        {/* Wallet Connection Status */}
        <WalletConnectStatus 
          isConnected={isConnected} 
          address={address}
        />

        {/* Twitter Verification */}
        <TwitterVerificationStatus 
          isVerified={isTwitterVerified}
          username={twitterUsername}
          name={twitterName}
          onConnect={connectTwitter}
          onDisconnect={disconnectTwitter}
        />

        {/* Verification Signature */}
        {isConnected && isTwitterVerified && (
          <div>
            {isVerifying && (
              <div className="text-center p-4">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                <p className="mt-2">Generating signature...</p>
              </div>
            )}
            
            {(error || retryCount >= 3) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 mt-4">
                <p>
                  {retryCount >= 3 
                    ? "Too many attempts. Please try again later." 
                    : error || "Failed to generate signature."}
                </p>
                <button 
                  onClick={handleManualRetry}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isOnCooldown || isVerifying}
                >
                  {getCooldownText()}
                </button>
              </div>
            )}
            
            {!isVerifying && !error && signatureData && (
              <SignatureVerification 
                signatureData={JSON.stringify(signatureData)} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 