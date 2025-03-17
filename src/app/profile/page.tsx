import { ProfileContainer } from '@/ui/profile/ProfileContainer';

/**
 * Main profile page that delegates to the ProfileContainer component
 */
export default function ProfilePage() {
  return (
    <div className="h-full flex flex-col w-full">
      <ProfileContainer />
    </div>
  );
}
