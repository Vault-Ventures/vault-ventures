import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  IconCheck, IconX, IconEye, IconAlertTriangle, IconShield, IconUsers,
  IconSearch, IconFilter, IconBarChart, IconFileText, IconBuilding,
  IconClipboard, IconFolder, IconStar, IconSettings, IconTrendingUp,
} from '../../components/layout/Icons';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRIORITY_ITEMS = [
  { label: 'Pending Verification', value: 12, color: '#F59E0B', route: '/app/admin/verification' },
  { label: 'Open Reports', value: 4, color: '#F04438', route: '/app/admin/reports' },
  { label: 'Flagged Businesses', value: 3, color: '#F59E0B', route: '/app/admin/businesses' },
  { label: 'Pending Disputes', value: 2, color: '#F04438', route: '/app/admin/reports' },
];

const METRICS = [
  { label: 'Total Users', value: '1,847', sub: '+231 this week', color: '#EAF0FA' },
  { label: 'Active Businesses', value: '312', sub: '19 pending review', color: '#EAF0FA' },
  { label: 'Active Deal Rooms', value: '48', sub: '12 in negotiation', color: '#EAF0FA' },
  { label: 'Pending Verifications', value: '14', sub: '3 Tier 2 · 11 Tier 1', color: '#F59E0B' },
  { label: 'New Users (7d)', value: '231', sub: '+18% vs prior week', color: '#C67A4E' },
];

const VERIF_QUEUE = [
  { name: 'Sarah Chen', email: 'sarah@meridian.vc', tier: 2 as const, role: 'Investor', waiting: '6d', status: 'Pending', risk: 'Low' },
  { name: 'Marcus Williams', email: 'marcus@nova.co', tier: 1 as const, role: 'Founder', waiting: '4d', status: 'Pending', risk: 'None' },
  { name: 'Priya Nair', email: 'priya@nair.me', tier: 2 as const, role: 'Professional', waiting: '3d', status: 'More Info Needed', risk: 'Medium' },
  { name: 'James Okafor', email: 'james@apex.vc', tier: 1 as const, role: 'Investor', waiting: '2d', status: 'Pending', risk: 'None' },
  { name: 'Elena Vasquez', email: 'elena@green.io', tier: 1 as const, role: 'Founder', waiting: '1d', status: 'Under Review', risk: 'Low' },
];

const USERS = [
  { name: 'Sarah Chen', email: 'sarah@meridian.vc', roles: ['Investor'], tier: 2, status: 'Active', joined: 'Mar 1, 2024', lastActive: '2h ago', flags: 0 },
  { name: 'Marcus Williams', email: 'marcus@nova.co', roles: ['Founder'], tier: 0, status: 'Pending', joined: 'Apr 10, 2024', lastActive: '1d ago', flags: 0 },
  { name: 'Jordan Lee', email: 'jordan@lee.dev', roles: ['Professional', 'Founder'], tier: 1, status: 'Active', joined: 'Feb 12, 2024', lastActive: '5h ago', flags: 0 },
  { name: 'Elena Vasquez', email: 'elena@green.io', roles: ['Founder'], tier: 0, status: 'Email verified', joined: 'Apr 18, 2024', lastActive: '3d ago', flags: 1 },
  { name: 'James Okafor', email: 'james@apex.vc', roles: ['Investor'], tier: 1, status: 'Active', joined: 'Mar 22, 2024', lastActive: '12h ago', flags: 0 },
  { name: 'Alex Morgan', email: 'alex@novatech.ai', roles: ['Founder', 'Investor', 'Professional'], tier: 1, status: 'Active', joined: 'Jan 5, 2024', lastActive: '1h ago', flags: 0 },
];

const BUSINESSES = [
  { name: 'NovaTech AI', founder: 'Alex Morgan', industry: 'FinTech · AI/ML', stage: 'Seed', tier: 2, readiness: 78, status: 'Published', created: 'Jan 10', flags: 0 },
  { name: 'GreenPath Logistics', founder: 'Sam Okafor', industry: 'CleanTech', stage: 'Pre-seed', tier: 1, readiness: 54, status: 'Draft', created: 'Feb 3', flags: 0 },
  { name: 'Structra Build', founder: 'Jamie Torres', industry: 'PropTech', stage: 'Series A', tier: 2, readiness: 85, status: 'Published', created: 'Dec 14', flags: 0 },
  { name: 'ShadyToken Co.', founder: 'Unknown', industry: 'Crypto', stage: 'Seed', tier: 0, readiness: 12, status: 'Suspended', created: 'Apr 1', flags: 3 },
  { name: 'Orbit Analytics', founder: 'Riley Kim', industry: 'Data · SaaS', stage: 'Pre-seed', tier: 1, readiness: 52, status: 'Under Review', created: 'Mar 20', flags: 1 },
];

const APPLICATIONS = [
  { applicant: 'Jordan Lee', business: 'NovaTech AI', role: 'AI/ML Advisor', submitted: 'Apr 15', status: 'Under Review', lastActivity: '2h ago' },
  { applicant: 'Alex Morgan', business: 'Orbit Analytics', role: 'Data Engineering Consultant', submitted: 'Apr 12', status: 'Submitted', lastActivity: '1d ago' },
  { applicant: 'Priya Nair', business: 'Structra Build', role: 'Product Strategist', submitted: 'Apr 8', status: 'Accepted', lastActivity: '5d ago' },
  { applicant: 'Marcus Williams', business: 'GreenPath Logistics', role: 'Technical Advisor', submitted: 'Mar 30', status: 'Withdrawn', lastActivity: '1w ago' },
];

const DEALS = [
  { business: 'NovaTech AI', participants: 'Alex Morgan · Meridian Capital', stage: 'NDA Signed', ndaStatus: 'Signed', lastActivity: '2h ago', risk: 'Low', status: 'Active', flags: 0 },
  { business: 'Structra Build', participants: 'Jamie Torres · Lighthouse VC', stage: 'Negotiation', ndaStatus: 'Signed', lastActivity: '1d ago', risk: 'Low', status: 'Active', flags: 0 },
  { business: 'ShadyToken Co.', participants: 'Unknown · Anon Investor', stage: 'Interest', ndaStatus: 'Not signed', lastActivity: '3d ago', risk: 'High', status: 'Flagged', flags: 2 },
  { business: 'Orbit Analytics', participants: 'Riley Kim · Apex Ventures', stage: 'Deal Room', ndaStatus: 'Pending', lastActivity: '4d ago', risk: 'None', status: 'Active', flags: 0 },
];

const REPORTS = [
  { reporter: 'Anonymous', subject: 'Meridian Capital', category: 'Misleading profile', sev: 'High', status: 'Under Review', assigned: 'admin@vault.io', created: 'Apr 18' },
  { reporter: 'NovaTech AI', subject: 'Lighthouse VC', category: 'Terms dispute', sev: 'Medium', status: 'New', assigned: '—', created: 'Apr 17' },
  { reporter: 'Jordan Lee', subject: 'Structra Build', category: 'NDA breach', sev: 'High', status: 'New', assigned: '—', created: 'Apr 16' },
  { reporter: 'System', subject: 'Orbit Analytics', category: 'Flagged content', sev: 'Low', status: 'New', assigned: '—', created: 'Apr 15' },
  { reporter: 'James Okafor', subject: 'ShadyToken Co.', category: 'Suspicious activity', sev: 'Critical', status: 'Escalated', assigned: 'admin@vault.io', created: 'Apr 14' },
];

const REPUTATION = [
  { name: 'Alex Morgan', reputation: 94, tier: 1, flags: 0, reports: 0, status: 'Excellent', updated: '1d ago' },
  { name: 'Sarah Chen', reputation: 88, tier: 2, flags: 0, reports: 0, status: 'Good', updated: '3d ago' },
  { name: 'Meridian Capital', reputation: 76, tier: 2, flags: 1, reports: 1, status: 'Under Review', updated: '2d ago' },
  { name: 'ShadyToken Co.', reputation: 18, tier: 0, flags: 3, reports: 2, status: 'Suspended', updated: '1h ago' },
  { name: 'Jordan Lee', reputation: 82, tier: 1, flags: 0, reports: 0, status: 'Good', updated: '5d ago' },
];

const AUDIT = [
  { timestamp: 'Apr 20 · 15:42', actor: 'admin@vault.io', action: 'Approved Tier 2 verification', entity: 'Sarah Chen', entityId: 'USR-0042', prev: 'Pending', next: 'Approved', ip: '10.0.0.1' },
  { timestamp: 'Apr 20 · 14:30', actor: 'admin@vault.io', action: 'Suspended business listing', entity: 'ShadyToken Co.', entityId: 'BIZ-0099', prev: 'Published', next: 'Suspended', ip: '10.0.0.1' },
  { timestamp: 'Apr 20 · 12:11', actor: 'system', action: 'Auto-flagged for review', entity: 'CryptoFast', entityId: 'BIZ-0103', prev: 'Draft', next: 'Flagged', ip: '—' },
  { timestamp: 'Apr 20 · 09:55', actor: 'admin@vault.io', action: 'Resolved dispute', entity: 'Deal Room #448', entityId: 'DRL-0448', prev: 'Open', next: 'Resolved', ip: '10.0.0.1' },
  { timestamp: 'Apr 19 · 17:20', actor: 'admin@vault.io', action: 'Rejected Tier 1 verification', entity: 'Unknown User', entityId: 'USR-0088', prev: 'Pending', next: 'Rejected', ip: '10.0.0.1' },
  { timestamp: 'Apr 19 · 11:04', actor: 'system', action: 'Automatic rate-limit triggered', entity: 'API Gateway', entityId: '—', prev: 'Normal', next: 'Rate-limited', ip: '—' },
];

const DASHBOARD_ACTIVITY = [
  { text: 'Tier 2 verification approved — Sarah Chen', time: '15 min ago', dot: '#22C55E' },
  { text: 'ShadyToken Co. suspended — admin@vault.io', time: '1h ago', dot: '#F04438' },
  { text: 'New report filed: NDA breach (High)', time: '3h ago', dot: '#F59E0B' },
  { text: 'Auto-flagged: CryptoFast unusual activity', time: '5h ago', dot: '#F59E0B' },
  { text: 'Deal Room #448 dispute resolved', time: '8h ago', dot: '#C67A4E' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sevVariant = (s: string) =>
  s === 'Critical' ? 'danger' : s === 'High' ? 'danger' : s === 'Medium' ? 'warning' : 'neutral';

const riskColor = (r: string) =>
  r === 'High' || r === 'Critical' ? '#F04438' : r === 'Medium' ? '#F59E0B' : r === 'Low' ? '#C67A4E' : '#5E6D8F';

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[color:var(--vv-text-tertiary)] uppercase tracking-widest whitespace-nowrap">{children}</th>;
}

function FilterBar({ placeholder, children }: { placeholder: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <div className="relative flex-1 min-w-[160px] max-w-xs">
        <IconSearch s={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--vv-text-tertiary)]" />
        <input placeholder={placeholder}
          className="w-full h-8 pl-8 pr-3 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[12px] text-[color:var(--vv-text)] placeholder-[color:var(--vv-text-tertiary)] focus:outline-none focus:border-[color:var(--vv-border-strong)] transition-colors" />
      </div>
      {children}
      <Button variant="ghost" size="sm" icon={<IconFilter s={12} />} className="ml-auto">Filter</Button>
      <Button variant="ghost" size="sm">Export CSV</Button>
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          {children}
        </table>
      </div>
    </div>
  );
}

function SectionHead({ title, badge }: { title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-[15px] font-semibold text-[color:var(--vv-text)] font-display">{title}</h2>
      {badge}
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

type DrawerItem = { title: string; subtitle: string; rows: { label: string; value: React.ReactNode }[]; actions: string[] };

function DetailDrawer({ item, onClose, onAction }: { item: DrawerItem; onClose: () => void; onAction: (a: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative w-full max-w-sm bg-[#0D1626] border-l border-[color:var(--vv-border)] h-full overflow-y-auto flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vv-border)]">
          <div>
            <p id="admin-detail-title" className="text-[14px] font-semibold text-[color:var(--vv-text)] font-display">{item.title}</p>
            <p className="text-[11px] text-[color:var(--vv-text-tertiary)] mt-0.5">{item.subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close admin detail" className="text-[color:var(--vv-text-tertiary)] hover:text-[color:var(--vv-text)] transition-colors">
            <IconX s={16} />
          </button>
        </div>
        <div className="flex-1 px-5 py-4 space-y-3">
          {item.rows.map((r, i) => (
            <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-[#1c2a3e] last:border-0">
              <span className="text-[11.5px] text-[color:var(--vv-text-tertiary)] shrink-0">{r.label}</span>
              <span className="text-[11.5px] text-[color:var(--vv-text-secondary)] text-right">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-[color:var(--vv-border)] space-y-2">
          <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-2">Actions</p>
          {item.actions.map(a => (
            <Button key={a} size="sm" className="w-full"
              variant={a === 'Suspend' || a === 'Reject' || a === 'Escalate' ? 'destructive' : a === 'Approve' || a === 'Resolve' ? 'primary' : 'secondary'}
              onClick={() => onAction(a)}
            >{a}</Button>
          ))}
        </div>
      </aside>
    </div>
  );
}

// ─── Confirmation modal ───────────────────────────────────────────────────────

function ConfirmModal({ action, entity, reversible, onConfirm, onCancel }:
  { action: string; entity: string; reversible: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative vv-glass-elevated border border-[color:var(--vv-border-strong)] rounded-[12px] w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#F04438]/10 border border-[#F04438]/30 flex items-center justify-center">
            <IconAlertTriangle s={14} className="text-[#F04438]" />
          </div>
          <p id="admin-confirm-title" className="text-[14px] font-semibold text-[color:var(--vv-text)]">Confirm: {action}</p>
        </div>
        <p className="text-[12.5px] text-[color:var(--vv-text-secondary)] mb-1 leading-snug">
          This will <strong className="text-[color:var(--vv-text)]">{action.toLowerCase()}</strong> <strong className="text-[color:var(--vv-text)]">{entity}</strong>.
        </p>
        <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mb-5">
          {reversible ? 'This action can be reversed later.' : 'This action cannot be undone.'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" className="flex-1" onClick={onConfirm}>{action}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics sparkline (SVG) ───────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120; const h = 36;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const ANALYTICS_DATA = [
  { label: 'User Growth', values: [120, 145, 160, 175, 190, 210, 231], unit: 'new/week', color: '#C67A4E' },
  { label: 'New Businesses', values: [8, 12, 10, 15, 14, 19, 21], unit: 'new/week', color: '#3B82F6' },
  { label: 'Verifications', values: [5, 9, 7, 12, 10, 14, 12], unit: 'approved/week', color: '#C9A24B' },
  { label: 'Deal Rooms', values: [20, 25, 28, 32, 38, 42, 48], unit: 'active', color: '#22C55E' },
  { label: 'Applications', values: [30, 40, 35, 50, 45, 55, 60], unit: 'submitted/week', color: '#8B5CF6' },
  { label: 'Reports Filed', values: [2, 1, 4, 2, 3, 5, 4], unit: 'filed/week', color: '#F04438' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState<DrawerItem | null>(null);
  const [confirm, setConfirm] = useState<{ action: string; entity: string; reversible: boolean } | null>(null);

  const seg = pathname.split('/').pop() ?? 'dashboard';

  const openDrawer = (item: DrawerItem) => setDrawer(item);
  const closeDrawer = () => setDrawer(null);

  const requestConfirm = (action: string, entity: string, reversible = false) => {
    closeDrawer();
    setConfirm({ action, entity, reversible });
  };

  const resolveConfirm = () => setConfirm(null);

  const verifDrawer = (row: typeof VERIF_QUEUE[0]): DrawerItem => ({
    title: row.name,
    subtitle: `${row.role} · Tier ${row.tier} verification request`,
    rows: [
      { label: 'Email', value: row.email },
      { label: 'Role', value: row.role },
      { label: 'Tier requested', value: `Tier ${row.tier}` },
      { label: 'Waiting', value: row.waiting },
      { label: 'Status', value: <Badge variant={row.status === 'Pending' ? 'warning' : 'info'} dot>{row.status}</Badge> },
      { label: 'Risk assessment', value: row.risk },
    ],
    actions: ['Approve', 'Request More Info', 'Reject'],
  });

  const userDrawer = (u: typeof USERS[0]): DrawerItem => ({
    title: u.name,
    subtitle: u.email,
    rows: [
      { label: 'Roles', value: u.roles.join(', ') },
      { label: 'Verification', value: u.tier === 0 ? 'Unverified' : `Tier ${u.tier}` },
      { label: 'Status', value: <Badge variant={u.status === 'Active' ? 'success' : 'warning'} dot>{u.status}</Badge> },
      { label: 'Joined', value: u.joined },
      { label: 'Last active', value: u.lastActive },
      { label: 'Flags', value: u.flags === 0 ? 'None' : `${u.flags} flag(s)` },
    ],
    actions: ['View Profile', u.status === 'Active' ? 'Suspend' : 'Restore'],
  });

  const bizDrawer = (b: typeof BUSINESSES[0]): DrawerItem => ({
    title: b.name,
    subtitle: `${b.industry} · ${b.stage}`,
    rows: [
      { label: 'Founder', value: b.founder },
      { label: 'Industry', value: b.industry },
      { label: 'Stage', value: b.stage },
      { label: 'Verification', value: b.tier === 0 ? 'Unverified' : `Tier ${b.tier}` },
      { label: 'Readiness', value: b.readiness },
      { label: 'Status', value: b.status },
      { label: 'Created', value: b.created },
      { label: 'Flags', value: b.flags === 0 ? 'None' : `${b.flags} flag(s)` },
    ],
    actions: ['View Business', 'Flag', b.status === 'Suspended' ? 'Restore' : 'Suspend'],
  });

  const reportDrawer = (r: typeof REPORTS[0]): DrawerItem => ({
    title: r.category,
    subtitle: `Reported: ${r.subject}`,
    rows: [
      { label: 'Reporter', value: r.reporter },
      { label: 'Subject', value: r.subject },
      { label: 'Category', value: r.category },
      { label: 'Severity', value: <Badge variant={sevVariant(r.sev)}>{r.sev}</Badge> },
      { label: 'Status', value: r.status },
      { label: 'Assigned to', value: r.assigned },
      { label: 'Created', value: r.created },
    ],
    actions: ['Assign to Self', 'Resolve', 'Escalate'],
  });

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="font-display text-[17px] font-semibold text-[color:var(--vv-text)] leading-none">Admin Console</h1>
            <span className="text-[9px] font-bold text-[#F59E0B] border border-[#F59E0B]/40 rounded px-1.5 py-0.5 uppercase tracking-wider">Privileged</span>
          </div>
          <p className="text-[11.5px] text-[color:var(--vv-text-tertiary)] mt-1">
            Platform operations and activity
            {(seg === 'dashboard' || seg === 'admin') && (
              <> · <span className="text-[#F04438]">4 items require attention</span></>
            )}
          </p>
        </div>
        <Button variant="ghost" size="sm">Export report</Button>
      </div>

      {/* ── Dashboard overview ─────────────────────────────────────────── */}
      {(seg === 'dashboard' || seg === 'admin') && (
        <div className="space-y-5">
          {/* Priority strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PRIORITY_ITEMS.map(p => (
              <div key={p.label} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-3 cursor-pointer hover:border-[color:var(--vv-border-strong)] transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold leading-none">{p.label}</p>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: p.color }} />
                </div>
                <p className="font-mono text-[22px] font-semibold tabular-nums leading-none" style={{ color: p.color }}>{p.value}</p>
              </div>
            ))}
          </div>

          {/* Platform metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {METRICS.map(m => (
              <div key={m.label} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-3">
                <p className="text-[10px] text-[color:var(--vv-text-tertiary)] uppercase tracking-widest font-semibold mb-1.5 leading-none">{m.label}</p>
                <p className="font-mono text-[18px] font-semibold tabular-nums leading-none mb-1" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[11px] text-[color:var(--vv-text-tertiary)] leading-tight">{m.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Verification queue preview */}
            <div className="xl:col-span-2 bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vv-border)]">
                <div className="flex items-center gap-2">
                  <IconShield s={13} className="text-[#C9A24B]" />
                  <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Verification Queue</p>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-400">{VERIF_QUEUE.length}</span>
                </div>
                <Button variant="ghost" size="sm">View all</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead><tr className="border-b border-[#1c2a3e]">
                    {['Applicant', 'Role', 'Tier', 'Waiting', 'Status', ''].map(h => <Th key={h}>{h}</Th>)}
                  </tr></thead>
                  <tbody>
                    {VERIF_QUEUE.slice(0, 4).map((row, i) => (
                      <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer" onClick={() => openDrawer(verifDrawer(row))}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[10px] font-bold text-[color:var(--vv-text)] shrink-0">{row.name[0]}</div>
                            <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-[color:var(--vv-text-tertiary)]">{row.role}</td>
                        <td className="px-4 py-2.5"><VerificationBadge tier={row.tier} /></td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] text-[color:var(--vv-text)] tabular-nums">{row.waiting}</td>
                        <td className="px-4 py-2.5"><Badge variant={row.status === 'Pending' ? 'warning' : 'info'} dot>{row.status}</Badge></td>
                        <td className="px-4 py-2.5 text-right">
                          <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={e => { e.stopPropagation(); openDrawer(verifDrawer(row)); }}>Review</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent audit activity */}
            <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[color:var(--vv-border)]">
                <IconFileText s={13} className="text-[color:var(--vv-text-tertiary)]" />
                <p className="text-[13px] font-semibold text-[color:var(--vv-text)]">Audit Activity</p>
              </div>
              <div>
                {DASHBOARD_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-[#1c2a3e] last:border-0">
                    <div className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] text-[color:var(--vv-text-secondary)] leading-snug">{a.text}</p>
                      <p className="text-[10px] text-[color:var(--vv-text-tertiary)] mt-0.5 font-mono tabular-nums">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Verification Queue ─────────────────────────────────────────── */}
      {seg === 'verification' && (
        <div>
          <SectionHead title="Verification Queue" badge={<span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-400">{VERIF_QUEUE.length} pending</span>} />
          <FilterBar placeholder="Search applicants…">
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All tiers</option><option>Tier 1</option><option>Tier 2</option>
            </select>
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All roles</option><option>Founder</option><option>Investor</option><option>Professional</option>
            </select>
          </FilterBar>
          <TableWrap>
            <thead><tr className="border-b border-[color:var(--vv-border)]">
              {['Applicant', 'Role', 'Tier', 'Submitted', 'Status', 'Risk / Flags', 'Actions'].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {VERIF_QUEUE.map((row, i) => (
                <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer" onClick={() => openDrawer(verifDrawer(row))}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[10px] font-bold text-[color:var(--vv-text)] shrink-0">{row.name[0]}</div>
                      <div>
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{row.name}</p>
                        <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)]">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)]">{row.role}</td>
                  <td className="px-4 py-3"><VerificationBadge tier={row.tier} /></td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-[color:var(--vv-text)] tabular-nums">{row.waiting} ago</td>
                  <td className="px-4 py-3"><Badge variant={row.status === 'Pending' ? 'warning' : row.status === 'Under Review' ? 'info' : 'neutral'} dot>{row.status}</Badge></td>
                  <td className="px-4 py-3">
                    <span className="text-[11.5px] font-medium" style={{ color: riskColor(row.risk) }}>{row.risk}</span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" icon={<IconEye s={12} />} onClick={() => openDrawer(verifDrawer(row))}>Review</Button>
                      <Button size="sm" icon={<IconCheck s={12} />} onClick={() => requestConfirm('Approve', row.name, true)}>Approve</Button>
                      <Button variant="destructive" size="sm" icon={<IconX s={12} />} onClick={() => requestConfirm('Reject', row.name, false)}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── Users ──────────────────────────────────────────────────────── */}
      {seg === 'users' && (
        <div>
          <SectionHead title="User Management" />
          <FilterBar placeholder="Search users by name or email…">
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All roles</option><option>Founder</option><option>Investor</option><option>Professional</option>
            </select>
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All statuses</option><option>Active</option><option>Pending</option><option>Suspended</option>
            </select>
          </FilterBar>
          <TableWrap>
            <thead><tr className="border-b border-[color:var(--vv-border)]">
              {['User', 'Roles', 'Email', 'Verification', 'Status', 'Joined', 'Last Active', 'Actions'].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {USERS.map((u, i) => (
                <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer" onClick={() => openDrawer(userDrawer(u))}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[10px] font-bold text-[color:var(--vv-text)] shrink-0">{u.name[0]}</div>
                      <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">{u.roles.map(r => <Badge key={r} variant="neutral">{r}</Badge>)}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.tier === 0 ? <Badge variant="neutral">Unverified</Badge> : <VerificationBadge tier={u.tier as 1 | 2} />}
                  </td>
                  <td className="px-4 py-3"><Badge variant={u.status === 'Active' ? 'success' : 'warning'} dot>{u.status}</Badge></td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{u.joined}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{u.lastActive}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm">View</Button>
                      <Button variant="destructive" size="sm" onClick={() => requestConfirm(u.status === 'Active' ? 'Suspend' : 'Restore', u.name, true)}>
                        {u.status === 'Active' ? 'Suspend' : 'Restore'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── Businesses ─────────────────────────────────────────────────── */}
      {seg === 'businesses' && (
        <div>
          <SectionHead title="Business Management" />
          <FilterBar placeholder="Search businesses…">
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All statuses</option><option>Published</option><option>Draft</option><option>Suspended</option><option>Under Review</option>
            </select>
          </FilterBar>
          <TableWrap>
            <thead><tr className="border-b border-[color:var(--vv-border)]">
              {['Business', 'Founder', 'Industry', 'Stage', 'Verification', 'Readiness', 'Status', 'Created', 'Actions'].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {BUSINESSES.map((b, i) => (
                <tr key={i} className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer ${b.flags > 0 ? 'border-l-2 border-l-[#F04438]' : ''}`} onClick={() => openDrawer(bizDrawer(b))}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[10px] font-bold text-[#C67A4E] shrink-0">{b.name[0]}</div>
                      <div>
                        <p className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{b.name}</p>
                        {b.flags > 0 && <p className="text-[10px] text-[#F04438]">{b.flags} flag(s)</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{b.founder}</td>
                  <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{b.industry}</td>
                  <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">{b.stage}</td>
                  <td className="px-4 py-3">{b.tier === 0 ? <Badge variant="neutral">None</Badge> : <VerificationBadge tier={b.tier as 1|2} />}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[72px]">
                      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${b.readiness}%`, backgroundColor: b.readiness >= 75 ? '#C67A4E' : b.readiness >= 50 ? '#F59E0B' : '#F04438' }} />
                      </div>
                      <span className="font-mono text-[11px] text-[color:var(--vv-text-tertiary)] tabular-nums">{b.readiness}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={b.status === 'Published' ? 'success' : b.status === 'Suspended' ? 'danger' : b.status === 'Under Review' ? 'warning' : 'neutral'} dot>{b.status}</Badge></td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{b.created}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm">View</Button>
                      {b.status !== 'Suspended'
                        ? <Button variant="destructive" size="sm" onClick={() => requestConfirm('Suspend', b.name, true)}>Suspend</Button>
                        : <Button variant="secondary" size="sm" onClick={() => requestConfirm('Restore', b.name, true)}>Restore</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── Applications ───────────────────────────────────────────────── */}
      {seg === 'applications' && (
        <div>
          <SectionHead title="Application Management" />
          <FilterBar placeholder="Search applications…">
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All statuses</option><option>Submitted</option><option>Under Review</option><option>Accepted</option><option>Rejected</option><option>Withdrawn</option>
            </select>
          </FilterBar>
          <TableWrap>
            <thead><tr className="border-b border-[color:var(--vv-border)]">
              {['Applicant', 'Business', 'Role / Opportunity', 'Submitted', 'Status', 'Last Activity', 'Actions'].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {APPLICATIONS.map((a, i) => (
                <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors">
                  <td className="px-4 py-3 text-[12.5px] font-medium text-[color:var(--vv-text)]">{a.applicant}</td>
                  <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)]">{a.business}</td>
                  <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">{a.role}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{a.submitted}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.status === 'Accepted' ? 'success' : a.status === 'Under Review' ? 'info' : a.status === 'Withdrawn' ? 'neutral' : 'warning'} dot>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{a.lastActivity}</td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm">View</Button></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── Deals ──────────────────────────────────────────────────────── */}
      {seg === 'deals' && (
        <div>
          <SectionHead title="Deal Management" />
          <FilterBar placeholder="Search deals…">
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All statuses</option><option>Active</option><option>Flagged</option><option>Completed</option>
            </select>
          </FilterBar>
          <TableWrap>
            <thead><tr className="border-b border-[color:var(--vv-border)]">
              {['Business', 'Participants', 'Stage', 'NDA Status', 'Last Activity', 'Risk', 'Status', 'Actions'].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {DEALS.map((d, i) => (
                <tr key={i} className={`border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors ${d.flags > 0 ? 'border-l-2 border-l-[#F04438]' : ''}`}>
                  <td className="px-4 py-3 text-[12.5px] font-medium text-[color:var(--vv-text)] whitespace-nowrap">{d.business}</td>
                  <td className="px-4 py-3 text-[11.5px] text-[color:var(--vv-text-tertiary)]">{d.participants}</td>
                  <td className="px-4 py-3"><Badge variant="info">{d.stage}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={d.ndaStatus === 'Signed' ? 'success' : d.ndaStatus === 'Pending' ? 'warning' : 'neutral'}>{d.ndaStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{d.lastActivity}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11.5px] font-medium" style={{ color: riskColor(d.risk) }}>{d.risk || 'None'}</span>
                  </td>
                  <td className="px-4 py-3"><Badge variant={d.status === 'Active' ? 'success' : d.status === 'Flagged' ? 'danger' : 'neutral'} dot>{d.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm">Inspect</Button>
                      {d.flags > 0 && <Button variant="destructive" size="sm" onClick={() => requestConfirm('Suspend', d.business, true)}>Suspend</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── Reports / Disputes ─────────────────────────────────────────── */}
      {seg === 'reports' && (
        <div>
          <SectionHead title="Reports & Disputes" badge={<span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-400/20 text-red-400">{REPORTS.filter(r => r.status === 'New').length} new</span>} />
          <FilterBar placeholder="Search reports…">
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All severities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All statuses</option><option>New</option><option>Under Review</option><option>Escalated</option><option>Resolved</option>
            </select>
          </FilterBar>
          <TableWrap>
            <thead><tr className="border-b border-[color:var(--vv-border)]">
              {['Reporter', 'Subject', 'Category', 'Severity', 'Created', 'Status', 'Assigned', 'Actions'].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {REPORTS.map((r, i) => (
                <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors cursor-pointer" onClick={() => openDrawer(reportDrawer(r))}>
                  <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-tertiary)]">{r.reporter}</td>
                  <td className="px-4 py-3 text-[12.5px] font-medium text-[color:var(--vv-text)]">{r.subject}</td>
                  <td className="px-4 py-3 text-[12px] text-[color:var(--vv-text-secondary)]">{r.category}</td>
                  <td className="px-4 py-3"><Badge variant={sevVariant(r.sev) as any}>{r.sev}</Badge></td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{r.created}</td>
                  <td className="px-4 py-3"><Badge variant={r.status === 'New' ? 'warning' : r.status === 'Escalated' ? 'danger' : 'info'} dot>{r.status}</Badge></td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{r.assigned}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm">Investigate</Button>
                      <Button variant="secondary" size="sm" onClick={() => requestConfirm('Resolve', r.subject, false)}>Resolve</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── Reputation ─────────────────────────────────────────────────── */}
      {seg === 'reputation' && (
        <div>
          <SectionHead title="Reputation Management" />
          <FilterBar placeholder="Search users…" />
          <TableWrap>
            <thead><tr className="border-b border-[color:var(--vv-border)]">
              {['User', 'Reputation', 'Verification', 'Flags', 'Reports', 'Status', 'Last Updated', 'Actions'].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {REPUTATION.map((r, i) => (
                <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border-strong)] flex items-center justify-center text-[10px] font-bold text-[color:var(--vv-text)] shrink-0">{r.name[0]}</div>
                      <span className="text-[12.5px] font-medium text-[color:var(--vv-text)]">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 h-[3px] bg-[color:color-mix(in_srgb,var(--vv-raised)_90%,transparent)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.reputation}%`, backgroundColor: r.reputation >= 80 ? '#C67A4E' : r.reputation >= 50 ? '#F59E0B' : '#F04438' }} />
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-[color:var(--vv-text)]">{r.reputation}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.tier === 0 ? <Badge variant="neutral">None</Badge> : <VerificationBadge tier={r.tier as 1|2} />}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[12px] tabular-nums ${r.flags > 0 ? 'text-[#F04438]' : 'text-[color:var(--vv-text-tertiary)]'}`}>{r.flags}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[12px] tabular-nums ${r.reports > 0 ? 'text-[#F59E0B]' : 'text-[color:var(--vv-text-tertiary)]'}`}>{r.reports}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === 'Excellent' || r.status === 'Good' ? 'success' : r.status === 'Under Review' ? 'warning' : 'danger'} dot>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{r.updated}</td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm">Review history</Button></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}

      {/* ── Audit Logs ─────────────────────────────────────────────────── */}
      {seg === 'audit' && (
        <div>
          <SectionHead title="Audit Logs" />
          <FilterBar placeholder="Search logs…">
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All actors</option><option>admin@vault.io</option><option>system</option>
            </select>
            <select className="h-8 px-2 bg-[color:color-mix(in_srgb,var(--vv-raised)_80%,transparent)] border border-[color:var(--vv-border)] rounded-md text-[11.5px] text-[color:var(--vv-text-secondary)] focus:outline-none">
              <option>All actions</option><option>Approved</option><option>Rejected</option><option>Suspended</option><option>Resolved</option>
            </select>
          </FilterBar>
          <div className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead><tr className="border-b border-[color:var(--vv-border)]">
                  {['Timestamp', 'Actor', 'Action', 'Entity', 'Entity ID', 'Prev State', 'New State', 'IP'].map(h => <Th key={h}>{h}</Th>)}
                </tr></thead>
                <tbody>
                  {AUDIT.map((log, i) => (
                    <tr key={i} className="border-b border-[#1c2a3e] last:border-0 hover:bg-[color:var(--vv-raised)]/50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[10.5px] text-[color:var(--vv-text-tertiary)] whitespace-nowrap">{log.timestamp}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#C67A4E] whitespace-nowrap">{log.actor}</td>
                      <td className="px-4 py-2.5 text-[12px] text-[color:var(--vv-text-secondary)]">{log.action}</td>
                      <td className="px-4 py-2.5 text-[12.5px] font-medium text-[color:var(--vv-text)]">{log.entity}</td>
                      <td className="px-4 py-2.5 font-mono text-[10.5px] text-[color:var(--vv-text-tertiary)]">{log.entityId}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[color:var(--vv-text-tertiary)]">{log.prev}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#C67A4E]">{log.next}</td>
                      <td className="px-4 py-2.5 font-mono text-[10.5px] text-[color:var(--vv-text-tertiary)]">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics ──────────────────────────────────────────────────── */}
      {seg === 'analytics' && (
        <div>
          <SectionHead title="Platform Analytics" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {ANALYTICS_DATA.map(d => (
              <div key={d.label} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-semibold text-[color:var(--vv-text)]">{d.label}</p>
                  <span className="text-[10px] text-[color:var(--vv-text-tertiary)] font-mono">{d.unit}</span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-[22px] font-semibold tabular-nums leading-none" style={{ color: d.color }}>
                      {d.values[d.values.length - 1]}
                    </p>
                    <p className="text-[10.5px] text-[color:var(--vv-text-tertiary)] mt-1">Latest · 7-week trend</p>
                  </div>
                  <Sparkline data={d.values} color={d.color} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Settings ───────────────────────────────────────────────────── */}
      {seg === 'settings' && (
        <div>
          <SectionHead title="Platform Settings" />
          <div className="max-w-xl space-y-4">
            {[
              { group: 'Verification', items: ['Require Tier 1 for Deal Rooms', 'Auto-flag accounts older than 180d without verification', 'Allow Tier 2 self-declaration'] },
              { group: 'Moderation', items: ['Auto-suspend on 3 confirmed flags', 'Enable AI-assisted content scanning', 'Require NDA for Stage 3 documents'] },
              { group: 'Notifications', items: ['Email admin on High severity reports', 'Daily platform digest to admin@vault.io', 'Slack webhook for Critical events'] },
            ].map(section => (
              <div key={section.group} className="bg-[#121A2B] border border-[color:var(--vv-border)] rounded-[10px] overflow-hidden">
                <div className="px-4 py-3 border-b border-[color:var(--vv-border)]">
                  <p className="text-[12.5px] font-semibold text-[color:var(--vv-text)]">{section.group}</p>
                </div>
                <div>
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[#1c2a3e] last:border-0">
                      <p className="text-[12px] text-[color:var(--vv-text-secondary)] pr-6">{item}</p>
                      <button className="w-9 h-5 bg-[#C67A4E]/20 border border-[#C67A4E]/40 rounded-full relative shrink-0">
                        <span className="absolute right-1 top-0.5 w-4 h-4 bg-[#C67A4E] rounded-full" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Teams / placeholder ────────────────────────────────────────── */}
      {seg === 'teams' && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <IconUsers s={32} className="text-[#35446A] mb-4" />
          <p className="text-[14px] font-semibold text-[color:var(--vv-text)] mb-1">Team Management</p>
          <p className="text-[12px] text-[color:var(--vv-text-tertiary)] max-w-xs">Admin team roles, permissions, and access control will appear here.</p>
        </div>
      )}

      {/* ── Drawer overlay ─────────────────────────────────────────────── */}
      {drawer && (
        <DetailDrawer
          item={drawer}
          onClose={closeDrawer}
          onAction={action => requestConfirm(action, drawer.title, action !== 'Reject' && action !== 'Escalate')}
        />
      )}

      {/* ── Confirm modal ──────────────────────────────────────────────── */}
      {confirm && (
        <ConfirmModal
          action={confirm.action}
          entity={confirm.entity}
          reversible={confirm.reversible}
          onConfirm={resolveConfirm}
          onCancel={resolveConfirm}
        />
      )}
    </div>
  );
}