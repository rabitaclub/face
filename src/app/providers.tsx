'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

// Add NextAuth Session Provider
import { SessionProvider } from "next-auth/react";
import { MessagingProvider } from '@/contexts/MessagingContext';

const config = getDefaultConfig({
    appName: 'Rabita Club',
    projectId: '665b79fbe4637d29026faa5e001f7cd1',
    chains: [bscTestnet],
    ssr: true
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitProvider>
                        <MessagingProvider>
                            {children}
                        </MessagingProvider>
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </SessionProvider>
    )
}
