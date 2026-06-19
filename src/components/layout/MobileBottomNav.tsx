import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Calendar, FileText, User, Layers, Send, Store, Bell } from 'lucide-react';

const CLIENT_NAV = [
  { name: 'Home', path: '/client/dashboard', icon: Home },
  { name: 'My Events', path: '/client/events', icon: Calendar },
  { name: 'Proposals', path: '/client/proposals', icon: FileText },
  { name: 'Booked', path: '/client/booked', icon: Calendar },
  { name: 'Profile', path: '/client/profile', icon: User },
  { name: 'Alerts', path: '/notifications', icon: Bell },
];

const PLANNER_NAV = [
  { name: 'Home', path: '/planner/dashboard', icon: Home },
  { name: 'Market', path: '/planner/marketplace', icon: Store },
  { name: 'Projects', path: '/planner/projects', icon: FileText },
  { name: 'Overlays', path: '/planner/overlays', icon: Layers },
  { name: 'Bids', path: '/planner/submissions', icon: Send },
  { name: 'Profile', path: '/planner/profile', icon: User },
  { name: 'Alerts', path: '/notifications', icon: Bell },
];

export const MobileBottomNav = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = profile?.role === 'planner' ? PLANNER_NAV : CLIENT_NAV;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-100 z-30 flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive ? 'text-primary' : 'text-text/50 hover:text-text/70'
            }`}
          >
            <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
            <span className={`text-[10px] font-inter ${isActive ? 'font-semibold' : 'font-medium'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
