import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ClientProfile, CelebrateEvent, EventRequirement } from '../../types';
import { EventStatusBadge } from '../../components/ui/EventStatusBadge';
import { getRelativeTime } from '../../lib/dateUtils';
import { formatBudgetRange } from '../../lib/formatters';
import { Calendar, Users, Bell, Plus, MapPin, Tag, Wallet, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type JoinedEvent = CelebrateEvent & { event_requirements: EventRequirement | null };

export const ClientDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState<ClientProfile | null>(null);
  const [activeEvents, setActiveEvents] = useState<JoinedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (error) throw error;
      setClientData(data as ClientProfile);

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*, event_requirements(*)')
        .eq('client_profile_id', profile.id)
        .in('status', ['Open', 'Booked'])
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;
      
      const parsedEvents = (eventsData as any[])?.map(e => ({
        ...e,
        event_requirements: Array.isArray(e.event_requirements) ? e.event_requirements[0] : e.event_requirements
      })) as JoinedEvent[];

      setActiveEvents(parsedEvents || []);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [profile]);

  const openProposalsCount = activeEvents.filter(e => e.status === 'Open').reduce((sum, e) => sum + e.proposal_count, 0);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="h-48 bg-gray-100 animate-pulse rounded-[24px]"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-100 animate-pulse rounded-[16px]"></div>
          <div className="h-32 bg-gray-100 animate-pulse rounded-[16px]"></div>
          <div className="h-32 bg-gray-100 animate-pulse rounded-[16px]"></div>
        </div>
        <div className="h-64 bg-gray-100 animate-pulse rounded-[24px]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <ErrorState message={error} onRetry={fetchClientData} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      
      {/* Profile Header & Hero CTA */}
      <div className="bg-primary overflow-hidden rounded-[24px] shadow-sm relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.full_name?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-poppins font-semibold text-white mb-1">
                {profile?.full_name}
              </h2>
              <div className="flex items-center text-white/80 font-inter text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                {profile?.city}
              </div>
            </div>
          </div>
          
            <Button size="lg" className="bg-white !text-black hover:bg-gray-50 border-none shadow-sm whitespace-nowrap" onClick={() => navigate('/client/events/create')}>
              <Plus className="w-5 h-5 mr-2" />
              Create New Event
            </Button>
        </div>
      </div>

      {/* Preferences & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Preferences Section */}
        <Card className="p-6 lg:col-span-1 border border-gray-100 flex flex-col gap-6 bg-surface">
          <h3 className="font-poppins font-semibold text-text text-lg">My Preferences</h3>
          
          <div className="flex flex-col gap-2">
            <div className="text-xs font-inter font-medium text-text/50 uppercase tracking-wider flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1" /> Event Types
            </div>
            <div className="flex flex-wrap gap-2">
              {clientData?.preferred_event_types?.map(type => (
                <span key={type} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full font-inter">
                  {type}
                </span>
              ))}
              {!clientData?.preferred_event_types?.length && (
                <span className="text-sm text-text/50 italic">None selected</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-inter font-medium text-text/50 uppercase tracking-wider flex items-center">
              <Wallet className="w-3.5 h-3.5 mr-1" /> Budget Range
            </div>
            <div className="text-sm font-inter text-text font-medium bg-gray-50 px-3 py-2 rounded-lg inline-block">
              {formatBudgetRange(clientData?.min_budget_lakhs, clientData?.max_budget_lakhs)}
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title="Active Events" value={activeEvents.length.toString()} icon={<Calendar className="w-5 h-5" />} />
          <StatCard title="Open Proposals" value={openProposalsCount.toString()} icon={<Users className="w-5 h-5" />} />
          <StatCard title="Recent Updates" value="3" icon={<Bell className="w-5 h-5" />} trend="Requires attention" trendUp={false} />
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Events Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-poppins font-semibold text-text">Active Events</h3>
          <Card className="border border-gray-100 p-0 overflow-hidden flex-1 flex flex-col">
            {activeEvents.length === 0 ? (
              <EmptyState 
                title="No active events" 
                message="You haven't created any events yet. Start planning by creating your first event!"
              />
            ) : (
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {activeEvents.map(event => (
                  <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full font-inter">
                            {event.event_type}
                          </span>
                          <EventStatusBadge status={event.status as any} />
                        </div>
                        <h4 className="font-semibold text-gray-900 font-poppins">{event.title}</h4>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate(`/client/events/${event.id}`)}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm font-inter text-gray-600 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Date</div>
                        <div className="font-medium text-gray-900">{event.event_requirements?.event_date || 'TBD'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Budget</div>
                        <div className="font-medium text-gray-900 flex items-center"><Wallet className="w-3.5 h-3.5 mr-1 text-gray-400"/> {formatBudgetRange(event.event_requirements?.min_budget_lakhs, event.event_requirements?.max_budget_lakhs)}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Proposals</div>
                        <div className="font-medium text-gray-900">{event.proposal_count} Received</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Updates Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-poppins font-semibold text-text">Recent Updates</h3>
          <Card className="border border-gray-100 p-4 flex flex-col gap-3">
            {/* Placeholder Updates */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-blue-900 font-inter mb-1">Proposal Received</h4>
                <p className="text-xs text-blue-700 font-inter">A planner has submitted a new proposal for your "Summer Wedding".</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-purple-900 font-inter mb-1">Design Updated</h4>
                <p className="text-xs text-purple-700 font-inter">The Design Canvas for your reception has been updated.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900 font-inter mb-1">System Message</h4>
                <p className="text-xs text-gray-600 font-inter">Welcome to the Celebrate Marketplace! Your profile is ready.</p>
              </div>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};
