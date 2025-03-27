'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { useTwitterVerification } from '@/hooks/useTwitterVerification';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { FiUsers, FiInfo, FiArrowRight, FiUser, FiCheckCircle, FiFileText } from 'react-icons/fi';
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
import RABITA_REGISTRY_ABI from '@/config/rabita.abi.json';
import { Loader2 } from 'lucide-react';
import RabitaLogo from '../icons/RabitaLogo';
import { useMessaging } from '@/hooks/useMessaging';
import { env } from '@/config/env';

const RABITA_REGISTRY_ADDRESS = env.RABITA_REGISTRY_ADDRESS as Address;

type RegistrationStatus = 'idle' | 'signing' | 'pending' | 'success' | 'error';

interface RegistrationFormData {
  profilePictureIpfsHash: string;
  fee: string;
}

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
    disconnectTwitter
  } = useTwitterVerification();

  const { generateKeys } = useMessaging()

  const { address: accountAddress } = useAccount();
  const [formDataVisible, setFormDataVisible] = useState(false);
  const [hasSetFee, setHasSetFee] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('idle');
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [userVerifySignature, setUserVerifySignature] = useState<string | undefined>(undefined);
  const [isGeneratingSignature, setIsGeneratingSignature] = useState(false);
  const [signatureGenerationFailed, setSignatureGenerationFailed] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    profilePictureIpfsHash: '',
    fee: '0.01',
  });

  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const { isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: txHash,
      confirmations: 1,
    });

  const effectiveSocialHandle = twitterUsername || '';
  const effectiveName = twitterName || effectiveSocialHandle || '';  
  const effectiveProfileImageUrl = (typeof twitterImage === 'string' ? twitterImage : undefined);

  useEffect(() => {
    setRegistrationStatus('idle');
    setFormDataVisible(false);
    setHasSetFee(true);
    setTransactionSubmitted(false);
    setOwnershipVerified(false);
    setIsGeneratingSignature(false);
    setSignatureGenerationFailed(false);
  }, [address]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      setRegistrationStatus('success');
      setTransactionSubmitted(true);
      
      setTimeout(() => {
        disconnectTwitter();
      }, 6500);
    }
  }, [isConfirmed, txHash]);

  const handleFormVisibilityChange = useCallback((isVisible: boolean) => {
    setFormDataVisible(isVisible);
    
    if (isVisible) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, []);

  const handleIpfsHashChange = useCallback((hash: string) => {
    setFormData(prev => ({ ...prev, profilePictureIpfsHash: hash }));
  }, []);

  const handleFeeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    const sanitizedValue = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : value;
    setFormData(prev => ({ ...prev, fee: sanitizedValue }));
    const isValidFee = parseFloat(sanitizedValue) > 0;
    setHasSetFee(isValidFee);
  }, []);

  const verifyOwnership = useCallback(async () => {
    if (!accountAddress || !twitterUsername || !twitterName || !signatureData || !twitterSignature) {
      toast.error('Missing information for verification');
      return;
    }
    
    if (registrationStatus === 'signing') return null;
    
    try {
      setRegistrationStatus('signing');
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
      
      const toastId = toast.loading('Please sign the message to verify account ownership...', {
        duration: Infinity,
      });
      
      let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
        toast.error('Signature request timed out', { id: toastId, duration: 5000 });
        timeoutId = null;
        throw new Error('Signature request timed out');
      }, 60000);
      
      try {
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

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        toast.success('Account ownership verified!', { 
          id: toastId,
          icon: <FiCheckCircle className="text-green-500" size={18} />,
          duration: 3000,
        });
        
        setUserVerifySignature(signature);
        setOwnershipVerified(true);
        return { signature, messageToSign };
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
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
      setTimeout(() => {
        if (!ownershipVerified) {
          setRegistrationStatus('idle');
        }
      }, 500);
    }
  }, [accountAddress, twitterUsername, twitterName, signatureData, twitterSignature, signTypedDataAsync, registrationStatus, ownershipVerified, toast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountAddress || !RABITA_REGISTRY_ADDRESS) {
      toast.error('Wallet or contract is not available');
      return;
    }

    if (!signatureData) {
      toast.error('X signature is missing');
      return;
    }

    if (!effectiveSocialHandle) {
      toast.error('X handle is required');
      return;
    }

    if (!effectiveName) {
      toast.error('Name is required');
      return;
    }
    
    if (registrationStatus === 'pending' || registrationStatus === 'signing') {
      return;
    }
    
    const toastId = toast.loading('Preparing registration...', {
      duration: Infinity,
    });

    const { expiresAt, platform, _cryptoMetadata: { salt, nonce, timestamp, domain } } = signatureData;

    const { publicKey } = await generateKeys()

    if (!publicKey) {
      toast.error('Failed to generate PGP keys. Please try again.', { id: toastId, duration: 5000 });
      return;
    }
    
    try {
      let userSignature = userVerifySignature
      if (!ownershipVerified && !userSignature) {
        const verificationResult = await verifyOwnership();
        if (!verificationResult) {
          toast.error('Ownership verification failed. Please try again.', { id: toastId, duration: 5000 });
          return;
        }
        userSignature = verificationResult.signature;
      }
      
      const profileIpfsHash = formData.profilePictureIpfsHash.trim() || '';

      setRegistrationStatus('pending');
      
      // toast.loading('Submitting transaction...', { id: toastId });
      
      let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
        toast.error('Transaction submission timed out. The network might be congested.', { 
          id: toastId, 
          duration: 5000 
        });
        timeoutId = null;
        setRegistrationStatus('error');
      }, 90000);

      try {
        const hash = await writeContractAsync({
          address: RABITA_REGISTRY_ADDRESS,
          abi: RABITA_REGISTRY_ABI,
          functionName: 'registerKOL',
          args: [
            platform,
            effectiveSocialHandle,
            effectiveName,
            parseEther(formData.fee || '0.01'),
            profileIpfsHash,
            salt as `0x${string}`,
            nonce as `0x${string}`,
            BigInt(timestamp),
            domain,
            BigInt(expiresAt),
            twitterSignature as `0x${string}`,
            userSignature as `0x${string}`,
            publicKey
          ],
        });
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        setTxHash(hash);
        toast.success(
          <div>
            <p className="font-medium">Transaction submitted</p>
            <a 
              href={`${appConfig.explorer}/tx/${hash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-white hover:underline mt-1"
            >
              View on BscScan
            </a>
          </div>,
          { duration: 5000 }
        );
        
        setTransactionSubmitted(true);
        setTimeout(() => {
          toast.success('Your KOL profile is being created on the BSC!', {
            id: toastId,
            icon: '🚀',
            duration: 5000
          });
        }, 1000);
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        let errorMessage = 'Unknown error occurred';
        if (error instanceof ContractFunctionExecutionError) {
          const errorString = error.message || '';
          const executionRevertedMatch = errorString.match(/execution reverted:([^"]+)/i);
          
          if (executionRevertedMatch && executionRevertedMatch[1]?.trim()) {
            errorMessage = executionRevertedMatch[1].trim();
          } else if (errorString.includes('user rejected transaction')) {
            errorMessage = 'You rejected the transaction';
          } else if (errorString.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for transaction';
          } else {
            errorMessage = errorString.length > 100 
              ? errorString.substring(0, 100) + '...' 
              : errorString;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
          if (errorMessage.includes('user rejected transaction')) {
            errorMessage = 'You rejected the transaction';
          } else if (errorMessage.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for transaction';
          } else if (errorMessage.length > 100) {
            errorMessage = errorMessage.substring(0, 100) + '...';
          }
        }
        toast.error(`Transaction failed: ${errorMessage}`, { id: toastId, duration: 5000 });
        setRegistrationStatus('error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      toast.error(errorMessage, { id: toastId, duration: 5000 });
      setRegistrationStatus('error');
    }
  }, [accountAddress, effectiveSocialHandle, effectiveName, formData, signatureData, ownershipVerified, verifyOwnership, writeContractAsync, registrationStatus]);

  const handleGenerateSignature = useCallback(async () => {
    if (!generateSignature) return;
    
    if (isGeneratingSignature) return;
    
    setSignatureGenerationFailed(false);
    setIsGeneratingSignature(true);
    
    const toastId = toast.loading('Generating verification signature...', {
      duration: Infinity,
    });
    
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      toast.error('Signature generation timed out. Please try again.', { id: toastId, duration: 5000 });
      timeoutId = null;
      setIsGeneratingSignature(false);
      setSignatureGenerationFailed(true);
    }, 30000);
    
    try {
      const result = await generateSignature();

      if (!result) {
        throw new Error('Signature generation failed');
      }
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (result) {
        toast.success('Signature successfully generated!', { 
          id: toastId,
          duration: 3000,
        });
        setSignatureGenerationFailed(false);
      } else {
        toast.error('Failed to generate signature. Please try again.', { 
          id: toastId,
          duration: 5000,
        });
        setSignatureGenerationFailed(true);
      }
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      console.error('Error generating signature:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast.error(`Signature generation failed: ${errorMessage}`, { 
        id: toastId,
        duration: 5000,
      });

      setIsGeneratingSignature(false);
      setSignatureGenerationFailed(true);
    } finally {
      if (timeoutId) {
        setTimeout(() => {
          setIsGeneratingSignature(false);
        }, 500);
      }
    }
  }, [generateSignature, isGeneratingSignature]);

  if (registrationStatus === 'success') {
    return (
      <div className="container py-8 lowercase">
        <Card className="border-0 shadow-md p-8 text-center">
          <Image src="/logo.svg" alt="logo" className='mx-auto mb-4' width={200} height={200}/>
          <h2 className="text-2xl font-bold mb-2 text-primary">welcome to {appConfig.name}!</h2>
          <p className="text-muted-foreground mb-4 text-primary/80">
            Your KOL profile has been successfully created on the binance smart chain.
          </p>
          <Loader2 className="animate-spin text-primary text-center mx-auto" size={16} />
          <p className="text-sm text-muted-foreground text-primary/40">
            Redirecting to your profile...
          </p>
        </Card>
      </div>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center text-center p-4 rounded-lg shadow-elevation bg-background-light">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <RabitaLogo className="text-primary" />
              </div>
              <h3 className="font-medium mb-1 text-foreground">Connect With Followers</h3>
              <p className="text-sm text-muted-foreground text-white">Build deeper relationships with your audience through direct messaging</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg shadow-elevation bg-background-light">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <BNBLogo className="text-primary" size={20} />
              </div>
              <h3 className="font-medium mb-1 text-foreground">Set Custom Fees</h3>
              <p className="text-sm text-muted-foreground text-white">Determine your own rates for interactions and monetize your influence in BNB</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg shadow-elevation bg-background-light">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <div className="flex items-center justify-center relative">
                  <div className="absolute -top-4 -left-5 w-5 h-5 bg-black rounded-full flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
                    <XLogo className="w-3 h-3 text-primary" size={12} />
                  </div>
                  
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center animate-[float_4s_ease-in-out_0.5s_infinite]">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                    </svg>
                  </div>
                  
                  <div className="absolute top-0 left-0 w-5 h-5 bg-black rounded-full flex items-center justify-center animate-[float_3.5s_ease-in-out_0.2s_infinite]">
                    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  
                  <div className="absolute -bottom-5 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center animate-[float_3.2s_ease-in-out_0.7s_infinite]">
                    <BNBLogo className="w-3 h-3 text-primary" size={12} />
                  </div>
                </div>
              </div>
              <h3 className="font-medium mb-1 text-foreground">Verified Authenticity</h3>
              <p className="text-sm text-muted-foreground text-white">Link any one of your socially active accounts to prove your identity on-chain</p>
            </div>
          </div>

          <ConnectedAccounts />
          <div className="bg-gray-50 p-5 rounded-lg mb-6">
            <h3 className="font-medium mb-3">Registration Process</h3>
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
                          <div className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-md normal-case">
                            <span className="text-gray-400">@</span>
                            <span className="ml-1 font-medium text-gray-800">{effectiveSocialHandle}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 lowercase">
                            <FiUser size={14} className="text-primary" />
                            Display Name
                          </label>
                          <div className="px-3 py-2 bg-white border border-gray-200 rounded-md normal-case">
                            <span className="font-medium text-gray-800">{effectiveName}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 space-y-1.5">
                        <label htmlFor="messageFee" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 normal-case">
                          <BNBLogo size={14} className="text-primary" />
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
                            <span className="text-sm font-medium text-gray-500 normal-case">BNB</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 mt-1.5" id="fee-description">
                          <FiInfo className="shrink-0 mt-0.5 text-gray-400" size={14} />
                          <p className="text-xs text-gray-500 normal-case">
                            This is the amount users will pay to reach you. We recommend a moderate amount (0.1-1 BNB) to maximize engagement.
                          </p>
                        </div>
                        {parseFloat(formData.fee) <= 0 && (
                          <p className="text-xs text-red-500 mt-1">Please enter a valid fee amount greater than 0</p>
                        )}
                      </div>
                    </div>
                    
                    <ProfileImageUpload 
                      onIpfsHashChange={handleIpfsHashChange}
                      socialImageUrl={effectiveProfileImageUrl}
                    />

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
                            Generate Signature
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
                        Click "Complete Registration" to finalize your KOL profile on the blockchain. This will generate your PGP keys (deterministic) used for E2EE (end-to-end encryption) messaging and register with verified credentials.
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