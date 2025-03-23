'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FiUpload, FiX, FiCheck, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import { compressImage } from '@/utils/imageUtils';
import { useIpfsUpload } from '@/hooks/useIpfsUpload';
import { useAccount } from 'wagmi';
import XLogo from '../icons/XLogo';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface ProfileImageUploadProps {
  onIpfsHashChange: (hash: string) => void;
  socialImageUrl?: string;
  initialHash?: string;
}

const ProfileImageUpload = ({ 
  onIpfsHashChange, 
  socialImageUrl,
  initialHash 
}: ProfileImageUploadProps) => {
  const { address } = useAccount();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [usingSocialImage, setUsingSocialImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  
  const { 
    uploadFile, 
    isUploading, 
    profileUrl: uploadedHash,
    uploadResult,
    reset: resetUpload
  } = useIpfsUpload();
  
  const [ipfsHash, setIpfsHash] = useState<string | null>(initialHash || null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (isUploading) {
      setUploadProgress(0);
      progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 1, 90));
      }, 300);
    } else {
      setUploadProgress(isUploading ? 0 : 100);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isUploading]);

  useEffect(() => {
    if (uploadedHash) {
      setIpfsHash(uploadedHash);
      onIpfsHashChange(uploadedHash);
      setGatewayUrl(uploadResult?.gatewayUrl || null);
      setIsUploaded(true);
    }
  }, [uploadedHash, uploadResult, onIpfsHashChange]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const uniqueFile = new File([file], `profile-${address}.${fileExt}`, {
        type: file.type
      });
      
      setSelectedFile(uniqueFile);
      setUsingSocialImage(false);

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

  const uploadProfileImage = async () => {
    if (!socialImageUrl) return;
    
    resetUpload();
    
    const toastId = toast.loading('Processing social profile image...');
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(socialImageUrl)}`;

      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      const fileExt = 'jpg';
      const fileName = `profile-${address}.${fileExt}`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      toast.loading('Compressing image...', { id: toastId });
      
      const compressedImage = await compressImage(file, 800, 0.8);
      
      toast.loading('Uploading...', { id: toastId, duration: Infinity });
      
      const finalFile = new File(
        [compressedImage], 
        fileName, 
        { type: 'image/jpeg' }
      );
      
      const result = await uploadFile(finalFile, {
        name: 'Social Profile Image',
        description: 'Social profile image for Rabita platform',
        autoToast: false
      });
      
      if (result.gatewayUrl) {
        setGatewayUrl(result.gatewayUrl);
      }
      
      toast.success('Image uploaded successfully', { id: toastId, duration: 3000 });
    } catch (err) {
      console.error('Error uploading social profile image:', err);
      toast.error('Failed to upload social profile image', { id: toastId, duration: 3000 });
    }
  };

  const handleUpload = async () => {
    setIsUploaded(false);
    resetUpload();
    
    if (usingSocialImage && socialImageUrl) {
      await uploadProfileImage();
    } else if (selectedFile) {
      try {
        const result = await uploadFile(selectedFile, {
          name: 'Profile Image',
          description: 'User profile image for Rabita platform'
        });
        
        if (result.gatewayUrl) {
          setGatewayUrl(result.gatewayUrl);
        }  
      } catch (error) {
        console.error('Error in upload handler:', error);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setIpfsHash(null);
    setGatewayUrl(null);
    resetUpload();
    onIpfsHashChange('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetToSocialImage = () => {
    if (!socialImageUrl) return;
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(socialImageUrl)}`;
    
    setSelectedFile(null);
    setPreview(proxiedUrl);
    setUsingSocialImage(true);
    setIpfsHash(null);
    setGatewayUrl(null);
    resetUpload();
    onIpfsHashChange('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openGatewayUrl = () => {
    if (gatewayUrl) {
      window.open("/api/secure-image?data=" + gatewayUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-primary">Profile Image</h3>
        {socialImageUrl && !usingSocialImage && !isUploaded && (
          <button
            type="button"
            onClick={resetToSocialImage}
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
            Upload to Web3
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