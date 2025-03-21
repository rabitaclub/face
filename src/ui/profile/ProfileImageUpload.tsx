'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FiUpload, FiX, FiCheck, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import { compressImage, generateFileHash } from '@/utils/imageUtils';
import { useIpfsUpload } from '@/hooks/useIpfsUpload';
import { useAccount } from 'wagmi';
import XLogo from '../icons/XLogo';

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Accepted image types
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface ProfileImageUploadProps {
  onIpfsHashChange: (hash: string) => void;
  twitterImageUrl?: string;
  initialHash?: string;
}

const ProfileImageUpload = ({ 
  onIpfsHashChange, 
  twitterImageUrl,
  initialHash 
}: ProfileImageUploadProps) => {
  const { address } = useAccount();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [usingTwitterImage, setUsingTwitterImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  
  // Use our custom hook for IPFS uploads
  const { 
    uploadFile, 
    isUploading, 
    ipfsHash: uploadedHash,
    uploadResult,
    reset: resetUpload
  } = useIpfsUpload();
  
  // Initialize with initial hash if provided
  const [ipfsHash, setIpfsHash] = useState<string | null>(initialHash || null);
  
  // Add a local progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Update progress when uploading
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (isUploading) {
      // Simulate progress updates
      setUploadProgress(10); // Start with 10%
      progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 1, 90)); // Increment but cap at 90%
      }, 500);
    } else {
      // Reset or complete progress
      setUploadProgress(isUploading ? 0 : 100);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isUploading]);

  // Update local ipfsHash state when the hook's state changes
  useEffect(() => {
    if (uploadedHash) {
      setIpfsHash(uploadedHash);
      onIpfsHashChange(uploadResult?.gatewayUrl || uploadedHash);

      // console.debug('uploadedHash', uploadedHash, uploadResult?.gatewayUrl);
      
      // Store gateway URL if available
      if (uploadResult?.gatewayUrl) {
        setGatewayUrl(uploadResult.gatewayUrl);
        setIsUploaded(true);
      }
    }
  }, [uploadedHash, uploadResult, onIpfsHashChange]);

  // Set X image as preview on first load if available
  useEffect(() => {
    if (twitterImageUrl && !preview && !selectedFile) {
      // Use secure proxied URL for display to prevent CORS issues and unauthorized access
      // Directly proxy internal requests, which will generate a token if needed
      // const proxiedPreviewUrl = twitterImageUrl.startsWith('/api') 
      //   ? twitterImageUrl // Already proxied
      //   : `/api/proxy-image?url=${encodeURIComponent(twitterImageUrl)}`;
        
      // setPreview(proxiedPreviewUrl);
      // setUsingTwitterImage(true);
    }
  }, [twitterImageUrl, preview, selectedFile]);

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    
    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    try {
      // Generate a unique hash for the file
      const fileHash = await generateFileHash(file);
      const fileExt = file.name.split('.').pop() || 'jpg';
      
      // Create a new file with a unique name
      const uniqueFile = new File([file], `profile-${address}.${fileExt}`, {
        type: file.type
      });
      
      setSelectedFile(uniqueFile);
      setUsingTwitterImage(false);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing file:', err);
      toast.error('Failed to process image');
    }
  };

  // Upload X profile image to IPFS
  const uploadTwitterImageToIPFS = async () => {
    if (!twitterImageUrl) return;
    
    // Reset any previous upload state
    resetUpload();
    
    try {
      // Get secure access to the image via our proxy
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(twitterImageUrl)}`;
      const toastId = toast.loading('Processing X image...');

      // Fetch the image through our secure proxy
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a file from the blob
      const fileExt = 'jpg'; // Assume JPG for X images
      const fileName = `profile-${address}.${fileExt}`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      toast.loading('Compressing image...', { id: toastId });
      
      // Compress the image
      const compressedImage = await compressImage(file, 800, 0.8);
      
      toast.loading('Uploading to GF...', { id: toastId });
      
      // Create a file from the compressed image
      const finalFile = new File(
        [compressedImage], 
        fileName, 
        { type: 'image/jpeg' }
      );
      
      // Upload to IPFS using our hook
      const result = await uploadFile(finalFile, {
        name: 'X Profile Image',
        description: 'X profile image for Rabita platform',
        autoToast: false
      });
      
      // Save gateway URL if available
      if (result.gatewayUrl) {
        setGatewayUrl(result.gatewayUrl);
      }
      
      // Success is handled by the hook and useEffect
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (err) {
      console.error('Error uploading X image to IPFS:', err);
      toast.error('Failed to upload X image to IPFS');
    }
  };

  // Handle upload button click
  const handleUpload = async () => {
    // Reset any previous upload state
    setIsUploaded(false);
    resetUpload();
    
    if (usingTwitterImage && twitterImageUrl) {
      await uploadTwitterImageToIPFS();
    } else if (selectedFile) {
      try {
        // Upload the selected file using our hook
        const result = await uploadFile(selectedFile, {
          name: 'Profile Image',
          description: 'User profile image for Rabita platform'
        });
        
        // Save gateway URL if available
        if (result.gatewayUrl) {
          setGatewayUrl(result.gatewayUrl);
        }
        
        // Success is handled by the hook and useEffect
      } catch (error) {
        // Error is handled by the hook
        console.error('Error in upload handler:', error);
      }
    }
  };

  // Remove the selected image
  const handleRemoveImage = () => {
    console.debug('handleRemoveImage', preview);
    setSelectedFile(null);
    setPreview(null);
    setIpfsHash(null);
    setGatewayUrl(null);
    resetUpload();
    onIpfsHashChange('');
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Reset to X image if available
    // if (twitterImageUrl) {
    //   setPreview(twitterImageUrl);
    //   setUsingTwitterImage(true);
    // }
  };

  // Reset to X image
  const resetToTwitterImage = () => {
    if (!twitterImageUrl) return;
    
    // Use securely proxied URL for display
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(twitterImageUrl)}`;
    
    setSelectedFile(null);
    setPreview(proxiedUrl);
    setUsingTwitterImage(true);
    setIpfsHash(null);
    setGatewayUrl(null);
    resetUpload();
    onIpfsHashChange('');
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open gateway URL in new tab
  const openGatewayUrl = () => {
    if (gatewayUrl) {
      window.open(gatewayUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-primary">Profile Image</h3>
        {twitterImageUrl && !usingTwitterImage && !isUploaded && (
          <button
            type="button"
            onClick={resetToTwitterImage}
            className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
          >
            <FiRefreshCw size={12} />
            Use <XLogo size={12} /> image
          </button>
        )}
      </div>
      
      <div className="flex flex-col items-center">
        {preview ? (
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary">
              <Image 
                src={preview} 
                alt="Profile preview" 
                width={128} 
                height={128} 
                className="object-cover w-full h-full"
              />
            </div>
            
            {!isUploaded && <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              <FiX size={14} />
            </button>}
          </div>
        ) : (
          <div 
            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-4 cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="text-gray-400" size={24} />
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
        />
        
        {!preview && !isUploaded && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-primary hover:text-primary-dark transition-colors mb-2"
          >
            Select an image
          </button>
        )}
        
        {preview && !ipfsHash && !isUploading && !isUploaded && (
          <button
            type="button"
            onClick={handleUpload}
            className="px-4 py-2 text-sm font-medium text-dark bg-primary rounded-md hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mt-2"
          >
            Upload to Greenfield
          </button>
        )}
        
        {isUploading && (
          <div className="w-full max-w-xs mt-2">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                    Uploading
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-primary">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/10">
                <div 
                  style={{ width: `${uploadProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-300"
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {ipfsHash && (
          <div className="flex flex-col items-center mt-2">
            <div className="flex items-center text-green-600">
              <FiCheck className="mr-1" size={16} />
              <span className="text-sm">Image uploaded successfully</span>
            </div>
            
            {gatewayUrl && (
              <button
                type="button"
                onClick={openGatewayUrl}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark mt-1"
              >
                <span>View via Gateway</span>
                <FiExternalLink size={12} />
              </button>
            )}
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          {ipfsHash 
            ? "Your profile image has been stored successfully" 
            : "Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB"}
        </p>
      </div>
    </div>
  );
};

export default ProfileImageUpload; 