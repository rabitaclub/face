import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'text-blue-500',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div className={`${className} flex justify-center items-center`}>
      <div
        className={`
          ${sizeClasses[size]} 
          ${color} 
          rounded-full 
          animate-spin 
          border-t-transparent
          border-solid
        `}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
} 