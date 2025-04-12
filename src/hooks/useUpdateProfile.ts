import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import kolProfileAbi from "@/config/rabita.abi.json"
import { env } from "@/config/env"
import { useCallback, useMemo, useState } from "react"
import { parseEther } from "viem"
export const useUpdateProfile = () => {
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { writeContractAsync } = useWriteContract();
    const { data: transactionReceipt, isLoading: isTransactionLoading, isError, error } = useWaitForTransactionReceipt({
        hash: transactionHash as `0x${string}`,
    });

    const updateFeeCallback = useCallback(async (fee: string | number) => {
        // console.debug('updateFeeCallback', fee);
        setIsLoading(true);
        try {
            const tx = await writeContractAsync({
                address: env.RABITA_REGISTRY_ADDRESS as `0x${string}`,
                abi: kolProfileAbi,
                functionName: 'updateKOLFee',
                args: [parseEther(fee.toString())],
            });

            setTransactionHash(tx);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [writeContractAsync]);

    return useMemo(() => ({
        updateFeeCallback,
        isLoading: isLoading || isTransactionLoading,
        isError,
        error,
        transactionHash,
        transactionReceipt,
    }), [updateFeeCallback, isLoading, isTransactionLoading, isError, error, transactionHash, transactionReceipt]);
}
