'use client';

import { Card } from '@/components/ui/Card';
import { KOLProfile, Metrics } from '@/types/profile';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileMetrics } from './components/ProfileMetrics';
import { ProfileTabs } from './components/ProfileTabs';
import { ProfileTags } from './components/ProfileTags';

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
          
          {/* Display profile tags if available */}
          {profile.tags && (
            <div className="mt-6 p-5 bg-primary/5 rounded-lg border border-primary/10">
              <ProfileTags tags={profile.tags} />
              
              {/* Display description if available */}
              {profile.description && (
                <div className="mt-6 text-sm text-primary/80">
                  <p>{profile.description}</p>
                </div>
              )}
            </div>
          )}
          
          <ProfileTabs profile={profile} metrics={metrics} />
        </div>
      </Card>
    </div>
  );
} 