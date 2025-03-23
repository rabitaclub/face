'use client';

import { createHash } from 'crypto';
import { ethers } from 'ethers';

interface SecureImageToken {
  url: string;
  expires: number;
  signature: string;
}

interface EncryptedImageData {
  url: string;
  ipfsHash: string;
  timestamp: number;
  signature: string;
}

/**
 * Compresses an image file by resizing and reducing quality
 * 
 * @param file - The original image file
 * @param maxWidth - Maximum width of the compressed image (default: 800px)
 * @param quality - Quality of the compressed image (0.0 to 1.0, default: 0.8)
 * @returns A promise that resolves to a compressed image Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    // Create a FileReader to read the file
    const reader = new FileReader();
    
    reader.onload = (event) => {
      // Create an image element to load the file data
      const img = new Image();
      
      img.onload = () => {
        // Create a canvas element to draw and resize the image
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw image with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine output format based on input type
        let outputType = 'image/jpeg';
        if (['image/png', 'image/webp'].includes(file.type)) {
          outputType = file.type;
        }
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          outputType,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
      
      // Set the image source to the file data
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Could not read file'));
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  });
}

export function generateSecureImageToken(imageUrl: string, expiresInMinutes = 30): string {
  const expires = Math.floor(Date.now() / 1000) + (expiresInMinutes * 60);
  const data = `${imageUrl}|${expires}`;
  const signature = createHash('sha256')
    .update(data + process.env.NEXTAUTH_SECRET)
    .digest('hex');

  const token: SecureImageToken = {
    url: imageUrl,
    expires,
    signature
  };

  return Buffer.from(JSON.stringify(token)).toString('base64');
}