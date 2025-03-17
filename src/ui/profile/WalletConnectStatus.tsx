'use client';

interface WalletConnectStatusProps {
  isConnected: boolean;
  address?: string;
}

/**
 * Component that displays the wallet connection status
 */
export function WalletConnectStatus({ isConnected, address }: WalletConnectStatusProps) {
  return (
    <div className="mb-8 p-4 bg-background rounded-lg shadow-sm">
      <h2 className="font-medium text-lg mb-2 text-foreground">connected wallet</h2>
      {isConnected ? (
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <p className="text-white font-mono text-sm break-all">{address}</p>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <p className="text-foreground">Wallet not connected</p>
        </div>
      )}
    </div>
  );
} 