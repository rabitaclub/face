import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { KOLProfile, Metrics } from '@/types/profile';
import { MessagesTab } from './MessagesTab';
import { EarningsTab } from './EarningsTab';
import { SettingsTab } from './SettingsTab';

interface ProfileTabsProps {
  profile: KOLProfile;
  metrics: Metrics;
}

export function ProfileTabs({ profile, metrics }: ProfileTabsProps) {
  return (
    <div className="mt-8">
      <Tabs defaultValue="messages">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger 
            value="messages" 
            className="data-[state=inactive]:text-white/40 transition-colors duration-200"
          >
            Messages
          </TabsTrigger>
          <TabsTrigger 
            value="earnings" 
            className="data-[state=inactive]:text-white/40 transition-colors duration-200"
          >
            Earnings
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="data-[state=inactive]:text-white/40 transition-colors duration-200"
          >
            Settings
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