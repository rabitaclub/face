'use client';

import { useMemo } from 'react';
import { createPublicClient, http, Address, parseAbi, formatEther } from 'viem';
import { bscTestnet } from 'viem/chains';
import { useQuery } from '@tanstack/react-query';
import { useActiveWallet } from './useActiveWallet';
import RABITA_REGISTRY_ABI from '@/config/rabita.abi.json';
import { KOLProfile } from '@/types/profile';

// Return type for the profile data hooks
export interface ProfileDataResult {
  profile: KOLProfile & { formattedFee: string };
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch?: () => void;
  isConnected?: boolean;
  address?: Address;
  hasProfileData: boolean;
  isKOL: boolean;
}

// Empty KOL profile for initial state
const emptyProfile: KOLProfile = {
  wallet: '0x0000000000000000000000000000000000000000' as Address,
  platform: '',
  handle: '',
  name: '',
  fee: BigInt(0), // Use BigInt() instead of literal 0n for compatibility
  profileIpfsHash: '',
  verified: false,
  exists: false
};

// Get contract address from environment variable
const RABITA_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_RABITA_REGISTRY_ADDRESS as Address;

/**
 * Custom hook to fetch KOL profile data from the RabitaRegistry contract
 * Fetches data for the connected wallet address and determines if it exists in the registry
 */
export function useKOLProfileData(addressOverride?: Address, enabled = true): ProfileDataResult {
  const { address: connectedAddress, isConnected } = useActiveWallet();
  const address = addressOverride || connectedAddress;
  
  // Create a publicClient to interact with the blockchain
  const publicClient = useMemo(() => createPublicClient({
    chain: bscTestnet,
    transport: http()
  }), []);

  // Create a contract instance
  const contract = useMemo(() => {
    if (!RABITA_REGISTRY_ADDRESS) return null;
    
    return {
      address: RABITA_REGISTRY_ADDRESS,
      abi: RABITA_REGISTRY_ABI,
      read: {
        kolProfiles: async (args: [Address]) => publicClient.readContract({
          address: RABITA_REGISTRY_ADDRESS,
          abi: RABITA_REGISTRY_ABI,
          functionName: 'kolProfiles',
          args
        }),
        pgpPublicKeys: async (args: [Address]) => publicClient.readContract({
          address: RABITA_REGISTRY_ADDRESS,
          abi: RABITA_REGISTRY_ABI,
          functionName: 'pgpPublicKeys',
          args
        }),
        pgpNonce: async (args: [Address]) => publicClient.readContract({
          address: RABITA_REGISTRY_ADDRESS,
          abi: RABITA_REGISTRY_ABI,
          functionName: 'pgpNonce',
          args
        })
      }
    };
  }, [publicClient]);

  // Use React Query for data fetching with automatic caching and refetching
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['kolProfile', address],
    queryFn: async (): Promise<KOLProfile> => {
      if (!address || !contract) {
        return { ...emptyProfile, exists: false };
      }

      try {
        const profileData = await contract.read.kolProfiles([address as Address]) as any;
        const pgpPublicKeys = await contract.read.pgpPublicKeys([address as Address]) as any;
        console.debug('pgpPublicKeys', pgpPublicKeys)
        const pgpNonce = await contract.read.pgpNonce([address as Address]) as any;
        console.debug('pgpNonce', pgpNonce)
        const exists = profileData[0] !== '0x0000000000000000000000000000000000000000';
         
        return {
          wallet: exists ? profileData[0] : address as Address,
          platform: exists ? profileData[1] : 'blockchain',
          handle: exists ? profileData[2] : address?.slice(0, 6) + '...' + address?.slice(-6),
          name: exists ? profileData[3] : address?.slice(0, 6) + '...' + address?.slice(-6),
          fee: exists ? profileData[4] : BigInt(0),
          profileIpfsHash: exists ? profileData[5] : null,
          verified: exists ? profileData[6] : false,
          exists,
          pgpKey: {
            publicKey: pgpPublicKeys,
            pgpNonce: pgpNonce
          }
        };
      } catch (err) {
        console.error('Error fetching KOL profile:', err);
        throw err;
      }
    },
    enabled: enabled && !!address && !!contract,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Format the profile data for easier consumption
  const profileData = useMemo(() => {
    if (!data) {
      return { 
        ...emptyProfile,
        exists: false, 
        formattedFee: '0 BNB',
        profileIpfsHash: address ? `https://api.dicebear.com/7.x/identicon/svg?seed=${address}` : null
      };
    }
    
    return {
      ...data,
      // Format fee as Ether string for display
      formattedFee: data.fee ? 
        Number((Number(formatEther(data.fee))).toFixed(4)) + ' BNB' : 
        '0 BNB',
      // If no profile IPFS hash exists, use Dicebar
      profileIpfsHash: data.profileIpfsHash || `https://api.dicebear.com/7.x/identicon/svg?seed=${data.wallet}`
    };
  }, [data, address]);

  return {
    profile: profileData,
    isLoading,
    isError,
    error,
    refetch,
    isConnected,
    address,
    hasProfileData: profileData.exists,
    isKOL: profileData.verified
  };
}

/**
 * Fetch a KOL profile by social handle
 * This is useful when you want to look up profiles by Twitter/social media handle
 */
export function useKOLProfileByHandle(socialHandle?: string): Omit<ProfileDataResult, 'refetch' | 'isConnected' | 'address'> {
  const publicClient = useMemo(() => createPublicClient({
    chain: bscTestnet,
    transport: http()
  }), []);

  // Create a contract instance
  const contract = useMemo(() => {
    if (!RABITA_REGISTRY_ADDRESS) return null;
    
    return {
      address: RABITA_REGISTRY_ADDRESS,
      abi: RABITA_REGISTRY_ABI,
      read: {
        socialHandleToKOLProfile: async (args: [string]) => publicClient.readContract({
          address: RABITA_REGISTRY_ADDRESS,
          abi: RABITA_REGISTRY_ABI,
          functionName: 'socialHandleToKOLProfile',
          args
        })
      }
    };
  }, [publicClient]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['kolProfileByHandle', socialHandle],
    queryFn: async (): Promise<KOLProfile> => {
      if (!socialHandle || !contract) {
        return { ...emptyProfile, exists: false };
      }

      try {
        const profileData = await contract.read.socialHandleToKOLProfile([socialHandle]) as any;
        
        // Check if the profile exists and is verified
        const exists = profileData[0] !== '0x0000000000000000000000000000000000000000';
        
        return {
          wallet: profileData[0],
          platform: profileData[1],
          handle: profileData[2],
          name: profileData[3],
          fee: profileData[4],
          profileIpfsHash: profileData[5],
          verified: profileData[6],
          exists
        };
      } catch (err) {
        console.error('Error fetching KOL profile by handle:', err);
        throw err;
      }
    },
    enabled: !!socialHandle && !!contract,
    staleTime: 60 * 1000,
    retry: 2
  });

  // Format the profile data
  const profileData = useMemo(() => {
    if (!data) {
      return { ...emptyProfile, exists: false, formattedFee: '0 BNB' };
    }
    
    return {
      ...data,
      formattedFee: data.fee ? 
        Number((Number(formatEther(data.fee))).toFixed(4)) + ' BNB' : 
        '0 BNB'
    };
  }, [data]);

  return {
    profile: profileData,
    isLoading,
    isError,
    error,
    hasProfileData: profileData.exists,
    isKOL: profileData.verified
  };
}
