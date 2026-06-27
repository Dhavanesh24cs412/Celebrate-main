import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EVENT_TYPES } from '../onboarding/ClientOnboarding';
import { uploadProfileImage } from '../../lib/storageUtils';
import { Camera, Check, MapPin, Edit2, Wallet, Users, LayoutDashboard, Crown } from 'lucide-react';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatBudgetRange } from '../../lib/formatters';

export const ClientProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
    min_budget_lakhs: '' as number | string,
    max_budget_lakhs: '' as number | string,
  });

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchProfileData = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { data: cpData, error: cpError } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (cpError) throw cpError;

      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        min_budget_lakhs: cpData.min_budget_lakhs ?? '',
        max_budget_lakhs: cpData.max_budget_lakhs ?? ''
      });
      setSelectedEvents(cpData.preferred_event_types || []);
      setAvatarPreview(profile.avatar_url || '');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [profile]);

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
        const newUrl = await uploadProfileImage(file, 'avatars', user.id, 'avatar', avatarPreview);
        setAvatarPreview(newUrl);
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

  const handleSave = async () => {
    if (!profile || !user) return;
    if (!validate()) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          city: formData.city,
          avatar_url: avatarPreview,
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

      await refreshProfile();
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8"><LoadingState message="Loading Profile..." /></div>;
  if (error && !isEditing) return <div className="p-8"><ErrorState message={error} onRetry={fetchProfileData} /></div>;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 p-4 md:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-poppins text-[#1F2937]">My Profile</h1>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl font-inter border border-green-100 flex items-center">
          <Check className="w-5 h-5 mr-2" /> {successMessage}
        </div>
      )}
      {error && isEditing && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-inter border border-red-100">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-8 animate-in fade-in">
          
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div 
              className={`w-32 h-32 rounded-full bg-gray-50 border-2 border-dashed ${errors.avatar ? 'border-red-400' : 'border-gray-300'} flex items-center justify-center overflow-hidden relative ${isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer group'}`}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

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

          <div className="flex items-center gap-4 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => {
              setIsEditing(false);
              fetchProfileData(); // Reset to db values
            }}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">
                  {formData.full_name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-poppins font-bold text-gray-900">{formData.full_name}</h2>
              <div className="flex items-center text-gray-500 font-inter text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" /> {formData.city || 'Location not set'}
              </div>
              <div className="text-gray-500 font-inter text-sm mt-1">
                {formData.phone || 'Phone not set'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            <div>
              <div className="flex items-center text-gray-400 text-sm uppercase tracking-wider font-semibold mb-3">
                <Crown className="w-4 h-4 mr-2" /> Preferred Events
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedEvents.length > 0 ? selectedEvents.map(type => (
                  <span key={type} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium font-inter">
                    {type}
                  </span>
                )) : (
                  <span className="text-gray-400 text-sm italic">None specified</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center text-gray-400 text-sm uppercase tracking-wider font-semibold mb-3">
                <Wallet className="w-4 h-4 mr-2" /> Budget Range
              </div>
              <div className="text-gray-900 font-medium font-inter">
                {formatBudgetRange(Number(formData.min_budget_lakhs) || null, Number(formData.max_budget_lakhs) || null)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
