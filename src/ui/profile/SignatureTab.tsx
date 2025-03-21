'use client';

import React from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

export interface SignatureTabProps {
  signature: string;
  copied: boolean;
  onCopy: () => void;
  isExpired?: boolean;
}

const SignatureTab: React.FC<SignatureTabProps> = ({ 
  signature, 
  copied, 
  onCopy, 
  isExpired = false 
}) => {
  return (
    <div className="mt-2">
      <div className="mb-4">
        <h3 className="font-medium text-lg flex items-center lowercase">
          Ethereum Signature {isExpired && <span className="text-red-500 ml-2">(Expired)</span>}
        </h3>
        <p className="text-sm text-gray-500 lowercase">
          This cryptographic signature verifies your social identity on the blockchain
        </p>
      </div>
      
      <div className={`bg-gray-100 p-4 rounded-md whitespace-pre-wrap break-all font-mono text-sm ${isExpired ? 'opacity-50' : ''}`}>
        {signature}
      </div>
      
      <button
        onClick={onCopy}
        disabled={isExpired}
        className={`mt-2 flex items-center justify-center w-full py-2 ${
          isExpired 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white rounded-md transition-colors`}
      >
        {copied ? (
          <>
            <FaCheck className="mr-2" /> Copied
          </>
        ) : (
          <>
            <FaCopy className="mr-2" /> Copy Signature
          </>
        )}
      </button>
    </div>
  );
};

export default SignatureTab; 