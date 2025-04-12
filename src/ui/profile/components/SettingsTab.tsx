import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'react-hot-toast';
import { KOLProfile } from '@/types/profile';
import SecureImage from '@/components/SecureImage';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Check, X, Edit2, Loader2, Calendar, Clock, Save } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/Label';

interface SettingsTabProps {
  profile: KOLProfile;
}

// Day availability type
interface DayAvailability {
  isActive: boolean;
}

export function SettingsTab({ profile }: SettingsTabProps) {
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [feeValue, setFeeValue] = useState('');
  const [isValidFee, setIsValidFee] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateFeeCallback, updateActiveTimeCallback, updateActiveDaysCallback, isLoading, isError, error, transactionReceipt } = useUpdateProfile();
  const queryClient = useQueryClient();

  // Convert seconds in UTC to local time HH:MM string
  const convertFromUTC = (seconds: number) => {
    if (seconds === undefined || seconds === null) return "00:00";
    
    // Create a date at UTC midnight
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0); 
    // Add the seconds to get the UTC time
    date.setUTCSeconds(seconds);
    
    // Format to local time HH:MM
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  }

  // Convert local time HH:MM string to seconds in UTC
  const convertToUTC = (time: string) => {
    if (!time) return 0;
    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error('Invalid time format:', time);
      return 0;
    }
    
    // Create a date with the local time
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Convert to UTC seconds since midnight
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    
    return (utcHours * 3600) + (utcMinutes * 60);
  }
  
  // Availability schedule state
  const [isEditingTimeSlot, setIsEditingTimeSlot] = useState(false);
  const [isEditingDays, setIsEditingDays] = useState(false);
  const [globalStartTime, setGlobalStartTime] = useState(convertFromUTC(profile.globalStartTime || 0));
  const [globalEndTime, setGlobalEndTime] = useState(convertFromUTC(profile.globalEndTime || 0));
  const [availabilitySchedule, setAvailabilitySchedule] = useState<Record<string, DayAvailability>>({
    monday: { isActive: profile.activeDays?.[0] || false },
    tuesday: { isActive: profile.activeDays?.[1] || false },
    wednesday: { isActive: profile.activeDays?.[2] || false },
    thursday: { isActive: profile.activeDays?.[3] || false },
    friday: { isActive: profile.activeDays?.[4] || false },
    saturday: { isActive: profile.activeDays?.[5] || false },
    sunday: { isActive: profile.activeDays?.[6] || false },
  });
  
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

  // Handle day toggle
  const handleDayToggle = (day: string, isActive: boolean) => {
    setAvailabilitySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isActive
      }
    }));
  };

  // Handle global time change
  const handleGlobalTimeChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setGlobalStartTime(value);
    } else {
      setGlobalEndTime(value);
    }
  };

  // Save availability time slot
  const handleSaveTimeSlot = useCallback(async () => {
    try {
      const startTimeSeconds = convertToUTC(globalStartTime);
      const endTimeSeconds = convertToUTC(globalEndTime);
      
      // Here you would call your API with the seconds values
      // Example: await updateTimeSlot(profile.wallet, startTimeSeconds, endTimeSeconds);
      
      // For now, just log the values that would be sent
      console.debug('Saving time slots in UTC seconds:', {
        startTimeSeconds,
        endTimeSeconds,
        wallet: profile.wallet,
        startTimeLocal: globalStartTime,
        endTimeLocal: globalEndTime
      });
      await updateActiveTimeCallback(startTimeSeconds, endTimeSeconds);
      // toast.success('Availability hours updated successfully!');
      // setIsEditingTimeSlot(false);
    } catch (error) {
      console.error('Failed to update time slots:', error);
      toast.error('Failed to update availability hours');
    }
  }, [profile.wallet, globalStartTime, globalEndTime]);

  // Save availability days
  const handleSaveDays = useCallback(async () => {
    try {
      // Convert the availability schedule to an array of booleans
      const activeDays = [
        availabilitySchedule.monday.isActive,
        availabilitySchedule.tuesday.isActive,
        availabilitySchedule.wednesday.isActive,
        availabilitySchedule.thursday.isActive,
        availabilitySchedule.friday.isActive,
        availabilitySchedule.saturday.isActive,
        availabilitySchedule.sunday.isActive,
      ];
      
      // Here you would call your API with the active days
      // Example: await updateActiveDays(profile.wallet, activeDays);
      
      // For now, just log the values that would be sent
      console.debug('Saving active days:', {
        activeDays,
        wallet: profile.wallet
      });

      const mapDays = Array.from({length: 7}, (_, i) => i);
      const mapActive = mapDays.map(day => activeDays[day]);
      await updateActiveDaysCallback(mapDays, mapActive);
      
      // toast.success('Active days updated successfully!');
      // setIsEditingDays(false);
    } catch (error) {
      console.error('Failed to update active days:', error);
      toast.error('Failed to update active days');
    }
  }, [availabilitySchedule, profile.wallet]);

  useEffect(() => {
    if (transactionReceipt) {
      toast.success('Updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['kolProfile', profile.wallet] });
      setIsEditingFee(false);
      setIsEditingTimeSlot(false);
      setIsEditingDays(false);
    }
  }, [transactionReceipt, profile.wallet, queryClient]);

  // Format day name
  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

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
                    disabled={!isValidFee || !feeValue || isLoading || isEditingTimeSlot || isEditingDays}
                  >
                    {isLoading ? <Loader2 className='animate-spin' size={16} /> : <Check size={16} />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    disabled={isLoading || isEditingTimeSlot || isEditingDays}
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
                    disabled={isLoading || isEditingTimeSlot || isEditingDays}
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

          <div className="border-t border-gray-200 my-6 pt-6">
            <h4 className="font-medium mb-5 text-primary/80">Availability Schedule</h4>
            
            {/* Global time slot */}
            <div className="mb-5 p-4 border rounded-lg bg-background/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Clock size={16} className="mr-2 text-primary/60" />
                  <h5 className="font-medium text-primary/80">Active Hours</h5>
                </div>
                
                {!isEditingTimeSlot ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isLoading || isEditingFee || isEditingDays}
                    className='bg-dark text-primary hover:bg-white hover:text-black transition-colors duration-200 gap-2 flex items-center'
                    onClick={() => setIsEditingTimeSlot(true)}
                  >
                    <Edit2 size={14} />
                    Edit Hours
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                    className='bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 gap-2 flex items-center'
                    onClick={handleSaveTimeSlot}
                  >
                    <Save size={14} />
                    {isLoading ? <Loader2 className='animate-spin' size={16} /> : 'Save Hours'}
                  </Button>
                )}
              </div>
              
              <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 pl-8 ${isEditingTimeSlot ? 'mt-4' : ''}`}>
                {isEditingTimeSlot ? (
                  <>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto items-start sm:items-center gap-3">
                      <div className="w-full sm:w-auto">
                        <Label htmlFor="start-time" className="text-xs text-primary/60 mb-1 block sm:hidden">
                          Start Time
                        </Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={globalStartTime}
                          onChange={(e) => handleGlobalTimeChange('start', e.target.value)}
                          disabled={!isEditingTimeSlot}
                          className="w-full sm:w-28 text-primary/80"
                        />
                      </div>
                      
                      <span className="text-primary/60 hidden sm:block">to</span>
                      
                      <div className="w-full sm:w-auto">
                        <Label htmlFor="end-time" className="text-xs text-primary/60 mb-1 block sm:hidden">
                          End Time
                        </Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={globalEndTime}
                          onChange={(e) => handleGlobalTimeChange('end', e.target.value)}
                          disabled={!isEditingTimeSlot}
                          className="w-full sm:w-28 text-primary/80"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-primary/80 font-mono">
                    {globalStartTime} - {globalEndTime}
                  </span>
                )}
              </div>
              <p className="text-xs text-primary/40 mt-2 pl-8">
                These hours will apply to all active days
              </p>
            </div>
            
            {/* Days selection */}
            <div className="mb-3 flex items-center justify-between">
              <h5 className="font-medium text-primary/80">Active Days</h5>
              
              {!isEditingDays ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading || isEditingFee || isEditingTimeSlot}
                  className='bg-dark text-primary hover:bg-white hover:text-black transition-colors duration-200 gap-2 flex items-center'
                  onClick={() => setIsEditingDays(true)}
                >
                  <Calendar size={14} />
                  Edit Days
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading}
                  className='bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 gap-2 flex items-center'
                  onClick={handleSaveDays}
                >
                  <Save size={14} />
                  {isLoading ? <Loader2 className='animate-spin' size={16} /> : 'Save Days'}
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(availabilitySchedule).map(([day, { isActive }]) => (
                <div key={day} className="p-3 border rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => handleDayToggle(day, checked)}
                      disabled={!isEditingDays}
                    />
                    <Label className="font-medium text-primary/80">
                      {formatDayName(day)}
                    </Label>
                    
                    {isActive && (
                      <div className="ml-auto text-xs text-primary/60">
                        {globalStartTime} - {globalEndTime}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-3 text-primary/40">
              Set your weekly availability to help users know when you're typically active
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 