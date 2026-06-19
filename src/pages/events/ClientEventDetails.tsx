import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatBudgetRange } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { CelebrateEvent, EventRequirement, PlannerProfile, Profile } from '../../types';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EventStatusBadge } from '../../components/ui/EventStatusBadge';
import { ArrowLeft, Phone, MapPin, Camera, Globe, Store, Users, Wallet } from 'lucide-react';

type JoinedEvent = CelebrateEvent & { event_requirements: EventRequirement | null };
type PlannerPayload = PlannerProfile & { profiles: Profile | null };

export const ClientEventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [event, setEvent] = useState<JoinedEvent | null>(null);
  const [planner, setPlanner] = useState<PlannerPayload | null>(null);

  const fetchData = async () => {
    if (!eventId || !user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Event
      const { data: eData, error: eError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eError) throw eError;
      const eventData = eData as CelebrateEvent;

      // 2. Fetch Requirements
      const { data: rData } = await supabase
        .from('event_requirements')
        .select('*')
        .eq('event_id', eventId)
        .single();

      setEvent({ ...eventData, event_requirements: rData as EventRequirement | null });

      // 3. Fetch Planner Identity (Protected by RLS)
      if (eventData.selected_proposal_id) {
        // First get the planner_profile_id from the accepted proposal
        const { data: pData, error: pError } = await supabase
          .from('proposals')
          .select('planner_profile_id')
          .eq('id', eventData.selected_proposal_id)
          .single();

        if (pError) throw pError;

        // Now fetch the planner profile info. This will succeed ONLY because of the new RLS policy.
        const { data: plannerData, error: plannerError } = await supabase
          .from('planner_profiles')
          .select('*, profiles(*)')
          .eq('profile_id', pData.planner_profile_id)
          .single();

        if (plannerError) throw new Error('Security Error: Unable to fetch planner identity. ' + plannerError.message);
        
        // Normalize relation
        const normalizedPlanner = {
           ...plannerData,
           profiles: Array.isArray(plannerData.profiles) ? plannerData.profiles[0] : plannerData.profiles
        };
        
        setPlanner(normalizedPlanner as PlannerPayload);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  if (loading) return <LoadingState message="Loading Event Details..." />;
  if (error) return <ErrorState message={error} onRetry={() => navigate('/client/booked')} />;
  if (!event) return <ErrorState message="Event not found." onRetry={() => navigate('/client/booked')} />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24 md:pb-8">
      <button 
        onClick={() => navigate(event.status === 'Open' ? '/client/events' : '/client/booked')}
        className="flex items-center text-gray-500 hover:text-gray-700 font-inter transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {event.status === 'Open' ? 'Back to My Events' : 'Back to Booked Events'}
      </button>

      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold font-inter">
              {event.event_type}
            </span>
            <EventStatusBadge status={event.status as any} />
          </div>
          <h1 className="text-2xl font-bold font-poppins text-[#1F2937]">{event.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Event Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold font-poppins text-gray-900 mb-4">Event Details</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-xs text-gray-500 font-inter mb-1 uppercase tracking-wider">Client Budget</div>
                <div className="flex items-center font-medium text-gray-900 font-inter text-lg">
                  <Wallet className="w-5 h-5 text-green-600 mr-1" />
                  {formatBudgetRange(event.event_requirements?.min_budget_lakhs, event.event_requirements?.max_budget_lakhs)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 font-inter mb-1 uppercase tracking-wider">Guest Count</div>
                <div className="flex items-center font-medium text-gray-900 font-inter text-lg">
                  <Users className="w-5 h-5 text-blue-600 mr-1" />
                  {event.event_requirements?.guest_count || 'Not specified'}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs text-gray-500 font-inter mb-2 uppercase tracking-wider">Requested Services</div>
              <div className="flex flex-wrap gap-2">
                {event.event_requirements?.services_required && event.event_requirements.services_required.length > 0 ? (
                  event.event_requirements.services_required.map((service, idx) => (
                    <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold font-inter">
                      {service}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm font-inter">No services specified</span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-xs text-gray-500 font-inter mb-2 uppercase tracking-wider">Venue Information</div>
              <div className="flex items-start font-medium text-gray-900 font-inter">
                <MapPin className="w-5 h-5 text-red-500 mr-2 shrink-0" />
                <div>
                  <div className="font-semibold">{event.event_requirements?.venue_name || 'Not specified'}</div>
                  <div className="text-gray-500 font-normal text-sm mt-1">{event.event_requirements?.venue_address}</div>
                </div>
              </div>

              {event.event_requirements?.venue_image_url && (
                <div className="mt-4 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                  <img 
                    src={event.event_requirements.venue_image_url} 
                    alt="Venue" 
                    className="w-full max-h-64 object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Contextual Sidebar */}
        <div className="space-y-6">
          {event.status === 'Open' ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold font-poppins text-gray-900">Marketplace Status</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-inter">
                  <span className="text-gray-500">Proposals Received</span>
                  <span className="font-semibold text-gray-900">{event.proposal_count} / 15</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min((event.proposal_count / 15) * 100, 100)}%` }}
                  ></div>
                </div>
                <Button 
                  onClick={() => navigate(`/client/events/${event.id}/proposals`)}
                  className="w-full mt-4"
                >
                  Review Proposals
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-b from-[#5B2A86]/5 to-transparent p-6 rounded-2xl shadow-sm border border-[#5B2A86]/10">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold font-poppins text-primary">Selected Planner</h2>
                  <div className="bg-green-100 text-green-700 p-1.5 rounded-full">
                     <Store className="w-4 h-4" />
                  </div>
               </div>

             {planner ? (
                <div className="space-y-6">
                   {/* Logo & Name */}
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                         {planner.logo_url ? (
                            <img src={planner.logo_url} alt="Logo" className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 font-poppins font-bold text-xl">
                               {planner.business_name?.charAt(0) || '?'}
                            </div>
                         )}
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-900 font-poppins text-lg leading-tight">{planner.business_name}</h3>
                         <div className="flex items-center text-gray-500 text-sm font-inter mt-1">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            {planner.profiles?.city || 'Location not specified'}
                         </div>
                      </div>
                   </div>

                   {/* Contact Section */}
                   <div className="bg-white rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-inter mb-2">Contact Planner</h4>
                      
                      {planner.profiles?.phone && (
                         <a href={`tel:${planner.profiles.phone}`} className="flex items-center gap-3 text-sm font-inter text-gray-700 hover:text-primary transition-colors p-2 -mx-2 rounded-lg hover:bg-gray-50">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                               <Phone className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{planner.profiles.phone}</span>
                         </a>
                      )}

                      {planner.instagram_url && (
                         <a href={planner.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-inter text-gray-700 hover:text-primary transition-colors p-2 -mx-2 rounded-lg hover:bg-gray-50">
                            <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                               <Camera className="w-4 h-4" />
                            </div>
                            <span className="font-medium truncate block max-w-[180px]">Instagram Profile</span>
                         </a>
                      )}

                      {planner.website_url && (
                         <a href={planner.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-inter text-gray-700 hover:text-primary transition-colors p-2 -mx-2 rounded-lg hover:bg-gray-50">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                               <Globe className="w-4 h-4" />
                            </div>
                            <span className="font-medium truncate block max-w-[180px]">Website</span>
                         </a>
                      )}
                   </div>
                </div>
             ) : (
                <div className="text-center py-6 text-gray-500 font-inter text-sm">
                   Loading planner identity...
                </div>
             )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
