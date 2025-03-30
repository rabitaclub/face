"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import { useActiveWallet } from "@/hooks/useActiveWallet";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isConnected } = useActiveWallet()

  return (
    <div className="flex h-screen font-sans bg-[var(--background)]">
      <div 
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300`}
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