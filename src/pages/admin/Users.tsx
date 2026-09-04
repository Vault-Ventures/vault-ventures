import React, { useEffect, useRef, useState } from 'react';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconSearch, IconX, IconCheck, IconFilter, IconArrowRight, IconShield,
  IconAlertTriangle, IconChevronDown,
} from '../../components/layout/Icons';

// ─── Data ─────────────────────────────────────────────────────────────────────

type UserRole = 'Founder' | 'Investor' | 'Professional';
type UserStatus = 'Active' | 'Pending' | 'Suspended' | 'Restricted';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  headline: string;
  location: string;
  roles: UserRole[];
  tier: 0 | 1 | 2;
  status: UserStatus;
  joined: string;
  lastActive: string;
  flags: number;
  reputation: number;
  reports: number;
}

const ALL_USERS: AdminUser[] = [
  {
    id: 'USR-0001', name: 'Alex Morgan', email: 'alex@novatech.ai',
    headline: 'Founder & Product Builder at NovaTech AI', location: 'San Francisco, CA',
    roles: ['Founder', 'Investor', 'Professional'], tier: 1, status: 'Active',
    joined: 'Jan 5, 2024', lastActive: '1h ago', flags: 0, reputation: 94, reports: 0,
  },
  {
    id: 'USR-0042', name: 'Sarah Chen', email: 'sarah@meridian.vc',
    headline: 'Partner at Meridian Capital · FinTech Seed Investor', location: 'New York, NY',
    roles: ['Investor'], tier: 2, status: 'Active',
    joined: 'Mar 1, 2024', lastActive: '2h ago', flags: 0, reputation: 88, reports: 0,
  },
  {
    id: 'USR-0103', name: 'Marcus Williams', email: 'marcus@nova.co',
    headline: 'Founder at Nova · Building logistics AI', location: 'Austin, TX',
    roles: ['Founder'], tier: 0, status: 'Pending',
    joined: 'Apr 10, 2024', lastActive: '1d ago', flags: 0, reputation: 62, reports: 0,
  },
  {
    id: 'USR-0077', name: 'Jordan Lee', email: 'jordan@lee.dev',
    headline: 'CTO · FinTech · Seed specialist · 12y experience', location: 'Remote',
    roles: ['Professional', 'Founder'], tier: 1, status: 'Active',
    joined: 'Feb 12, 2024', lastActive: '5h ago', flags: 0, reputation: 82, reports: 0,
  },
  {
    id: 'USR-0118', name: 'Elena Vasquez', email: 'elena@green.io',
    headline: 'Co-Founder at GreenPath Logistics', location: 'Chicago, IL',
    roles: ['Founder'], tier: 0, status: 'Pending',
    joined: 'Apr 18, 2024', lastActive: '3d ago', flags: 1, reputation: 55, reports: 0,
  },
  {
    id: 'USR-0055', name: 'James Okafor', email: 'james@apex.vc',
    headline: 'Principal at Apex Ventures · AI/ML portfolio', location: 'London, UK',
    roles: ['Investor'], tier: 1, status: 'Active',
    joined: 'Mar 22, 2024', lastActive: '12h ago', flags: 0, reputation: 79, reports: 0,
  },
  {
    id: 'USR-0088', name: 'Priya Nair', email: 'priya@nair.me',
    headline: 'Product Strategist · HealthTech · UX Research', location: 'Toronto, CA',
    roles: ['Professional', 'Investor'], tier: 2, status: 'Restricted',
    joined: 'Jan 28, 2024', lastActive: '4d ago', flags: 2, reputation: 70, reports: 1,
  },
  {
    id: 'USR-0200', name: 'Riley Kim', email: 'riley@orbit.io',
    headline: 'CEO at Orbit Analytics · Data SaaS', location: 'Seattle, WA',
    roles: ['Founder'], tier: 1, status: 'Active',
    joined: 'Dec 14, 2023', lastActive: '6h ago', flags: 0, reputation: 85, reports: 0,
  },
  {
    id: 'USR-0099', name: 'Jamie Torres', email: 'jamie@structra.build',
    headline: 'CEO at Structra Build · PropTech Series A', location: 'Denver, CO',
    roles: ['Founder'], tier: 2, status: 'Active',
    joined: 'Oct 3, 2023', lastActive: '30m ago', flags: 0, reputation: 91, reports: 0,
  },
  {
    id: 'USR-0199', name: 'Unknown Account', email: 'anon@shadytoken.co',
    headline: '—', location: '—',
    roles: ['Founder'], tier: 0, status: 'Suspended',
    joined: 'Apr 1, 2024', lastActive: '2w ago', flags: 3, reputation: 18, reports: 2,
  },
];

const ROLE_SPECIFIC: Record<string, { founder?: object; investor?: object; professional?: object }> = {
  'USR-0001': {
    founder: { business: 'NovaTech AI', industry: 'FinTech · AI/ML', stage: 'Seed', readiness: 78 },
    investor: { interests: 'FinTech, AI/ML', stage: 'Seed · Series A', range: '৳100K–৳1M', risk: 'Moderate' },
    professional: { skills: 'AI/ML, Product Strategy, Data Analysis', availability: 'Advisory', experience: '8 years' },
  },
  'USR-0042': {
    investor: { interests: 'FinTech, SaaS', stage: 'Seed', range: '৳250K–৳1M', risk: 'Low-Moderate' },
  },
  'USR-0077': {
    professional: { skills: 'CTO, FinTech, AI/ML', availability: 'Contract & Advisory', experience: '12 years' },
    founder: { business: 'Side Project', industry: 'Dev Tools', stage: 'Idea', readiness: 22 },
  },
  'USR-0088': {
    professional: { skills: 'Product Strategy, UX Research', availability: 'Advisory', experience: '6 years' },
    investor: { interests: 'HealthTech, B2C', stage: 'Pre-seed · Seed', range: '৳50K–৳250K', risk: 'High' },
  },
};

const USER_AUDIT: Record<string, { action: string; time: string; actor: string }[]> = {
  default: [
    { action: 'Account created', time: 'Jan 5, 2024 · 09:00', actor: 'system' },
    { action: 'Email verified', time: 'Jan 5, 2024 · 09:02', actor: 'system' },
    { action: 'Tier 1 verification submitted', time: 'Jan 8, 2024 · 14:30', actor: 'user' },
    { action: 'Tier 1 verification approved', time: 'Jan 10, 2024 · 11:15', actor: 'admin@vault.io' },
    { action: 'Profile reviewed — no issues', time: 'Mar 2, 2024 · 15:42', actor: 'admin@vault.io' },
  ],
  'USR-0088': [
    { action: 'Account created', time: 'Jan 28, 2024 · 10:00', actor: 'system' },
    { action: 'Tier 2 verification submitted', time: 'Feb 5, 2024 · 14:30', actor: 'user' },
    { action: 'Tier 2 verification approved', time: 'Feb 12, 2024 · 09:00', actor: 'admin@vault.io' },
    { action: 'Flag added — misleading credentials', time: 'Mar 18, 2024 · 11:22', actor: 'admin@vault.io' },
    { action: 'Account status changed to Restricted', time: 'Apr 2, 2024 · 16:00', actor: 'admin@vault.io' },
  ],
  'USR-0199': [
    { action: 'Account created', time: 'Apr 1, 2024 · 00:01', actor: 'system' },
    { action: 'Suspicious activity auto-detected', time: 'Apr 2, 2024 · 03:14', actor: 'system' },
    { action: 'Flag added (×3) — automated + manual', time: 'Apr 3, 2024 · 09:00', actor: 'admin@vault.io' },
    { action: 'Business listing suspended', time: 'Apr 3, 2024 · 09:30', actor: 'admin@vault.io' },
    { action: 'Account suspended', time: 'Apr 3, 2024 · 09:31', actor: 'admin@vault.io' },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0">
          <div className="w-4 h-4 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded shrink-0" />
          <div className="w-7 h-7 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-32 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
            <div className="h-2 w-48 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
          </div>
          <div className="h-5 w-14 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden md:block" />
          <div className="h-5 w-10 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden lg:block" />
          <div className="h-5 w-12 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded hidden xl:block" />
          <div className="h-7 w-16 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] rounded" />
        </div>
      ))}
    </div>
  );
}

function RolePills({ roles }: { roles: UserRole[] }) {
  const color: Record<UserRole, string> = {
    Founder: 'text-[#C67A4E] border-[#C67A4E]/30 bg-[#C67A4E]/8',
    Investor: 'text-[#C9A24B] border-[#C9A24B]/30 bg-[#C9A24B]/8',
    Professional: 'text-[#8B5CF6] border-[#8B5CF6]/30 bg-[#8B5CF6]/8',
  };
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map(r => (
        <span key={r} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${color[r]}`}>{r}</span>
      ))}
    </div>
  );
}

function FlagCell({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return <span className="font-mono text-[12px] text-[color:var(--vv-text-tertiary)] tabular-nums">0</span>;
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-[#F59E0B] hover:text-[#FBBF24] transition-colors">
      <IconAlertTriangle s={11} />
      <span className="font-mono text-[11.5px] tabular-nums font-medium">{count}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const v = status === 'Active' ? 'success' : status === 'Suspended' ? 'danger' : status === 'Restricted' ? 'warning' : 'neutral';
  return <Badge variant={v as any} dot>{status}</Badge>;
}

// ─── User detail drawer ───────────────────────────────────────────────────────

function UserDrawer({
  user,
  onClose,
  onSuspend,
  onRestore,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuspend: () => void;
  onRestore: () => void;
}) {
  const audit = USER_AUDIT[user.id] ?? USER_AUDIT.default;
  const roleData = ROLE_SPECIFIC[user.id] ?? {};
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ profile: true, roles: true, account: true, audit: false });
  const toggle = (k: string) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border-b border-[#1c2a3e] last:border-0">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[color:var(--vv-raised)]/30 transition-colors"
      >
        <p className="text-[11px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest">{title}</p>
        <IconChevronDown s={13} className={`text-[color:var(--vv-text-tertiary)] transition-transform shrink-0 ${expanded[id] ? 'rotate-180' : ''}`} />
      </button>
      {expanded[id] && <div className="px-5 pb-4 space-y-2">{children}</div>}
    </div>
  );

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-[#0f1929] last:border-0">
      <span className="text-[11px] text-[color:var(--vv-text-tertiary)] shrink-0 pt-0.5">{label}</span>
      <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right leading-snug">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="user-drawer-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="relative w-full max-w-[380px] bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full overflow-y-auto flex flex-col shadow-2xl">

        {/* Drawer header */}
        <div className="shrink-0 px-5 py-4 border-b border-[color:var(--vv-border)] bg-[#0D1626] sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[13px] font-bold text-[color:var(--vv-text)] shrink-0">
                {user.name[0]}
              </div>
              <div className="min-w-0">
                <p id="user-drawer-title" className="text-[13.5px] font-semibold text-[color:var(--vv-text)] font-display leading-tight">{user.name}</p>
                <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">{user.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors shrink-0 mt-0.5">
              <IconX s={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <StatusBadge status={user.status} />
            {user.tier > 0 ? <VerificationBadge tier={user.tier as 1 | 2} /> : <Badge variant="neutral">Unverified</Badge>}
            {user.flags > 0 && (
              <span className="flex items-center gap-1 text-[10.5px] text-[#F59E0B] font-medium">
                <IconAlertTriangle s={10} />{user.flags} flag{user.flags > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1">

          <Section id="profile" title="Profile">
            <Row label="Headline" value={<span className="italic text-[color:var(--vv-text-tertiary)]">{user.headline || '—'}</span>} />
            <Row label="Location" value={user.location} />
            <Row label="Member since" value={user.joined} />
            <Row label="Reputation" value={
              <div className="flex items-center gap-2">
                <div className="w-20 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${user.reputation}%`,
                    backgroundColor: user.reputation >= 80 ? '#C67A4E' : user.reputation >= 50 ? '#F59E0B' : '#F04438'
                  }} />
                </div>
                <span className="font-mono text-[11px] tabular-nums text-[color:var(--vv-text)]">{user.reputation}</span>
              </div>
            } />
          </Section>

          <Section id="roles" title="Roles & Workspaces">
            <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mb-2 leading-snug">One account with {user.roles.length} workspace{user.roles.length > 1 ? 's' : ''}.</p>
            <RolePills roles={user.roles} />

            {/* Role-specific blocks */}
            {user.roles.includes('Founder') && roleData.founder && (
              <div className="mt-3 p-3 bg-[#121A2B] border border-[#C67A4E]/15 rounded-md">
                <p className="text-[10px] font-semibold text-[#C67A4E]/70 uppercase tracking-wider mb-2">Founder</p>
                {Object.entries(roleData.founder as Record<string, string | number>).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-[#0f1929] last:border-0">
                    <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] capitalize">{k}</span>
                    <span className="text-[10.5px] text-[color:var(--vv-text-secondary)] font-mono">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            {user.roles.includes('Investor') && roleData.investor && (
              <div className="mt-2 p-3 bg-[#121A2B] border border-[#C9A24B]/15 rounded-md">
                <p className="text-[10px] font-semibold text-[#C9A24B]/70 uppercase tracking-wider mb-2">Investor</p>
                {Object.entries(roleData.investor as Record<string, string>).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-[#0f1929] last:border-0">
                    <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] capitalize">{k}</span>
                    <span className="text-[10.5px] text-[color:var(--vv-text-secondary)]">{v}</span>
                  </div>
                ))}
              </div>
            )}
            {user.roles.includes('Professional') && roleData.professional && (
              <div className="mt-2 p-3 bg-[#121A2B] border border-[#8B5CF6]/15 rounded-md">
                <p className="text-[10px] font-semibold text-[#8B5CF6]/70 uppercase tracking-wider mb-2">Professional</p>
                {Object.entries(roleData.professional as Record<string, string>).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-[#0f1929] last:border-0">
                    <span className="text-[10.5px] text-[color:var(--vv-text-tertiary)] capitalize">{k}</span>
                    <span className="text-[10.5px] text-[color:var(--vv-text-secondary)]">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section id="account" title="Account & Verification">
            <Row label="Email" value={<span className="font-mono text-[10.5px]">{user.email}</span>} />
            <Row label="Status" value={<StatusBadge status={user.status} />} />
            <Row label="Verification" value={user.tier === 0 ? <Badge variant="neutral">Unverified</Badge> : <VerificationBadge tier={user.tier as 1 | 2} />} />
            <Row label="Joined" value={user.joined} />
            <Row label="Last active" value={user.lastActive} />
            <Row label="Flags" value={
              user.flags > 0
                ? <span className="flex items-center gap-1 text-[#F59E0B]"><IconAlertTriangle s={11} />{user.flags} flag{user.flags > 1 ? 's' : ''}</span>
                : <span className="text-[color:var(--vv-text-tertiary)]">None</span>
            } />
            <Row label="Reports" value={
              user.reports > 0
                ? <span className="text-[#F04438] font-mono tabular-nums">{user.reports} report{user.reports > 1 ? 's' : ''}</span>
                : <span className="text-[color:var(--vv-text-tertiary)]">None</span>
            } />
          </Section>

          <Section id="audit" title="Audit History">
            <div className="space-y-2.5">
              {audit.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#35446A] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug">{a.action}</p>
                    <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono">{a.time} · {a.actor}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-2 flex items-center gap-1 text-[11px] text-[#C67A4E] hover:underline">
              View full audit history <IconArrowRight s={11} />
            </button>
          </Section>
        </div>

        {/* Actions footer */}
        <div className="shrink-0 px-5 py-4 border-t border-[color:var(--vv-border)] space-y-2 bg-[#0D1626]">
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Admin Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" className="w-full">View Profile</Button>
            <Button variant="secondary" size="sm" className="w-full" icon={<IconShield s={12} />}>Review Verification</Button>
          </div>
          {user.status !== 'Suspended'
            ? <Button variant="destructive" size="sm" className="w-full" onClick={onSuspend}>Suspend Account</Button>
            : <Button variant="secondary" size="sm" className="w-full" onClick={onRestore}>Restore Account</Button>
          }
        </div>
      </aside>
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({ action, user, onConfirm, onCancel }: {
  action: 'Suspend' | 'Restore';
  user: AdminUser;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isSuspend = action === 'Suspend';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="account-action-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSuspend ? 'bg-[#F04438]/10 border border-[#F04438]/30' : 'bg-[#22C55E]/10 border border-[#22C55E]/30'}`}>
            {isSuspend ? <IconAlertTriangle s={14} className="text-[#F04438]" /> : <IconCheck s={14} className="text-[#22C55E]" />}
          </div>
          <p id="account-action-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">{action} Account</p>
        </div>
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] leading-snug mb-2">
          This will <strong className="text-[color:var(--vv-text)]">{action.toLowerCase()}</strong> the account for{' '}
          <strong className="text-[color:var(--vv-text)]">{user.name}</strong> ({user.email}).
        </p>
        {isSuspend && (
          <ul className="text-[11.5px] text-[color:var(--vv-text-tertiary)] space-y-1 mb-4 pl-3">
            <li>· The user will lose access to all workspaces</li>
            <li>· Active deal rooms will be paused</li>
            <li>· This action can be reversed by an Admin</li>
          </ul>
        )}
        {!isSuspend && (
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-4">
            The user will regain access to their account and workspaces. All prior activity remains in audit history.
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant={isSuspend ? 'destructive' : 'primary'} size="sm" className="flex-1" onClick={onConfirm}>
            {action} Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>(ALL_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<{ action: 'Suspend' | 'Restore'; user: AdminUser } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 480);
    return () => clearTimeout(t);
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (roleFilter && !u.roles.includes(roleFilter as UserRole)) return false;
    if (tierFilter !== '') {
      const t = parseInt(tierFilter);
      if (u.tier !== t) return false;
    }
    if (statusFilter && u.status !== statusFilter) return false;
    if (flagFilter === 'flagged' && u.flags === 0) return false;
    if (flagFilter === 'clean' && u.flags > 0) return false;
    return true;
  });

  const hasFilters = !!(search || roleFilter || tierFilter !== '' || statusFilter || flagFilter);
  const clearFilters = () => { setSearch(''); setRoleFilter(''); setTierFilter(''); setStatusFilter(''); setFlagFilter(''); };

  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(u => u.id)));
  };
  const toggleRow = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const doSuspend = (user: AdminUser) => {
    setUsers(us => us.map(u => u.id === user.id ? { ...u, status: 'Suspended' } : u));
    if (drawer?.id === user.id) setDrawer(u => u ? { ...u, status: 'Suspended' } : null);
    setConfirm(null);
  };
  const doRestore = (user: AdminUser) => {
    setUsers(us => us.map(u => u.id === user.id ? { ...u, status: 'Active' } : u));
    if (drawer?.id === user.id) setDrawer(u => u ? { ...u, status: 'Active' } : null);
    setConfirm(null);
  };

  const selectClassName = "h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors cursor-pointer";

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Users</h1>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">Manage platform accounts, roles, verification and account status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)]">{selected.size} selected</span>
              <Button variant="secondary" size="sm">Export selected</Button>
              <Button variant="ghost" size="sm">Review selected</Button>
            </div>
          )}
          <Button variant="ghost" size="sm">Export CSV</Button>
        </div>
      </div>

      {/* ── Filter toolbar ──────────────────────────────────────────────── */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <IconSearch s={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full h-8 pl-8 pr-8 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)]">
                <IconX s={12} />
              </button>
            )}
          </div>

          {/* Filters — desktop inline */}
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectClassName}>
              <option value="">All roles</option>
              <option>Founder</option><option>Investor</option><option>Professional</option>
            </select>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className={selectClassName}>
              <option value="">All tiers</option>
              <option value="0">Unverified</option><option value="1">Tier 1</option><option value="2">Tier 2</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClassName}>
              <option value="">All statuses</option>
              <option>Active</option><option>Pending</option><option>Suspended</option><option>Restricted</option>
            </select>
            <select value={flagFilter} onChange={e => setFlagFilter(e.target.value)} className={selectClassName}>
              <option value="">All flags</option>
              <option value="flagged">Flagged only</option><option value="clean">No flags</option>
            </select>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(f => !f)}
            className="md:hidden flex items-center gap-1.5 h-8 px-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text-secondary)]"
          >
            <IconFilter s={12} />Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#C67A4E]" />}
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="text-[11.5px] text-[#C67A4E] hover:underline whitespace-nowrap">
              Clear filters
            </button>
          )}

          <span className="text-[11px] text-[color:var(--vv-text-tertiary)] ml-auto font-mono tabular-nums shrink-0">
            {filtered.length} of {users.length} users
          </span>
        </div>

        {/* Mobile filter drawer */}
        {filtersOpen && (
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px]">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectClassName + " w-full"}>
              <option value="">All roles</option>
              <option>Founder</option><option>Investor</option><option>Professional</option>
            </select>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className={selectClassName + " w-full"}>
              <option value="">All tiers</option>
              <option value="0">Unverified</option><option value="1">Tier 1</option><option value="2">Tier 2</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClassName + " w-full"}>
              <option value="">All statuses</option>
              <option>Active</option><option>Pending</option><option>Suspended</option><option>Restricted</option>
            </select>
            <select value={flagFilter} onChange={e => setFlagFilter(e.target.value)} className={selectClassName + " w-full"}>
              <option value="">All flags</option>
              <option value="flagged">Flagged only</option><option value="clean">No flags</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
        {loading ? <SkeletonRows /> : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-semibold text-[color:var(--vv-text)] mb-1">No users found</p>
            <p className="text-[12px] text-[color:var(--vv-text-tertiary)] mb-4">Try adjusting your search or filters.</p>
            <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-[color:var(--vv-border)]">
                    <th className="px-4 py-2.5 w-10">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="accent-[#C67A4E] w-3.5 h-3.5 cursor-pointer" />
                    </th>
                    {['User', 'Roles', 'Email', 'Verification', 'Status', 'Joined', 'Last Active', 'Flags', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr
                      key={u.id}
                      className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors cursor-pointer ${
                        u.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''
                      } ${u.status === 'Suspended' ? 'opacity-60' : ''}`}
                      onClick={() => setDrawer(u)}
                    >
                      <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleRow(u.id)}
                          className="accent-[#C67A4E] w-3.5 h-3.5 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0">
                            {u.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{u.name}</p>
                            <p className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RolePills roles={u.roles} /></td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.tier === 0 ? <Badge variant="neutral">Unverified</Badge> : <VerificationBadge tier={u.tier as 1 | 2} />}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{u.joined}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{u.lastActive}</td>
                      <td className="px-4 py-3">
                        <FlagCell count={u.flags} onClick={() => setDrawer(u)} />
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setDrawer(u)}>View</Button>
                          {u.status !== 'Suspended'
                            ? <Button variant="destructive" size="sm" onClick={() => setConfirm({ action: 'Suspend', user: u })}>Suspend</Button>
                            : <Button variant="secondary" size="sm" onClick={() => setConfirm({ action: 'Restore', user: u })}>Restore</Button>
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile structured cards */}
            <div className="md:hidden">
              {filtered.map(u => (
                <div
                  key={u.id}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-[#1c2a3e] last:border-0 cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--vv-raised)_40%,transparent)] transition-colors ${u.flags > 0 ? 'border-l-2 border-l-[#F59E0B]' : ''}`}
                  onClick={() => setDrawer(u)}
                >
                  <input type="checkbox" checked={selected.has(u.id)}
                    onChange={e => { e.stopPropagation(); toggleRow(u.id); }}
                    onClick={e => e.stopPropagation()}
                    className="accent-[#C67A4E] w-3.5 h-3.5 cursor-pointer mt-1.5 shrink-0" />
                  <div className="w-8 h-8 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[11px] font-bold text-[color:var(--vv-text)] shrink-0 mt-0.5">
                    {u.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-[12.5px] font-medium text-[color:var(--vv-text)] truncate">{u.name}</p>
                      <StatusBadge status={u.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <RolePills roles={u.roles} />
                      {u.tier > 0 ? <VerificationBadge tier={u.tier as 1 | 2} /> : <Badge variant="neutral">Unverified</Badge>}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{u.lastActive}</p>
                      {u.flags > 0 && (
                        <span className="flex items-center gap-1 text-[10.5px] text-[#F59E0B]">
                          <IconAlertTriangle s={10} />{u.flags}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── User detail drawer ──────────────────────────────────────────── */}
      {drawer && (
        <UserDrawer
          user={drawer}
          onClose={() => setDrawer(null)}
          onSuspend={() => setConfirm({ action: 'Suspend', user: drawer })}
          onRestore={() => setConfirm({ action: 'Restore', user: drawer })}
        />
      )}

      {/* ── Confirmation modal ───────────────────────────────────────────── */}
      {confirm && (
        <ConfirmModal
          action={confirm.action}
          user={confirm.user}
          onConfirm={() => confirm.action === 'Suspend' ? doSuspend(confirm.user) : doRestore(confirm.user)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}