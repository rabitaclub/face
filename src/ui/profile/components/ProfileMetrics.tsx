import { KOLProfile, Metrics } from '@/types/profile';

interface ProfileMetricsProps {
  profile: KOLProfile;
  metrics: Metrics;
}

export function ProfileMetrics({ profile, metrics }: ProfileMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-background rounded-lg p-4 flex flex-col hover:shadow-lg transition-shadow duration-200">
        <span className="text-sm text-muted-foreground mb-1 text-primary/40">Message Fee</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary/80">{profile.formattedFee}</span>
        </div>
      </div>
      
      <div className="bg-background rounded-lg p-4 flex flex-col hover:shadow-lg transition-shadow duration-200">
        <span className="text-sm text-muted-foreground mb-1 text-primary/40">Total Messages</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary/80">{metrics.totalMessages}</span>
          <span className="text-xs text-muted-foreground text-primary/40">received</span>
        </div>
      </div>
      
      <div className="bg-background rounded-lg p-4 flex flex-col hover:shadow-lg transition-shadow duration-200">
        <span className="text-sm text-muted-foreground mb-1 text-primary/40">Total Earnings</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary/80">{parseFloat(metrics.totalPayments).toFixed(4)}</span>
          <span className="text-xs text-muted-foreground text-primary/40">BNB</span>
        </div>
      </div>
    </div>
  );
} 