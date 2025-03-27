'use client';

import { FiCheck, FiLock, FiDollarSign, FiShield, FiCheckCircle, FiFileText, FiCopy } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import XLogo from '../icons/XLogo';
import BNBLogo from '../icons/BNBLogo';

interface RegistrationStepsProps {
  isAuthenticated: boolean;
  isTwitterVerified: boolean;
  signature: string | null;
  formDataVisible: boolean;
  hasSetFee: boolean;
  transactionSubmitted: boolean;
  ownershipVerified?: boolean;
  onGenerateSignature?: () => void;
  isGeneratingSignature?: boolean;
  signatureGenerationFailed?: boolean;
}

export default function RegistrationSteps({
  isAuthenticated,
  isTwitterVerified,
  signature,
  formDataVisible,
  hasSetFee,
  transactionSubmitted,
  ownershipVerified = false,
  onGenerateSignature,
  isGeneratingSignature = false,
  signatureGenerationFailed = false
}: RegistrationStepsProps) {
  const steps = [
    {
      id: 1,
      title: "Connect Socially",
      description: "Connect your account via NextAuth for secure verification",
      completed: isAuthenticated,
      available: true,
      icon: XLogo
    },
    {
      id: 2,
      title: "Verify Social Identity",
      description: "Confirm your social identity through verifier signature generation",
      completed: isTwitterVerified,
      available: isAuthenticated,
      icon: FiLock
    },
    {
      id: 3,
      title: "Configure Profile",
      description: "Set your messaging fee and customize your profile details (optional)",
      completed: formDataVisible && hasSetFee,
      available: isTwitterVerified,
      icon: BNBLogo
    },
    {
      id: 4,
      title: "Verify Wallet Ownership",
      description: "Sign a message to cryptographically prove wallet ownership",
      completed: ownershipVerified,
      available: formDataVisible && hasSetFee,
      icon: FiShield
    },
    {
      id: 5,
      title: "Complete Registration",
      description: "Generate your PGP keys (deterministic) and register your KOL profile on the blockchain with verified credentials",
      completed: transactionSubmitted,
      available: ownershipVerified,
      icon: FiCheckCircle
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const completionPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="pb-2 lowercase">
      <div className="mb-6 relative">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-700 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="absolute -top-1 left-0 w-full flex justify-between px-0">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className="relative flex flex-col items-center"
            >
              <div 
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all duration-500",
                  step.completed 
                    ? "bg-primary border-primary" 
                    : step.available 
                      ? "bg-white border-primary" 
                      : "bg-white border-gray-300"
                )}
              >
                {step.completed && (
                  <FiCheck className="text-white text-[10px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              <span className="absolute top-6 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-gray-500 whitespace-nowrap">
                {step.id}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-0 relative">
        <div className="absolute left-[17px] top-6 bottom-6 w-[2px] bg-gray-200 z-0"></div>
        {steps.map((step) => (
          <div key={step.id} className="relative z-10 pl-9 py-2">
            <div 
              className={cn(
                "absolute left-0 top-1.5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                step.completed
                  ? "bg-primary text-dark shadow-sm" 
                  : step.available
                    ? "bg-white border-2 border-primary text-primary" 
                    : "bg-gray-100 border-2 border-gray-200 text-gray-400"
              )}
            >
              <step.icon size={16} />
            </div>
            
            <div className={cn(
              "transition-colors duration-300",
              step.completed ? "text-dark" : step.available ? "text-gray-900" : "text-gray-400"
            )}>
              <h4 className="font-medium text-sm flex ml-2 items-center gap-2">
                {step.title}
                {step.completed && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                    <FiCheck size={10} />
                  </span>
                )}
              </h4>
              <p className={cn(
                "text-xs mt-0.5 leading-relaxed ml-2",
                step.completed ? "text-gray-700" : step.available ? "text-gray-600" : "text-gray-400"
              )}>
                {step.description}
              </p>
              {step.id === 2 && signature && (
                <div className="mt-2 mb-2 p-3 bg-white rounded border border-blue-200">
                  <h5 className="text-xs font-medium text-blue-800 flex items-center gap-1.5 mb-1">
                    <FiFileText size={12} />
                    Identity Verification
                  </h5>
                  <p className="text-xs text-blue-700 mb-2">
                    Your social identity has been verified through NextAuth. The following signature will be used for on-chain verification:
                  </p>
                  <div className="relative">
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700 max-h-[80px] overflow-y-auto break-all">
                      {signature?.substring(0, 96)}... 
                    </div>
                  </div>
                </div>
              )} 
              {step.id === 2 && isTwitterVerified && !signature && onGenerateSignature && (
                <button
                  onClick={onGenerateSignature}
                  disabled={isGeneratingSignature}
                  className={cn(
                    "mt-2 px-3 py-1.5 text-black text-xs rounded-md transition-colors duration-200 flex items-center gap-1.5",
                    isGeneratingSignature 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : signatureGenerationFailed 
                        ? "bg-red-500 hover:bg-red-600 text-white" 
                        : "bg-primary/90 hover:bg-primary"
                  )}
                >
                  {isGeneratingSignature ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : signatureGenerationFailed ? (
                    <>
                      <FiFileText size={12} />
                      <span>Retry Signature</span>
                    </>
                  ) : (
                    <>
                      <FiFileText size={12} />
                      <span>Generate Signature</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 