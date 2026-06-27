export type UserRole = 'client' | 'planner';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface ClientProfile {
  profile_id: string;
  preferred_event_types: string[] | null;
  preferred_budget_range: string | null;
  min_budget_lakhs: number | null;
  max_budget_lakhs: number | null;
}

export interface PlannerProfile {
  profile_id: string;
  business_name: string | null;
  logo_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  short_bio: string | null;
  years_experience: string | null;
  team_size: string | null;
  services: string[] | null;
  portfolio_image_1: string | null;
  portfolio_image_2: string | null;
  portfolio_image_3: string | null;
  portfolio_image_4: string | null;
}

export type EventStatus = 'Open' | 'Booked' | 'Completed' | 'Cancelled';

export interface CelebrateEvent {
  id: string;
  client_profile_id: string;
  event_type: string;
  title: string;
  status: EventStatus;
  proposal_count: number;
  selected_proposal_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'full_name' | 'phone'> | null;
}

export interface EventRequirement {
  id: string;
  event_id: string;
  guest_count: string;
  budget_range: string;
  min_budget_lakhs: number | null;
  max_budget_lakhs: number | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_image_url: string;
  additional_notes: string | null;
  services_required: string[];
  bride_name?: string | null;
  groom_name?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  venue_finalized?: string | null;
  birthday_person_name?: string | null;
  age?: string | null;
  theme?: string | null;
  house_address?: string | null;
  company_name?: string | null;
  corporate_event_type?: string | null;
  created_at: string;
}

export type ProposalStatus = 'Draft' | 'Submitted' | 'Accepted' | 'Rejected';

export interface Proposal {
  id: string;
  event_id: string;
  planner_profile_id: string;
  title: string;
  short_description: string;
  package_description: string;
  estimated_budget: string;
  estimated_budget_lakhs: number | null;
  proposal_design_image_url: string | null;
  canvas_required: boolean;
  status: ProposalStatus;
  submitted_at: string | null;
  status_changed_at: string;
  created_at: string;
  updated_at: string;
  planner_profiles?: Pick<PlannerProfile, 'profile_id' | 'business_name' | 'logo_url' | 'short_bio' | 'years_experience' | 'team_size' | 'services'> | null;
}

export type NotificationType = 'EVENT_CREATED' | 'PROPOSAL_SUBMITTED' | 'PROPOSAL_ACCEPTED' | 'PROPOSAL_REJECTED' | 'EVENT_BOOKED' | 'EVENT_COMPLETED' | 'SYSTEM';

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  related_event_id: string | null;
  related_proposal_id: string | null;
  created_at: string;
}

export interface OverlayCollection {
  id: string;
  planner_profile_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
}

export type AssetOrigin = 'uploaded' | 'optimized' | 'generated' | 'extracted';

export interface OverlayAsset {
  id: string;
  collection_id: string;
  planner_profile_id: string;
  category: string;
  asset_type: string;
  asset_origin: AssetOrigin;
  name: string;
  image_url: string | null;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
}
