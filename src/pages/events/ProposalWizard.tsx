import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CelebrateEvent, EventRequirement, Proposal } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { MapPin, Users, Wallet, ArrowLeft, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { getRelativeTime } from '../../lib/dateUtils';

type JoinedEvent = CelebrateEvent & { event_requirements: EventRequirement | null };

export const ProposalWizard = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [event, setEvent] = useState<JoinedEvent | null>(null);
  const [existingProposal, setExistingProposal] = useState<Proposal | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState<number | string>('');
  const [canvasRequired, setCanvasRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    if (!eventId || !user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Planner Profile ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) throw profileError;
      const plannerProfileId = profileData.id;

      // 2. Fetch Event Data (Fallback logic since relation metadata might fail)
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
      
      if (!rError && rData) {
        reqData = rData as EventRequirement;
      }

      setEvent({ ...eventData, event_requirements: reqData });

      // 3. Fetch Existing Proposal
      const { data: pData, error: pError } = await supabase
        .from('proposals')
        .select('*')
        .eq('event_id', eventId)
        .eq('planner_profile_id', plannerProfileId)
        .maybeSingle();

      if (pError && pError.code !== 'PGRST116') {
         // ignore missing row
      }

      if (pData) {
        if (pData.status !== 'Draft') {
           setError('You have already submitted a proposal for this event.');
           setLoading(false);
           return;
        }
        setExistingProposal(pData as Proposal);
        setTitle(pData.title || '');
        setShortDescription(pData.short_description || '');
        setPackageDescription(pData.package_description || '');
        setEstimatedBudget(pData.estimated_budget_lakhs || '');
        setCanvasRequired(pData.canvas_required || false);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isSubmit: boolean) => {
    if (!eventId || !user || !event) return;
    setValidationError(null);

    // Validation for Submit
    if (isSubmit) {
      if (!title.trim() || !shortDescription.trim() || !packageDescription.trim() || estimatedBudget === '') {
        setValidationError('All fields are required to submit a proposal.');
        return;
      }
      if (event.proposal_count >= 15) {
        setValidationError('This event has reached the maximum number of proposals.');
        return;
      }
    }

    setSaving(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) throw new Error('Planner profile not found.');

      const proposalData = {
        event_id: eventId,
        planner_profile_id: profileData.id,
        title,
        short_description: shortDescription,
        package_description: packageDescription,
        estimated_budget_lakhs: estimatedBudget === '' ? null : Number(estimatedBudget),
        canvas_required: canvasRequired,
        status: isSubmit ? 'Submitted' : 'Draft',
      };

      if (existingProposal) {
        const { error } = await supabase
          .from('proposals')
          .update(proposalData)
          .eq('id', existingProposal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('proposals')
          .insert([proposalData]);
        
        if (error) {
          // 23505 is the Postgres Unique Violation code
          if (error.code === '23505') {
            console.warn('Race condition prevented: Draft already exists. Falling back to UPSERT.');
            const { data: retryData, error: retryError } = await supabase
              .from('proposals')
              .select('id')
              .eq('event_id', eventId)
              .eq('planner_profile_id', profileData.id)
              .eq('status', 'Draft')
              .single();
              
            if (retryError) throw retryError;
            
            const { error: updateError } = await supabase
              .from('proposals')
              .update(proposalData)
              .eq('id', retryData.id);
              
            if (updateError) throw updateError;
          } else {
            throw error;
          }
        }
      }

      navigate('/planner/submissions');
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || 'Failed to save proposal.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading Proposal Environment..." />;
  if (error) return <ErrorState message={error} onRetry={() => navigate('/planner/marketplace')} />;
  if (!event) return <ErrorState message="Event not found." onRetry={() => navigate('/planner/marketplace')} />;

  if (event.status !== 'Open') {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto mt-12">
        <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 font-poppins mb-2">Event Closed</h2>
          <p className="text-gray-600 font-inter mb-6">This event is no longer accepting proposals.</p>
          <Button onClick={() => navigate('/planner/marketplace')}>Return to Marketplace</Button>
        </div>
      </div>
    );
  }

  const slotsRemaining = Math.max(0, 15 - event.proposal_count);
  const isCapReached = event.proposal_count >= 15;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <button 
        onClick={() => navigate('/planner/marketplace')}
        className="flex items-center text-gray-500 hover:text-gray-700 font-inter mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Marketplace
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Form */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-poppins text-[#1F2937] mb-2">
              {existingProposal ? 'Edit Draft Proposal' : 'Create Proposal'}
            </h1>
            <p className="text-gray-500 font-inter">
              Submit your bid anonymously. Client will see your identity only if accepted.
            </p>
          </div>

          {validationError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm font-medium font-inter flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{validationError}</p>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <Input
              label="Proposal Title"
              placeholder="e.g., Elegant Floral Summer Wedding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-inter">Short Description <span className="text-red-500">*</span></label>
              <textarea
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#5B2A86] focus:border-[#5B2A86] block p-3 font-inter outline-none transition-colors min-h-[100px]"
                placeholder="A brief hook about your vision..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-inter">Package Description <span className="text-red-500">*</span></label>
              <textarea
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#5B2A86] focus:border-[#5B2A86] block p-3 font-inter outline-none transition-colors min-h-[150px]"
                placeholder="Detail what is included in this proposal..."
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-inter">Estimated Budget (in Lakhs) <span className="text-red-500">*</span></label>
              <div className="text-xs text-gray-500 font-inter mb-2">Example: ₹30,000 should be entered as 0.3, ₹5,00,000 should be entered as 5.</div>
              <Input
                type="number"
                placeholder="e.g. 5"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>

            {/* Canvas Preparation Section */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 border-dashed mt-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 font-poppins">Proposal Design Section</h3>
                <span className="bg-[#E8AEB7] text-white px-3 py-1 rounded-full text-xs font-bold font-inter tracking-wider">
                  COMING SOON
                </span>
              </div>
              <p className="text-sm text-gray-500 font-inter mb-4">
                In the future, you will be able to launch the AI Design Canvas to visually mockup the venue for the client.
              </p>
              
              <label className="flex items-center space-x-3 cursor-not-allowed opacity-60">
                <input
                  type="checkbox"
                  checked={canvasRequired}
                  onChange={(e) => setCanvasRequired(e.target.checked)}
                  disabled
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 font-inter">
                  Attach an AI Canvas design to this proposal
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              className="flex-1"
              onClick={() => handleSave(true)}
              disabled={saving || isCapReached}
            >
              {saving ? 'Submitting...' : 'Submit Proposal'}
            </Button>
          </div>
        </div>

        {/* Right Column: Event Details Context */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Slots Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 font-poppins mb-4">Proposal Slots</h3>
            
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold text-primary font-poppins">{event.proposal_count} <span className="text-lg text-gray-400 font-medium">/ 15</span></span>
              <span className="text-sm text-gray-500 font-inter mb-1">Submitted</span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
              <div 
                className={`h-2.5 rounded-full ${isCapReached ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min((event.proposal_count / 15) * 100, 100)}%` }}
              ></div>
            </div>
            
            <div className="text-sm font-medium text-gray-700 font-inter">
              Remaining Slots: <span className={isCapReached ? 'text-red-500' : 'text-green-600'}>{slotsRemaining}</span>
            </div>

            {isCapReached && (
              <p className="text-xs text-red-500 font-inter mt-3 leading-relaxed">
                The maximum number of proposals has been reached. You may save a draft, but submission is currently disabled.
              </p>
            )}
          </div>

          {/* Event Context Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 font-poppins mb-4">Event Context</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 font-inter mb-1">Event Type</div>
                <div className="font-medium text-gray-900 font-inter">{event.event_type}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500 font-inter mb-1">Requested Services</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {event.event_requirements?.services_required && event.event_requirements.services_required.length > 0 ? (
                    event.event_requirements.services_required.map((service, idx) => (
                      <span key={idx} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-semibold font-inter">
                        {service}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-gray-500 font-inter">None specified</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 font-inter mb-1">Client Budget</div>
                <div className="flex items-center font-medium text-gray-900 font-inter">
                  <Wallet className="w-4 h-4 text-gray-400 mr-1" />
                  {event.event_requirements?.budget_range || 'Not specified'}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 font-inter mb-1">Guest Count</div>
                <div className="flex items-center font-medium text-gray-900 font-inter">
                  <Users className="w-4 h-4 text-gray-400 mr-1" />
                  {event.event_requirements?.guest_count || 'Not specified'}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 font-inter mb-1">Venue</div>
                <div className="flex items-start font-medium text-gray-900 font-inter">
                  <MapPin className="w-4 h-4 text-gray-400 mr-1 mt-0.5 shrink-0" />
                  <span>{event.event_requirements?.venue_name || 'Not specified'}</span>
                </div>
              </div>

              {event.event_requirements?.venue_image_url && (
                <div className="pt-2">
                  <div className="text-xs text-gray-500 font-inter mb-2">Venue Photo</div>
                  <div className="rounded-lg overflow-hidden bg-gray-100 h-32 border border-gray-100">
                    <img 
                      src={event.event_requirements.venue_image_url} 
                      alt="Venue" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
