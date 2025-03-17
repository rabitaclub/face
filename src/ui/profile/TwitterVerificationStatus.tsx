'use client';

import XLogo from '../icons/XLogo';

interface TwitterVerificationStatusProps {
  isVerified: boolean;
  username?: string;
  name?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

/**
 * Component that displays X (formerly Twitter) verification status and allows connecting/disconnecting
 */
export function TwitterVerificationStatus({ 
  isVerified, 
  username, 
  name, 
  onConnect, 
  onDisconnect 
}: TwitterVerificationStatusProps) {
  return (
    <div className="mb-8 p-4 bg-background rounded-lg shadow-sm">
      <h2 className="font-medium text-lg mb-2 text-foreground">X verification</h2>
      
      {isVerified ? (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <p className="text-foreground">
              Verified as <span className="font-semibold">{name}</span>
            </p>
          </div>
          <div className="flex items-center">
            <XLogo className="text-black mr-2" size={18} />
            <p className="text-foreground font-mono">@{username}</p>
          </div>
          
          <button
            onClick={onDisconnect}
            className="mt-4 text-sm text-foreground hover:text-primary underline transition-colors"
          >
            Disconnect X account
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <p className="text-white">not verified</p>
          </div>
          
          <button 
            onClick={onConnect}
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-button transition-colors"
          >
            <XLogo className="text-white" size={18} />
            <span>connect with X</span>
          </button>
        </div>
      )}
    </div>
  );
} 