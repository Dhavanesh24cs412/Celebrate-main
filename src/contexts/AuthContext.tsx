import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isProfileLoadedRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      setProfile(data || null);
      isProfileLoadedRef.current = true;
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (isMounted) setLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session) {
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
          return;
        }

        // Server-side validation to catch deleted accounts (Ghost Sessions)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          await supabase.auth.signOut(); // Purge ghost session
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
          return;
        }
        
        if (isMounted) {
          setUser(user);
          await fetchProfile(user.id);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore the initial session event to prevent duplicate execution & race conditions with getSession()
      if (event === 'INITIAL_SESSION') return;

      if (isMounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          // ONLY block the UI with a loading state if it is a fresh login.
          // Background token refreshes should update the profile silently.
          if (event === 'SIGNED_IN' && !isProfileLoadedRef.current) {
            setLoading(true);
          }
          await fetchProfile(session.user.id);
          if (isMounted && event === 'SIGNED_IN') {
            setLoading(false);
          }
        } else {
          setProfile(null);
          setLoading(false); // Fixed: ensure loading resolves when logged out
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      error, 
      refreshProfile: async () => { if (user) await fetchProfile(user.id); },
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
