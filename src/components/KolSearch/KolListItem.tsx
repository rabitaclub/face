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
import appConfig from '@/config/app.config.json';

interface KolListItemProps {
    profile: KOLProfile;
    isSelected?: boolean;
    onClick?: (profile: Address) => void;
    className?: string;
    variant?: 'card' | 'list';
}

export const KolListItem: React.FC<KolListItemProps> = ({
    profile,
    isSelected = false,
    onClick,
    className,
    variant = 'list'
}) => {
    const formattedFee = profile.formattedFee || formatEther(profile.fee);
    const { profile: { profileIpfsHash }, isLoading } = useKOLProfileData(profile.wallet);

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${appConfig.url}/messages/@${profile.handle}`;
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

    if (variant === 'card') {
        return (
            <div
                className={cn(
                    "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                    isSelected && "ring-2 ring-blue-500",
                    className
                )}
                onClick={() => onClick?.(profile.wallet)}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700">
                            {isLoading ?
                                <Skeleton className="w-full h-full rounded-full bg-gray-600" />
                                : <SecureImage
                                    encryptedData={profileIpfsHash || ''}
                                    alt={profile.name}
                                    width={80}
                                    height={80}
                                    className="rounded-full"
                                    priority
                                />
                            }
                        </div>
                        <Badge 
                            variant="default" 
                            className="absolute -bottom-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gray-800"
                        >
                            <FiCheckCircle className="w-4 h-4 text-primary" />
                        </Badge>
                    </div>
                    <h3 className="font-bold text-gray-100 truncate w-full">
                        {profile.name || 'Unnamed KOL'}
                    </h3>
                    <div className="mt-1 text-xs text-gray-400 truncate w-full">
                        @{profile.handle}
                    </div>
                    <div className="mt-2 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary bg-gray-800 rounded-md px-2 py-1">
                            {formattedFee} BNB
                        </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400 font-mono truncate w-full">
                        {profile.wallet.slice(0, 6)}...{profile.wallet.slice(-6)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Card
            className={cn(
                "p-4 cursor-pointer transition-all duration-200 hover:shadow-md bg-gray-800",
                isSelected && "ring-2 ring-blue-500",
                className
            )}
            onClick={() => onClick?.(profile.wallet)}
        >
            <div className="flex items-start space-x-4">
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                        {isLoading ?
                            <Skeleton className="w-full h-full rounded-full bg-gray-600" />
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
                        <h3 className="font-bold text-gray-100 truncate">
                            {profile.name || 'Unnamed KOL'}
                        </h3>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleShare}
                                className="p-1 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700 transition-colors duration-200"
                                title="Share conversation link"
                            >
                                <FiShare2 size={16} />
                            </button>
                            <span className="text-sm font-medium text-primary bg-gray-700 rounded-md px-2">
                                {formattedFee} BNB
                            </span>
                        </div>
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs text-gray-300 truncate">
                            @{profile.handle}
                        </span>
                    </div>
                    <div className="mt-0 flex items-center space-x-2">
                        <span 
                            className="text-xs text-gray-400"
                        >
                            {profile.platform === 'twitter' ? 'X' : profile.platform} verified
                        </span>
                    </div>

                    <div className="mt-1 text-xs text-gray-400 font-mono truncate">
                        {profile.wallet.slice(0, 6)}...{profile.wallet.slice(-6)}
                    </div>
                </div>
            </div>
        </Card>
    );
}; 