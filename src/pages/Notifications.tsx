import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const handleNotificationClick = (id: string, actionUrl: string | null) => {
    markAsRead(id);
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-poppins font-bold text-text flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Notifications
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg self-start">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-white text-text shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === 'unread' ? 'bg-white text-text shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-2 self-start sm:self-auto"
            >
              <Check className="w-4 h-4" /> Mark all as read
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-50">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">No notifications found</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                className={`p-4 md:p-6 transition-colors ${
                  !notification.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-gray-50'
                } cursor-pointer flex gap-4 items-start`}
              >
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <h3 className={`text-base font-semibold ${!notification.is_read ? 'text-primary' : 'text-gray-800'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">
                    {notification.message}
                  </p>
                  {notification.action_url && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                      View Details <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
