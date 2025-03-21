'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { useTwitterVerification } from '@/hooks/useTwitterVerification';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { FiUsers, FiMessageCircle, FiDollarSign, FiInfo, FiArrowRight, FiUser, FiCheckCircle, FiShield, FiFileText, FiCopy } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import XLogo from '@/ui/icons/XLogo';
import ConnectedAccounts from './ConnectedAccounts';
import RegistrationSteps from './RegistrationSteps';
import ProfileImageUpload from './ProfileImageUpload';
import { cn } from '@/utils/cn';
import CustomConnect from '@/components/CustomConnect';
import {
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useAccount, 
  useSignTypedData
} from 'wagmi';
import { Address, parseEther, parseAbi, ContractFunctionExecutionError } from 'viem';
import BNBLogo from '../icons/BNBLogo';
import Image from 'next/image';
import appConfig from '@/config/app.config.json';
// ABI for the registerKOL function
const RABITA_REGISTRY_ABI = parseAbi([
  `function registerKOL( string _platform, string _username, string _name, uint256 _fee, string _profileIpfsHash, bytes32 _salt, bytes16 _nonce, uint256 _timestamp, string _domain, uint256 _expiresAt, bytes _verifierSignature, bytes _userSignature) external`,
]);

// Contract address from environment
const RABITA_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_RABITA_REGISTRY_ADDRESS as Address;

// Registration status enum
type RegistrationStatus = 'idle' | 'signing' | 'pending' | 'success' | 'error';

// FormData interface for registration
interface RegistrationFormData {
  profilePictureIpfsHash: string;
  fee: string;
}

/**
 * Handles the KOL registration process including the promotion and steps
 */
export default function KOLRegistrationView() {
  const { address, isConnected } = useActiveWallet();
  const {
    isAuthenticated,
    isTwitterVerified,
    twitterUsername,
    twitterName,
    twitterImage,
    signature: twitterSignature,
    signatureData,
    generateSignature,
  } = useTwitterVerification();

  const { address: accountAddress } = useAccount();

  // Registration process tracking states
  const [formDataVisible, setFormDataVisible] = useState(false);
  const [hasSetFee, setHasSetFee] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('idle');
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [userVerifySignature, setUserVerifySignature] = useState<string | undefined>(undefined);
  const [copiedSignature, setCopiedSignature] = useState(false);
  const [isGeneratingSignature, setIsGeneratingSignature] = useState(false);
  const [signatureGenerationFailed, setSignatureGenerationFailed] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    profilePictureIpfsHash: '',
    fee: '0.01',
  });

  // Wagmi hooks for contract interaction
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: txHash,
      confirmations: 1,
    });

  // Get the actual X handle and name to use
  const effectiveTwitterHandle = twitterUsername || '';
  const effectiveName = twitterName || effectiveTwitterHandle || '';
  
  // Get the profile image, ensuring it's a string or undefined (not null)
  const effectiveProfileImageUrl = (typeof twitterImage === 'string' ? twitterImage : undefined);

  // Reset registration when wallet changes
  useEffect(() => {
    setRegistrationStatus('idle');
    setFormDataVisible(false);
    setHasSetFee(true);
    setTransactionSubmitted(false);
    setOwnershipVerified(false);
    setCopiedSignature(false);
    setIsGeneratingSignature(false);
    setSignatureGenerationFailed(false);
  }, [address]);

  // Update registration status based on confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      setRegistrationStatus('success');
      setTransactionSubmitted(true);
      toast.success('Successfully registered as a KOL!', {
        duration: 5000,
        icon: <FiCheckCircle className="text-green-500" size={18} />,
      });
      
      // After successful registration, redirect to profile page after a delay
      setTimeout(() => {
        window.location.reload();
      }, 8000);
    }
  }, [isConfirmed, txHash]);

  // Handle form visibility changes
  const handleFormVisibilityChange = useCallback((isVisible: boolean) => {
    console.debug('Form visibility changed:', isVisible);
    setFormDataVisible(isVisible);
    
    // When form is shown, scroll to it for better visibility
    if (isVisible) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, []);

  // Handle profile image IPFS hash change
  const handleIpfsHashChange = useCallback((hash: string) => {
    setFormData(prev => ({ ...prev, profilePictureIpfsHash: hash }));
  }, []);

  // Handle fee change
  const handleFeeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = value.split('.');
    const sanitizedValue = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : value;
      
    setFormData(prev => ({ ...prev, fee: sanitizedValue }));
    
    // Check if a valid fee is set
    const isValidFee = parseFloat(sanitizedValue) > 0;
    setHasSetFee(isValidFee);
  }, []);
  
  // Handle copying signature to clipboard
  const handleCopySignature = useCallback(() => {
    if (twitterSignature) {
      navigator.clipboard.writeText(twitterSignature);
      setCopiedSignature(true);
      toast.success('Signature copied to clipboard');
      setTimeout(() => setCopiedSignature(false), 2000);
    }
  }, [twitterSignature]);

  // Handle ownership verification by signing a message
  const verifyOwnership = useCallback(async () => {
    if (!accountAddress || !twitterUsername || !twitterName || !signatureData || !twitterSignature) {
      toast.error('Missing information for verification');
      return;
    }
    
    // Prevent multiple clicks/verifications
    if (registrationStatus === 'signing') return null;
    
    try {
      setRegistrationStatus('signing');
      
      // Create expiration timestamp (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      const expirationTimestamp = Math.floor(expiresAt.getTime() / 1000);
      
      // Create message to sign
      const messageToSign = {
        walletAddress: accountAddress,
        platform: 'twitter',
        username: twitterUsername,
        salt: signatureData._cryptoMetadata.salt as `0x${string}`,
        nonce: signatureData._cryptoMetadata.nonce as `0x${string}`,
        timestamp: BigInt(signatureData._cryptoMetadata.timestamp),
        domain: signatureData._cryptoMetadata.domain,
        expiresAt: BigInt(signatureData.expiresAt),
        signature: signatureData.signature as `0x${string}`,
      };
      
      // Show toast notification with a clear ID
      const toastId = toast.loading('Please sign the message to verify account ownership...', {
        duration: Infinity, // Prevent auto-dismissal
      });
      
      // Set up timeout
      let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
        toast.error('Signature request timed out', { id: toastId, duration: 5000 });
        timeoutId = null;
        throw new Error('Signature request timed out');
      }, 60000);
      
      try {
        // Request user signature
        const signature = await signTypedDataAsync({
          domain: {
            name: 'Rabita Social Verification',
            version: '1',
            chainId: BigInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97'),
            verifyingContract: process.env.NEXT_PUBLIC_RABITA_REGISTRY_ADDRESS as `0x${string}`,
          },
          primaryType: 'SocialVerification',
          types: {
            SocialVerification: [
              { name: 'walletAddress', type: 'address' },
              { name: 'platform', type: 'string' },
              { name: 'username', type: 'string' },
              { name: 'salt', type: 'bytes32' },
              { name: 'nonce', type: 'bytes16' },
              { name: 'timestamp', type: 'uint256' },
              { name: 'domain', type: 'string' },
              { name: 'expiresAt', type: 'uint256' },
              { name: 'signature', type: 'bytes' },
            ]
          },
          message: {
            walletAddress: accountAddress,
            platform: 'twitter',
            username: twitterUsername,
            salt: signatureData._cryptoMetadata.salt as `0x${string}`,
            nonce: signatureData._cryptoMetadata.nonce as `0x${string}`,
            timestamp: BigInt(signatureData._cryptoMetadata.timestamp),
            domain: signatureData._cryptoMetadata.domain,
            expiresAt: BigInt(signatureData.expiresAt),
            signature: signatureData.signature as `0x${string}`,
          },
        });

        console.debug({
          walletAddress: accountAddress,
          platform: 'twitter',
          username: twitterUsername,
          salt: signatureData._cryptoMetadata.salt as `0x${string}`,
          nonce: signatureData._cryptoMetadata.nonce as `0x${string}`,
          timestamp: BigInt(signatureData._cryptoMetadata.timestamp),
          domain: signatureData._cryptoMetadata.domain,
          expiresAt: BigInt(signatureData.expiresAt),
          signature: signatureData.signature as `0x${string}`,
          signedMessage: signature,
        })
        
        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Update toast for success
        toast.success('Account ownership verified!', { 
          id: toastId,
          duration: 3000,
        });
        
        setUserVerifySignature(signature);
        setOwnershipVerified(true);
        return { signature, messageToSign };
      } catch (error) {
        // Clear timeout if it exists
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Handle user rejection or error
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Verification failed';
        
        if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
          toast.error('You rejected the signature request', { id: toastId, duration: 5000 });
        } else {
          toast.error(`Verification failed: ${errorMessage}`, { id: toastId, duration: 5000 });
        }
        
        console.error('Verification error:', error);
        return null;
      }
    } catch (error) {
      console.error('Verification setup error:', error);
      toast.error('Failed to prepare verification. Please try again.');
      return null;
    } finally {
      // Reset status with slight delay to allow for UI transitions
      setTimeout(() => {
        if (!ownershipVerified) {
          setRegistrationStatus('idle');
        }
      }, 500);
    }
  }, [accountAddress, twitterUsername, twitterName, signatureData, twitterSignature, signTypedDataAsync, registrationStatus, ownershipVerified]);

  // Handle form submission for registration
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate prerequisites
    if (!accountAddress || !RABITA_REGISTRY_ADDRESS) {
      toast.error('Wallet or contract is not available');
      return;
    }

    if (!signatureData) {
      toast.error('X signature is missing');
      return;
    }

    if (!effectiveTwitterHandle) {
      toast.error('X handle is required');
      return;
    }

    if (!effectiveName) {
      toast.error('Name is required');
      return;
    }
    
    // Prevent multiple submissions
    if (registrationStatus === 'pending' || registrationStatus === 'signing') {
      return;
    }
    
    // Create a toast ID for tracking this operation
    const toastId = toast.loading('Preparing registration...', {
      duration: Infinity,
    });

    const { expiresAt, twitterUsername, walletAddress, platform, _cryptoMetadata: { salt, nonce, timestamp, domain } } = signatureData;
    
    try {
      // First verify ownership if not already verified
      let userSignature = userVerifySignature
      if (!ownershipVerified && !userSignature) {
        // toast.loading('Verifying wallet ownership first...', { id: toastId });
        const verificationResult = await verifyOwnership();
        if (!verificationResult) {
          toast.error('Ownership verification failed. Please try again.', { id: toastId, duration: 5000 });
          return; // Verification failed
        }
        userSignature = verificationResult.signature;
      }
      
      // Prepare IPFS hash (use provided or empty string if not available)
      const profileIpfsHash = formData.profilePictureIpfsHash.trim() || '';

      // Trigger contract write
      setRegistrationStatus('pending');
      
      toast.loading('Submitting registration to blockchain...', { id: toastId });
      
      // Set up timeout for transaction
      let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
        toast.error('Transaction submission timed out. The network might be congested.', { 
          id: toastId, 
          duration: 5000 
        });
        timeoutId = null;
        setRegistrationStatus('error');
      }, 90000); // 90 second timeout for transaction

      console.debug({
        effectiveTwitterHandle,
        effectiveName,
        profileIpfsHash,
        fee: formData.fee,
        userSignature,
        expiresAt,
        twitterUsername,
        walletAddress,
        platform,
        salt,
        nonce,
      });

      console.debug(
        platform,
        effectiveTwitterHandle,
        effectiveName,
        parseEther(formData.fee || '0.01'),
        profileIpfsHash,
        salt as `0x${string}`,
        nonce as `0x${string}`,
        BigInt(timestamp),
        domain,
        BigInt(expiresAt),
        twitterSignature as `0x${string}`,
        userSignature as `0x${string}`
      );
      
      try {
        // Use writeContractAsync for proper contract interaction
        const hash = await writeContractAsync({
          address: RABITA_REGISTRY_ADDRESS,
          abi: RABITA_REGISTRY_ABI,
          functionName: 'registerKOL',
          args: [
            platform,
            effectiveTwitterHandle,
            effectiveName,
            parseEther(formData.fee || '0.01'),
            profileIpfsHash,
            salt as `0x${string}`,
            nonce as `0x${string}`,
            BigInt(timestamp),
            domain,
            BigInt(expiresAt),
            twitterSignature as `0x${string}`,
            userSignature as `0x${string}`
          ],
        });
        
        // Clear timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        setTxHash(hash);
        
        // Show success toast
        // toast.success('Transaction submitted!', { id: toastId });
        
        // Show transaction hash toast (separate toast)
        toast.success(
          <div>
            <p className="font-medium">Transaction submitted</p>
            <a 
              href={`https://testnet.bscscan.com/tx/${hash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              View on BscScan
            </a>
          </div>,
          { duration: 5000 }
        );
        
        // Update transaction submitted state
        setTransactionSubmitted(true);
        
        // Wait for transaction to be confirmed before showing final success message
        setTimeout(() => {
          toast.success('Your KOL profile is being created on the BSC!', {
            icon: '🚀',
            duration: 5000
          });
        }, 1000);
      } catch (error) {
        // Clear timeout if it exists
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        console.error('Transaction error:', error);
        
        // Extract a clean error message from the error object
        let errorMessage = 'Unknown error occurred';
        
        // Handle ContractFunctionExecutionError specifically
        if (error instanceof ContractFunctionExecutionError) {
          // Extract the meaningful part of the error message
          const errorString = error.message || '';
          // Look for the actual error message, usually after "execution reverted:"
          const executionRevertedMatch = errorString.match(/execution reverted:([^"]+)/i);
          
          if (executionRevertedMatch && executionRevertedMatch[1]?.trim()) {
            // Use the extracted message
            errorMessage = executionRevertedMatch[1].trim();
          } else if (errorString.includes('user rejected transaction')) {
            errorMessage = 'You rejected the transaction';
          } else if (errorString.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for transaction';
          } else {
            // If we can't extract a specific part, trim the error to a reasonable length
            errorMessage = errorString.length > 100 
              ? errorString.substring(0, 100) + '...' 
              : errorString;
          }
        } else if (error instanceof Error) {
          // For standard errors, use the message property
          errorMessage = error.message;
          
          // Check for common error patterns
          if (errorMessage.includes('user rejected transaction')) {
            errorMessage = 'You rejected the transaction';
          } else if (errorMessage.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for transaction';
          } else if (errorMessage.length > 100) {
            // For overly long messages, truncate them
            errorMessage = errorMessage.substring(0, 100) + '...';
          }
        }
        
        // Show a more user-friendly error message
        toast.error(`Transaction failed: ${errorMessage}`, { id: toastId, duration: 5000 });
        
        setRegistrationStatus('error');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      toast.error(errorMessage, { id: toastId, duration: 5000 });
      setRegistrationStatus('error');
    }
  }, [accountAddress, effectiveTwitterHandle, effectiveName, formData, signatureData, ownershipVerified, verifyOwnership, writeContractAsync, registrationStatus]);

  // Generate signature button handler
  const handleGenerateSignature = useCallback(async () => {
    if (!generateSignature) return;
    
    // Prevent multiple clicks
    if (isGeneratingSignature) return;
    
    // Reset failure state and set loading state
    setSignatureGenerationFailed(false);
    setIsGeneratingSignature(true);
    
    // Show loading toast with a clear ID
    const toastId = toast.loading('Generating verification signature...', {
      duration: Infinity, // Prevent auto-dismissal
    });
    
    // Set up timeout
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      toast.error('Signature generation timed out. Please try again.', { id: toastId, duration: 5000 });
      timeoutId = null;
      setIsGeneratingSignature(false);
      setSignatureGenerationFailed(true);
    }, 30000); // 30 second timeout
    
    try {
      // Generate the signature
      const result = await generateSignature();

      if (!result) {
        throw new Error('Signature generation failed');
      }
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (result) {
        // Success case - update toast
        toast.success('Signature successfully generated!', { 
          id: toastId,
          duration: 3000,
        });
        setSignatureGenerationFailed(false);
      } else {
        // Handle the case where generation returned null but didn't throw
        toast.error('Failed to generate signature. Please try again.', { 
          id: toastId,
          duration: 5000,
        });
        setSignatureGenerationFailed(true);
      }
    } catch (error) {
      // Clear timeout if it exists
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Handle any errors, ensuring the toast is updated
      console.error('Error generating signature:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update the toast with error information
      toast.error(`Signature generation failed: ${errorMessage}`, { 
        id: toastId,
        duration: 5000,
      });

      setIsGeneratingSignature(false);
      setSignatureGenerationFailed(true);
    } finally {
      // Always clear loading state, with a slight delay to allow for UI transitions
      // Only clear if not already cleared by timeout
      if (timeoutId) {
        setTimeout(() => {
          setIsGeneratingSignature(false);
        }, 500);
      }
    }
  }, [generateSignature, isGeneratingSignature]);

  // Validate prerequisites for registration
  const canRegister = isConnected && isTwitterVerified && twitterUsername && twitterSignature;

  // If already in success state
  if (registrationStatus === 'success') {
    return (
      <div className="container py-8 lowercase">
        <Card className="border-0 shadow-md p-8 text-center">
          <Image src="/logo.svg" alt="logo" className='mx-auto mb-4' width={200} height={200}/>
          <h2 className="text-2xl font-bold mb-2 text-primary">welcome to {appConfig.name}!</h2>
          <p className="text-muted-foreground mb-4 text-primary/80">
            Your KOL profile has been successfully created on the binance smart chain.
          </p>
          <p className="text-sm text-muted-foreground text-primary/40">
            Redirecting to your profile...
          </p>
        </Card>
      </div>
    );
  }

  // Generate the main register button
  const renderRegisterButton = () => {
    if (!isConnected) {
      return <CustomConnect />;
    }
    
    if (!isTwitterVerified) {
      return (
        <button 
          disabled
          className="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium"
        >
          <div className="flex items-center justify-center gap-2">
            <XLogo size={16} /> 
            Waiting for X verification
          </div>
        </button>
      );
    }
    
    // We no longer need the separate signature generation step with NextAuth
    return (
      <button
        type="button"
        onClick={() => handleFormVisibilityChange(true)}
        className="w-full px-4 py-3 bg-primary text-dark rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center justify-center gap-2"
      >
        <span>Configure Your KOL Profile</span>
        <FiArrowRight />
      </button>
    );
  };

  return (
    <div className="container py-8 lowercase">
      <Card className="border-0 shadow-md overflow-hidden shadow-elevation">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary-dark/5 p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                <FiUsers className="text-primary" size={36} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Become a KOL</h1>
              <p className="text-muted-foreground mt-1 text-white">
              Join Rabita as a Key Opinion Leader and monetize your influence through every valuable interaction
              </p>
            </div>
          </div>
        </div>
        
        <CardContent className="pt-6">
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center text-center p-4 rounded-lg shadow-elevation bg-background-light">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <FiMessageCircle className="text-primary" size={20} />
              </div>
              <h3 className="font-medium mb-1 text-foreground">Connect With Followers</h3>
              <p className="text-sm text-muted-foreground text-white">Build deeper relationships with your audience through direct messaging</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg shadow-elevation bg-background-light">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <FiDollarSign className="text-primary" size={20} />
              </div>
              <h3 className="font-medium mb-1 text-foreground">Set Custom Fees</h3>
              <p className="text-sm text-muted-foreground text-white">Determine your own rates for interactions and monetize your influence</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg shadow-elevation bg-background-light">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <XLogo className="text-primary" size={20} />
              </div>
              <h3 className="font-medium mb-1 text-foreground">Verified Authenticity</h3>
              <p className="text-sm text-muted-foreground text-white">Link your social media accounts to prove your identity on-chain</p>
            </div>
          </div>

          {/* Connected Accounts Section */}
          <ConnectedAccounts />

          {/* Registration Process Section */}
          <div className="bg-gray-50 p-5 rounded-lg mb-6">
            <h3 className="font-medium mb-3">Registration Process</h3>
            {/* Registration Steps List */}
            <RegistrationSteps 
              isAuthenticated={isAuthenticated}
              isTwitterVerified={isTwitterVerified}
              signature={twitterSignature}
              formDataVisible={formDataVisible}
              hasSetFee={hasSetFee}
              transactionSubmitted={transactionSubmitted}
              ownershipVerified={ownershipVerified}
              onGenerateSignature={handleGenerateSignature}
              isGeneratingSignature={isGeneratingSignature}
              signatureGenerationFailed={signatureGenerationFailed}
            />
          </div>
          
          <div className="pt-4 border-t border-border">
            {/* Render Register Form or Button */}
            <div className="space-y-6">
              {!formDataVisible && twitterSignature && (
                <div>
                  {renderRegisterButton()}
                </div>
              )}
              
              {formDataVisible && (
                <div>
                  <form 
                    onSubmit={handleSubmit} 
                    className="space-y-6"
                  >
                    <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                      <h3 className="text-base font-medium text-gray-800 mb-4">Registration Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                            <XLogo size={14} className="text-primary" />
                            your handle
                          </label>
                          <div className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-md">
                            <span className="text-gray-400">@</span>
                            <span className="ml-1 font-medium text-gray-800">{effectiveTwitterHandle}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 lowercase">
                            <FiUser size={14} className="text-primary" />
                            Display Name
                          </label>
                          <div className="px-3 py-2 bg-white border border-gray-200 rounded-md">
                            <span className="font-medium text-gray-800">{effectiveName}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 space-y-1.5">
                        <label htmlFor="messageFee" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                          <BNBLogo size={20} />
                          message fee (BNB)
                        </label>
                        <div className="relative">
                          <input
                            id="messageFee"
                            type="text"
                            inputMode="decimal"
                            value={formData.fee}
                            onChange={handleFeeChange}
                            className={cn(
                              "w-full h-10 px-3 py-2 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200",
                              parseFloat(formData.fee) > 0 ? "border-gray-300" : "border-red-300"
                            )}
                            placeholder="0.01"
                            aria-describedby="fee-description"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            <span className="text-sm font-medium text-gray-500">BNB</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 mt-1.5" id="fee-description">
                          <FiInfo className="shrink-0 mt-0.5 text-gray-400" size={14} />
                          <p className="text-xs text-gray-500">
                            This is the amount users will pay to send you a message. We recommend a reasonable amount (0.01-0.5 BNB) to maximize engagement.
                          </p>
                        </div>
                        {parseFloat(formData.fee) <= 0 && (
                          <p className="text-xs text-red-500 mt-1">Please enter a valid fee amount greater than 0</p>
                        )}
                      </div>
                    </div>
                    
                    <ProfileImageUpload 
                      onIpfsHashChange={handleIpfsHashChange}
                      twitterImageUrl={effectiveProfileImageUrl}
                    />
                    
                    {!ownershipVerified && false && (
                      <div className="p-5 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="text-blue-500 mt-1">
                            <FiShield size={20} />
                          </div>
                          <div className="w-full">
                            <h4 className="text-sm font-medium text-blue-800">Verify Wallet Ownership</h4>
                            <p className="text-xs text-blue-600 mt-1 mb-3">
                              To securely link your profile with your social identity, sign a verification message with your wallet.
                            </p>
                            
                            {/* Display X Signature if available */}
                            {twitterSignature && (
                              <div className="mb-4 p-3 bg-white rounded border border-blue-200">
                                <h5 className="text-xs font-medium text-blue-800 flex items-center gap-1.5 mb-1">
                                  <FiFileText size={12} />
                                  Identity Verification
                                </h5>
                                <p className="text-xs text-blue-700 mb-2">
                                  Your social identity has been verified through NextAuth. The following signature will be used for on-chain verification:
                                </p>
                                <div className="relative">
                                  <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700 max-h-[80px] overflow-y-auto break-all">
                                    {twitterSignature?.substring(0, 96)}... 
                                  </div>
                                  <button 
                                    onClick={handleCopySignature}
                                    className="absolute top-1 right-1 bg-gray-200 hover:bg-gray-300 text-gray-700 p-1 rounded"
                                    title="Copy signature"
                                  >
                                    {copiedSignature ? <FiCheckCircle size={14} /> : <FiCopy size={14} />}
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <button
                              type="button"
                              onClick={verifyOwnership}
                              disabled={registrationStatus === 'signing' || !twitterSignature}
                              className={cn(
                                "px-4 py-2 rounded-md text-white flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 text-dark",
                                registrationStatus === 'signing' 
                                  ? "bg-primary/70 cursor-not-allowed" 
                                  : !twitterSignature
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-primary hover:bg-primary-dark active:scale-[0.98]"
                              )}
                            >
                              {registrationStatus === 'signing' ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Waiting for signature...
                                </>
                              ) : (
                                <>
                                  <FiShield size={16} />
                                  {twitterSignature ? 'Sign & Verify Wallet Ownership' : 'X verification required'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <button
                        type="submit"
                        className={cn(
                          "sm:flex-1 px-4 py-3 rounded-lg text-dark flex items-center justify-center gap-2 font-medium transition-all duration-200",
                          (registrationStatus === 'pending' || registrationStatus === 'signing' || parseFloat(formData.fee) <= 0)
                            ? "bg-primary/70 cursor-not-allowed" 
                            : "bg-primary hover:bg-primary-dark active:scale-[0.98] cursor-pointer"
                        )}
                      >
                        {registrationStatus === 'pending' ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Registering...
                          </>
                        ) : (
                          <>
                            <span>Complete Registration</span>
                            <FiArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                    
                    <p className="text-xs text-center text-gray-500 mt-2">
                      By registering, you agree to the Rabita terms of service and will be registered on the BSC blockchain
                    </p>
                  </form>
                </div>
              )}
            </div>
            
            {/* Guidance Panel */}
            {isTwitterVerified && !transactionSubmitted && (
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 transition-all duration-300 ease-in lowercase">
                {!twitterSignature && (
                  <div className="flex items-start gap-3">
                    <div className="text-blue-500 mt-1">
                      <FiInfo size={18} />
                    </div>
                    <div className="w-full">
                      <h4 className="text-sm font-medium text-blue-800">Complete Social Verification</h4>
                      <p className="text-xs text-blue-600 mt-1 mb-2">
                        {signatureGenerationFailed 
                          ? "Signature generation failed. Please try again to link your X account to your wallet."
                          : "Your X account has been verified, but we need to generate a cryptographic signature to link it to your wallet."
                        }
                      </p>
                      <button 
                        onClick={handleGenerateSignature}
                        disabled={isGeneratingSignature}
                        className={cn(
                          "mt-2 w-full sm:w-auto px-4 py-2 rounded-md text-black transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium",
                          signatureGenerationFailed
                            ? "bg-red-500 hover:bg-red-600 text-white" 
                            : "bg-primary hover:bg-primary-dark"
                        )}
                      >
                        {isGeneratingSignature ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : signatureGenerationFailed ? (
                          <>
                            <FiFileText size={14} />
                            Retry Signature Generation
                          </>
                        ) : (
                          <>
                            <FiFileText size={14} />
                            Generate Verification Signature
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {twitterSignature && !formDataVisible && (
                  <div className="flex items-start gap-3">
                    <div className="text-blue-500 mt-1">
                      <FiInfo size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Ready for the next step?</h4>
                      <p className="text-xs text-blue-600 mt-1">
                        Click the "Configure Your KOL Profile" button above to set your messaging fee and customize your profile.
                      </p>
                    </div>
                  </div>
                )}
                
                {formDataVisible && !hasSetFee && (
                  <div className="flex items-start gap-3">
                    <div className="text-blue-500 mt-1">
                      <FiInfo size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Complete your profile</h4>
                      <p className="text-xs text-blue-600 mt-1">
                        Please set a messaging fee and optionally upload a profile picture to continue.
                      </p>
                    </div>
                  </div>
                )}
                
                {formDataVisible && hasSetFee && !ownershipVerified && (
                  <div className="flex items-start gap-3">
                    <div className="text-blue-500 mt-1">
                      <FiInfo size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Verify Wallet Ownership</h4>
                      <p className="text-xs text-blue-600 mt-1 mb-3">
                        To securely link your profile with your social identity, sign a verification message with your wallet.
                      </p>
                    </div>
                  </div>
                )}
                
                {formDataVisible && hasSetFee && ownershipVerified && !transactionSubmitted && (
                  <div className="flex items-start gap-3">
                    <div className="text-blue-500 mt-1">
                      <FiInfo size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Almost there!</h4>
                      <p className="text-xs text-blue-600 mt-1">
                        Click "Complete Registration" to finalize your KOL profile on the blockchain.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 