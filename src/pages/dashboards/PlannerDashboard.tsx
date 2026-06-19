import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { ErrorState } from '../../components/ui/ErrorState';
import { PlannerProfile } from '../../types';
import { MapPin, Globe, Hash, CheckCircle, Inbox, Search, Star, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PlannerDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [plannerData, setPlannerData] = useState<PlannerProfile | null>(null);
  const [stats, setStats] = useState({ active: 0, accepted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlannerData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError(null);
      const { data: profileData, error: profileError } = await supabase
        .from('planner_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (profileError) throw profileError;
      setPlannerData(profileData as PlannerProfile);

      const { data: proposalsData, error: proposalsError } = await supabase
        .from('proposals')
        .select('status')
        .eq('planner_profile_id', profile.id);

      if (proposalsError) throw proposalsError;

      const activeCount = proposalsData.filter(p => p.status === 'Submitted').length;
      const acceptedCount = proposalsData.filter(p => p.status === 'Accepted').length;

      setStats({
        active: activeCount,
        accepted: acceptedCount
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load planner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannerData();
  }, [profile]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="h-48 bg-gray-100 animate-pulse rounded-[24px]"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-gray-100 animate-pulse rounded-[16px]"></div>
          <div className="h-32 bg-gray-100 animate-pulse rounded-[16px]"></div>
        </div>
        <div className="h-64 bg-gray-100 animate-pulse rounded-[24px]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <ErrorState message={error} onRetry={fetchPlannerData} />
      </div>
    );
  }

  const portfolioImages = [
    plannerData?.portfolio_image_1,
    plannerData?.portfolio_image_2,
    plannerData?.portfolio_image_3,
    plannerData?.portfolio_image_4,
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      
      {/* Business Header & Hero CTA */}
      <div className="bg-surface border border-gray-100 rounded-[24px] shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-24 h-24 rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white shrink-0">
            {plannerData?.logo_url ? (
              <img src={plannerData.logo_url} alt="Business Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                <Building2 className="w-8 h-8" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-poppins font-bold text-text">
              {plannerData?.business_name || profile?.full_name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-text/60 font-inter text-sm">
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {profile?.city}</span>
              {plannerData?.instagram_url && (
                <a href={plannerData.instagram_url} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors">
                  <Hash className="w-4 h-4 mr-1" /> Instagram
                </a>
              )}
              {plannerData?.website_url && (
                <a href={plannerData.website_url} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors">
                  <Globe className="w-4 h-4 mr-1" /> Website
                </a>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-md text-gray-600">{plannerData?.years_experience} Yrs Exp</span>
              <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-md text-gray-600">{plannerData?.team_size} Team Size</span>
            </div>
          </div>
        </div>

        <Button size="lg" onClick={() => navigate('/planner/marketplace')} className="whitespace-nowrap w-full md:w-auto shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
          <Search className="w-5 h-5 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard title="Active Submissions" value={stats.active.toString()} icon={<Inbox className="w-5 h-5" />} />
        <StatCard title="Accepted Proposals" value={stats.accepted.toString()} icon={<CheckCircle className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Services & Bio Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="p-6 border border-gray-100">
            <h3 className="font-poppins font-semibold text-text mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-accent" /> Offered Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {plannerData?.services?.map((service) => (
                <span key={service} className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-medium rounded-full font-inter">
                  {service}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6 border border-gray-100">
            <h3 className="font-poppins font-semibold text-text mb-3">About Us</h3>
            <p className="text-sm text-text/70 font-inter leading-relaxed whitespace-pre-wrap">
              {plannerData?.short_bio}
            </p>
          </Card>
        </div>

        {/* Portfolio Showcase */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-poppins font-semibold text-text">Portfolio</h3>
            <Button variant="outline" size="sm">Edit Portfolio</Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {portfolioImages.map((img, idx) => (
              <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group cursor-pointer relative">
                <img src={img} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
              </div>
            ))}
            {portfolioImages.length === 0 && (
              <div className="col-span-2 p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-gray-500 font-inter">No portfolio images uploaded.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
