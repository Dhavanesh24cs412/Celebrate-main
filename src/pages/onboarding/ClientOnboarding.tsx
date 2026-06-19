import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Camera, Check } from 'lucide-react';

const EVENT_TYPES = [
  'Wedding',
  'Reception',
  'Birthday',
  'Anniversary',
  'Corporate Event'
];

// Removed BUDGET_RANGES since we use numeric fields now

export const ClientOnboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const storageKey = 'celebrate_client_onboarding';

  const getInitialState = () => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  };

  const initialState = getInitialState();

  const [formData, setFormData] = useState(initialState?.formData || {
    full_name: profile?.full_name || user?.user_metadata?.full_name || '',
    phone: '',
    city: '',
    min_budget_lakhs: '' as number | string,
    max_budget_lakhs: '' as number | string,
  });

  const [selectedEvents, setSelectedEvents] = useState<string[]>(initialState?.selectedEvents || []);
  const [avatarPreview, setAvatarPreview] = useState<string>(initialState?.avatarPreview || profile?.avatar_url || user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({ formData, selectedEvents, avatarPreview }));
  }, [formData, selectedEvents, avatarPreview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: 'File size must be under 5MB' }));
        return;
      }
      setErrors(prev => ({ ...prev, avatar: '' }));
      
      if (!user) return;
      
      setIsUploading(true);
      try {
        // Cleanup old temp file if it exists and belongs to this user
        if (avatarPreview && avatarPreview.includes(user.id)) {
           const urlObj = new URL(avatarPreview);
           const pathParts = urlObj.pathname.split('/avatars/');
           if (pathParts.length > 1) {
             await supabase.storage.from('avatars').remove([pathParts[1]]);
           }
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-avatar-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setAvatarPreview(data.publicUrl);
      } catch (err: any) {
        setErrors(prev => ({ ...prev, avatar: 'Failed to upload image' }));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const toggleEventType = (type: string) => {
    setSelectedEvents(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    if (errors.events) {
      setErrors(prev => ({ ...prev, events: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full Name is required';
    if (!avatarPreview) newErrors.avatar = 'Profile Photo is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone Number is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (selectedEvents.length === 0) newErrors.events = 'Select at least one event type';
    if (formData.min_budget_lakhs === '' && formData.max_budget_lakhs === '') {
      newErrors.budget = 'Please enter a budget range';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    
    if (!validate()) return;

    setLoading(true);
    setGlobalError(null);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          city: formData.city,
          avatar_url: avatarPreview,
          onboarding_completed: true,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      const { error: cpError } = await supabase
        .from('client_profiles')
        .update({
          preferred_event_types: selectedEvents,
          min_budget_lakhs: formData.min_budget_lakhs === '' ? null : formData.min_budget_lakhs,
          max_budget_lakhs: formData.max_budget_lakhs === '' ? null : formData.max_budget_lakhs
        })
        .eq('profile_id', profile.id);

      if (cpError) throw cpError;

      sessionStorage.removeItem(storageKey);

      await refreshProfile();
      navigate('/client/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || 'An error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col items-center">
      <div className="w-full max-w-lg bg-surface min-h-screen md:min-h-0 md:my-8 md:rounded-[24px] shadow-sm border border-gray-100 flex flex-col relative pb-24 md:pb-8">
        
        <div className="p-6 pb-2">
          <h1 className="text-3xl font-poppins font-bold text-primary">Let's set up your profile</h1>
          <p className="text-text/70 mt-2 font-inter text-base">We need a few details to match you with the best planners.</p>
        </div>

        {globalError && (
          <div className="mx-6 mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-inter border border-red-100">
            {globalError}
          </div>
        )}

        <form id="onboarding-form" onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col gap-6">
          
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div 
              className={`w-28 h-28 rounded-full bg-gray-50 border-2 border-dashed ${errors.avatar ? 'border-red-400' : 'border-gray-300'} flex items-center justify-center overflow-hidden relative ${isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer group'}`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="text-gray-400 flex flex-col items-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1" />
                  <span className="text-xs font-inter font-medium">Uploading...</span>
                </div>
              ) : avatarPreview ? (
                <>
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </>
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-xs font-inter font-medium">Upload</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden" 
              disabled={isUploading}
            />
            {errors.avatar && <span className="text-red-500 text-sm font-inter">{errors.avatar}</span>}
          </div>

          <Input 
            label="Full Name" 
            placeholder="John Doe"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            error={errors.full_name}
          />
          
          <Input 
            label="Phone Number" 
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            error={errors.phone}
          />
          
          <Input 
            label="City" 
            placeholder="Mumbai, Maharashtra"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            error={errors.city}
          />

          {/* Event Types */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text font-inter">Preferred Event Types</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleEventType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-inter transition-all flex items-center gap-1 ${
                    selectedEvents.includes(type) 
                    ? 'bg-primary text-white border-primary shadow-sm' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/50'
                  }`}
                >
                  {selectedEvents.includes(type) && <Check className="w-4 h-4" />}
                  {type}
                </button>
              ))}
            </div>
            {errors.events && <span className="text-red-500 text-sm font-inter mt-1">{errors.events}</span>}
          </div>

          {/* Budget Range */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text font-inter">Preferred Average Budget Range (in Lakhs)</label>
            <div className="flex items-center gap-4">
              <Input 
                type="number"
                placeholder="Min (e.g. 1)" 
                value={formData.min_budget_lakhs} 
                onChange={e => {
                  setFormData({...formData, min_budget_lakhs: e.target.value === '' ? '' : Number(e.target.value)});
                  if(errors.budget) setErrors(prev => ({...prev, budget: ''}));
                }} 
              />
              <span className="text-gray-400 font-inter">to</span>
              <Input 
                type="number"
                placeholder="Max (e.g. 5)" 
                value={formData.max_budget_lakhs} 
                onChange={e => {
                  setFormData({...formData, max_budget_lakhs: e.target.value === '' ? '' : Number(e.target.value)});
                  if(errors.budget) setErrors(prev => ({...prev, budget: ''}));
                }} 
              />
            </div>
            {errors.budget && <span className="text-red-500 text-sm font-inter mt-1">{errors.budget}</span>}
          </div>

        </form>

        {/* Sticky Bottom CTA */}
        <div className="fixed md:absolute bottom-0 left-0 right-0 p-4 bg-surface border-t border-gray-100 z-10 md:rounded-b-[24px]">
          <Button 
            type="submit" 
            form="onboarding-form" 
            fullWidth 
            size="lg" 
            disabled={loading}
          >
            {loading ? 'Saving Profile...' : 'Complete Profile'}
          </Button>
        </div>

      </div>
    </div>
  );
};
