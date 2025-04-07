import { useCallback, useEffect, useState } from 'react';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { useGraphQuery } from '@/hooks/useGraphQuery';
import { UNREPLIED_MESSAGES_QUERY } from '@/config/graph.queries';

export interface UnrepliedMessagesResult {
  count: number;
  isLoading: boolean;
  refetch: () => void;
}

export function useUnrepliedMessages(): UnrepliedMessagesResult {
  const [unrepliedCount, setUnrepliedCount] = useState<number>(0);
  const { address } = useActiveWallet();

  const {
    data,
    isLoading,
    refetch
  } = useGraphQuery<{
    conversations: Array<{ id: string }> | null | undefined
  }>(
    ['unrepliedMessages', address || ''],
    UNREPLIED_MESSAGES_QUERY,
    {
      variables: { userAddress: address || '' },
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // 1 minute
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      enabled: !!address
    }
  );

  useEffect(() => {
    // Safely handle null or undefined data
    if (data && Array.isArray(data.conversations)) {
      setUnrepliedCount(data.conversations.length);
    } else {
      setUnrepliedCount(0);
    }
  }, [data]);

  const handleRefetch = useCallback(() => {
    if (address) {
      refetch();
    }
  }, [address, refetch]);

  return {
    count: unrepliedCount,
    isLoading,
    refetch: handleRefetch
  };
} 