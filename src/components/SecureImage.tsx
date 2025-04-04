'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/utils/cn';
import { Skeleton } from '@/components/ui/Skeleton';
import { FiAlertCircle } from 'react-icons/fi';
import { User } from 'lucide-react';

interface SecureImageProps {
  encryptedData: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function SecureImage({
  encryptedData,
  alt,
  width = 128,
  height = 128,
  className,
  priority = false
}: SecureImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        setImageUrl(`/api/secure-image?data=${encodeURIComponent(encryptedData)}`);
      } catch (err) {
        console.error('Error fetching secure image:', err);
        setError('Failed to load image');
      } finally {
        setIsLoading(false);
      }
    };

    if (encryptedData) {
      fetchImageUrl();
    }
  }, [encryptedData]);

  if (error) {
    return (
      <div className={cn(
        "relative flex items-center justify-center bg-muted rounded-lg overflow-hidden",
        className
      )}>
        <div className="flex flex-col items-center gap-2 p-4 text-center">
          <User className="text-gray-400" size={24} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Skeleton 
        className={cn(
          "relative rounded-lg bg-primary/60 overflow-hidden animate-pulse",
          className
        )}
        style={{ width, height }}
      />
    );
  }

  if (!imageUrl) {
    return null;
  }

  if (encryptedData?.startsWith('https://')) {
    return (
      <div className={cn(
        "relative rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center",
        className
      )}>
        <User className="text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className={cn(
      "relative rounded-lg overflow-hidden bg-muted",
      className
    )}>
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className="object-cover transition-opacity duration-300"
        priority={priority}
        onError={() => {
          setError('Failed to load image');
          setIsLoading(false);
        }}
      />
    </div>
  );
} 