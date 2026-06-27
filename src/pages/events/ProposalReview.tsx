import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CelebrateEvent, EventRequirement, Proposal } from '../../types';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { EventStatusBadge } from '../../components/ui/EventStatusBadge';
import { getRelativeTime } from '../../lib/dateUtils';
import { formatEstimatedBudget } from '../../lib/formatters';
import { ArrowLeft, User, Wallet, Calendar, AlertCircle, X, Check, XCircle, FileText, Image as ImageIcon } from 'lucide-react';

type JoinedEvent = CelebrateEvent & { event_requirements: EventRequirement | null };

export const ProposalReview = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [event, setEvent] = useState<JoinedEvent | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  const [confirmingAccept, setConfirmingAccept] = useState<Proposal | null>(null);
  const [confirmingReject, setConfirmingReject] = useState<Proposal | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    if (!eventId || !user) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch Event & Requirements
      let eventData: CelebrateEvent | null = null;
      let reqData: EventRequirement | null = null;

      const { data: eData, error: eError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eError) throw eError;
      eventData = eData as CelebrateEvent;

      const { data: rData, error: rError } = await supabase
        .from('event_requirements')
        .select('*')
        .eq('event_id', eventId)
        .single();
      
      if (!rError && rData) reqData = rData as EventRequirement;

      setEvent({ ...eventData, event_requirements: reqData });

      // Fetch Proposals (Drafts are blocked by RLS, but we filter explicitly)
      const { data: pData, error: pError } = await supabase
        .from('proposals')
        .select(`
          *,
          planner_profiles(
            profile_id,
            business_name,
            logo_url,
            short_bio,
            years_experience,
            team_size,
            services
          )
        `)
        .eq('event_id', eventId)
        .neq('status', 'Draft')
        .order('submitted_at', { ascending: true });

      if (pError) throw pError;
      setProposals(pData as Proposal[]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load proposals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  // Stable Anonymous Labels mapping
  const anonymousMapping = useMemo(() => {
    const uniqueIds = Array.from(new Set(proposals.map(p => p.planner_profile_id))).sort();
    const map = new Map<string, string>();
    uniqueIds.forEach((id, index) => {
      map.set(id, `Planner #${index + 1}`);
    });
    return map;
  }, [proposals]);

  const handleAccept = async () => {
    if (!confirmingAccept || !event) return;
    setActionError(null);
    
    // Acceptance Validation Rule
    if (event.status !== 'Open') {
      setActionError('This event is no longer open for accepting proposals.');
      return;
    }
    if (confirmingAccept.status !== 'Submitted') {
      setActionError('Only submitted proposals can be accepted.');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'Accepted' })
        .eq('id', confirmingAccept.id);
      
      if (error) throw error;
      
      // Close modals and refresh data
      setConfirmingAccept(null);
      setViewingProposal(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Failed to accept proposal.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirmingReject) return;
    setActionError(null);
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'Rejected' })
        .eq('id', confirmingReject.id);
      
      if (error) throw error;
      
      setConfirmingReject(null);
      setViewingProposal(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Failed to reject proposal.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading Event Proposals..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!event) return <ErrorState message="Event not found." onRetry={() => navigate('/client/proposals')} />;

  const isBooked = event.status === 'Booked';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24 md:pb-8">
      <button 
        onClick={() => navigate('/client/proposals')}
        className="flex items-center text-gray-500 hover:text-gray-700 font-inter transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Proposals
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
          <p className="text-gray-500 font-inter text-sm mt-1">
            {proposals.length} proposal{proposals.length !== 1 && 's'} received.
          </p>
        </div>
      </div>

      {proposals.length === 0 ? (
        <EmptyState 
          title="No Proposals Yet" 
          message="Planners have not submitted any proposals for this event yet."
        />
      ) : (
        <>
          {/* Proposal Comparison Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold font-poppins text-gray-900">Proposal Comparison</h2>
              <p className="text-sm text-gray-500 font-inter">A quick overview of the bids received.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-inter">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Anonymous Planner</th>
                    <th className="px-6 py-4">Estimated Budget</th>
                    <th className="px-6 py-4">Submitted Date</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-900">
                  {proposals.map(proposal => (
                    <tr 
                      key={proposal.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setViewingProposal(proposal)}
                    >
                      <td className="px-6 py-4 font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        {event.selected_proposal_id === proposal.id && proposal.planner_profiles 
                          ? proposal.planner_profiles.business_name 
                          : anonymousMapping.get(proposal.planner_profile_id)}
                      </td>
                      <td className="px-6 py-4 font-medium">{formatEstimatedBudget(proposal.estimated_budget_lakhs)}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {proposal.submitted_at ? new Date(proposal.submitted_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <EventStatusBadge status={proposal.status as any} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Proposal Cards Grid */}
          <div>
             <h2 className="text-lg font-semibold font-poppins text-gray-900 mb-4">Detailed Proposals</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {proposals.map(proposal => (
                 <div 
                   key={proposal.id}
                   className={`bg-white rounded-2xl border ${proposal.status === 'Accepted' ? 'border-green-300 ring-2 ring-green-50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col`}
                 >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                         <User className="w-3 h-3 text-gray-600" />
                         <span className="text-xs font-semibold text-gray-700">
                           {event.selected_proposal_id === proposal.id && proposal.planner_profiles 
                             ? proposal.planner_profiles.business_name 
                             : anonymousMapping.get(proposal.planner_profile_id)}
                         </span>
                      </div>
                      <EventStatusBadge status={proposal.status as any} />
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 font-poppins mb-2 line-clamp-2">{proposal.title}</h3>
                    <p className="text-sm text-gray-600 font-inter line-clamp-3 mb-6 flex-1">
                      {proposal.short_description}
                    </p>

                    <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl">
                      <div className="flex justify-between text-sm font-inter">
                         <span className="text-gray-500 flex items-center gap-1"><Wallet className="w-4 h-4"/> Budget</span>
                         <span className="font-semibold text-gray-900">{formatEstimatedBudget(proposal.estimated_budget_lakhs)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-inter">
                         <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-4 h-4"/> Submitted</span>
                         <span className="font-medium text-gray-900">{getRelativeTime(proposal.submitted_at || proposal.updated_at)}</span>
                      </div>
                    </div>

                     {event.selected_proposal_id === proposal.id && proposal.planner_profiles ? (
                       <Button 
                         variant="primary" 
                         className="w-full"
                         onClick={() => navigate(`/client/planners/${proposal.planner_profile_id}`)}
                       >
                         View Full Profile
                       </Button>
                     ) : (
                       <Button 
                         variant="outline" 
                         className="w-full"
                         onClick={() => setViewingProposal(proposal)}
                       >
                         View Full Proposal
                       </Button>
                     )}
                 </div>
               ))}
             </div>
          </div>
        </>
      )}

      {/* Proposal Details Drawer */}
      {viewingProposal && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setViewingProposal(null)} />
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <h2 className="text-xl font-bold text-gray-900 font-poppins">{anonymousMapping.get(viewingProposal.planner_profile_id)}</h2>
                 <EventStatusBadge status={viewingProposal.status as any} />
              </div>
              <button 
                onClick={() => setViewingProposal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              <div>
                <h3 className="text-3xl font-bold text-gray-900 font-poppins mb-2">{viewingProposal.title}</h3>
                <p className="text-gray-600 font-inter text-lg leading-relaxed">{viewingProposal.short_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                   <div className="text-xs text-gray-500 font-inter mb-1 uppercase tracking-wider">Est. Budget</div>
                   <div className="font-semibold text-gray-900 text-lg">{formatEstimatedBudget(viewingProposal.estimated_budget_lakhs)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                   <div className="text-xs text-gray-500 font-inter mb-1 uppercase tracking-wider">Submitted Date</div>
                   <div className="font-semibold text-gray-900 text-lg">
                     {viewingProposal.submitted_at ? new Date(viewingProposal.submitted_at).toLocaleDateString() : 'N/A'}
                   </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 font-inter flex items-center gap-2">
                   <FileText className="w-4 h-4 text-primary" /> Package Details
                </h4>
                <div className="bg-white border border-gray-200 p-6 rounded-2xl text-gray-700 font-inter whitespace-pre-wrap leading-relaxed shadow-sm">
                  {viewingProposal.package_description}
                </div>
              </div>

              {/* Design Canvas Placeholder */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 font-inter">Design Preview</h4>
                <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 h-64 flex flex-col items-center justify-center text-center p-6">
                   <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                   <h5 className="font-semibold text-gray-700 font-poppins mb-1">Design Canvas Coming Soon</h5>
                   <p className="text-sm text-gray-500 font-inter max-w-sm">
                     {viewingProposal.canvas_required 
                        ? 'This planner has indicated they will provide a visual mockup once the Canvas tool is released.' 
                        : 'Visual mockups will be available in future updates.'}
                   </p>
                </div>
              </div>

            </div>
            
            {/* Action Footer */}
            <div className="p-6 border-t border-gray-100 bg-white shrink-0 flex gap-4">
               {isBooked ? (
                  <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl text-center font-semibold font-inter">
                     {viewingProposal.status === 'Accepted' ? 'You selected this proposal' : 'Another Planner Selected'}
                  </div>
               ) : viewingProposal.status === 'Submitted' ? (
                  <>
                     <Button 
                        variant="outline" 
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmingReject(viewingProposal)}
                     >
                        Reject
                     </Button>
                     <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setConfirmingAccept(viewingProposal)}
                     >
                        Accept Proposal
                     </Button>
                  </>
               ) : (
                  <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl text-center font-semibold font-inter">
                     Proposal {viewingProposal.status}
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {confirmingAccept && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !actionLoading && setConfirmingAccept(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Check className="w-6 h-6 text-green-600" />
               </div>
               <h3 className="text-xl font-bold text-center text-gray-900 font-poppins mb-2">Accept Proposal?</h3>
               <div className="text-gray-600 font-inter text-center mb-6 space-y-2">
                  <p>Accepting this proposal from <strong>{anonymousMapping.get(confirmingAccept.planner_profile_id)}</strong> will:</p>
                  <ul className="text-sm bg-gray-50 p-4 rounded-xl text-left space-y-2">
                     <li>• Book the event officially.</li>
                     <li>• Reject all other competing proposals.</li>
                     <li>• Lock the event from further submissions.</li>
                  </ul>
               </div>

               {actionError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium text-center">
                     {actionError}
                  </div>
               )}

               <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmingAccept(null)} disabled={actionLoading}>Cancel</Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleAccept} disabled={actionLoading}>
                     {actionLoading ? 'Accepting...' : 'Confirm Accept'}
                  </Button>
               </div>
            </div>
         </div>
      )}

      {confirmingReject && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !actionLoading && setConfirmingReject(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <XCircle className="w-6 h-6 text-red-600" />
               </div>
               <h3 className="text-xl font-bold text-center text-gray-900 font-poppins mb-2">Reject Proposal?</h3>
               <p className="text-gray-600 font-inter text-center mb-6">
                  Are you sure you want to reject this proposal? This action cannot be undone and will free up a slot for another planner.
               </p>

               {actionError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium text-center">
                     {actionError}
                  </div>
               )}

               <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmingReject(null)} disabled={actionLoading}>Cancel</Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={actionLoading}>
                     {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                  </Button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};
