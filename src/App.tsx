import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth, NormalRole } from './context/AuthContext';
import { canAccess, type Workspace } from './utils/permissions';
import { AppShell } from './components/layout/AppShell';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Onboarding = lazy(() => import('./pages/auth/Onboarding'));
const OnboardingComplete = lazy(() => import('./pages/auth/OnboardingComplete'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const FounderDashboard = lazy(() => import('./pages/founder/Dashboard'));
const InvestorDashboard = lazy(() => import('./pages/investor/Dashboard'));
const DealRoom = lazy(() => import('./pages/shared/DealRoom'));
const Profile = lazy(() => import('./pages/shared/Profile'));
const NDAFlow = lazy(() => import('./pages/shared/NDAFlow'));
const NegotiationPanel = lazy(() => import('./pages/shared/NegotiationPanel'));
const PremiumUpgrade = lazy(() => import('./pages/shared/PremiumUpgrade'));
const MilestoneTracking = lazy(() => import('./pages/shared/MilestoneTracking'));
const InvestorPreferences = lazy(() => import('./pages/investor/InvestorPreferences'));
const SavedOpportunities = lazy(() => import('./pages/investor/SavedOpportunities'));
const Portfolio = lazy(() => import('./pages/investor/Portfolio'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminVerification = lazy(() => import('./pages/admin/VerificationQueue'));
const AdminBusinesses = lazy(() => import('./pages/admin/Businesses'));
const AdminApplications = lazy(() => import('./pages/admin/Applications'));
const AdminTeams = lazy(() => import('./pages/admin/Teams'));
const AdminDeals = lazy(() => import('./pages/admin/Deals'));
const AdminInvestmentOversight = lazy(() => import('./pages/admin/InvestmentOversight'));
const AdminFinancialReports = lazy(() => import('./pages/admin/FinancialReports'));
const AdminReputation = lazy(() => import('./pages/admin/Reputation'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const AdminTeamManagement = lazy(() => import('./pages/admin/TeamManagement'));
const AdminMatchingEngine = lazy(() => import('./pages/admin/MatchingEngine'));
const AdminAdvancedAnalytics = lazy(() => import('./pages/admin/AdvancedAnalytics'));
const AdminNotificationTemplates = lazy(() => import('./pages/admin/NotificationTemplates'));
const ReadinessScore = lazy(() => import('./pages/founder/ReadinessScore'));
const CreateBusiness = lazy(() => import('./pages/founder/CreateBusiness'));
const BusinessProfile = lazy(() => import('./pages/founder/BusinessProfile'));
const MyBusinesses = lazy(() => import('./pages/founder/MyBusinesses'));
const DiscoverInvestors = lazy(() => import('./pages/founder/DiscoverInvestors'));
const DiscoverProfessionals = lazy(() => import('./pages/founder/DiscoverProfessionals'));
const DiscoverBusinesses = lazy(() => import('./pages/shared/DiscoverBusinesses'));
const ProfessionalDashboard = lazy(() => import('./pages/professional/Dashboard'));
const ProfessionalProfileEditor = lazy(() => import('./pages/professional/ProfileEditor'));
const ProfessionalApplications = lazy(() => import('./pages/professional/Applications'));
const Connections = lazy(() => import('./pages/shared/Connections'));
const Reputation = lazy(() => import('./pages/shared/Reputation'));
const FeedbackFlow = lazy(() => import('./pages/shared/FeedbackFlow'));
const SettingsPage = lazy(() => import('./pages/shared/Settings'));

function PageLoadingFallback() {
  return <div className="min-h-[240px] flex items-center justify-center text-[color:var(--vv-text-tertiary)] text-sm">Loading...</div>;
}

function SessionGuard() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to={location.pathname.startsWith('/app/admin') ? '/admin-login' : '/login'} replace />;
  return <Outlet />;
}

function NormalUserGuard() {
  const location = useLocation();
  const { isAuthenticated, isAdmin, session } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/app/admin/dashboard" replace />;
  if (!session.onboardingComplete && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function RoleGuard({ role }: { role: NormalRole }) {
  const { session } = useAuth();
  const workspace = role as Workspace;
  if (!session.roles.includes(role) || !canAccess(workspace, 'workspace.view')) return <Navigate to={`/app/${session.activeRole}/dashboard`} replace />;
  return <Outlet />;
}

function AdminGuard() {
  const { isAuthenticated, isAdmin, session } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin-login" replace />;
  if (!isAdmin) return <Navigate to={`/app/${session.activeRole}/dashboard`} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Onboarding (post-registration, pre-dashboard) */}
        <Route element={<NormalUserGuard />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/complete" element={<OnboardingComplete />} />
        </Route>

        {/* Authenticated app */}
        <Route element={<SessionGuard />}>
        <Route path="/app" element={<AppShell />}>
          <Route element={<NormalUserGuard />}>
          {/* Shared */}
          <Route path="profile" element={<Profile />} />
          <Route path="businesses/:id" element={<BusinessProfile />} />

          {/* Shared */}
          <Route path="deal-room" element={<DealRoom />} />
          <Route path="nda/:id" element={<NDAFlow />} />
          <Route path="nda" element={<NDAFlow />} />
          <Route path="negotiation/:id" element={<NegotiationPanel />} />
          <Route path="negotiation" element={<NegotiationPanel />} />
          <Route path="milestones" element={<MilestoneTracking />} />
          <Route path="milestones/:id" element={<MilestoneTracking />} />
          <Route path="feedback" element={<FeedbackFlow />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="premium" element={<PremiumUpgrade />} />

          <Route element={<RoleGuard role="founder" />}>
            <Route path="founder/dashboard" element={<FounderDashboard />} />
            <Route path="founder/businesses" element={<MyBusinesses />} />
            <Route path="founder/businesses/new" element={<CreateBusiness />} />
            <Route path="founder/businesses/:id" element={<BusinessProfile />} />
            <Route path="founder/discover-investors" element={<DiscoverInvestors />} />
            <Route path="founder/discover-professionals" element={<DiscoverProfessionals />} />
            <Route path="founder/connections" element={<Connections />} />
            <Route path="founder/milestones" element={<MilestoneTracking />} />
            <Route path="founder/reputation" element={<Reputation />} />
            <Route path="founder/readiness" element={<ReadinessScore />} />
          </Route>

          <Route element={<RoleGuard role="investor" />}>
            <Route path="investor/dashboard" element={<InvestorDashboard />} />
            <Route path="investor/discover" element={<DiscoverBusinesses context="investor" />} />
            <Route path="investor/discover-legacy" element={<DiscoverBusinesses context="investor" />} />
            <Route path="investor/preferences" element={<InvestorPreferences />} />
            <Route path="investor/saved" element={<SavedOpportunities />} />
            <Route path="investor/connections" element={<Connections />} />
            <Route path="investor/portfolio" element={<Portfolio />} />
            <Route path="investor/reputation" element={<Reputation />} />
          </Route>

          <Route element={<RoleGuard role="professional" />}>
            <Route path="professional/dashboard" element={<ProfessionalDashboard />} />
            <Route path="professional/discover" element={<DiscoverBusinesses context="professional" />} />
            <Route path="professional/applications" element={<ProfessionalApplications />} />
            <Route path="professional/profile-edit" element={<ProfessionalProfileEditor />} />
            <Route path="professional/connections" element={<Connections />} />
            <Route path="professional/reputation" element={<Reputation />} />
          </Route>
          </Route>

          {/* Admin — restricted to admin role only */}
          <Route element={<AdminGuard />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/deal-room" element={<DealRoom />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/verification" element={<AdminVerification />} />
            <Route path="admin/businesses" element={<AdminBusinesses />} />
            <Route path="admin/applications" element={<AdminApplications />} />
            <Route path="admin/teams" element={<AdminTeams />} />
            <Route path="admin/deals" element={<AdminDeals />} />
            <Route path="admin/investment" element={<AdminInvestmentOversight />} />
            <Route path="admin/financial-reports" element={<AdminFinancialReports />} />
            <Route path="admin/reputation" element={<AdminReputation />} />
            <Route path="admin/reports" element={<AdminReports />} />
            <Route path="admin/audit" element={<AdminAuditLogs />} />
            <Route path="admin/analytics" element={<AdminAnalytics />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="admin/notifications" element={<AdminNotifications />} />
            <Route path="admin/team-management" element={<AdminTeamManagement />} />
            <Route path="admin/matching" element={<AdminMatchingEngine />} />
            <Route path="admin/advanced-analytics" element={<AdminAdvancedAnalytics />} />
            <Route path="admin/notification-templates" element={<AdminNotificationTemplates />} />
          </Route>

          <Route index element={<Navigate to="/app/founder/dashboard" replace />} />
        </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
