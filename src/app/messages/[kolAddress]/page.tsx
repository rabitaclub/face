'use client';

import { MessagingContainer } from '@/ui/messaging/MessagingContainer';
import { useParams } from 'next/navigation';

export default function KolConversationPage() {
  const params = useParams();
  let kolAddress = params.kolAddress as string;

  const isHandle = kolAddress?.startsWith('%40');
  
  if (isHandle) {
    kolAddress = kolAddress.slice(3);
  }

  return (
    <div className="h-full min-h-screen flex flex-col w-full bg-white rounded-lg">
      <MessagingContainer initialKolAddress={kolAddress as `0x${string}`} isHandle={isHandle} />
    </div>
  );
} 