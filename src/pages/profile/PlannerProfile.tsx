import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SERVICES, EXPERIENCE_OPTIONS, TEAM_SIZE_OPTIONS } from '../onboarding/PlannerOnboarding';
import { uploadProfileImage } from '../../lib/storageUtils';
import { Camera, Check, MapPin, Edit2, Upload, Image as ImageIcon, Globe, Hash, Briefcase, Star, X, Users } from 'lucide-react';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';

export const PlannerProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    business_name: '',
    phone: '',
    city: '',
    instagram_url: '',
    website_url: '',
    short_bio: '',
    years_experience: '',
    team_size: '',
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>(['', '', '', '']);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState<boolean[]>([false, false, false, false]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchProfileData = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { data: ppData, error: ppError } = await supabase
        .from('planner_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (ppError) throw ppError;

      setFormData({
        business_name: ppData.business_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        instagram_url: ppData.instagram_url || '',
        website_url: ppData.website_url || '',
        short_bio: ppData.short_bio || '',
        years_experience: ppData.years_experience || '',
        team_size: ppData.team_size || '',
      });
      setSelectedServices(ppData.services || []);
      setLogoPreview(ppData.logo_url || '');
      setPortfolioPreviews([
        ppData.portfolio_image_1 || '',
        ppData.portfolio_image_2 || '',
        ppData.portfolio_image_3 || '',
        ppData.portfolio_image_4 || ''
      ]);

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

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'Logo must be under 5MB' }));
        return;
      }
      setErrors(prev => ({ ...prev, logo: '' }));
      if (!user) return;

      setIsUploadingLogo(true);
      try {
        const newUrl = await uploadProfileImage(file, 'planner-logos', user.id, 'logo', logoPreview);
        setLogoPreview(newUrl);
      } catch (err: any) {
        setErrors(prev => ({ ...prev, logo: 'Failed to upload logo' }));
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handlePortfolioChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, portfolio: 'Each image must be under 5MB' }));
        return;
      }
      setErrors(prev => ({ ...prev, portfolio: '' }));
      if (!user) return;

      setIsUploadingPortfolio(prev => { const n = [...prev]; n[index] = true; return n; });
      try {
        const oldPreview = portfolioPreviews[index];
        const newUrl = await uploadProfileImage(file, 'planner-portfolios', user.id, `portfolio-${index}`, oldPreview);
        setPortfolioPreviews(prev => { const n = [...prev]; n[index] = newUrl; return n; });
      } catch (err: any) {
        setErrors(prev => ({ ...prev, portfolio: 'Failed to upload image' }));
      } finally {
        setIsUploadingPortfolio(prev => { const n = [...prev]; n[index] = false; return n; });
      }
    }
  };

  const removePortfolioImage = async (index: number) => {
    if (!user) return;
    const oldPreview = portfolioPreviews[index];
    if (oldPreview && oldPreview.includes(user.id)) {
      try {
        const urlObj = new URL(oldPreview);
        const pathParts = urlObj.pathname.split('/planner-portfolios/');
        if (pathParts.length > 1) {
          await supabase.storage.from('planner-portfolios').remove([pathParts[1]]);
        }
      } catch (e) {
        console.warn('Failed to delete image from storage:', e);
      }
    }
    setPortfolioPreviews(prev => { const n = [...prev]; n[index] = ''; return n; });
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
    if (errors.services) setErrors(prev => ({ ...prev, services: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.business_name.trim()) newErrors.business_name = 'Business Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone Number is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.short_bio.trim()) newErrors.short_bio = 'Short bio is required';
    if (!formData.years_experience) newErrors.years_experience = 'Years of experience is required';
    if (!formData.team_size) newErrors.team_size = 'Team size is required';
    if (selectedServices.length === 0) newErrors.services = 'Select at least one service';
    if (!logoPreview) newErrors.logo = 'Business Logo is required';
    
    const hasPortfolio = portfolioPreviews.some(p => p !== '');
    if (!hasPortfolio) newErrors.portfolio = 'At least one portfolio image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!profile || !user) return;
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          city: formData.city,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      const { error: ppError } = await supabase
        .from('planner_profiles')
        .update({
          business_name: formData.business_name,
          logo_url: logoPreview,
          instagram_url: formData.instagram_url,
          website_url: formData.website_url,
          short_bio: formData.short_bio,
          years_experience: formData.years_experience,
          team_size: formData.team_size,
          services: selectedServices,
          portfolio_image_1: portfolioPreviews[0] || null,
          portfolio_image_2: portfolioPreviews[1] || null,
          portfolio_image_3: portfolioPreviews[2] || null,
          portfolio_image_4: portfolioPreviews[3] || null,
        })
        .eq('profile_id', profile.id);

      if (ppError) throw ppError;

      await refreshProfile();
      setSuccessMessage('Business profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 3000);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8"><LoadingState message="Loading Profile..." /></div>;
  if (error && !isEditing) return <div className="p-8"><ErrorState message={error} onRetry={fetchProfileData} /></div>;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 p-4 md:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-poppins text-[#1F2937]">Business Profile</h1>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text font-inter">Business Logo</label>
                <div 
                  className={`w-32 h-32 rounded-[20px] bg-gray-50 border-2 border-dashed ${errors.logo ? 'border-red-400' : 'border-gray-300'} flex items-center justify-center overflow-hidden relative ${isUploadingLogo ? 'cursor-not-allowed opacity-70' : 'cursor-pointer group'}`}
                  onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                >
                  {isUploadingLogo ? (
                    <div className="text-gray-400 flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1" />
                    </div>
                  ) : logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="text-white w-6 h-6" />
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Camera className="w-8 h-8 mb-1" />
                      <span className="text-xs font-inter">Upload Logo</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" disabled={isUploadingLogo} />
                {errors.logo && <span className="text-red-500 text-sm font-inter">{errors.logo}</span>}
              </div>

              <Input label="Business Name" placeholder="e.g. Dream Weddings Co." value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} error={errors.business_name} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone Number" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} error={errors.phone} />
                <Input label="City" placeholder="Mumbai, Maharashtra" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} error={errors.city} />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <Input label="Instagram URL (Optional)" placeholder="https://instagram.com/yourbusiness" value={formData.instagram_url} onChange={(e) => setFormData({...formData, instagram_url: e.target.value})} />
              <Input label="Website URL (Optional)" placeholder="https://yourwebsite.com" value={formData.website_url} onChange={(e) => setFormData({...formData, website_url: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text font-inter">Years of Exp</label>
                  <select
                    value={formData.years_experience}
                    onChange={(e) => {
                      setFormData({...formData, years_experience: e.target.value});
                      if (errors.years_experience) setErrors(prev => ({...prev, years_experience: ''}));
                    }}
                    className={`w-full bg-surface border ${errors.years_experience ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-text font-inter focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                  >
                    <option value="" disabled>Select</option>
                    {EXPERIENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt} Years</option>)}
                  </select>
                  {errors.years_experience && <span className="text-red-500 text-xs font-inter">{errors.years_experience}</span>}
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text font-inter">Team Size</label>
                  <select
                    value={formData.team_size}
                    onChange={(e) => {
                      setFormData({...formData, team_size: e.target.value});
                      if (errors.team_size) setErrors(prev => ({...prev, team_size: ''}));
                    }}
                    className={`w-full bg-surface border ${errors.team_size ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-text font-inter focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                  >
                    <option value="" disabled>Select</option>
                    {TEAM_SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt} Members</option>)}
                  </select>
                  {errors.team_size && <span className="text-red-500 text-xs font-inter">{errors.team_size}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text font-inter">Short Bio (About Your Business)</label>
            <textarea
              value={formData.short_bio}
              onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
              placeholder="Tell clients what makes your services special..."
              className={`w-full bg-surface border ${errors.short_bio ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-text font-inter focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] resize-y`}
            />
            {errors.short_bio && <span className="text-red-500 text-sm font-inter">{errors.short_bio}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text font-inter flex justify-between items-center">
              Services Offered
              <span className="text-xs text-gray-400 font-normal">{selectedServices.length} selected</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(service => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-4 py-2 rounded-full text-sm font-inter transition-all flex items-center gap-1 ${
                    selectedServices.includes(service) 
                    ? 'bg-primary text-white border-primary shadow-sm' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/50'
                  }`}
                >
                  {selectedServices.includes(service) && <Check className="w-4 h-4" />}
                  {service}
                </button>
              ))}
            </div>
            {errors.services && <span className="text-red-500 text-sm font-inter mt-1">{errors.services}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text font-inter">Portfolio Showcase (Max 4 images)</label>
            <p className="text-xs text-gray-500 font-inter mb-2">Upload high-quality images of your best work to impress clients.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(index => (
                <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 border border-gray-200 group">
                  {portfolioPreviews[index] ? (
                    <>
                      <img src={portfolioPreviews[index]} alt={`Portfolio ${index+1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" onClick={() => removePortfolioImage(index)} className="p-2 bg-white/20 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className={`w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors ${isUploadingPortfolio[index] ? 'pointer-events-none' : ''}`}>
                      {isUploadingPortfolio[index] ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500 font-inter font-medium">Add Image</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handlePortfolioChange(e, index)}
                        disabled={isUploadingPortfolio[index]}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
            {errors.portfolio && <span className="text-red-500 text-sm font-inter mt-1">{errors.portfolio}</span>}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <Button variant="outline" className="flex-1" onClick={() => {
              setIsEditing(false);
              fetchProfileData(); // reset
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
          {/* View Mode Header */}
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Business Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-poppins font-bold text-gray-900">{formData.business_name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-gray-500 font-inter text-sm mt-2">
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {formData.city || 'Location not set'}</span>
                {formData.instagram_url && (
                  <a href={formData.instagram_url} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors">
                    <Hash className="w-4 h-4 mr-1" /> Instagram
                  </a>
                )}
                {formData.website_url && (
                  <a href={formData.website_url} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors">
                    <Globe className="w-4 h-4 mr-1" /> Website
                  </a>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600 flex items-center"><Briefcase className="w-3 h-3 mr-1"/> {formData.years_experience} Yrs Exp</span>
                <span className="text-xs font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600 flex items-center"><Users className="w-3 h-3 mr-1"/> {formData.team_size} Team Size</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-poppins font-semibold text-gray-900 mb-3">About Us</h3>
              <p className="text-gray-600 font-inter text-sm leading-relaxed whitespace-pre-wrap">{formData.short_bio}</p>
            </div>
            
            <div className="md:col-span-1">
               <h3 className="font-poppins font-semibold text-gray-900 mb-3 flex items-center"><Star className="w-4 h-4 mr-2 text-primary" /> Services</h3>
               <div className="flex flex-wrap gap-2">
                 {selectedServices.map(s => (
                   <span key={s} className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-medium rounded-full font-inter">
                     {s}
                   </span>
                 ))}
               </div>
            </div>
          </div>

          {portfolioPreviews.some(p => p !== '') && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-poppins font-semibold text-gray-900 mb-4">Portfolio</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {portfolioPreviews.filter(p => p !== '').map((img, idx) => (
                  <div key={idx} className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                    <img src={img} alt={`Portfolio ${idx+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
