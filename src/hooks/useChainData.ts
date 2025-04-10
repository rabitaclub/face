import { useAccount } from "wagmi";
import React from "react";
import BNBLogo from "@/ui/icons/BNBLogo";

export type ChainData = {
    symbol: string;
    logo: ({ className }: { className?: string }) => React.ReactNode;
    explorer: string;
    explorerUrl: string;
}

export function useChainData(): ChainData {
    const { chain } = useAccount();
    const symbol = chain?.nativeCurrency.symbol ?? 'ETH';

    return {
        symbol,
        logo: ({ className }: { className?: string }) => React.createElement(BNBLogo, { className }),
        explorer: chain?.blockExplorers?.default.name ?? 'etherscan',
        explorerUrl: chain?.blockExplorers?.default.url ?? 'https://etherscan.io'
    };
}