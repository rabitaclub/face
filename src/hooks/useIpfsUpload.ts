'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface UploadOptions {
  name?: string;
  description?: string;
  autoToast?: boolean;
}

interface UploadResult {
  ipfsHash: string;
  url: string;
  gatewayUrl?: string;
  filename?: string;
}

/**
 * Custom hook for handling IPFS uploads via the server API
 */
export function useIpfsUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload a file to IPFS using the server API
   * @param file File to upload
   * @param options Upload options
   * @returns Promise resolving to the IPFS result object
   */
  const uploadFile = useCallback(async (
    file: File, 
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);
    
    let toastId: string | undefined;
    if (options.autoToast !== false) {
      toastId = toast.loading('Uploading file to IPFS...');
    }
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      if (options.name) {
        formData.append('name', options.name);
      }
      
      if (options.description) {
        formData.append('description', options.description);
      }
      
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload to IPFS');
      }
      
      const data = await response.json();
      
      if (data.result) {
        // Process the successful result
        console.debug('data', data);
        const result: UploadResult = {
          ipfsHash: data.result.ipfsHash || data.result,
          url: data.result.url || `ipfs://${data.result.ipfsHash}`,
          gatewayUrl: data.gatewayUrl,
          filename: data.filename || file.name
        };
        
        setIpfsHash(result.ipfsHash);
        setUploadResult(result);
        setIsUploading(false);
        
        if (toastId) {
          toast.success('Content uploaded to IPFS successfully', { id: toastId });
        }
        
        return result;
      } else {
        throw new Error('No IPFS result returned');
      }
    } catch (err) {
      setIsUploading(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      if (toastId) {
        toast.error(errorMessage, { id: toastId });
      }
      
      throw err;
    }
  }, []);

  /**
   * Reset the upload state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setIpfsHash(null);
    setUploadResult(null);
    setError(null);
  }, []);

  return {
    uploadFile,
    isUploading,
    ipfsHash,
    uploadResult,
    error,
    reset
  };
} 