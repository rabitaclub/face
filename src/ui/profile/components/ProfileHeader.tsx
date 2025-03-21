import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FiEdit } from 'react-icons/fi';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { KOLProfile } from '@/types/profile';

interface ProfileHeaderProps {
  profile: KOLProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <>
      <div className="relative h-32 bg-primary/80">
        <div className="absolute -bottom-16 left-6">
          <Avatar className="w-32 h-32 border-4 border-background bg-background">
            {profile.profileIpfsHash ? (
              <Image 
                src={`${profile.profileIpfsHash.replace('https://rabita.club', '')}`}
                alt={profile.socialHandle} 
                fill
                className="object-cover"
                onError={() => {
                  toast.error('Failed to load profile image from IPFS');
                }}
              />
            ) : (
              <div className="h-full w-full bg-primary/20 flex items-center justify-center text-4xl text-primary font-medium">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Avatar>
        </div>
      </div>
      
      <div className="pt-20 px-6 pb-6 bg-primary/10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">{profile.name}</h1>
            </div>
            <p className="text-muted-foreground text-sm text-primary/40">@{profile.socialHandle}</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1.5 bg-primary text-primary-foreground"
            onClick={() => toast.success('Profile edit feature coming soon!')}
          >
            <FiEdit size={14} />
            Edit Profile
          </Button>
        </div>
      </div>
    </>
  );
} 