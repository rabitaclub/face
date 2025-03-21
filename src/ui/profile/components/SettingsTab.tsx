import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { KOLProfile } from '@/types/profile';

interface SettingsTabProps {
  profile: KOLProfile;
}

export function SettingsTab({ profile }: SettingsTabProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-primary/80">Profile Settings</CardTitle>
        <CardDescription className='text-primary/40'>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3 text-primary/80">Update Profile Picture</h4>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                {profile.profileIpfsHash ? (
                  <Image 
                    src={`https://ipfs.io/ipfs/${profile.profileIpfsHash}`}
                    alt={profile.socialHandle} 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary/20 flex items-center justify-center text-xl text-primary font-medium">
                    {profile.socialHandle.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
              <Button 
                variant="outline" 
                size="sm"
                className='bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200'
                onClick={() => toast.success('Profile picture update feature coming soon!')}
              >
                Change Picture
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-primary/80">Update Message Fee</h4>
            <div className="flex items-center gap-4">
              <div className="bg-background p-2 px-3 rounded border border-border">
                <span className="font-mono font-medium text-primary/80">{profile.formattedFee}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className='bg-dark text-primary hover:bg-white hover:text-black transition-colors duration-200'
                onClick={() => toast.success('Fee update feature coming soon!')}
              >
                Change Fee
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-primary/40">
              This is the amount users will need to pay to send you a message
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 