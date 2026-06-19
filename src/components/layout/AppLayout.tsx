import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-brand-background flex">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-[280px] min-h-screen">
        <Header />
        
        {/* Main scrollable area */}
        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-x-hidden">
          <Outlet />
        </main>
        
        {/* Mobile Bottom Navigation (hidden on desktop) */}
        <MobileBottomNav />
      </div>
    </div>
  );
};
