import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CelebrateEvent, EventRequirement } from '../../types';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EventStatusBadge } from '../../components/ui/EventStatusBadge';
import { Search, Filter, MapPin, Users, Wallet, X, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { getRelativeTime } from '../../lib/dateUtils';
import { formatBudgetRange } from '../../lib/formatters';

type JoinedEvent = CelebrateEvent & { event_requirements: EventRequirement | null };

export const PlannerMarketplace = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<JoinedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('All');
  const [budgetFilter, setBudgetFilter] = useState('All');
  const [guestCountFilter, setGuestCountFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest First');

  // Drawer State
  const [selectedEvent, setSelectedEvent] = useState<JoinedEvent | null>(null);

  const fetchOpenEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch open events. (RLS ensures we can only see Open events anyway)
      const { data, error: joinError } = await supabase
        .from('events')
        .select(`
          id, event_type, title, status, proposal_count, created_at, updated_at,
          event_requirements(
            id, event_id, guest_count, min_budget_lakhs, max_budget_lakhs, venue_name, venue_address, venue_image_url, additional_notes, services_required,
            bride_name, groom_name, event_date, event_time, venue_finalized, birthday_person_name, age, theme, house_address, company_name, corporate_event_type, created_at
          )
        `)
        .eq('status', 'Open')
        .order('created_at', { ascending: false });

      if (joinError) {
        // Fallback strategy if relation join fails
        console.warn('Joined query failed, attempting fallback...', joinError);
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, event_type, title, status, proposal_count, created_at, updated_at')
          .eq('status', 'Open')
          .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;

        const eventIds = eventsData.map(e => e.id);
        
        let requirementsMap: Record<string, EventRequirement> = {};
        if (eventIds.length > 0) {
          const { data: reqData, error: reqError } = await supabase
            .from('event_requirements')
            .select('id, event_id, guest_count, min_budget_lakhs, max_budget_lakhs, venue_name, venue_address, venue_image_url, additional_notes, services_required, bride_name, groom_name, event_date, event_time, venue_finalized, birthday_person_name, age, theme, house_address, company_name, corporate_event_type, created_at')
            .in('event_id', eventIds);
            
          if (reqError) throw reqError;
          
          reqData.forEach(req => {
            requirementsMap[req.event_id] = req;
          });
        }

        const merged: JoinedEvent[] = eventsData.map(e => ({
          ...(e as CelebrateEvent),
          event_requirements: requirementsMap[e.id] || null
        }));
        setEvents(merged);
      } else {
        const normalized = (data as any[]).map(e => ({
          ...e,
          event_requirements: Array.isArray(e.event_requirements) 
            ? e.event_requirements[0] || null 
            : e.event_requirements || null
        }));
        setEvents(normalized);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load marketplace events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenEvents();
  }, []);

  // Filter Extraction
  const eventTypes = ['All', ...Array.from(new Set(events.map(e => e.event_type)))];
  const budgetRanges = ['All', ...Array.from(new Set(events.map(e => formatBudgetRange(e.event_requirements?.min_budget_lakhs, e.event_requirements?.max_budget_lakhs)).filter(r => r !== 'Not specified')))];
  const guestCounts = ['All', ...Array.from(new Set(events.map(e => e.event_requirements?.guest_count).filter(Boolean)))];

  // Apply Search & Filters
  let filteredEvents = events.filter(e => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (e.event_requirements?.venue_name && e.event_requirements.venue_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = eventTypeFilter === 'All' || e.event_type === eventTypeFilter;
    const matchesBudget = budgetFilter === 'All' || formatBudgetRange(e.event_requirements?.min_budget_lakhs, e.event_requirements?.max_budget_lakhs) === budgetFilter;
    const matchesGuests = guestCountFilter === 'All' || e.event_requirements?.guest_count === guestCountFilter;
    return matchesSearch && matchesType && matchesBudget && matchesGuests;
  });

  // Apply Sorting
  if (sortOrder === 'Newest First') {
    filteredEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sortOrder === 'Oldest First') {
    filteredEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sortOrder === 'Highest Budget') {
    filteredEvents.sort((a, b) => (b.event_requirements?.min_budget_lakhs || 0) - (a.event_requirements?.min_budget_lakhs || 0));
  } else if (sortOrder === 'Lowest Budget') {
    filteredEvents.sort((a, b) => (a.event_requirements?.min_budget_lakhs || 0) - (b.event_requirements?.min_budget_lakhs || 0));
  }

  // Statistics
  const totalOpenEvents = events.length;
  const matchingEventsCount = filteredEvents.length;
  const availableSlots = filteredEvents.reduce((acc, event) => acc + Math.max(0, 15 - event.proposal_count), 0);

  if (loading) return <LoadingState message="Loading Marketplace Feed..." />;
  if (error) return <ErrorState message={error} onRetry={fetchOpenEvents} />;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-[#1F2937]">Marketplace</h1>
          <p className="text-gray-500 font-inter">Find and bid on open events.</p>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="text-sm text-gray-500 font-inter mb-1">Total Open Events</div>
          <div className="text-3xl font-bold text-primary font-poppins">{totalOpenEvents}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="text-sm text-gray-500 font-inter mb-1">Matching Events</div>
          <div className="text-3xl font-bold text-primary font-poppins">{matchingEventsCount}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="text-sm text-gray-500 font-inter mb-1">Available Proposal Slots</div>
          <div className="text-3xl font-bold text-primary font-poppins">{availableSlots}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#5B2A86] focus:border-[#5B2A86] block w-full pl-10 p-3 font-inter outline-none transition-colors"
            placeholder="Search by event title or venue name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#5B2A86] focus:border-[#5B2A86] block w-full p-2.5 font-inter outline-none"
            >
              {eventTypes.map(type => (
                <option key={type as string} value={type as string}>{type === 'All' ? 'All Event Types' : type as string}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#5B2A86] focus:border-[#5B2A86] block w-full p-2.5 font-inter outline-none"
            >
              {budgetRanges.map(range => (
                <option key={range as string} value={range as string}>{range === 'All' ? 'All Budgets' : range as string}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={guestCountFilter}
              onChange={(e) => setGuestCountFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#5B2A86] focus:border-[#5B2A86] block w-full p-2.5 font-inter outline-none"
            >
              {guestCounts.map(count => (
                <option key={count as string} value={count as string}>{count === 'All' ? 'All Guest Sizes' : count as string}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#5B2A86] focus:border-[#5B2A86] block w-full p-2.5 font-inter outline-none"
            >
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
              <option value="Highest Budget">Highest Budget</option>
              <option value="Lowest Budget">Lowest Budget</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feed Layout */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-100 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 font-poppins mb-2">No matching events</h3>
          <p className="text-gray-500 font-inter">Try adjusting your search or filters to find more opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const slotsRemaining = Math.max(0, 15 - event.proposal_count);
            return (
              <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="relative h-48 bg-gray-100">
                  {event.event_requirements?.venue_image_url ? (
                    <img 
                      src={event.event_requirements.venue_image_url} 
                      alt="Venue Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-800 shadow-sm">
                      {event.event_type}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 font-poppins line-clamp-1" title={event.title}>{event.title}</h3>
                  </div>
                  
                  <div className="text-xs text-primary font-medium mb-4">
                    {getRelativeTime(event.created_at)}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600 font-inter">
                      <Wallet className="w-4 h-4 mr-3 text-gray-400 shrink-0" />
                      <span>{formatBudgetRange(event.event_requirements?.min_budget_lakhs, event.event_requirements?.max_budget_lakhs)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 font-inter">
                      <Users className="w-4 h-4 mr-3 text-gray-400 shrink-0" />
                      <span>{event.event_requirements?.guest_count || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 font-inter line-clamp-1" title={event.event_requirements?.venue_name || 'Venue TBD'}>
                      <MapPin className="w-4 h-4 mr-3 text-gray-400 shrink-0" />
                      <span>{event.event_requirements?.venue_name || 'Venue TBD'}</span>
                    </div>
                    {event.event_requirements?.services_required && event.event_requirements.services_required.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {event.event_requirements.services_required.slice(0, 3).map((service, idx) => (
                          <span key={idx} className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[10px] font-semibold border border-primary/10">
                            {service}
                          </span>
                        ))}
                        {event.event_requirements.services_required.length > 3 && (
                          <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200">
                            +{event.event_requirements.services_required.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs font-inter mb-4">
                      <span className="text-gray-500">Proposals: <span className="font-semibold text-gray-900">{event.proposal_count}/15</span></span>
                      <span className={`font-semibold ${slotsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {slotsRemaining} slots left
                      </span>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedEvent(event)}
                    >
                      View Event Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setSelectedEvent(null)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-gray-900 font-poppins">Event Details</h2>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Image Header */}
              {selectedEvent.event_requirements?.venue_image_url && (
                <div className="rounded-xl overflow-hidden bg-gray-100 h-64 border border-gray-100">
                  <img 
                    src={selectedEvent.event_requirements.venue_image_url} 
                    alt="Venue" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Core Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-poppins mb-1">{selectedEvent.title}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold font-inter">
                    {selectedEvent.event_type}
                  </span>
                  <span className="text-gray-500 text-sm font-inter">
                    {getRelativeTime(selectedEvent.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-gray-500 text-xs font-inter mb-1">Budget Range</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      {formatBudgetRange(selectedEvent.event_requirements?.min_budget_lakhs, selectedEvent.event_requirements?.max_budget_lakhs)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-gray-500 text-xs font-inter mb-1">Guest Count</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      {selectedEvent.event_requirements?.guest_count || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                    <div className="text-gray-500 text-xs font-inter mb-1">Venue</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{selectedEvent.event_requirements?.venue_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Requirements */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 font-inter">Requested Services</h4>
                {selectedEvent.event_requirements?.services_required && selectedEvent.event_requirements.services_required.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {selectedEvent.event_requirements.services_required.map((service, idx) => (
                      <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold font-inter">
                        {service}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 font-inter mb-8">No specific services requested.</p>
                )}

                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 font-inter">Specific Requirements</h4>
                <div className="space-y-3">
                  {selectedEvent.event_requirements?.bride_name && (
                    <div className="flex justify-between text-sm font-inter">
                      <span className="text-gray-500">Bride Name</span>
                      <span className="font-medium text-gray-900">{selectedEvent.event_requirements.bride_name}</span>
                    </div>
                  )}
                  {selectedEvent.event_requirements?.groom_name && (
                    <div className="flex justify-between text-sm font-inter">
                      <span className="text-gray-500">Groom Name</span>
                      <span className="font-medium text-gray-900">{selectedEvent.event_requirements.groom_name}</span>
                    </div>
                  )}
                  {selectedEvent.event_requirements?.event_date && (
                    <div className="flex justify-between text-sm font-inter">
                      <span className="text-gray-500">Event Date</span>
                      <span className="font-medium text-gray-900">{selectedEvent.event_requirements.event_date}</span>
                    </div>
                  )}
                  {selectedEvent.event_requirements?.theme && (
                    <div className="flex justify-between text-sm font-inter">
                      <span className="text-gray-500">Theme</span>
                      <span className="font-medium text-gray-900">{selectedEvent.event_requirements.theme}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              {selectedEvent.event_requirements?.additional_notes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 font-inter">Additional Notes</h4>
                  <div className="bg-orange-50 text-orange-900 p-4 rounded-xl text-sm font-inter whitespace-pre-wrap border border-orange-100">
                    {selectedEvent.event_requirements.additional_notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with CTA */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
              <div className="text-center mb-4">
                <p className="text-xs text-gray-400 font-mono">Event ID: {selectedEvent.id}</p>
              </div>
              <Button 
                onClick={() => navigate(`/planner/proposals/create/${selectedEvent.id}`)}
                className="w-full"
              >
                Create Proposal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
