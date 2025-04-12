import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'react-hot-toast';
import { KOLProfile } from '@/types/profile';
import SecureImage from '@/components/SecureImage';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Check, X, Edit2, Loader2 } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useQueryClient } from '@tanstack/react-query';
interface SettingsTabProps {
  profile: KOLProfile;
}

export function SettingsTab({ profile }: SettingsTabProps) {
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [feeValue, setFeeValue] = useState('');
  const [isValidFee, setIsValidFee] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateFeeCallback, isLoading, isError, error, transactionReceipt } = useUpdateProfile();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (isEditingFee && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingFee]);

  const handleStartEditing = () => {
    const numericValue = (profile.formattedFee || '0').replace(/[^0-9.]/g, '');
    setFeeValue(numericValue);
    setIsEditingFee(true);
    setIsValidFee(true);
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFeeValue(value);
    setIsValidFee(/^([0-9]*[.])?[0-9]+$/.test(value) && parseFloat(value) > 0);
  };

  const handleCancel = () => {
    setIsEditingFee(false);
    setIsValidFee(true);
  };

  const handleSave = useCallback(async () => {
    if (!isValidFee || !feeValue) return;
    
    await updateFeeCallback(feeValue);
    // setIsEditingFee(false);
  }, [updateFeeCallback, isValidFee, feeValue]);

  useEffect(() => {
    if (transactionReceipt) {
      toast.success('Updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['kolProfile', profile.wallet] });
      setIsEditingFee(false);
    }
  }, [transactionReceipt, profile.wallet, queryClient]);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-primary/80">Profile Settings</CardTitle>
        <CardDescription className='text-primary/40'>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3 text-primary/80">Update Profile Picture</h4>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                {profile.profileIpfsHash ? (
                  <SecureImage 
                    encryptedData={profile.profileIpfsHash}
                    alt={profile.handle}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-full w-full bg-primary/20 flex items-center justify-center text-xl text-primary font-medium">
                    {profile.handle.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
              <Button 
                variant="outline" 
                size="sm"
                className='bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200'
                onClick={() => toast.success('Profile picture update feature coming soon!')}
              >
                Change Picture
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-primary/80">Update Message Fee</h4>
            <div className="flex items-center gap-4">
              {isEditingFee ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      type="text"
                      disabled={isLoading}
                      value={feeValue}
                      onChange={handleFeeChange}
                      className={`w-32 pr-8 font-mono ${!isValidFee && 'border-red-500 focus-visible:ring-red-500'} text-primary/80`}
                      placeholder="0.05"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-primary/60">
                      bnb
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-100/20"
                    onClick={handleSave}
                    disabled={!isValidFee || !feeValue || isLoading}
                  >
                    {isLoading ? <Loader2 className='animate-spin' size={16} /> : <Check size={16} />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    disabled={isLoading}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100/20"
                    onClick={handleCancel}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-background p-2 px-3 rounded border border-border">
                    <span className="font-mono font-medium text-primary/80">{profile.formattedFee}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className='bg-dark text-primary hover:bg-white hover:text-black transition-colors duration-200 gap-2 flex items-center'
                    onClick={handleStartEditing}
                  >
                    <Edit2 size={14} />
                    Edit Fee
                  </Button>
                </>
              )}
            </div>
            {!isValidFee && (
              <p className="text-xs text-red-500 mt-1">
                Please enter a valid numeric value
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 text-primary/40">
              This is the amount users will need to pay to send you a message
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 