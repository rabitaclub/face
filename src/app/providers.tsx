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
import { NavigationProvider } from '@/contexts/NavigationContext';

const config = getDefaultConfig({
    appName: 'Rabita Club',
    projectId: '665b79fbe4637d29026faa5e001f7cd1',
    chains: [bsc],
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
                            <NavigationProvider>
                                {children}
                            </NavigationProvider>
                        </MessagingProvider>
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </SessionProvider>
    )
}
