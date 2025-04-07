"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { themeConfig } from "@/config/theme.config";
import { NavItems } from "@/config/menu.config";
import { useState, useEffect, useRef } from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import { CountBadge } from "@/components/ui/CountBadge";

export default function BottomNavigation() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [shouldHideNav, setShouldHideNav] = useState(false);
  const { badgeCounts } = useNavigation();

  useEffect(() => {
    // Check if visualViewport API is available (modern browsers)
    if (typeof window !== 'undefined' && window.visualViewport) {
      const visualViewport = window.visualViewport; // Store reference to avoid null checks
      
      const viewportHandler = () => {
        const viewportHeight = visualViewport.height;
        const windowHeight = window.innerHeight;
        
        // If viewport height is significantly smaller than window height, keyboard is likely visible
        const isKeyboardVisible = viewportHeight < windowHeight * 0.8;
        setKeyboardVisible(isKeyboardVisible);
        
        // Check if screen height is too small (less than 500px) or keyboard is visible
        const isHeightLimited = viewportHeight < 500;
        setShouldHideNav(isKeyboardVisible || isHeightLimited);
      };

      // Initial check
      viewportHandler();

      // Check on resize and orientation change
      visualViewport.addEventListener('resize', viewportHandler);
      visualViewport.addEventListener('scroll', viewportHandler);
      window.addEventListener('resize', viewportHandler);
      window.addEventListener('orientationchange', viewportHandler);

      return () => {
        visualViewport.removeEventListener('resize', viewportHandler);
        visualViewport.removeEventListener('scroll', viewportHandler);
        window.removeEventListener('resize', viewportHandler);
        window.removeEventListener('orientationchange', viewportHandler);
      };
    } else {
      // Fallback for browsers without visualViewport API
      const resizeHandler = () => {
        const windowHeight = window.innerHeight;
        // Hide navigation on small screens
        setShouldHideNav(windowHeight < 500);
      };
      
      // Initial check
      resizeHandler();
      
      window.addEventListener('resize', resizeHandler);
      window.addEventListener('orientationchange', resizeHandler);
      
      return () => {
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('orientationchange', resizeHandler);
      };
    }
  }, []);

  return (
    <div 
      ref={navRef}
      className={`lg:hidden fixed left-0 right-0 z-30 bg-[var(--foreground)] text-[var(--background)] border-t border-[var(--background)]/20 transition-all duration-300 ${shouldHideNav ? 'translate-y-full' : ''}`}
      style={{
        bottom: 0,
        height: "var(--bottom-nav-height)",
        willChange: "transform",
        backfaceVisibility: "hidden"
      }}
    >
      <div className="flex justify-around items-center h-full" 
           style={{ "--bottom-nav-height": themeConfig.navigation.bottomNavHeight } as React.CSSProperties}>
        {NavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full relative"
            >
              <div className="flex flex-col items-center">
                <div className="relative">
                  {item.icon}
                  {badgeCount > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <CountBadge 
                        count={badgeCount} 
                        variant="destructive" 
                        size="xs"
                        context="bottomNav"
                        compact={badgeCount === 1}
                      />
                    </div>
                  )}
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