'use client';

import { useState, useEffect } from 'react';
import { useActiveWallet } from '@/hooks/useActiveWallet';
import { useKOLProfileData } from '@/hooks/useContractData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import CustomConnect from '@/components/CustomConnect';
import KOLRegistrationView from './KOLRegistrationView';
import KOLProfileView from '@/ui/profile/KOLProfileView';
import { formatEther } from 'viem';

export default function ProfileContainer() {
  const { address, isConnected } = useActiveWallet();
  const { 
    profile, 
    isLoading, 
    hasProfileData, 
    refetch 
  } = useKOLProfileData(address);
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    totalPayments: "0",
    totalFollowers: 0
  });

  useEffect(() => {
    if (hasProfileData && address) {
      setMetrics({
        totalMessages: Math.floor(Math.random() * 50),
        totalPayments: formatEther(BigInt(Math.floor(Math.random() * 5 * 1e18))),
        totalFollowers: Math.floor(Math.random() * 100)
      });
    }
  }, [hasProfileData, address]);

  if (!isConnected) {
    return (
      <div className="container py-8 lowercase">
        <Card className="border-0 shadow-md bg-background-light">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-foreground">Connect Your Wallet</CardTitle>
            <CardDescription className="text-white">
              Connect your wallet to view or create your Rabita profile
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <CustomConnect />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card className="border-0 shadow-md bg-background-light">
          <CardHeader className="pb-2">
            <Skeleton className="h-8 w-3/4 mb-2 bg-primary/20" />
            <Skeleton className="h-4 w-1/2 bg-primary/10" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full bg-primary/15" />
              <Skeleton className="h-20 w-full bg-primary/10" />
              <Skeleton className="h-20 w-full bg-primary/10" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasProfileData) {
    return <KOLRegistrationView />;
  }

  return <KOLProfileView profile={profile} metrics={metrics} />;
} 