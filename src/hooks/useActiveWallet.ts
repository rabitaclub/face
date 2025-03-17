
import { useAccount, useBalance } from "wagmi";
import { useMemo } from "react";
export const useActiveWallet = () => {
    const { address, isConnected } = useAccount()
    const { data: balance } = useBalance({ address })
    return useMemo(() => ({ address, isConnected, balance }), [address, isConnected, balance])
};


