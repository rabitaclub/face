'use client';

import React, { useState } from 'react';
import { FaCopy, FaCheck, FaLock, FaKey } from 'react-icons/fa';

export interface DataTabProps {
  signatureData: string;
  isExpired?: boolean;
}

const DataTab: React.FC<DataTabProps> = ({ signatureData, isExpired = false }) => {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const copyData = () => {
    if (isExpired) return;
    
    navigator.clipboard.writeText(signatureData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTechnicalDetails = () => {
    setShowTechnicalDetails(!showTechnicalDetails);
  };

  // Parse the signature data to display it in a user-friendly way
  let parsedData: any = {};
  let technicalData: any = {};
  
  try {
    const data = JSON.parse(signatureData);
    
    // Separate public data from technical cryptographic data
    if (data) {
      // Extract public-facing properties
      parsedData = {
        signature: data.signature,
        walletAddress: data.walletAddress,
        twitterId: data.twitterId,
        twitterUsername: data.twitterUsername,
        platform: data.platform,
        expiresAt: data.expiresAt ? new Date(data.expiresAt * 1000).toLocaleString() : 'N/A'
      };
      
      // Store technical cryptographic details separately
      if (data._cryptoMetadata) {
        technicalData = data._cryptoMetadata;
      }
    }
  } catch (e) {
    console.error('Error parsing signature data', e);
  }

  return (
    <div className="mt-2">
      <div className={`bg-gray-100 p-4 rounded-md whitespace-pre-wrap break-all ${isExpired ? 'opacity-50' : ''}`}>
        <div className="mb-4">
          <h3 className="font-medium text-lg flex items-center">
            Verification Data {isExpired && <span className="text-red-500 ml-2">(Expired)</span>}
          </h3>
          <p className="text-sm text-gray-500">
            This data verifies your Twitter account is linked to your wallet address
          </p>
        </div>
        
        {/* User-facing data */}
        <div className="space-y-2">
          {Object.entries(parsedData).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium">{key}: </span>
              <span className="text-gray-700">{String(value)}</span>
            </div>
          ))}
        </div>
        
        {/* Technical details section with toggle */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button 
            onClick={toggleTechnicalDetails}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details <FaKey className="ml-1" size={12} />
          </button>
          
          {showTechnicalDetails && (
            <div className="mt-2 p-3 bg-gray-200 rounded border border-gray-300 space-y-2">
              <div className="flex items-center mb-1">
                <FaLock className="text-gray-700 mr-1" size={12} />
                <span className="text-xs text-gray-700">Technical Cryptographic Values</span>
              </div>
              {Object.entries(technicalData).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium">{key}: </span>
                  <span className="text-gray-700 font-mono text-xs">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={copyData}
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
            <FaCopy className="mr-2" /> Copy Full Data
          </>
        )}
      </button>
    </div>
  );
};

export default DataTab; 