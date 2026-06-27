import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { MapPin, Globe, Hash, Briefcase, Star, Users, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { PlannerProfile, Profile } from '../../types';

type PublicProfileData = PlannerProfile & { profiles: Pick<Profile, 'city'> | null };

export const PublicPlannerProfile = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('planner_profiles')
          .select(`
            *,
            profiles(city)
          `)
          .eq('profile_id', profileId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Profile not found or access denied.');

        // Normalize relational data if returned as array
        const normalized = {
          ...data,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
        };
        
        setProfileData(normalized as PublicProfileData);
      } catch (err: any) {
        console.error(err);
        setError('Profile not found or access denied. You must have an accepted proposal with this planner to view their profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  if (loading) return <LoadingState message="Loading Planner Profile..." />;
  if (error || !profileData) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8 space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <ErrorState message={error || 'Profile not found'} />
      </div>
    );
  }

  const portfolioImages = [
    profileData.portfolio_image_1,
    profileData.portfolio_image_2,
    profileData.portfolio_image_3,
    profileData.portfolio_image_4
  ].filter(Boolean) as string[];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-secondary/10" />
        
        <div className="relative flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {profileData.logo_url ? (
              <img src={profileData.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="w-12 h-12 text-gray-300" />
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-poppins mb-2">
                {profileData.business_name || 'Event Management Team'}
              </h1>
              {profileData.profiles?.city && (
                <div className="flex items-center text-gray-500 font-inter">
                  <MapPin className="w-4 h-4 mr-1" />
                  {profileData.profiles.city}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {profileData.instagram_url && (
                <a 
                  href={profileData.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <Hash className="w-4 h-4 mr-1" /> Instagram
                </a>
              )}
              {profileData.website_url && (
                <a 
                  href={profileData.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <Globe className="w-4 h-4 mr-1" /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 font-poppins mb-4">About Us</h2>
            <p className="text-gray-600 font-inter whitespace-pre-wrap leading-relaxed">
              {profileData.short_bio || 'No description provided.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 font-poppins mb-6">Portfolio</h2>
            {portfolioImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {portfolioImages.map((url, i) => (
                  <div key={i} className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group">
                    <img 
                      src={url} 
                      alt={`Portfolio ${i + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 font-inter bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No portfolio images available.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 font-poppins">Business Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-900 font-inter">Experience</div>
                  <div className="text-sm text-gray-600 font-inter">{profileData.years_experience || 'Not specified'}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-900 font-inter">Team Size</div>
                  <div className="text-sm text-gray-600 font-inter">{profileData.team_size || 'Not specified'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 font-poppins mb-4">Services</h2>
            <div className="flex flex-wrap gap-2">
              {profileData.services && profileData.services.length > 0 ? (
                profileData.services.map(service => (
                  <span 
                    key={service}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium font-inter rounded-lg border border-gray-100"
                  >
                    {service}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm font-inter">No services listed</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
