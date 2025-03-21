import { KOLProfile, Metrics } from '@/types/profile';

interface EarningsTabProps {
  profile: KOLProfile;
  metrics: Metrics;
}

export function EarningsTab({ profile, metrics }: EarningsTabProps) {
  return (
    <div className="bg-background p-6 rounded-lg">
      <h3 className="font-medium mb-4 text-primary/80">Earnings History</h3>
      
      {metrics.totalMessages > 0 ? (
        <div className="space-y-3">
          {Array.from({ length: Math.min(metrics.totalMessages, 3) }).map((_, i) => (
            <div 
              key={i} 
              className="flex justify-between items-center p-3 border-b border-border last:border-0 hover:bg-primary/5 transition-colors duration-200 rounded-lg"
            >
              <div>
                <p className="font-medium text-primary/80">Message from User{i+1}</p>
                <p className="text-sm text-muted-foreground text-primary/40">
                  {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-primary/80">
                  {(parseFloat(profile.formattedFee ?? "") * 0.9).toFixed(4)} BNB
                </p>
                <p className="text-xs text-green-600">Confirmed</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-primary/40">
          No earnings yet. Start receiving messages to earn BNB.
        </p>
      )}
    </div>
  );
} 