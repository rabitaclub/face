import { PGP_KEYS_QUERY } from "@/config/graph.queries";
import { useGraphQuery } from "@/hooks/useGraphQuery";
import { useEffect, useState } from "react";

interface PGPKeysResponse {
    senderPGPKeys: {
        pgpPublicKey: string;
        pgpNonce: string;
    }[];
}

export const usePGPKeys = (address: string) => {
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [pgpNonce, setPgpNonce] = useState<string | null>(null);

    const { data: pgpKeys, isLoading: isLoadingPGPKeys } = useGraphQuery<PGPKeysResponse>(
        ['pgpKeysv2', address],
        PGP_KEYS_QUERY,
        {
            variables: { address },
            refetchInterval: 1000 * 10,
            staleTime: 1000 * 10,
            refetchOnMount: true,
            retry(failureCount, error) {
                console.debug('retry', failureCount, error);
                return failureCount < 3;
            },
            refetchOnWindowFocus: true,
            enabled: !!address
        }
    );

    useEffect(() => {
        if (pgpKeys && pgpKeys.senderPGPKeys.length > 0) {
            console.debug('pgpKeys', pgpKeys);
            setPublicKey(pgpKeys.senderPGPKeys[0].pgpPublicKey);
            setPgpNonce(pgpKeys.senderPGPKeys[0].pgpNonce);
        }
    }, [pgpKeys]);

    // console.debug('publicKey', publicKey, pgpKeys, isLoadingPGPKeys);

    return { publicKey, pgpNonce, isLoadingPGPKeys };
}
