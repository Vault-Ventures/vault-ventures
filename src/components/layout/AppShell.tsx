import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import {
  IconDashboard, IconBriefcase, IconCompass, IconUsers, IconLink,
  IconFolder, IconFlag, IconStar, IconTrendingUp, IconPieChart,
  IconShield, IconBell, IconSearch, IconSettings, IconLogOut,
  IconChevronLeft, IconChevronRight, IconChevronDown,
  IconBuilding, IconClipboard, IconBarChart, IconAlertTriangle,
  IconFileText, IconX, IconCheck,
} from './Icons';
import { ManageRolesModal } from './ManageRolesModal';
import { VerificationBadge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

type NormalRole = 'founder' | 'investor' | 'professional';
type Role = NormalRole | 'admin';

interface NavItem {
  label: string;
  to: string;
  icon: React.FC<{ className?: string; s?: number }>;
  shortLabel?: string;
}

const navItems: Record<Role, NavItem[]> = {
  founder: [
    { label: 'Dashboard', to: '/app/founder/dashboard', icon: IconDashboard, shortLabel: 'Home' },
    { label: 'My Businesses', to: '/app/founder/businesses', icon: IconBriefcase, shortLabel: 'Businesses' },
    { label: 'Discover Investors', to: '/app/founder/discover-investors', icon: IconCompass, shortLabel: 'Discover' },
    { label: 'Discover Professionals', to: '/app/founder/discover-professionals', icon: IconUsers },
    { label: 'Connections', to: '/app/founder/connections', icon: IconLink },
    { label: 'Deal Rooms', to: '/app/deal-room', icon: IconFolder, shortLabel: 'Deals' },
    { label: 'Milestones', to: '/app/founder/milestones', icon: IconFlag },
    { label: 'Reputation', to: '/app/founder/reputation', icon: IconStar },
  ],
  investor: [
    { label: 'Dashboard', to: '/app/investor/dashboard', icon: IconDashboard, shortLabel: 'Home' },
    { label: 'Discover Businesses', to: '/app/investor/discover', icon: IconCompass, shortLabel: 'Discover' },
    { label: 'Saved Opportunities', to: '/app/investor/saved', icon: IconFolder, shortLabel: 'Saved' },
    { label: 'Connections', to: '/app/investor/connections', icon: IconLink },
    { label: 'Deal Rooms', to: '/app/deal-room', icon: IconFolder, shortLabel: 'Deals' },
    { label: 'Portfolio', to: '/app/investor/portfolio', icon: IconPieChart, shortLabel: 'Portfolio' },
    { label: 'Reputation', to: '/app/investor/reputation', icon: IconStar },
  ],
  professional: [
    { label: 'Dashboard', to: '/app/professional/dashboard', icon: IconDashboard, shortLabel: 'Home' },
    { label: 'Discover Opportunities', to: '/app/professional/discover', icon: IconCompass, shortLabel: 'Discover' },
    { label: 'Applications', to: '/app/professional/applications', icon: IconClipboard, shortLabel: 'Apply' },
    { label: 'Connections', to: '/app/professional/connections', icon: IconLink },
    { label: 'Deal Rooms', to: '/app/deal-room', icon: IconFolder, shortLabel: 'Deals' },
    { label: 'Reputation', to: '/app/professional/reputation', icon: IconStar },
  ],
  admin: [
    { label: 'Dashboard', to: '/app/admin/dashboard', icon: IconDashboard },
    { label: 'Users', to: '/app/admin/users', icon: IconUsers },
    { label: 'Verification', to: '/app/admin/verification', icon: IconShield },
    { label: 'Businesses', to: '/app/admin/businesses', icon: IconBuilding },
    { label: 'Applications', to: '/app/admin/applications', icon: IconClipboard },
    { label: 'Teams', to: '/app/admin/teams', icon: IconUsers },
    { label: 'Deals', to: '/app/admin/deals', icon: IconFolder },
    { label: 'Investment', to: '/app/admin/investment', icon: IconPieChart },
    { label: 'Financial Reports', to: '/app/admin/financial-reports', icon: IconTrendingUp },
    { label: 'Reputation', to: '/app/admin/reputation', icon: IconStar },
    { label: 'Reports', to: '/app/admin/reports', icon: IconAlertTriangle },
    { label: 'Audit Logs', to: '/app/admin/audit', icon: IconFileText },
    { label: 'Analytics', to: '/app/admin/analytics', icon: IconBarChart },
    { label: 'Adv. Analytics', to: '/app/admin/advanced-analytics', icon: IconTrendingUp },
    { label: 'Team / Roles', to: '/app/admin/team-management', icon: IconShield },
    { label: 'Matching Engine', to: '/app/admin/matching', icon: IconSearch },
    { label: 'Notif. Templates', to: '/app/admin/notification-templates', icon: IconBell },
    { label: 'Notifications', to: '/app/admin/notifications', icon: IconBell },
    { label: 'Settings', to: '/app/admin/settings', icon: IconSettings },
  ],
};

const roleLabels: Record<Role, string> = {
  founder: 'Founder',
  investor: 'Investor',
  professional: 'Professional',
  admin: 'Admin',
};

const roleColors: Record<NormalRole, string> = {
  founder: '#C67A4E',
  investor: '#C9A24B',
  professional: '#22C55E',
};

export const RoleContext = createContext<{ role: Role; setRole: (r: Role) => void }>({
  role: 'founder',
  setRole: () => { },
});
export function useRole() { return useContext(RoleContext); }



// ─── Account menu dropdown ────────────────────────────────────────────────────

function AccountMenu({ role, onManageRoles, onClose, onLogout }: {
  role: Role;
  onManageRoles: () => void;
  onClose: () => void;
  onLogout: () => Promise<void> | void;
}) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = role === 'admin';
  const { user } = useAuth();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const displayName = user?.name || (isAdmin ? 'Admin Console' : 'User');
  const displayEmail = user?.email || (isAdmin ? 'admin@vault.io' : '');
  const verificationTier = user?.verification_tier ?? 0;

  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-1 w-56 vv-glass-elevated rounded-[10px] z-50 overflow-hidden py-1">
      <div className="px-3 py-2.5 border-b border-[#1c2a3e]">
        <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">{displayName}</p>
        {displayEmail && <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] font-mono">{displayEmail}</p>}
      </div>
      <button onClick={() => { navigate(isAdmin ? '/app/admin/dashboard' : '/app/profile'); onClose(); }}
        className="w-full text-left px-3 py-2 text-[12px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] transition-colors">
        {isAdmin ? 'Admin Dashboard' : 'View Profile'}
      </button>
      {!isAdmin && (
        <>
          <div className="px-3 py-1.5">
            <VerificationBadge tier={(verificationTier === 1 || verificationTier === 2 ? (verificationTier as 1 | 2) : 0)} />
          </div>
          <div className="px-3 pb-1.5">
            <button onClick={() => { navigate('/app/premium'); onClose(); }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md w-full transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(90deg, rgba(122,69,39,0.12), rgba(198,122,78,0.12))', border: '1px solid rgba(198,122,78,0.22)' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#C9A24B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              <span className="text-[11px] font-semibold" style={{ background: 'linear-gradient(90deg, #E8A878, #C67A4E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Upgrade to Premium</span>
            </button>
          </div>
        </>
      )}
      <div className="border-t border-[#1c2a3e]">
        {[
          { label: 'Settings', action: () => { navigate(isAdmin ? '/app/admin/settings' : '/app/settings'); onClose(); } },
          ...(!isAdmin ? [{ label: 'Manage Roles', action: () => { onManageRoles(); onClose(); } }] : []),
        ].map(item => (
          <button key={item.label} onClick={item.action}
            className="w-full text-left px-3 py-2 text-[12px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] transition-colors">
            {item.label}
          </button>
        ))}
      </div>
      <div className="border-t border-[#1c2a3e]">
        <button onClick={async () => { onClose(); await onLogout(); navigate(isAdmin ? '/admin-login' : '/login'); }}
          className="w-full text-left px-3 py-2 text-[12px] text-[color:var(--vv-text-tertiary)] hover:text-[#F04438] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] transition-colors flex items-center gap-2">
          <IconLogOut s={12} /> Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Notifications panel ──────────────────────────────────────────────────────

// ─── Mobile bottom nav ────────────────────────────────────────────────────────

function MobileNav({ role, items }: { role: Role; items: NavItem[] }) {
  const primary = items.slice(0, 4);
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0D1626] border-t border-[#1c2a3e] flex safe-area-inset-bottom">
      {primary.map(item => (
        <NavLink key={item.to} to={item.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${isActive ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text-tertiary)]'
            }`
          }>
          {({ isActive }) => (
            <>
              <item.icon s={17} className={isActive ? 'text-[#C67A4E]' : ''} />
              <span>{item.shortLabel ?? item.label}</span>
            </>
          )}
        </NavLink>
      ))}
      <NavLink to="/app/profile"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${isActive ? 'text-[#C67A4E]' : 'text-[color:var(--vv-text-tertiary)]'}`
        }>
        {({ isActive }) => (
          <>
            <div className={`w-[17px] h-[17px] rounded-full border flex items-center justify-center text-[8px] font-bold ${isActive ? 'border-[#C67A4E] text-[#C67A4E]' : 'border-[color:var(--vv-border-strong)] text-[color:var(--vv-text-tertiary)]'
              }`}>A</div>
            <span>Profile</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export function AppShell() {
  const { session, setActiveRole, updateNormalRoles, logout, user } = useAuth();
  const role: Role = session.isAdmin ? 'admin' : session.activeRole;
  const setRole = (nextRole: Role) => {
    if (nextRole !== 'admin') setActiveRole(nextRole);
  };
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showManageRoles, setShowManageRoles] = useState(false);

  const isAdmin = role === 'admin';
  const isAuthenticated = session.status === 'authenticated';

  // Real notifications — only poll for non-admin authenticated users
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(
    isAuthenticated && !isAdmin
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowRolePicker(false);
      setShowNotifs(false);
      setShowAccountMenu(false);
      setShowManageRoles(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
  const [globalSearch, setGlobalSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const userRoles = session.roles;
  const items = navItems[role];

  const discoverRoutes: Record<string, string> = {
    founder: '/app/founder/discover-investors',
    investor: '/app/investor/discover',
    professional: '/app/professional/discover',
  };

  function handleGlobalSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && globalSearch.trim()) {
      const route = discoverRoutes[role] ?? '/app/investor/discover';
      navigate(`${route}?q=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  }

  function handleRoleChange(r: NormalRole) {
    setRole(r);
    setShowRolePicker(false);
    navigate(navItems[r][0].to);
  }

  const workspaceLabel = isAdmin ? 'Admin Console' : `${roleLabels[role]} Workspace`;
  const activeColor = isAdmin ? '#5E6D8F' : roleColors[role as NormalRole];

  // Close popovers on nav
  useEffect(() => {
    setShowRolePicker(false);
    setShowNotifs(false);
    setShowAccountMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const match = location.pathname.match(/^\/app\/(founder|investor|professional)(?:\/|$)/);
    const routeRole = match?.[1] as NormalRole | undefined;
    if (routeRole && session.roles.includes(routeRole) && session.activeRole !== routeRole) {
      setActiveRole(routeRole);
    }
  }, [location.pathname, session.activeRole, session.roles, setActiveRole]);

  // ── Sidebar content ──────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Wordmark */}
      <div className={`flex items-center gap-3 px-4 h-14 border-b border-[#1c2a3e] flex-shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
        <Link to="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 flex-shrink-0 vv-logo-glow">
            <path d="M14 3L5 8v5c0 4.97 3.67 9.62 9 10.93C19.33 22.62 23 17.97 23 13V8L14 3z"
              fill="#C67A4E" fillOpacity="0.22" stroke="#C67A4E" strokeWidth="1.25" strokeLinejoin="round" />
            <path d="M11 14l2 2 4-4" stroke="#E8A878" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!collapsed && (
            <span className="text-[13px] font-semibold font-display text-[color:var(--vv-text)] leading-none tracking-tight">Vault Ventures</span>
          )}
        </Link>
      </div>

      {/* Role switcher (normal roles only) */}
      {!isAdmin && !collapsed && (
        <div className="px-3 py-2.5 border-b border-[#1c2a3e] relative flex-shrink-0">
          <button onClick={() => setShowRolePicker(v => !v)} aria-expanded={showRolePicker} aria-haspopup="menu"
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-[color:var(--vv-raised)] transition-colors group">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: activeColor + '18', color: activeColor, border: `1px solid ${activeColor}40` }}>
                {roleLabels[role][0]}
              </span>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-semibold text-[color:var(--vv-text)] group-hover:text-white transition-colors">{roleLabels[role]}</p>
                <p className="text-[9.5px] text-[color:var(--vv-text-tertiary)]">Switch workspace</p>
              </div>
            </div>
            <IconChevronDown className={`text-[color:var(--vv-text-tertiary)] transition-transform flex-shrink-0 ${showRolePicker ? 'rotate-180' : ''}`} s={11} />
          </button>
          {showRolePicker && (
            <div className="absolute top-full left-3 right-3 mt-0.5 vv-glass-elevated rounded-[10px] py-1.5 z-50">
              <p className="text-[9.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold px-3 pb-1.5">Your workspaces</p>
              {userRoles.map(r => (
                <button key={r} onClick={() => handleRoleChange(r)}
                  className={`w-full text-left px-3 py-2 text-[12px] transition-colors flex items-center gap-2.5 ${role === r ? 'text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)]'
                    }`}>
                  <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{ background: roleColors[r] + '18', color: roleColors[r] }}>
                    {roleLabels[r][0]}
                  </span>
                  {roleLabels[r]}
                  {role === r && <IconCheck s={10} className="ml-auto text-[#C67A4E]" />}
                </button>
              ))}
              <div className="border-t border-[#1c2a3e] mt-1.5 pt-1.5 px-3">
                <button onClick={() => { setShowManageRoles(true); setShowRolePicker(false); }}
                  className="text-[11px] text-[color:var(--vv-text-tertiary)] hover:text-[#C67A4E] transition-colors">
                  Manage roles →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin badge */}
      {isAdmin && !collapsed && (
        <div className="px-4 py-2.5 border-b border-[#1c2a3e] flex-shrink-0">
          <div className="flex items-center gap-2">
            <IconShield s={11} className="text-[color:var(--vv-text-tertiary)]" />
            <span className="text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-wider">Admin Console</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-px">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[12.5px] font-medium transition-all duration-150 group relative ${isActive
                ? 'text-[color:var(--vv-text)] vv-dichroic-active'
                : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:bg-[rgba(11,20,44,0.65)] hover:border hover:border-[rgba(198,122,78,0.07)]'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                    style={{ background: activeColor }} />
                )}
                <span className={`flex-shrink-0 transition-colors ${isActive ? '' : ''}`}
                  style={isActive ? { color: activeColor } : undefined}>
                  <item.icon s={14} />
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — user/profile identity area */}
      <div className="border-t border-[#1c2a3e] flex-shrink-0">
        {!collapsed && (
          <div className="px-3 py-3">
            <Link to="/app/profile"
              className="flex items-center gap-2.5 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] rounded-md px-1.5 py-1.5 transition-colors -mx-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                style={{ background: activeColor + '18', color: activeColor, border: `1px solid ${activeColor}40` }}>
                {user?.name?.charAt(0)?.toUpperCase() || (isAdmin ? 'A' : 'U')}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[color:var(--vv-text)] truncate leading-none">{user?.name || (isAdmin ? 'Admin Console' : 'User')}</p>
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5">{workspaceLabel}</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <div className="flex h-full bg-[#0B1220]">

        {/* Desktop sidebar */}
        <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-[#0D1626] border-r border-[#1c2a3e] transition-[width] duration-200 relative ${collapsed ? 'w-14' : 'w-56'}`}>
          <SidebarContent />
          <button onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute -right-2.5 top-[72px] w-5 h-5 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] hover:border-[#5E6D8F] transition-all z-10">
            {collapsed ? <IconChevronRight s={10} /> : <IconChevronLeft s={10} />}
          </button>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-56 bg-[#0D1626] border-r border-[#1c2a3e] z-50 flex flex-col">
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Topbar */}
          <header className="flex-shrink-0 h-14 flex items-center gap-3 px-4 bg-[#0D1626] border-b border-[#1c2a3e] z-[60] lg:z-20">

            {/* Mobile menu toggle */}
            <button className="lg:hidden w-8 h-8 flex items-center justify-center text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>

            {/* Mobile: workspace label + role switcher */}
            {!isAdmin && (
              <div className="lg:hidden relative">
                <button onClick={() => setShowRolePicker(v => !v)} aria-expanded={showRolePicker} aria-haspopup="menu" aria-label="Switch workspace"
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] text-[12px] text-[color:var(--vv-text-secondary)] hover:text-[color:var(--vv-text)] transition-colors">
                  <span style={{ color: activeColor }}>{roleLabels[role]}</span>
                  <IconChevronDown s={10} className={`transition-transform ${showRolePicker ? 'rotate-180' : ''}`} />
                </button>
                {showRolePicker && (
                  <div className="absolute left-0 top-full mt-1 vv-glass-elevated rounded-[10px] py-1.5 z-50 min-w-[160px]">
                    <p className="text-[9.5px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold px-3 pb-1.5">Workspaces</p>
                    {userRoles.map(r => (
                      <button key={r} onClick={() => handleRoleChange(r)}
                        className={`w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 transition-colors ${role === r ? 'text-[color:var(--vv-text)]' : 'text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)]'
                          }`}>
                        {roleLabels[r]}
                        {role === r && <span className="ml-auto" style={{ color: activeColor }}><IconCheck s={10} /></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            <div className="flex-1 max-w-xs hidden sm:block">
              <div className="relative">
                <IconSearch s={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                  placeholder="Search…"
                  className="w-full h-8 pl-8 pr-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12.5px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[#C67A4E] transition-colors" />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[color:var(--vv-text-tertiary)] bg-[#0B1220] border border-[color:var(--vv-border)] px-1 py-0.5 rounded hidden md:block">⌘K</kbd>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1 ml-auto">

              {/* Workspace pill — desktop */}
              {!collapsed && (
                <div className="hidden lg:flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-[color:var(--vv-border)] bg-[color:color-mix(in_srgb,var(--vv-raised)_50%,transparent)] mr-1">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: activeColor }} />
                  <span className="text-[11px] font-medium text-[color:var(--vv-text-tertiary)]">{workspaceLabel}</span>
                </div>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (isAdmin) {
                      navigate('/app/admin/notifications');
                    } else {
                      setShowNotifs(v => !v);
                      setShowAccountMenu(false);
                    }
                  }}
                  className="relative w-8 h-8 flex items-center justify-center rounded-md text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text-secondary)] hover:bg-[color:var(--vv-raised)] transition-colors"
                  title={isAdmin ? 'Admin Notifications' : 'Notifications'}
                  aria-label={isAdmin ? 'Open admin notifications' : 'Open notifications'}
                  aria-expanded={isAdmin ? undefined : showNotifs}>
                  <IconBell s={16} />
                  {isAdmin ? (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#F04438]" />
                  ) : unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-[#C67A4E] flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-full mt-1 w-[304px] vv-glass-elevated rounded-[10px] z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
                      <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">Notifications</p>
                      <button onClick={() => setShowNotifs(false)} aria-label="Close notifications" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]"><IconX s={13} /></button>
                    </div>
                    <div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-[12px] text-[color:var(--vv-text-tertiary)]">No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => { if (n.is_unread) markRead(n.id); }}
                            className="flex gap-3 px-4 py-3 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_60%,transparent)] transition-colors border-b border-[color:var(--vv-border)] last:border-0 cursor-pointer"
                          >
                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.is_unread ? 'bg-[#C67A4E]' : 'bg-[#35446A]'}`} />
                            <div className="min-w-0">
                              <p className={`text-[12px] leading-snug truncate ${n.is_unread ? 'text-[color:var(--vv-text-secondary)]' : 'text-[color:var(--vv-text-tertiary)]'}`}>
                                {n.body}
                              </p>
                              <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-1 font-mono">
                                {new Date(n.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="px-4 py-2.5">
                        <button
                          className="text-[11.5px] text-[#C67A4E] hover:underline"
                          onClick={() => { markAllRead(); setShowNotifs(false); }}
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Role switcher (desktop, header) — hidden when sidebar is expanded (visible in sidebar instead) */}
              {!isAdmin && !collapsed && (
                <div className="relative hidden">
                  {/* Intentionally hidden — role switcher lives in sidebar on desktop */}
                </div>
              )}

              {/* Avatar + account menu */}
              <div className="relative ml-1">
                <button onClick={() => { setShowAccountMenu(v => !v); setShowNotifs(false); }} aria-label="Open profile menu" aria-expanded={showAccountMenu} aria-haspopup="menu"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[color:var(--vv-raised)] transition-colors">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: activeColor + '18', color: activeColor, border: `1px solid ${activeColor}40` }}>
                    {user?.name?.charAt(0)?.toUpperCase() || (isAdmin ? 'A' : 'U')}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-[11.5px] font-semibold text-[color:var(--vv-text)] leading-none">{user?.name || (isAdmin ? 'Admin' : 'User')}</p>
                    <p className="text-[9.5px] text-[color:var(--vv-text-tertiary)] mt-0.5">{roleLabels[role]}</p>
                  </div>
                  <IconChevronDown s={10} className="text-[color:var(--vv-text-tertiary)] hidden sm:block" />
                </button>
                {showAccountMenu && (
                  <AccountMenu
                    role={role}
                    onManageRoles={() => setShowManageRoles(true)}
                    onClose={() => setShowAccountMenu(false)}
                    onLogout={logout}
                  />
                )}
              </div>

            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
            <Outlet context={{ role }} />
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav role={role} items={items} />

        {/* Overlays */}
        {(showRolePicker || showNotifs || showAccountMenu) && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => {
            setShowRolePicker(false);
            setShowNotifs(false);
            setShowAccountMenu(false);
          }} />
        )}

        {/* Manage Roles modal */}
        {showManageRoles && (
          <ManageRolesModal
            onClose={() => setShowManageRoles(false)}
          />
        )}
      </div>
    </RoleContext.Provider>
  );
}