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
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Checking authentication..." />;
  }

  if (!user) {
    // Save the intended route and redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is logged in but hasn't selected a role, force role selection unless they are already there
  if (!profile && location.pathname !== '/select-role') {
    return <Navigate to="/select-role" replace />;
  }

  // If profile exists
  if (profile) {
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
