import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { KOLProfile } from '@/types/profile';
import appConfig from '@/config/app.config.json';
interface MessagesTabProps {
  profile: KOLProfile;
}

export function MessagesTab({ profile }: MessagesTabProps) {
  return (
    <div className="bg-background p-6 rounded-lg text-center">
      <h3 className="font-medium mb-2 text-primary/80">No Messages Yet</h3>
      <p className="text-sm text-muted-foreground mb-4 text-primary/40">
        Share your profile link to start receiving messages from your fans
      </p>
      <Button 
        variant="outline"
        className='bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200' 
        onClick={() => {
          navigator.clipboard.writeText(`${appConfig.url}/messages/${profile.handle}`);
          toast.success('Profile link copied to clipboard!');
        }}
      >
        Copy Profile Link
      </Button>
    </div>
  );
} 