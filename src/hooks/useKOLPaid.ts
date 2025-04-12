import { useQuery } from "@tanstack/react-query";
import { KOL_EARNINGS_QUERY } from "@/config/graph.queries";
import { useGraphQuery } from "./useGraphQuery";
import { useEffect, useState } from "react";
import { formatEther } from "viem";

type KOLPaid = {
    id: string;
    kol: string;
    sender: string;
    amount: string;
    transactionHash: string;
    blockTimestamp: string;
};

type KOLPaidGraph = {
    kolpaids: KOLPaid[];
};

export const useKOLPaid = (userAddress: string) => {
    const [kolPaid, setKolPaid] = useState<KOLPaid[]>([]);
    const { data, isLoading, isError } = useGraphQuery<KOLPaidGraph>(
        ["kolPaid", userAddress],
        KOL_EARNINGS_QUERY,
        {
            variables: {
                userAddress,
            },
            staleTime: 60 * 1000,
            refetchInterval: 60 * 1000,
            enabled: !!userAddress,
            refetchOnWindowFocus: false,
        },
    );

    useEffect(() => {
        if (data) {
            // console.debug("data", data);
            const parsedData = data.kolpaids.map((item) => ({
                ...item,
                amount: formatEther(BigInt(item.amount)),
            }));
            setKolPaid(parsedData);
        }
    }, [data]);

    return {
        kolPaid,
        isLoading,
        isError,
    };
};
