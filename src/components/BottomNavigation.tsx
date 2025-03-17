"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { themeConfig } from "@/config/theme.config";
import { NavItems } from "@/config/menu.config";

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--foreground)] text-[var(--background)] border-t border-[var(--background)]/20">
      <div className="flex justify-around items-center h-[var(--bottom-nav-height)]" 
           style={{ "--bottom-nav-height": themeConfig.navigation.bottomNavHeight } as React.CSSProperties}>
        {NavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full relative"
            >
              <div className="flex flex-col items-center">
                <div className="relative">
                  {item.icon}
                  {isActive && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--background)]" />
                  )}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 