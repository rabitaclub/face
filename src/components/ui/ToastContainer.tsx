'use client';

import { Toaster as HotToaster } from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { themeConfig } from '@/config/theme.config';

interface ToastContainerProps {
  className?: string;
}

export function ToastContainer({ className }: ToastContainerProps) {
  return (
    <HotToaster
      position="top-right"
      containerClassName={cn(
        '!z-50',
        className
      )}
      toastOptions={{
        // Base styles for all toasts
        className: cn(
          '!bg-background !text-foreground',
          '!shadow-elevation-lg !rounded-container',
          '!px-4 !py-3',
          '!max-w-md',
          '!flex !items-center !gap-3',
          '!transition-all !duration-300',
          '!transform !translate-y-0',
          'hover:!translate-y-[-2px]',
          'hover:!shadow-elevation-lg',
          'active:!translate-y-0',
          'active:!shadow-elevation',
          '!border-l-4', // Left border for visual hierarchy
          'animate-toast-enter',
          'data-[state=closed]:animate-toast-exit',
        ),
        // Success toast specific styles
        success: {
          className: cn(
            '!border-l-success',
            '!bg-background',
            '!text-foreground',
          ),
          iconTheme: {
            primary: 'var(--color-success)',
            secondary: 'var(--background)',
          },
        },
        // Error toast specific styles
        error: {
          className: cn(
            '!border-l-error',
            '!bg-background',
            '!text-foreground',
          ),
          iconTheme: {
            primary: 'var(--color-error)',
            secondary: 'var(--background)',
          },
        },
        // Loading toast specific styles
        loading: {
          className: cn(
            '!border-l-primary',
            '!bg-background',
            '!text-foreground',
          ),
          iconTheme: {
            primary: 'var(--primary)',
            secondary: 'var(--background)',
          },
        },
        // Custom animation durations
        duration: 5000,
        // Custom animation styles
        style: {
          animation: `toast-slide-in-right ${themeConfig.animation.default.stiffness}ms ease-out`,
        },
      }}
    />
  );
} 