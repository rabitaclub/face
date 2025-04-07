"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUnrepliedMessages } from '@/ui/messaging/hooks/useUnrepliedMessages';

interface BadgeCounts {
  messages: number;
  [key: string]: number;
}

interface NavigationContextType {
  badgeCounts: BadgeCounts;
  updateBadgeCount: (key: string, count: number) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  badgeCounts: { messages: 0 },
  updateBadgeCount: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({ messages: 0 });
  const { count: unrepliedCount } = useUnrepliedMessages();
  
  // Update the message badge count when unrepliedCount changes
  useEffect(() => {
    setBadgeCounts(prev => ({
      ...prev,
      messages: unrepliedCount || 0
    }));
  }, [unrepliedCount]);

  const updateBadgeCount = (key: string, count: number) => {
    setBadgeCounts(prev => ({
      ...prev,
      [key]: count
    }));
  };

  return (
    <NavigationContext.Provider value={{ badgeCounts, updateBadgeCount }}>
      {children}
    </NavigationContext.Provider>
  );
}; 