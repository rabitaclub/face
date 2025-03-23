import { Avatar } from '@/components/ui/Avatar';
import { KOLProfile } from '@/types/profile';
import SecureImage from '@/components/SecureImage';

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
              <SecureImage 
                encryptedData={profile.profileIpfsHash}
                alt={profile.handle}
                width={128}
                height={128}
                className="rounded-full"
                priority
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
            <p className="text-muted-foreground text-sm text-primary/40">@{profile.handle}</p>
          </div>
        </div>
      </div>
    </>
  );
} 