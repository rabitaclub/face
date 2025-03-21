'use client';

import { useState, useEffect } from 'react';
import { Address, parseEther, encodeFunctionData, parseAbi } from 'viem';
import { useWalletClient, useWaitForTransactionReceipt } from 'wagmi';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { useTwitterVerification } from '@/hooks/useTwitterVerification';
import { toast } from 'react-hot-toast';
import ProfileImageUpload from './ProfileImageUpload';
import { FiArrowRight, FiCheckCircle, FiInfo, FiDollarSign, FiTwitter, FiUser } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import CustomConnect from '@/components/CustomConnect';
import * as RABITA_REGISTRY_ABI from '@/config/rabita.abi.json';

// Contract address from environment
const RABITA_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_RABITA_REGISTRY_ADDRESS as Address;

// Registration status enum
type RegistrationStatus = 'idle' | 'pending' | 'success' | 'error';

// FormData interface for registration
interface RegistrationFormData {
  profilePictureIpfsHash: string;
  fee: string;
}

interface RegisterKOLButtonProps {
  twitterHandle?: string;
  userName?: string;
  profileImageUrl?: string;
  isTwitterVerified: boolean;
  isFormVisible?: boolean; // Controlled prop for form visibility
  onFormVisibilityChange?: (isVisible: boolean) => void;
  onFeeSet?: (hasSetFee: boolean) => void;
  onTransactionSubmit?: (isSubmitted: boolean) => void;
}

/**
 * Registration button for KOLs to register in the Rabita Registry contract
 * Requires connection to wallet and Twitter verification
 */
export function RegisterKOLButton({ 
  twitterHandle, 
  userName, 
  profileImageUrl,
  isTwitterVerified,
  isFormVisible = false,
  onFormVisibilityChange,
  onFeeSet,
  onTransactionSubmit,
}: RegisterKOLButtonProps) {
  const { address, isConnected } = useActiveWallet();
  const { 
    isTwitterVerified: isTwitterVerifiedFromHook, 
    twitterUsername, 
    signature, 
    signatureData, 
    generateSignature,
    twitterImage
  } = useTwitterVerification();
  
  const { data: walletClient } = useWalletClient();
  const [formData, setFormData] = useState<RegistrationFormData>({
    profilePictureIpfsHash: '',
    fee: '0.01', // Default fee in BNB
  });
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('idle');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  
  // Wait for transaction hook
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: txHash,
      confirmations: 1,
    });

  // Get the actual Twitter handle and name to use
  const effectiveTwitterHandle = twitterHandle || twitterUsername || '';
  const effectiveName = userName || effectiveTwitterHandle || '';
  
  // Get the profile image, ensuring it's a string or undefined (not null)
  const effectiveProfileImageUrl = profileImageUrl || (typeof twitterImage === 'string' ? twitterImage : undefined);

  // Reset registration when wallet changes
  useEffect(() => {
    setRegistrationStatus('idle');
    onFormVisibilityChange?.(false);
    onFeeSet?.(false);
    onTransactionSubmit?.(false);
  }, [address, onFormVisibilityChange, onFeeSet, onTransactionSubmit]);

  // Update registration status based on confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      setRegistrationStatus('success');
      onTransactionSubmit?.(true);
      toast.success('Successfully registered as a KOL!', {
        duration: 5000,
        icon: <FiCheckCircle className="text-green-500" size={18} />,
      });
    }
  }, [isConfirmed, txHash, onTransactionSubmit]);

  // Validate prerequisites for registration
  const canRegister = isConnected && (isTwitterVerifiedFromHook || isTwitterVerified) && (twitterUsername || twitterHandle) && signature;

  // Debug logs to help identify issues
  useEffect(() => {
    console.debug('Registration prerequisites:', {
      isConnected,
      isTwitterVerifiedFromHook,
      isTwitterVerified,
      twitterHandle,
      twitterUsername,
      signature: !!signature,
      isFormVisible
    });
  }, [isConnected, isTwitterVerifiedFromHook, isTwitterVerified, twitterHandle, twitterUsername, signature, isFormVisible]);

  // Handle profile image IPFS hash change
  const handleIpfsHashChange = (hash: string) => {
    setFormData(prev => ({ ...prev, profilePictureIpfsHash: hash }));
  };

  // Handle fee change
  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = value.split('.');
    const sanitizedValue = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : value;
      
    setFormData(prev => ({ ...prev, fee: sanitizedValue }));
    // Check if a valid fee is set
    onFeeSet?.(parseFloat(sanitizedValue) > 0);
  };

  // Handle form submission for registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletClient || !RABITA_REGISTRY_ADDRESS) {
      toast.error('Wallet or contract is not available');
      return;
    }

    if (!signatureData) {
      toast.error('Twitter signature is missing');
      return;
    }

    if (!effectiveTwitterHandle) {
      toast.error('Twitter handle is required');
      return;
    }

    if (!effectiveName) {
      toast.error('Name is required');
      return;
    }

    // Prepare IPFS hash (use provided or empty string if not available)
    const profileIpfsHash = formData.profilePictureIpfsHash.trim() || '';

    // Trigger contract write
    setRegistrationStatus('pending');
    
    const toastId = toast.loading('Submitting registration...');
    
    try {
      // Prepare function data
      const functionData = encodeFunctionData({
        abi: RABITA_REGISTRY_ABI,
        functionName: 'registerKOL',
        args: [
          effectiveTwitterHandle,
          effectiveName,
          profileIpfsHash,
          parseEther(formData.fee || '0.01'), // Convert fee from ETH to Wei
        ],
      });

      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: RABITA_REGISTRY_ADDRESS as `0x${string}`,
        data: functionData,
      });
      
      setTxHash(hash);
      toast.success('Transaction submitted!', { id: toastId });
      
      // Show transaction hash toast
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
        { duration: 10000 }
      );
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      toast.error(errorMessage, { id: toastId });
      setRegistrationStatus('error');
    }
  };

  // Generate signature button
  const renderGenerateSignatureButton = () => {
    return (
      <button 
        onClick={generateSignature}
        className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 font-medium"
      >
        Verify Twitter Account 
        <FiArrowRight />
      </button>
    );
  };

  // Generate the main register button
  const renderRegisterButton = () => {
    if (!isConnected) {
      return (
        <CustomConnect />
      );
    }
    
    if (!(isTwitterVerifiedFromHook || isTwitterVerified)) {
      return (
        <button 
          disabled
          className="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium"
        >
          Verify Twitter account to register
        </button>
      );
    }
    
    if (!signature) {
      return renderGenerateSignatureButton();
    }
    
    return (
      <button
        type="button"
        onClick={() => {
          onFormVisibilityChange?.(true);
        }}
        className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
      >
        Register as KOL
      </button>
    );
  };

  // If already in success state
  if (registrationStatus === 'success') {
    return null; // Let toast handle success message
  }

  // Main component
  return (
    <div className="space-y-6">
      {!isFormVisible && (
        <div>
          {renderRegisterButton()}
        </div>
      )}
      
      {isFormVisible && (
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
                    <FiTwitter size={14} className="text-primary" />
                    Twitter Handle
                  </label>
                  <div className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-md">
                    <span className="text-gray-400">@</span>
                    <span className="ml-1 font-medium text-gray-800">{effectiveTwitterHandle}</span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
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
                  <FiDollarSign size={14} className="text-primary" />
                  Message Fee (BNB)
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
                    This is the amount users will pay to send you a message. We recommend a reasonable amount (0.01-0.1 BNB) to maximize engagement.
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

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                type="submit"
                disabled={registrationStatus === 'pending' || parseFloat(formData.fee) <= 0}
                className={cn(
                  "sm:flex-1 px-4 py-3 rounded-lg text-white flex items-center justify-center gap-2 font-medium transition-all duration-200",
                  registrationStatus === 'pending' 
                    ? "bg-primary/70 cursor-not-allowed" 
                    : parseFloat(formData.fee) <= 0
                      ? "bg-primary/70 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-dark active:scale-[0.98]"
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
              
              <button
                type="button"
                onClick={() => {
                  onFormVisibilityChange?.(false);
                }}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors flex justify-center items-center"
              >
                Cancel
              </button>
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-2">
              By registering, you agree to the Rabita terms of service and will be registered on the BSC blockchain
            </p>
          </form>
        </div>
      )}
    </div>
  );
} 