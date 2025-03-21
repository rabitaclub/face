'use client';

import { useKOLProfileData } from '@/hooks/useContractData';
import Image from 'next/image';
import { useEffect, useState } from 'react';

// Default avatar placeholder
const PLACEHOLDER_AVATAR = 'https://api.dicebear.com/8.x/avataaars/svg?seed=';

/**
 * Component to display a KOL profile data from the RabitaRegistry contract
 * Shows verification status, profile details, and fee information
 */
export function KOLProfileCard() {
  const { profile, isLoading, isError, hasProfileData, address } = useKOLProfileData();
  const [avatarUrl, setAvatarUrl] = useState('');

  // Generate avatar fallback when profileIpfsHash is not available
  useEffect(() => {
    if (!profile.profileIpfsHash && address) {
      setAvatarUrl(`${PLACEHOLDER_AVATAR}${address.slice(2, 10)}`);
    } else if (profile.profileIpfsHash) {
      // If there's an IPFS hash, construct the URL (adjust based on your IPFS gateway)
      setAvatarUrl(`https://ipfs.io/ipfs/${profile.profileIpfsHash}`);
    }
  }, [profile.profileIpfsHash, address]);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-background-light rounded-xl p-6 shadow-elevation mb-6">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 rounded-xl p-6 shadow-elevation border border-red-200 mb-6">
        <h2 className="text-lg font-medium text-red-700 mb-2">Error Loading Profile</h2>
        <p className="text-red-600">
          There was an error loading the profile data. Please try again later.
        </p>
      </div>
    );
  }

  if (!hasProfileData) {
    return (
      <div className="bg-background-light rounded-xl p-6 shadow-elevation mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">KOL profile</h2>
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <p className="text-yellow-700 lowercase">
            No registered profile found for this wallet address.
          </p>
          <p className="text-yellow-600 text-sm mt-2 lowercase">
            To register as a Key Opinion Leader (KOL), you need to verify your social media account 
            and submit a registration transaction to the Rabita Registry contract.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light rounded-xl p-6 shadow-elevation mb-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold text-foreground">KOL profile</h2>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2" aria-hidden="true" />
          <span className="text-sm font-medium text-green-700 lowercase">verified</span>
        </div>
      </div>

      <div className="flex items-center mb-6">
        {avatarUrl && (
          <div className="relative overflow-hidden rounded-full border-2 border-primary-light mr-4">
            <Image 
              src={avatarUrl} 
              alt="Profile" 
              width={80} 
              height={80} 
              className="rounded-full"
            />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-lg text-foreground lowercase">
            {profile.socialHandle}
          </h3>
          <div className="flex items-center mt-1">
            <span className="text-gray-600 text-sm lowercase">{profile.socialPlatform}</span>
          </div>
          <div className="mt-2 text-primary font-medium lowercase">
            Fee: {profile.formattedFee}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium text-gray-700 lowercase">wallet address:</span>{' '}
          <span className="font-mono lowercase">{profile.wallet.slice(0, 6)}...{profile.wallet.slice(-4)}</span>
        </div>
        {/* Additional profile data could be shown here */}
      </div>
    </div>
  );
} 