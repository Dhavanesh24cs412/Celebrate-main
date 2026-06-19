import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else if (isMounted) {
        setNotifications(data || []);
      }
      if (isMounted) setLoading(false);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const markAsRead = async (id: string) => {
    const now = new Date().toISOString();
    
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: now } : n))
    );

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    
    const now = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at || now }))
    );

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('profile_id', profile.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
