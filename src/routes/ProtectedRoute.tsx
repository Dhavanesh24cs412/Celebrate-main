import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from '../components/ui/LoadingState';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requireOnboarding?: boolean;
}

export const ProtectedRoute = ({ allowedRoles, requireOnboarding = true }: ProtectedRouteProps) => {
  const { user, profile, profileStatus, loading } = useAuth();
  const location = useLocation();

  if (loading || profileStatus === 'loading') {
    return <LoadingState message="Checking authentication..." />;
  }

  if (profileStatus === 'anonymous') {
    // Save the intended route and redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profileStatus === 'error') {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Connection Error</h2>
          <p className="text-text/70 mb-4">Failed to load profile. Please refresh to try again.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Refresh Page</button>
        </div>
      </div>
    );
  }

  // If user is logged in but hasn't selected a role, force role selection unless they are already there
  if (profileStatus === 'not_found' && location.pathname !== '/select-role') {
    return <Navigate to="/select-role" replace />;
  }

  // If profile exists
  if (profileStatus === 'ready' && profile) {
    // Role Check
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      // Redirect to their own dashboard
      return <Navigate to={`/${profile.role}/dashboard`} replace />;
    }

    // Onboarding Check
    if (requireOnboarding && !profile.onboarding_completed) {
      // Allow access to their specific onboarding page
      const onboardingPath = `/onboarding/${profile.role}`;
      if (location.pathname !== onboardingPath) {
        return <Navigate to={onboardingPath} replace />;
      }
    }
  }

  return <Outlet />;
};
