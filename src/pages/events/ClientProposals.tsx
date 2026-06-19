import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CelebrateEvent } from '../../types';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { EventStatusBadge } from '../../components/ui/EventStatusBadge';
import { getRelativeTime } from '../../lib/dateUtils';
import { ChevronRight, FileText } from 'lucide-react';

export const ClientProposals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<CelebrateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) throw profileError;

      const { data, error: eError } = await supabase
        .from('events')
        .select('*')
        .eq('client_profile_id', profileData.id)
        .order('created_at', { ascending: false });

      if (eError) throw eError;
      setEvents(data as CelebrateEvent[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) return <LoadingState message="Loading your events..." />;
  if (error) return <ErrorState message={error} onRetry={fetchEvents} />;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-[#1F2937]">Proposals</h1>
        <p className="text-gray-500 font-inter">Review the bids submitted for your active events.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState 
          title="No events found" 
          message="You haven't created any events yet to receive proposals."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col cursor-pointer group"
              onClick={() => navigate(`/client/events/${event.id}/proposals`)}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold font-inter">
                  {event.event_type}
                </span>
                <EventStatusBadge status={event.status as any} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 font-poppins mb-1 line-clamp-1" title={event.title}>{event.title}</h3>
              <p className="text-xs text-gray-500 font-inter mb-6">Created {getRelativeTime(event.created_at)}</p>

              <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2 text-sm font-medium font-inter text-gray-700">
                  <FileText className="w-4 h-4 text-gray-400" />
                  {event.proposal_count} Proposal{event.proposal_count !== 1 && 's'}
                </div>
                <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sm font-semibold">
                  Review <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
