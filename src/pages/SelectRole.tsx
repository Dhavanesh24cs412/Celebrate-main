import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { User as UserIcon, Briefcase } from 'lucide-react';
import { UserRole } from '../types';

export const SelectRole = () => {
  const { user, profile, profileStatus, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileStatus === 'ready' && profile) {
      navigate(`/onboarding/${profile.role}`, { replace: true });
    }
  }, [profileStatus, profile, navigate]);

  const handleRoleSelection = async (role: UserRole) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data: profileData, error: profileError } = await supabase.from('profiles').insert({
        user_id: user.id,
        role: role,
        onboarding_completed: false,
        full_name: user.user_metadata.full_name || '',
        avatar_url: user.user_metadata.avatar_url || ''
      }).select().single();

      if (profileError) throw profileError;

      if (role === 'client') {
        const { error: cpError } = await supabase.from('client_profiles').insert({ profile_id: profileData.id });
        if (cpError) throw cpError;
      } else {
        const { error: ppError } = await supabase.from('planner_profiles').insert({ profile_id: profileData.id });
        if (ppError) throw ppError;
      }
      
      await refreshProfile();
      navigate(`/onboarding/${role}`, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-poppins font-bold text-center text-primary mb-2">Welcome to Celebrate</h1>
        <p className="text-center text-text/70 mb-10 font-inter">How would you like to use the platform?</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 flex flex-col items-center text-center cursor-pointer hover:border-primary/50 transition-all group" onClick={() => handleRoleSelection('client')}>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserIcon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-poppins font-semibold mb-2">I am a Client</h2>
            <p className="text-text/70 mb-8 font-inter text-sm">I want to find the best planners and organize my perfect event.</p>
            <Button variant="outline" className="w-full mt-auto" disabled={loading}>
              {loading ? 'Setting up...' : 'Join as Client'}
            </Button>
          </Card>

          <Card className="p-8 flex flex-col items-center text-center cursor-pointer hover:border-secondary/50 transition-all group" onClick={() => handleRoleSelection('planner')}>
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-poppins font-semibold mb-2">I am an Event Planner</h2>
            <p className="text-text/70 mb-8 font-inter text-sm">I want to showcase my services and connect with clients.</p>
            <Button className="w-full mt-auto" disabled={loading}>
              {loading ? 'Setting up...' : 'Join as Planner'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
