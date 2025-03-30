"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { themeConfig } from "@/config/theme.config";
import { NavItems } from "@/config/menu.config";
import { useState, useEffect, useRef } from "react";

export default function BottomNavigation() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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
        
        if (navRef.current) {
          // Calculate position relative to visual viewport bottom
          const offsetFromBottom = windowHeight - viewportHeight - visualViewport.offsetTop;

          if (isKeyboardVisible) {
            // When keyboard is visible, keep navbar at the bottom of the visual viewport
            navRef.current.style.position = 'fixed';
            navRef.current.style.bottom = `${offsetFromBottom}px`;
          } else {
            // When keyboard is hidden, reset to normal fixed position
            navRef.current.style.position = 'fixed';
            navRef.current.style.bottom = '0';
          }
        }
      };

      // Initial positioning
      viewportHandler();

      // Listen for viewport changes (keyboard appears/disappears)
      visualViewport.addEventListener('resize', viewportHandler);
      visualViewport.addEventListener('scroll', viewportHandler);

      return () => {
        visualViewport.removeEventListener('resize', viewportHandler);
        visualViewport.removeEventListener('scroll', viewportHandler);
      };
    }
  }, []);

  return (
    <div 
      ref={navRef}
      className={`lg:hidden fixed left-0 right-0 z-30 bg-[var(--foreground)] text-[var(--background)] border-t border-[var(--background)]/20 transition-transform ${keyboardVisible ? 'keyboard-visible' : ''}`}
      style={{
        bottom: 0,
        height: "var(--bottom-nav-height)",
        transform: "translateZ(0)", // Force GPU acceleration
        willChange: "transform, bottom",
        backfaceVisibility: "hidden"
      }}
    >
      <div className="flex justify-around items-center h-full" 
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