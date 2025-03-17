"use client";

import { X, MessageSquare, Users, Bell, Settings, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { themeConfig } from "@/config/theme.config";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

// Keep the navigation items consistent with bottom navigation
const navItems = [
  {
    icon: <MessageSquare size={20} />,
    label: "Messages",
    href: "/messages",
  },
  {
    icon: <Users size={20} />,
    label: "Contacts",
    href: "/contacts",
  },
  {
    icon: <Bell size={20} />,
    label: "Notifications",
    href: "/notifications",
  },
  {
    icon: <Settings size={20} />,
    label: "Settings",
    href: "/settings",
  },
];

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-20 sidebar-container lg:static">
          <div 
            className="flex flex-col h-screen bg-[var(--foreground)] text-[var(--background)] w-full"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--background)]/20">
              <h1 className="text-xl font-bold">{themeConfig.name}</h1>
              <button 
                onClick={toggle}
                className="p-1 rounded-md hover:bg-[var(--background)]/10 lg:hidden"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center p-2 space-x-3 rounded-md transition-colors ${
                      isActive 
                        ? "bg-[var(--background)]/20" 
                        : "hover:bg-[var(--background)]/10"
                    }`}
                  >
                    <div className="relative">
                      {item.icon}
                      {isActive && (
                        <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-[var(--background)]" />
                      )}
                    </div>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-[var(--background)]/20">
              <Link 
                href="/profile" 
                className={`flex items-center p-2 space-x-3 rounded-md transition-colors ${
                  pathname === "/profile" 
                    ? "bg-[var(--background)]/20" 
                    : "hover:bg-[var(--background)]/10"
                }`}
              >
                <User size={20} />
                <span>Profile</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
} 