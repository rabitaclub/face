"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import { themeConfig } from "@/config/theme.config";
import { useActiveWallet } from "@/hooks/useActiveWallet";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isConnected } = useActiveWallet()
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      const breakpoint = 1024; // This is typically the 'lg' breakpoint in Tailwind
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <div className="flex h-screen font-sans bg-[var(--background)]">
      <div 
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300`}
        style={{ 
          paddingBottom: isConnected && isMobile ? themeConfig.navigation.bottomNavHeight : '0'
        }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-4 pt-6">
          {children}
        </main>
      </div>
      
      { isConnected && <BottomNavigation /> }
    </div>
  );
} 