import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';

export const Login = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && !loading) {
      if (!profile) {
        navigate('/select-role', { replace: true });
      } else if (!profile.onboarding_completed) {
        navigate(`/onboarding/${profile.role}`, { replace: true });
      } else {
        const destination = location.state?.from?.pathname || `/${profile.role}/dashboard`;
        navigate(destination, { replace: true });
      }
    }
  }, [user, profile, loading, navigate, location]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface p-8 rounded-[24px] shadow-sm text-center">
        <h1 className="text-4xl font-poppins font-bold text-primary mb-2">Celebrate</h1>
        <p className="text-text/70 font-inter mb-10">Your perfect event, perfectly planned.</p>
        
        <Button 
          fullWidth 
          size="lg" 
          onClick={handleGoogleLogin}
          className="gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.72 17.58V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.58C14.73 18.24 13.47 18.64 12 18.64C9.15 18.64 6.74 16.72 5.86 14.13H2.17V16.99C3.98 20.59 7.68 23 12 23Z" fill="#34A853"/>
            <path d="M5.86 14.13C5.63 13.47 5.5 12.75 5.5 12C5.5 11.25 5.63 10.53 5.86 9.87V7.01H2.17C1.43 8.49 1 10.18 1 12C1 13.82 1.43 15.51 2.17 16.99L5.86 14.13Z" fill="#FBBC05"/>
            <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.03L19.37 3.86C17.46 2.07 14.97 1 12 1C7.68 1 3.98 3.41 2.17 7.01L5.86 9.87C6.74 7.28 9.15 5.38 12 5.38Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>
      </div>
    </div>
  );
};
