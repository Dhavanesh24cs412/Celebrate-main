# Celebrate Master Project Context Export

## 1. Project Overview

* **Project Name:** Celebrate
* **Vision:** To create a seamless, transparent, and highly engaging anonymous marketplace that connects clients seeking perfect events with top-tier event planners, utilizing an AI-assisted design canvas.
* **Problem Statement:** Finding the right event planner is tedious, heavily biased by brand name, and lacks visual proposal clarity. Clients struggle to evaluate planners fairly, and talented new planners struggle to win bids against established names.
* **Business Model:** A specialized two-sided marketplace model taking a percentage/fee for successful bookings.
* **Marketplace Model:** Anonymous proposal-based marketplace. Planners bid on open events. Identities (names, logos, contact info) are strictly hidden during the proposal phase and are only revealed upon client acceptance.
* **Key Differentiators:** Anonymous bidding (ensures merit-based selection), AI Design Canvas integration (allowing planners to visually mock up venues), and a strict cap of 15 proposals per event to prevent spam and decision fatigue.

## 2. Current Architecture

### Frontend
* **Framework:** React 19 (TypeScript) via Vite 8
* **Libraries:** `react-router-dom`, `lucide-react`, `tailwindcss` (v4 with `@tailwindcss/vite`)
* **Routing:** Client-side routing with strictly enforced `ProtectedRoute` guards ensuring flow adherence.
* **State Management:** React Context API (`AuthContext`) handling global session and profile states.

### Backend
* **Supabase Usage:** Full Backend-as-a-Service architecture handling DB, Auth, and Storage.
* **Authentication:** Supabase Auth strictly locked to Google OAuth.
* **Storage:** Supabase Storage buckets configured with specific Row Level Security (RLS) rules.
* **Database:** PostgreSQL (managed by Supabase).

## 3. Authentication System

* **Google OAuth flow:** Single Sign-On (SSO) using Google exclusively. Email/password registration and login are strictly prohibited.
* **Role Selection flow:** After initial Google authentication, if the user has no profile, they are forced into `/select-role` to choose between `client` or `planner`. A user can hold only one role per Google account.
* **Client onboarding flow:** Forces the user to input their Phone, City, Preferred Event Types (multi-select), and Preferred Budget Range, along with an Avatar upload before granting dashboard access.
* **Planner onboarding flow:** Highly structured form collecting Business Name, Logo, Phone, Location, valid Instagram URL, optional Website, Services (multi-select), Short Bio, Years Experience, Team Size, and exactly 4 Portfolio Image uploads.
* **Route protection logic:** `ProtectedRoute` intercepts all authenticated traffic. It checks `onboarding_completed`. Unfinished users are locked to `/onboarding/*`. Finished clients are locked out of `/planner/*` routes and vice versa.
* **Session persistence logic:** `AuthContext` utilizes `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange` to continuously listen for token refresh events, persisting the user across browser restarts and tab refreshes seamlessly without flashing empty states.

## 4. Database Schema

### Table: profiles
* **Columns & Data Types:**
  * `id` (UUID, Primary Key, Default `uuid_generate_v4()`)
  * `user_id` (UUID, UNIQUE, Not Null)
  * `role` (user_role ENUM: 'client', 'planner', Not Null)
  * `full_name` (TEXT)
  * `avatar_url` (TEXT)
  * `phone` (TEXT)
  * `city` (TEXT)
  * `onboarding_completed` (BOOLEAN, Default `false`)
  * `created_at` (TIMESTAMPTZ, Default `NOW()`)
* **Constraints:** Foreign Key `user_id` references `auth.users(id)` ON DELETE CASCADE.
* **RLS Policies:** Select, Update, Insert allowed ONLY when `auth.uid() = user_id`.

### Table: client_profiles
* **Columns & Data Types:**
  * `profile_id` (UUID, Primary Key)
  * `preferred_event_types` (TEXT[])
  * `preferred_budget_range` (TEXT)
* **Constraints:** Foreign Key `profile_id` references `profiles(id)` ON DELETE CASCADE.
* **RLS Policies:** Select, Update, Insert allowed ONLY when `auth.uid()` matches the parent `profiles.user_id`.

### Table: planner_profiles
* **Columns & Data Types:**
  * `profile_id` (UUID, Primary Key)
  * `business_name` (TEXT)
  * `logo_url` (TEXT)
  * `instagram_url` (TEXT)
  * `website_url` (TEXT)
  * `short_bio` (TEXT)
  * `years_experience` (TEXT)
  * `team_size` (TEXT)
  * `services` (TEXT[])
  * `portfolio_image_1` (TEXT)
  * `portfolio_image_2` (TEXT)
  * `portfolio_image_3` (TEXT)
  * `portfolio_image_4` (TEXT)
* **Constraints:** Foreign Key `profile_id` references `profiles(id)` ON DELETE CASCADE.
* **RLS Policies:** Select, Update, Insert allowed ONLY when `auth.uid()` matches the parent `profiles.user_id`.

### Table: events
* **Columns:** `id`, `client_profile_id`, `event_type`, `title`, `status`, `proposal_count`, `selected_proposal_id`, `created_at`, `updated_at`
* **Status Values:** Open, Booked, Completed, Cancelled
* **Constraints:** `proposal_count <= 15`
* **Relationships:** `client_profile_id` → `profiles.id`
* **RLS:** Clients can manage their own events. Planners can view `Open` events, OR any event (regardless of status) if they own a proposal linked to it.

### Table: event_requirements
* **Columns:** `event_id`, `guest_count`, `budget_range`, `venue_name`, `venue_address`, `venue_image_url`, `additional_notes`
* **Additional Dynamic Fields:** `bride_name`, `groom_name`, `event_date`, `event_time`, `venue_finalized`, `birthday_person_name`, `age`, `theme`, `house_address`, `company_name`, `corporate_event_type`, `created_at`
* **Relationship:** One-to-One with `events`

### Table: proposals
* **Columns & Data Types:**
  * `id` (UUID, Primary Key)
  * `event_id` (UUID, FK to events)
  * `planner_profile_id` (UUID, FK to planner_profiles)
  * `title` (TEXT)
  * `short_description` (TEXT)
  * `package_description` (TEXT)
  * `estimated_budget` (TEXT)
  * `proposal_design_image_url` (TEXT, Nullable)
  * `canvas_required` (BOOLEAN, Default false)
  * `status` (TEXT: 'Draft', 'Submitted', 'Accepted', 'Rejected')
  * `submitted_at` (TIMESTAMPTZ)
  * `status_changed_at` (TIMESTAMPTZ, auto-updates on status change)
  * `created_at`, `updated_at` (TIMESTAMPTZ)
* **Constraints:** 
  * `unique_active_proposal_per_planner`: A planner can have a maximum of 1 non-Draft proposal per event.
  * `unique_draft_proposal_per_planner`: A planner can have a maximum of 1 Draft proposal per event.
* **RLS Policies:**
  * Planners can INSERT and SELECT their own proposals.
  * Planners can UPDATE their own proposals ONLY if status is 'Draft'.
  * Clients can SELECT proposals where `event_id` belongs to them AND status != 'Draft'.
* **Triggers & Lifecycle Rules:**
  * Maximum 15 `Submitted` proposals enforced via BEFORE INSERT/UPDATE trigger.
  * Drafts do not count towards the 15-proposal limit.
  * Changing to `Submitted` increments `events.proposal_count`.
  * Changing to `Rejected` decrements `events.proposal_count`.
  * Changing to `Accepted` marks event as `Booked`, updates `selected_proposal_id`, and triggers **Proposal Acceptance Lock** (automatically rejecting all other `Submitted` proposals for that event).

### Migrations Executed
* Executed direct Supabase SQL migrations to alter `years_experience` and `team_size` in `planner_profiles` from INTEGER to TEXT to accommodate string ranges (e.g., "5-10").
* Executed direct SQL migration to append `preferred_budget_range` (TEXT) to `client_profiles`.

## 5. Storage Architecture

* **avatars**: Public bucket storing client profile photos.
* **planner-logos**: Public bucket storing planner business logos.
* **planner-portfolios**: Public bucket storing exactly 4 high-res portfolio images per planner.
* **Path Structure**: Files are uploaded to `<auth.uid()>/<filename>-<random_string>.<extension>` (e.g., `1234-uuid/logo-0.98123.jpg`). This ensures absolute path isolation per user.
* **Security Model**: Strict RLS policies on `storage.objects` enforcing that users can only manage their own files using the condition: `(bucket_id = 'bucket_name' AND auth.uid()::text = owner_id)`.

## event-venues
**Purpose:** Store venue and dais images uploaded by clients.
**Used later by:**
* Planner Marketplace
* Design Canvas
* Proposal System

## 6. Completed Features

* **Google Authentication Setup**
  * Purpose: Restrict sign-up to Google SSO.
  * Routes: `/login`
  * Components: `Login.tsx`, `AuthContext.tsx`
  * Database: Supabase Auth linking.
* **Role Selection Engine**
  * Purpose: Assign a strict, permanent role upon account creation.
  * Routes: `/select-role`
  * Components: `SelectRole.tsx`, `Card.tsx`, `Button.tsx`
  * Database: `INSERT` into `profiles` and initialized rows in `client_profiles` or `planner_profiles`.
* **Client Onboarding Flow**
  * Purpose: Capture required client details to complete profile.
  * Routes: `/onboarding/client`
  * Components: `ClientOnboarding.tsx`, `Input.tsx`, Image upload logic.
  * Database: `UPDATE` to `profiles` and `client_profiles`. Upload to `avatars` bucket.
* **Planner Onboarding Flow**
  * Purpose: Capture extensive business, portfolio, and service details.
  * Routes: `/onboarding/planner`
  * Components: `PlannerOnboarding.tsx`, Custom multi-select chips, Custom range selectors.
  * Database: `UPDATE` to `profiles` and `planner_profiles`. Uploads to `planner-logos` and `planner-portfolios`.

## Layout Foundation
* **Components:** `AppLayout`, `Sidebar`, `MobileBottomNav`, `Header`, `NotificationBell`, `StatCard`

## Dashboard Foundation
* Client Dashboard
* Planner Dashboard
* Real Supabase Data Fetching

## Event Architecture
* `events` table
* `event_requirements` table
* RLS policies active

## Event Creation Foundation
* Event Type Selection
* Dynamic Event Wizard
* Local Persistence
* Save Draft Support
* Venue Uploads

## 7. Current File Structure

```text
src/
├─ components/
│  ├─ layout/
│  │  ├─ AppLayout.tsx
│  │  ├─ Sidebar.tsx
│  │  ├─ MobileBottomNav.tsx
│  │  ├─ Header.tsx
│  ├─ ui/
│  │  ├─ Button.tsx
│  │  ├─ Card.tsx
│  │  ├─ EmptyState.tsx
│  │  ├─ ErrorState.tsx
│  │  ├─ Input.tsx
│  │  ├─ LoadingState.tsx
├─ contexts/
│  ├─ AuthContext.tsx
├─ lib/
│  ├─ supabase.ts
├─ pages/
│  ├─ Login.tsx
│  ├─ SelectRole.tsx
│  ├─ dashboards/
│  │  ├─ ClientDashboard.tsx
│  │  ├─ PlannerDashboard.tsx
│  ├─ events/
│  │  ├─ EventSelection.tsx
│  │  ├─ EventWizard.tsx
│  ├─ onboarding/
│  │  ├─ ClientOnboarding.tsx
│  │  ├─ PlannerOnboarding.tsx
├─ routes/
│  ├─ ProtectedRoute.tsx
├─ types/
│  ├─ index.ts
├─ App.tsx
├─ index.css
├─ main.tsx
```

## 8. Design System

* **Colors**:
  * Primary: Deep Plum `#5B2A86`
  * Secondary: `#E8AEB7`
  * Accent: `#F2C94C`
  * Background: `#FFF8F5`
  * Surface: `#FFFFFF`
  * Text: `#1F2937`
  * Success: `#10B981`
  * Warning: `#F59E0B`
* **Typography**: Headings strictly use `Poppins` (600/700 weights). Body text strictly uses `Inter` (400/500 weights).
* **Spacing**: Clean spacing with large touch targets prioritizing mobile usability.
* **Components**: Buttons feature rounded corners (`12-16px`), Cards feature rounded corners (`16px`) with soft drop shadows and thin borders.
* **Responsive Behavior**: Strictly mobile-first.
* **Desktop Layout Rules**: Forms max-width constrained (e.g., `max-w-2xl`) and centered.
* **Mobile Layout Rules**: Forms span full width. Call-to-action (CTA) buttons become sticky on the bottom edge (`fixed bottom-0`).

## 9. Marketplace Rules

* **Anonymous Marketplace Logic**: During the bidding phase, Planners submit proposals to events, but their business name, logo, URLs, and contact info are entirely obscured from the Client.
* **Client Visibility Restrictions**: Clients can see the proposals, the moodboards/designs, the price, and the bio, but cannot see *who* the planner is.
* **Planner Visibility Restrictions**: Planners can see the event details, venue, and budget, but cannot see the client's name or contact info.
* **Proposal Visibility Restrictions**: The system strictly enforces a maximum of 15 proposals per event to maintain high quality and prevent client fatigue.
* **Budget Visibility Rules**: Event budgets are fully visible to planners to ensure bids are realistic.
* **Event Visibility Rules**: `Open` events are visible to the entire planner marketplace. Once an event is `Booked`, it vanishes from the marketplace, but remains visible to planners who submitted a proposal for historical record-keeping.

## 10. Future Event Architecture

**Approved Workflow:**
1. Client Creates Event
2. ↓
3. Open Marketplace
4. ↓
5. All Planners Can View
6. ↓
7. Client Can Invite Specific Planners (Optional)
8. ↓
9. Maximum 15 Proposals Cap Hit
10. ↓
11. Client Reviews Anonymous Proposals
12. ↓
13. Client Selects Planner
14. ↓
15. Identities Revealed
16. ↓
17. Event Execution

**Event Statuses:**
* `Open`
* `Booked`
* `Completed`
* `Cancelled`

## 11. Overlay System Design

* **Overlay Collections**: Themed bundles of assets (e.g., "Vintage Wedding", "Neon Party").
* **Overlay Assets**: Individual PNGs/Vectors with transparent backgrounds representing props, lighting, furniture, and florals.
* **Categories**: Groupings for assets to ensure easy searching inside the canvas (e.g., Seating, Centerpieces, Lighting).
* **Upload Workflow**: Admin or verified vendors upload new high-quality transparent assets into the global library.
* **Future Canvas Integration**: These assets will directly populate the asset drawer in the AI Canvas.

## 12. Future Design Canvas Architecture

**Workflow Requirements:**
1. Venue Image Upload (Client provides empty venue photo)
2. ↓
3. Planner Opens Canvas (loads venue photo as background)
4. ↓
5. Overlay Assets Available (Planner drags and drops seating, lighting, etc.)
6. ↓
7. AI Assisted Decoration (AI blends lighting, shadows, and color matching for realism)
8. ↓
9. Final Design Generated (Exported as a high-res mockup)
10. ↓
11. Proposal Submission (Attached to the anonymous bid)

## 13. Routes

**Currently Implemented:**
* `/login` (Public)
* `/select-role` (Protected, Post-Auth)
* `/onboarding/client` (Protected, Client-only)
* `/onboarding/planner` (Protected, Planner-only)
* `/client/dashboard` (Protected, Client-only)
* `/planner/dashboard` (Protected, Planner-only)
* `/client/events` (Protected, Client-only)
* `/client/events/create` (Protected, Client-only)
* `/client/events/create/:eventType` (Protected, Client-only)
* `/client/proposals` (Protected, Client-only)
* `/client/events/:eventId/proposals` (Protected, Client-only)
* `/client/booked` (Protected, Client-only)
* `/client/events/:eventId` (Protected, Client-only)
* `/planner/marketplace` (Protected, Planner-only)
* `/planner/proposals/create/:eventId` (Protected, Planner-only)
* `/planner/submissions` (Protected, Planner-only)
* `/planner/projects` (Protected, Planner-only)
* `/planner/projects/:eventId` (Protected, Planner-only)

**Planned Routes:**
* `/planner/canvas/:id`

## 14. Environment Variables

* `VITE_SUPABASE_URL` - The exact Supabase project endpoint.
* `VITE_SUPABASE_ANON_KEY` - The exact Supabase anon/publishable key.
*(Note: These are currently hardcoded in `src/lib/supabase.ts` for scaffolding speed, but must be migrated to `.env` files).*

## 15. Known Technical Decisions

* **Supabase over Alternatives**: Selected for robust built-in Postgres RLS preventing the need for an intermediate Node.js server.
* **Google OAuth Only**: Eliminates password recovery flows and enforces higher user quality.
* **Tailwind CSS v4 Integration**: Adopted Vite's native `@tailwindcss/vite` pattern for modern performance.
* **Strict Role Segregation**: Database tables were explicitly separated into `client_profiles` and `planner_profiles` rather than a unified JSONB blob, optimizing for heavy typing and disparate data shapes.

## 16. Pending Features (Priority Order)

1. Overlay Library
2. Design Canvas MVP
3. Event Completion Workflow

## 17. Current Development State

* **What is Complete:**
  * Authentication
  * Role Selection
  * Client Onboarding
  * Planner Onboarding
  * Layout Foundation
  * Dashboard Foundation
  * Event Architecture
  * Event Creation Workflow
  * Client My Events
  * Planner Marketplace
  * Proposal Database Architecture
  * Proposal Submission Workflow
  * Client Proposal Review
  * Identity Reveal Workflow
  * Notification Framework
  * Overlay Library Foundation

* **What Remains:**
  * Design Canvas MVP
  * Event Completion Workflow

## 18. Recommended Next Development Steps

* **Sprint 1**: Design Canvas MVP
* **Sprint 2**: Event Completion Workflow
* **Sprint 3**: Advanced AI Capabilities

*Note: The marketplace transaction is not considered complete until a client can review anonymous proposals, accept a proposal, and trigger identity reveal.*

## 19. Approved Event Requirement Architecture

**Approved Event Types:**
* Wedding
* Reception
* Engagement
* Anniversary
* Birthday Celebration
* Housewarming
* Seemantham
* Naming Ceremony
* Corporate Event

**Approved Fields and Requirements for Each Event:**
* Venue/Dais Image Upload: Required (Client must provide an empty venue or stage photo for the planner's design canvas).
* Budget Requirement: Required (Clients must state their total budget).
* Guest Count Requirement: Required (Clients must state the expected number of guests).
* Additional Notes: Optional (Free text for any custom requests or theme ideas).

**Multi-step Wizard Workflow:**
1. Event Type Selection -> 2. Guest Count & Budget -> 3. Venue Details & Image Upload -> 4. Review & Open to Marketplace.

## 20. Proposal Architecture

**Proposal Lifecycle:**
* Draft Proposal (Visible only to owner)
* ↓
* Submitted Proposal (Visible to owner and client)
* ↓
* Accepted Proposal (Visible to owner and client)
* OR
* Submitted Proposal
* ↓
* Rejected Proposal (Visible to owner and client)

**Rules:**
* Maximum of 15 proposals allowed per event to maintain high quality. Drafts do not count.
* Planners are limited to 1 Submitted proposal per event.
* **Proposal Draft Uniqueness Rule**: A planner is strictly limited to 1 Draft proposal per event. Database safely enforces an UPSERT fallback to prevent race conditions during draft saves.
* If a client rejects a proposal, it frees up a slot, creating a vacancy for a new proposal.
* **Proposal Acceptance Lock**: Accepting a proposal automatically triggers a DB rule to reject all other competing `Submitted` proposals.
* **Proposal Acceptance Validation**: The application strictly validates that an event is `Open` and the proposal is `Submitted` before attempting to write an Acceptance update to the database.
* **Stable Anonymous Planner Labels**: Clients view proposals mapped to a stable "Planner #N" label per event. This index is generated purely on the frontend by mapping unique `planner_profile_id`s. Planners' actual identities remain completely hidden prior to acceptance.
* **Proposal Comparison View**: Clients are presented with a lightweight comparison table summarizing budgets and status before drilling down into proposal details.
* Planner identity (name, logo, contact info) remains completely hidden before acceptance.
* Client identity (name, contact info) remains completely hidden before acceptance.
* **Identity Reveal Access Rule**: Identity visibility is granted exclusively through the `selected_proposal_id` relationship and never through event status alone. A planner only gains access if they own the matching accepted proposal. Rejected planners never gain access.

## 21. Dashboard Architecture

**Client Navigation:**
* Home
* My Events
* Proposals
* Booked Events
* Profile
* Notifications

**Planner Navigation:**
* Home
* Marketplace
* Overlays
* Submissions
* Projects
* Profile
* Notifications

**Layout Rules:**
* Desktop: Left Sidebar navigation.
* Mobile: Bottom Navigation bar.

## 22. Planner Marketplace Feed Rules

**Filters:**
* Location Filter
* Budget Filter
* Event Type Filter
* Status Filter

**Visibility Rules:**
* **Planner Can View:** Event Type, Budget Range, Guest Count, Venue Information, Venue Image.
* **Planner Cannot View:** Client Identity, Client Contact Information.

## 23. Overlay System Detailed Architecture

**Overlay Collections (Examples):**
* Wedding Curtains
* Floral Arches
* Lighting
* Stage Decor
* Premium Backdrops

**Architecture:**
* **Overlay Assets:** Individual items belonging to specific collections.
* **Asset Categories:** Broad categories mapping assets (e.g., "Floral", "Furniture", "Lighting").
* **Collection Management:** Admin/System management of themed bundles.
* **Asset Upload Workflow:** Vendor/Admin interface to upload transparent PNG assets into Supabase storage.
* **Future Canvas Integration:** Assets will be fetchable directly into the Design Canvas side-panel during proposal creation.

## 24. Design Canvas Business Rules

**Workflow:**
1. Client uploads venue/dais image
2. ↓
3. Planner opens canvas
4. ↓
5. Venue image loads automatically as background
6. ↓
7. Planner uses overlay assets to design the stage/venue
8. ↓
9. AI assists with depth, lighting, and realism
10. ↓
11. Final design generated and flattened
12. ↓
13. Proposal submitted with the design attached

**Rule:** Proposal submission strictly requires a decorated output image from the canvas.

## 25. Planned Future Database Tables

**Reserved Architecture:**
* `overlay_collections`: Groupings for design assets (e.g., "Vintage Themes").
* `overlay_assets`: Individual design elements (URLs to transparent PNGs in storage). Linked to `overlay_collections`.
* `proposal_designs`: Stores the final flattened design images generated from the Canvas. Linked to `proposals`.

## 26. Notification Framework

**Architecture:**
* **Database Table:** `notifications` table stores alerts with `read_at` tracking and robust `action_url` pathing for automatic frontend navigation.
* **Indexes:** Performance indexes active on `profile_id`, `is_read`, and `created_at` to prevent sequential scanning.
* **RLS Policies:** Select and Update explicitly restricted to `auth.uid()` mapped through the `profiles` table.
* **Triggers:** Autonomous Postgres triggers generate alerts for `EVENT_CREATED`, `PROPOSAL_SUBMITTED`, `PROPOSAL_ACCEPTED`, `PROPOSAL_REJECTED`, and `EVENT_BOOKED`.
* **Realtime System:** Utilizes `postgres_changes` mapped strictly to user-scoped channels (`notifications:${profile.id}`) eliminating interval polling. 
* **Connection Lifecycle:** Connections are deeply scrubbed utilizing `supabase.removeChannel(channel)` to guarantee cleanup during fast route changes or React Strict Mode re-mounts.
* **Mark as Read Behavior:** Actions immediately timestamp `read_at` = `NOW()` and toggle `is_read` = `true`.
