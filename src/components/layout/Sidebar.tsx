import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Calendar, FileText, User, Layers, Send, Store, Bell } from 'lucide-react';

const CLIENT_NAV = [
  { name: 'Home', path: '/client/dashboard', icon: Home },
  { name: 'My Events', path: '/client/events', icon: Calendar },
  { name: 'Proposals', path: '/client/proposals', icon: FileText },
  { name: 'Booked Events', path: '/client/booked', icon: Calendar },
  { name: 'Profile', path: '/client/profile', icon: User },
  { name: 'Notifications', path: '/notifications', icon: Bell },
];

const PLANNER_NAV = [
  { name: 'Home', path: '/planner/dashboard', icon: Home },
  { name: 'Marketplace', path: '/planner/marketplace', icon: Store },
  { name: 'Projects', path: '/planner/projects', icon: FileText },
  { name: 'Overlays', path: '/planner/overlays', icon: Layers },
  { name: 'Submissions', path: '/planner/submissions', icon: Send },
  { name: 'Profile', path: '/planner/profile', icon: User },
  { name: 'Notifications', path: '/notifications', icon: Bell },
];

export const Sidebar = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = profile?.role === 'planner' ? PLANNER_NAV : CLIENT_NAV;

  return (
    <aside className="hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 bg-surface border-r border-gray-100 z-20 shadow-sm">
      <div className="p-6 h-20 flex items-center border-b border-gray-50 shrink-0">
        <h1 className="text-2xl font-poppins font-bold text-primary">Celebrate</h1>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-inter transition-all ${
                isActive 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-text/70 hover:bg-gray-50 hover:text-text'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
