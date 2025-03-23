'use client';

import { Card } from '@/components/ui/Card';
import { KOLProfile, Metrics } from '@/types/profile';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileMetrics } from './components/ProfileMetrics';
import { ProfileTabs } from './components/ProfileTabs';

interface KOLProfileViewProps {
  profile: KOLProfile;
  metrics: Metrics;
}

export default function KOLProfileView({ profile, metrics }: KOLProfileViewProps) {
  return (
    <div className="container py-8">
      <Card className="border-0 shadow-md overflow-hidden">
        <ProfileHeader profile={profile} />
        <div className="px-6 pb-6 bg-primary/10">
          <ProfileMetrics profile={profile} metrics={metrics} />
          <ProfileTabs profile={profile} metrics={metrics} />
        </div>
      </Card>
    </div>
  );
} 