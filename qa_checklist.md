# Celebrate Manual QA Testing Roadmap

## 1. Testing Roadmap
The objective of this QA cycle is to systematically verify all existing features in the Celebrate application to ensure zero regressions before introducing the Design Canvas or further major features.

The roadmap is structured chronologically by feature dependency:
1. **Phase 1: Authentication & Session Management** (Foundation) - *Already Completed*
2. **Phase 2: Role Selection & Onboarding** (Identity creation & persistence)
3. **Phase 3 & 4: Client Event Management** (Creating the demand)
4. **Phase 5: Planner Marketplace** (Discovering the demand)
5. **Phase 6 & 7: Proposal Workflow** (Planner pitching)
6. **Phase 8 & 9: Review & Identity Reveal** (Client selection and locking)
7. **Phase 10: Notifications** (Realtime awareness)
8. **Phase 11: Overlay Library** (Planner asset management)

---

## 2. Phase-by-Phase Checklist

### Phase 1 — Authentication & Session Management
*(Note: Already verified by user. Test cases preserved for regression documentation)*

* **TEST-1.1**: Login existing user -> Expected: Success, redirects to dashboard. (Severity: Critical)
* **TEST-1.2**: Login new user -> Expected: Success, redirects to `/select-role`. (Severity: Critical)
* **TEST-1.3**: Logout -> Expected: Success, redirects to `/login`, session cleared. (Severity: Critical)
* **TEST-1.4**: Session restore -> Expected: Closing and reopening browser keeps user logged in. (Severity: Critical)
* **TEST-1.5**: Unauthorized access protection -> Expected: Direct navigation to `/client/dashboard` unauthenticated redirects to `/login`. (Severity: Critical)

### Phase 2 — Role Selection & Onboarding

* **TEST-2.1: Client Onboarding Core Flow**
  * **Feature**: Client Onboarding
  * **Preconditions**: New user authenticated, role selected as 'Client', on `/onboarding/client`.
  * **Steps**: Fill required text fields, select event type, select budget, choose avatar image, click Complete Profile.
  * **Expected Result**: Success. Redirected to Client Dashboard. `profiles` and `client_profiles` tables updated.
  * **Severity**: Critical

* **TEST-2.2: Planner Onboarding Core Flow**
  * **Feature**: Planner Onboarding
  * **Preconditions**: New user authenticated, role selected as 'Planner', on `/onboarding/planner`.
  * **Steps**: Fill required text fields, select services, upload logo, upload exactly 4 portfolio images, click Publish Profile.
  * **Expected Result**: Success. Redirected to Planner Dashboard. Tables updated.
  * **Severity**: Critical

* **TEST-2.3: Onboarding Validation**
  * **Feature**: Validation
  * **Preconditions**: User on any onboarding page.
  * **Steps**: Submit form with missing fields or oversized files (>5MB).
  * **Expected Result**: Validation errors block submission and highlight fields.
  * **Severity**: High

* **TEST-2.4: Onboarding File Uploads (Immediate Architecture)**
  * **Feature**: File Uploads
  * **Preconditions**: User on onboarding page.
  * **Steps**: Select an image file.
  * **Expected Result**: "Uploading..." state appears, followed by the image preview. URL is fetched securely.
  * **Severity**: Critical

* **TEST-2.5: Onboarding State Persistence (Refresh)**
  * **Feature**: State Persistence
  * **Preconditions**: User has partially filled onboarding form and uploaded 1 image.
  * **Steps**: Hard refresh the browser (`F5`).
  * **Expected Result**: Text fields remain populated. The uploaded image preview re-renders instantly without re-uploading.
  * **Severity**: High

* **TEST-2.6: Onboarding State Persistence (Tab Switch)**
  * **Feature**: State Persistence
  * **Preconditions**: User has partially filled onboarding form.
  * **Steps**: Switch to another browser tab, wait 5 seconds, switch back.
  * **Expected Result**: No loading screen interrupt. Data perfectly intact.
  * **Severity**: High

* **TEST-2.7: Duplicate Onboarding Prevention**
  * **Feature**: Completion Flow
  * **Preconditions**: User has completed onboarding and is on Dashboard.
  * **Steps**: Manually change URL to `/onboarding/client` or `/onboarding/planner`.
  * **Expected Result**: Immediately redirected back to the Dashboard.
  * **Severity**: Medium

### Phase 3 — Client Event Creation

* **TEST-3.1: Event Creation Workflow**
  * **Feature**: Event Creation
  * **Preconditions**: Client is on Dashboard.
  * **Steps**: Click "Create New Event", fill out wizard steps, upload optional venue/reference images, submit.
  * **Expected Result**: Event successfully created in `events` table with status `open`. Redirected to Event Details or My Events.
  * **Severity**: Critical

* **TEST-3.2: Event Draft Behavior**
  * **Feature**: Event Draft
  * **Preconditions**: Client is in Event Wizard.
  * **Steps**: Fill step 1, refresh page.
  * **Expected Result**: Step 1 data is restored from local storage.
  * **Severity**: Medium

### Phase 4 — Client My Events

* **TEST-4.1: Event Listing & Details**
  * **Feature**: View Details
  * **Preconditions**: Client has created at least 2 events.
  * **Steps**: Navigate to "My Events", click an event card.
  * **Expected Result**: List displays events accurately. Clicking opens detailed view.
  * **Severity**: High

* **TEST-4.2: Edit & Delete Event**
  * **Feature**: Edit / Delete
  * **Preconditions**: Client views an `open` event with NO proposals.
  * **Steps**: Click Edit, modify title, save. Click Delete.
  * **Expected Result**: Edits persist. Deletion removes the event from the list.
  * **Severity**: High

### Phase 5 — Planner Marketplace

* **TEST-5.1: Open Event Visibility & Anonymity**
  * **Feature**: Marketplace Anonymity
  * **Preconditions**: Planner navigates to Marketplace. Client has an `open` event.
  * **Steps**: View the event card in Marketplace.
  * **Expected Result**: Event is visible. Client's name/contact info is hidden or anonymized.
  * **Severity**: Critical

* **TEST-5.2: Search, Filters & Sorting**
  * **Feature**: Filters/Sorting
  * **Preconditions**: Multiple open events exist.
  * **Steps**: Apply location/budget filters, search by keyword, sort by date.
  * **Expected Result**: List updates instantly and accurately reflects the filter criteria.
  * **Severity**: Medium

### Phase 6 — Proposal System

* **TEST-6.1: Draft Creation & Editing**
  * **Feature**: Draft Creation
  * **Preconditions**: Planner clicks "Submit Proposal" on an open event.
  * **Steps**: Fill out proposal details, click "Save as Draft". Leave page, return to Submissions.
  * **Expected Result**: Proposal appears as `draft`. User can click it to resume editing.
  * **Severity**: High

* **TEST-6.2: Submission & Locking**
  * **Feature**: Submission
  * **Preconditions**: Planner has a `draft` proposal.
  * **Steps**: Complete all fields and click "Submit Proposal".
  * **Expected Result**: Status changes to `submitted`. Form becomes read-only. Edits are no longer allowed.
  * **Severity**: Critical

* **TEST-6.3: Duplicate Submission Prevention**
  * **Feature**: Draft Uniqueness
  * **Preconditions**: Planner has submitted a proposal for Event X.
  * **Steps**: Return to Marketplace, attempt to submit another proposal for Event X.
  * **Expected Result**: Button is disabled or redirects to existing submission. Cannot create two proposals for one event.
  * **Severity**: High

### Phase 7 — Planner Submissions

* **TEST-7.1: Submission State Accuracy**
  * **Feature**: Submission Tracking
  * **Preconditions**: Planner has multiple proposals (`draft`, `submitted`, `rejected`).
  * **Steps**: View "My Submissions" tab.
  * **Expected Result**: Badges accurately reflect current state. Rejected proposals show read-only.
  * **Severity**: Medium

### Phase 8 — Client Proposal Review

* **TEST-8.1: Proposal Visibility & Anonymity**
  * **Feature**: Anonymous Labels
  * **Preconditions**: Client opens an event with pending proposals.
  * **Steps**: View proposal list.
  * **Expected Result**: Proposals appear as "Planner A", "Planner B". Planner's real name/logo is completely hidden.
  * **Severity**: Critical

* **TEST-8.2: Acceptance Workflow**
  * **Feature**: Acceptance Flow
  * **Preconditions**: Client has 3 proposals.
  * **Steps**: Client accepts "Planner B" proposal.
  * **Expected Result**: Planner B's proposal becomes `accepted`. Other 2 proposals automatically become `rejected`. Event status becomes `booked`.
  * **Severity**: Critical

### Phase 9 — Identity Reveal Workflow

* **TEST-9.1: Post-Booking Identity Reveal**
  * **Feature**: Identity Reveal
  * **Preconditions**: Client has accepted Planner B's proposal.
  * **Steps**: Client views booked event details. Planner B views project details.
  * **Expected Result**: Client can now see Planner B's real name, portfolio, and contact info. Planner B can see Client's real name and contact info.
  * **Severity**: Critical

* **TEST-9.2: Rejected Planner Restrictions**
  * **Feature**: RLS Enforcement
  * **Preconditions**: Planner A was rejected.
  * **Steps**: Planner A views their rejected submission.
  * **Expected Result**: Planner A still cannot see the Client's real identity or contact info.
  * **Severity**: Critical

### Phase 10 — Notifications

* **TEST-10.1: Realtime Synchronization**
  * **Feature**: Realtime Updates
  * **Preconditions**: Client has UI open. Planner submits a proposal.
  * **Steps**: Wait a few seconds.
  * **Expected Result**: Client receives a realtime notification badge. Notification list updates without refreshing.
  * **Severity**: High

* **TEST-10.2: Mark as Read Behavior**
  * **Feature**: Mark Read
  * **Preconditions**: User has 3 unread notifications.
  * **Steps**: Click one notification. Then click "Mark All Read".
  * **Expected Result**: Unread count drops to 2, then to 0. Visual indicators update accordingly.
  * **Severity**: Low

### Phase 11 — Overlay Library

* **TEST-11.1: Collection & Asset Management**
  * **Feature**: Collection CRUD
  * **Preconditions**: Planner on Overlay Manager page.
  * **Steps**: Create collection, upload 3 assets (PNG/SVG) setting different categories. Delete 1 asset.
  * **Expected Result**: Collection and assets persist accurately. Thumbnails load. Deletion removes file from bucket.
  * **Severity**: High

* **TEST-11.2: Cross-Planner Isolation (Security)**
  * **Feature**: Isolation
  * **Preconditions**: Planner A creates "Floral overlays". Planner B logs in.
  * **Steps**: Planner B views Overlay Manager.
  * **Expected Result**: Planner B cannot see Planner A's overlays. Attempting to directly fetch Planner A's collection via API fails (RLS protection).
  * **Severity**: Critical

---

## 3. Critical Path Tests
If any of these tests fail, development MUST halt to address the regression immediately, as core application logic is compromised:
1. **TEST-2.1 / 2.2**: Role Onboarding Core Flow
2. **TEST-3.1**: Event Creation Workflow
3. **TEST-5.1**: Marketplace Anonymity
4. **TEST-6.2**: Proposal Submission & Locking
5. **TEST-8.2**: Proposal Acceptance & Auto-Rejection
6. **TEST-9.1 / 9.2**: Identity Reveal & Privacy Boundaries

## 4. Recommended Bug-Fix Order
If failures are encountered, fix them strictly in this dependency order:
1. **Security & Privacy (RLS/Anonymity)**: Fix anonymity leaks in Marketplace or Reveal phases immediately.
2. **Database State (CRUD)**: Fix anything preventing Events, Profiles, or Proposals from being inserted or updated.
3. **Lifecycle States**: Fix bugs where status enums (`open` -> `booked`, `submitted` -> `accepted`) fail to transition.
4. **Data Persistence**: Fix forms losing data on refresh or tab switch (like the recent Onboarding patch).
5. **UI / Polish**: Fix filtering, sorting, responsive layout, or notification read statuses last.
