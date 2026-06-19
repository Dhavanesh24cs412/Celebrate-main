import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Camera, Check, Upload, Image as ImageIcon, X } from 'lucide-react';

const SERVICES = [
  'Food & Catering', 'DJ', 'VJ', 'Music Party', 'Event Hosts',
  'Events Desk', 'Decor', 'Venues', 'Photography', 'Videography',
  'Sound Systems', 'Lightings', 'Invitations & Gifting',
  'Bride Styling', 'Groom Styling', 'Rituals', 'Other Entertainments'
];

const EXPERIENCE_OPTIONS = ['1-3', '3-5', '5-10', '10+'];
const TEAM_SIZE_OPTIONS = ['1-5', '5-20', '20-50', '50+'];

export const PlannerOnboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  
  const storageKey = 'celebrate_planner_onboarding';
  
  const getInitialState = () => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  };

  const initialState = getInitialState();

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState(initialState?.formData || {
    business_name: '',
    phone: '',
    location: '',
    instagram_url: '',
    website_url: '',
    short_bio: '',
    years_experience: '',
    team_size: '',
  });

  const [selectedServices, setSelectedServices] = useState<string[]>(initialState?.selectedServices || []);
  
  const [logoPreview, setLogoPreview] = useState<string>(initialState?.logoPreview || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>(initialState?.portfolioPreviews || ['', '', '', '']);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState<boolean[]>([false, false, false, false]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({
      formData,
      selectedServices,
      logoPreview,
      portfolioPreviews
    }));
  }, [formData, selectedServices, logoPreview, portfolioPreviews]);

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
        if (logoPreview && logoPreview.includes(user.id)) {
           const urlObj = new URL(logoPreview);
           const pathParts = urlObj.pathname.split('/planner-logos/');
           if (pathParts.length > 1) {
             await supabase.storage.from('planner-logos').remove([pathParts[1]]);
           }
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error } = await supabase.storage.from('planner-logos').upload(filePath, file, { upsert: true });
        if (error) throw error;

        const { data } = supabase.storage.from('planner-logos').getPublicUrl(filePath);
        setLogoPreview(data.publicUrl);
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
        if (oldPreview && oldPreview.includes(user.id)) {
           const urlObj = new URL(oldPreview);
           const pathParts = urlObj.pathname.split('/planner-portfolios/');
           if (pathParts.length > 1) {
             await supabase.storage.from('planner-portfolios').remove([pathParts[1]]);
           }
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `portfolio-${index}-${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error } = await supabase.storage.from('planner-portfolios').upload(filePath, file, { upsert: true });
        if (error) throw error;

        const { data } = supabase.storage.from('planner-portfolios').getPublicUrl(filePath);
        setPortfolioPreviews(prev => { const n = [...prev]; n[index] = data.publicUrl; return n; });
      } catch (err: any) {
        setErrors(prev => ({ ...prev, portfolio: 'Failed to upload image' }));
      } finally {
        setIsUploadingPortfolio(prev => { const n = [...prev]; n[index] = false; return n; });
      }
    }
  };

  const removePortfolioImage = async (index: number) => {
    const oldPreview = portfolioPreviews[index];
    if (oldPreview && user && oldPreview.includes(user.id)) {
       try {
         const urlObj = new URL(oldPreview);
         const pathParts = urlObj.pathname.split('/planner-portfolios/');
         if (pathParts.length > 1) {
           await supabase.storage.from('planner-portfolios').remove([pathParts[1]]);
         }
       } catch (e) { console.error("Error cleaning up storage", e); }
    }

    setPortfolioPreviews(prev => { const n = [...prev]; n[index] = ''; return n; });
  };

  const toggleService = (type: string) => {
    setSelectedServices(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    if (errors.services) setErrors(prev => ({ ...prev, services: '' }));
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.business_name.trim()) newErrors.business_name = 'Business Name is required';
    if (!logoPreview) newErrors.logo = 'Business Logo is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone Number is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    if (!formData.instagram_url.trim()) {
      newErrors.instagram_url = 'Instagram URL is required';
    } else if (!isValidUrl(formData.instagram_url)) {
      newErrors.instagram_url = 'Please enter a valid URL (e.g., https://instagram.com/...)';
    }

    if (formData.website_url.trim() && !isValidUrl(formData.website_url)) {
      newErrors.website_url = 'Please enter a valid URL';
    }

    if (selectedServices.length === 0) newErrors.services = 'Select at least one service';
    if (!formData.short_bio.trim()) newErrors.short_bio = 'Short Bio is required';
    if (!formData.years_experience) newErrors.years_experience = 'Years of Experience is required';
    if (!formData.team_size) newErrors.team_size = 'Team Size is required';

    const uploadedPortfolioCount = portfolioPreviews.filter(url => url !== '').length;
    if (uploadedPortfolioCount !== 4) {
      newErrors.portfolio = 'Exactly 4 portfolio images are required';
    }
    
    setErrors(newErrors);
    
    // Smooth scroll to top if errors exist to show global error
    if (Object.keys(newErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    
    if (!validate()) return;
    if (isUploadingLogo || isUploadingPortfolio.some(isUp => isUp)) return;

    setLoading(true);
    setGlobalError(null);

    try {
      // Update Profiles Table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          city: formData.location,
          onboarding_completed: true,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Update Planner Profiles Table
      const { error: ppError } = await supabase
        .from('planner_profiles')
        .update({
          business_name: formData.business_name,
          logo_url: logoPreview,
          instagram_url: formData.instagram_url,
          website_url: formData.website_url || null,
          short_bio: formData.short_bio,
          years_experience: formData.years_experience,
          team_size: formData.team_size,
          services: selectedServices,
          portfolio_image_1: portfolioPreviews[0],
          portfolio_image_2: portfolioPreviews[1],
          portfolio_image_3: portfolioPreviews[2],
          portfolio_image_4: portfolioPreviews[3],
        })
        .eq('profile_id', profile.id);

      if (ppError) throw ppError;

      sessionStorage.removeItem(storageKey);

      await refreshProfile();
      navigate('/planner/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || 'An error occurred during onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col items-center">
      <div className="w-full max-w-2xl bg-surface min-h-screen md:min-h-0 md:my-8 md:rounded-[24px] shadow-sm border border-gray-100 flex flex-col relative pb-28 md:pb-12">
        
        <div className="p-8 pb-4">
          <h1 className="text-3xl font-poppins font-bold text-primary">Setup Planner Profile</h1>
          <p className="text-text/70 mt-2 font-inter text-base">Showcase your business and attract the right clients.</p>
        </div>

        {globalError && (
          <div className="mx-8 mt-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-inter border border-red-100">
            {globalError}
          </div>
        )}

        {Object.keys(errors).length > 0 && !globalError && (
          <div className="mx-8 mt-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-inter border border-red-100">
            Please fix the errors in the form below.
          </div>
        )}

        <form id="planner-onboarding-form" onSubmit={handleSubmit} className="p-8 flex-1 flex flex-col gap-8">
          
          {/* Logo Upload */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-text font-inter">Business Logo</label>
            <div className="flex items-center gap-4">
              <div 
                className={`w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed ${errors.logo ? 'border-red-400' : 'border-gray-300'} flex items-center justify-center overflow-hidden relative ${isUploadingLogo ? 'cursor-not-allowed opacity-70' : 'cursor-pointer group shrink-0'}`}
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
                      <Camera className="text-white w-6 h-6" />
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <Camera className="w-6 h-6 mb-1" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-inter text-gray-500 mb-2">Upload your high-resolution business logo. PNG or JPG, max 5MB.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo}>
                  <Upload className="w-4 h-4 mr-2" /> Choose Logo
                </Button>
              </div>
              <input 
                type="file" 
                ref={logoInputRef}
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden" 
                disabled={isUploadingLogo}
              />
            </div>
            {errors.logo && <span className="text-red-500 text-sm font-inter">{errors.logo}</span>}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input 
              label="Business Name" 
              placeholder="Stellar Events"
              value={formData.business_name}
              onChange={(e) => setFormData({...formData, business_name: e.target.value})}
              error={errors.business_name}
            />
            <Input 
              label="Phone Number" 
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              error={errors.phone}
            />
            <Input 
              label="Location (City)" 
              placeholder="Mumbai, Maharashtra"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              error={errors.location}
            />
            <Input 
              label="Instagram URL" 
              placeholder="https://instagram.com/stellarevents"
              value={formData.instagram_url}
              onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
              error={errors.instagram_url}
            />
          </div>
          
          <Input 
            label="Website URL (Optional)" 
            placeholder="https://stellarevents.com"
            value={formData.website_url}
            onChange={(e) => setFormData({...formData, website_url: e.target.value})}
            error={errors.website_url}
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text font-inter">Short Bio</label>
            <textarea
              className={`w-full bg-white border ${errors.short_bio ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-primary focus:ring-primary/20'} rounded-[12px] px-4 py-3 text-base font-inter text-text placeholder-gray-400 outline-none transition-all duration-200 focus:ring-4 min-h-[100px] resize-y`}
              placeholder="Tell clients what makes your business unique..."
              value={formData.short_bio}
              onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
            />
            {errors.short_bio && <span className="text-sm text-red-500 font-inter">{errors.short_bio}</span>}
          </div>

          {/* Services */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text font-inter">Services Provided</label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(service => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-3 py-1.5 rounded-full text-sm font-inter transition-all flex items-center gap-1.5 border ${
                    selectedServices.includes(service) 
                    ? 'bg-primary text-white border-primary shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                  }`}
                >
                  {selectedServices.includes(service) && <Check className="w-3.5 h-3.5" />}
                  {service}
                </button>
              ))}
            </div>
            {errors.services && <span className="text-red-500 text-sm font-inter mt-1">{errors.services}</span>}
          </div>

          {/* Dropdowns logic translated to custom buttons */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text font-inter">Years of Experience</label>
              <div className="grid grid-cols-2 gap-2">
                {EXPERIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setFormData({...formData, years_experience: opt});
                      if(errors.years_experience) setErrors(prev => ({...prev, years_experience: ''}));
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-inter transition-all text-center border ${
                      formData.years_experience === opt
                      ? 'bg-primary/5 border-primary text-primary font-semibold'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {errors.years_experience && <span className="text-red-500 text-sm font-inter mt-1">{errors.years_experience}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text font-inter">Team Size</label>
              <div className="grid grid-cols-2 gap-2">
                {TEAM_SIZE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setFormData({...formData, team_size: opt});
                      if(errors.team_size) setErrors(prev => ({...prev, team_size: ''}));
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-inter transition-all text-center border ${
                      formData.team_size === opt
                      ? 'bg-primary/5 border-primary text-primary font-semibold'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {errors.team_size && <span className="text-red-500 text-sm font-inter mt-1">{errors.team_size}</span>}
            </div>
          </div>

          {/* Portfolio Images */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-text font-inter block">Portfolio Images</label>
              <p className="text-xs text-gray-500 font-inter mt-1">Upload exactly 4 high-quality images showcasing your best work.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="relative aspect-square">
                  <div 
                    className={`w-full h-full rounded-2xl bg-gray-50 border-2 border-dashed ${errors.portfolio && !portfolioPreviews[index] ? 'border-red-400' : 'border-gray-300'} flex flex-col items-center justify-center overflow-hidden relative ${isUploadingPortfolio[index] ? 'cursor-not-allowed opacity-70' : 'cursor-pointer group hover:border-primary/50'} transition-colors`}
                    onClick={() => {
                      if (!portfolioPreviews[index] && !isUploadingPortfolio[index]) {
                        const el = document.getElementById(`portfolio-upload-${index}`);
                        el?.click();
                      }
                    }}
                  >
                    {isUploadingPortfolio[index] ? (
                      <div className="text-gray-400 flex flex-col items-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1" />
                      </div>
                    ) : portfolioPreviews[index] ? (
                      <>
                        <img src={portfolioPreviews[index]} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePortfolioImage(index); }}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center gap-1 group-hover:text-primary transition-colors">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-[10px] font-medium font-inter uppercase tracking-wider">Image {index + 1}</span>
                      </div>
                    )}
                  </div>
                  <input 
                    id={`portfolio-upload-${index}`}
                    type="file" 
                    onChange={(e) => handlePortfolioChange(e, index)}
                    accept="image/*"
                    className="hidden" 
                    disabled={isUploadingPortfolio[index]}
                  />
                </div>
              ))}
            </div>
            {errors.portfolio && <span className="text-red-500 text-sm font-inter">{errors.portfolio}</span>}
          </div>

        </form>

        {/* Sticky Bottom CTA */}
        <div className="fixed md:absolute bottom-0 left-0 right-0 p-6 bg-surface border-t border-gray-100 z-10 md:rounded-b-[24px]">
          <Button 
            type="submit" 
            form="planner-onboarding-form" 
            fullWidth 
            size="lg" 
            disabled={loading || isUploadingLogo || isUploadingPortfolio.some(isUp => isUp)}
          >
            {loading ? 'Creating Portfolio...' : 'Publish Profile'}
          </Button>
        </div>

      </div>
    </div>
  );
};
