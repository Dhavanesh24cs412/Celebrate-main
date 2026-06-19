import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, ArrowRight, Save, CheckCircle, Image as ImageIcon, Upload, X } from 'lucide-react';

const SERVICES = [
  'Food & Catering', 'DJ', 'VJ', 'Music Party', 'Event Hosts',
  'Events Desk', 'Decor', 'Venues', 'Photography', 'Videography',
  'Sound Systems', 'Lightings', 'Invitations & Gifting',
  'Bride Styling', 'Groom Styling', 'Rituals', 'Other Entertainments'
];

export const EventWizard = () => {
  const { eventType } = useParams<{ eventType: string }>();
  const decodedType = eventType ? decodeURIComponent(eventType) : 'Event';
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const storageKey = `celebrate_wizard_${decodedType.replace(/\s+/g, '_')}`;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const venueImageRef = useRef<HTMLInputElement>(null);

  // Form State extended for all types
  const [formData, setFormData] = useState({
    title: '',
    guest_count: '',
    min_budget_lakhs: '' as number | string,
    max_budget_lakhs: '' as number | string,
    venue_name: '',
    venue_address: '',
    additional_notes: '',
    services_required: [] as string[],
    
    // Wedding specific
    bride_name: '',
    groom_name: '',
    event_date: '',
    event_time: '',
    venue_finalized: '',
    
    // Birthday specific
    birthday_person_name: '',
    age: '',
    theme: '',
    
    // Housewarming specific
    house_address: '',
    
    // Corporate specific
    company_name: '',
    corporate_event_type: ''
  });

  const [venueImageFile, setVenueImageFile] = useState<File | null>(null);
  const [venueImagePreview, setVenueImagePreview] = useState<string>('');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved wizard state");
      }
    }
  }, [storageKey]);

  // Save to local storage automatically
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(formData));
  }, [formData, storageKey]);

  // Dynamic sections logic based on type
  const getSections = () => {
    switch (decodedType) {
      case 'Wedding':
        return ['Basic Details', 'Venue Details', 'Required Services', 'Budget & Guests', 'Additional Notes', 'Review'];
      case 'Birthday Celebration':
        return ['Birthday Details', 'Required Services', 'Budget & Guests', 'Additional Notes', 'Review'];
      case 'Housewarming':
        return ['House Details', 'Required Services', 'Budget & Guests', 'Additional Notes', 'Review'];
      case 'Corporate Event':
        return ['Company Details', 'Venue Details', 'Required Services', 'Budget & Attendees', 'Additional Notes', 'Review'];
      default:
        // Reception, Engagement, Anniversary, Seemantham, Naming Ceremony
        return ['Basic Details', 'Venue Details', 'Required Services', 'Budget & Guests', 'Additional Notes', 'Review'];
    }
  };

  const SECTIONS = getSections();
  const isLastStep = currentStep === SECTIONS.length - 1;

  const handleNext = () => {
    if (currentStep < SECTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSaveDraft = () => {
    alert('Draft saved locally! You can safely close this page and return later.');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVenueImageFile(file);
      setVenueImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (): Promise<string> => {
    if (!user || !venueImageFile) throw new Error("No image selected");
    const fileExt = venueImageFile.name.split('.').pop();
    const fileName = `venue-${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage.from('event-venues').upload(filePath, venueImageFile, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from('event-venues').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);

    // Hard requirement for the overlay system later
    if (SECTIONS.includes('Venue Details') && !venueImageFile) {
      setError("A Venue or Dais Image is required for the Design Canvas overlay system.");
      setLoading(false);
      return;
    }

    if (formData.services_required.length === 0) {
      setError("Please select at least one required service.");
      setLoading(false);
      return;
    }

    try {
      let finalImageUrl = '';
      if (venueImageFile) {
        finalImageUrl = await uploadFile();
      } else {
        // Fallback for events that technically skipped the venue section in UI
        finalImageUrl = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000';
      }

      // 1. Create Event Row
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          client_profile_id: profile.id,
          event_type: decodedType,
          title: formData.title || `${decodedType} Event`,
          status: 'Open',
          proposal_count: 0
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // 2. Create Event Requirements Row
      const { error: reqError } = await supabase
        .from('event_requirements')
        .insert({
          event_id: eventData.id,
          guest_count: formData.guest_count || 'Not specified',
          min_budget_lakhs: formData.min_budget_lakhs === '' ? null : formData.min_budget_lakhs,
          max_budget_lakhs: formData.max_budget_lakhs === '' ? null : formData.max_budget_lakhs,
          venue_name: formData.venue_name || null,
          venue_address: formData.venue_address || formData.house_address || null,
          additional_notes: formData.additional_notes || null,
          venue_image_url: finalImageUrl,
          services_required: formData.services_required,
          
          bride_name: formData.bride_name || null,
          groom_name: formData.groom_name || null,
          event_date: formData.event_date || null,
          event_time: formData.event_time || null,
          venue_finalized: formData.venue_finalized || null,
          
          birthday_person_name: formData.birthday_person_name || null,
          age: formData.age || null,
          theme: formData.theme || null,
          
          house_address: formData.house_address || null,
          company_name: formData.company_name || null,
          corporate_event_type: formData.corporate_event_type || null,
        });

      if (reqError) throw reqError;

      localStorage.removeItem(storageKey);
      navigate('/client/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderVenueUpload = () => (
    <div className="flex flex-col gap-3 mt-4">
      <label className="text-sm font-medium text-text font-inter">Venue / Dais Image (Required for Canvas)</label>
      <div 
        className={`w-full aspect-[2/1] sm:aspect-[3/1] rounded-2xl bg-gray-50 border-2 border-dashed ${!venueImagePreview && error ? 'border-red-400' : 'border-gray-300'} flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:border-primary/50 transition-colors relative`}
        onClick={() => { if (!venueImagePreview) venueImageRef.current?.click(); }}
      >
        {venueImagePreview ? (
          <>
            <img src={venueImagePreview} alt="Venue Preview" className="w-full h-full object-cover" />
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setVenueImagePreview(''); setVenueImageFile(null); }}
              className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="text-gray-400 flex flex-col items-center gap-2 group-hover:text-primary transition-colors p-6 text-center">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium font-inter">Click to upload an empty venue or stage photo</span>
            <span className="text-xs text-gray-400">Planners will use this to generate AI designs</span>
          </div>
        )}
      </div>
      <input 
        type="file" 
        ref={venueImageRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden" 
      />
    </div>
  );

  const renderStepContent = () => {
    const sectionName = SECTIONS[currentStep];

    switch (sectionName) {
      case 'Basic Details':
        if (decodedType === 'Wedding') {
          return (
            <div className="flex flex-col gap-6">
              <h3 className="text-xl font-poppins font-semibold">Wedding Details</h3>
              <Input label="Event Title" placeholder="e.g. Our Dream Wedding" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Bride Name" placeholder="Jane" value={formData.bride_name} onChange={e => setFormData({...formData, bride_name: e.target.value})} />
                <Input label="Groom Name" placeholder="John" value={formData.groom_name} onChange={e => setFormData({...formData, groom_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Wedding Date" placeholder="DD/MM/YYYY" type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
                <Input label="Wedding Time" placeholder="HH:MM" type="time" value={formData.event_time} onChange={e => setFormData({...formData, event_time: e.target.value})} />
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-poppins font-semibold">Basic Details</h3>
            <Input label="Event Title" placeholder={`e.g. My ${decodedType}`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <Input label="Event Date" placeholder="DD/MM/YYYY" type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
          </div>
        );

      case 'Birthday Details':
        return (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-poppins font-semibold">Birthday Details</h3>
            <Input label="Event Title" placeholder="e.g. Sarah's 10th Birthday" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <Input label="Birthday Person Name" placeholder="Sarah" value={formData.birthday_person_name} onChange={e => setFormData({...formData, birthday_person_name: e.target.value})} />
            <Input label="Age Turning" placeholder="e.g. 10" type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
            <Input label="Theme (Optional)" placeholder="e.g. Superhero, Princess" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} />
          </div>
        );

      case 'Company Details':
        return (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-poppins font-semibold">Corporate Event Details</h3>
            <Input label="Event Title" placeholder="e.g. Annual Summit 2026" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <Input label="Company Name" placeholder="Acme Corp" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
            <Input label="Event Type" placeholder="e.g. Seminar, Retreat" value={formData.corporate_event_type} onChange={e => setFormData({...formData, corporate_event_type: e.target.value})} />
            <Input label="Event Date" placeholder="DD/MM/YYYY" type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
          </div>
        );

      case 'House Details':
        return (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-poppins font-semibold">Housewarming Details</h3>
            <Input label="Event Title" placeholder="e.g. New Beginnings" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <Input label="House Address" placeholder="123 New Street" value={formData.house_address} onChange={e => setFormData({...formData, house_address: e.target.value})} />
            <Input label="Event Date" placeholder="DD/MM/YYYY" type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
          </div>
        );

      case 'Venue Details':
        return (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-poppins font-semibold">Venue Details</h3>
            {decodedType === 'Wedding' && (
              <Input label="Is the venue finalized?" placeholder="Yes/No" value={formData.venue_finalized} onChange={e => setFormData({...formData, venue_finalized: e.target.value})} />
            )}
            <Input label="Venue Name" placeholder="e.g. The Grand Palace" value={formData.venue_name} onChange={e => setFormData({...formData, venue_name: e.target.value})} />
            <Input label="Venue Address / Location" placeholder="City, Area" value={formData.venue_address} onChange={e => setFormData({...formData, venue_address: e.target.value})} />
            {renderVenueUpload()}
          </div>
        );

      case 'Budget & Guests':
      case 'Budget & Attendees':
        return (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-poppins font-semibold">{sectionName}</h3>
            <Input label={decodedType === 'Corporate Event' ? "Attendees Count" : "Expected Guest Count"} placeholder="e.g. 200-300" value={formData.guest_count} onChange={e => setFormData({...formData, guest_count: e.target.value})} />
            
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700 font-inter">Budget Range (in Lakhs)</label>
              <div className="flex items-center gap-4">
                <Input 
                  type="number"
                  placeholder="Min (e.g. 1)" 
                  value={formData.min_budget_lakhs} 
                  onChange={e => setFormData({...formData, min_budget_lakhs: e.target.value === '' ? '' : Number(e.target.value)})} 
                />
                <span className="text-gray-400 font-inter">to</span>
                <Input 
                  type="number"
                  placeholder="Max (e.g. 5)" 
                  value={formData.max_budget_lakhs} 
                  onChange={e => setFormData({...formData, max_budget_lakhs: e.target.value === '' ? '' : Number(e.target.value)})} 
                />
              </div>
            </div>
          </div>
        );

      case 'Required Services':
        return (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-poppins font-semibold">Required Services</h3>
            <p className="text-sm text-gray-500 font-inter">Select the services you need for your event.</p>
            <div className="flex flex-wrap gap-3 mt-2">
              {SERVICES.map(service => {
                const isSelected = formData.services_required.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setFormData({ ...formData, services_required: formData.services_required.filter(s => s !== service) });
                      } else {
                        setFormData({ ...formData, services_required: [...formData.services_required, service] });
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {service}
                    {isSelected && <CheckCircle className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'Additional Notes':
        return (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-poppins font-semibold">Additional Notes</h3>
            <textarea
              className="w-full bg-white border border-gray-200 focus:border-primary focus:ring-primary/20 rounded-[12px] px-4 py-3 text-base font-inter min-h-[150px] outline-none"
              placeholder="Tell us about your dream event, preferred colors, restrictions..."
              value={formData.additional_notes}
              onChange={e => setFormData({...formData, additional_notes: e.target.value})}
            />
          </div>
        );

      case 'Review':
        return (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-poppins font-semibold">Review Event</h3>
            
            <div className="bg-gray-50 p-6 rounded-2xl flex flex-col gap-4 font-inter">
              <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-4">
                <span className="text-gray-500 text-sm">Event Type</span>
                <span className="font-semibold text-text">{decodedType}</span>
                <span className="text-gray-500 text-sm">Title</span>
                <span className="font-semibold text-text">{formData.title || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-4">
                <span className="text-gray-500 text-sm">Guests/Attendees</span>
                <span className="font-semibold text-text">{formData.guest_count || 'N/A'}</span>
                <span className="text-gray-500 text-sm">Budget</span>
                <span className="font-semibold text-text">{formData.budget_range || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-4">
                <span className="text-gray-500 text-sm">Services</span>
                <span className="font-semibold text-text col-span-2 mt-1">{formData.services_required.length > 0 ? formData.services_required.join(', ') : 'None selected'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-4">
                <span className="text-gray-500 text-sm">Image Uploaded</span>
                <span className="font-semibold text-text flex items-center gap-2">
                  {venueImageFile ? <><CheckCircle className="w-4 h-4 text-success" /> Yes</> : <><X className="w-4 h-4 text-red-500" /> No</>}
                </span>
              </div>
            </div>
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-inter border border-red-100">
                {error}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-140px)] pb-24 md:pb-0 relative">
      
      {/* Header & Progress Indicator */}
      <div className="mb-8">
        <h1 className="text-2xl font-poppins font-bold text-primary mb-2">Create {decodedType}</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between relative mt-6">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-300"
            style={{ width: `${(currentStep / (SECTIONS.length - 1)) * 100}%` }}
          ></div>
          
          {SECTIONS.map((section, index) => (
            <div key={section} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300
                  ${index < currentStep ? 'bg-primary text-white' : 
                    index === currentStep ? 'bg-primary text-white ring-4 ring-primary/20' : 
                    'bg-white text-gray-400 border-2 border-gray-200'}`}
              >
                {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`text-xs font-inter hidden sm:block absolute top-10 whitespace-nowrap
                ${index <= currentStep ? 'text-primary font-medium' : 'text-gray-400'}`}>
                {section}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <Card className="p-6 md:p-8 flex-1 mb-8 shadow-sm">
        {renderStepContent()}
      </Card>

      {/* Navigation Footer */}
      <div className="fixed md:relative bottom-[64px] md:bottom-0 left-0 right-0 bg-surface md:bg-transparent border-t border-gray-100 md:border-none p-4 md:p-0 z-20 flex items-center justify-between gap-4">
        
        <Button 
          variant="outline" 
          onClick={handlePrev} 
          disabled={currentStep === 0 || loading}
          className="flex-1 md:flex-none"
        >
          <ArrowLeft className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Previous</span>
        </Button>

        <div className="flex gap-4 flex-1 md:flex-none justify-end">
          <Button 
            variant="secondary" 
            onClick={handleSaveDraft}
            disabled={loading}
            className="hidden sm:flex"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 md:flex-none shadow-md shadow-primary/20">
              {loading ? 'Publishing...' : 'Publish Event'}
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1 md:flex-none">
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

    </div>
  );
};
