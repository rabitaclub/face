import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { KOLProfile, Metrics } from '@/types/profile';
import { MessagesTab } from './MessagesTab';
import { EarningsTab } from './EarningsTab';
import { SettingsTab } from './SettingsTab';
import { useUnrepliedMessages } from '@/ui/messaging/hooks/useUnrepliedMessages';
import { CountBadge } from '@/components/ui/CountBadge';

interface ProfileTabsProps {
  profile: KOLProfile;
  metrics: Metrics;
}

export function ProfileTabs({ profile, metrics }: ProfileTabsProps) {
  const { count: unrepliedCount } = useUnrepliedMessages();

  return (
    <div className="mt-8">
      <Tabs defaultValue="messages">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger 
            value="messages" 
            className="data-[state=inactive]:text-white/40 transition-colors duration-200 relative"
          >
            <div className="flex items-center gap-2">
              messages
              <CountBadge 
                count={unrepliedCount} 
                variant="destructive" 
                size="xs"
                pulse={unrepliedCount > 0}
                compact={unrepliedCount === 1}
              />
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="earnings" 
            className="data-[state=inactive]:text-white/40 transition-colors duration-200"
          >
            earnings
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="data-[state=inactive]:text-white/40 transition-colors duration-200"
          >
            settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="space-y-4">
          <MessagesTab profile={profile} />
        </TabsContent>
        
        <TabsContent value="earnings" className="space-y-4">
          <EarningsTab profile={profile} metrics={metrics} />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <SettingsTab profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 