"use client";

import React, { useEffect, useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number | null | undefined;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showZero?: boolean;
  max?: number;
  compact?: boolean;
  pulse?: boolean;
  context?: 'header' | 'sidebar' | 'bottomNav';
}

const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 z-10',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-primary text-black',
        outline: 'border border-input bg-background text-foreground',
      },
      size: {
        xs: 'text-[10px]',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      shape: {
        circle: 'rounded-full',
        pill: 'rounded-full px-1.5',
        compact: 'rounded-full min-w-0 min-h-0 p-0 w-[8px] h-[8px]',
      },
      context: {
        default: '',
        header: 'shadow-sm',
        sidebar: '',
        bottomNav: 'scale-75 origin-top-right',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      shape: 'circle',
      context: 'default',
    },
  }
);

export const CountBadge = React.forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ 
    count, 
    variant = 'default', 
    size = 'sm', 
    showZero = false, 
    max = 9, 
    compact = false,
    pulse = false,
    context,
    className, 
    ...props 
  }, ref) => {
    // Handle null or undefined count values
    const safeCount = count ?? 0;
    const shouldShow = safeCount > 0 || showZero;
    
    // useState hooks must be called on every render
    const [isVisible, setIsVisible] = useState(false);
    const [isNew, setIsNew] = useState(true);
    
    // useEffect hook must be called on every render
    useEffect(() => {
      if (safeCount > 0) {
        setIsVisible(true);
        
        const timer = setTimeout(() => {
          setIsNew(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }, [safeCount]);
    
    // Only after all hooks have been called, we can return conditionally
    if (!shouldShow) {
      return null;
    }

    // Control how to display the count value
    const displayCount = compact ? '' : (safeCount > max ? `${max}+` : safeCount.toString());

    // Size-dependent dimensions
    const sizeClassNames = {
      xs: 'min-w-[0.85rem] h-[0.85rem]',
      sm: 'min-w-[1.1rem] h-[1.1rem]',
      md: 'min-w-[1.4rem] h-[1.4rem]',
      lg: 'min-w-[1.7rem] h-[1.7rem]',
    };

    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({ 
            variant, 
            size, 
            shape: compact ? 'compact' : displayCount.length > 1 ? 'pill' : 'circle',
            context 
          }),
          isVisible ? 'opacity-100' : 'opacity-0',
          isNew && !compact && 'animate-bounce-short',
          pulse && 'animate-pulse',
          compact ? '' : sizeClassNames[size],
          context === 'bottomNav' && 'transform scale-75 translate-x-1 -translate-y-1',
          className
        )}
        {...props}
      >
        {displayCount}
      </span>
    );
  }
); 