"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { themeConfig } from "@/config/theme.config";
import { NavItems } from "@/config/menu.config";
import { useActiveWallet } from "@/hooks/useActiveWallet";

export default function Header() {
  const { isConnected } = useActiveWallet();

  const pathname = usePathname();
  
  const animationProps = {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { 
      delay: 0.1,
      type: themeConfig.animation.default.type,
      stiffness: themeConfig.animation.default.stiffness,
      damping: themeConfig.animation.default.damping
    }
  };

  return (
    <header className="sticky top-0 z-10 flex flex-col items-center px-4 py-3 border-b border-[var(--foreground)]/20 bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex items-center text-center justify-center w-full">
        <motion.div {...animationProps}>
          <h2 className="text-xl font-semibold font-sans">
            <motion.span layout>
              <h2 className="font-croogla text-3xl">rabita</h2>
            </motion.span>
          </h2>
        </motion.div>
      </div>
      
      {/* Horizontal Navigation - Hidden on mobile */}
      {isConnected && (
        <nav className="hidden md:flex justify-center mt-3 space-x-6 w-full">
          <div className="flex space-x-6">
            {NavItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    scroll={false}
                    className={`relative flex items-center px-3 py-1 rounded-md transition-colors ${
                      isActive 
                        ? "text-[var(--accent)]" 
                        : "hover:text-[var(--primary)]"
                    }`}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </span>
                    
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
} 