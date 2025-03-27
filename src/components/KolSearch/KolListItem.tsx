import React from 'react';
import Image from 'next/image';
import { KOLProfile } from '@/types/profile';
import { formatEther } from 'viem';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { useKOLProfileData } from '@/hooks/useContractData';
import { Skeleton } from '../ui/Skeleton';
import SecureImage from '../SecureImage';
import { CheckCircle } from 'lucide-react';
import { FiCheckCircle, FiShare2 } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Address } from 'viem';
interface KolListItemProps {
    profile: KOLProfile;
    isSelected?: boolean;
    onClick?: (profile: Address) => void;
    className?: string;
}

export const KolListItem: React.FC<KolListItemProps> = ({
    profile,
    isSelected = false,
    onClick,
    className
}) => {
    const router = useRouter();
    const formattedFee = profile.formattedFee || formatEther(profile.fee);
    const { profile: { profileIpfsHash }, isLoading } = useKOLProfileData(profile.wallet);

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/messages/${profile.wallet}`;
        if (navigator.share) {
            navigator.share({
                title: `Chat with ${profile.name}`,
                text: `Start a conversation with ${profile.name} on Rabita`,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Conversation link copied to clipboard', {
                duration: 3000,
                position: 'top-right',
                style: {
                    background: '#1f2937',
                    color: '#fff',
                },
            });
        }
    };

    return (
        <Card
            className={cn(
                "p-4 cursor-pointer transition-all duration-200 hover:shadow-md bg-primary/10",
                isSelected && "ring-2 ring-blue-500",
                className
            )}
            onClick={() => onClick?.(profile.wallet)}
        >
            <div className="flex items-start space-x-4">
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                        { isLoading ?
                            <Skeleton className="w-full h-full rounded-full bg-gray-200" />
                            : <SecureImage
                                encryptedData={profileIpfsHash || ''}
                                alt={profile.name}
                                width={48}
                                height={48}
                                className="rounded-full"
                                priority
                            />
                        }
                    </div>
                    <Badge 
                        variant="default" 
                        className="absolute -bottom-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-gray-800"
                    >
                        <FiCheckCircle className="w-4 h-4 text-primary" />
                    </Badge>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 truncate">
                            {profile.name || 'Unnamed KOL'}
                        </h3>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleShare}
                                className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                title="Share conversation link"
                            >
                                <FiShare2 size={16} />
                            </button>
                            <span className="text-sm font-medium text-primary bg-gray-800 rounded-md px-2">
                                {formattedFee} BNB
                            </span>
                        </div>
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs text-dark truncate">
                            @{profile.handle}
                        </span>
                    </div>
                    <div className="mt-0 flex items-center space-x-2">
                        <span 
                            className="text-xs text-gray-500"
                        >
                            {profile.platform} verified
                        </span>
                    </div>

                    <div className="mt-1 text-xs text-gray-500 font-mono truncate">
                        {profile.wallet.slice(0, 6)}...{profile.wallet.slice(-6)}
                    </div>
                </div>
            </div>
        </Card>
    );
}; 