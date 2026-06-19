import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close drawer on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (id: string, actionUrl: string | null) => {
    markAsRead(id);
    if (actionUrl) {
      setIsOpen(false);
      navigate(actionUrl);
    }
  };

  return (
    <div className="relative" ref={drawerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text/70 hover:text-primary transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-poppins font-semibold text-text">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-semibold ${!notification.is_read ? 'text-primary' : 'text-gray-800'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-text hover:text-primary transition-colors"
            >
              View All Notifications <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
