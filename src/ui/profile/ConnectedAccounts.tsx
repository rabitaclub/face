'use client';

import { useActiveWallet } from '@/hooks/useActiveWallet';
import { useTwitterVerification } from '@/hooks/useTwitterVerification';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import XLogo from '@/ui/icons/XLogo';
import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Displays connected accounts (X, wallet) with connection status and actions
 */
export default function ConnectedAccounts() {
  const { address } = useActiveWallet();
  const {
    isAuthenticated,
    isTwitterVerified,
    twitterUsername,
    twitterName,
    twitterImage,
    disconnectTwitter,
    connectTwitter
  } = useTwitterVerification();

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 lowercase">Connected Accounts</h3>
        <p className="text-xs text-gray-500 mt-0.5 lowercase">Accounts linked to your Rabita profile</p>
        <p className="text-xs text-gray-500 mt-0.5 lowercase">
          currently supported: <span className="font-medium">X (twitter)</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5 lowercase">
          coming soon: <span className="font-medium">Telegram</span>, <span className="font-medium">LinkedIn</span>, <span className="font-medium">Github</span>, <span className="font-medium">Binance Square</span>
        </p>
      </div>
      
      <div className="divide-y divide-gray-100">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border border-gray-200">
              {twitterImage ? (
                <Image 
                  src={twitterImage}
                  alt={twitterName || "X Profile"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50">
                  <XLogo className="text-dark" size={16} />
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px] normal-case">{twitterName || twitterUsername || '...'}</span>
                {isAuthenticated && (
                  <span className="flex items-center">
                    
                  </span>
                )}
                {isTwitterVerified && (
                  <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 rounded-full py-0.5 px-2">
                    <XLogo size={12} className="text-dark mr-1" />
                    verified
                  </span>
                )}
              </div>
              {isAuthenticated ? (
                <p className="text-xs text-gray-500">@{twitterUsername}</p>
              ) : (
                <p className="text-xs text-amber-600">Not connected</p>
              )}
            </div>
          </div>
          
          <div>
            {isAuthenticated ? (
              <button 
                onClick={async () => {
                  if (confirm('Are you sure you want to disconnect your X account? This will reset your verification progress.')) {
                    try {
                      toast.loading('Disconnecting X account...', { id: 'twitter-disconnect' });
                      await disconnectTwitter();
                      toast.success('X account disconnected successfully', { id: 'twitter-disconnect' });
                    } catch (error) {
                      console.error('Error disconnecting X account:', error);
                      toast.error('Failed to disconnect X account. Please try again.', { id: 'twitter-disconnect' });
                    }
                  }
                }}
                className="group relative text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100"
                aria-label="Disconnect X"
                title="Disconnect X"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            ) : (
              <button 
                className="text-xs font-medium px-3 py-1.5 bg-primary/40 text-dark rounded-full hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 relative overflow-hidden"
                onClick={async () => {
                  try {
                    toast.loading('Connecting to X...', { id: 'twitter-connect' });
                    const button = document.activeElement as HTMLButtonElement;
                    if (button) {
                      button.disabled = true;
                      button.classList.add('cursor-not-allowed');
                    }
                    
                    await connectTwitter();
                    toast.success('Redirecting to X for authentication...', { id: 'twitter-connect' });
                  } catch (error) {
                    console.error('Error initiating X authentication:', error);
                    toast.error('Failed to connect to X. Please try again.', { id: 'twitter-connect' });
                    
                    const button = document.activeElement as HTMLButtonElement;
                    if (button) {
                      button.disabled = false;
                      button.classList.remove('cursor-not-allowed');
                    }
                  }
                }}
              >
                <span className="flex items-center gap-1.5">
                  Connect
                </span>
              </button>
            )}
          </div>
        </div>
        
        {/* Wallet Account */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-blue-50 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7h-1V6a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-8 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark"/>
              </svg>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-900">Wallet</span>
                <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 rounded-full py-0.5 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 font-mono">
                  {address ? 
                    <a 
                      href={`https://bscscan.com/address/${address}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                      title="View on BSCScan"
                    >
                      {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
                    </a> 
                    : 'Not connected'
                  }
                </p>
                {address && (
                  <ConnectButton.Custom>
                    {({ openAccountModal }) => (
                      <button
                        onClick={openAccountModal}
                        className="text-gray-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        aria-label="Switch Account"
                        title="Switch Account"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                        </svg>
                      </button>
                    )}
                  </ConnectButton.Custom>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 