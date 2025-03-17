'use client';

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";

export default function CustomConnect({showBalance = false, showNetwork = false}: {showBalance?: boolean, showNetwork?: boolean}) {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
            className="relative z-10"
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="bg-primary hover:bg-primary-dark text-button px-6 py-3 rounded-button font-medium text-base transition-all duration-normal border border-transparent shadow-elevation"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <WalletIcon isHovering={isHovering} />
                      <span>Connect Wallet</span>
                    </div>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-alert text-white hover:bg-alert-dark px-6 py-3 rounded-button font-medium text-base transition-all duration-normal shadow-elevation"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <AlertIcon />
                      <span>Wrong Network</span>
                    </div>
                  </button>
                );
              }

              return (
                <div className={`flex items-center justify-center ${showNetwork ? ( showBalance ? 'gap-3' : '') : (showBalance ? 'gap-2' : '')}`}>
                  {showNetwork && (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="flex items-center gap-2 bg-background-light hover:bg-background-lighter px-4 py-2 rounded-button transition-all duration-normal shadow-sm"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 18, height: 18 }}
                          />
                        )}
                      </div>
                    )}
                      <span className="text-button-inverse">{chain.name}</span>
                    </button>
                  )}

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="bg-primary hover:bg-primary-dark text-button px-6 py-3 rounded-button font-medium text-base transition-all duration-normal border border-transparent shadow-elevation flex items-center gap-2"
                  >
                    <div className="rounded-pill bg-white/20 w-5 h-5 flex items-center justify-center">
                      <WalletIcon size={12} />
                    </div>
                    <span>{account.displayName}</span>
                    {showBalance && account.displayBalance ? 
                      <span className="hidden md:inline-block text-button/80">
                        ({account.displayBalance})
                      </span> : null}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

// Custom wallet icon that matches the Rabita design system
function WalletIcon({ isHovering = false, size = 16 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-normal"
    >
      <path
        d="M19 7h-1V6a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-1 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Alert icon for wrong network
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M12 9v3m0 3h.01M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}


