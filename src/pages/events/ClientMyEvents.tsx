import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatBudgetRange } from '../../lib/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { CelebrateEvent, EventRequirement } from '../../types';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EventStatusBadge } from '../../components/ui/EventStatusBadge';
import { Filter, Copy, Edit2, Trash2, Eye, Plus } from 'lucide-react';

type JoinedEvent = CelebrateEvent & { event_requirements: EventRequirement | null };

export const ClientMyEvents = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<JoinedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Sorting
  const [statusFilter, setStatusFilter] = useState('All');
  const [eventTypeFilter, setEventTypeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest First');

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      // Try Joined Query First
      const { data, error: joinError } = await supabase
        .from('events')
        .select(`
          *,
          event_requirements(*)
        `)
        .eq('client_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (joinError) {
        console.warn('Joined query failed, attempting fallback...', joinError);
        // Fallback strategy
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('client_profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;

        const eventIds = eventsData.map(e => e.id);
        
        let requirementsMap: Record<string, EventRequirement> = {};
        if (eventIds.length > 0) {
          const { data: reqData, error: reqError } = await supabase
            .from('event_requirements')
            .select('*')
            .in('event_id', eventIds);
            
          if (reqError) throw reqError;
          
          reqData.forEach(req => {
            requirementsMap[req.event_id] = req;
          });
        }

        const merged: JoinedEvent[] = eventsData.map(e => ({
          ...e,
          event_requirements: requirementsMap[e.id] || null
        }));
        setEvents(merged);
      } else {
        // Since event_requirements is a 1-1, Supabase might return it as an object or an array.
        // We will normalize it to be an object.
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
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [profile]);

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      // event_requirements and proposals cascade automatically
      const { error } = await supabase.from('events').delete().eq('id', eventToDelete);
      if (error) throw error;
      
      setEvents(events.filter(e => e.id !== eventToDelete));
      setDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete event');
    }
  };

  // Derived state
  const eventTypes = ['All', ...Array.from(new Set(events.map(e => e.event_type)))];
  
  const filteredEvents = events
    .filter(e => statusFilter === 'All' || e.status === statusFilter)
    .filter(e => eventTypeFilter === 'All' || e.event_type === eventTypeFilter)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'Newest First' ? dateB - dateA : dateA - dateB;
    });

  if (loading) return <LoadingState message="Loading your events..." />;
  if (error) return <ErrorState message={error} onRetry={fetchEvents} />;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-[#1F2937]">My Events</h1>
          <p className="text-gray-500 font-inter">Manage your events and review proposals.</p>
        </div>
        <Button onClick={() => navigate('/client/events/create')} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Event
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No events created yet" message="You haven't created any events to receive proposals.">
          <Button onClick={() => navigate('/client/events/create')}>Create Event</Button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#5B2A86] focus:border-[#5B2A86] block w-full p-2.5 font-inter outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Booked">Booked</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex-1">
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#5B2A86] focus:border-[#5B2A86] block w-full p-2.5 font-inter outline-none"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type === 'All' ? 'All Event Types' : type}</option>
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
              </select>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500 font-inter">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4">Event Info</th>
                  <th scope="col" className="px-6 py-4">Details</th>
                  <th scope="col" className="px-6 py-4">Status & Proposals</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{event.title}</div>
                      <div className="text-gray-500">{event.event_type}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(event.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div><span className="font-medium">Budget:</span> {formatBudgetRange(event.event_requirements?.min_budget_lakhs, event.event_requirements?.max_budget_lakhs)}</div>
                      <div><span className="font-medium">Guests:</span> {event.event_requirements?.guest_count || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-2">
                        <EventStatusBadge status={event.status} />
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        {event.proposal_count} / 15 Proposals
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button title="View" onClick={() => navigate('/client/events/' + event.id)} className="p-2 text-gray-400 hover:text-[#5B2A86] transition-colors rounded-lg hover:bg-[#5B2A86]/10">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button title="Delete" onClick={() => { setEventToDelete(event.id); setDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEvents.length === 0 && (
              <div className="p-8 text-center text-gray-500 font-inter">
                No events match the selected filters.
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 font-poppins">{event.title}</h3>
                    <p className="text-sm text-gray-500 font-inter">{event.event_type}</p>
                  </div>
                  <EventStatusBadge status={event.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm font-inter bg-gray-50 p-3 rounded-lg">
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider">Budget</div>
                    <div className="font-medium text-gray-900">{formatBudgetRange(event.event_requirements?.min_budget_lakhs, event.event_requirements?.max_budget_lakhs)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider">Guests</div>
                    <div className="font-medium text-gray-900">{event.event_requirements?.guest_count || 'N/A'}</div>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-200 mt-1">
                    <div className="text-gray-500 text-xs uppercase tracking-wider">Proposals</div>
                    <div className="font-medium text-gray-900">{event.proposal_count} / 15</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-gray-400 font-inter">{new Date(event.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <button title="View" onClick={() => navigate('/client/events/' + event.id)} className="p-2 text-gray-400 hover:text-[#5B2A86] transition-colors rounded-lg hover:bg-[#5B2A86]/10">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button title="Delete" onClick={() => { setEventToDelete(event.id); setDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="p-8 text-center text-gray-500 font-inter bg-white rounded-xl border border-gray-100">
                No events match the selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold font-poppins text-gray-900 mb-2">Delete Event</h3>
            <p className="text-gray-500 font-inter text-sm mb-6">
              Are you sure you want to delete this event? This action cannot be undone. All event requirements will also be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDeleteModalOpen(false); setEventToDelete(null); }}>
                Cancel
              </Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-red-600 border-0">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
