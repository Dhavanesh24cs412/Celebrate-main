import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

import { Login } from './pages/Login';
import { SelectRole } from './pages/SelectRole';
import { ClientOnboarding } from './pages/onboarding/ClientOnboarding';
import { PlannerOnboarding } from './pages/onboarding/PlannerOnboarding';

import { AppLayout } from './components/layout/AppLayout';
import { ClientDashboard } from './pages/dashboards/ClientDashboard';
import { PlannerDashboard } from './pages/dashboards/PlannerDashboard';
import { EventSelection } from './pages/events/EventSelection';
import { EventWizard } from './pages/events/EventWizard';
import { ClientMyEvents } from './pages/events/ClientMyEvents';
import { PlannerMarketplace } from './pages/events/PlannerMarketplace';
import { ProposalWizard } from './pages/events/ProposalWizard';
import { PlannerMySubmissions } from './pages/events/PlannerMySubmissions';
import { ClientProposals } from './pages/events/ClientProposals';
import { ProposalReview } from './pages/events/ProposalReview';
import { ClientBookedEvents } from './pages/events/ClientBookedEvents';
import { ClientEventDetails } from './pages/events/ClientEventDetails';
import { PlannerProjects } from './pages/events/PlannerProjects';
import { PlannerProjectDetails } from './pages/events/PlannerProjectDetails';
import { PlannerOverlays } from './pages/events/PlannerOverlays';
import { Notifications } from './pages/Notifications';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes without Layout (Onboarding) */}
          <Route element={<ProtectedRoute requireOnboarding={false} />}>
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/onboarding/client" element={<ClientOnboarding />} />
            <Route path="/onboarding/planner" element={<PlannerOnboarding />} />
          </Route>

          {/* Shared Authenticated Routes with Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>

          {/* Client Routes with Layout */}
          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route element={<AppLayout />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              {/* Future Client Routes Go Here */}
              <Route path="/client/events/create" element={<EventSelection />} />
              <Route path="/client/events/create/:eventType" element={<EventWizard />} />
              <Route path="/client/events" element={<ClientMyEvents />} />
              <Route path="/client/events/:eventId" element={<ClientEventDetails />} />
              <Route path="/client/proposals" element={<ClientProposals />} />
              <Route path="/client/events/:eventId/proposals" element={<ProposalReview />} />
              <Route path="/client/booked" element={<ClientBookedEvents />} />
              <Route path="/client/profile" element={<div>Profile Component Placeholder</div>} />
              <Route path="/client/*" element={<Navigate to="/client/dashboard" replace />} />
            </Route>
          </Route>

          {/* Planner Routes with Layout */}
          <Route element={<ProtectedRoute allowedRoles={['planner']} />}>
            <Route element={<AppLayout />}>
              <Route path="/planner/dashboard" element={<PlannerDashboard />} />
              <Route path="/planner/marketplace" element={<PlannerMarketplace />} />
              <Route path="/planner/proposals/create/:eventId" element={<ProposalWizard />} />
              <Route path="/planner/submissions" element={<PlannerMySubmissions />} />
              <Route path="/planner/projects" element={<PlannerProjects />} />
              <Route path="/planner/projects/:eventId" element={<PlannerProjectDetails />} />
              {/* Future Planner Routes Go Here */}
              <Route path="/planner/overlays" element={<PlannerOverlays />} />
              <Route path="/planner/profile" element={<div>Profile Component Placeholder</div>} />
              <Route path="/planner/*" element={<Navigate to="/planner/dashboard" replace />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
