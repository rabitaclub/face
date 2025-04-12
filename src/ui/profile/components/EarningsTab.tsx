import { useKOLPaid } from '@/hooks/useKOLPaid';
import { KOLProfile, Metrics } from '@/types/profile';
import appConfig from '@/config/app.config.json';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
interface EarningsTabProps {
  profile: KOLProfile;
  metrics: Metrics;
}

export function EarningsTab({ profile, metrics }: EarningsTabProps) {
  const { kolPaid, isLoading, isError } = useKOLPaid(profile.wallet);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [isCopied]);
  return (
    <div className="bg-background p-6 rounded-lg">
      <h3 className="font-medium mb-4 text-primary/80">Earnings History ({kolPaid.length})</h3>
      
      {kolPaid.length > 0 ? (
        <div className="space-y-3">
          {kolPaid.map((item, i) => (
            <div 
              key={i} 
              className="flex justify-between items-center p-3 border-b border-border last:border-0 hover:bg-primary/5 transition-colors duration-200 rounded-lg"
            >
              <div>
                <p className="font-medium text-primary/80">Message from {item.sender.slice(0, 6)}...{item.sender.slice(-4)}</p>
                <p className="text-sm text-muted-foreground text-primary/40">
                  {new Date(Number(item.blockTimestamp) * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className="font-medium text-primary/80">
                    {item.amount} BNB
                  </p>
                  <p className="text-xs text-green-600">Confirmed</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`${appConfig.url}/messages/${item.sender}`, "_blank");
                  }}
                  title="View message"
                >
                  <MessageSquare className="h-4 w-4 text-primary/60" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`${appConfig.explorer}/tx/${item.transactionHash}`, "_blank");
                  }}
                  title="View transaction"
                >
                  <ExternalLink className="h-4 w-4 text-primary/60" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground text-primary/40">
            No earnings yet. Share your profile link to start earning.
          </p>
          <Button 
            variant="outline"
            disabled={isCopied}
            className='bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200' 
            onClick={() => {
              navigator.clipboard.writeText(`${appConfig.url}/messages/@${profile.handle}`);
              setIsCopied(true);
              toast.success('Profile link copied to clipboard!');
            }}
          >
            {isCopied ? 'Copied!' : 'Copy Profile Link'}
          </Button>
      </>
      )}
    </div>
  );
} 