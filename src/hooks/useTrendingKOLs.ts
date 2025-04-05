import { useState, useMemo, useEffect } from 'react';
import { useGraphQuery } from './useGraphQuery';
import { TRENDING_KOLS_QUERY } from '@/config/graph.queries';
import { KOLProfile } from '@/types/profile';
import { Address } from 'viem';

/**
 * Interface for message data in trending KOL response
 */
interface MessageData {
  id: string;
  fee: string;
  blockTimestamp: number;
  sender: string;
  kol: string;
  conversation: {
    id: string;
    messages: {
      id: string;
      sender: string;
      blockTimestamp: number;
    }[];
  };
}

/**
 * Interface for active pairs (conversations) in trending KOL response
 */
interface ActivePair {
  id: string;
  isActive: boolean;
  createdAt: number;
  lastUpdated: number;
  conversation: {
    id: string;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
    lastMessageTimestamp: number;
  };
}

/**
 * Interface for a trending KOL from the GraphQL response
 */
interface TrendingKOLData {
  id: string;
  wallet: Address;
  name: string;
  handle: string;
  platform: string;
  fee: string;
  kolData: {
    tags: string;
    description: string;
    profileHash: string;
  };
  recentMessages: MessageData[];
  activePairsAsKOL: ActivePair[];
}

/**
 * Interface for the complete trending KOLs GraphQL response
 */
interface TrendingKOLsResponse {
  kolregistereds: TrendingKOLData[];
}

/**
 * Interface for the GraphQL variables required by TRENDING_KOLS_QUERY
 */
interface TrendingKOLsVariables {
  timestampDaysAgo: number;
  limit: number;
}

/**
 * Enhanced KOL profile with trending metrics
 */
export interface TrendingKOLProfile extends KOLProfile {
  kolData: {
    tags: string;
    description: string;
    profileHash: string;
  };
  metrics: {
    messageCount: number;
    totalFees: bigint;
    activeConversations: number;
    dailyActivity: Record<string, number>; // Date string -> message count
    avgResponseTime?: number; // Average response time in seconds
  };
}

/**
 * Time periods for trending data
 */
export type TrendingTimePeriod = '24h' | '7d' | '30d' | 'all';

/**
 * Options for the useTrendingKOLs hook
 */
export interface UseTrendingKOLsOptions {
  limit?: number;
  period?: TrendingTimePeriod;
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Calculate timestampDaysAgo based on period
 */
function getTimestampDaysAgo(period: TrendingTimePeriod): number {
  const now = Math.floor(Date.now() / 1000);
  
  switch (period) {
    case '24h':
      return now - 24 * 60 * 60;
    case '7d':
      return now - 7 * 24 * 60 * 60;
    case '30d':
      return now - 30 * 24 * 60 * 60;
    case 'all':
      return 0; // Beginning of time
    default:
      return now - 7 * 24 * 60 * 60; // Default to 7 days
  }
}

/**
 * Format date for daily activity keys
 */
function formatDateKey(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

/**
 * Calculate average response time from conversation messages
 */
function calculateAvgResponseTime(messages: MessageData['conversation']['messages']): number | undefined {
  if (!messages || messages.length < 2) return undefined;
  
  // Sort messages by timestamp (ascending)
  const sortedMessages = [...messages].sort((a, b) => a.blockTimestamp - b.blockTimestamp);
  
  let totalResponseTime = 0;
  let responseCount = 0;
  
  // Calculate time differences between consecutive messages from different senders
  for (let i = 1; i < sortedMessages.length; i++) {
    const currentMsg = sortedMessages[i];
    const prevMsg = sortedMessages[i-1];
    
    if (currentMsg.sender !== prevMsg.sender) {
      const responseTime = currentMsg.blockTimestamp - prevMsg.blockTimestamp;
      totalResponseTime += responseTime;
      responseCount++;
    }
  }
  
  return responseCount > 0 ? Math.floor(totalResponseTime / responseCount) : undefined;
}

/**
 * Hook to fetch and process trending KOLs
 */
export function useTrendingKOLs({
  limit = 20,
  period = '7d',
  enabled = true,
  refetchInterval = 5 * 60 * 1000, // 5 minutes by default
}: UseTrendingKOLsOptions = {}) {
  const [processedKOLs, setProcessedKOLs] = useState<TrendingKOLProfile[]>([]);
  
  // Calculate timestamp based on selected period
  const timestampDaysAgo = useMemo(() => getTimestampDaysAgo(period), [period]);
  
  // Fetch trending KOLs data
  const { 
    data,
    isLoading,
    error,
    refetch
  } = useGraphQuery<TrendingKOLsResponse>(
    ['trendingKOLs', period, limit.toString()],
    TRENDING_KOLS_QUERY,
    {
      variables: {
        timestampDaysAgo,
        limit
      },
      staleTime: 60 * 1000, // 1 minute
      refetchInterval,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      enabled
    }
  );
  
  // Process raw data into enhanced KOL profiles with metrics
  useEffect(() => {
    if (!data?.kolregistereds) return;
    
    try {
      const processed = data.kolregistereds.map(kol => {
        console.debug('kol', kol);
        const messageCount = kol.recentMessages?.length || 0;
        const totalFees = (kol.recentMessages || []).reduce(
          (sum, msg) => sum + BigInt(msg.fee || "0"), 
          BigInt(0)
        );
        
        // Count active conversations
        const activeConversations = (kol.activePairsAsKOL || []).filter(
          pair => pair.isActive && pair.conversation?.id
        ).length;
        
        // Calculate daily activity
        const dailyActivity: Record<string, number> = {};
        
        // Initialize with zeros for continuous date range
        const start = new Date(timestampDaysAgo * 1000);
        const end = new Date();
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = formatDateKey(Math.floor(d.getTime() / 1000));
          dailyActivity[key] = 0;
        }
        
        (kol.recentMessages || []).forEach(msg => {
          const dateKey = formatDateKey(msg.blockTimestamp);
          dailyActivity[dateKey] = (dailyActivity[dateKey] || 0) + 1;
        });
        
        // Calculate average response time
        let avgResponseTime: number | undefined;
        if (kol.recentMessages && kol.recentMessages.length > 0) {
          // Collect all response times from conversations
          const responseTimes: number[] = [];
          
          kol.recentMessages.forEach(msg => {
            if (msg.conversation && msg.conversation.messages && msg.conversation.messages.length >= 2) {
              const convResponseTime = calculateAvgResponseTime(msg.conversation.messages);
              if (convResponseTime) responseTimes.push(convResponseTime);
            }
          });
          
          // Calculate overall average
          if (responseTimes.length > 0) {
            avgResponseTime = Math.floor(
              responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            );
          }
        }
        
        // Create enhanced KOL profile
        return {
          wallet: kol.wallet as `0x${string}`,
          platform: kol.platform,
          handle: kol.handle,
          name: kol.name,
          fee: BigInt(kol.fee || "0"),
          profileIpfsHash: null,
          verified: true, // Assuming trending KOLs are verified
          exists: true,
          kolData: kol.kolData,
          metrics: {
            messageCount,
            totalFees,
            activeConversations,
            dailyActivity,
            avgResponseTime
          }
        } as TrendingKOLProfile;
      });
      
      console.debug('processed', processed);
      setProcessedKOLs(processed);
    } catch (err) {
      console.error("Error processing trending KOLs data:", err);
    }
  }, [data, timestampDaysAgo]);
  
  return {
    trendingKOLs: processedKOLs,
    isLoading,
    error,
    refetch,
    period,
    setPeriod: (newPeriod: TrendingTimePeriod) => {
      // This will trigger a refetch through the useEffect dependency
      return newPeriod;
    }
  };
}

/**
 * Hook to get a single trending KOL by wallet address
 */
export function useTrendingKOLByAddress(
  address: Address | undefined,
  options: Omit<UseTrendingKOLsOptions, 'limit'> = {}
) {
  const { trendingKOLs, isLoading, error } = useTrendingKOLs({
    ...options,
    limit: 100, // Fetch more to ensure we get the one we want
    enabled: !!address
  });
  
  const trendingKOL = useMemo(() => {
    if (!address) return null;
    
    return trendingKOLs.find(
      kol => kol.wallet.toLowerCase() === address.toLowerCase()
    ) || null;
  }, [trendingKOLs, address]);
  
  return {
    trendingKOL,
    isLoading,
    error,
    hasActivity: !!trendingKOL
  };
} 