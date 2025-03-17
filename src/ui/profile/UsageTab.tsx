'use client';

import React from 'react';
import { FaCode, FaShieldAlt, FaLock } from 'react-icons/fa';

export interface UsageTabProps {
  isExpired?: boolean;
}

const UsageTab: React.FC<UsageTabProps> = ({ isExpired = false }) => {
  return (
    <div className="mt-2">
      <div className="mb-4">
        <h3 className="font-medium text-lg flex items-center">
          How to Use This Verification 
          {isExpired && <span className="text-red-500 ml-2">(Requires New Signature)</span>}
        </h3>
        <p className="text-sm text-gray-500">
          Use this cryptographic proof to verify your Twitter identity on-chain
        </p>
      </div>
      
      {isExpired ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            Your signature has expired. Please generate a new signature to use these features.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Developer Integration */}
          <div className="p-4 bg-gray-100 rounded-md">
            <div className="flex items-center mb-2">
              <FaCode className="text-gray-700 mr-2" />
              <h4 className="font-medium">Developer Integration</h4>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Integrate this verification in smart contracts or dApps:
            </p>
            <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
              <li>Copy the full signature data from the "Complete Data" tab</li>
              <li>Use <code className="bg-gray-200 px-1 rounded">ethers.utils.verifyMessage()</code> to validate signature authenticity</li>
              <li>Check that <code className="bg-gray-200 px-1 rounded">expiresAt</code> timestamp is still valid</li>
              <li>Verify the Twitter ID matches your requirements</li>
            </ol>
          </div>
          
          {/* Security Information */}
          <div className="p-4 bg-blue-50 rounded-md">
            <div className="flex items-center mb-2">
              <FaShieldAlt className="text-blue-700 mr-2" />
              <h4 className="font-medium">Security Information</h4>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              This signature includes advanced security features:
            </p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>Time-limited with automatic expiration (24 hours)</li>
              <li>Domain-bound to prevent cross-site usage</li>
              <li>Cryptographic salt and nonce for replay protection</li>
              <li>Full EIP-712 inspired structured signing</li>
            </ul>
          </div>
          
          {/* Privacy Note */}
          <div className="p-4 bg-gray-100 rounded-md">
            <div className="flex items-center mb-2">
              <FaLock className="text-gray-700 mr-2" />
              <h4 className="font-medium">Privacy Note</h4>
            </div>
            <p className="text-sm text-gray-700">
              Your signature only proves Twitter account ownership. No personal data is stored on-chain.
              Technical details are hidden by default but included when you copy the complete data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageTab; 