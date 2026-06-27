import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState } from '../../components/ui/LoadingState';

export const AuthCallback = () => {
  const { user, profile, profileStatus, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // 1. Block execution while AuthContext resolves
    if (loading || profileStatus === 'loading') return;

    // 2. Safely handle network/fetch errors gracefully
    if (profileStatus === 'error') {
      console.error("AuthCallback encountered an error loading the profile.");
      return; 
    }

    // 3. User is not authenticated
    if (profileStatus === 'anonymous') {
      navigate('/login', { replace: true });
      return;
    }

    // 4. Guaranteed New User
    if (profileStatus === 'not_found') {
      navigate('/select-role', { replace: true });
    } 
    // 5. Guaranteed Existing User (Safeguarded against open redirects)
    else if (profileStatus === 'ready' && profile) {
      if (!profile.onboarding_completed) {
        navigate(`/onboarding/${profile.role}`, { replace: true });
      } else {
        const nextRoute = searchParams.get('next');
        const destination = nextRoute && nextRoute.startsWith('/')
          ? nextRoute
          : `/${profile.role}/dashboard`;
          
        navigate(destination, { replace: true });
      }
    }
  }, [user, profile, loading, profileStatus, navigate, searchParams]);

  // If there's an error, we display a fallback UI here instead of endlessly loading
  if (profileStatus === 'error') {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Connection Error</h2>
          <p className="text-text/70 mb-4">We couldn't retrieve your profile. Please refresh to try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <LoadingState message="Completing authentication..." />;
};
