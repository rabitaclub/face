'use client';

import React, { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';
import SignatureTab from './SignatureTab';
import DataTab from './DataTab';
import UsageTab from './UsageTab';
import { SignatureResponseData } from '../../utils/signatureUtils';

// Define tabs for the signature UI
type TabType = 'signature' | 'data' | 'usage';

const SignatureVerification: React.FC<{ signatureData: string | null }> = ({ signatureData }) => {
  const [activeTab, setActiveTab] = useState<TabType>('signature');
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Parse the signature data if available
  const parsedData = signatureData ? JSON.parse(signatureData) as SignatureResponseData : null;
  
  // Function to copy just the signature to clipboard
  const copySignature = () => {
    if (!parsedData || isExpired) return;
    
    navigator.clipboard.writeText(parsedData.signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Function to copy full data to clipboard (including technical details)
  const copyFullData = () => {
    if (!signatureData || isExpired) return;
    
    navigator.clipboard.writeText(signatureData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate time remaining on signature
  useEffect(() => {
    if (!parsedData) return;

    const checkExpiration = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresAt = parsedData.expiresAt;
      
      if (currentTime >= expiresAt) {
        setIsExpired(true);
        setTimeRemaining(null);
        return;
      }
      
      const secondsRemaining = expiresAt - currentTime;
      
      // Format time remaining
      if (secondsRemaining > 86400) {
        // More than a day
        setTimeRemaining(`${Math.floor(secondsRemaining / 86400)}d ${Math.floor((secondsRemaining % 86400) / 3600)}h`);
      } else if (secondsRemaining > 3600) {
        // Hours remaining
        setTimeRemaining(`${Math.floor(secondsRemaining / 3600)}h ${Math.floor((secondsRemaining % 3600) / 60)}m`);
      } else if (secondsRemaining > 60) {
        // Minutes remaining
        setTimeRemaining(`${Math.floor(secondsRemaining / 60)}m ${secondsRemaining % 60}s`);
      } else {
        // Seconds remaining
        setTimeRemaining(`${secondsRemaining}s`);
      }
      
      setIsExpired(false);
    };
    
    // Check immediately
    checkExpiration();
    
    // Set up interval to update countdown
    const interval = setInterval(checkExpiration, 1000);
    
    return () => clearInterval(interval);
  }, [parsedData]);

  if (!signatureData) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200 mt-6">
        <p className="text-gray-600">No verification data available.</p>
        <p className="text-sm text-gray-500 mt-2 lowercase">
          Generate a signature by verifying your Twitter account.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Expiration indicator */}
      {parsedData && (
        <div className={`px-4 py-2 flex items-center justify-between lowercase ${
          isExpired 
            ? 'bg-red-100 text-red-700' 
            : timeRemaining && timeRemaining.includes('s') 
              ? 'bg-orange-100 text-orange-700'
              : 'bg-blue-50 text-blue-700'
        }`}>
          <div className="flex items-center">
            <FaClock className="mr-2" />
            <span className="text-sm font-medium">
              {isExpired 
                ? 'Signature Expired' 
                : `Valid for ${timeRemaining}`}
            </span>
          </div>
        </div>
      )}
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('signature')}
          className={`px-4 py-2 text-sm font-medium lowercase ${
            activeTab === 'signature'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Signature
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 text-sm font-medium lowercase ${
            activeTab === 'data'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Complete Data
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2 text-sm font-medium lowercase ${
            activeTab === 'usage'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Info
        </button>
      </div>
      
      {/* Tab content */}
      <div className="p-4">
        {isExpired && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            This signature has expired. Please generate a new signature to continue using verification.
          </div>
        )}
        
        {activeTab === 'signature' && parsedData && (
          <SignatureTab 
            signature={parsedData.signature} 
            isExpired={isExpired}
            copied={copied}
            onCopy={copySignature}
          />
        )}
        
        {activeTab === 'data' && (
          <DataTab 
            signatureData={signatureData}
            isExpired={isExpired}
          />
        )}
        
        {activeTab === 'usage' && (
          <UsageTab isExpired={isExpired} />
        )}
      </div>
    </div>
  );
};

export default SignatureVerification; 