import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Proposal, CelebrateEvent } from '../../types';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { EventStatusBadge } from '../../components/ui/EventStatusBadge';
import { getRelativeTime } from '../../lib/dateUtils';
import { formatEstimatedBudget } from '../../lib/formatters';
import { Filter, Edit2, Send, Trash2, Eye, X, AlertCircle } from 'lucide-react';

type JoinedProposal = Proposal & { events: Pick<CelebrateEvent, 'title' | 'event_type' | 'selected_proposal_id'> & { profiles?: { full_name: string | null, phone: string | null } | null } | null };

export const PlannerMySubmissions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [proposals, setProposals] = useState<JoinedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('All');
  const [eventTypeFilter, setEventTypeFilter] = useState('All');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [viewingProposal, setViewingProposal] = useState<JoinedProposal | null>(null);

  const fetchProposals = async () => {
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

      const { data, error: pError } = await supabase
        .from('proposals')
        .select(`
          *,
          events:event_id (
            title, 
            event_type, 
            selected_proposal_id,
            profiles (
              full_name,
              phone
            )
          )
        `)
        .eq('planner_profile_id', profileData.id)
        .order('updated_at', { ascending: false });

      if (pError) {
         // Fallback if relation is missing
         console.warn('Joined query failed, doing manual merge...');
         const { data: rawP, error: rawPError } = await supabase
          .from('proposals')
          .select('*')
          .eq('planner_profile_id', profileData.id)
          .order('updated_at', { ascending: false });
         
         if (rawPError) throw rawPError;

         if (rawP.length > 0) {
            const eventIds = rawP.map(p => p.event_id);
            const { data: eventsData, error: eError } = await supabase
              .from('events')
              .select('id, title, event_type, selected_proposal_id, profiles(full_name, phone)')
              .in('id', eventIds);
            
            if (eError) throw eError;
            
            const eMap: Record<string, any> = {};
            eventsData.forEach(e => eMap[e.id] = { 
              title: e.title, 
              event_type: e.event_type,
              selected_proposal_id: e.selected_proposal_id,
              profiles: Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
            });
            
            const merged = rawP.map(p => ({
               ...p,
               events: eMap[p.event_id] || null
            }));
            setProposals(merged as JoinedProposal[]);
         } else {
            setProposals([]);
         }
      } else {
        // Normalize array if returned
        const normalized = (data as any[]).map(p => ({
          ...p,
          events: Array.isArray(p.events) ? p.events[0] : p.events
        }));
        setProposals(normalized);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft proposal?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('proposals').delete().eq('id', id);
      if (error) throw error;
      setProposals(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete proposal.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDirectSubmit = async (id: string) => {
    setSubmittingId(id);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'Submitted' })
        .eq('id', id);
      
      if (error) {
         if (error.message.includes('Maximum 15 proposals')) {
            alert('This event has reached the maximum 15 proposals and is closed for submissions.');
         } else {
            throw error;
         }
      } else {
         fetchProposals();
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to submit proposal.');
    } finally {
      setSubmittingId(null);
    }
  };

  // Filters
  const eventTypes = ['All', ...Array.from(new Set(proposals.map(p => p.events?.event_type).filter(Boolean)))];
  
  const filteredProposals = proposals.filter(p => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesType = eventTypeFilter === 'All' || p.events?.event_type === eventTypeFilter;
    return matchesStatus && matchesType;
  });

  if (loading) return <LoadingState message="Loading Submissions..." />;
  if (error) return <ErrorState message={error} onRetry={fetchProposals} />;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-[#1F2937]">My Submissions</h1>
        <p className="text-gray-500 font-inter">Manage your drafts and track submitted proposals.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#5B2A86] focus:border-[#5B2A86] block w-full p-2.5 font-inter outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="flex-1">
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
      </div>

      {filteredProposals.length === 0 ? (
        <EmptyState 
          title="No proposals found" 
          message="You haven't created any proposals matching these filters."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm font-inter">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Proposal</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Est. Budget</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-900">
                {filteredProposals.map(proposal => (
                  <tr key={proposal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 font-poppins">{proposal.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{getRelativeTime(proposal.updated_at)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{proposal.events?.title || 'Unknown Event'}</div>
                      <div className="text-xs text-gray-500 mt-1">{proposal.events?.event_type}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">{formatEstimatedBudget(proposal.estimated_budget_lakhs)}</td>
                    <td className="px-6 py-4">
                       <EventStatusBadge status={proposal.status as any} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {proposal.status === 'Draft' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDirectSubmit(proposal.id)}
                            disabled={submittingId === proposal.id}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Submit Proposal"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/planner/proposals/create/${proposal.event_id}`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Draft"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(proposal.id)}
                            disabled={deletingId === proposal.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setViewingProposal(proposal)}
                          className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium ml-auto"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredProposals.map(proposal => (
              <div key={proposal.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 font-poppins">{proposal.title}</h3>
                    <p className="text-sm text-gray-500 font-inter">{proposal.events?.title || 'Unknown Event'}</p>
                  </div>
                  <EventStatusBadge status={proposal.status as any} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm font-inter bg-gray-50 p-3 rounded-lg">
                  <div>
                    <div className="text-gray-500 text-xs">Est. Budget</div>
                    <div className="font-medium text-gray-900">{formatEstimatedBudget(proposal.estimated_budget_lakhs)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Last Updated</div>
                    <div className="font-medium text-gray-900">{getRelativeTime(proposal.updated_at)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex gap-2">
                  {proposal.status === 'Draft' ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1 py-2"
                        onClick={() => navigate(`/planner/proposals/create/${proposal.event_id}`)}
                      >
                        Edit
                      </Button>
                      <Button 
                        className="flex-1 py-2"
                        onClick={() => handleDirectSubmit(proposal.id)}
                        disabled={submittingId === proposal.id}
                      >
                        Submit
                      </Button>
                      <button 
                        onClick={() => handleDelete(proposal.id)}
                        disabled={deletingId === proposal.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setViewingProposal(proposal)}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Read-Only Viewing Drawer */}
      {viewingProposal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setViewingProposal(null)} />
          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-gray-900 font-poppins">Proposal Details</h2>
              <button 
                onClick={() => setViewingProposal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <EventStatusBadge status={viewingProposal.status as any} />
                <h3 className="text-2xl font-bold text-gray-900 font-poppins mt-3 mb-1">{viewingProposal.title}</h3>
                <p className="text-sm text-gray-500 font-inter">Submitted: {new Date(viewingProposal.submitted_at || viewingProposal.created_at).toLocaleDateString()}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between font-inter text-sm">
                  <span className="text-gray-500">Event</span>
                  <span className="font-medium text-gray-900">{viewingProposal.events?.title}</span>
                </div>
                <div className="flex justify-between font-inter text-sm">
                  <span className="text-gray-500">Estimated Budget</span>
                  <span className="font-medium text-gray-900">{formatEstimatedBudget(viewingProposal.estimated_budget_lakhs)}</span>
                </div>
              </div>

              {viewingProposal.id === viewingProposal.events?.selected_proposal_id && viewingProposal.events?.profiles && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 font-inter">Client Details</h4>
                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-gray-900 font-inter">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Name</span>
                      <span className="font-semibold">{viewingProposal.events.profiles.full_name || 'Not Provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-semibold">{viewingProposal.events.profiles.phone || 'Not Provided'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 font-inter">Short Description</h4>
                <p className="text-gray-700 font-inter whitespace-pre-wrap leading-relaxed">
                  {viewingProposal.short_description}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 font-inter">Package Details</h4>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-gray-700 font-inter whitespace-pre-wrap leading-relaxed">
                  {viewingProposal.package_description}
                </div>
              </div>

              {viewingProposal.canvas_required && (
                 <div className="bg-purple-50 text-primary p-4 rounded-xl border border-purple-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="font-semibold font-poppins text-sm mb-1">Canvas Design Reserved</h4>
                      <p className="text-xs font-inter opacity-80">This proposal has flagged that a visual design will be generated once the Canvas tool is available.</p>
                    </div>
                 </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
               <p className="text-xs text-gray-400 text-center font-inter">Proposal Status: {viewingProposal.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
