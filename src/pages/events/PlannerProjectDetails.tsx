import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatBudgetRange } from '../../lib/formatters';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CelebrateEvent, EventRequirement, Profile } from '../../types';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EventStatusBadge } from '../../components/ui/EventStatusBadge';
import { ArrowLeft, Phone, MapPin, Users, Wallet, User as UserIcon } from 'lucide-react';

type JoinedEvent = CelebrateEvent & { event_requirements: EventRequirement | null };

export const PlannerProjectDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [event, setEvent] = useState<JoinedEvent | null>(null);
  const [clientProfile, setClientProfile] = useState<Profile | null>(null);

  const fetchData = async () => {
    if (!eventId || !user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Event (Wait, planners can only see Open events normally... 
      // But we need them to see their Booked event!)
      // Let's rely on standard lookup, but if RLS blocks 'events', we might need to adjust event RLS.
      // Wait, planners CAN see events if they are the selected planner? 
      // Let's assume the event fetch works or we adjust RLS if needed.
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

      // 3. Verify ownership & Fetch Client Identity
      // Verify that this planner actually owns the accepted proposal
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('id')
        .eq('id', eventData.selected_proposal_id)
        .eq('planner_profile_id', myProfile?.id)
        .single();

      if (proposalError || !proposalData) {
        throw new Error('Security Error: You do not have access to this project.');
      }

      // Fetch Client Identity - This works thanks to the new RLS policy!
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', eventData.client_profile_id)
        .single();

      if (clientError) throw new Error('Failed to fetch client identity: ' + clientError.message);
      
      setClientProfile(clientData as Profile);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  if (loading) return <LoadingState message="Loading Project Details..." />;
  if (error) return <ErrorState message={error} onRetry={() => navigate('/planner/projects')} />;
  if (!event) return <ErrorState message="Project not found." onRetry={() => navigate('/planner/projects')} />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24 md:pb-8">
      <button 
        onClick={() => navigate('/planner/projects')}
        className="flex items-center text-gray-500 hover:text-gray-700 font-inter transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Projects
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
            <h2 className="text-lg font-semibold font-poppins text-gray-900 mb-4">Event Requirements</h2>
            
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
            
            {event.event_requirements?.additional_notes && (
               <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="text-xs text-gray-500 font-inter mb-2 uppercase tracking-wider">Additional Notes</div>
                  <div className="text-gray-700 font-inter text-sm whitespace-pre-wrap">
                     {event.event_requirements.additional_notes}
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Right Col: Identity Reveal */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-blue-50 to-transparent p-6 rounded-2xl shadow-sm border border-blue-100">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold font-poppins text-blue-900">Client Contact</h2>
                <div className="bg-blue-200 text-blue-800 p-1.5 rounded-full">
                   <UserIcon className="w-4 h-4" />
                </div>
             </div>

             {clientProfile ? (
                <div className="space-y-6">
                   {/* Avatar & Name */}
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                         {clientProfile.avatar_url ? (
                            <img src={clientProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 font-poppins font-bold text-xl">
                               {clientProfile.full_name?.charAt(0) || '?'}
                            </div>
                         )}
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-900 font-poppins text-lg leading-tight">{clientProfile.full_name}</h3>
                         <div className="flex items-center text-gray-500 text-sm font-inter mt-1">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            {clientProfile.city || 'Location not specified'}
                         </div>
                      </div>
                   </div>

                   {/* Contact Section */}
                   <div className="bg-white rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider font-inter mb-2">Direct Contact</h4>
                      
                      {clientProfile.phone ? (
                         <a href={`tel:${clientProfile.phone}`} className="flex items-center gap-3 text-sm font-inter text-gray-700 hover:text-blue-600 transition-colors p-2 -mx-2 rounded-lg hover:bg-gray-50">
                            <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                               <Phone className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{clientProfile.phone}</span>
                         </a>
                      ) : (
                         <div className="text-sm text-gray-500 font-inter italic">No phone number provided.</div>
                      )}
                   </div>
                </div>
             ) : (
                <div className="text-center py-6 text-gray-500 font-inter text-sm">
                   Loading client identity...
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};
