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

    const updateActiveTimeCallback = useCallback(async (startTime: string | number, endTime: string | number) => {
        console.debug('updateActiveTimeCallback', startTime, endTime);
        setIsLoading(true);
        try {
            const tx = await writeContractAsync({
                address: env.RABITA_REGISTRY_ADDRESS as `0x${string}`,
                abi: kolProfileAbi,
                functionName: 'updateKOLActiveTime',
                args: [startTime, endTime],
            });

            setTransactionHash(tx);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [writeContractAsync]);

    const updateActiveDaysCallback = useCallback(async (days: string[] | number[], active: boolean[]) => {
        console.debug('updateActiveDaysCallback', days, active);
        setIsLoading(true);
        try {
            const tx = await writeContractAsync({
                address: env.RABITA_REGISTRY_ADDRESS as `0x${string}`,
                abi: kolProfileAbi,
                functionName: 'updateKOLActiveDays',
                args: [days, active],
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
        updateActiveTimeCallback,
        updateActiveDaysCallback,
    }), [updateFeeCallback, isLoading, isTransactionLoading, isError, error, transactionHash, transactionReceipt, updateActiveTimeCallback, updateActiveDaysCallback]);
}
