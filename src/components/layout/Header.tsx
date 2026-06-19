import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBell } from '../ui/NotificationBell';

const getPageTitle = (pathname: string) => {
  if (pathname.includes('/dashboard')) return 'Home';
  if (pathname.includes('/events')) return 'My Events';
  if (pathname.includes('/proposals')) return 'Proposals';
  if (pathname.includes('/overlays')) return 'Overlays';
  if (pathname.includes('/submissions')) return 'Submissions';
  if (pathname.includes('/profile')) return 'Profile';
  return 'Dashboard';
};

export const Header = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header className="h-20 bg-brand-background border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10 w-full md:pl-8">
      {/* Desktop Title */}
      <h2 className="text-2xl font-poppins font-bold text-text hidden md:block">{title}</h2>
      
      {/* Mobile Title (Centered) */}
      <div className="md:hidden flex-1 flex justify-center">
         <h2 className="text-xl font-poppins font-bold text-text">{title}</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationBell />
        
        <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="font-poppins font-semibold text-primary text-sm uppercase">
              {profile?.full_name?.charAt(0) || 'U'}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
